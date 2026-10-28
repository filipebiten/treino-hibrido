// ══════════════════════ AGENDAMENTO HÍBRIDO — Bloco 3, regras R1-R4 do método ══════════════════════
// O método Time Híbrido (Victor Pareto) não é "corrida com musculação de apoio": as duas
// modalidades se completam. Essas regras existem pra proteger isso — não subordinam uma à
// outra, só evitam colisão de carga (leg day + corrida no mesmo dia) e dose errada de
// intensidade (corrida pesada logo depois de perna, treino de corrida intenso demais na
// semana). Funções puras: entram eventos + tipo pretendido, sai um veredito.

import { toISO } from "../data/plano.js";
import { agruparPorDia } from "./eventos.js";

export const TIPOS_CORRIDA = ["caminhada", "walkrun", "qualidade", "longao"];
const LABEL_TIPO = { muscA: "Musculação A", muscB: "Musculação B (pernas)", muscC: "Musculação C", caminhada: "Caminhada", walkrun: "Walk/Run", qualidade: "Qualidade", longao: "Longão" };

// R1-R3 — valida o tipo de sessão que o usuário está prestes a iniciar hoje, contra o que
// já foi feito hoje e ontem.
export function validarAgendamento(eventos, hojeISO, tipoNovo) {
  if (!tipoNovo) return { bloqueado: false };
  const dias = agruparPorDia(eventos);
  const ontemISO = toISO(new Date(new Date(hojeISO + "T00:00:00").getTime() - 86400000));
  const hojeDia = dias[hojeISO];
  const ontemDia = dias[ontemISO];
  const ehCorridaNovo = TIPOS_CORRIDA.includes(tipoNovo);
  const tipoHoje = hojeDia && hojeDia.treino && hojeDia.treino.tipo;
  const tipoOntem = ontemDia && ontemDia.treino && ontemDia.treino.tipo;

  // R1 — leg day (Musculação B) e corrida não coexistem no mesmo dia. Bloqueio real.
  if (ehCorridaNovo && tipoHoje === "muscB") {
    return { bloqueado: true, motivo: "Leg day (Musculação B) hoje — corrida no mesmo dia vai contra o método híbrido (R1). Corrida regenerativa fica pra amanhã." };
  }
  if (tipoNovo === "muscB" && TIPOS_CORRIDA.includes(tipoHoje)) {
    return { bloqueado: true, motivo: "Já correu hoje — leg day no mesmo dia da corrida vai contra o método híbrido (R1). Pernas fica pra outro dia." };
  }

  // R2 — dia seguinte a leg day pede corrida regenerativa (caminhada/walkrun leve), não
  // qualidade/longão. Sugestão forte, sobrescrevível — nunca bloqueia.
  if (ehCorridaNovo && tipoOntem === "muscB" && (tipoNovo === "qualidade" || tipoNovo === "longao")) {
    return { bloqueado: false, sugestaoForte: `Ontem foi leg day — hoje o método pede corrida regenerativa (bem leve), não ${LABEL_TIPO[tipoNovo]}. Pode seguir, mas considera trocar.` };
  }

  // R3 — dois treinos no mesmo dia: informa o que já foi feito, prioridade decide a ordem
  // (ver prioridadeTemporada em App.jsx).
  if (tipoHoje && tipoHoje !== tipoNovo) {
    return { bloqueado: false, info: `Já tem ${LABEL_TIPO[tipoHoje]} feito hoje. Dois treinos no mesmo dia: o prioritário da temporada vem primeiro.` };
  }

  return { bloqueado: false };
}

// 3.3 / R4 — distribuição de intensidade dos treinos de corrida na semana. Aproximação por
// tipo de sessão (o app não captura FC/PSE sistematicamente ainda): qualidade = intenso,
// longão = moderado (volume, não velocidade), caminhada/walkrun = leve. Base aeróbica
// exige predominância de leve — aviso só, nunca bloqueio.
const INTENSIDADE_CORRIDA = { caminhada: "leve", walkrun: "leve", qualidade: "intenso", longao: "moderado" };
const MIN_AMOSTRA_INTENSIDADE = 3;
export function distribuicaoIntensidade(eventos, desde, ate) {
  const datas = [];
  for (let d = new Date(desde + "T00:00:00"), fim = new Date(ate + "T00:00:00"); d <= fim; d.setDate(d.getDate() + 1)) datas.push(toISO(d));
  const dias = agruparPorDia(eventos);
  const contagem = { leve: 0, moderado: 0, intenso: 0 };
  let total = 0;
  datas.forEach(iso => {
    const d = dias[iso];
    const nivel = d && d.treino && INTENSIDADE_CORRIDA[d.treino.tipo];
    if (nivel) { contagem[nivel]++; total++; }
  });
  const pctIntenso = total ? Math.round((contagem.intenso / total) * 100) : 0;
  return { total, contagem, pctIntenso, suficiente: total >= MIN_AMOSTRA_INTENSIDADE, avisoAlto: total >= MIN_AMOSTRA_INTENSIDADE && pctIntenso > 20 };
}
