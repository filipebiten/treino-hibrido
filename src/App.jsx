import { useState, useEffect, useRef, useCallback } from "react";

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1100, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f; o.type = "sine";
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      o.start(t); o.stop(t + 0.2);
    });
  } catch (e) {}
}

const FOOT_PRE = [
  { name: "Tibial anterior sentado", detail: "Ponta dos pés para cima", sets: 3, duration: 30, type: "timer" },
  { name: "Elev. panturrilha unilateral", detail: "Descer lento 3seg", sets: 3, reps: 12, type: "reps" },
  { name: "Tibial posterior elástico", detail: "Para dentro/baixo", sets: 3, reps: 12, type: "reps" },
  { name: "Fibulares elástico", detail: "Para fora", sets: 3, reps: 12, type: "reps" },
  { name: "Massagem bolinha", detail: "Rolar na sola", duration: 150, type: "timer" },
  { name: "Catador de toalha", detail: "Dedos dos pés", sets: 3, reps: 10, type: "reps" },
  { name: "Equilíbrio unipodal", detail: "Cada pé", sets: 3, duration: 30, type: "timer" },
];
const WARMUP_RUN = [
  { name: "Caminhada leve", duration: 120, type: "timer" },
  { name: "Elevação joelhos", duration: 30, type: "timer" },
  { name: "Chutes glúteo", duration: 30, type: "timer" },
  { name: "Rotação quadril", detail: "Cada perna", reps: 10, type: "reps" },
  { name: "Rotação tornozelos", detail: "Cada pé", reps: 10, type: "reps" },
  { name: "Saltitos leves", duration: 30, type: "timer" },
];
const STRETCH = [
  { name: "Along. panturrilha", detail: "Cada lado", duration: 30, type: "timer" },
  { name: "Along. quadríceps", detail: "Cada lado", duration: 30, type: "timer" },
  { name: "Along. posterior coxa", detail: "Cada lado", duration: 30, type: "timer" },
  { name: "Along. fáscia plantar ⚠️", detail: "ESSENCIAL!", duration: 30, type: "timer" },
  { name: "Along. glúteo", detail: "Cada lado", duration: 30, type: "timer" },
  { name: "Respiração profunda", detail: "4s/4s/4s", reps: 5, type: "reps" },
];
const ICE = [{ name: "❄️ GELO NOS PÉS", detail: "Toalha entre gelo e pele!", duration: 900, type: "timer", isIce: true }];

const PHASE_NAMES = [
  "Fase 1: Adaptação (Sem 1-8) — 4x12",
  "Fase 2: Hipertrofia (Sem 9-16) — 4x10",
  "Fase 3: Força (Sem 17-24) — 5x pirâmide",
  "Fase 4: Potência (Sem 25-30) — funcional"
];
function getMPh(wk) { if (wk <= 8) return 0; if (wk <= 16) return 1; if (wk <= 24) return 2; return 3; }

const FEET_M1 = [
  { name: "Elev. panturrilha UNILATERAL", detail: "LENTO", sets: 3, reps: 12, type: "reps" },
  { name: "Tibial posterior elástico", detail: "Cada pé", sets: 3, reps: 12, type: "reps" },
  { name: "Fibulares elástico", detail: "Cada pé", sets: 3, reps: 12, type: "reps" },
  { name: "Massagem bolinha", detail: "Cada pé", duration: 180, type: "timer" },
  { name: "Along. fáscia plantar", detail: "Cada pé", duration: 30, type: "timer" },
];
const FEET_S = [
  { name: "Elev. panturrilha bilateral", sets: 3, reps: 15, type: "reps" },
  { name: "Massagem bolinha", detail: "Cada pé", duration: 120, type: "timer" },
  { name: "Along. panturrilha", duration: 30, type: "timer" },
];

// Treino A per phase
const MA = [
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Rotação ombros",reps:20,type:"reps"},{name:"Rotação braços",reps:20,type:"reps"},{name:"Aquec. punhos",reps:20,type:"reps"},{name:"Polichinelos",duration:30,type:"timer"}],
    m:[{name:"Supino reto halteres",detail:"PIRÂMIDE",sets:4,reps:"12-10-8-6",rest:90,type:"exercise"},{name:"Supino inclinado halteres",detail:"Banco 30-45°",sets:4,reps:12,rest:60,type:"exercise"},{name:"Voador/Crossover",detail:"Squeeze peitoral",sets:4,reps:12,rest:45,type:"exercise"},{name:"Elevação frontal",sets:4,reps:12,rest:45,type:"exercise"},{name:"Elevação lateral",sets:4,reps:12,rest:45,type:"exercise"},{name:"Rosca bíceps W",detail:"PIRÂMIDE",sets:4,reps:"12-10-8-6",rest:60,type:"exercise"},{name:"Bíceps concentrado",detail:"Cada braço",sets:4,reps:12,rest:30,type:"exercise"}],
    s:[{name:"Along. peitoral",detail:"Cada lado",duration:30,type:"timer"},{name:"Along. ombro",detail:"Cada lado",duration:30,type:"timer"},{name:"Along. bíceps",detail:"Cada lado",duration:30,type:"timer"},{name:"Along. tríceps",detail:"Cada lado",duration:30,type:"timer"}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Rotação ombros+braços",reps:20,type:"reps"},{name:"Supino leve",detail:"Barra vazia",sets:2,reps:15,type:"reps"},{name:"Polichinelos",duration:30,type:"timer"}],
    m:[{name:"↑ Supino reto BARRA",detail:"UPGRADE halteres→barra! Pirâmide",sets:4,reps:"12-10-8-6",rest:90,type:"exercise"},{name:"Supino inclinado halteres",detail:"Banco 30°",sets:4,reps:10,rest:60,type:"exercise"},{name:"↑ Crucifixo inclinado",detail:"NOVO — abertura ampla",sets:4,reps:12,rest:45,type:"exercise"},{name:"↑ Desenvolvimento ombro",detail:"NOVO — sentado, substitui frontal",sets:4,reps:10,rest:60,type:"exercise"},{name:"Lateral+Frontal BI-SET",detail:"12+12 SEM desc",sets:4,reps:"12+12",rest:45,type:"exercise"},{name:"↑ Rosca alternada",detail:"NOVO — supinação no topo",sets:4,reps:10,rest:60,type:"exercise"},{name:"↑ Rosca martelo",detail:"NOVO — pega neutra",sets:4,reps:12,rest:45,type:"exercise"},{name:"↑ Bíceps Scott",detail:"NOVO — isolamento",sets:3,reps:12,rest:45,type:"exercise"}],
    s:[{name:"Along. peitoral",detail:"Cada lado",duration:30,type:"timer"},{name:"Along. ombro",detail:"Cada lado",duration:30,type:"timer"},{name:"Along. bíceps",detail:"Cada lado",duration:30,type:"timer"},{name:"Along. tríceps",detail:"Cada lado",duration:30,type:"timer"}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Rotação ombros",reps:20,type:"reps"},{name:"Supino barra vazia",sets:2,reps:15,type:"reps"},{name:"Flexão leve",sets:2,reps:10,type:"reps"}],
    m:[{name:"Supino reto barra",detail:"PESADO — foco carga",sets:5,reps:"10-8-6-6-4",rest:120,type:"exercise"},{name:"↑ Supino inclinado BARRA",detail:"UPGRADE halter→barra",sets:4,reps:8,rest:90,type:"exercise"},{name:"Crossover DROPSET",detail:"Falha→reduzir→continuar",sets:4,reps:"falha",rest:45,type:"exercise"},{name:"↑ Desenvolvimento Arnold",detail:"NOVO — rotação durante press",sets:4,reps:10,rest:60,type:"exercise"},{name:"↑ Elevação lateral CABO",detail:"NOVO — tensão constante",sets:4,reps:12,rest:45,type:"exercise"},{name:"Rosca barra reta",detail:"PIRÂMIDE pesada",sets:4,reps:"10-8-6-4",rest:75,type:"exercise"},{name:"Concentrada+Martelo",detail:"BI-SET 10+10",sets:3,reps:"10+10",rest:60,type:"exercise"}],
    s:[{name:"Along. peitoral",detail:"Cada lado",duration:30,type:"timer"},{name:"Along. ombro+bíceps",detail:"Cada lado",duration:30,type:"timer"}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Rotação ombros",reps:20,type:"reps"},{name:"Flexão leve",sets:2,reps:12,type:"reps"}],
    m:[{name:"Supino reto barra",detail:"FORÇA MÁXIMA",sets:4,reps:"8-6-6-4",rest:120,type:"exercise"},{name:"Supino inclinado halteres",detail:"Volume contração",sets:4,reps:12,rest:60,type:"exercise"},{name:"↑ Fly+Flexão SUPERSET",detail:"NOVO — 12 fly + flexão falha",sets:3,reps:"12+falha",rest:60,type:"exercise"},{name:"↑ Desenvolvimento militar barra",detail:"NOVO — composto pesado em pé",sets:4,reps:8,rest:90,type:"exercise"},{name:"Lateral DROPSET",detail:"Falha→reduzir→falha",sets:3,reps:"falha",rest:45,type:"exercise"},{name:"↑ Rosca 21s",detail:"NOVO — 7 baixo+7 alto+7 completas",sets:3,reps:21,rest:60,type:"exercise"},{name:"Martelo+Concentrado",detail:"SUPERSET 10+10",sets:3,reps:"10+10",rest:45,type:"exercise"}],
    s:[{name:"Along. peitoral",detail:"Cada lado",duration:30,type:"timer"},{name:"Along. ombro+bíceps",duration:30,type:"timer"}]},
];

// Treino B per phase
const MB = [
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Agach. peso corpo",sets:4,reps:15,type:"reps"},{name:"Rotação quadril",detail:"Cada perna",reps:10,type:"reps"},{name:"Balanço pernas",detail:"Cada perna",reps:10,type:"reps"}],
    m:[{name:"Agachamento livre",detail:"PROGRESSÃO PRIORITÁRIA",sets:4,reps:12,rest:90,type:"exercise"},{name:"Leg Press 45°",sets:4,reps:12,rest:90,type:"exercise"},{name:"Cadeira extensora",detail:"Contrair topo 1seg",sets:4,reps:12,rest:45,type:"exercise"},{name:"Stiff halteres",detail:"Costas retas",sets:4,reps:12,rest:60,type:"exercise"},{name:"Terra Deadlift",detail:"PIRÂMIDE",sets:4,reps:"12-10-8-6",rest:105,type:"exercise"},{name:"Abdutora+Panturrilha",detail:"BI-SET SEM desc",sets:4,reps:"12+12",rest:60,type:"exercise"},{name:"Prancha abdominal",detail:"Core p/ corrida",sets:3,duration:60,rest:30,type:"timed_exercise"},{name:"Abdominal Tabata",detail:"20s/10s×8",sets:2,duration:240,rest:60,type:"timed_exercise"}],
    s:[{name:"Along. quadríceps",detail:"Cada perna",duration:30,type:"timer"},{name:"Along. posterior",detail:"Cada perna",duration:30,type:"timer"},{name:"Along. glúteo",detail:"Cada lado",duration:30,type:"timer"},{name:"Along. adutores",duration:30,type:"timer"},{name:"Along. panturrilha",duration:30,type:"timer"}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Agach. peso corpo",sets:3,reps:15,type:"reps"},{name:"Avanço dinâmico",detail:"Cada perna",reps:10,type:"reps"}],
    m:[{name:"Agachamento PIRÂMIDE",detail:"Progressão carga",sets:4,reps:"12-10-8-6",rest:90,type:"exercise"},{name:"↑ Búlgaro",detail:"NOVO — pé no banco, cada perna",sets:4,reps:10,rest:60,type:"exercise"},{name:"Leg Press 45°",sets:4,reps:10,rest:90,type:"exercise"},{name:"↑ Extensora+Flexora BI-SET",detail:"NOVO — 12+12",sets:4,reps:"12+12",rest:60,type:"exercise"},{name:"↑ Stiff BARRA",detail:"UPGRADE — mais carga",sets:4,reps:10,rest:75,type:"exercise"},{name:"↑ Panturrilha sentado+pé",detail:"NOVO — 15+15",sets:4,reps:"15+15",rest:45,type:"exercise"},{name:"↑ Prancha lateral",detail:"NOVO — cada lado",sets:3,duration:30,rest:15,type:"timed_exercise"},{name:"↑ Abdominal infra+Roda",detail:"NOVO — 15+10",sets:3,reps:"15+10",rest:45,type:"exercise"}],
    s:[{name:"Along. quadríceps",detail:"Cada perna",duration:30,type:"timer"},{name:"Along. posterior",detail:"Cada perna",duration:30,type:"timer"},{name:"Along. glúteo+adutores",duration:30,type:"timer"}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Agach. peso corpo",sets:3,reps:15,type:"reps"},{name:"Agach. barra vazia",sets:2,reps:10,type:"reps"}],
    m:[{name:"Agachamento PESADO",detail:"Foco carga máxima",sets:5,reps:"10-8-6-6-4",rest:120,type:"exercise"},{name:"↑ Leg Press pé alto+baixo",detail:"NOVO — 2 alto(glúteo)+2 baixo(quad)",sets:4,reps:10,rest:90,type:"exercise"},{name:"↑ Passada halteres",detail:"NOVO — funcional p/ corrida",sets:4,reps:10,rest:60,type:"exercise"},{name:"↑ Stiff romeno barra",detail:"UPGRADE — amplitude maior",sets:4,reps:8,rest:75,type:"exercise"},{name:"Extensora DROPSET",detail:"Falha→reduzir→falha",sets:3,reps:"falha",rest:45,type:"exercise"},{name:"↑ Mesa flexora",detail:"NOVO — isolamento posterior",sets:4,reps:10,rest:45,type:"exercise"},{name:"Panturrilha unilateral",detail:"Lento",sets:4,reps:12,rest:30,type:"exercise"},{name:"↑ Abdominal c/ carga",detail:"NOVO — halter no peito",sets:4,reps:12,rest:45,type:"exercise"}],
    s:[{name:"Along. quadríceps",detail:"Cada perna",duration:30,type:"timer"},{name:"Along. posterior+glúteo",duration:30,type:"timer"},{name:"Along. panturrilha",duration:30,type:"timer"}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Agach. peso corpo",sets:3,reps:15,type:"reps"},{name:"Saltos leves",duration:30,type:"timer"}],
    m:[{name:"Agachamento FORÇA",detail:"Carga pesada",sets:4,reps:"8-6-6-4",rest:120,type:"exercise"},{name:"Búlgaro",detail:"Funcional p/ corrida",sets:3,reps:10,rest:60,type:"exercise"},{name:"↑ Avanço caminhando",detail:"NOVO — específico corrida",sets:3,reps:12,rest:60,type:"exercise"},{name:"↑ Terra sumo",detail:"NOVO — pés largos",sets:4,reps:8,rest:90,type:"exercise"},{name:"Cadeira flexora",sets:4,reps:10,rest:45,type:"exercise"},{name:"Panturrilha em pé",detail:"Resistência p/ meia",sets:4,reps:20,rest:30,type:"exercise"},{name:"↑ Circuito Core",detail:"NOVO — Prancha+Bicicleta+Mountain",sets:3,duration:120,rest:45,type:"timed_exercise"}],
    s:[{name:"Along. quadríceps",detail:"Cada perna",duration:30,type:"timer"},{name:"Along. posterior+glúteo",duration:30,type:"timer"},{name:"Along. adutores+panturrilha",duration:30,type:"timer"}]},
];

// Treino C per phase
const MC = [
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Rotação ombros",reps:20,type:"reps"},{name:"Puxada leve",sets:2,reps:10,type:"reps"},{name:"Rotação tronco",reps:20,type:"reps"}],
    m:[{name:"Puxada alta",detail:"Até peito",sets:4,reps:12,rest:60,type:"exercise"},{name:"Remada baixa cabo",detail:"Escápulas!",sets:4,reps:12,rest:60,type:"exercise"},{name:"Remada curvada barra",detail:"Até umbigo",sets:4,reps:12,rest:60,type:"exercise"},{name:"Pulldown DROPSET",sets:4,reps:"falha",rest:45,type:"exercise"},{name:"Remada supinada",sets:4,reps:12,rest:45,type:"exercise"},{name:"Tríceps barra reta DROPSET",sets:4,reps:"falha",rest:45,type:"exercise"},{name:"Tríceps francês halter",sets:4,reps:12,rest:45,type:"exercise"},{name:"Peck deck invertido",detail:"Posterior ombro",sets:4,reps:12,rest:45,type:"exercise"}],
    s:[{name:"Along. costas",duration:30,type:"timer"},{name:"Along. lat",detail:"Cada lado",duration:30,type:"timer"},{name:"Along. tríceps",detail:"Cada braço",duration:30,type:"timer"},{name:"Along. ombro posterior",detail:"Cada lado",duration:30,type:"timer"}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Rotação ombros+tronco",reps:20,type:"reps"},{name:"Puxada leve",sets:2,reps:10,type:"reps"}],
    m:[{name:"↑ Puxada aberta",detail:"VARIAÇÃO — pegada larga",sets:4,reps:10,rest:60,type:"exercise"},{name:"Remada curvada PIRÂMIDE",sets:4,reps:"12-10-8-6",rest:75,type:"exercise"},{name:"↑ Remada unilateral",detail:"NOVO — cada braço",sets:4,reps:10,rest:60,type:"exercise"},{name:"↑ Pullover halter",detail:"NOVO — dorsal+peitoral",sets:4,reps:12,rest:45,type:"exercise"},{name:"Puxada supinada",detail:"Pegada fechada",sets:4,reps:10,rest:60,type:"exercise"},{name:"↑ Tríceps corda",detail:"VARIAÇÃO — abrir no final",sets:4,reps:12,rest:45,type:"exercise"},{name:"↑ Mergulho banco",detail:"NOVO — pés elevados",sets:4,reps:"falha",rest:45,type:"exercise"},{name:"↑ Face pull",detail:"NOVO — saúde ombro+postura",sets:3,reps:15,rest:30,type:"exercise"}],
    s:[{name:"Along. costas",duration:30,type:"timer"},{name:"Along. lat",detail:"Cada lado",duration:30,type:"timer"},{name:"Along. tríceps",detail:"Cada braço",duration:30,type:"timer"},{name:"Along. ombro",detail:"Cada lado",duration:30,type:"timer"}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Rotação ombros",reps:20,type:"reps"},{name:"Puxada leve",sets:2,reps:10,type:"reps"}],
    m:[{name:"↑ Barra fixa",detail:"NOVO — bodyweight! Máx reps",sets:4,reps:"máximo",rest:90,type:"exercise"},{name:"↑ Remada T barra",detail:"NOVO — composto pesado",sets:4,reps:10,rest:75,type:"exercise"},{name:"Remada curvada pesada",sets:4,reps:8,rest:75,type:"exercise"},{name:"Pulldown invertido DROPSET",sets:3,reps:"falha",rest:45,type:"exercise"},{name:"↑ Tríceps francês EZ",detail:"PIRÂMIDE pesada",sets:4,reps:"12-10-8-6",rest:60,type:"exercise"},{name:"↑ Corda+Barra reta SUPERSET",detail:"12+12",sets:3,reps:"12+12",rest:60,type:"exercise"},{name:"↑ Encolhimento trapézio",detail:"NOVO",sets:4,reps:12,rest:45,type:"exercise"},{name:"Face pull",detail:"Saúde ombro",sets:3,reps:15,rest:30,type:"exercise"}],
    s:[{name:"Along. costas+lat",duration:30,type:"timer"},{name:"Along. tríceps",detail:"Cada braço",duration:30,type:"timer"},{name:"Along. ombro",detail:"Cada lado",duration:30,type:"timer"}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer"},{name:"Rotação ombros",reps:20,type:"reps"},{name:"Barra fixa leve",sets:2,reps:8,type:"reps"}],
    m:[{name:"Barra fixa",detail:"Máx reps — bata recorde!",sets:4,reps:"máximo",rest:90,type:"exercise"},{name:"↑ Remada Pendlay",detail:"NOVO — potência, do chão",sets:4,reps:"6-8",rest:90,type:"exercise"},{name:"Remada unilateral",detail:"Cada braço",sets:3,reps:10,rest:60,type:"exercise"},{name:"↑ Pullover+Pulldown SUPERSET",detail:"NOVO — 12+12",sets:3,reps:"12+12",rest:60,type:"exercise"},{name:"↑ Paralelas",detail:"NOVO — bodyweight máx reps",sets:4,reps:"máximo",rest:60,type:"exercise"},{name:"↑ Tríceps kickback",detail:"NOVO — cada braço",sets:3,reps:12,rest:30,type:"exercise"},{name:"Face pull",detail:"Saúde ombro",sets:3,reps:15,rest:30,type:"exercise"},{name:"↑ Encolhimento+Peck inv",detail:"BI-SET 12+12",sets:3,reps:"12+12",rest:45,type:"exercise"}],
    s:[{name:"Along. costas+lat",duration:30,type:"timer"},{name:"Along. tríceps+ombro",duration:30,type:"timer"}]},
];

function mkT(n,d,dur,rec){const s=[];for(let i=1;i<=n;i++){s.push({n:"Tiro "+i+" — "+d+" Z4",d:"147-164 bpm",dur});s.push({n:"Recuperação",d:"Caminhada",dur:rec});}return s;}

const RD=[
  {q:"Fartlek 20min",qS:[{n:"Fartlek",d:"Varie o ritmo livremente!",dur:1200}],e:3,l:3.5},
  {q:"4x400m Z4 rec 2min",qS:mkT(4,"400m",150,120),e:3.5,l:4},
  {q:"Fartlek 25min",qS:[{n:"Fartlek",d:"Varie o ritmo",dur:1500}],e:4,l:4.5},
  {q:"5x400m Z4 rec 2min",qS:mkT(5,"400m",150,120),e:4,l:5},
  {q:"3km leve Z2",qS:[{n:"Corrida Z2",d:"110-127 bpm"}],e:3,test:"🎯 TESTE 5KM!",tD:5},
  {q:"4x600m Z4 rec 2min",qS:mkT(4,"600m",210,120),e:5,l:5.5},
  {q:"Fartlek 25min",qS:[{n:"Fartlek",d:"Varie o ritmo",dur:1500}],e:5,l:6},
  {q:"5x600m Z4 rec 2min",qS:mkT(5,"600m",210,120),e:5.5,l:6.5},
  {q:"Tempo Run 15min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:900}],e:5.5,l:7},
  {q:"4km leve Z2",qS:[{n:"Corrida Z2",d:"Semana teste!"}],e:4,test:"🎯 TESTE 7KM!",tD:7},
  {q:"4x800m Z4 rec 3min",qS:mkT(4,"800m",270,180),e:7,l:7.5},
  {q:"Tempo Run 20min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:1200}],e:7,l:8},
  {q:"4x1000m Z4 rec 3min",qS:mkT(4,"1km",330,210),e:7.5,l:9},
  {q:"5km leve Z2",qS:[{n:"Corrida Z2",d:"Semana teste!"}],e:5,test:"🎯 TESTE 10KM!",tD:10},
  {q:"5x800m Z4 rec 3min",qS:mkT(5,"800m",270,180),e:8,l:10},
  {q:"Tempo Run 25min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:1500}],e:8,l:10},
  {q:"Fartlek 30min",qS:[{n:"Fartlek",d:"Varie o ritmo",dur:1800}],e:8,l:11},
  {q:"6km leve Z2",qS:[{n:"Corrida Z2",d:"Teste pace!"}],e:6,test:"🎯 10km pace",tD:10},
  {q:"5x1000m Z4 rec 3min",qS:mkT(5,"1km",330,180),e:8,l:12},
  {q:"Tempo Run 30min Z3",qS:[{n:"Tempo Run Z3",d:"Ritmo de meia!",dur:1800}],e:8,l:12},
  {q:"4x1200m Z4 rec 4min",qS:mkT(4,"1.2km",400,240),e:9,l:13},
  {q:"Tempo Run 35min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:2100}],e:9,l:14},
  {q:"5x1200m Z4 rec 3min",qS:mkT(5,"1.2km",400,180),e:9,l:15},
  {q:"6km leve Z2",qS:[{n:"Corrida Z2",d:"Semana teste!"}],e:6,test:"🎯 TESTE 15KM!",tD:15},
  {q:"Tempo Run 35min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:2100}],e:10,l:16},
  {q:"5x1000m Z4 rec 3min",qS:mkT(5,"1km",330,180),e:10,l:17},
  {q:"Tempo Run 40min Z3",qS:[{n:"Tempo Run Z3",d:"Pico!",dur:2400}],e:10,l:18},
  {q:"Fartlek 35min",qS:[{n:"Fartlek",d:"Varie o ritmo",dur:2100}],e:8,l:19},
  {q:"4x800m Z4 TAPER",qS:mkT(4,"800m",270,180),e:8,l:10},
  {q:"5km leve Z2",qS:[{n:"Corrida Z2",d:"Antes da MEIA!"}],e:3,test:"🏆 21KM MEIA!",tD:21},
];

const SL=["Musculação A","Corrida Qualidade","Musculação B","Corrida Leve","Musculação C","Corrida Longa"];
const SS=["A","🏃","B","🏃","C","🏃‍♂️"];const SIC=["🏋️","🏃","🦵","🏃","💪","🏃‍♂️"];
const SCO=["#2E7D32","#E65100","#1565C0","#E65100","#4A148C","#B71C1C"];
const PH=[{n:"FASE 1: 3km→5km",a:1,b:5,c:"#2E7D32"},{n:"FASE 2: 5km→7km",a:6,b:10,c:"#1565C0"},{n:"FASE 3: 7km→10km",a:11,b:14,c:"#E65100"},{n:"FASE 4: Consolidação 10km",a:15,b:18,c:"#4A148C"},{n:"FASE 5: 10km→15km",a:19,b:24,c:"#B71C1C"},{n:"FASE 6: Meia Maratona!",a:25,b:30,c:"#F57F17"}];
const gp=w=>PH.find(p=>w>=p.a&&w<=p.b)||PH[0];

function bm(phases,wk){const p=getMPh(wk),m=phases[p],r=[];
  r.push({section:"🔥 AQUECIMENTO"});m.w.forEach(e=>r.push({...e,ph:"w"}));
  r.push({section:"💪 TREINO — "+PHASE_NAMES[p]});m.m.forEach(e=>r.push({...e,ph:"m"}));
  r.push({section:"🧘 ALONGAMENTO"});m.s.forEach(e=>r.push({...e,ph:"s"}));
  r.push({section:"🦶 FORTALECIMENTO PÉS"});(phases===MB?FEET_M1:FEET_S).forEach(e=>r.push({...e,ph:"f"}));
  return r;}

function br(wk,rt){const rd=RD[wk-1];if(!rd)return[];const r=[];
  r.push({section:"🦶 PÉS PRÉ-CORRIDA"});FOOT_PRE.forEach(e=>r.push({...e,ph:"fp"}));
  r.push({section:"🔥 AQUECIMENTO"});WARMUP_RUN.forEach(e=>r.push({...e,ph:"w"}));
  r.push({section:"🏃 CORRIDA"});r.push({name:"Aquecimento: Caminhada",detail:"Z1 (92-109 bpm)",duration:300,type:"timer",ph:"r"});
  if(rt==="q")rd.qS.forEach(x=>r.push({name:x.n,detail:x.d,duration:x.dur,type:x.dur?"timer":"manual",ph:"r"}));
  else if(rt==="e")r.push({name:"Corrida Z2 — "+rd.e+"km",detail:"110-127 bpm",type:"manual",ph:"r"});
  else if(rt==="l"){if(rd.test)r.push({name:rd.test,detail:"Z2 — "+rd.tD+"km. NÃO ACELERE!",type:"manual",ph:"r",isTest:true});else r.push({name:"Longão Z2 — "+rd.l+"km",detail:"Ritmo de CONVERSA",type:"manual",ph:"r"});}
  r.push({name:"Volta à calma",detail:"Caminhada Z1",duration:300,type:"timer",ph:"r"});
  r.push({section:"🧘 ALONGAMENTO PÓS"});STRETCH.forEach(e=>r.push({...e,ph:"s"}));
  r.push({section:"❄️ GELO NOS PÉS"});ICE.forEach(e=>r.push({...e,ph:"i"}));return r;}

function bw(wk,si){if(si===0)return bm(MA,wk);if(si===1)return br(wk,"q");if(si===2)return bm(MB,wk);if(si===3)return br(wk,"e");if(si===4)return bm(MC,wk);if(si===5)return br(wk,"l");return[];}
function ft(s){if(s==null)return"--:--";return Math.floor(s/60)+":"+(s%60).toString().padStart(2,"0");}
function grd(wk,si){const r=RD[wk-1];if(!r)return"";if(si===1)return r.q;if(si===3)return r.e?r.e+"km Z2":"";if(si===5)return r.test||(r.l?r.l+"km Longão":"");return"";}

function CT({time,total,running,color}){const r=70,circ=2*Math.PI*r,off=circ*(1-(total>0?(total-time)/total:0));
  return<svg viewBox="0 0 160 160" style={{width:180,height:180}}><circle cx="80" cy="80" r={r} fill="none" stroke="#1a1a2e" strokeWidth="8"/><circle cx="80" cy="80" r={r} fill="none" stroke={color||"#4ade80"} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{transform:"rotate(-90deg)",transformOrigin:"center",transition:"stroke-dashoffset 0.3s"}}/><text x="80" y="72" textAnchor="middle" fill="white" fontSize="32" fontWeight="800" fontFamily="monospace">{ft(time)}</text><text x="80" y="98" textAnchor="middle" fill="#94a3b8" fontSize="11">{running?"EM ANDAMENTO":time===0?"CONCLUÍDO ✓":"PAUSADO"}</text></svg>;}
function CU({time,running}){return<svg viewBox="0 0 160 160" style={{width:180,height:180}}><circle cx="80" cy="80" r="70" fill="none" stroke="#1a1a2e" strokeWidth="8"/><circle cx="80" cy="80" r="70" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="8 6" style={{animation:running?"spin 8s linear infinite":"none"}}/><text x="80" y="72" textAnchor="middle" fill="white" fontSize="32" fontWeight="800" fontFamily="monospace">{ft(time)}</text><text x="80" y="98" textAnchor="middle" fill="#94a3b8" fontSize="11">{running?"CORRENDO...":"PAUSADO"}</text></svg>;}
function PV({steps}){return<div style={{maxHeight:"55vh",overflowY:"auto"}}>{steps.map((s,i)=>s.section?<div key={i} style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginTop:14,marginBottom:6}}>{s.section}</div>:<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:"rgba(255,255,255,0.03)",borderRadius:8,marginBottom:3}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:s.name&&s.name.startsWith("↑")?"#4ade80":"#e2e8f0"}}>{s.name}</div>{s.detail&&<div style={{fontSize:11,color:"#64748b"}}>{s.detail}</div>}</div><div style={{fontSize:11,color:"#475569",textAlign:"right",minWidth:55}}>{s.sets&&s.reps?s.sets+"x"+s.reps:s.duration&&!s.sets?ft(s.duration):s.sets&&s.duration?s.sets+"x"+ft(s.duration):s.reps?s.reps+" reps":""}</div></div>)}</div>;}

export default function App(){
  const[wk,setWk]=useState(1),[ses,setSes]=useState(2),[scr,setScr]=useState("home");
  const[pvS,setPvS]=useState(0),[sI,setSI]=useState(0),[cS,setCS]=useState(1);
  const[tmr,setTmr]=useState(0),[tmrOn,setTmrOn]=useState(false),[rst,setRst]=useState(false);
  const[cup,setCup]=useState(0),[cupOn,setCupOn]=useState(false),[ok,setOk]=useState(false);
  const iR=useRef(null),cR=useRef(null),bp=useRef(false);

  useEffect(()=>{(async()=>{try{const r=localStorage.getItem("tp5");if(r){const d=JSON.parse(r);setWk(d.w||1);setSes(d.s!==undefined?d.s:2);}}catch(e){}setOk(true);})();},[]);
  const sv=useCallback((w,s)=>{try{localStorage.setItem("tp5",JSON.stringify({w,s}))}catch(e){}},[]);

  useEffect(()=>{if(tmrOn&&tmr>0){bp.current=false;iR.current=setInterval(()=>setTmr(t=>t-1),1000);}else{clearInterval(iR.current);if(tmr===0&&tmrOn){setTmrOn(false);if(!bp.current){playBeep();bp.current=true;}}}return()=>clearInterval(iR.current);},[tmrOn,tmr]);
  useEffect(()=>{if(cupOn)cR.current=setInterval(()=>setCup(t=>t+1),1000);else clearInterval(cR.current);return()=>clearInterval(cR.current);},[cupOn]);

  const all=bw(wk,ses),steps=all.filter(s=>!s.section),step=steps[sI],ph=gp(wk),tot=steps.length,mph=getMPh(wk);
  function curSec(){let sec="",c=0;for(const s of all){if(s.section){sec=s.section;continue;}if(c===sI)return sec;c++;}return sec;}
  function startAny(si){setSes(si);sv(wk,si);setSI(0);setCS(1);setRst(false);setTmr(0);setTmrOn(false);setCup(0);setCupOn(false);const w=bw(wk,si),st=w.filter(x=>!x.section);if(st[0]&&st[0].duration&&st[0].type==="timer")setTmr(st[0].duration);setScr("workout");}
  function adv(){let ns=ses+1,nw=wk;if(ns>=6){ns=0;nw=Math.min(wk+1,30);}setSes(ns);setWk(nw);sv(nw,ns);setScr("home");}
  function nxt(){setTmrOn(false);setCupOn(false);setRst(false);setCS(1);setCup(0);if(sI+1>=tot){adv();return;}const n=steps[sI+1];setSI(sI+1);if(n&&n.duration&&n.type==="timer")setTmr(n.duration);else setTmr(0);}
  function dn(){const mx=step.sets||1;if(cS<mx){if(step.rest){setRst(true);setTmr(step.rest);setTmrOn(true);}setCS(cS+1);}else nxt();}

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

  if(scr==="workout"&&step){const sec=curSec(),iT=step.type==="timer"||step.type==="timed_exercise",iE=step.type==="exercise"||step.type==="timed_exercise",mx=step.sets||1,pc=step.ph==="r"?"#E65100":step.ph==="fp"||step.ph==="f"?"#F57F17":step.ph==="i"?"#0ea5e9":step.ph==="w"?"#F57F17":step.ph==="s"?"#1565C0":SCO[ses];
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:16,maxWidth:480,margin:"0 auto"}}><style>{G}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><button onClick={()=>{setTmrOn(false);setCupOn(false);setScr("home")}} style={{background:"none",border:"none",color:"#94a3b8",fontSize:14,cursor:"pointer",padding:4}}>← Sair</button><div style={{fontSize:12,color:"#64748b"}}>{sI+1}/{tot}</div></div>
      <div style={{height:4,background:"#1a1a2e",borderRadius:2,marginBottom:12}}><div style={{height:4,borderRadius:2,background:pc,width:((sI+1)/tot*100)+"%",transition:"width 0.3s"}}/></div>
      <div style={{fontSize:12,color:pc,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:16,textAlign:"center"}}>{sec}</div>
      <div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:20,fontWeight:800,marginBottom:6,lineHeight:1.3,color:step.name&&step.name.startsWith("↑")?"#4ade80":"white"}}>{step.name}</div>{step.detail&&<div style={{fontSize:13,color:"#94a3b8",lineHeight:1.4}}>{step.detail}</div>}</div>
      {iE&&!rst&&<div style={{textAlign:"center",marginBottom:8}}><div style={{display:"inline-flex",gap:6,marginBottom:8}}>{Array.from({length:mx},(_,i)=><div key={i} style={{width:32,height:32,borderRadius:"50%",background:i<cS-1?pc:i===cS-1?pc+"66":"#1a1a2e",border:i===cS-1?"2px solid "+pc:"2px solid #1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:i<cS?"white":"#475569"}}>{i<cS-1?"✓":i+1}</div>)}</div><div style={{fontSize:14,fontWeight:700}}>Série {cS}/{mx}{step.reps?" — "+(typeof step.reps==="string"?(step.reps.split("-")[cS-1]||step.reps):step.reps)+" reps":""}</div></div>}
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
      {sI+1<tot&&<div style={{marginTop:20,padding:12,background:"rgba(255,255,255,0.03)",borderRadius:10,borderLeft:"3px solid "+pc+"33"}}><div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>A seguir</div><div style={{fontSize:13,color:"#94a3b8"}}>{steps[sI+1]&&steps[sI+1].name}</div></div>}
      {step.isTest&&<div style={{marginTop:16,padding:14,background:pc+"15",borderRadius:12,border:"1px solid "+pc+"33",textAlign:"center"}}><div style={{fontSize:24,marginBottom:4}}>🎯</div><div style={{fontSize:13,color:pc,fontWeight:700}}>DIA DE TESTE!</div><div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>Não acelere! O objetivo é COMPLETAR!</div></div>}</div>;}

  return<div style={{background:"#0f0f1a",color:"white",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><p>Carregando...</p></div>;
}
