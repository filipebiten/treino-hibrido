// ══════════════════════ CORRIDA — 15 semanas, progressão por macrofase ══════════════════════
export const FOOT_PRE = [
  { name: "Tibial anterior sentado", detail: "Ponta dos pés para cima", sets: 3, duration: 30, type: "timer", how: "Sentado, pés no chão. Levante a ponta dos pés mantendo calcanhares fixos. 30 segundos." },
  { name: "Elev. panturrilha unilateral", detail: "Descer lento 3seg", sets: 3, reps: 12, type: "reps", how: "Em pé num pé só. Suba na ponta e desça contando 3 segundos." },
  { name: "Tibial posterior elástico", detail: "Para dentro/baixo", sets: 3, reps: 12, type: "reps", how: "Elástico no pé, puxe para dentro e para baixo." },
  { name: "Fibulares elástico", detail: "Para fora", sets: 3, reps: 12, type: "reps", how: "Elástico no pé, empurre para fora." },
  { name: "Massagem bolinha", detail: "Rolar na sola", duration: 150, type: "timer", how: "Bolinha de tênis sob a sola, role com pressão média." },
  { name: "Catador de toalha", detail: "Dedos dos pés", sets: 3, reps: 10, type: "reps", how: "Toalha no chão, agarre com os dedos." },
  { name: "Equilíbrio unipodal", detail: "Cada pé", sets: 3, duration: 30, type: "timer", how: "Fique num pé só, olhar fixo, 30 segundos cada." },
];
export const WARMUP_RUN = [
  { name: "Caminhada leve", duration: 120, type: "timer", how: "Caminhe com passos largos." },
  { name: "Elevação joelhos", duration: 30, type: "timer", how: "Eleve joelhos alternados até a cintura." },
  { name: "Chutes glúteo", duration: 30, type: "timer", how: "Chute calcanhares ao bumbum." },
  { name: "Rotação quadril", detail: "Cada perna", reps: 10, type: "reps", how: "Eleve joelho e faça círculos." },
  { name: "Rotação tornozelos", detail: "Cada pé", reps: 10, type: "reps", how: "Gire tornozelo em círculos." },
  { name: "Saltitos leves", duration: 30, type: "timer", how: "Pule leve na ponta dos pés." },
];
export const STRETCH = [
  { name: "Along. panturrilha", detail: "Cada lado", duration: 30, type: "timer", how: "Perna atrás, calcanhar no chão, empurre quadril." },
  { name: "Along. quadríceps", detail: "Cada lado", duration: 30, type: "timer", how: "Puxe pé atrás, joelhos juntos." },
  { name: "Along. posterior coxa", detail: "Cada lado", duration: 30, type: "timer", how: "Perna esticada, incline tronco." },
  { name: "Along. fáscia plantar ⚠️", detail: "ESSENCIAL!", duration: 30, type: "timer", how: "Puxe dedos para trás. FUNDAMENTAL!" },
  { name: "Along. glúteo", detail: "Cada lado", duration: 30, type: "timer", how: "Tornozelo sobre joelho oposto, puxe." },
  { name: "Respiração profunda", detail: "4s/4s/4s", reps: 5, type: "reps", how: "Inspire 4s, segure 4s, expire 4s." },
];
export const ICE = [{ name: "❄️ Gelo nos pés", detail: "Obrigatório", duration: 900, type: "timer", isIce: true, how: "Gelo na sola dos pés com toalha fina entre o gelo e a pele. 15 minutos." }];

function mkT(n, d, dur, rec) { const s = []; for (let i = 1; i <= n; i++) { s.push({ name: "Tiro " + i + " — " + d + " Z4", detail: "147-164 bpm", duration: dur, type: "timer", ph: "r" }); s.push({ name: "Recuperação", detail: "Caminhada", duration: rec, type: "timer", ph: "r" }); } return s; }
function mkWR(ciclos, corridaSeg, caminhadaSeg) {
  const s = [];
  for (let i = 1; i <= ciclos; i++) {
    s.push({ name: "Corrida " + i, duration: corridaSeg, type: "timer", ph: "r", how: "Ritmo Z1-Z2 confortável — consegue conversar sem ofegar." });
    s.push({ name: "Caminhada " + i, duration: caminhadaSeg, type: "timer", ph: "r", how: "Recuperação ativa, caminhada." });
  }
  return s;
}

// ══════════════════════ M1 — SÓ CAMINHADA (testes de liberação, 1x/semana) ══════════════════════
export const CAMINHADAS_M1 = [
  { id: "cam_s1_20", semanaIdx: 0, minutos: 20, nome: "Caminhar 20min em piso plano" },
  { id: "cam_s2_30", semanaIdx: 1, minutos: 30, nome: "Caminhar 30min" },
  { id: "cam_s3_40", semanaIdx: 2, minutos: 40, nome: "Caminhar 40min com trechos em ritmo forte" },
  { id: "cam_s4_45", semanaIdx: 3, minutos: 45, nome: "Caminhar 45min com trechos em ritmo forte" },
];
// Gate M1→M2 exige os 3 primeiros testes (o 4º/S4 é extra, útil pra quem acelera com dor baixa).
export const CAMINHADAS_GATE_IDS = ["cam_s1_20", "cam_s2_30", "cam_s3_40"];

export function buildCaminhadaSession(semanaIdx) {
  const cfg = CAMINHADAS_M1[Math.min(semanaIdx, CAMINHADAS_M1.length - 1)];
  const r = [];
  r.push({ section: "AQUECIMENTO" });
  r.push({ name: "Caminhada leve", duration: 120, type: "timer", ph: "w", how: "2 min pra aquecer antes do teste." });
  r.push({ section: "TESTE — " + cfg.nome });
  r.push({ name: cfg.nome, duration: cfg.minutos * 60, type: "timer", ph: "r", isTest: true, how: "Ritmo confortável, sem forçar. Anote a dor durante e confira na manhã seguinte." });
  r.push({ section: "ALONGAMENTO" });
  STRETCH.forEach(e => r.push({ ...e, ph: "s" }));
  r.push({ section: "GELO NOS PÉS" });
  ICE.forEach(e => r.push({ ...e, ph: "i" }));
  return { steps: r, testeId: cfg.id, testeNome: cfg.nome };
}

// ══════════════════════ M2 — WALK/RUN INTERVALADO ══════════════════════
const WALKRUN_M2 = [
  { nome: "1min corrida / 2min caminhada", ciclos: 8, corrida: 60, caminhada: 120 },
  { nome: "2min corrida / 2min caminhada", ciclos: 6, corrida: 120, caminhada: 120 },
  { nome: "3min corrida / 1min caminhada", ciclos: 6, corrida: 180, caminhada: 60 },
  { nome: "5min corrida / 1min caminhada", ciclos: 5, corrida: 300, caminhada: 60 },
];

export function buildWalkRunSession(semanaIdx) {
  const cfg = WALKRUN_M2[Math.min(semanaIdx, WALKRUN_M2.length - 1)];
  const r = [];
  r.push({ section: "AQUECIMENTO" });
  r.push({ name: "Caminhada rápida", duration: 300, type: "timer", ph: "w", how: "5 min pra aquecer antes dos intervalos." });
  r.push({ section: "WALK/RUN — " + cfg.nome });
  mkWR(cfg.ciclos, cfg.corrida, cfg.caminhada).forEach(e => r.push(e));
  r.push({ section: "ALONGAMENTO" });
  STRETCH.forEach(e => r.push({ ...e, ph: "s" }));
  r.push({ section: "GELO PÓS-CORRIDA" });
  ICE.forEach(e => r.push({ ...e, ph: "i" }));
  return { steps: r, resumo: Math.round(cfg.ciclos * cfg.corrida / 60) + "min corrida" };
}

// ══════════════════════ M3 — CONTÍNUO (3km→5km) ══════════════════════
const CONTINUO_M3 = [
  { qualidade: { nome: "Fartlek 15min", steps: [{ name: "Fartlek", detail: "Varie o ritmo!", duration: 900, type: "timer", ph: "r" }] }, longao: { km: 3, teste: null } },
  { qualidade: { nome: "4x400m Z4", steps: mkT(4, "400m", 150, 120) }, longao: { km: 4, teste: null } },
  { qualidade: { nome: "Fartlek 20min", steps: [{ name: "Fartlek", detail: "Varie o ritmo", duration: 1200, type: "timer", ph: "r" }] }, longao: { km: 5, teste: null } },
  { qualidade: { nome: "4x400m Z4", steps: mkT(4, "400m", 150, 120) }, longao: { km: 5, teste: "🎯 TESTE 5KM CONTÍNUO Z2" } },
];

// ══════════════════════ M4 — META (6,5km→10km) ══════════════════════
const META_M4 = [
  { qualidade: { nome: "Tempo Run 15min Z3", steps: [{ name: "Tempo Run Z3", detail: "129-145 bpm", duration: 900, type: "timer", ph: "r" }] }, longao: { km: 6.5, teste: null } },
  { qualidade: { nome: "Fartlek 25min", steps: [{ name: "Fartlek", detail: "Varie", duration: 1500, type: "timer", ph: "r" }] }, longao: { km: 8, teste: null } },
  { qualidade: { nome: "4km leve", steps: [{ name: "Corrida Z2", detail: "Leve, sem pressa", duration: null, type: "manual", ph: "r" }] }, longao: { km: 10, teste: "🎯 TESTE 10KM — run/walk 9:1" } },
];

function buildQualidadeSession(cfg) {
  const r = [];
  r.push({ section: "PÉS PRÉ-CORRIDA" }); FOOT_PRE.forEach(e => r.push({ ...e, ph: "fp" }));
  r.push({ section: "AQUECIMENTO" }); WARMUP_RUN.forEach(e => r.push({ ...e, ph: "w" }));
  r.push({ section: "CORRIDA — " + cfg.nome });
  r.push({ name: "Aquecimento: Caminhada", detail: "Z1 (92-109 bpm)", duration: 300, type: "timer", ph: "r", how: "Caminhe 5 min." });
  cfg.steps.forEach(s => r.push(s));
  r.push({ name: "Volta à calma", detail: "Caminhada Z1", duration: 300, type: "timer", ph: "r", how: "5 min caminhada." });
  r.push({ section: "ALONGAMENTO PÓS" }); STRETCH.forEach(e => r.push({ ...e, ph: "s" }));
  r.push({ section: "GELO NOS PÉS" }); ICE.forEach(e => r.push({ ...e, ph: "i" }));
  return r;
}

function buildLongaoSession(cfg) {
  const r = [];
  r.push({ section: "PÉS PRÉ-CORRIDA" }); FOOT_PRE.forEach(e => r.push({ ...e, ph: "fp" }));
  r.push({ section: "AQUECIMENTO" }); WARMUP_RUN.forEach(e => r.push({ ...e, ph: "w" }));
  r.push({ section: cfg.teste ? "🎯 TESTE" : "LONGÃO" });
  r.push({ name: cfg.teste || ("Longão Z2 — " + cfg.km + "km"), detail: cfg.teste ? "Z2 — " + cfg.km + "km" : "Ritmo de conversa", type: "manual", ph: "r", isTest: !!cfg.teste, how: cfg.teste ? "NÃO ACELERE! Completar é o objetivo." : "Ritmo de conversa, sem pressa." });
  r.push({ section: "ALONGAMENTO PÓS" }); STRETCH.forEach(e => r.push({ ...e, ph: "s" }));
  r.push({ section: "GELO NOS PÉS" }); ICE.forEach(e => r.push({ ...e, ph: "i" }));
  return r;
}

export function buildContinuoSession(semanaIdx, tipo) {
  const cfg = CONTINUO_M3[Math.min(semanaIdx, CONTINUO_M3.length - 1)];
  return tipo === "q" ? { steps: buildQualidadeSession(cfg.qualidade), resumo: cfg.qualidade.nome, teste: null }
    : { steps: buildLongaoSession(cfg.longao), resumo: cfg.longao.km + "km" + (cfg.longao.teste ? " — " + cfg.longao.teste : ""), teste: cfg.longao.teste };
}

export function buildMetaSession(semanaIdx, tipo) {
  const cfg = META_M4[Math.min(semanaIdx, META_M4.length - 1)];
  return tipo === "q" ? { steps: buildQualidadeSession(cfg.qualidade), resumo: cfg.qualidade.nome, teste: null }
    : { steps: buildLongaoSession(cfg.longao), resumo: cfg.longao.km + "km" + (cfg.longao.teste ? " — " + cfg.longao.teste : ""), teste: cfg.longao.teste };
}
