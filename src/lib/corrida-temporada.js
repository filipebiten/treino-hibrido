// ══════════════════════ TEMPORADAS E CORRIDA — Bloco 4 ══════════════════════
// Funções puras: cálculo de Riegel, zonas de ritmo, ajuste por calor, regra dos 10%.
// NÃO mexe na progressão de macrofase existente (plano.js) — isso continua intocado,
// temporadas é um registro paralelo (prova-alvo, volume, prioridade) que o usuário
// gerencia manualmente, não um motor que dirige o app sozinho.

// 4.2 — Riegel: T2 = T1 × (D2/D1)^1.06. Projeta tempo numa distância a partir de outra.
// Ressalva do próprio spec: superestima em distâncias longas pra quem não tem base de
// volume — é projeção, não promessa.
export function riegel(tempoSeg1, distanciaKm1, distanciaKm2) {
  if (!tempoSeg1 || !distanciaKm1 || !distanciaKm2) return null;
  return Math.round(tempoSeg1 * Math.pow(distanciaKm2 / distanciaKm1, 1.06));
}

// 4.3 — zonas de ritmo derivadas do ritmo-base (fácil), em seg/km. Percentuais são
// aproximação de treino de corrida de base (não é fisiologia validada individualmente,
// é heurística — ajustável quando houver mais dado real).
const ZONA_FATOR = { regenerativo: 1.25, facil: 1.15, moderado: 1.05, longao: 1.12, limiar: 0.95, intervalado: 0.88 };
export function zonasDeRitmo(ritmoFacilSegPorKm) {
  if (!ritmoFacilSegPorKm) return null;
  const out = {};
  Object.entries(ZONA_FATOR).forEach(([zona, fator]) => { out[zona] = Math.round(ritmoFacilSegPorKm * fator); });
  return out;
}

export function formatarRitmo(segPorKm) {
  if (segPorKm == null) return "--:--";
  const min = Math.floor(segPorKm / 60), seg = Math.round(segPorKm % 60);
  return min + ":" + String(seg).padStart(2, "0") + "/km";
}

// 4.4 — ajuste de ritmo por calor. Regra prática do spec: a partir de 20°C, +2% de tempo
// a cada 5°C, agravante se umidade >60%. Sem API de clima — entrada manual.
export function ajusteRitmoPorCalor(ritmoSegPorKm, temperaturaC, umidadePct) {
  if (ritmoSegPorKm == null || temperaturaC == null) return { ritmoAjustado: ritmoSegPorKm, pctAjuste: 0 };
  if (temperaturaC < 20) return { ritmoAjustado: ritmoSegPorKm, pctAjuste: 0 };
  let pct = Math.floor((temperaturaC - 20) / 5) * 2;
  if (umidadePct != null && umidadePct > 60) pct += 2;
  return { ritmoAjustado: Math.round(ritmoSegPorKm * (1 + pct / 100)), pctAjuste: pct };
}

// 4.6 — regra dos 10%: volume semanal não sobe mais de 10% sobre a média das últimas 4
// semanas. Retorna violação (subiu demais) ou alerta (caiu demais abaixo do necessário
// pra meta — só quando volumeAlvoKm é informado, ex: vindo da temporada ativa).
export function checarRegra10Porcento(kmSemanaAtual, kmMedia4Semanas, volumeAlvoKm) {
  if (kmMedia4Semanas == null || kmMedia4Semanas === 0) return { suficiente: false };
  const limiteMax = kmMedia4Semanas * 1.1;
  const violouSubida = kmSemanaAtual > limiteMax;
  const abaixoDaMeta = volumeAlvoKm != null && kmSemanaAtual < volumeAlvoKm * 0.5;
  return { suficiente: true, limiteMax: Math.round(limiteMax * 10) / 10, violouSubida, abaixoDaMeta };
}

// 4.7 — cadência. Abaixo de ~165 passos/min com passada longa aumenta impacto. Só sugere
// com 3+ registros (amostra mínima), nunca com 1-2.
const CADENCIA_MINIMA = 165;
const MIN_AMOSTRA_CADENCIA = 3;
export function avaliarCadencia(cadencias) {
  const validas = cadencias.filter(c => c != null);
  if (validas.length < MIN_AMOSTRA_CADENCIA) return { suficiente: false };
  const media = Math.round(validas.reduce((s, c) => s + c, 0) / validas.length);
  return { suficiente: true, media, abaixoDoAlvo: media < CADENCIA_MINIMA, alvoSugerido: Math.round(media * 1.05) };
}
