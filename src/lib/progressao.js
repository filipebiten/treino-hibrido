// ══════════════════════ PROGRESSÃO POR CRITÉRIO — gates, recuo automático, onboarding ══════════════════════
import { CAMINHADAS_GATE_IDS } from "../data/corrida.js";
import { dOnly } from "../data/plano.js";

export function diasConsecutivosDorBaixa(dorLog, hojeISO, limite) {
  let n = 0, d = dOnly(hojeISO);
  for (;;) {
    const iso = toISO(d);
    const nota = dorLog[iso];
    if (nota === undefined || nota > limite) break;
    n++; d = new Date(d.getTime() - 86400000);
    if (n > 60) break;
  }
  return n;
}
function toISO(date) { const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0"); return y + "-" + m + "-" + d; }

// ══════════════════════ ONBOARDING / RECALIBRAÇÃO ══════════════════════
// Regras (Parte 2.1 do plano):
//  dor >=5  -> trava em M1, rehab reforçado 3x/dia, sem musculação de MMII com impacto
//  dor 3-4  -> M1 normal
//  dor <=2  -> M1 com possibilidade de acelerar (2 testes de caminhada/semana)
//  parado 1+ semanas -> reposiciona em M1 S1 (readaptação); +6 semanas força 3x15
export function calcularPosicao(respostas, posicaoAnterior) {
  const { dor, semanasParado } = respostas;
  const dorAlta = dor >= 5;
  const dorBaixa = dor <= 2;
  const houveGap = semanasParado !== "0";
  const force3x15 = semanasParado === "+6";

  let macrofase = 1, semanaIdx = 0;
  if (!houveGap && posicaoAnterior && !dorAlta) {
    macrofase = posicaoAnterior.macrofase;
    semanaIdx = posicaoAnterior.semanaIdx;
  }
  if (dorAlta) { macrofase = 1; semanaIdx = Math.min(semanaIdx, 3); }

  return {
    macrofase, semanaIdx,
    dorAlta, acelerarTestes: dorBaixa, force3x15,
    sinceISO: null,
  };
}

// ══════════════════════ GATES DE PROGRESSÃO ══════════════════════
export function gateM1toM2({ testesLog, dorLog, hojeISO }) {
  const faltando = [];
  const pendentes = CAMINHADAS_GATE_IDS.filter(id => !(testesLog[id] && testesLog[id].passou));
  if (pendentes.length) faltando.push(pendentes.length + " teste(s) de caminhada pendente(s)/reprovado(s)");
  const dias = diasConsecutivosDorBaixa(dorLog, hojeISO, 2);
  if (dias < 5) faltando.push("dor ≤2/10 por 5 dias seguidos (" + dias + "/5)");
  return { ok: faltando.length === 0, faltando };
}

export function gateM2toM3({ testesLog }) {
  const ok = !!(testesLog.corrida5min && testesLog.corrida5min.passou);
  return { ok, faltando: ok ? [] : ["5 minutos de corrida contínua sem dor"] };
}

export function gateM3toM4({ testesLog }) {
  const ok = !!(testesLog.teste5km && testesLog.teste5km.passou);
  return { ok, faltando: ok ? [] : ["teste de 5km contínuo aprovado"] };
}

export function verificarGate(macrofase, ctx) {
  if (macrofase === 1) return gateM1toM2(ctx);
  if (macrofase === 2) return gateM2toM3(ctx);
  if (macrofase === 3) return gateM3toM4(ctx);
  return { ok: true, faltando: [] };
}

// ══════════════════════ RECUO AUTOMÁTICO (regra 24h) ══════════════════════
// Se a dor matinal subir >=2 pontos vs a média dos 5 dias anteriores, por 2 dias seguidos
// após treino, rebaixa a semana de corrida e volta o rehab pra 2x/dia.
export function checkRecuoAutomatico(dorLog, hojeISO) {
  const hoje = dorLog[hojeISO];
  const ontemISO = toISO(new Date(dOnly(hojeISO).getTime() - 86400000));
  const ontem = dorLog[ontemISO];
  if (hoje === undefined || ontem === undefined) return { trigger: false };

  let soma = 0, n = 0, d = new Date(dOnly(ontemISO).getTime() - 86400000);
  for (let i = 0; i < 5; i++) {
    const iso = toISO(d);
    if (dorLog[iso] !== undefined) { soma += dorLog[iso]; n++; }
    d = new Date(d.getTime() - 86400000);
  }
  if (n === 0) return { trigger: false };
  const baseline = soma / n;
  const trigger = hoje >= baseline + 2 && ontem >= baseline + 2;
  return { trigger, baseline };
}

// ══════════════════════ TRAVA RATHLEFF (36-72h entre sessões) ══════════════════════
const RATHLEFF_MIN_MS = 36 * 3600 * 1000;

export function rathleffStatus(ultimoTimestampMs, agoraMs) {
  if (!ultimoTimestampMs) return { liberado: true, restanteMs: 0 };
  const restante = ultimoTimestampMs + RATHLEFF_MIN_MS - agoraMs;
  return { liberado: restante <= 0, restanteMs: Math.max(0, restante) };
}

export function formatarRestante(ms) {
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h + "h" + String(m).padStart(2, "0") + "min";
}
