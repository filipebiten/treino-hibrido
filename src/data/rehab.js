// ══════════════════════ REHAB FASCITE PLANTAR — conteúdo preservado do protocolo original ══════════════════════
// Base científica: Rathleff (heel raise excêntrico), DiGiovanni (alongamento específico),
// JOSPT 2023 (gastrocnêmio/sóleo), McKeon (Short Foot). Ver seção 7 do handoff.

export const REHAB_BASE_2X = {
  id: "m1-base", title: "Rotina completa", subtitle: "2x/dia — ao acordar + antes de dormir", time: "~20 min", when: "Todos os dias, 2x", color: "#f59e0b",
  exercises: [
    { name: "Bombas de tornozelo", duration: 120, type: "timer",
      how: "Deitado ou sentado na cama. Aponte a ponta do pé para baixo e depois puxe para cima. Alterne suavemente. NÃO levante antes de fazer isso — a fáscia está encurtada e fria." },
    { name: "Alongamento com toalha (panturrilha)", sets: 2, duration: 30, type: "timer",
      how: "Sentado, toalha na planta do pé. Joelho esticado, puxe a toalha trazendo a ponta do pé em direção à canela. 30s. 2x cada perna." },
    { name: "Alongamento DiGiovanni (fáscia)", reps: 10, type: "reps",
      how: "Sentado, cruze a perna afetada. Segure a BASE DOS DEDOS (não a ponta) e puxe para CIMA e para TRÁS. Palpe a fáscia com a outra mão para confirmar tensão. 10s x 10 repetições. O exercício com mais evidência." },
    { name: "Bolinha de tênis na sola", detail: "Cada pé", duration: 180, type: "timer",
      how: "Sentado, role a bolinha do calcanhar à base dos dedos. Pressão moderada (≤3/10 de dor)." },
    { name: "Short Foot (encurtamento do pé)", reps: 15, type: "reps",
      how: "Pé apoiado, SEM encolher os dedos. Aproxime a base do dedão do calcanhar, 'levante a cúpula' do arco. Segure 5s. 15 repetições." },
    { name: "Toe Yoga (piano com os dedos)", reps: 10, type: "reps",
      how: "3 movimentos, 10 reps cada: (1) só o dedão sobe. (2) dedão desce, outros sobem. (3) espalhe os dedos como leque." },
    { name: "Catador de toalha", sets: 2, reps: 15, type: "reps",
      how: "Toalha no chão, use apenas os dedos do pé para agarrar e puxar. 2 séries de 15." },
    { name: "4-vias tornozelo c/ elástico", sets: 3, reps: 10, type: "reps",
      how: "4 movimentos 3x10 cada: plantiflexão, dorsiflexão, INVERSÃO (mais importante — tibial posterior), eversão." },
    { name: "❄️ Gelo nos pés", detail: "Obrigatório", duration: 900, type: "timer", isIce: true,
      how: "Garrafa congelada com fronha, ou bolsa de gelo com toalha fina. 15 minutos." },
  ],
};

export const REHAB_CARGA_RATHLEFF = {
  id: "carga-rathleff", title: "Rathleff — carga", subtitle: "Dias alternados", time: "~10 min", when: "Dias alternados", color: "#ef4444",
  exercises: [
    { name: "Heel Raise Rathleff (PROTOCOLO PRINCIPAL)", sets: 3, reps: 12, type: "exercise", rest: 120,
      how: "Toalha enrolada sob os dedos no degrau — ativa o mecanismo de Windlass. Antepé na borda, calcanhar no ar. SUBA em 3s, PAUSE 2s no topo, DESÇA em 3s abaixo do degrau. Unilateral, pé afetado. Se a dor no dia SEGUINTE estiver pior, reduza." },
    { name: "Equilíbrio unilateral c/ Short Foot", sets: 3, duration: 60, type: "timer",
      how: "Um pé só (o afetado), Short Foot ativo (arco levantado sem encolher os dedos). 60s. Progressão: olhos abertos → fechados." },
  ],
};

export const REHAB_MANUTENCAO_1X = {
  id: "manutencao-1x", title: "Manutenção fascite", subtitle: "1x/dia — ao acordar", time: "~8 min", when: "Todos os dias, 1x", color: "#f59e0b",
  exercises: [
    { name: "Alongamento DiGiovanni (fáscia)", reps: 10, type: "reps",
      how: "Sentado, cruze a perna afetada. Segure a base dos dedos, puxe para cima e para trás. Palpe a fáscia. 10s x 10 repetições." },
    { name: "Along. panturrilha (joelho reto + dobrado)", sets: 2, duration: 30, type: "timer",
      how: "Mãos na parede. 2x30s joelho reto (gastrocnêmio) + 2x30s joelho dobrado (sóleo)." },
    { name: "Bolinha de tênis na sola", duration: 120, type: "timer",
      how: "Role a bolinha do calcanhar à base dos dedos. Pressão moderada (≤3/10 de dor). 2 minutos." },
  ],
};

export const REHAB_GELO_POS_CORRIDA = {
  id: "gelo-pos-corrida", title: "Gelo pós-corrida", subtitle: "Obrigatório após toda corrida", time: "15 min", when: "Após correr", color: "#0ea5e9",
  exercises: [
    { name: "❄️ Gelo nos pés", detail: "Obrigatório após toda corrida", duration: 900, type: "timer", isIce: true,
      how: "Garrafa congelada com fronha, ou bolsa de gelo com toalha fina. 15 minutos." },
  ],
};

function cargaComVolume(sets, reps, mochila) {
  return { ...REHAB_CARGA_RATHLEFF, id: REHAB_CARGA_RATHLEFF.id + "-" + sets + "x" + reps, exercises: [
    { ...REHAB_CARGA_RATHLEFF.exercises[0], sets, reps, detail: mochila ? "Com mochila" : undefined },
    REHAB_CARGA_RATHLEFF.exercises[1],
  ]};
}

// ══════════════════════ ROTEAMENTO POR MACROFASE ══════════════════════
// M1: rotina completa 2x/dia. Rathleff a partir da S2 (semanaIdx>=1), dias alternados, 3x12.
// M2: 1x/dia (acordar) + gelo obrigatório pós-corrida. Rathleff 3x/semana, 4x10 c/ mochila.
// M3/M4: manutenção 1x/dia + gelo pós-corrida. Rathleff progride pra 5x8.
export function getRehabForMacrofase(macrofase, semanaIdx, diaAlternado, dorAlta) {
  if (dorAlta) {
    // Dor alta (≥5) trava rehab reforçado 3x/dia — mesma rotina base, chamada 3 vezes ao dia pela Home.
    return { base: REHAB_BASE_2X, carga: null, gelo: null, reforcado: true };
  }
  if (macrofase === 1) {
    const carga = semanaIdx >= 1 && diaAlternado ? cargaComVolume(3, 12, false) : null;
    return { base: REHAB_BASE_2X, carga, gelo: null, reforcado: false };
  }
  if (macrofase === 2) {
    const carga = diaAlternado ? cargaComVolume(4, 10, true) : null;
    return { base: REHAB_MANUTENCAO_1X, carga, gelo: REHAB_GELO_POS_CORRIDA, reforcado: false };
  }
  // M3 e M4
  const carga = diaAlternado ? cargaComVolume(5, 8, true) : null;
  return { base: REHAB_MANUTENCAO_1X, carga, gelo: REHAB_GELO_POS_CORRIDA, reforcado: false };
}
