import { useState, useEffect, useRef, useCallback } from "react";

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1100, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f; o.type = "sine";
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
      o.start(t); o.stop(t + 0.22);
    });
  } catch (e) {}
}

// Weight tracking
function getW(key) { try { return JSON.parse(localStorage.getItem("wt_" + key)) || null; } catch { return null; } }
function setW(key, val) { try { localStorage.setItem("wt_" + key, JSON.stringify(val)); } catch {} }

// Muscle group SVG icons
const MG = {
  chest: { label: "Peito", color: "#ef4444" },
  shoulder: { label: "Ombro", color: "#f59e0b" },
  biceps: { label: "Bíceps", color: "#10b981" },
  triceps: { label: "Tríceps", color: "#8b5cf6" },
  back: { label: "Costas", color: "#3b82f6" },
  legs: { label: "Pernas", color: "#ec4899" },
  glutes: { label: "Glúteo", color: "#f97316" },
  core: { label: "Core", color: "#06b6d4" },
  calves: { label: "Panturrilha", color: "#84cc16" },
  hamstring: { label: "Posterior", color: "#e11d48" },
};

function MuscleTag({ groups }) {
  if (!groups) return null;
  return <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
    {groups.map(g => MG[g] ? <span key={g} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: MG[g].color + "22", color: MG[g].color, fontWeight: 600 }}>{MG[g].label}</span> : null)}
  </div>;
}

// Exercise image URLs (free icons from musclewiki-style descriptions)
function ExImg({ img }) {
  if (!img) return null;
  return <div style={{ margin: "8px auto", width: 120, height: 120, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>{img}</div>;
}

const FOOT_PRE = [
  { name: "Tibial anterior sentado", detail: "Ponta dos pés para cima", sets: 3, duration: 30, type: "timer", how: "Sentado, pés no chão. Levante apenas a ponta dos pés mantendo os calcanhares fixos. Mantenha a posição por 30 segundos.", img: "🦶", muscles: ["calves"] },
  { name: "Elev. panturrilha unilateral", detail: "Descer lento 3seg", sets: 3, reps: 12, type: "reps", how: "Em pé, apoie-se em um pé só. Suba na ponta do pé e desça lentamente contando 3 segundos. Faça cada pé.", img: "🦵", muscles: ["calves"] },
  { name: "Tibial posterior elástico", detail: "Para dentro/baixo", sets: 3, reps: 12, type: "reps", how: "Sentado, elástico preso ao pé. Puxe o pé para dentro e para baixo contra a resistência do elástico.", img: "🦶", muscles: ["calves"] },
  { name: "Fibulares elástico", detail: "Para fora", sets: 3, reps: 12, type: "reps", how: "Sentado, elástico preso ao pé. Empurre o pé para fora contra a resistência.", img: "🦶", muscles: ["calves"] },
  { name: "Massagem bolinha", detail: "Rolar na sola", duration: 150, type: "timer", how: "Em pé ou sentado, coloque uma bolinha de tênis sob a sola do pé. Role com pressão média por toda a sola.", img: "🎾" },
  { name: "Catador de toalha", detail: "Dedos dos pés", sets: 3, reps: 10, type: "reps", how: "Coloque uma toalha no chão. Use apenas os dedos dos pés para agarrar e puxar a toalha em sua direção.", img: "🦶" },
  { name: "Equilíbrio unipodal", detail: "Cada pé", sets: 3, duration: 30, type: "timer", how: "Fique em um pé só com olhar fixo à frente. Mantenha o equilíbrio por 30 segundos. Progida para olhos fechados.", img: "🧘" },
];
const WARMUP_RUN = [
  { name: "Caminhada leve", duration: 120, type: "timer", how: "Caminhe com passos largos e braços soltos. Respiração natural." },
  { name: "Elevação joelhos", duration: 30, type: "timer", how: "Em pé, eleve os joelhos alternadamente até a cintura. Braços acompanham o movimento." },
  { name: "Chutes glúteo", duration: 30, type: "timer", how: "Corrida leve no lugar, chutando os calcanhares em direção ao bumbum." },
  { name: "Rotação quadril", detail: "Cada perna", reps: 10, type: "reps", how: "Em pé, eleve o joelho e faça círculos amplos com ele. 10 para cada perna." },
  { name: "Rotação tornozelos", detail: "Cada pé", reps: 10, type: "reps", how: "Eleve um pé e gire o tornozelo em círculos. 10 para cada lado." },
  { name: "Saltitos leves", duration: 30, type: "timer", how: "Pule levemente no lugar, na ponta dos pés, para ativar a panturrilha." },
];
const STRETCH = [
  { name: "Along. panturrilha", detail: "Cada lado", duration: 30, type: "timer", how: "Perna esticada atrás, calcanhar no chão, empurre o quadril para frente na parede." },
  { name: "Along. quadríceps", detail: "Cada lado", duration: 30, type: "timer", how: "Em pé, puxe o pé atrás em direção ao glúteo. Joelhos juntos, quadril para frente." },
  { name: "Along. posterior coxa", detail: "Cada lado", duration: 30, type: "timer", how: "Perna esticada à frente, incline o tronco mantendo as costas retas." },
  { name: "Along. fáscia plantar ⚠️", detail: "ESSENCIAL!", duration: 30, type: "timer", how: "Sentado, puxe os dedos do pé para trás com a mão. Sinta o alongamento na sola. FUNDAMENTAL para pé plano!" },
  { name: "Along. glúteo", detail: "Cada lado", duration: 30, type: "timer", how: "Deitado, coloque o tornozelo sobre o joelho oposto e puxe a coxa em sua direção." },
  { name: "Respiração profunda", detail: "4s/4s/4s", reps: 5, type: "reps", how: "Inspire pelo nariz por 4s, segure 4s, expire pela boca por 4s. Repita 5 vezes." },
];
const ICE = [{ name: "❄️ GELO NOS PÉS", detail: "OBRIGATÓRIO!", duration: 900, type: "timer", isIce: true, how: "Coloque bolsa de gelo ou garrafa congelada na sola dos pés. Use uma toalha fina entre o gelo e a pele. Mantenha por 15 minutos. Previne inflamação da fáscia plantar!" }];

const PHASE_NAMES = ["Fase 1: Adaptação (Sem 1-8)", "Fase 2: Hipertrofia (Sem 9-16)", "Fase 3: Força (Sem 17-24)", "Fase 4: Potência (Sem 25-30)"];
function getMPh(wk) { if (wk <= 8) return 0; if (wk <= 16) return 1; if (wk <= 24) return 2; return 3; }

const FEET_B = [
  { name: "Elev. panturrilha UNILATERAL", detail: "LENTO", sets: 3, reps: 12, type: "reps", how: "Em pé em um degrau, apoie-se em um pé só. Suba na ponta e desça lentamente contando 3 segundos.", img: "🦵", muscles: ["calves"] },
  { name: "Tibial posterior elástico", detail: "Cada pé", sets: 3, reps: 12, type: "reps", how: "Sentado com elástico no pé, puxe para dentro e para baixo.", img: "🦶", muscles: ["calves"] },
  { name: "Fibulares elástico", detail: "Cada pé", sets: 3, reps: 12, type: "reps", how: "Sentado com elástico, empurre o pé para fora.", img: "🦶", muscles: ["calves"] },
  { name: "Massagem bolinha", detail: "Cada pé", duration: 180, type: "timer", how: "Role a bolinha de tênis na sola do pé com pressão média.", img: "🎾" },
  { name: "Along. fáscia plantar", detail: "Cada pé", duration: 30, type: "timer", how: "Puxe os dedos do pé para trás com a mão.", img: "🦶" },
];
const FEET_S = [
  { name: "Elev. panturrilha bilateral", sets: 3, reps: 15, type: "reps", how: "Em pé, suba na ponta dos dois pés e desça controlado.", img: "🦵", muscles: ["calves"] },
  { name: "Massagem bolinha", detail: "Cada pé", duration: 120, type: "timer", how: "Role a bolinha na sola.", img: "🎾" },
  { name: "Along. panturrilha", duration: 30, type: "timer", how: "Pé na parede, empurre o quadril para frente." },
];

// All exercises with: name, detail, sets, reps, rest, type, how, img, muscles, startKg, incPerPhase
const MA = [
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 minutos de cardio leve para aquecer o corpo. FC baixa." },
    { name: "Rotação ombros", reps: 20, type: "reps", how: "Braços soltos, faça 20 círculos amplos para frente e 20 para trás." },
    { name: "Rotação braços", reps: 20, type: "reps", how: "Braços esticados, faça 20 círculos grandes." },
    { name: "Aquec. punhos", reps: 20, type: "reps", how: "Gire os punhos em círculos, 20 para cada direção." },
    { name: "Polichinelos", duration: 30, type: "timer", how: "Jumping jacks leves por 30 segundos para ativar o corpo." },
  ], m: [
    { name: "Supino reto halteres", detail: "PIRÂMIDE", sets: 4, reps: "12-10-8-6", rest: 90, type: "exercise", how: "Deitado no banco reto, halteres na altura do peito. Empurre para cima esticando os braços. Desça controlado até os cotovelos ficarem em 90°. Aumente o peso a cada série.", img: "🏋️", muscles: ["chest", "triceps", "shoulder"], startKg: 12, incPerPhase: 4 },
    { name: "Supino inclinado halteres", detail: "Banco 30-45°", sets: 4, reps: 12, rest: 60, type: "exercise", how: "Banco inclinado a 30-45°. Mesma execução do supino reto. Tempo: 2 segundos subindo, 2 descendo. Foca na parte superior do peito.", img: "🏋️", muscles: ["chest", "shoulder"], startKg: 10, incPerPhase: 2 },
    { name: "Voador/Crossover", detail: "Squeeze peitoral", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Cabos na posição alta, um passo à frente. Puxe as mãos para baixo e para frente, cruzando na frente do peito. Aperte (squeeze) o peitoral no final.", img: "🦾", muscles: ["chest"], startKg: 8, incPerPhase: 2 },
    { name: "Elevação frontal", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Em pé, halteres nas mãos. Braços esticados, eleve à frente até a altura dos ombros. Desça controlado.", img: "💪", muscles: ["shoulder"], startKg: 6, incPerPhase: 2 },
    { name: "Elevação lateral", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Em pé, halteres ao lado do corpo. Cotovelo levemente dobrado, eleve os braços para os lados até a altura dos ombros.", img: "💪", muscles: ["shoulder"], startKg: 5, incPerPhase: 1 },
    { name: "Rosca bíceps W", detail: "PIRÂMIDE", sets: 4, reps: "12-10-8-6", rest: 60, type: "exercise", how: "Em pé, barra W nas mãos (pegada supinada). Flexione os cotovelos trazendo a barra ao peito. Controle a descida (2 seg). Aumente peso a cada série.", img: "💪", muscles: ["biceps"], startKg: 15, incPerPhase: 2.5 },
    { name: "Bíceps concentrado", detail: "Cada braço", sets: 4, reps: 12, rest: 30, type: "exercise", how: "Sentado, cotovelo apoiado na parte interna da coxa. Flexione o braço trazendo o halter ao ombro. Desça lento.", img: "💪", muscles: ["biceps"], startKg: 6, incPerPhase: 2 },
  ], s: [
    { name: "Along. peitoral", detail: "Cada lado", duration: 30, type: "timer", how: "Braço em 90° na parede, gire o corpo para o lado oposto. Sinta o alongamento no peito." },
    { name: "Along. ombro", detail: "Cada lado", duration: 30, type: "timer", how: "Puxe o braço cruzado no peito com a outra mão." },
    { name: "Along. bíceps", detail: "Cada lado", duration: 30, type: "timer", how: "Braço esticado para trás, palma para fora, gire o corpo." },
    { name: "Along. tríceps", detail: "Cada lado", duration: 30, type: "timer", how: "Cotovelo atrás da cabeça, puxe com a outra mão." },
  ]},
  // Phase 2
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 min cardio leve." },
    { name: "Rotação ombros+braços", reps: 20, type: "reps", how: "20 rotações de ombro + 20 de braço." },
    { name: "Supino leve barra vazia", sets: 2, reps: 15, type: "reps", how: "Supino com barra vazia para aquecer articulações." },
    { name: "Polichinelos", duration: 30, type: "timer", how: "Jumping jacks." },
  ], m: [
    { name: "↑ Supino reto BARRA", detail: "UPGRADE → barra! Pirâmide", sets: 4, reps: "12-10-8-6", rest: 90, type: "exercise", how: "Deitado no banco, barra na largura dos ombros. Desça a barra até tocar levemente o peito. Empurre para cima. Mais estável que halteres = mais carga!", img: "🏋️", muscles: ["chest", "triceps", "shoulder"], startKg: 30, incPerPhase: 5 },
    { name: "Supino inclinado halteres", sets: 4, reps: 10, rest: 60, type: "exercise", how: "Banco 30°, mesma execução.", img: "🏋️", muscles: ["chest", "shoulder"], startKg: 12, incPerPhase: 2 },
    { name: "↑ Crucifixo inclinado", detail: "NOVO — abertura ampla", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Banco 30°, halteres acima do peito. Abra os braços em arco amplo com cotovelos levemente flexionados. Volte juntando no topo.", img: "🦾", muscles: ["chest"], startKg: 8, incPerPhase: 2 },
    { name: "↑ Desenvolvimento ombro", detail: "NOVO — sentado", sets: 4, reps: 10, rest: 60, type: "exercise", how: "Sentado, halteres na altura dos ombros. Empurre para cima até os braços estenderem. Desça controlado.", img: "💪", muscles: ["shoulder"], startKg: 10, incPerPhase: 2 },
    { name: "Lateral+Frontal BI-SET", detail: "12+12 SEM desc", sets: 4, reps: "12+12", rest: 45, type: "exercise", how: "Faça 12 elevações laterais, sem descanso faça 12 elevações frontais. Só descansa depois das duas.", img: "💪", muscles: ["shoulder"], startKg: 5, incPerPhase: 1 },
    { name: "↑ Rosca alternada", detail: "NOVO — supinação", sets: 4, reps: 10, rest: 60, type: "exercise", how: "Em pé com halteres. Flexione um braço de cada vez, girando o punho (supinação) no topo do movimento.", img: "💪", muscles: ["biceps"], startKg: 8, incPerPhase: 2 },
    { name: "↑ Rosca martelo", detail: "NOVO — pega neutra", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Como rosca direta mas com pegada neutra (palmas voltadas uma para a outra). Trabalha o braquial.", img: "💪", muscles: ["biceps"], startKg: 8, incPerPhase: 2 },
    { name: "↑ Bíceps Scott", detail: "NOVO — isolamento", sets: 3, reps: 12, rest: 45, type: "exercise", how: "Apoie os braços no banco Scott. Flexione até o topo, desça lento. Isolamento máximo do bíceps.", img: "💪", muscles: ["biceps"], startKg: 12, incPerPhase: 2.5 },
  ], s: [
    { name: "Along. peitoral", detail: "Cada lado", duration: 30, type: "timer", how: "Braço 90° na parede, gire o corpo." },
    { name: "Along. ombro", detail: "Cada lado", duration: 30, type: "timer", how: "Braço cruzado no peito." },
    { name: "Along. bíceps", detail: "Cada lado", duration: 30, type: "timer", how: "Braço para trás, palma fora." },
    { name: "Along. tríceps", detail: "Cada lado", duration: 30, type: "timer", how: "Cotovelo atrás da cabeça." },
  ]},
  // Phase 3
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 min cardio." },
    { name: "Rotação ombros", reps: 20, type: "reps", how: "Círculos amplos." },
    { name: "Supino barra vazia", sets: 2, reps: 15, type: "reps", how: "Aquecimento articular." },
    { name: "Flexão leve", sets: 2, reps: 10, type: "reps", how: "Flexões para ativar peitoral e tríceps." },
  ], m: [
    { name: "Supino reto barra", detail: "PESADO — foco carga", sets: 5, reps: "10-8-6-6-4", rest: 120, type: "exercise", how: "5 séries pesadas com pirâmide. Descanse 2 min entre séries. Peça ajuda de um parceiro nas últimas séries.", img: "🏋️", muscles: ["chest", "triceps", "shoulder"], startKg: 40, incPerPhase: 5 },
    { name: "↑ Supino inclinado BARRA", detail: "UPGRADE", sets: 4, reps: 8, rest: 90, type: "exercise", how: "Banco inclinado com barra. Mais carga que halteres. 8 reps pesadas.", img: "🏋️", muscles: ["chest", "shoulder"], startKg: 30, incPerPhase: 5 },
    { name: "Crossover DROPSET", detail: "Falha→reduzir→continuar", sets: 4, reps: "falha", rest: 45, type: "exercise", how: "Faça até não conseguir mais. Reduza o peso e continue sem descanso até falhar de novo.", img: "🦾", muscles: ["chest"], startKg: 15, incPerPhase: 2.5 },
    { name: "↑ Desenvolvimento Arnold", detail: "NOVO — rotação", sets: 4, reps: 10, rest: 60, type: "exercise", how: "Sentado, comece com halteres na frente do rosto (palmas para você). Ao empurrar para cima, gire as palmas para frente. Descida: gire de volta.", img: "💪", muscles: ["shoulder"], startKg: 10, incPerPhase: 2 },
    { name: "↑ Elevação lateral CABO", detail: "NOVO — tensão constante", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Cabo na posição baixa, puxe lateralmente até a altura do ombro. O cabo mantém tensão em toda amplitude.", img: "💪", muscles: ["shoulder"], startKg: 5, incPerPhase: 1 },
    { name: "Rosca barra reta PIRÂMIDE", sets: 4, reps: "10-8-6-4", rest: 75, type: "exercise", how: "Barra reta, pegada na largura dos ombros. Pirâmide pesada.", img: "💪", muscles: ["biceps"], startKg: 20, incPerPhase: 2.5 },
    { name: "Concentrada+Martelo BI-SET", detail: "10+10", sets: 3, reps: "10+10", rest: 60, type: "exercise", how: "10 roscas concentradas + 10 martelo SEM descanso entre elas.", img: "💪", muscles: ["biceps"], startKg: 8, incPerPhase: 2 },
  ], s: [
    { name: "Along. peitoral", detail: "Cada lado", duration: 30, type: "timer", how: "Na parede." },
    { name: "Along. ombro+bíceps", detail: "Cada lado", duration: 30, type: "timer", how: "Combine os dois alongamentos." },
  ]},
  // Phase 4
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 min cardio." },
    { name: "Rotação ombros", reps: 20, type: "reps", how: "Círculos." },
    { name: "Flexão leve", sets: 2, reps: 12, type: "reps", how: "Ativar peito e tríceps." },
  ], m: [
    { name: "Supino reto barra", detail: "FORÇA MÁXIMA", sets: 4, reps: "8-6-6-4", rest: 120, type: "exercise", how: "Carga pesada, foco em força. Peça ajuda.", img: "🏋️", muscles: ["chest", "triceps", "shoulder"], startKg: 50, incPerPhase: 0 },
    { name: "Supino inclinado halteres", detail: "Volume", sets: 4, reps: 12, rest: 60, type: "exercise", how: "Mais reps, foco na contração.", img: "🏋️", muscles: ["chest", "shoulder"], startKg: 14, incPerPhase: 0 },
    { name: "↑ Fly+Flexão SUPERSET", detail: "12 fly + flexão falha", sets: 3, reps: "12+falha", rest: 60, type: "exercise", how: "12 fly com halteres, sem descanso vá direto para flexões até a falha.", img: "🏋️", muscles: ["chest"], startKg: 10, incPerPhase: 0 },
    { name: "↑ Desenvolvimento militar barra", detail: "NOVO — em pé", sets: 4, reps: 8, rest: 90, type: "exercise", how: "Em pé, barra na frente dos ombros. Empurre acima da cabeça. Composto pesado!", img: "💪", muscles: ["shoulder", "triceps"], startKg: 25, incPerPhase: 0 },
    { name: "Lateral DROPSET", sets: 3, reps: "falha", rest: 45, type: "exercise", how: "Elevação lateral até falha, reduza peso, falha de novo.", img: "💪", muscles: ["shoulder"], startKg: 8, incPerPhase: 0 },
    { name: "↑ Rosca 21s", detail: "NOVO — 7+7+7", sets: 3, reps: 21, rest: 60, type: "exercise", how: "7 reps na metade inferior + 7 na metade superior + 7 completas. Total: 21 reps sem parar!", img: "💪", muscles: ["biceps"], startKg: 10, incPerPhase: 0 },
    { name: "Martelo+Concentrado SUPERSET", detail: "10+10", sets: 3, reps: "10+10", rest: 45, type: "exercise", how: "10 martelo + 10 concentrada sem descanso.", img: "💪", muscles: ["biceps"], startKg: 8, incPerPhase: 0 },
  ], s: [
    { name: "Along. peitoral", detail: "Cada lado", duration: 30, type: "timer", how: "Na parede." },
    { name: "Along. ombro+bíceps", duration: 30, type: "timer", how: "Combine." },
  ]},
];

const MB = [
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 min cardio leve." },
    { name: "Agach. peso corpo", sets: 4, reps: 15, type: "reps", how: "Agachamento sem peso, coxas paralelas ao chão. Aquece quadríceps e glúteos.", muscles: ["legs", "glutes"] },
    { name: "Rotação quadril", detail: "Cada perna", reps: 10, type: "reps", how: "Eleve o joelho e faça círculos amplos." },
    { name: "Balanço pernas", detail: "Cada perna", reps: 10, type: "reps", how: "Segure em algo, balance a perna frente e trás." },
  ], m: [
    { name: "Agachamento livre", detail: "PROGRESSÃO PRIORITÁRIA", sets: 4, reps: 12, rest: 90, type: "exercise", how: "Barra nos ombros (ou smith). Pés na largura dos ombros. Desça até coxas paralelas ao chão. Joelhos na direção dos pés. Suba explosivo.", img: "🏋️", muscles: ["legs", "glutes"], startKg: 30, incPerPhase: 10 },
    { name: "Leg Press 45°", sets: 4, reps: 12, rest: 90, type: "exercise", how: "Pés na largura dos ombros na plataforma. Desça até 90° nos joelhos. Empurre sem travar os joelhos no topo.", img: "🦵", muscles: ["legs", "glutes"], startKg: 60, incPerPhase: 20 },
    { name: "Cadeira extensora", detail: "Contrair topo 1seg", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Sentado, estenda as pernas. No topo, contraia o quadríceps e segure 1 segundo.", img: "🦵", muscles: ["legs"], startKg: 25, incPerPhase: 5 },
    { name: "Stiff halteres", detail: "Costas retas", sets: 4, reps: 12, rest: 60, type: "exercise", how: "Em pé, halteres nas mãos. Empurre o quadril para trás, desça os halteres pelas pernas mantendo costas RETAS. Sinta o posterior da coxa esticar.", img: "🏋️", muscles: ["hamstring", "glutes"], startKg: 10, incPerPhase: 4 },
    { name: "Terra Deadlift", detail: "PIRÂMIDE", sets: 4, reps: "12-10-8-6", rest: 105, type: "exercise", how: "Barra no chão, pés largura dos ombros. Agarre, costas RETAS, empurre o chão com os pés para levantar. NUNCA arredonde as costas!", img: "🏋️", muscles: ["back", "legs", "glutes"], startKg: 40, incPerPhase: 10 },
    { name: "Abdutora+Panturrilha BI-SET", sets: 4, reps: "12+12", rest: 60, type: "exercise", how: "12 reps na cadeira abdutora (empurre os joelhos para fora), sem descanso vá para 12 elevações de panturrilha em pé.", img: "🦵", muscles: ["glutes", "calves"], startKg: 30, incPerPhase: 5 },
    { name: "Prancha abdominal", detail: "Core p/ corrida", sets: 3, duration: 60, rest: 30, type: "timed_exercise", how: "Apoie-se nos antebraços e pontas dos pés. Corpo reto como uma tábua. Não deixe o quadril cair nem subir. Core forte protege a coluna na corrida!", img: "🧘", muscles: ["core"] },
    { name: "Abdominal Tabata", detail: "20s esforço/10s desc ×8", sets: 2, type: "tabata", tabataWork: 20, tabataRest: 10, tabataRounds: 8, rest: 60, how: "8 ciclos de: 20 segundos de abdominal máximo + 10 segundos de descanso. Total: 4 minutos por série. Use abdominais variados (crunch, bicicleta, elevação pernas).", img: "🔥", muscles: ["core"] },
  ], s: [
    { name: "Along. quadríceps", detail: "Cada perna", duration: 30, type: "timer", how: "Puxe o pé atrás, joelhos juntos." },
    { name: "Along. posterior coxa", detail: "Cada perna", duration: 30, type: "timer", how: "Perna esticada, incline o tronco." },
    { name: "Along. glúteo", detail: "Cada lado", duration: 30, type: "timer", how: "Tornozelo sobre joelho oposto, puxe." },
    { name: "Along. adutores", duration: 30, type: "timer", how: "Borboleta sentado, pressione joelhos para baixo." },
    { name: "Along. panturrilha", duration: 30, type: "timer", how: "Pé na parede, empurre quadril." },
  ]},
  // Phase 2
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 min cardio." },
    { name: "Agach. peso corpo", sets: 3, reps: 15, type: "reps", how: "Aquecimento." },
    { name: "Avanço dinâmico", detail: "Cada perna", reps: 10, type: "reps", how: "Dê um passo à frente e desça o joelho traseiro. Alterne as pernas." },
  ], m: [
    { name: "Agachamento PIRÂMIDE", sets: 4, reps: "12-10-8-6", rest: 90, type: "exercise", how: "Mesmo agachamento, agora com pirâmide. Aumente peso a cada série.", img: "🏋️", muscles: ["legs", "glutes"], startKg: 40, incPerPhase: 10 },
    { name: "↑ Búlgaro", detail: "NOVO — pé no banco", sets: 4, reps: 10, rest: 60, type: "exercise", how: "Pé traseiro apoiado no banco atrás de você. Desça o joelho traseiro em direção ao chão. Cada perna separada. Excelente para equilíbrio e corrida!", img: "🦵", muscles: ["legs", "glutes"], startKg: 8, incPerPhase: 4 },
    { name: "Leg Press 45°", sets: 4, reps: 10, rest: 90, type: "exercise", how: "Mesma execução, mais carga.", img: "🦵", muscles: ["legs", "glutes"], startKg: 80, incPerPhase: 20 },
    { name: "↑ Extensora+Flexora BI-SET", detail: "12+12", sets: 4, reps: "12+12", rest: 60, type: "exercise", how: "12 reps na extensora, sem descanso vá para 12 na flexora. Trabalha anterior e posterior juntos.", img: "🦵", muscles: ["legs", "hamstring"], startKg: 25, incPerPhase: 5 },
    { name: "↑ Stiff BARRA", detail: "UPGRADE — mais carga", sets: 4, reps: 10, rest: 75, type: "exercise", how: "Mesma execução do stiff mas com barra. Permite mais carga. Costas RETAS!", img: "🏋️", muscles: ["hamstring", "glutes"], startKg: 30, incPerPhase: 5 },
    { name: "↑ Panturrilha sentado+pé", detail: "15+15", sets: 4, reps: "15+15", rest: 45, type: "exercise", how: "15 elevações sentado (sóleo) + 15 em pé (gastrocnêmio). Dois músculos diferentes!", img: "🦵", muscles: ["calves"], startKg: 20, incPerPhase: 5 },
    { name: "↑ Prancha lateral", detail: "NOVO — cada lado", sets: 3, duration: 30, rest: 15, type: "timed_exercise", how: "Apoie-se em um antebraço, corpo reto de lado. 30 segundos cada lado. Trabalha o oblíquo.", img: "🧘", muscles: ["core"] },
    { name: "↑ Abdominal infra+Roda", detail: "15+10", sets: 3, reps: "15+10", rest: 45, type: "exercise", how: "15 abdominais infraumbilicais (eleve as pernas) + 10 reps na roda abdominal.", img: "🔥", muscles: ["core"] },
  ], s: [
    { name: "Along. quadríceps", detail: "Cada perna", duration: 30, type: "timer", how: "Puxe o pé atrás." },
    { name: "Along. posterior", detail: "Cada perna", duration: 30, type: "timer", how: "Perna esticada, incline." },
    { name: "Along. glúteo+adutores", duration: 30, type: "timer", how: "Combine os dois." },
  ]},
  // Phase 3
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 min cardio." },
    { name: "Agach. peso corpo", sets: 3, reps: 15, type: "reps", how: "Aquecimento." },
    { name: "Agach. barra vazia", sets: 2, reps: 10, type: "reps", how: "Aquecer com barra vazia." },
  ], m: [
    { name: "Agachamento PESADO", detail: "Foco carga", sets: 5, reps: "10-8-6-6-4", rest: 120, type: "exercise", how: "5 séries pesadas. Descanse 2 min. Peça ajuda nas últimas.", img: "🏋️", muscles: ["legs", "glutes"], startKg: 60, incPerPhase: 10 },
    { name: "↑ Leg Press pé alto+baixo", detail: "2 alto + 2 baixo", sets: 4, reps: 10, rest: 90, type: "exercise", how: "2 séries com pés altos (foco glúteo) + 2 com pés baixos (foco quadríceps).", img: "🦵", muscles: ["legs", "glutes"], startKg: 100, incPerPhase: 20 },
    { name: "↑ Passada halteres", detail: "NOVO — funcional corrida", sets: 4, reps: 10, rest: 60, type: "exercise", how: "Com halteres, dê um passo à frente e desça. Alterne as pernas. Exercício muito funcional para corrida!", img: "🏃", muscles: ["legs", "glutes"], startKg: 10, incPerPhase: 4 },
    { name: "↑ Stiff romeno barra", detail: "Amplitude maior", sets: 4, reps: 8, rest: 75, type: "exercise", how: "Como stiff normal mas com mais amplitude. Desça a barra até metade da canela. Costas RETAS!", img: "🏋️", muscles: ["hamstring", "glutes"], startKg: 40, incPerPhase: 5 },
    { name: "Extensora DROPSET", sets: 3, reps: "falha", rest: 45, type: "exercise", how: "Extensora até falha, reduza peso, continue até falha de novo.", img: "🦵", muscles: ["legs"], startKg: 30, incPerPhase: 5 },
    { name: "↑ Mesa flexora", detail: "NOVO — isolamento posterior", sets: 4, reps: 10, rest: 45, type: "exercise", how: "Deitado de bruços, flexione as pernas trazendo os calcanhares ao glúteo.", img: "🦵", muscles: ["hamstring"], startKg: 20, incPerPhase: 5 },
    { name: "Panturrilha unilateral", detail: "Lento", sets: 4, reps: 12, rest: 30, type: "exercise", how: "Um pé só, suba e desça lento.", img: "🦵", muscles: ["calves"], startKg: 0, incPerPhase: 0 },
    { name: "↑ Abdominal c/ carga", detail: "Halter no peito", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Crunch segurando um halter no peito para adicionar resistência.", img: "🔥", muscles: ["core"], startKg: 5, incPerPhase: 2.5 },
  ], s: [
    { name: "Along. quadríceps", detail: "Cada perna", duration: 30, type: "timer", how: "Puxe o pé." },
    { name: "Along. posterior+glúteo", duration: 30, type: "timer", how: "Combine." },
    { name: "Along. panturrilha", duration: 30, type: "timer", how: "Pé na parede." },
  ]},
  // Phase 4
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 min." },
    { name: "Agach. peso corpo", sets: 3, reps: 15, type: "reps", how: "Aquecimento." },
    { name: "Saltos leves", duration: 30, type: "timer", how: "Saltos leves no lugar para ativar pernas." },
  ], m: [
    { name: "Agachamento FORÇA", detail: "Carga pesada", sets: 4, reps: "8-6-6-4", rest: 120, type: "exercise", how: "Carga máxima. Foco em força pura.", img: "🏋️", muscles: ["legs", "glutes"], startKg: 70, incPerPhase: 0 },
    { name: "Búlgaro", detail: "Funcional corrida", sets: 3, reps: 10, rest: 60, type: "exercise", how: "Pé no banco, cada perna.", img: "🦵", muscles: ["legs", "glutes"], startKg: 12, incPerPhase: 0 },
    { name: "↑ Avanço caminhando", detail: "NOVO — específico corrida", sets: 3, reps: 12, rest: 60, type: "exercise", how: "Com halteres, caminhe dando passadas longas. Simula o movimento da corrida com carga.", img: "🏃", muscles: ["legs", "glutes"], startKg: 10, incPerPhase: 0 },
    { name: "↑ Terra sumo", detail: "NOVO — pés largos", sets: 4, reps: 8, rest: 90, type: "exercise", how: "Pés bem afastados, pegada entre as pernas. Trabalha mais adutores e glúteos.", img: "🏋️", muscles: ["legs", "glutes"], startKg: 50, incPerPhase: 0 },
    { name: "Cadeira flexora", sets: 4, reps: 10, rest: 45, type: "exercise", how: "Deitado, flexione pernas.", img: "🦵", muscles: ["hamstring"], startKg: 25, incPerPhase: 0 },
    { name: "Panturrilha em pé", detail: "Resistência p/ meia", sets: 4, reps: 20, rest: 30, type: "exercise", how: "20 reps para resistência muscular — preparação para meia maratona!", img: "🦵", muscles: ["calves"], startKg: 0, incPerPhase: 0 },
    { name: "↑ Circuito Core", detail: "Prancha+Bicicleta+Mountain", sets: 3, duration: 120, rest: 45, type: "timed_exercise", how: "Prancha 45s + Abdominal bicicleta 20 reps + Mountain climber 20 reps. Sem descanso entre exercícios.", img: "🔥", muscles: ["core"] },
  ], s: [
    { name: "Along. quadríceps", detail: "Cada perna", duration: 30, type: "timer", how: "Puxe o pé." },
    { name: "Along. posterior+glúteo", duration: 30, type: "timer", how: "Combine." },
    { name: "Along. adutores+panturrilha", duration: 30, type: "timer", how: "Combine." },
  ]},
];

const MC = [
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 min cardio." },
    { name: "Rotação ombros", reps: 20, type: "reps", how: "Círculos amplos." },
    { name: "Puxada leve", sets: 2, reps: 10, type: "reps", how: "Peso leve para ativar costas.", muscles: ["back"] },
    { name: "Rotação tronco", reps: 20, type: "reps", how: "Braços abertos, gire o tronco." },
  ], m: [
    { name: "Puxada alta", detail: "Até peito", sets: 4, reps: 12, rest: 60, type: "exercise", how: "Pegada aberta na barra. Puxe a barra até o peito, apertando as escápulas. Controle a volta.", img: "🏋️", muscles: ["back", "biceps"], startKg: 35, incPerPhase: 5 },
    { name: "Remada baixa cabo", detail: "Escápulas!", sets: 4, reps: 12, rest: 60, type: "exercise", how: "Sentado no cabo, puxe o triângulo até o abdômen. Cotovelos junto ao corpo. Aperte as escápulas no final.", img: "🏋️", muscles: ["back"], startKg: 30, incPerPhase: 5 },
    { name: "Remada curvada barra", detail: "Até umbigo", sets: 4, reps: 12, rest: 60, type: "exercise", how: "Inclinado para frente, costas retas. Puxe a barra até o umbigo. Desça controlado.", img: "🏋️", muscles: ["back"], startKg: 25, incPerPhase: 5 },
    { name: "Pulldown DROPSET", sets: 4, reps: "falha", rest: 45, type: "exercise", how: "Puxada na polia até falha. Reduza peso, continue sem descanso.", img: "🏋️", muscles: ["back", "biceps"], startKg: 30, incPerPhase: 5 },
    { name: "Remada supinada", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Pegada invertida (palmas para cima) no cabo. Mais ativação do bíceps.", img: "🏋️", muscles: ["back", "biceps"], startKg: 25, incPerPhase: 5 },
    { name: "Tríceps barra reta DROPSET", sets: 4, reps: "falha", rest: 45, type: "exercise", how: "Polia alta, empurre a barra para baixo até os braços estenderem. Falha → reduzir → continuar.", img: "💪", muscles: ["triceps"], startKg: 20, incPerPhase: 5 },
    { name: "Tríceps francês halter", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Sentado ou em pé, halter atrás da cabeça com as duas mãos. Estenda os braços para cima mantendo cotovelos fixos.", img: "💪", muscles: ["triceps"], startKg: 10, incPerPhase: 2 },
    { name: "Peck deck invertido", detail: "Posterior ombro", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Sentado de frente para a máquina. Abra os braços para trás. Trabalha posterior do ombro e parte superior das costas.", img: "💪", muscles: ["shoulder", "back"], startKg: 15, incPerPhase: 5 },
  ], s: [
    { name: "Along. costas", duration: 30, type: "timer", how: "Abraçe os joelhos e arredonde as costas." },
    { name: "Along. lat", detail: "Cada lado", duration: 30, type: "timer", how: "Braço esticado para cima, incline para o lado." },
    { name: "Along. tríceps", detail: "Cada braço", duration: 30, type: "timer", how: "Cotovelo atrás da cabeça, puxe com a outra mão." },
    { name: "Along. ombro posterior", detail: "Cada lado", duration: 30, type: "timer", how: "Puxe braço cruzado no peito." },
  ]},
  // Phase 2
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 min." },
    { name: "Rotação ombros+tronco", reps: 20, type: "reps", how: "Aquecimento articular." },
    { name: "Puxada leve", sets: 2, reps: 10, type: "reps", how: "Ativar costas." },
  ], m: [
    { name: "↑ Puxada aberta", detail: "VARIAÇÃO — pegada larga", sets: 4, reps: 10, rest: 60, type: "exercise", how: "Pegada mais larga que ombros. Foco no dorsal (músculo em V das costas).", img: "🏋️", muscles: ["back"], startKg: 35, incPerPhase: 5 },
    { name: "Remada curvada PIRÂMIDE", sets: 4, reps: "12-10-8-6", rest: 75, type: "exercise", how: "Remada curvada com pirâmide de carga.", img: "🏋️", muscles: ["back"], startKg: 30, incPerPhase: 5 },
    { name: "↑ Remada unilateral", detail: "NOVO — cada braço", sets: 4, reps: 10, rest: 60, type: "exercise", how: "Um joelho e mão no banco, outra mão com halter. Puxe o halter até a cintura. Aperte a escápula.", img: "🏋️", muscles: ["back"], startKg: 12, incPerPhase: 4 },
    { name: "↑ Pullover halter", detail: "NOVO — dorsal+peito", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Deitado no banco, halter acima do peito. Desça atrás da cabeça em arco, braços semi-esticados. Volte ao topo.", img: "🏋️", muscles: ["back", "chest"], startKg: 10, incPerPhase: 2 },
    { name: "Puxada supinada", detail: "Pegada fechada", sets: 4, reps: 10, rest: 60, type: "exercise", how: "Pegada invertida e mais fechada. Mais bíceps.", img: "🏋️", muscles: ["back", "biceps"], startKg: 30, incPerPhase: 5 },
    { name: "↑ Tríceps corda", detail: "VARIAÇÃO — abrir no final", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Polia com corda. No final do movimento, abra as mãos para os lados para contração extra.", img: "💪", muscles: ["triceps"], startKg: 15, incPerPhase: 2.5 },
    { name: "↑ Mergulho banco", detail: "NOVO — pés elevados", sets: 4, reps: "falha", rest: 45, type: "exercise", how: "Mãos no banco atrás, pés em outro banco à frente. Flexione os cotovelos descendo o corpo. Suba.", img: "💪", muscles: ["triceps", "chest"] },
    { name: "↑ Face pull", detail: "NOVO — saúde ombro", sets: 3, reps: 15, rest: 30, type: "exercise", how: "Polia alta com corda. Puxe em direção ao rosto, abrindo os cotovelos. Essencial para saúde do ombro e postura!", img: "💪", muscles: ["shoulder", "back"], startKg: 10, incPerPhase: 2.5 },
  ], s: [
    { name: "Along. costas", duration: 30, type: "timer", how: "Abraçar joelhos." },
    { name: "Along. lat", detail: "Cada lado", duration: 30, type: "timer", how: "Inclinar." },
    { name: "Along. tríceps", detail: "Cada braço", duration: 30, type: "timer", how: "Cotovelo atrás." },
    { name: "Along. ombro", detail: "Cada lado", duration: 30, type: "timer", how: "Braço cruzado." },
  ]},
  // Phase 3
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 min." },
    { name: "Rotação ombros", reps: 20, type: "reps", how: "Círculos." },
    { name: "Puxada leve", sets: 2, reps: 10, type: "reps", how: "Ativar." },
  ], m: [
    { name: "↑ Barra fixa", detail: "NOVO — bodyweight!", sets: 4, reps: "máximo", rest: 90, type: "exercise", how: "Pegada pronada na barra. Puxe o corpo até o queixo passar a barra. Se não conseguir, use o gravitron (máquina assistida).", img: "🏋️", muscles: ["back", "biceps"] },
    { name: "↑ Remada T barra", detail: "NOVO — composto pesado", sets: 4, reps: 10, rest: 75, type: "exercise", how: "Barra em T, inclinado. Puxe com as duas mãos até o peito. Excelente para espessura das costas.", img: "🏋️", muscles: ["back"], startKg: 20, incPerPhase: 5 },
    { name: "Remada curvada pesada", sets: 4, reps: 8, rest: 75, type: "exercise", how: "4x8 pesada. Costas retas!", img: "🏋️", muscles: ["back"], startKg: 40, incPerPhase: 5 },
    { name: "Pulldown invertido DROPSET", sets: 3, reps: "falha", rest: 45, type: "exercise", how: "Puxada com pegada invertida até falha, reduza, continue.", img: "🏋️", muscles: ["back", "biceps"], startKg: 35, incPerPhase: 5 },
    { name: "↑ Tríceps francês EZ", detail: "PIRÂMIDE", sets: 4, reps: "12-10-8-6", rest: 60, type: "exercise", how: "Deitado, barra EZ. Desça atrás da cabeça, estenda os braços. Pirâmide de carga.", img: "💪", muscles: ["triceps"], startKg: 15, incPerPhase: 2.5 },
    { name: "↑ Corda+Barra SUPERSET", detail: "12+12", sets: 3, reps: "12+12", rest: 60, type: "exercise", how: "12 reps no tríceps corda + 12 na barra reta SEM descanso.", img: "💪", muscles: ["triceps"], startKg: 15, incPerPhase: 2.5 },
    { name: "↑ Encolhimento trapézio", detail: "NOVO", sets: 4, reps: 12, rest: 45, type: "exercise", how: "Halteres ou barra nas mãos. Encolha os ombros como se fosse tocar as orelhas. Segure no topo 1 segundo.", img: "💪", muscles: ["back"], startKg: 14, incPerPhase: 4 },
    { name: "Face pull", detail: "Saúde ombro", sets: 3, reps: 15, rest: 30, type: "exercise", how: "Polia alta, puxe ao rosto.", img: "💪", muscles: ["shoulder", "back"], startKg: 12, incPerPhase: 2.5 },
  ], s: [
    { name: "Along. costas+lat", duration: 30, type: "timer", how: "Combine." },
    { name: "Along. tríceps", detail: "Cada braço", duration: 30, type: "timer", how: "Cotovelo atrás." },
    { name: "Along. ombro", detail: "Cada lado", duration: 30, type: "timer", how: "Braço cruzado." },
  ]},
  // Phase 4
  { w: [
    { name: "Esteira/bike leve", duration: 300, type: "timer", how: "5 min." },
    { name: "Rotação ombros", reps: 20, type: "reps", how: "Círculos." },
    { name: "Barra fixa leve", sets: 2, reps: 8, type: "reps", how: "Aquecimento na barra." },
  ], m: [
    { name: "Barra fixa", detail: "Bata recorde!", sets: 4, reps: "máximo", rest: 90, type: "exercise", how: "Máx reps em cada série. Anote e tente superar!", img: "🏋️", muscles: ["back", "biceps"] },
    { name: "↑ Remada Pendlay", detail: "NOVO — potência", sets: 4, reps: "6-8", rest: 90, type: "exercise", how: "Barra no chão entre cada rep. Puxe explosivamente até o abdômen. Volte ao chão. Potência!", img: "🏋️", muscles: ["back"], startKg: 40, incPerPhase: 0 },
    { name: "Remada unilateral", detail: "Cada braço", sets: 3, reps: 10, rest: 60, type: "exercise", how: "Halter, um braço de cada vez.", img: "🏋️", muscles: ["back"], startKg: 16, incPerPhase: 0 },
    { name: "↑ Pullover+Pulldown SUPERSET", detail: "12+12", sets: 3, reps: "12+12", rest: 60, type: "exercise", how: "12 pullover + 12 pulldown SEM descanso.", img: "🏋️", muscles: ["back", "chest"], startKg: 12, incPerPhase: 0 },
    { name: "↑ Paralelas", detail: "NOVO — bodyweight", sets: 4, reps: "máximo", rest: 60, type: "exercise", how: "Nas barras paralelas, desça até cotovelos em 90° e suba. Se fácil, adicione peso.", img: "💪", muscles: ["triceps", "chest"] },
    { name: "↑ Tríceps kickback", detail: "NOVO — cada braço", sets: 3, reps: 12, rest: 30, type: "exercise", how: "Inclinado, cotovelo fixo junto ao corpo. Estenda o braço para trás.", img: "💪", muscles: ["triceps"], startKg: 6, incPerPhase: 0 },
    { name: "Face pull", sets: 3, reps: 15, rest: 30, type: "exercise", how: "Saúde do ombro. Polia ao rosto.", img: "💪", muscles: ["shoulder", "back"], startKg: 15, incPerPhase: 0 },
    { name: "↑ Encolhimento+Peck inv BI-SET", detail: "12+12", sets: 3, reps: "12+12", rest: 45, type: "exercise", how: "12 encolhimento trapézio + 12 peck deck invertido SEM descanso.", img: "💪", muscles: ["back", "shoulder"], startKg: 14, incPerPhase: 0 },
  ], s: [
    { name: "Along. costas+lat", duration: 30, type: "timer", how: "Combine." },
    { name: "Along. tríceps+ombro", duration: 30, type: "timer", how: "Combine." },
  ]},
];

function mkT(n,d,dur,rec){const s=[];for(let i=1;i<=n;i++){s.push({n:"Tiro "+i+" — "+d+" Z4",d:"147-164 bpm",dur});s.push({n:"Recuperação",d:"Caminhada leve",dur:rec});}return s;}
const RD=[
  {q:"Fartlek 20min",qS:[{n:"Fartlek",d:"Varie o ritmo livremente!",dur:1200}],e:3,l:3.5},
  {q:"4x400m Z4 rec 2min",qS:mkT(4,"400m",150,120),e:3.5,l:4},
  {q:"Fartlek 25min",qS:[{n:"Fartlek",d:"Varie o ritmo",dur:1500}],e:4,l:4.5},
  {q:"5x400m Z4 rec 2min",qS:mkT(5,"400m",150,120),e:4,l:5},
  {q:"3km leve Z2",qS:[{n:"Corrida Z2",d:"110-127 bpm"}],e:3,test:"🎯 TESTE 5KM!",tD:5},
  {q:"4x600m Z4",qS:mkT(4,"600m",210,120),e:5,l:5.5},
  {q:"Fartlek 25min",qS:[{n:"Fartlek",d:"Varie o ritmo",dur:1500}],e:5,l:6},
  {q:"5x600m Z4",qS:mkT(5,"600m",210,120),e:5.5,l:6.5},
  {q:"Tempo Run 15min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:900}],e:5.5,l:7},
  {q:"4km leve Z2",qS:[{n:"Corrida Z2",d:"Teste!"}],e:4,test:"🎯 TESTE 7KM!",tD:7},
  {q:"4x800m Z4",qS:mkT(4,"800m",270,180),e:7,l:7.5},
  {q:"Tempo Run 20min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:1200}],e:7,l:8},
  {q:"4x1000m Z4",qS:mkT(4,"1km",330,210),e:7.5,l:9},
  {q:"5km leve Z2",qS:[{n:"Corrida Z2",d:"Teste!"}],e:5,test:"🎯 TESTE 10KM!",tD:10},
  {q:"5x800m Z4",qS:mkT(5,"800m",270,180),e:8,l:10},
  {q:"Tempo Run 25min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:1500}],e:8,l:10},
  {q:"Fartlek 30min",qS:[{n:"Fartlek",d:"Varie o ritmo",dur:1800}],e:8,l:11},
  {q:"6km Z2",qS:[{n:"Corrida Z2",d:"Teste pace!"}],e:6,test:"🎯 10km pace",tD:10},
  {q:"5x1000m Z4",qS:mkT(5,"1km",330,180),e:8,l:12},
  {q:"Tempo Run 30min Z3",qS:[{n:"Tempo Run Z3",d:"Ritmo meia!",dur:1800}],e:8,l:12},
  {q:"4x1200m Z4",qS:mkT(4,"1.2km",400,240),e:9,l:13},
  {q:"Tempo Run 35min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:2100}],e:9,l:14},
  {q:"5x1200m Z4",qS:mkT(5,"1.2km",400,180),e:9,l:15},
  {q:"6km Z2",qS:[{n:"Corrida Z2",d:"Teste!"}],e:6,test:"🎯 TESTE 15KM!",tD:15},
  {q:"Tempo Run 35min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:2100}],e:10,l:16},
  {q:"5x1000m Z4",qS:mkT(5,"1km",330,180),e:10,l:17},
  {q:"Tempo Run 40min Z3",qS:[{n:"Tempo Run Z3",d:"Pico!",dur:2400}],e:10,l:18},
  {q:"Fartlek 35min",qS:[{n:"Fartlek",d:"Varie o ritmo",dur:2100}],e:8,l:19},
  {q:"4x800m TAPER",qS:mkT(4,"800m",270,180),e:8,l:10},
  {q:"5km Z2",qS:[{n:"Corrida Z2",d:"Antes da MEIA!"}],e:3,test:"🏆 21KM!",tD:21},
];

const SL=["Musculação A","Corrida Qualidade","Musculação B","Corrida Leve","Musculação C","Corrida Longa"];
const SS=["A","🏃","B","🏃","C","🏃‍♂️"];const SIC=["🏋️","🏃","🦵","🏃","💪","🏃‍♂️"];
const SCO=["#2E7D32","#E65100","#1565C0","#E65100","#4A148C","#B71C1C"];
const PH=[{n:"FASE 1: 3km→5km",a:1,b:5,c:"#2E7D32"},{n:"FASE 2: 5km→7km",a:6,b:10,c:"#1565C0"},{n:"FASE 3: 7km→10km",a:11,b:14,c:"#E65100"},{n:"FASE 4: Consol 10km",a:15,b:18,c:"#4A148C"},{n:"FASE 5: 10km→15km",a:19,b:24,c:"#B71C1C"},{n:"FASE 6: Meia!",a:25,b:30,c:"#F57F17"}];
const gp=w=>PH.find(p=>w>=p.a&&w<=p.b)||PH[0];

function bm(phases,wk){const p=getMPh(wk),m=phases[p],r=[];
  r.push({section:"🔥 AQUECIMENTO"});m.w.forEach(e=>r.push({...e,ph:"w"}));
  r.push({section:"💪 TREINO — "+PHASE_NAMES[p]});m.m.forEach(e=>r.push({...e,ph:"m"}));
  r.push({section:"🧘 ALONGAMENTO"});m.s.forEach(e=>r.push({...e,ph:"s"}));
  r.push({section:"🦶 FORTALECIMENTO PÉS"});(phases===MB?FEET_B:FEET_S).forEach(e=>r.push({...e,ph:"f"}));
  return r;}

function br(wk,rt){const rd=RD[wk-1];if(!rd)return[];const r=[];
  r.push({section:"🦶 PÉS PRÉ-CORRIDA"});FOOT_PRE.forEach(e=>r.push({...e,ph:"fp"}));
  r.push({section:"🔥 AQUECIMENTO"});WARMUP_RUN.forEach(e=>r.push({...e,ph:"w"}));
  r.push({section:"🏃 CORRIDA"});r.push({name:"Aquecimento: Caminhada",detail:"Z1 (92-109 bpm)",duration:300,type:"timer",ph:"r",how:"Caminhe 5 min em ritmo leve para preparar o corpo."});
  if(rt==="q")rd.qS.forEach(x=>r.push({name:x.n,detail:x.d,duration:x.dur,type:x.dur?"timer":"manual",ph:"r"}));
  else if(rt==="e")r.push({name:"Corrida Z2 — "+rd.e+"km",detail:"110-127 bpm",type:"manual",ph:"r",how:"Corra em ritmo leve e constante. Você deve conseguir conversar."});
  else if(rt==="l"){if(rd.test)r.push({name:rd.test,detail:"Z2 — "+rd.tD+"km",type:"manual",ph:"r",isTest:true,how:"Corrida contínua em Z2. NÃO ACELERE no início! O objetivo é COMPLETAR."});else r.push({name:"Longão Z2 — "+rd.l+"km",detail:"Ritmo de CONVERSA",type:"manual",ph:"r",how:"Corrida longa em ritmo de conversa. Esse é o treino MAIS IMPORTANTE da semana!"});}
  r.push({name:"Volta à calma",detail:"Caminhada Z1",duration:300,type:"timer",ph:"r",how:"Caminhe 5 min para normalizar a FC."});
  r.push({section:"🧘 ALONGAMENTO PÓS"});STRETCH.forEach(e=>r.push({...e,ph:"s"}));
  r.push({section:"❄️ GELO NOS PÉS"});ICE.forEach(e=>r.push({...e,ph:"i"}));return r;}

function bw(wk,si){if(si===0)return bm(MA,wk);if(si===1)return br(wk,"q");if(si===2)return bm(MB,wk);if(si===3)return br(wk,"e");if(si===4)return bm(MC,wk);if(si===5)return br(wk,"l");return[];}
function ft(s){if(s==null)return"--:--";return Math.floor(s/60)+":"+(s%60).toString().padStart(2,"0");}
function grd(wk,si){const r=RD[wk-1];if(!r)return"";if(si===1)return r.q;if(si===3)return r.e?r.e+"km Z2":"";if(si===5)return r.test||(r.l?r.l+"km Longão":"");return"";}

function CT({time,total,running,color}){const r=70,circ=2*Math.PI*r,off=circ*(1-(total>0?(total-time)/total:0));
  return<svg viewBox="0 0 160 160" style={{width:180,height:180}}><circle cx="80" cy="80" r={r} fill="none" stroke="#1a1a2e" strokeWidth="8"/><circle cx="80" cy="80" r={r} fill="none" stroke={color||"#4ade80"} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{transform:"rotate(-90deg)",transformOrigin:"center",transition:"stroke-dashoffset 0.3s"}}/><text x="80" y="72" textAnchor="middle" fill="white" fontSize="32" fontWeight="800" fontFamily="monospace">{ft(time)}</text><text x="80" y="98" textAnchor="middle" fill="#94a3b8" fontSize="11">{running?"EM ANDAMENTO":time===0?"CONCLUÍDO ✓":"PAUSADO"}</text></svg>;}
function CU({time,running}){return<svg viewBox="0 0 160 160" style={{width:180,height:180}}><circle cx="80" cy="80" r="70" fill="none" stroke="#1a1a2e" strokeWidth="8"/><circle cx="80" cy="80" r="70" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="8 6" style={{animation:running?"spin 8s linear infinite":"none"}}/><text x="80" y="72" textAnchor="middle" fill="white" fontSize="32" fontWeight="800" fontFamily="monospace">{ft(time)}</text><text x="80" y="98" textAnchor="middle" fill="#94a3b8" fontSize="11">{running?"CORRENDO...":"PAUSADO"}</text></svg>;}

function PV({steps}){return<div style={{maxHeight:"55vh",overflowY:"auto"}}>{steps.map((s,i)=>s.section?<div key={i} style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginTop:14,marginBottom:6}}>{s.section}</div>:<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:"rgba(255,255,255,0.03)",borderRadius:8,marginBottom:3}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:s.name&&s.name.startsWith("↑")?"#4ade80":"#e2e8f0"}}>{s.name}</div>{s.detail&&<div style={{fontSize:11,color:"#64748b"}}>{s.detail}</div>}<MuscleTag groups={s.muscles}/></div><div style={{fontSize:11,color:"#475569",textAlign:"right",minWidth:55}}>{s.sets&&s.reps?s.sets+"x"+s.reps:s.duration&&!s.sets?ft(s.duration):s.sets&&s.duration?s.sets+"x"+ft(s.duration):s.reps?s.reps+" reps":""}</div></div>)}</div>;}

// Tabata component
function TabataTimer({work,rest:restT,rounds,onDone,color}){
  const[round,setRound]=useState(1),[phase,setPhase]=useState("work"),[time,setTime]=useState(work),[running,setRunning]=useState(false),[done,setDone]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{if(running&&time>0){ref.current=setInterval(()=>setTime(t=>t-1),1000);}else{clearInterval(ref.current);if(time===0&&running){playBeep();if(phase==="work"&&round<=rounds){setPhase("rest");setTime(restT);}else if(phase==="rest"){if(round<rounds){setRound(r=>r+1);setPhase("work");setTime(work);}else{setRunning(false);setDone(true);}}}}return()=>clearInterval(ref.current);},[running,time,phase,round,rounds,work,restT]);
  const total=phase==="work"?work:restT;
  const isWork=phase==="work";
  return<div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:isWork?"#ef4444":"#4ade80",marginBottom:4}}>{done?"COMPLETO!":isWork?"💥 ESFORÇO":"😮‍💨 DESCANSO"}</div><div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>Round {round}/{rounds}</div><CT time={time} total={total} running={running} color={isWork?"#ef4444":"#4ade80"}/>{!running&&!done&&<button onClick={()=>setRunning(true)} style={{marginTop:12,padding:"10px 28px",background:color,color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>{time===work&&round===1?"▶ Iniciar Tabata":"▶ Continuar"}</button>}{running&&<button onClick={()=>setRunning(false)} style={{marginTop:12,padding:"10px 28px",background:"#334155",color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>⏸ Pausar</button>}{done&&<button onClick={onDone} style={{marginTop:12,padding:"10px 28px",background:"#4ade80",color:"#0f0f1a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>✓ Concluído</button>}</div>;
}

export default function App(){
  const[wk,setWk]=useState(1),[ses,setSes]=useState(2),[scr,setScr]=useState("home");
  const[pvS,setPvS]=useState(0),[sI,setSIdx]=useState(0),[cS,setCS]=useState(1);
  const[tmr,setTmr]=useState(0),[tmrOn,setTmrOn]=useState(false),[rst,setRst]=useState(false);
  const[cup,setCup]=useState(0),[cupOn,setCupOn]=useState(false),[ok,setOk]=useState(false);
  const[showHow,setShowHow]=useState(false),[showWt,setShowWt]=useState(false),[wtInput,setWtInput]=useState("");
  const iR=useRef(null),cR=useRef(null),bp=useRef(false);

  useEffect(()=>{(async()=>{try{const r=localStorage.getItem("tp6");if(r){const d=JSON.parse(r);setWk(d.w||1);setSes(d.s!==undefined?d.s:2);}}catch(e){}setOk(true);})();},[]);
  const sv=useCallback((w,s)=>{try{localStorage.setItem("tp6",JSON.stringify({w,s}))}catch(e){}},[]);

  useEffect(()=>{if(tmrOn&&tmr>0){bp.current=false;iR.current=setInterval(()=>setTmr(t=>t-1),1000);}else{clearInterval(iR.current);if(tmr===0&&tmrOn){setTmrOn(false);if(!bp.current){playBeep();bp.current=true;}}}return()=>clearInterval(iR.current);},[tmrOn,tmr]);
  useEffect(()=>{if(cupOn)cR.current=setInterval(()=>setCup(t=>t+1),1000);else clearInterval(cR.current);return()=>clearInterval(cR.current);},[cupOn]);

  const all=bw(wk,ses),steps=all.filter(s=>!s.section),step=steps[sI],ph=gp(wk),tot=steps.length,mph=getMPh(wk);
  function curSec(){let sec="",c=0;for(const s of all){if(s.section){sec=s.section;continue;}if(c===sI)return sec;c++;}return sec;}
  function startAny(si){setSes(si);sv(wk,si);setSIdx(0);setCS(1);setRst(false);setTmr(0);setTmrOn(false);setCup(0);setCupOn(false);setShowHow(false);setShowWt(false);const w=bw(wk,si),st=w.filter(x=>!x.section);if(st[0]&&st[0].duration&&st[0].type==="timer")setTmr(st[0].duration);setScr("workout");}
  function adv(){let ns=ses+1,nw=wk;if(ns>=6){ns=0;nw=Math.min(wk+1,30);}setSes(ns);setWk(nw);sv(nw,ns);setScr("home");}
  function nxt(){setTmrOn(false);setCupOn(false);setRst(false);setCS(1);setCup(0);setShowHow(false);setShowWt(false);if(sI+1>=tot){adv();return;}const n=steps[sI+1];setSIdx(sI+1);if(n&&n.duration&&n.type==="timer")setTmr(n.duration);else setTmr(0);}
  function dn(){const mx=step.sets||1;if(cS<mx){if(step.rest){setRst(true);setTmr(step.rest);setTmrOn(true);}setCS(cS+1);}else nxt();}

  // Weight helpers
  const wtKey=step?step.name.replace(/[^a-zA-Z]/g,"")+"_"+mph:"";
  const savedWt=step?getW(wtKey):null;
  const suggestedWt=step&&step.startKg?(step.startKg+mph*step.incPerPhase):null;

  if(!ok)return<div style={{background:"#0f0f1a",color:"white",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui"}}><p style={{opacity:.6}}>Carregando...</p></div>;
  const G="@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}";
  const bb=(bg,cl)=>({padding:"14px 0",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",background:bg,color:cl,flex:1});

  if(scr==="preview"){const pw=bw(wk,pvS),desc=grd(wk,pvS),isMu=pvS===0||pvS===2||pvS===4;
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:16,maxWidth:480,margin:"0 auto"}}><style>{G}</style>
      <button onClick={()=>setScr("home")} style={{background:"none",border:"none",color:"#94a3b8",fontSize:14,cursor:"pointer",padding:4,marginBottom:12}}>← Voltar</button>
      <div style={{display:"flex",gap:5,marginBottom:16,overflowX:"auto",paddingBottom:4}}>{[0,1,2,3,4,5].map(i=><button key={i} onClick={()=>setPvS(i)} style={{padding:"7px 12px",borderRadius:10,border:"none",cursor:"pointer",whiteSpace:"nowrap",fontSize:11,fontWeight:i===pvS?800:500,background:i===pvS?SCO[i]:"rgba(255,255,255,0.06)",color:i===pvS?"white":"#94a3b8"}}>{SS[i]}</button>)}</div>
      <div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:36,marginBottom:4}}>{SIC[pvS]}</div><div style={{fontSize:20,fontWeight:800}}>{SL[pvS]}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Semana {wk} — {ph.n}</div>{isMu&&<div style={{fontSize:11,color:"#4ade80",marginTop:4}}>🏋️ {PHASE_NAMES[mph]}</div>}{desc&&<div style={{fontSize:13,color:SCO[pvS],fontWeight:600,marginTop:6,background:SCO[pvS]+"18",borderRadius:8,padding:"4px 12px",display:"inline-block"}}>{desc}</div>}</div>
      <PV steps={pw}/>
      <button onClick={()=>startAny(pvS)} style={{width:"100%",marginTop:16,padding:"14px 0",background:"linear-gradient(135deg,"+SCO[pvS]+","+SCO[pvS]+"cc)",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:"pointer",letterSpacing:1,textTransform:"uppercase"}}>INICIAR ESTE TREINO</button></div>;}

  if(scr==="home"){const desc=grd(wk,ses);
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto"}}><style>{G}</style>
      <div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:12,color:"#94a3b8",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Treino Híbrido</div><div style={{fontSize:28,fontWeight:800,background:"linear-gradient(135deg,"+ph.c+",#4ade80)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>SEMANA {wk}/30</div><div style={{fontSize:12,color:ph.c,fontWeight:600,marginTop:4}}>{ph.n}</div><div style={{fontSize:10,color:"#64748b",marginTop:4}}>🏋️ {PHASE_NAMES[mph]}</div></div>
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:4,marginBottom:16}}><div style={{display:"flex",gap:2}}>{[0,1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:6,borderRadius:3,background:i<ses?SCO[i]:i===ses?SCO[i]+"99":"#1a1a2e",animation:i===ses?"pulse 2s infinite":"none"}}/>)}</div><div style={{display:"flex",justifyContent:"space-between",padding:"6px 2px 2px",fontSize:9,color:"#64748b"}}>{SS.map((l,i)=><span key={i} style={{flex:1,textAlign:"center",fontWeight:i===ses?700:400,color:i===ses?"white":"#64748b"}}>{l}</span>)}</div></div>
      <div style={{background:"linear-gradient(135deg,"+SCO[ses]+"22,"+SCO[ses]+"08)",border:"1px solid "+SCO[ses]+"44",borderRadius:20,padding:28,textAlign:"center",marginBottom:20}}><div style={{fontSize:56,marginBottom:8}}>{SIC[ses]}</div><div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Próximo treino</div><div style={{fontSize:22,fontWeight:800,marginBottom:6}}>{SL[ses]}</div>{desc&&<div style={{fontSize:14,color:SCO[ses],fontWeight:600,background:SCO[ses]+"18",borderRadius:8,padding:"6px 14px",display:"inline-block"}}>{desc}</div>}</div>
      <button onClick={()=>startAny(ses)} style={{width:"100%",padding:"16px 0",fontSize:17,fontWeight:800,background:"linear-gradient(135deg,"+SCO[ses]+","+SCO[ses]+"cc)",color:"white",border:"none",borderRadius:14,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>INICIAR TREINO</button>
      {ses===3&&<button onClick={adv} style={{width:"100%",padding:"12px 0",fontSize:13,fontWeight:600,background:"transparent",color:"#94a3b8",border:"1px solid #334155",borderRadius:12,cursor:"pointer",marginBottom:6}}>Pular corrida leve (semana 2x)</button>}
      <button onClick={adv} style={{width:"100%",padding:"10px 0",fontSize:12,background:"transparent",color:"#475569",border:"none",cursor:"pointer"}}>Pular treino →</button>
      <div style={{marginTop:24}}><div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Treinos — toque para ver ou iniciar</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[0,1,2,3,4,5].map(i=><button key={i} onClick={()=>{setPvS(i);setScr("preview")}} style={{padding:"12px 6px",borderRadius:12,border:i===ses?"2px solid "+SCO[i]:"1px solid #1e293b",background:i===ses?SCO[i]+"15":"rgba(255,255,255,0.02)",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:22,marginBottom:2}}>{SIC[i]}</div><div style={{fontSize:10,color:i===ses?SCO[i]:"#94a3b8",fontWeight:i===ses?700:500}}>{SL[i].replace("Musculação ","").replace("Corrida ","")}</div>{i===ses&&<div style={{fontSize:8,color:SCO[i],marginTop:2,fontWeight:700}}>PRÓXIMO</div>}</button>)}</div></div>
      <div style={{marginTop:20,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:16}}><div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Ajustar posição</div><div style={{display:"flex",gap:8,alignItems:"center"}}><label style={{fontSize:12,color:"#94a3b8",minWidth:55}}>Semana</label><input type="range" min="1" max="30" value={wk} onChange={e=>{const w=+e.target.value;setWk(w);sv(w,ses)}} style={{flex:1,accentColor:ph.c}}/><span style={{fontSize:14,fontWeight:700,minWidth:24,textAlign:"center"}}>{wk}</span></div></div></div>;}

  if(scr==="workout"&&step){const sec=curSec(),iT=step.type==="timer"||step.type==="timed_exercise",iE=step.type==="exercise"||step.type==="timed_exercise",isTab=step.type==="tabata",mx=step.sets||1,pc=step.ph==="r"?"#E65100":step.ph==="fp"||step.ph==="f"?"#F57F17":step.ph==="i"?"#0ea5e9":step.ph==="w"?"#F57F17":step.ph==="s"?"#1565C0":SCO[ses];
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:16,maxWidth:480,margin:"0 auto"}}><style>{G}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><button onClick={()=>{setTmrOn(false);setCupOn(false);setScr("home")}} style={{background:"none",border:"none",color:"#94a3b8",fontSize:14,cursor:"pointer",padding:4}}>← Sair</button><div style={{fontSize:12,color:"#64748b"}}>{sI+1}/{tot}</div></div>
      <div style={{height:4,background:"#1a1a2e",borderRadius:2,marginBottom:12}}><div style={{height:4,borderRadius:2,background:pc,width:((sI+1)/tot*100)+"%",transition:"width 0.3s"}}/></div>
      <div style={{fontSize:12,color:pc,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8,textAlign:"center"}}>{sec}</div>
      
      {/* Exercise info */}
      <div style={{textAlign:"center",marginBottom:8}}>
        {step.img&&<ExImg img={step.img}/>}
        <div style={{fontSize:20,fontWeight:800,marginBottom:4,lineHeight:1.3,color:step.name&&step.name.startsWith("↑")?"#4ade80":"white"}}>{step.name}</div>
        {step.detail&&<div style={{fontSize:13,color:"#94a3b8",lineHeight:1.4}}>{step.detail}</div>}
        <MuscleTag groups={step.muscles}/>
        
        {/* Weight info */}
        {step.type==="exercise"&&step.startKg&&<div style={{marginTop:8,display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
          {savedWt&&<span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:"#4ade8022",color:"#4ade80"}}>Último: {savedWt}kg</span>}
          {suggestedWt&&<span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:"#3b82f622",color:"#3b82f6"}}>Sugerido: {suggestedWt}kg</span>}
          <button onClick={()=>setShowWt(!showWt)} style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:"rgba(255,255,255,0.1)",color:"#94a3b8",border:"none",cursor:"pointer"}}>{showWt?"✕":"✏️ Peso"}</button>
        </div>}
        {showWt&&<div style={{marginTop:8,display:"flex",gap:6,justifyContent:"center",alignItems:"center"}}><input type="number" value={wtInput} onChange={e=>setWtInput(e.target.value)} placeholder="kg" style={{width:60,padding:"6px 8px",borderRadius:8,border:"1px solid #334155",background:"#1a1a2e",color:"white",fontSize:14,textAlign:"center"}}/><button onClick={()=>{if(wtInput){setW(wtKey,parseFloat(wtInput));setWtInput("");setShowWt(false)}}} style={{padding:"6px 12px",borderRadius:8,background:"#4ade80",color:"#0f0f1a",border:"none",fontSize:12,fontWeight:700,cursor:"pointer"}}>Salvar</button></div>}
        
        {/* How button */}
        {step.how&&<button onClick={()=>setShowHow(!showHow)} style={{marginTop:8,fontSize:11,padding:"4px 12px",borderRadius:8,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"1px solid #334155",cursor:"pointer"}}>{showHow?"Fechar":"📖 Como fazer"}</button>}
        {showHow&&step.how&&<div style={{marginTop:8,padding:12,background:"rgba(255,255,255,0.04)",borderRadius:10,fontSize:12,color:"#cbd5e1",lineHeight:1.5,textAlign:"left"}}>{step.how}</div>}
      </div>

      {/* Tabata */}
      {isTab&&<TabataTimer work={step.tabataWork} rest={step.tabataRest} rounds={step.tabataRounds} onDone={()=>{if(cS<(step.sets||1)){if(step.rest){setRst(true);setTmr(step.rest);setTmrOn(true);}setCS(cS+1);}else nxt();}} color={pc}/>}

      {iE&&!rst&&!isTab&&<div style={{textAlign:"center",marginBottom:8}}><div style={{display:"inline-flex",gap:6,marginBottom:8}}>{Array.from({length:mx},(_,i)=><div key={i} style={{width:32,height:32,borderRadius:"50%",background:i<cS-1?pc:i===cS-1?pc+"66":"#1a1a2e",border:i===cS-1?"2px solid "+pc:"2px solid #1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:i<cS?"white":"#475569"}}>{i<cS-1?"✓":i+1}</div>)}</div><div style={{fontSize:14,fontWeight:700}}>Série {cS}/{mx}{step.reps?" — "+(typeof step.reps==="string"?(step.reps.split("-")[cS-1]||step.reps):step.reps)+" reps":""}</div></div>}
      {rst&&<div style={{textAlign:"center",marginBottom:8}}><div style={{fontSize:13,color:"#94a3b8",marginBottom:4}}>⏱ DESCANSO</div><CT time={tmr} total={step.rest||60} running={tmrOn} color={pc}/></div>}
      {iT&&!rst&&!iE&&step.duration&&<div style={{textAlign:"center",marginBottom:8}}><CT time={tmr} total={step.duration} running={tmrOn} color={step.isIce?"#0ea5e9":pc}/></div>}
      {iE&&step.type==="timed_exercise"&&!rst&&<div style={{textAlign:"center",marginBottom:8}}><CT time={tmr} total={step.duration||60} running={tmrOn} color={pc}/></div>}
      {step.type==="manual"&&<div style={{textAlign:"center",marginBottom:8}}><CU time={cup} running={cupOn}/>{!cupOn&&cup===0&&<button onClick={()=>setCupOn(true)} style={{marginTop:12,padding:"10px 28px",background:pc,color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>▶ Iniciar</button>}{cupOn&&<button onClick={()=>setCupOn(false)} style={{marginTop:12,padding:"10px 28px",background:"#334155",color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>⏸ Pausar</button>}{!cupOn&&cup>0&&<button onClick={()=>setCupOn(true)} style={{marginTop:12,padding:"10px 28px",background:pc,color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>▶ Continuar</button>}</div>}
      
      <div style={{display:"flex",gap:10,marginTop:16}}>
        {iT&&!rst&&!iE&&step.duration&&<>{!tmrOn&&tmr>0&&<button onClick={()=>setTmrOn(true)} style={bb(pc,"white")}>▶ {tmr===step.duration?"Iniciar":"Continuar"}</button>}{tmrOn&&<button onClick={()=>setTmrOn(false)} style={bb("#334155","white")}>⏸ Pausar</button>}{tmr===0&&!tmrOn&&<button onClick={nxt} style={bb("#4ade80","#0f0f1a")}>✓ Próximo</button>}</>}
        {iE&&step.type==="timed_exercise"&&!rst&&<>{!tmrOn&&<button onClick={()=>{setTmr(step.duration||60);setTmrOn(true)}} style={bb(pc,"white")}>▶ Série {cS}</button>}{tmrOn&&<button onClick={()=>setTmrOn(false)} style={bb("#334155","white")}>⏸ Pausar</button>}{tmr===0&&!tmrOn&&<button onClick={dn} style={bb("#4ade80","#0f0f1a")}>✓ Concluída</button>}</>}
        {iE&&step.type==="exercise"&&!rst&&<button onClick={dn} style={bb("#4ade80","#0f0f1a")}>✓ Série {cS} concluída</button>}
        {rst&&<>{tmr>0&&<button onClick={()=>{setRst(false);setTmrOn(false);setTmr(0)}} style={bb("#334155","white")}>Pular descanso</button>}{tmr===0&&<button onClick={()=>{setRst(false);setTmr(0)}} style={bb("#4ade80","#0f0f1a")}>✓ Próxima série</button>}</>}
        {step.type==="reps"&&!step.sets&&<button onClick={nxt} style={bb("#4ade80","#0f0f1a")}>✓ Concluído</button>}
        {step.type==="reps"&&step.sets&&<button onClick={dn} style={bb("#4ade80","#0f0f1a")}>✓ Série {cS}/{mx}</button>}
        {step.type==="manual"&&<button onClick={()=>{setCupOn(false);nxt()}} style={bb("#4ade80","#0f0f1a")}>✓ Concluído</button>}
      </div>
      <button onClick={nxt} style={{width:"100%",marginTop:10,padding:"10px 0",background:"transparent",color:"#475569",border:"none",fontSize:12,cursor:"pointer"}}>Pular passo →</button>
      {sI+1<tot&&<div style={{marginTop:16,padding:12,background:"rgba(255,255,255,0.03)",borderRadius:10,borderLeft:"3px solid "+pc+"33"}}><div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>A seguir</div><div style={{fontSize:13,color:"#94a3b8"}}>{steps[sI+1]&&steps[sI+1].name}</div></div>}
      {step.isTest&&<div style={{marginTop:16,padding:14,background:pc+"15",borderRadius:12,border:"1px solid "+pc+"33",textAlign:"center"}}><div style={{fontSize:24,marginBottom:4}}>🎯</div><div style={{fontSize:13,color:pc,fontWeight:700}}>DIA DE TESTE!</div><div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>Não acelere! O objetivo é COMPLETAR!</div></div>}</div>;}

  return<div style={{background:"#0f0f1a",color:"white",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><p>Carregando...</p></div>;
}
