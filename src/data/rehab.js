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
    { name: "Alongamento DiGiovanni (fáscia)", detail: "Cada pé", reps: 10, type: "reps",
      how: "Sentado, cruze uma perna sobre a outra. Segure a BASE DOS DEDOS (não a ponta) e puxe para CIMA e para TRÁS. Palpe a fáscia com a outra mão para confirmar tensão. 10s x 10 repetições, depois troque de pé (fascite bilateral — comece pelo direito, o mais sintomático). O exercício com mais evidência." },
    { name: "Bolinha de tênis na sola", detail: "Cada pé", duration: 180, type: "timer",
      how: "Sentado, role a bolinha do calcanhar à base dos dedos. Pressão moderada (≤3/10 de dor)." },
    { name: "Short Foot (encurtamento do pé)", detail: "Cada pé", reps: 15, type: "reps",
      how: "Pé apoiado, SEM encolher os dedos. Aproxime a base do dedão do calcanhar, 'levante a cúpula' do arco. Segure 5s. 15 repetições." },
    { name: "Toe Yoga (piano com os dedos)", detail: "Cada pé", reps: 10, type: "reps",
      how: "3 movimentos, 10 reps cada: (1) só o dedão sobe. (2) dedão desce, outros sobem. (3) espalhe os dedos como leque." },
    { name: "Catador de toalha", detail: "Cada pé", sets: 2, reps: 15, type: "reps",
      how: "Toalha no chão, use apenas os dedos do pé para agarrar e puxar. 2 séries de 15." },
    { name: "4-vias tornozelo c/ elástico", detail: "Cada pé", sets: 3, reps: 10, type: "reps",
      how: "4 movimentos 3x10 cada: plantiflexão, dorsiflexão, INVERSÃO (mais importante — tibial posterior), eversão." },
    { name: "❄️ Gelo nos pés", detail: "Obrigatório", duration: 900, type: "timer", isIce: true,
      how: "Garrafa congelada com fronha, ou bolsa de gelo com toalha fina. 15 minutos." },
  ],
};

export const REHAB_CARGA_RATHLEFF = {
  id: "carga-rathleff", title: "Rathleff — carga", subtitle: "Dias alternados", time: "~15 min", when: "Dias alternados", color: "#ef4444",
  exercises: [
    // Fascite BILATERAL, mais acentuada à direita (avaliação biomecânica 19/08/2021). Dose ASSIMÉTRICA de propósito:
    // direito progride (é o alvo terapêutico), esquerdo fica em manutenção 3x12 sem carga, sempre.
    // Não simetrizar — dobrar volume nos dois pés sem motivo cria lesão nova.
    { name: "Heel Raise Rathleff (PROTOCOLO PRINCIPAL)", detail: "Pé DIREITO", sets: 3, reps: 12, type: "exercise", rest: 120,
      how: "Toalha enrolada sob os dedos no degrau — ativa o mecanismo de Windlass. Antepé na borda, calcanhar no ar. SUBA em 3s, PAUSE 2s no topo, DESÇA em 3s abaixo do degrau. Unilateral, pé DIREITO (o mais sintomático — é ele que progride de carga). Se a dor no dia SEGUINTE estiver pior, reduza." },
    { name: "Heel Raise Rathleff — pé esquerdo", detail: "Manutenção · sem carga extra", sets: 3, reps: 12, type: "exercise", rest: 120,
      how: "Mesma execução, pé ESQUERDO. Sempre 3x12, sem mochila, sem progressão — a fascite é bilateral, mas o esquerdo é o lado menos afetado e recebe dose de manutenção." },
    { name: "Equilíbrio unilateral c/ Short Foot", detail: "Cada pé", sets: 3, duration: 60, type: "timer",
      how: "Um pé só, Short Foot ativo (arco levantado sem encolher os dedos). 60s em cada pé, direito primeiro. Progressão: olhos abertos → fechados." },
  ],
};

export const REHAB_MANUTENCAO_1X = {
  id: "manutencao-1x", title: "Manutenção fascite", subtitle: "1x/dia — ao acordar", time: "~8 min", when: "Todos os dias, 1x", color: "#f59e0b",
  exercises: [
    { name: "Alongamento DiGiovanni (fáscia)", detail: "Cada pé", reps: 10, type: "reps",
      how: "Sentado, cruze uma perna sobre a outra. Segure a base dos dedos, puxe para cima e para trás. Palpe a fáscia. 10s x 10 repetições em cada pé, direito primeiro." },
    { name: "Along. panturrilha (joelho reto + dobrado)", sets: 2, duration: 30, type: "timer",
      how: "Mãos na parede. 2x30s joelho reto (gastrocnêmio) + 2x30s joelho dobrado (sóleo)." },
    { name: "Bolinha de tênis na sola", detail: "Cada pé", duration: 120, type: "timer",
      how: "Role a bolinha do calcanhar à base dos dedos. Pressão moderada (≤3/10 de dor). 2 minutos em cada pé." },
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
    // Só o pé direito progride (sets/reps/mochila). Esquerdo e equilíbrio ficam fixos.
    { ...REHAB_CARGA_RATHLEFF.exercises[0], sets, reps, detail: mochila ? "Pé DIREITO · com mochila" : "Pé DIREITO" },
    REHAB_CARGA_RATHLEFF.exercises[1],
    REHAB_CARGA_RATHLEFF.exercises[2],
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

// ══════════════════════ MANUTENÇÃO VITALÍCIA (Bloco 6.1) ══════════════════════
// Ativa quando o plano de 15 semanas termina (03/01/2027, ver App.jsx). Fascite recidiva,
// e a recaída clássica é parar o protocolo assim que melhora — isso existe pra isso nunca
// precisar de decisão manual. Rathleff cai pra 2x/semana fixo (segunda+quinta, indefinido).
// Reativa o protocolo intensivo sozinho se a dor ficar acima da linha de base 3 dias seguidos.
export function diaRathleffManutencao(diaSemana) { return diaSemana === 1 || diaSemana === 4; }

export function precisaReativarManutencao(dorUltimos3Dias, baseline) {
  if (dorUltimos3Dias.length < 3 || baseline == null) return false;
  return dorUltimos3Dias.every(d => d != null && d > baseline);
}

export function getRehabManutencaoVitalicia(diaSemana, reativado) {
  if (reativado) return { base: REHAB_BASE_2X, carga: null, gelo: null, reforcado: true };
  const carga = diaRathleffManutencao(diaSemana) ? cargaComVolume(5, 8, true) : null;
  return { base: REHAB_MANUTENCAO_1X, carga, gelo: REHAB_GELO_POS_CORRIDA, reforcado: false };
}

// ══════════════════════ MOBILIDADE DIRIGIDA (Bloco 3 — avaliação biomecânica 19/08/2021) ══════════════════════
// Prioridade nº1 do fisio: limitação bilateral de dorsiflexão em cadeia fechada
// (pior à direita) + assimetria de rotação de quadril. Alongamento passivo de panturrilha (rotina
// base) não ganha dorsiflexão — mobilização em cadeia fechada sim. Opcional diário, mesmo padrão
// de FORCA_PROTETIVA. NÃO há meta em graus: o relatório tem inconsistência (texto cita ref ≥42°,
// imagens mostram 64°/66° — provavelmente ângulos diferentes). Progresso só em cm, relativo.
export const MOBILIDADE = {
  id: "mobilidade", title: "Mobilidade dirigida", subtitle: "Opcional diário — tornozelo e quadril", time: "~12 min", when: "Qualquer horário", color: "#8b5cf6",
  exercises: [
    { name: "Joelho-à-parede (dorsiflexão)", detail: "Cada pé", sets: 3, reps: 10, type: "exercise", rest: 20,
      how: "Pé a alguns centímetros da parede. Avance o joelho por cima do 2º dedo até tocar a parede, sem o calcanhar sair do chão. Afaste o pé até o limite em que o calcanhar ainda não levanta. 3x10 em cada pé, direito primeiro. No teste quinzenal, meça a distância do dedão à parede em cm." },
    { name: "Mobilização de tornozelo com banda (talar glide)", detail: "Cada pé", sets: 2, reps: 15, type: "exercise", rest: 20,
      how: "Elástico preso baixo, laçado na frente do tornozelo (logo abaixo dos maléolos), puxando o tornozelo pra trás. Pé no chão (ou num degrau), avance o joelho sobre o 2º dedo sem levantar o calcanhar. 2x15 em cada pé." },
    { name: "Clamshell (rotação externa de quadril)", detail: "Cada lado", sets: 3, reps: 12, type: "exercise", rest: 30,
      how: "Deitado de lado, joelhos dobrados, pés juntos. Abra o joelho de cima sem girar o quadril pra trás. 3x12 cada lado. Avaliação de 2021: assimetria de quadril (33° esq / 45° dir) — trabalho pedido foi rotação externa." },
    { name: "Rotação 90/90 de quadril", detail: "Cada lado", sets: 3, reps: 12, type: "exercise", rest: 30,
      how: "Sentado no chão, perna da frente e de trás dobradas a 90°. Troque os joelhos de lado devagar, tronco alto, sem usar as mãos se conseguir. 3x12 trocas (cada lado conta 1)." },
    { name: "Short Foot em pé (apoio unipodal)", detail: "Cada pé", sets: 3, duration: 30, type: "timer",
      how: "Progressão do Short Foot sentado: em um pé só, levante a cúpula do arco sem encolher os dedos. 30s em cada pé, direito primeiro. Ativação de intrínsecos em apoio unipodal (pedido do fisio)." },
  ],
};
