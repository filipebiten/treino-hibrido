// ══════════════════════ RELATÓRIOS — funções puras de cálculo (BI pessoal) ══════════════════════
// Entram eventos + período, saem números. Sem React, sem side-effect.

import { toISO, diffDias, MARCO_ZERO } from "../data/plano.js";
import { agruparPorDia, listar } from "./eventos.js";

const DIAS_PERIODO = { "7d": 7, "30d": 30, "90d": 90, tudo: null };

export function periodoParaDatas(periodo, hojeISO) {
  const dias = DIAS_PERIODO[periodo];
  if (dias == null) return { desde: MARCO_ZERO, ate: hojeISO };
  const hoje = new Date(hojeISO + "T00:00:00");
  const desde = toISO(new Date(hoje.getTime() - (dias - 1) * 86400000));
  return { desde: desde < MARCO_ZERO ? MARCO_ZERO : desde, ate: hojeISO };
}

function listaDatas(desde, ate) {
  const out = [];
  const fim = new Date(ate + "T00:00:00");
  for (let d = new Date(desde + "T00:00:00"); d <= fim; d.setDate(d.getDate() + 1)) out.push(toISO(d));
  return out;
}

// ponytail: "planejado" assume 1 dose de manhã + 1 de noite por dia — o regime
// atual (macrofase 1, único vivido até aqui). Uma macrofase futura com dose
// "unica"/"tarde" muda o que "planejado" significa — revisar quando chegar lá.
export function aderenciaRehab(eventos, desde, ate) {
  const dias = agruparPorDia(eventos);
  const datas = listaDatas(desde, ate);
  let manhaFeitas = 0, noiteFeitas = 0;
  const porSemana = [];
  for (let i = 0; i < datas.length; i += 7) {
    const semana = datas.slice(i, i + 7);
    let mF = 0, nF = 0;
    semana.forEach(iso => {
      const d = dias[iso];
      if (d && d.periodos.includes("manha")) { mF++; manhaFeitas++; }
      if (d && d.periodos.includes("noite")) { nF++; noiteFeitas++; }
    });
    porSemana.push({ inicio: semana[0], manhaPct: Math.round((mF / semana.length) * 100), noitePct: Math.round((nF / semana.length) * 100) });
  }
  const total = datas.length;
  return {
    manha: { feitas: manhaFeitas, planejadas: total, pct: total ? Math.round((manhaFeitas / total) * 100) : 0 },
    noite: { feitas: noiteFeitas, planejadas: total, pct: total ? Math.round((noiteFeitas / total) * 100) : 0 },
    porSemana,
  };
}

function media(arr) { return arr.length ? Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 10) / 10 : null; }

// 2. Dor matinal ao longo do tempo — dado cru + média móvel de 7 dias (só sobre dias com registro).
export function dorAoLongoDoTempo(eventos, desde, ate) {
  const dias = agruparPorDia(eventos);
  const datas = listaDatas(desde, ate);
  const pontos = [];
  datas.forEach(iso => { const d = dias[iso]; if (d && d.dor != null) pontos.push({ iso, nivel: d.dor }); });
  const mediaMovel = pontos.map((p, i) => {
    const limite = toISO(new Date(new Date(p.iso + "T00:00:00").getTime() - 6 * 86400000));
    const janela = pontos.slice(0, i + 1).filter(q => q.iso >= limite);
    return { iso: p.iso, media: media(janela.map(q => q.nivel)) };
  });
  const marcadoresRecuo = datas.filter(iso => dias[iso] && dias[iso].recuo);
  return { pontos, mediaMovel, marcadoresRecuo };
}

// 3. Dor × aderência — dor matinal média nas semanas com rehab ≥80% vs <80%. Mínimo 4 semanas de cada lado.
const MIN_SEMANAS_CORRELACAO = 4;
export function dorPorAderencia(eventos, desde, ate) {
  const dias = agruparPorDia(eventos);
  const datas = listaDatas(desde, ate);
  const altaAderencia = [], baixaAderencia = [];
  for (let i = 0; i < datas.length; i += 7) {
    const semana = datas.slice(i, i + 7);
    let doses = 0; const dores = [];
    semana.forEach(iso => {
      const d = dias[iso];
      if (!d) return;
      if (d.periodos.includes("manha")) doses++;
      if (d.periodos.includes("noite")) doses++;
      if (d.dor != null) dores.push(d.dor);
    });
    if (!dores.length) continue;
    const aderenciaPct = Math.round((doses / (semana.length * 2)) * 100);
    (aderenciaPct >= 80 ? altaAderencia : baixaAderencia).push(media(dores));
  }
  const suficiente = altaAderencia.length >= MIN_SEMANAS_CORRELACAO && baixaAderencia.length >= MIN_SEMANAS_CORRELACAO;
  return {
    suficiente,
    faltamAlta: Math.max(0, MIN_SEMANAS_CORRELACAO - altaAderencia.length),
    faltamBaixa: Math.max(0, MIN_SEMANAS_CORRELACAO - baixaAderencia.length),
    alta: { n: altaAderencia.length, dorMedia: media(altaAderencia) },
    baixa: { n: baixaAderencia.length, dorMedia: media(baixaAderencia) },
  };
}

// 4. Dor no dia seguinte, por tipo de treino. "corrida" agrupa caminhada/walkrun/qualidade/longao.
const CATEGORIA_TIPO = { muscA: "muscA", muscB: "muscB", muscC: "muscC", caminhada: "corrida", walkrun: "corrida", qualidade: "corrida", longao: "corrida" };
const MIN_AMOSTRA_TIPO = 3;
export function dorPorTipoTreino(eventos, desde, ate) {
  const dias = agruparPorDia(eventos);
  const datas = listaDatas(desde, ate);
  const grupos = { muscA: [], muscB: [], muscC: [], corrida: [], semTreino: [] };
  datas.forEach(iso => {
    const amanha = toISO(new Date(new Date(iso + "T00:00:00").getTime() + 86400000));
    const dorAmanha = dias[amanha] && dias[amanha].dor;
    if (dorAmanha == null) return;
    const d = dias[iso];
    const cat = (d && d.treino && CATEGORIA_TIPO[d.treino.tipo]) || "semTreino";
    grupos[cat].push(dorAmanha);
  });
  const resultado = {};
  Object.entries(grupos).forEach(([cat, arr]) => { resultado[cat] = { n: arr.length, suficiente: arr.length >= MIN_AMOSTRA_TIPO, dorMedia: media(arr) }; });
  return resultado;
}

// 5. ACWR — carga aguda (7d) : crônica (média semanal dos últimos 28d). Carga = minutos × fator de intensidade.
// ponytail: rehab não tem duração registrada (só presença da dose) — estimativa fixa de 15min/dose.
// Revisar se `rehab_dose` ganhar duracaoMin no payload no futuro.
const FATOR_INTENSIDADE = { muscA: 2, muscB: 2, muscC: 2, caminhada: 2, walkrun: 3, qualidade: 3, longao: 3 };
const MIN_REHAB_ESTIMADO = 15;
function cargaDoDia(d) {
  if (!d) return 0;
  let carga = d.periodos.filter(p => p !== "gelo" && p !== "carga").length * MIN_REHAB_ESTIMADO;
  if (d.treino) carga += ((d.treino.duracaoSeg || 0) / 60) * (FATOR_INTENSIDADE[d.treino.tipo] || 2);
  return carga;
}
export function acwr(eventos, hojeISO) {
  const diasDesdeMarco = diffDias(MARCO_ZERO, hojeISO) + 1;
  if (diasDesdeMarco < 28) return { suficiente: false, faltamDias: 28 - diasDesdeMarco };
  const dias = agruparPorDia(eventos);
  const datas28 = [];
  for (let i = 0; i < 28; i++) datas28.push(toISO(new Date(new Date(hojeISO + "T00:00:00").getTime() - i * 86400000)));
  const cargaPorDia = datas28.map(iso => cargaDoDia(dias[iso]));
  const carga7 = cargaPorDia.slice(0, 7).reduce((s, n) => s + n, 0);
  const mediaSemanal28 = cargaPorDia.reduce((s, n) => s + n, 0) / 4;
  const ratio = mediaSemanal28 > 0 ? carga7 / mediaSemanal28 : 0;
  const faixa = ratio < 0.8 ? "subcarga" : ratio > 1.5 ? "risco alto" : ratio > 1.3 ? "atenção" : "ideal";
  return { suficiente: true, ratio: Math.round(ratio * 100) / 100, faixa };
}

// 6. Progressão de carga por exercício — direto de `state.cargas` (não vive no log de eventos).
export function progressaoCarga(cargas, exName) { return { historico: (cargas[exName] && cargas[exName].historico) || [] }; }

export function exerciciosEstagnados(cargas) {
  return Object.entries(cargas)
    .filter(([, reg]) => reg.historico && reg.historico.length >= 3 && reg.historico.slice(-3).every(h => h.kg === reg.historico[reg.historico.length - 1].kg))
    .map(([nome, reg]) => ({ nome, kg: reg.historico[reg.historico.length - 1].kg }));
}

// 7. Volume de corrida — km/semana. O app hoje NÃO captura distância/tempo ao finalizar sessões de
// corrida (só duração total e volume de musculação) — `distanciaKm` fica pronto pro dia em que isso
// existir, mas por ora este relatório sempre reporta "sem dados" honestamente, em vez de inventar.
export function volumeCorrida(eventos, desde, ate) {
  const dias = agruparPorDia(eventos);
  const datas = listaDatas(desde, ate);
  let temDado = false;
  const porSemana = [];
  for (let i = 0; i < datas.length; i += 7) {
    const semana = datas.slice(i, i + 7);
    let km = 0;
    semana.forEach(iso => { const d = dias[iso]; if (d && d.treino && d.treino.distanciaKm) { temDado = true; km += d.treino.distanciaKm; } });
    porSemana.push({ inicio: semana[0], km });
  }
  return { temDado, porSemana };
}

// 8. Peso corporal — pontos + média móvel de 7 dias, tendência (delta do primeiro ao último ponto).
export function pesoCorporal(eventos) {
  const pontos = listar(eventos).filter(e => e.tipo === "peso").map(e => ({ iso: e.data, kg: e.payload.kg }));
  const mediaMovel = pontos.map((p, i) => ({ iso: p.iso, media: media(pontos.slice(Math.max(0, i - 6), i + 1).map(q => q.kg)) }));
  const tendencia = pontos.length >= 2 ? Math.round((pontos[pontos.length - 1].kg - pontos[0].kg) * 10) / 10 : null;
  return { pontos, mediaMovel, tendencia };
}

// 10. Exportação — CSV (`;`, dd/mm/yyyy, CRLF — abre certo no Excel pt-BR) e JSON de todos os eventos.
export function eventosParaJSON(eventos) { return JSON.stringify(eventos, null, 2); }

export function eventosParaCSV(eventos) {
  const linhas = ["data;tipo;payload"];
  listar(eventos).forEach(e => {
    const dataBR = e.data.split("-").reverse().join("/");
    linhas.push([dataBR, e.tipo, JSON.stringify(e.payload).replace(/"/g, "'")].join(";"));
  });
  return linhas.join("\r\n");
}
