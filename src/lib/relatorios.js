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

function segundaFeiraDaSemana(iso) {
  const d = new Date(iso + "T00:00:00");
  const offset = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return toISO(new Date(d.getTime() - offset * 86400000));
}

// ponytail: "planejado" assume 1 dose de manhã + 1 de noite por dia — o regime
// atual (macrofase 1, único vivido até aqui). Uma macrofase futura com dose
// "unica"/"tarde" muda o que "planejado" significa — revisar quando chegar lá.
// `semanasDeclaradas` (Bloco 2.5, opcional): dias de semana "apertada" saem do
// denominador — modo manutenção não conta como déficit.
export function aderenciaRehab(eventos, desde, ate, semanasDeclaradas = {}) {
  const dias = agruparPorDia(eventos);
  const datas = listaDatas(desde, ate).filter(iso => semanasDeclaradas[segundaFeiraDaSemana(iso)] !== "apertada");
  let manhaFeitas = 0, noiteFeitas = 0;
  const porSemana = [];
  for (let i = 0; i < datas.length; i += 7) {
    const semana = datas.slice(i, i + 7);
    let mF = 0, nF = 0;
    semana.forEach(iso => {
      const d = dias[iso];
      if (d && d.periodos.includes("manha")) { const w = (d.pesoPeriodo && d.pesoPeriodo.manha) || 1; mF += w; manhaFeitas += w; }
      if (d && d.periodos.includes("noite")) { const w = (d.pesoPeriodo && d.pesoPeriodo.noite) || 1; nF += w; noiteFeitas += w; }
    });
    porSemana.push({ inicio: semana[0], manhaPct: Math.round((mF / semana.length) * 100), noitePct: Math.round((nF / semana.length) * 100) });
  }
  const total = datas.length;
  const r1 = n => Math.round(n * 10) / 10;
  return {
    manha: { feitas: r1(manhaFeitas), planejadas: total, pct: total ? Math.round((manhaFeitas / total) * 100) : 0 },
    noite: { feitas: r1(noiteFeitas), planejadas: total, pct: total ? Math.round((noiteFeitas / total) * 100) : 0 },
    porSemana,
  };
}

// 1b. Aderência ao Rathleff — doses feitas vs devidas. A trava de 36h (progressao.js
// rathleffStatus) já impede sessão diária; "devidas" assume cadência a cada 2 dias.
export function aderenciaRathleff(eventos, desde, ate) {
  const dias = agruparPorDia(eventos);
  const datas = listaDatas(desde, ate);
  let feitas = 0;
  datas.forEach(iso => { const d = dias[iso]; if (d && d.periodos.includes("carga")) feitas++; });
  const devidas = Math.max(1, Math.round(datas.length / 2));
  return { feitas, devidas, pct: Math.round((feitas / devidas) * 100) };
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
// Rehab usa `rehabMinutos` real quando a edição de dia informou duração; sem isso,
// cai numa estimativa fixa de 15min/dose (ponytail: aproximação, editável em Histórico).
const FATOR_INTENSIDADE = { muscA: 2, muscB: 2, muscC: 2, caminhada: 2, walkrun: 3, qualidade: 3, longao: 3 };
const MIN_REHAB_ESTIMADO = 15;
function cargaDoDia(d) {
  if (!d) return 0;
  const doses = d.periodos.filter(p => p !== "gelo" && p !== "carga").length;
  let carga = d.rehabMinutos != null ? d.rehabMinutos : doses * MIN_REHAB_ESTIMADO;
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
  // rótulos descritivos, não alerta de risco — ACWR não tem evidência como preditor de
  // lesão (Impellizzeri et al. 2020, IJSPP: acoplamento matemático, faixas arbitrárias)
  const faixa = ratio < 0.8 ? "subcarga" : ratio > 1.5 ? "carga alta" : ratio > 1.3 ? "carga crescente" : "ideal";
  return { suficiente: true, ratio: Math.round(ratio * 100) / 100, faixa };
}

// 6. Progressão de carga por exercício — direto de `state.cargas` (não vive no log de eventos).
export function progressaoCarga(cargas, exName) { return { historico: (cargas[exName] && cargas[exName].historico) || [] }; }

export function exerciciosEstagnados(cargas) {
  return Object.entries(cargas)
    .filter(([, reg]) => reg.historico && reg.historico.length >= 3 && reg.historico.slice(-3).every(h => h.kg === reg.historico[reg.historico.length - 1].kg))
    .map(([nome, reg]) => ({ nome, kg: reg.historico[reg.historico.length - 1].kg }));
}

// 3.6 — deload: 2+ exercícios estagnados ao mesmo tempo sugere semana de descarga
// (~50% das séries, RIR mais alto). É sugestão, não automático.
export function sugerirDeload(cargas) {
  const estagnados = exerciciosEstagnados(cargas);
  return { sugerido: estagnados.length >= 2, estagnados };
}

// 3.4 — volume por grupo muscular, aproximado por tipo de sessão (superior/inferior), não
// por exercício individual: MA/MC (superior) não têm mapeamento de músculo primário por
// exercício. Espelha o mapeamento tipo→grupo de tipoInfo() em App.jsx.
const GRUPO_POR_TIPO = { muscA: "superior", muscB: "inferior", muscC: "superior" };
export function volumePorGrupo(eventos, desde, ate) {
  const dias = agruparPorDia(eventos);
  const datas = listaDatas(desde, ate);
  let superior = 0, inferior = 0;
  datas.forEach(iso => {
    const d = dias[iso];
    if (!d || !d.treino || !d.treino.volume) return;
    const grupo = GRUPO_POR_TIPO[d.treino.tipo];
    if (grupo === "superior") superior += d.treino.volume;
    else if (grupo === "inferior") inferior += d.treino.volume;
  });
  return { superior: Math.round(superior), inferior: Math.round(inferior) };
}

// 7. Volume de corrida — km/semana. `distanciaKm` vem da captura pós-corrida (WorkoutScreen,
// Bloco 2) ou da edição manual de dia (Histórico) — nenhuma automática. Sem nenhum dos dois,
// reporta "sem dados" honestamente, em vez de inventar.
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

// 3.7a — carga de corrida por PSE (esforço percebido 0-10 × minutos). Dispensa wearable.
// Só existe quando o usuário respondeu o PSE ao finalizar a sessão (pode pular).
export function srpeCorrida(eventos, desde, ate) {
  const dias = agruparPorDia(eventos);
  const datas = listaDatas(desde, ate);
  let semanaAtual = 0, semana4Atras = [];
  const CORRIDA_TIPOS = ["caminhada", "walkrun", "qualidade", "longao"];
  datas.forEach((iso, i) => {
    const d = dias[iso];
    if (!d || !d.treino || !CORRIDA_TIPOS.includes(d.treino.tipo) || d.treino.pse == null) return;
    const minutos = d.treino.tempoTotalMin || (d.treino.duracaoSeg ? d.treino.duracaoSeg / 60 : 0);
    const srpe = d.treino.pse * minutos;
    if (i >= datas.length - 7) semanaAtual += srpe;
    if (i >= datas.length - 28) semana4Atras.push(srpe);
  });
  const mediaSemanal4 = semana4Atras.length ? semana4Atras.reduce((s, n) => s + n, 0) / 4 : null;
  const variacaoPct = mediaSemanal4 ? Math.round(((semanaAtual - mediaSemanal4) / mediaSemanal4) * 100) : null;
  return { temDado: semana4Atras.some(v => v > 0), semanaAtual: Math.round(semanaAtual), mediaSemanal4: mediaSemanal4 != null ? Math.round(mediaSemanal4) : null, variacaoPct };
}

// 8. Peso corporal — pontos + média móvel de 7 dias, tendência (delta do primeiro ao último ponto).
export function pesoCorporal(eventos) {
  const pontos = listar(eventos).filter(e => e.tipo === "peso").map(e => ({ iso: e.data, kg: e.payload.kg }));
  const mediaMovel = pontos.map((p, i) => ({ iso: p.iso, media: media(pontos.slice(Math.max(0, i - 6), i + 1).map(q => q.kg)) }));
  const tendencia = pontos.length >= 2 ? Math.round((pontos[pontos.length - 1].kg - pontos[0].kg) * 10) / 10 : null;
  return { pontos, mediaMovel, tendencia };
}

// 12. "Isso já aconteceu antes" — Bloco 2.1. Quando a dor de hoje sobe pelo menos até um
// nível já visto antes, compara com episódios passados que chegaram no mesmo nível (ou
// mais alto) e mede quantos dias levaram pra voltar a ≤2/10. Gate de 8 semanas — antes
// disso o histórico é curto demais pra dizer "isso já aconteceu antes" com confiança.
const MIN_DIAS_COMPARACAO_RECAIDA = 56;
const LIMIAR_VOLTA_RECAIDA = 2;
export function comparacaoRecaida(eventos, hojeISO) {
  const pontos = listar(eventos).filter(e => e.tipo === "dor_checkin").map(e => ({ iso: e.data, nivel: e.payload.nivel })).sort((a, b) => a.iso < b.iso ? -1 : 1);
  if (!pontos.length) return { suficiente: false, faltamDias: MIN_DIAS_COMPARACAO_RECAIDA };
  const diasHistorico = diffDias(pontos[0].iso, hojeISO) + 1;
  if (diasHistorico < MIN_DIAS_COMPARACAO_RECAIDA) return { suficiente: false, faltamDias: MIN_DIAS_COMPARACAO_RECAIDA - diasHistorico };

  const dorHoje = pontos[pontos.length - 1].nivel;
  const baseline = media(pontos.slice(0, -1).map(p => p.nivel));
  if (baseline == null || dorHoje <= baseline) return { suficiente: true, elevada: false };

  // Episódios passados (exclui o de hoje, que por definição ainda não fechou): sequência
  // de dias com dor ≥ dorHoje até o primeiro dia seguinte com dor ≤2.
  const episodios = [];
  let emEpisodio = false, inicioEpisodio = null;
  for (let i = 0; i < pontos.length - 1; i++) {
    const p = pontos[i];
    if (!emEpisodio && p.nivel >= dorHoje) { emEpisodio = true; inicioEpisodio = p; }
    else if (emEpisodio && p.nivel <= LIMIAR_VOLTA_RECAIDA) {
      episodios.push({ inicioISO: inicioEpisodio.iso, dias: diffDias(inicioEpisodio.iso, p.iso) });
      emEpisodio = false;
    }
  }
  if (!episodios.length) return { suficiente: true, elevada: true, dorHoje, vezes: 0 };
  return { suficiente: true, elevada: true, dorHoje, vezes: episodios.length, diasMediaRecuperacao: Math.round(media(episodios.map(e => e.dias))) };
}

// 13. Projeção de gate — Bloco 2.4. Regressão linear simples sobre os últimos 14 pontos
// de dor matinal; só projeta quando a tendência é de queda real (slope negativo) —
// tendência plana ou subindo não projeta nada, pra não prometer o que o dado não mostra.
export function projecaoDorAteLimiar(eventos, hojeISO, limiar) {
  const pontos = listar(eventos).filter(e => e.tipo === "dor_checkin" && e.data <= hojeISO).map(e => ({ iso: e.data, nivel: e.payload.nivel }));
  const recentes = pontos.slice(-14);
  if (recentes.length < 6) return null;
  const x0 = diffDias(MARCO_ZERO, recentes[0].iso);
  const xs = recentes.map(p => diffDias(MARCO_ZERO, p.iso) - x0);
  const ys = recentes.map(p => p.nivel);
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0), sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { tendencia: "sem dado suficiente", dias: null };
  const slope = (n * sumXY - sumX * sumY) / denom;
  if (slope >= 0) return { tendencia: "sem queda", dias: null };
  const intercept = (sumY - slope * sumX) / n;
  const dorProjetadaHoje = intercept + slope * xs[xs.length - 1];
  if (dorProjetadaHoje <= limiar) return { tendencia: "já abaixo", dias: 0 };
  const diasAteLimiar = (limiar - dorProjetadaHoje) / slope;
  if (!isFinite(diasAteLimiar) || diasAteLimiar > 180) return { tendencia: "queda lenta demais pra projetar", dias: null };
  return { tendencia: "caindo", dias: Math.ceil(diasAteLimiar) };
}

// 11. Dor matinal × carga de pé do dia anterior + dor por dia da semana. Bloco 1.3 do
// plano de evolução híbrida — "a variável que falta" (carga de pé fora do treino, não
// só o treino em si). Mínimo 4 semanas corridas desde o primeiro registro de carga_pe,
// mesmo gate de ACWR — abaixo disso o número mente, não plota correlação com n pequeno.
const MIN_DIAS_CARGA_PE = 28;
const DIA_SEMANA_LABEL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export function dorPorCargaPe(eventos, hojeISO) {
  const cargaPeEventos = listar(eventos).filter(e => e.tipo === "carga_pe");
  if (!cargaPeEventos.length) return { suficiente: false, faltamDias: MIN_DIAS_CARGA_PE };
  const diasDesde = diffDias(cargaPeEventos[0].data, hojeISO) + 1;
  if (diasDesde < MIN_DIAS_CARGA_PE) return { suficiente: false, faltamDias: MIN_DIAS_CARGA_PE - diasDesde };

  const dias = agruparPorDia(eventos);
  const porNivel = { leve: [], normal: [], muito: [] };
  const porDiaSemana = DIA_SEMANA_LABEL.map(() => []);
  Object.keys(dias).forEach(iso => {
    const d = dias[iso];
    if (d.dor == null) return;
    porDiaSemana[new Date(iso + "T00:00:00").getDay()].push(d.dor);
    const ontem = toISO(new Date(new Date(iso + "T00:00:00").getTime() - 86400000));
    const nivelOntem = dias[ontem] && dias[ontem].cargaPe;
    if (nivelOntem) porNivel[nivelOntem].push(d.dor);
  });
  return {
    suficiente: true,
    porNivel: Object.fromEntries(Object.entries(porNivel).map(([k, arr]) => [k, { n: arr.length, dorMedia: media(arr) }])),
    porDiaSemana: DIA_SEMANA_LABEL.map((label, i) => ({ label, n: porDiaSemana[i].length, dorMedia: media(porDiaSemana[i]) })),
  };
}

// Bloco 2 (evolução híbrida) — últimos valores de corrida pra pré-preencher a
// captura pós-treino (WorkoutScreen) e a edição retroativa (DiaEdit).
const TIPOS_CORRIDA = ["caminhada", "walkrun", "qualidade", "longao"];
export function ultimosValoresCorrida(eventos) {
  const recentes = listar(eventos).filter(e => e.tipo === "treino_concluido" && TIPOS_CORRIDA.includes(e.payload.tipo)).reverse();
  const achar = campo => { const e = recentes.find(ev => ev.payload[campo] != null); return e ? e.payload[campo] : null; };
  return { temperaturaC: achar("temperaturaC"), umidadePct: achar("umidadePct") };
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

// 15. Bloco 5.2 — histórico de teste funcional (heel raise unilateral, mensal).
export function historicoTesteFuncional(eventos) {
  return listar(eventos).filter(e => e.tipo === "teste_funcional").reverse()
    .map(e => ({ data: e.data, esq: e.payload.esq, dir: e.payload.dir }));
}
