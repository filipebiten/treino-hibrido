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

// ══════════════════════ REHAB DATA ══════════════════════
const REHAB_ROUTINES = [
  { id: "matinal", title: "🌅 Matinal", subtitle: "Na cama, antes de levantar", time: "~5 min", when: "Todos os dias ao acordar", color: "#f59e0b",
    exercises: [
      { name: "Bombas de tornozelo", duration: 120, type: "timer",
        how: "Deitado ou sentado na cama. Aponte a ponta do pé para baixo (como uma bailarina) e depois puxe para cima (direção da canela). Alterne suavemente. NÃO levante da cama antes de fazer isso — a fáscia está encurtada e fria." },
      { name: "Alongamento com toalha (panturrilha)", sets: 2, duration: 30, type: "timer",
        how: "Ainda sentado na cama, passe uma toalha pela planta do pé. Com o joelho esticado, puxe a toalha trazendo a ponta do pé em direção à canela. Segure 30 segundos. Faça 2x cada perna. Deve sentir alongamento na panturrilha, NÃO dor." },
      { name: "Alongamento DiGiovanni (fáscia)", reps: 10, type: "reps",
        how: "Sentado, cruze a perna afetada sobre a outra. Com a mão do mesmo lado, segure a BASE DOS DEDOS (não a ponta) e puxe os dedos para CIMA e para TRÁS. Você deve sentir a fáscia (banda firme na sola do pé) esticando — palpe com a outra mão para confirmar. Segure 10 segundos cada repetição. Faça 10 vezes. Este é o exercício MAIS importante segundo a pesquisa — 92% dos pacientes melhoraram em 2 anos." },
    ]},
  { id: "manha", title: "🌞 Manhã / Meio-dia", subtitle: "Rotina principal de reabilitação", time: "~15 min", when: "Todos os dias, 1x", color: "#10b981",
    exercises: [
      { name: "Bolinha de tênis na sola", duration: 120, type: "timer",
        how: "Sentado numa cadeira, coloque a bolinha sob a sola do pé. Role do calcanhar até a base dos dedos com pressão MODERADA (não deve doer forte, nota ≤3/10). Cubra toda a sola. Se uma área estiver muito sensível, passe mais devagar mas NÃO force." },
      { name: "Garrafa congelada (se dor aguda)", duration: 300, type: "timer",
        how: "OPCIONAL na fase aguda. Congele uma garrafa PET com 75% de água. Coloque uma fronha/toalha fina por cima. Role a garrafa sob a sola do pé com pressão leve. Combina massagem + gelo em um só exercício. Máximo 10 min." },
      { name: "Along. gastrocnêmio (joelho RETO)", sets: 3, duration: 30, type: "timer",
        how: "Em pé, mãos na parede. Perna afetada ATRÁS, perna boa na frente. Calcanhar de trás FIRME no chão. Joelho de trás RETO. Empurre o quadril para frente até sentir o alongamento na panturrilha. Pés apontados para frente. Segure 30s. 3x cada perna." },
      { name: "Along. sóleo (joelho DOBRADO)", sets: 3, duration: 30, type: "timer",
        how: "MESMA posição, mas agora DOBRE levemente o joelho de trás. Isso alonga o SÓLEO (músculo mais profundo da panturrilha). Calcanhar continua firme no chão. O alongamento é sentido mais embaixo, perto do calcanhar. 30s x 3 cada perna." },
      { name: "Alongamento DiGiovanni", reps: 10, type: "reps",
        how: "Sentado, cruze a perna afetada. Segure a base dos dedos e puxe para cima/trás. Palpe a fáscia para confirmar tensão. 10 segundos x 10 repetições. Esta é a 2ª dose do dia." },
      { name: "Short Foot (encurtamento do pé)", reps: 15, type: "reps",
        how: "O MAIS IMPORTANTE para pé plano. Sentado, pé totalmente apoiado no chão. SEM encolher os dedos (eles ficam esticados e relaxados), tente ENCURTAR o pé aproximando a base do dedão do calcanhar — como se quisesse 'levantar a cúpula' do arco. Imagine que está tentando agarrar o chão com o meio do pé, mas os dedos NÃO se movem. Segure 5 segundos. Relaxe. 15 repetições. Progressão: sentado → em pé nos dois pés → em pé num pé só." },
      { name: "Toe Yoga (piano com os dedos)", reps: 10, type: "reps",
        how: "3 movimentos, 10 reps cada: (1) Levante SÓ o dedão, mantendo os outros 4 no chão. (2) Baixe o dedão e levante os outros 4. (3) Espalhe todos os dedos como um leque e feche. Parece fácil mas é difícil! O cérebro precisa reaprender a controlar os dedos individualmente." },
      { name: "Catador de toalha", sets: 2, reps: 15, type: "reps",
        how: "Toalha estendida no chão. Sentado, use APENAS os dedos do pé para agarrar e puxar a toalha em sua direção. Cada 'puxada' é 1 rep. 2 séries de 15. Progressão: coloque um livro ou lata na ponta da toalha para adicionar resistência." },
      { name: "4-vias tornozelo c/ elástico", sets: 3, reps: 10, type: "reps",
        how: "Sentado, perna esticada. Execute 4 movimentos com elástico, 3x10 cada: (1) PLANTIFLEXÃO: aponte o pé contra o elástico segurado pelas mãos. (2) DORSIFLEXÃO: puxe o pé para cima contra elástico ancorado. (3) INVERSÃO (o mais importante!): elástico na face interna do pé, puxe para DENTRO — trabalha o tibial posterior que sustenta seu arco. (4) EVERSÃO: elástico na face externa, empurre para FORA." },
    ]},
  { id: "tarde", title: "🌆 Tarde", subtitle: "Dose rápida de manutenção", time: "~5 min", when: "Todos os dias, 1x", color: "#8b5cf6",
    exercises: [
      { name: "Bolinha de tênis", duration: 120, type: "timer",
        how: "Role a bolinha sob a sola do pé. Pressão moderada, do calcanhar à base dos dedos. 2 minutos." },
      { name: "Alongamento DiGiovanni", reps: 10, type: "reps",
        how: "3ª dose do dia. Cruze a perna, segure base dos dedos, puxe para cima/trás. Palpe a fáscia. 10 segundos x 10 repetições." },
      { name: "Along. panturrilha (joelho reto + dobrado)", sets: 2, duration: 30, type: "timer",
        how: "Na parede: 2x30s joelho reto (gastrocnêmio) + 2x30s joelho dobrado (sóleo). Calcanhar firme no chão." },
    ]},
  { id: "carga", title: "💪 Carga (Rathleff)", subtitle: "Dias ALTERNADOS — o mais importante!", time: "~10 min", when: "Dias alternados (seg/qua/sex)", color: "#ef4444",
    exercises: [
      { name: "Aquecimento: bolinha + along.", duration: 90, type: "timer",
        how: "1 minuto de bolinha de tênis rolando na sola + 30 segundos de alongamento de panturrilha na parede. Preparar o tecido antes da carga." },
      { name: "Heel Raise Rathleff (PROTOCOLO PRINCIPAL)", sets: 3, reps: 12, type: "exercise", rest: 120,
        how: "O EXERCÍCIO MAIS IMPORTANTE do protocolo. (1) Enrole uma toalha e coloque sob os DEDOS do pé afetado no degrau — isso ativa o mecanismo de Windlass que tensiona a fáscia. (2) Posicione o ANTEPÉ na borda do degrau, calcanhar para fora (no ar). (3) Apoie as mãos na parede para equilíbrio. (4) SUBA em 3 segundos no pé afetado (fase concêntrica). (5) PAUSE no topo 2 segundos com dedos em hiperextensão máxima. (6) DESÇA em 3 segundos, com o calcanhar indo ABAIXO do nível do degrau (fase excêntrica). PROGRESSÃO: Semanas 1-2: 3x12 (peso corporal). Semanas 3-4: 4x10 (mochila com livros). Semanas 5+: 5x8 (mais peso). REGRA DE DOR: se a dor no dia SEGUINTE estiver pior que antes, reduza peso/reps." },
      { name: "Equilíbrio unilateral c/ Short Foot", sets: 3, duration: 60, type: "timer",
        how: "Fique em UM PÉ SÓ (o afetado). Enquanto equilibra, ATIVE o short foot (levante o arco sem encolher os dedos). Mantenha 60 segundos. 3 séries. Progressão: olhos abertos → olhos fechados → sobre travesseiro/almofada." },
    ]},
];

// ══════════════════════ FOOT PROTOCOL ══════════════════════
const FOOT_PRE = [
  { name: "Tibial anterior sentado", detail: "Ponta dos pés para cima", sets: 3, duration: 30, type: "timer", how: "Sentado, pés no chão. Levante a ponta dos pés mantendo calcanhares fixos. 30 segundos." },
  { name: "Elev. panturrilha unilateral", detail: "Descer lento 3seg", sets: 3, reps: 12, type: "reps", how: "Em pé num pé só. Suba na ponta e desça contando 3 segundos." },
  { name: "Tibial posterior elástico", detail: "Para dentro/baixo", sets: 3, reps: 12, type: "reps", how: "Elástico no pé, puxe para dentro e para baixo." },
  { name: "Fibulares elástico", detail: "Para fora", sets: 3, reps: 12, type: "reps", how: "Elástico no pé, empurre para fora." },
  { name: "Massagem bolinha", detail: "Rolar na sola", duration: 150, type: "timer", how: "Bolinha de tênis sob a sola, role com pressão média." },
  { name: "Catador de toalha", detail: "Dedos dos pés", sets: 3, reps: 10, type: "reps", how: "Toalha no chão, agarre com os dedos." },
  { name: "Equilíbrio unipodal", detail: "Cada pé", sets: 3, duration: 30, type: "timer", how: "Fique num pé só, olhar fixo, 30 segundos cada." },
];
const WARMUP_RUN = [
  { name: "Caminhada leve", duration: 120, type: "timer", how: "Caminhe com passos largos." },
  { name: "Elevação joelhos", duration: 30, type: "timer", how: "Eleve joelhos alternados até a cintura." },
  { name: "Chutes glúteo", duration: 30, type: "timer", how: "Chute calcanhares ao bumbum." },
  { name: "Rotação quadril", detail: "Cada perna", reps: 10, type: "reps", how: "Eleve joelho e faça círculos." },
  { name: "Rotação tornozelos", detail: "Cada pé", reps: 10, type: "reps", how: "Gire tornozelo em círculos." },
  { name: "Saltitos leves", duration: 30, type: "timer", how: "Pule leve na ponta dos pés." },
];
const STRETCH = [
  { name: "Along. panturrilha", detail: "Cada lado", duration: 30, type: "timer", how: "Perna atrás, calcanhar no chão, empurre quadril." },
  { name: "Along. quadríceps", detail: "Cada lado", duration: 30, type: "timer", how: "Puxe pé atrás, joelhos juntos." },
  { name: "Along. posterior coxa", detail: "Cada lado", duration: 30, type: "timer", how: "Perna esticada, incline tronco." },
  { name: "Along. fáscia plantar ⚠️", detail: "ESSENCIAL!", duration: 30, type: "timer", how: "Puxe dedos para trás. FUNDAMENTAL!" },
  { name: "Along. glúteo", detail: "Cada lado", duration: 30, type: "timer", how: "Tornozelo sobre joelho oposto, puxe." },
  { name: "Respiração profunda", detail: "4s/4s/4s", reps: 5, type: "reps", how: "Inspire 4s, segure 4s, expire 4s." },
];
const ICE = [{ name: "❄️ GELO NOS PÉS", detail: "OBRIGATÓRIO!", duration: 900, type: "timer", isIce: true, how: "Gelo na sola dos pés com toalha fina entre o gelo e a pele. 15 minutos." }];

const PHASE_NAMES = ["Fase 1: Adaptação (Sem 1-8)","Fase 2: Hipertrofia (Sem 9-16)","Fase 3: Força (Sem 17-24)","Fase 4: Potência (Sem 25-30)"];
function getMPh(wk) { if (wk <= 8) return 0; if (wk <= 16) return 1; if (wk <= 24) return 2; return 3; }

const FEET_B = [
  { name: "Elev. panturrilha UNILATERAL", sets: 3, reps: 12, type: "reps", how: "Um pé só, descer lento 3seg." },
  { name: "Tibial posterior elástico", detail: "Cada pé", sets: 3, reps: 12, type: "reps", how: "Puxe para dentro e para baixo." },
  { name: "Fibulares elástico", detail: "Cada pé", sets: 3, reps: 12, type: "reps", how: "Empurre para fora." },
  { name: "Massagem bolinha", detail: "Cada pé", duration: 180, type: "timer", how: "Role na sola." },
  { name: "Along. fáscia plantar", detail: "Cada pé", duration: 30, type: "timer", how: "Puxe dedos para trás." },
];
const FEET_S = [
  { name: "Elev. panturrilha bilateral", sets: 3, reps: 15, type: "reps", how: "Suba na ponta dos dois pés, desça controlado." },
  { name: "Massagem bolinha", detail: "Cada pé", duration: 120, type: "timer", how: "Role na sola." },
  { name: "Along. panturrilha", duration: 30, type: "timer", how: "Pé na parede, empurre quadril." },
];

// ══════════════════════ MUSCULATION (4 phases each) ══════════════════════
const MA = [
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min cardio leve."},{name:"Rotação ombros",reps:20,type:"reps",how:"20 círculos amplos."},{name:"Rotação braços",reps:20,type:"reps",how:"Braços esticados, 20 círculos."},{name:"Aquec. punhos",reps:20,type:"reps",how:"Gire punhos."},{name:"Polichinelos",duration:30,type:"timer",how:"Jumping jacks leves."}],
    m:[{name:"Supino reto halteres",detail:"PIRÂMIDE",sets:4,reps:"12-10-8-6",rest:90,type:"exercise",how:"Deitado no banco, halteres na altura do peito. Empurre para cima. Desça controlado. Aumente peso a cada série.",startKg:12},{name:"Supino inclinado halteres",detail:"Banco 30-45°",sets:4,reps:12,rest:60,type:"exercise",how:"Banco inclinado. Mesma execução. 2s subindo, 2s descendo.",startKg:10},{name:"Voador/Crossover",detail:"Squeeze peitoral",sets:4,reps:12,rest:45,type:"exercise",how:"Cabos posição alta. Puxe as mãos para baixo e para frente. Aperte o peitoral no final.",startKg:8},{name:"Elevação frontal",sets:4,reps:12,rest:45,type:"exercise",how:"Em pé, halteres. Braços esticados, eleve à frente até ombros. Desça controlado.",startKg:6},{name:"Elevação lateral",sets:4,reps:12,rest:45,type:"exercise",how:"Cotovelo levemente dobrado, eleve para os lados até ombros.",startKg:5},{name:"Rosca bíceps W",detail:"PIRÂMIDE",sets:4,reps:"12-10-8-6",rest:60,type:"exercise",how:"Barra W, flexione cotovelos ao peito. Controle descida 2seg. Aumente peso.",startKg:15},{name:"Bíceps concentrado",detail:"Cada braço",sets:4,reps:12,rest:30,type:"exercise",how:"Sentado, cotovelo na coxa. Flexione trazendo halter ao ombro.",startKg:6}],
    s:[{name:"Along. peitoral",detail:"Cada lado",duration:30,type:"timer",how:"Braço 90° na parede, gire o corpo."},{name:"Along. ombro",detail:"Cada lado",duration:30,type:"timer",how:"Braço cruzado no peito."},{name:"Along. bíceps",detail:"Cada lado",duration:30,type:"timer",how:"Braço para trás, palma fora."},{name:"Along. tríceps",detail:"Cada lado",duration:30,type:"timer",how:"Cotovelo atrás da cabeça."}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min cardio."},{name:"Rotação ombros+braços",reps:20,type:"reps",how:"Aquecimento articular."},{name:"Supino leve barra vazia",sets:2,reps:15,type:"reps",how:"Barra vazia para aquecer."},{name:"Polichinelos",duration:30,type:"timer",how:"Ativar corpo."}],
    m:[{name:"↑ Supino reto BARRA",detail:"UPGRADE barra! Pirâmide",sets:4,reps:"12-10-8-6",rest:90,type:"exercise",how:"Barra na largura dos ombros. Desça até tocar o peito. Empurre. Mais estável = mais carga!",startKg:30},{name:"Supino inclinado halteres",sets:4,reps:10,rest:60,type:"exercise",how:"Banco 30°.",startKg:12},{name:"↑ Crucifixo inclinado",detail:"NOVO — abertura ampla",sets:4,reps:12,rest:45,type:"exercise",how:"Banco 30°, abra os braços em arco amplo com cotovelos levemente flexionados.",startKg:8},{name:"↑ Desenvolvimento ombro",detail:"NOVO — sentado",sets:4,reps:10,rest:60,type:"exercise",how:"Sentado, halteres na altura dos ombros. Empurre para cima.",startKg:10},{name:"Lateral+Frontal BI-SET",detail:"12+12 SEM desc",sets:4,reps:"12+12",rest:45,type:"exercise",how:"12 laterais + 12 frontais SEM descanso.",startKg:5},{name:"↑ Rosca alternada",detail:"NOVO — supinação",sets:4,reps:10,rest:60,type:"exercise",how:"Um braço de cada vez, gire o punho no topo.",startKg:8},{name:"↑ Rosca martelo",detail:"NOVO — pega neutra",sets:4,reps:12,rest:45,type:"exercise",how:"Pegada neutra (palmas uma para outra). Trabalha braquial.",startKg:8},{name:"↑ Bíceps Scott",detail:"NOVO — isolamento",sets:3,reps:12,rest:45,type:"exercise",how:"Braços no banco Scott. Flexione até topo, desça lento.",startKg:12}],
    s:[{name:"Along. peitoral",detail:"Cada lado",duration:30,type:"timer",how:"Na parede."},{name:"Along. ombro",detail:"Cada lado",duration:30,type:"timer",how:"Braço cruzado."},{name:"Along. bíceps",detail:"Cada lado",duration:30,type:"timer",how:"Braço para trás."},{name:"Along. tríceps",detail:"Cada lado",duration:30,type:"timer",how:"Cotovelo atrás."}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min."},{name:"Rotação ombros",reps:20,type:"reps",how:"Círculos."},{name:"Supino barra vazia",sets:2,reps:15,type:"reps",how:"Aquecer."},{name:"Flexão leve",sets:2,reps:10,type:"reps",how:"Ativar peito."}],
    m:[{name:"Supino reto barra",detail:"PESADO",sets:5,reps:"10-8-6-6-4",rest:120,type:"exercise",how:"5 séries pesadas. Descanse 2 min. Peça ajuda.",startKg:40},{name:"↑ Supino inclinado BARRA",detail:"UPGRADE",sets:4,reps:8,rest:90,type:"exercise",how:"Banco inclinado com barra. 8 reps pesadas.",startKg:30},{name:"Crossover DROPSET",sets:4,reps:"falha",rest:45,type:"exercise",how:"Até falha, reduza peso, continue.",startKg:15},{name:"↑ Desenvolvimento Arnold",detail:"NOVO — rotação",sets:4,reps:10,rest:60,type:"exercise",how:"Comece palmas para você. Ao empurrar, gire para frente.",startKg:10},{name:"↑ Elevação lateral CABO",detail:"NOVO — tensão constante",sets:4,reps:12,rest:45,type:"exercise",how:"Cabo baixo, puxe lateralmente. Tensão constante.",startKg:5},{name:"Rosca barra reta PIRÂMIDE",sets:4,reps:"10-8-6-4",rest:75,type:"exercise",how:"Pirâmide pesada.",startKg:20},{name:"Concentrada+Martelo BI-SET",detail:"10+10",sets:3,reps:"10+10",rest:60,type:"exercise",how:"10 concentradas + 10 martelo SEM descanso.",startKg:8}],
    s:[{name:"Along. peitoral",detail:"Cada lado",duration:30,type:"timer",how:"Na parede."},{name:"Along. ombro+bíceps",duration:30,type:"timer",how:"Combine."}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min."},{name:"Rotação ombros",reps:20,type:"reps",how:"Círculos."},{name:"Flexão leve",sets:2,reps:12,type:"reps",how:"Ativar."}],
    m:[{name:"Supino reto barra",detail:"FORÇA MÁXIMA",sets:4,reps:"8-6-6-4",rest:120,type:"exercise",how:"Carga pesada. Peça ajuda.",startKg:50},{name:"Supino inclinado halteres",detail:"Volume",sets:4,reps:12,rest:60,type:"exercise",how:"Foco contração.",startKg:14},{name:"↑ Fly+Flexão SUPERSET",detail:"12 fly + flexão falha",sets:3,reps:"12+falha",rest:60,type:"exercise",how:"12 fly halteres + flexão até falha.",startKg:10},{name:"↑ Desenv. militar barra",detail:"NOVO — em pé",sets:4,reps:8,rest:90,type:"exercise",how:"Em pé, barra nos ombros. Empurre acima da cabeça.",startKg:25},{name:"Lateral DROPSET",sets:3,reps:"falha",rest:45,type:"exercise",how:"Lateral até falha, reduza, falha de novo.",startKg:8},{name:"↑ Rosca 21s",detail:"NOVO — 7+7+7",sets:3,reps:21,rest:60,type:"exercise",how:"7 metade inferior + 7 metade superior + 7 completas.",startKg:10},{name:"Martelo+Concentrado SUPERSET",detail:"10+10",sets:3,reps:"10+10",rest:45,type:"exercise",how:"10 martelo + 10 concentrada.",startKg:8}],
    s:[{name:"Along. peitoral",duration:30,type:"timer",how:"Na parede."},{name:"Along. ombro+bíceps",duration:30,type:"timer",how:"Combine."}]},
];

const MB = [
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min cardio."},{name:"Agach. peso corpo",sets:4,reps:15,type:"reps",how:"Agachamento sem peso."},{name:"Rotação quadril",detail:"Cada perna",reps:10,type:"reps",how:"Eleve joelho, faça círculos."},{name:"Balanço pernas",detail:"Cada perna",reps:10,type:"reps",how:"Balance frente e trás."}],
    m:[{name:"Agachamento livre",detail:"PROGRESSÃO PRIORITÁRIA",sets:4,reps:12,rest:90,type:"exercise",how:"Barra nos ombros. Pés largura ombros. Desça até coxas paralelas. Suba explosivo.",startKg:30},{name:"Leg Press 45°",sets:4,reps:12,rest:90,type:"exercise",how:"Pés largura ombros. Desça até 90° nos joelhos.",startKg:60},{name:"Cadeira extensora",detail:"Contrair topo 1seg",sets:4,reps:12,rest:45,type:"exercise",how:"Estenda pernas, contraia quadríceps no topo 1 segundo.",startKg:25},{name:"Stiff halteres",detail:"Costas retas",sets:4,reps:12,rest:60,type:"exercise",how:"Empurre quadril para trás, desça halteres pelas pernas. Costas RETAS!",startKg:10},{name:"Terra Deadlift",detail:"PIRÂMIDE",sets:4,reps:"12-10-8-6",rest:105,type:"exercise",how:"Barra no chão. Costas RETAS. Empurre o chão com os pés.",startKg:40},{name:"Abdutora+Panturrilha BI-SET",sets:4,reps:"12+12",rest:60,type:"exercise",how:"12 abdutora + 12 panturrilha SEM descanso.",startKg:30},{name:"Prancha abdominal",detail:"Core p/ corrida",sets:3,duration:60,rest:30,type:"timed_exercise",how:"Antebraços e ponta dos pés. Corpo reto. Não deixe quadril cair."},{name:"Abdominal Tabata",detail:"20s esforço/10s desc ×8",sets:2,type:"tabata",tabataWork:20,tabataRest:10,tabataRounds:8,rest:60,how:"8 ciclos: 20s abdominais máximos + 10s descanso. Use crunch, bicicleta, elevação pernas."}],
    s:[{name:"Along. quadríceps",detail:"Cada perna",duration:30,type:"timer",how:"Puxe pé atrás."},{name:"Along. posterior",detail:"Cada perna",duration:30,type:"timer",how:"Perna esticada, incline."},{name:"Along. glúteo",detail:"Cada lado",duration:30,type:"timer",how:"Tornozelo sobre joelho."},{name:"Along. adutores",duration:30,type:"timer",how:"Borboleta sentado."},{name:"Along. panturrilha",duration:30,type:"timer",how:"Pé na parede."}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min."},{name:"Agach. peso corpo",sets:3,reps:15,type:"reps",how:"Aquecimento."},{name:"Avanço dinâmico",detail:"Cada perna",reps:10,type:"reps",how:"Passo à frente, desça joelho."}],
    m:[{name:"Agachamento PIRÂMIDE",sets:4,reps:"12-10-8-6",rest:90,type:"exercise",how:"Progressão de carga.",startKg:40},{name:"↑ Búlgaro",detail:"NOVO — pé no banco",sets:4,reps:10,rest:60,type:"exercise",how:"Pé traseiro no banco. Desça joelho. Cada perna separada.",startKg:8},{name:"Leg Press 45°",sets:4,reps:10,rest:90,type:"exercise",how:"Mais carga.",startKg:80},{name:"↑ Extensora+Flexora BI-SET",detail:"12+12",sets:4,reps:"12+12",rest:60,type:"exercise",how:"12 extensora + 12 flexora SEM descanso.",startKg:25},{name:"↑ Stiff BARRA",detail:"UPGRADE",sets:4,reps:10,rest:75,type:"exercise",how:"Stiff com barra. Costas RETAS!",startKg:30},{name:"↑ Panturrilha sentado+pé",detail:"15+15",sets:4,reps:"15+15",rest:45,type:"exercise",how:"15 sentado (sóleo) + 15 em pé (gastrocnêmio).",startKg:20},{name:"↑ Prancha lateral",detail:"NOVO — cada lado",sets:3,duration:30,rest:15,type:"timed_exercise",how:"Antebraço de lado, corpo reto. 30s cada lado."},{name:"↑ Abdominal infra+Roda",detail:"15+10",sets:3,reps:"15+10",rest:45,type:"exercise",how:"15 infra (eleve pernas) + 10 roda abdominal."}],
    s:[{name:"Along. quadríceps",detail:"Cada perna",duration:30,type:"timer",how:"Puxe pé."},{name:"Along. posterior",detail:"Cada perna",duration:30,type:"timer",how:"Incline."},{name:"Along. glúteo+adutores",duration:30,type:"timer",how:"Combine."}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min."},{name:"Agach. peso corpo",sets:3,reps:15,type:"reps",how:"Aquecer."},{name:"Agach. barra vazia",sets:2,reps:10,type:"reps",how:"Barra vazia."}],
    m:[{name:"Agachamento PESADO",sets:5,reps:"10-8-6-6-4",rest:120,type:"exercise",how:"5 séries pesadas. Peça ajuda.",startKg:60},{name:"↑ Leg Press pé alto+baixo",detail:"2 alto + 2 baixo",sets:4,reps:10,rest:90,type:"exercise",how:"2 séries pés altos (glúteo) + 2 pés baixos (quad).",startKg:100},{name:"↑ Passada halteres",detail:"NOVO — funcional corrida",sets:4,reps:10,rest:60,type:"exercise",how:"Com halteres, passo à frente e desça. Alterne. Funcional!",startKg:10},{name:"↑ Stiff romeno barra",sets:4,reps:8,rest:75,type:"exercise",how:"Amplitude maior. Desça até metade da canela.",startKg:40},{name:"Extensora DROPSET",sets:3,reps:"falha",rest:45,type:"exercise",how:"Até falha, reduza, continue.",startKg:30},{name:"↑ Mesa flexora",detail:"NOVO",sets:4,reps:10,rest:45,type:"exercise",how:"Deitado de bruços, flexione pernas ao glúteo.",startKg:20},{name:"Panturrilha unilateral",sets:4,reps:12,rest:30,type:"exercise",how:"Um pé só, lento."},{name:"↑ Abdominal c/ carga",detail:"Halter no peito",sets:4,reps:12,rest:45,type:"exercise",how:"Crunch segurando halter no peito.",startKg:5}],
    s:[{name:"Along. quadríceps",duration:30,type:"timer",how:"Puxe pé."},{name:"Along. posterior+glúteo",duration:30,type:"timer",how:"Combine."},{name:"Along. panturrilha",duration:30,type:"timer",how:"Pé parede."}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min."},{name:"Agach. peso corpo",sets:3,reps:15,type:"reps",how:"Aquecer."},{name:"Saltos leves",duration:30,type:"timer",how:"Saltos no lugar."}],
    m:[{name:"Agachamento FORÇA",sets:4,reps:"8-6-6-4",rest:120,type:"exercise",how:"Carga máxima.",startKg:70},{name:"Búlgaro",detail:"Funcional corrida",sets:3,reps:10,rest:60,type:"exercise",how:"Pé no banco, cada perna.",startKg:12},{name:"↑ Avanço caminhando",detail:"NOVO — específico corrida",sets:3,reps:12,rest:60,type:"exercise",how:"Com halteres, caminhe com passadas longas.",startKg:10},{name:"↑ Terra sumo",detail:"NOVO — pés largos",sets:4,reps:8,rest:90,type:"exercise",how:"Pés bem afastados, pegada entre pernas.",startKg:50},{name:"Cadeira flexora",sets:4,reps:10,rest:45,type:"exercise",how:"Flexione pernas.",startKg:25},{name:"Panturrilha em pé",detail:"Resistência p/ meia",sets:4,reps:20,rest:30,type:"exercise",how:"20 reps para resistência muscular."},{name:"↑ Circuito Core",detail:"Prancha+Bicicleta+Mountain",sets:3,duration:120,rest:45,type:"timed_exercise",how:"Prancha 45s + Bicicleta 20 reps + Mountain climber 20 reps."}],
    s:[{name:"Along. quadríceps",duration:30,type:"timer",how:"Puxe pé."},{name:"Along. posterior+glúteo",duration:30,type:"timer",how:"Combine."},{name:"Along. adutores+panturrilha",duration:30,type:"timer",how:"Combine."}]},
];

const MC = [
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min cardio."},{name:"Rotação ombros",reps:20,type:"reps",how:"Círculos."},{name:"Puxada leve",sets:2,reps:10,type:"reps",how:"Peso leve, ativar costas."},{name:"Rotação tronco",reps:20,type:"reps",how:"Braços abertos, gire."}],
    m:[{name:"Puxada alta",detail:"Até peito",sets:4,reps:12,rest:60,type:"exercise",how:"Pegada aberta. Puxe até peito, aperte escápulas.",startKg:35},{name:"Remada baixa cabo",detail:"Escápulas!",sets:4,reps:12,rest:60,type:"exercise",how:"Puxe triângulo até abdômen. Cotovelos junto ao corpo.",startKg:30},{name:"Remada curvada barra",sets:4,reps:12,rest:60,type:"exercise",how:"Inclinado, costas retas. Puxe barra até umbigo.",startKg:25},{name:"Pulldown DROPSET",sets:4,reps:"falha",rest:45,type:"exercise",how:"Puxada até falha. Reduza, continue.",startKg:30},{name:"Remada supinada",sets:4,reps:12,rest:45,type:"exercise",how:"Pegada invertida no cabo.",startKg:25},{name:"Tríceps barra reta DROPSET",sets:4,reps:"falha",rest:45,type:"exercise",how:"Polia alta, empurre para baixo. Falha, reduza.",startKg:20},{name:"Tríceps francês halter",sets:4,reps:12,rest:45,type:"exercise",how:"Halter atrás da cabeça, cotovelos fixos. Estenda.",startKg:10},{name:"Peck deck invertido",detail:"Posterior ombro",sets:4,reps:12,rest:45,type:"exercise",how:"De frente para máquina. Abra braços para trás.",startKg:15}],
    s:[{name:"Along. costas",duration:30,type:"timer",how:"Abraçe joelhos."},{name:"Along. lat",detail:"Cada lado",duration:30,type:"timer",how:"Braço cima, incline."},{name:"Along. tríceps",detail:"Cada braço",duration:30,type:"timer",how:"Cotovelo atrás."},{name:"Along. ombro",detail:"Cada lado",duration:30,type:"timer",how:"Braço cruzado."}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min."},{name:"Rotação ombros+tronco",reps:20,type:"reps",how:"Aquecer."},{name:"Puxada leve",sets:2,reps:10,type:"reps",how:"Ativar."}],
    m:[{name:"↑ Puxada aberta",detail:"Pegada larga",sets:4,reps:10,rest:60,type:"exercise",how:"Pegada mais larga. Foco dorsal.",startKg:35},{name:"Remada curvada PIRÂMIDE",sets:4,reps:"12-10-8-6",rest:75,type:"exercise",how:"Pirâmide de carga.",startKg:30},{name:"↑ Remada unilateral",detail:"NOVO — cada braço",sets:4,reps:10,rest:60,type:"exercise",how:"Joelho e mão no banco. Puxe halter à cintura.",startKg:12},{name:"↑ Pullover halter",detail:"NOVO",sets:4,reps:12,rest:45,type:"exercise",how:"Deitado, halter acima do peito. Desça atrás da cabeça em arco.",startKg:10},{name:"Puxada supinada",sets:4,reps:10,rest:60,type:"exercise",how:"Pegada fechada invertida.",startKg:30},{name:"↑ Tríceps corda",detail:"Abrir no final",sets:4,reps:12,rest:45,type:"exercise",how:"Polia com corda. Abra as mãos no final.",startKg:15},{name:"↑ Mergulho banco",detail:"NOVO",sets:4,reps:"falha",rest:45,type:"exercise",how:"Mãos no banco atrás, pés em outro banco. Flexione cotovelos."},{name:"↑ Face pull",detail:"NOVO — saúde ombro",sets:3,reps:15,rest:30,type:"exercise",how:"Polia alta com corda. Puxe ao rosto abrindo cotovelos. Essencial para postura!",startKg:10}],
    s:[{name:"Along. costas",duration:30,type:"timer",how:"Abraçar joelhos."},{name:"Along. lat",detail:"Cada lado",duration:30,type:"timer",how:"Inclinar."},{name:"Along. tríceps",detail:"Cada braço",duration:30,type:"timer",how:"Cotovelo atrás."},{name:"Along. ombro",detail:"Cada lado",duration:30,type:"timer",how:"Braço cruzado."}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min."},{name:"Rotação ombros",reps:20,type:"reps",how:"Círculos."},{name:"Puxada leve",sets:2,reps:10,type:"reps",how:"Ativar."}],
    m:[{name:"↑ Barra fixa",detail:"NOVO — bodyweight!",sets:4,reps:"máximo",rest:90,type:"exercise",how:"Pegada pronada. Puxe até queixo passar a barra. Use gravitron se precisar."},{name:"↑ Remada T barra",detail:"NOVO — pesado",sets:4,reps:10,rest:75,type:"exercise",how:"Barra em T. Puxe ao peito. Espessura das costas.",startKg:20},{name:"Remada curvada pesada",sets:4,reps:8,rest:75,type:"exercise",how:"4x8 pesada.",startKg:40},{name:"Pulldown invertido DROPSET",sets:3,reps:"falha",rest:45,type:"exercise",how:"Pegada invertida até falha.",startKg:35},{name:"↑ Tríceps francês EZ",detail:"PIRÂMIDE",sets:4,reps:"12-10-8-6",rest:60,type:"exercise",how:"Deitado, barra EZ. Desça atrás da cabeça.",startKg:15},{name:"↑ Corda+Barra SUPERSET",detail:"12+12",sets:3,reps:"12+12",rest:60,type:"exercise",how:"12 corda + 12 barra SEM descanso.",startKg:15},{name:"↑ Encolhimento trapézio",detail:"NOVO",sets:4,reps:12,rest:45,type:"exercise",how:"Halteres. Encolha ombros. Segure 1s no topo.",startKg:14},{name:"Face pull",sets:3,reps:15,rest:30,type:"exercise",how:"Polia ao rosto. Saúde ombro.",startKg:12}],
    s:[{name:"Along. costas+lat",duration:30,type:"timer",how:"Combine."},{name:"Along. tríceps",detail:"Cada braço",duration:30,type:"timer",how:"Cotovelo atrás."},{name:"Along. ombro",detail:"Cada lado",duration:30,type:"timer",how:"Braço cruzado."}]},
  { w:[{name:"Esteira/bike",duration:300,type:"timer",how:"5 min."},{name:"Rotação ombros",reps:20,type:"reps",how:"Círculos."},{name:"Barra fixa leve",sets:2,reps:8,type:"reps",how:"Aquecer na barra."}],
    m:[{name:"Barra fixa",detail:"Bata recorde!",sets:4,reps:"máximo",rest:90,type:"exercise",how:"Máx reps. Anote e supere!"},{name:"↑ Remada Pendlay",detail:"NOVO — potência",sets:4,reps:"6-8",rest:90,type:"exercise",how:"Barra no chão entre cada rep. Puxe explosivo até abdômen.",startKg:40},{name:"Remada unilateral",detail:"Cada braço",sets:3,reps:10,rest:60,type:"exercise",how:"Halter, um braço de cada vez.",startKg:16},{name:"↑ Pullover+Pulldown SUPERSET",detail:"12+12",sets:3,reps:"12+12",rest:60,type:"exercise",how:"12 pullover + 12 pulldown.",startKg:12},{name:"↑ Paralelas",detail:"NOVO — bodyweight",sets:4,reps:"máximo",rest:60,type:"exercise",how:"Barras paralelas. Desça até 90° cotovelos."},{name:"↑ Tríceps kickback",detail:"NOVO — cada braço",sets:3,reps:12,rest:30,type:"exercise",how:"Inclinado, cotovelo fixo. Estenda braço para trás.",startKg:6},{name:"Face pull",sets:3,reps:15,rest:30,type:"exercise",how:"Saúde ombro.",startKg:15},{name:"↑ Encolhimento+Peck inv BI-SET",detail:"12+12",sets:3,reps:"12+12",rest:45,type:"exercise",how:"12 encolhimento + 12 peck invertido.",startKg:14}],
    s:[{name:"Along. costas+lat",duration:30,type:"timer",how:"Combine."},{name:"Along. tríceps+ombro",duration:30,type:"timer",how:"Combine."}]},
];

// ══════════════════════ RUNNING DATA ══════════════════════
function mkT(n,d,dur,rec){const s=[];for(let i=1;i<=n;i++){s.push({n:"Tiro "+i+" — "+d+" Z4",d:"147-164 bpm",dur});s.push({n:"Recuperação",d:"Caminhada",dur:rec});}return s;}
const RD=[
  {q:"Fartlek 20min",qS:[{n:"Fartlek",d:"Varie o ritmo!",dur:1200}],e:3,l:3.5},{q:"4x400m Z4",qS:mkT(4,"400m",150,120),e:3.5,l:4},
  {q:"Fartlek 25min",qS:[{n:"Fartlek",d:"Varie o ritmo",dur:1500}],e:4,l:4.5},{q:"5x400m Z4",qS:mkT(5,"400m",150,120),e:4,l:5},
  {q:"3km Z2",qS:[{n:"Corrida Z2",d:"110-127 bpm"}],e:3,test:"🎯 TESTE 5KM!",tD:5},
  {q:"4x600m Z4",qS:mkT(4,"600m",210,120),e:5,l:5.5},{q:"Fartlek 25min",qS:[{n:"Fartlek",d:"Varie",dur:1500}],e:5,l:6},
  {q:"5x600m Z4",qS:mkT(5,"600m",210,120),e:5.5,l:6.5},{q:"Tempo Run 15min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:900}],e:5.5,l:7},
  {q:"4km Z2",qS:[{n:"Corrida Z2",d:"Teste!"}],e:4,test:"🎯 TESTE 7KM!",tD:7},
  {q:"4x800m Z4",qS:mkT(4,"800m",270,180),e:7,l:7.5},{q:"Tempo Run 20min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:1200}],e:7,l:8},
  {q:"4x1000m Z4",qS:mkT(4,"1km",330,210),e:7.5,l:9},{q:"5km Z2",qS:[{n:"Corrida Z2",d:"Teste!"}],e:5,test:"🎯 TESTE 10KM!",tD:10},
  {q:"5x800m Z4",qS:mkT(5,"800m",270,180),e:8,l:10},{q:"Tempo Run 25min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:1500}],e:8,l:10},
  {q:"Fartlek 30min",qS:[{n:"Fartlek",d:"Varie",dur:1800}],e:8,l:11},{q:"6km Z2",qS:[{n:"Corrida Z2",d:"Pace!"}],e:6,test:"🎯 10km pace",tD:10},
  {q:"5x1000m Z4",qS:mkT(5,"1km",330,180),e:8,l:12},{q:"Tempo Run 30min Z3",qS:[{n:"Tempo Run Z3",d:"Ritmo meia!",dur:1800}],e:8,l:12},
  {q:"4x1200m Z4",qS:mkT(4,"1.2km",400,240),e:9,l:13},{q:"Tempo Run 35min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:2100}],e:9,l:14},
  {q:"5x1200m Z4",qS:mkT(5,"1.2km",400,180),e:9,l:15},{q:"6km Z2",qS:[{n:"Corrida Z2",d:"Teste!"}],e:6,test:"🎯 TESTE 15KM!",tD:15},
  {q:"Tempo Run 35min Z3",qS:[{n:"Tempo Run Z3",d:"129-145 bpm",dur:2100}],e:10,l:16},{q:"5x1000m Z4",qS:mkT(5,"1km",330,180),e:10,l:17},
  {q:"Tempo Run 40min Z3",qS:[{n:"Tempo Run Z3",d:"Pico!",dur:2400}],e:10,l:18},{q:"Fartlek 35min",qS:[{n:"Fartlek",d:"Varie",dur:2100}],e:8,l:19},
  {q:"4x800m TAPER",qS:mkT(4,"800m",270,180),e:8,l:10},{q:"5km Z2",qS:[{n:"Corrida Z2",d:"MEIA!"}],e:3,test:"🏆 21KM!",tD:21},
];

// ══════════════════════ CONSTANTS ══════════════════════
const SL=["Musculação A","Corrida Qualidade","Musculação B","Corrida Leve","Musculação C","Corrida Longa"];
const SS=["A","🏃","B","🏃","C","🏃‍♂️"];const SIC=["🏋️","🏃","🦵","🏃","💪","🏃‍♂️"];
const SCO=["#2E7D32","#E65100","#1565C0","#E65100","#4A148C","#B71C1C"];
const PH=[{n:"FASE 1: 3km→5km",a:1,b:5,c:"#2E7D32"},{n:"FASE 2: 5km→7km",a:6,b:10,c:"#1565C0"},{n:"FASE 3: 7km→10km",a:11,b:14,c:"#E65100"},{n:"FASE 4: Consol 10km",a:15,b:18,c:"#4A148C"},{n:"FASE 5: 10km→15km",a:19,b:24,c:"#B71C1C"},{n:"FASE 6: Meia!",a:25,b:30,c:"#F57F17"}];
const gp=w=>PH.find(p=>w>=p.a&&w<=p.b)||PH[0];

// ══════════════════════ BUILD FUNCTIONS ══════════════════════
function bm(phases,wk){const p=getMPh(wk),m=phases[p],r=[];
  r.push({section:"🔥 AQUECIMENTO"});m.w.forEach(e=>r.push({...e,ph:"w"}));
  r.push({section:"💪 TREINO — "+PHASE_NAMES[p]});m.m.forEach(e=>r.push({...e,ph:"m"}));
  r.push({section:"🧘 ALONGAMENTO"});m.s.forEach(e=>r.push({...e,ph:"s"}));
  r.push({section:"🦶 FORTALECIMENTO PÉS"});(phases===MB?FEET_B:FEET_S).forEach(e=>r.push({...e,ph:"f"}));
  return r;}

function br(wk,rt){const rd=RD[wk-1];if(!rd)return[];const r=[];
  r.push({section:"🦶 PÉS PRÉ-CORRIDA"});FOOT_PRE.forEach(e=>r.push({...e,ph:"fp"}));
  r.push({section:"🔥 AQUECIMENTO"});WARMUP_RUN.forEach(e=>r.push({...e,ph:"w"}));
  r.push({section:"🏃 CORRIDA"});r.push({name:"Aquecimento: Caminhada",detail:"Z1 (92-109 bpm)",duration:300,type:"timer",ph:"r",how:"Caminhe 5 min."});
  if(rt==="q")rd.qS.forEach(x=>r.push({name:x.n,detail:x.d,duration:x.dur,type:x.dur?"timer":"manual",ph:"r"}));
  else if(rt==="e")r.push({name:"Corrida Z2 — "+rd.e+"km",detail:"110-127 bpm",type:"manual",ph:"r",how:"Ritmo leve, conversação."});
  else if(rt==="l"){if(rd.test)r.push({name:rd.test,detail:"Z2 — "+rd.tD+"km",type:"manual",ph:"r",isTest:true,how:"NÃO ACELERE! Completar é o objetivo."});else r.push({name:"Longão Z2 — "+rd.l+"km",detail:"CONVERSA",type:"manual",ph:"r",how:"Ritmo de conversa."});}
  r.push({name:"Volta à calma",detail:"Caminhada Z1",duration:300,type:"timer",ph:"r",how:"5 min caminhada."});
  r.push({section:"🧘 ALONGAMENTO PÓS"});STRETCH.forEach(e=>r.push({...e,ph:"s"}));
  r.push({section:"❄️ GELO NOS PÉS"});ICE.forEach(e=>r.push({...e,ph:"i"}));return r;}

function bw(wk,si){if(si===0)return bm(MA,wk);if(si===1)return br(wk,"q");if(si===2)return bm(MB,wk);if(si===3)return br(wk,"e");if(si===4)return bm(MC,wk);if(si===5)return br(wk,"l");return[];}
function ft(s){if(s==null)return"--:--";return Math.floor(s/60)+":"+(s%60).toString().padStart(2,"0");}
function grd(wk,si){const r=RD[wk-1];if(!r)return"";if(si===1)return r.q;if(si===3)return r.e?r.e+"km Z2":"";if(si===5)return r.test||(r.l?r.l+"km Longão":"");return"";}

// ══════════════════════ UI COMPONENTS ══════════════════════
function CT({time,total,running,color}){const r=70,circ=2*Math.PI*r,off=circ*(1-(total>0?(total-time)/total:0));
  return<svg viewBox="0 0 160 160" style={{width:180,height:180}}><circle cx="80" cy="80" r={r} fill="none" stroke="#1a1a2e" strokeWidth="8"/><circle cx="80" cy="80" r={r} fill="none" stroke={color||"#4ade80"} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{transform:"rotate(-90deg)",transformOrigin:"center",transition:"stroke-dashoffset 0.3s"}}/><text x="80" y="72" textAnchor="middle" fill="white" fontSize="32" fontWeight="800" fontFamily="monospace">{ft(time)}</text><text x="80" y="98" textAnchor="middle" fill="#94a3b8" fontSize="11">{running?"EM ANDAMENTO":time===0?"CONCLUÍDO ✓":"PAUSADO"}</text></svg>;}
function CU({time,running}){return<svg viewBox="0 0 160 160" style={{width:180,height:180}}><circle cx="80" cy="80" r="70" fill="none" stroke="#1a1a2e" strokeWidth="8"/><circle cx="80" cy="80" r="70" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="8 6" style={{animation:running?"spin 8s linear infinite":"none"}}/><text x="80" y="72" textAnchor="middle" fill="white" fontSize="32" fontWeight="800" fontFamily="monospace">{ft(time)}</text><text x="80" y="98" textAnchor="middle" fill="#94a3b8" fontSize="11">{running?"CORRENDO...":"PAUSADO"}</text></svg>;}

function PVList({steps}){return<div style={{maxHeight:"55vh",overflowY:"auto"}}>{steps.map((s,i)=>s.section?<div key={i} style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginTop:14,marginBottom:6}}>{s.section}</div>:<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:"rgba(255,255,255,0.03)",borderRadius:8,marginBottom:3}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:s.name&&s.name.startsWith("↑")?"#4ade80":"#e2e8f0"}}>{s.name}</div>{s.detail&&<div style={{fontSize:11,color:"#64748b"}}>{s.detail}</div>}</div><div style={{fontSize:11,color:"#475569",textAlign:"right",minWidth:55}}>{s.sets&&s.reps?s.sets+"x"+s.reps:s.duration&&!s.sets?ft(s.duration):s.sets&&s.duration?s.sets+"x"+ft(s.duration):s.reps?s.reps+" reps":""}</div></div>)}</div>;}

function TabataTimer({work,rest:restT,rounds,onDone,color}){
  const[round,setRound]=useState(1),[phase,setPhase]=useState("work"),[time,setTime]=useState(work),[running,setRunning]=useState(false),[done,setDone]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{if(running&&time>0){ref.current=setInterval(()=>setTime(t=>t-1),1000);}else{clearInterval(ref.current);if(time===0&&running){playBeep();if(phase==="work"){setPhase("rest");setTime(restT);}else{if(round<rounds){setRound(r=>r+1);setPhase("work");setTime(work);}else{setRunning(false);setDone(true);}}}}return()=>clearInterval(ref.current);},[running,time,phase,round,rounds,work,restT]);
  return<div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:phase==="work"?"#ef4444":"#4ade80",marginBottom:4}}>{done?"COMPLETO!":phase==="work"?"💥 ESFORÇO":"😮‍💨 DESCANSO"}</div><div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>Round {round}/{rounds}</div><CT time={time} total={phase==="work"?work:restT} running={running} color={phase==="work"?"#ef4444":"#4ade80"}/>{!running&&!done&&<button onClick={()=>setRunning(true)} style={{marginTop:12,padding:"10px 28px",background:color,color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>{time===work&&round===1?"▶ Iniciar Tabata":"▶ Continuar"}</button>}{running&&<button onClick={()=>setRunning(false)} style={{marginTop:12,padding:"10px 28px",background:"#334155",color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>⏸ Pausar</button>}{done&&<button onClick={onDone} style={{marginTop:12,padding:"10px 28px",background:"#4ade80",color:"#0f0f1a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>✓ Concluído</button>}</div>;
}

// ══════════════════════ REHAB SCREEN ══════════════════════
function RehabScreen({onBack}){
  const[activeRoutine,setActiveRoutine]=useState(null);
  const[sI,setSI]=useState(0);
  const[tmr,setTmr]=useState(0);
  const[tmrOn,setTmrOn]=useState(false);
  const[cS,setCS]=useState(1);
  const[rst,setRst]=useState(false);
  const[showHow,setShowHow]=useState(true);
  const iR=useRef(null),bp=useRef(false);
  
  useEffect(()=>{if(tmrOn&&tmr>0){bp.current=false;iR.current=setInterval(()=>setTmr(t=>t-1),1000);}else{clearInterval(iR.current);if(tmr===0&&tmrOn){setTmrOn(false);if(!bp.current){playBeep();bp.current=true;}}}return()=>clearInterval(iR.current);},[tmrOn,tmr]);

  if(!activeRoutine){
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#94a3b8",fontSize:14,cursor:"pointer",padding:4,marginBottom:16}}>← Voltar ao treino</button>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:32,marginBottom:8}}>🦶</div>
        <div style={{fontSize:22,fontWeight:800}}>Reabilitação Fascite Plantar</div>
        <div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>Protocolo baseado em evidência científica</div>
        <div style={{fontSize:11,color:"#ef4444",marginTop:8,padding:"6px 12px",background:"#ef444415",borderRadius:8,display:"inline-block"}}>⚠️ Pare de correr até a dor melhorar</div>
      </div>
      <div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Escolha a rotina do momento</div>
      {REHAB_ROUTINES.map(r=><button key={r.id} onClick={()=>{setActiveRoutine(r);setSI(0);setCS(1);setTmr(0);setTmrOn(false);setRst(false);const ex=r.exercises[0];if(ex&&ex.duration&&ex.type==="timer")setTmr(ex.duration)}} style={{width:"100%",padding:"16px",marginBottom:10,borderRadius:14,border:"1px solid "+r.color+"44",background:"linear-gradient(135deg,"+r.color+"15,"+r.color+"05)",cursor:"pointer",textAlign:"left"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:16,fontWeight:800,color:"white"}}>{r.title}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{r.subtitle}</div><div style={{fontSize:11,color:r.color,marginTop:4}}>{r.when}</div></div>
          <div style={{fontSize:12,color:"#64748b",background:"rgba(255,255,255,0.06)",padding:"4px 10px",borderRadius:8}}>{r.time}</div>
        </div>
        <div style={{fontSize:11,color:"#475569",marginTop:8}}>{r.exercises.length} exercícios</div>
      </button>)}
      <div style={{marginTop:20,padding:14,background:"rgba(255,255,255,0.03)",borderRadius:12,border:"1px solid #1e293b"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#f59e0b",marginBottom:6}}>📋 Frequência recomendada</div>
        <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.6}}>
          • 🌅 Matinal — TODOS os dias ao acordar (na cama!)<br/>
          • 🌞 Manhã — TODOS os dias, 1x<br/>
          • 🌆 Tarde — TODOS os dias, 1x<br/>
          • 💪 Carga (Rathleff) — DIAS ALTERNADOS (seg/qua/sex)
        </div>
      </div>
      <div style={{marginTop:12,padding:14,background:"#ef444410",borderRadius:12,border:"1px solid #ef444433"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#ef4444",marginBottom:6}}>🚫 O que NÃO fazer</div>
        <div style={{fontSize:11,color:"#fca5a5",lineHeight:1.6}}>
          • Correr, saltar, burpees, polichinelos<br/>
          • Andar descalço em piso duro<br/>
          • Alongar agressivamente com pé "frio"<br/>
          • Massagem forte no calcanhar
        </div>
      </div>
    </div>;
  }

  // Active routine execution
  const routine=activeRoutine;
  const exercises=routine.exercises;
  const step=exercises[sI];
  const tot=exercises.length;
  const mx=step.sets||1;
  const isT=step.type==="timer"||step.type==="timed_exercise";
  const isE=step.type==="exercise"||step.type==="timed_exercise";

  function nxt(){setTmrOn(false);setRst(false);setCS(1);setShowHow(true);if(sI+1>=tot){setActiveRoutine(null);return;}const n=exercises[sI+1];setSI(sI+1);if(n&&n.duration&&n.type==="timer")setTmr(n.duration);else setTmr(0);}
  function dn(){if(cS<mx){if(step.rest){setRst(true);setTmr(step.rest);setTmrOn(true);}setCS(cS+1);}else nxt();}
  const bb=(bg,cl)=>({padding:"14px 0",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",background:bg,color:cl,flex:1});

  return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:16,maxWidth:480,margin:"0 auto"}}>
    <style>{"@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}"}</style>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <button onClick={()=>{setTmrOn(false);setActiveRoutine(null)}} style={{background:"none",border:"none",color:"#94a3b8",fontSize:14,cursor:"pointer",padding:4}}>← Sair</button>
      <div style={{fontSize:12,color:"#64748b"}}>{sI+1}/{tot}</div>
    </div>
    <div style={{height:4,background:"#1a1a2e",borderRadius:2,marginBottom:12}}><div style={{height:4,borderRadius:2,background:routine.color,width:((sI+1)/tot*100)+"%",transition:"width 0.3s"}}/></div>
    <div style={{fontSize:11,color:routine.color,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8,textAlign:"center"}}>{routine.title}</div>
    <div style={{textAlign:"center",marginBottom:12}}>
      <div style={{fontSize:20,fontWeight:800,marginBottom:4,lineHeight:1.3}}>{step.name}</div>
      {step.detail&&<div style={{fontSize:13,color:"#94a3b8"}}>{step.detail}</div>}
      {step.sets&&step.reps&&<div style={{fontSize:13,color:routine.color,marginTop:4}}>{step.sets}x{step.reps}</div>}
    </div>
    
    {/* How to do */}
    {step.how&&<div style={{padding:14,background:"rgba(255,255,255,0.04)",borderRadius:12,marginBottom:12,border:"1px solid #1e293b"}}>
      <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",marginBottom:6}}>📖 Como fazer:</div>
      <div style={{fontSize:12,color:"#cbd5e1",lineHeight:1.6}}>{step.how}</div>
    </div>}

    {isE&&!rst&&<div style={{textAlign:"center",marginBottom:8}}>
      <div style={{display:"inline-flex",gap:6,marginBottom:8}}>{Array.from({length:mx},(_,i)=><div key={i} style={{width:32,height:32,borderRadius:"50%",background:i<cS-1?routine.color:i===cS-1?routine.color+"66":"#1a1a2e",border:i===cS-1?"2px solid "+routine.color:"2px solid #1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:i<cS?"white":"#475569"}}>{i<cS-1?"✓":i+1}</div>)}</div>
      <div style={{fontSize:14,fontWeight:700}}>Série {cS}/{mx}{step.reps?" — "+(typeof step.reps==="string"?(step.reps.split("-")[cS-1]||step.reps):step.reps)+" reps":""}</div>
    </div>}
    {rst&&<div style={{textAlign:"center",marginBottom:8}}><div style={{fontSize:13,color:"#94a3b8",marginBottom:4}}>⏱ DESCANSO</div><CT time={tmr} total={step.rest||60} running={tmrOn} color={routine.color}/></div>}
    {isT&&!rst&&!isE&&step.duration&&<div style={{textAlign:"center",marginBottom:8}}><CT time={tmr} total={step.duration} running={tmrOn} color={routine.color}/></div>}
    {isE&&step.type==="timed_exercise"&&!rst&&<div style={{textAlign:"center",marginBottom:8}}><CT time={tmr} total={step.duration||60} running={tmrOn} color={routine.color}/></div>}
    
    <div style={{display:"flex",gap:10,marginTop:16}}>
      {isT&&!rst&&!isE&&step.duration&&<>{!tmrOn&&tmr>0&&<button onClick={()=>setTmrOn(true)} style={bb(routine.color,"white")}>▶ {tmr===step.duration?"Iniciar":"Continuar"}</button>}{tmrOn&&<button onClick={()=>setTmrOn(false)} style={bb("#334155","white")}>⏸ Pausar</button>}{tmr===0&&!tmrOn&&<button onClick={nxt} style={bb("#4ade80","#0f0f1a")}>✓ Próximo</button>}</>}
      {isE&&step.type==="timed_exercise"&&!rst&&<>{!tmrOn&&<button onClick={()=>{setTmr(step.duration||60);setTmrOn(true)}} style={bb(routine.color,"white")}>▶ Série {cS}</button>}{tmrOn&&<button onClick={()=>setTmrOn(false)} style={bb("#334155","white")}>⏸ Pausar</button>}{tmr===0&&!tmrOn&&<button onClick={dn} style={bb("#4ade80","#0f0f1a")}>✓ Concluída</button>}</>}
      {isE&&step.type==="exercise"&&!rst&&<button onClick={dn} style={bb("#4ade80","#0f0f1a")}>✓ Série {cS} concluída</button>}
      {rst&&<>{tmr>0&&<button onClick={()=>{setRst(false);setTmrOn(false);setTmr(0)}} style={bb("#334155","white")}>Pular descanso</button>}{tmr===0&&<button onClick={()=>{setRst(false);setTmr(0)}} style={bb("#4ade80","#0f0f1a")}>✓ Próxima série</button>}</>}
      {step.type==="reps"&&!step.sets&&<button onClick={nxt} style={bb("#4ade80","#0f0f1a")}>✓ Concluído</button>}
      {step.type==="reps"&&step.sets&&<button onClick={dn} style={bb("#4ade80","#0f0f1a")}>✓ Série {cS}/{mx}</button>}
    </div>
    <button onClick={nxt} style={{width:"100%",marginTop:10,padding:"10px 0",background:"transparent",color:"#475569",border:"none",fontSize:12,cursor:"pointer"}}>Pular passo →</button>
    {sI+1<tot&&<div style={{marginTop:16,padding:12,background:"rgba(255,255,255,0.03)",borderRadius:10,borderLeft:"3px solid "+routine.color+"33"}}><div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>A seguir</div><div style={{fontSize:13,color:"#94a3b8"}}>{exercises[sI+1]&&exercises[sI+1].name}</div></div>}
  </div>;
}

// ══════════════════════ MAIN APP ══════════════════════
export default function App(){
  const[wk,setWk]=useState(2),[ses,setSes]=useState(2),[scr,setScr]=useState("home");
  const[pvS,setPvS]=useState(0),[sI,setSIdx]=useState(0),[cS,setCS]=useState(1);
  const[tmr,setTmr]=useState(0),[tmrOn,setTmrOn]=useState(false),[rst,setRst]=useState(false);
  const[cup,setCup]=useState(0),[cupOn,setCupOn]=useState(false),[ok,setOk]=useState(false);
  const[showHow,setShowHow]=useState(false);
  const iR=useRef(null),cR=useRef(null),bp=useRef(false);

  useEffect(()=>{(async()=>{try{const r=localStorage.getItem("tp7");if(r){const d=JSON.parse(r);setWk(d.w||2);setSes(d.s!==undefined?d.s:2);}}catch(e){}setOk(true);})();},[]);
  const sv=useCallback((w,s)=>{try{localStorage.setItem("tp7",JSON.stringify({w,s}))}catch(e){}},[]);

  useEffect(()=>{if(tmrOn&&tmr>0){bp.current=false;iR.current=setInterval(()=>setTmr(t=>t-1),1000);}else{clearInterval(iR.current);if(tmr===0&&tmrOn){setTmrOn(false);if(!bp.current){playBeep();bp.current=true;}}}return()=>clearInterval(iR.current);},[tmrOn,tmr]);
  useEffect(()=>{if(cupOn)cR.current=setInterval(()=>setCup(t=>t+1),1000);else clearInterval(cR.current);return()=>clearInterval(cR.current);},[cupOn]);

  const all=bw(wk,ses),steps=all.filter(s=>!s.section),step=steps[sI],ph=gp(wk),tot=steps.length,mph=getMPh(wk);
  function curSec(){let sec="",c=0;for(const s of all){if(s.section){sec=s.section;continue;}if(c===sI)return sec;c++;}return sec;}
  function startAny(si){setSes(si);sv(wk,si);setSIdx(0);setCS(1);setRst(false);setTmr(0);setTmrOn(false);setCup(0);setCupOn(false);setShowHow(false);const w=bw(wk,si),st=w.filter(x=>!x.section);if(st[0]&&st[0].duration&&st[0].type==="timer")setTmr(st[0].duration);setScr("workout");}
  function adv(){let ns=ses+1,nw=wk;if(ns>=6){ns=0;nw=Math.min(wk+1,30);}setSes(ns);setWk(nw);sv(nw,ns);setScr("home");}
  function nxt(){setTmrOn(false);setCupOn(false);setRst(false);setCS(1);setCup(0);setShowHow(false);if(sI+1>=tot){adv();return;}const n=steps[sI+1];setSIdx(sI+1);if(n&&n.duration&&n.type==="timer")setTmr(n.duration);else setTmr(0);}
  function dn(){const mx=step.sets||1;if(cS<mx){if(step.rest){setRst(true);setTmr(step.rest);setTmrOn(true);}setCS(cS+1);}else nxt();}

  if(!ok)return<div style={{background:"#0f0f1a",color:"white",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui"}}><p style={{opacity:.6}}>Carregando...</p></div>;
  const G="@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}";
  const bb=(bg,cl)=>({padding:"14px 0",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",background:bg,color:cl,flex:1});

  // REHAB SCREEN
  if(scr==="rehab") return<RehabScreen onBack={()=>setScr("home")}/>;

  // PREVIEW
  if(scr==="preview"){const pw=bw(wk,pvS),desc=grd(wk,pvS),isMu=pvS===0||pvS===2||pvS===4;
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:16,maxWidth:480,margin:"0 auto"}}><style>{G}</style>
      <button onClick={()=>setScr("home")} style={{background:"none",border:"none",color:"#94a3b8",fontSize:14,cursor:"pointer",padding:4,marginBottom:12}}>← Voltar</button>
      <div style={{display:"flex",gap:5,marginBottom:16,overflowX:"auto",paddingBottom:4}}>{[0,1,2,3,4,5].map(i=><button key={i} onClick={()=>setPvS(i)} style={{padding:"7px 12px",borderRadius:10,border:"none",cursor:"pointer",whiteSpace:"nowrap",fontSize:11,fontWeight:i===pvS?800:500,background:i===pvS?SCO[i]:"rgba(255,255,255,0.06)",color:i===pvS?"white":"#94a3b8"}}>{SS[i]}</button>)}</div>
      <div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:36,marginBottom:4}}>{SIC[pvS]}</div><div style={{fontSize:20,fontWeight:800}}>{SL[pvS]}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Semana {wk} — {ph.n}</div>{isMu&&<div style={{fontSize:11,color:"#4ade80",marginTop:4}}>🏋️ {PHASE_NAMES[mph]}</div>}{desc&&<div style={{fontSize:13,color:SCO[pvS],fontWeight:600,marginTop:6,background:SCO[pvS]+"18",borderRadius:8,padding:"4px 12px",display:"inline-block"}}>{desc}</div>}</div>
      <PVList steps={pw}/>
      <button onClick={()=>startAny(pvS)} style={{width:"100%",marginTop:16,padding:"14px 0",background:"linear-gradient(135deg,"+SCO[pvS]+","+SCO[pvS]+"cc)",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:"pointer",letterSpacing:1,textTransform:"uppercase"}}>INICIAR ESTE TREINO</button></div>;}

  // HOME
  if(scr==="home"){const desc=grd(wk,ses);
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto"}}><style>{G}</style>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:12,color:"#94a3b8",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Treino Híbrido</div>
        <div style={{fontSize:28,fontWeight:800,background:"linear-gradient(135deg,"+ph.c+",#4ade80)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>SEMANA {wk}/30</div>
        <div style={{fontSize:12,color:ph.c,fontWeight:600,marginTop:4}}>{ph.n}</div>
        <div style={{fontSize:10,color:"#64748b",marginTop:4}}>🏋️ {PHASE_NAMES[mph]}</div>
      </div>

      {/* REHAB BUTTON - always visible */}
      <button onClick={()=>setScr("rehab")} style={{width:"100%",padding:"14px 16px",marginBottom:16,borderRadius:14,border:"1px solid #ef444444",background:"linear-gradient(135deg,#ef444415,#ef444405)",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:28}}>🦶</div>
        <div><div style={{fontSize:14,fontWeight:700,color:"#ef4444"}}>Reabilitação Fascite Plantar</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Rotinas diárias — toque a qualquer momento</div></div>
      </button>

      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:4,marginBottom:16}}>
        <div style={{display:"flex",gap:2}}>{[0,1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:6,borderRadius:3,background:i<ses?SCO[i]:i===ses?SCO[i]+"99":"#1a1a2e",animation:i===ses?"pulse 2s infinite":"none"}}/>)}</div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 2px 2px",fontSize:9,color:"#64748b"}}>{SS.map((l,i)=><span key={i} style={{flex:1,textAlign:"center",fontWeight:i===ses?700:400,color:i===ses?"white":"#64748b"}}>{l}</span>)}</div>
      </div>
      <div style={{background:"linear-gradient(135deg,"+SCO[ses]+"22,"+SCO[ses]+"08)",border:"1px solid "+SCO[ses]+"44",borderRadius:20,padding:28,textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:56,marginBottom:8}}>{SIC[ses]}</div>
        <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Próximo treino</div>
        <div style={{fontSize:22,fontWeight:800,marginBottom:6}}>{SL[ses]}</div>
        {desc&&<div style={{fontSize:14,color:SCO[ses],fontWeight:600,background:SCO[ses]+"18",borderRadius:8,padding:"6px 14px",display:"inline-block"}}>{desc}</div>}
      </div>
      <button onClick={()=>startAny(ses)} style={{width:"100%",padding:"16px 0",fontSize:17,fontWeight:800,background:"linear-gradient(135deg,"+SCO[ses]+","+SCO[ses]+"cc)",color:"white",border:"none",borderRadius:14,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>INICIAR TREINO</button>
      {ses===3&&<button onClick={adv} style={{width:"100%",padding:"12px 0",fontSize:13,fontWeight:600,background:"transparent",color:"#94a3b8",border:"1px solid #334155",borderRadius:12,cursor:"pointer",marginBottom:6}}>Pular corrida leve (semana 2x)</button>}
      <button onClick={adv} style={{width:"100%",padding:"10px 0",fontSize:12,background:"transparent",color:"#475569",border:"none",cursor:"pointer"}}>Pular treino →</button>
      <div style={{marginTop:24}}><div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Treinos — toque para ver ou iniciar</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[0,1,2,3,4,5].map(i=><button key={i} onClick={()=>{setPvS(i);setScr("preview")}} style={{padding:"12px 6px",borderRadius:12,border:i===ses?"2px solid "+SCO[i]:"1px solid #1e293b",background:i===ses?SCO[i]+"15":"rgba(255,255,255,0.02)",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:22,marginBottom:2}}>{SIC[i]}</div><div style={{fontSize:10,color:i===ses?SCO[i]:"#94a3b8",fontWeight:i===ses?700:500}}>{SL[i].replace("Musculação ","").replace("Corrida ","")}</div>{i===ses&&<div style={{fontSize:8,color:SCO[i],marginTop:2,fontWeight:700}}>PRÓXIMO</div>}</button>)}</div></div>
      <div style={{marginTop:20,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:16}}><div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Ajustar posição</div><div style={{display:"flex",gap:8,alignItems:"center"}}><label style={{fontSize:12,color:"#94a3b8",minWidth:55}}>Semana</label><input type="range" min="1" max="30" value={wk} onChange={e=>{const w=+e.target.value;setWk(w);sv(w,ses)}} style={{flex:1,accentColor:ph.c}}/><span style={{fontSize:14,fontWeight:700,minWidth:24,textAlign:"center"}}>{wk}</span></div></div>
    </div>;}

  // WORKOUT
  if(scr==="workout"&&step){const sec=curSec(),iT=step.type==="timer"||step.type==="timed_exercise",iE=step.type==="exercise"||step.type==="timed_exercise",isTab=step.type==="tabata",mx=step.sets||1,pc=step.ph==="r"?"#E65100":step.ph==="fp"||step.ph==="f"?"#F57F17":step.ph==="i"?"#0ea5e9":step.ph==="w"?"#F57F17":step.ph==="s"?"#1565C0":SCO[ses];
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:16,maxWidth:480,margin:"0 auto"}}><style>{G}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={()=>{setTmrOn(false);setCupOn(false);setScr("home")}} style={{background:"none",border:"none",color:"#94a3b8",fontSize:14,cursor:"pointer",padding:4}}>← Sair</button>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setScr("rehab")} style={{background:"#ef444420",border:"none",color:"#ef4444",fontSize:11,padding:"4px 8px",borderRadius:6,cursor:"pointer"}}>🦶 Rehab</button>
          <span style={{fontSize:12,color:"#64748b"}}>{sI+1}/{tot}</span>
        </div>
      </div>
      <div style={{height:4,background:"#1a1a2e",borderRadius:2,marginBottom:12}}><div style={{height:4,borderRadius:2,background:pc,width:((sI+1)/tot*100)+"%",transition:"width 0.3s"}}/></div>
      <div style={{fontSize:12,color:pc,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8,textAlign:"center"}}>{sec}</div>
      <div style={{textAlign:"center",marginBottom:8}}>
        <div style={{fontSize:20,fontWeight:800,marginBottom:4,lineHeight:1.3,color:step.name&&step.name.startsWith("↑")?"#4ade80":"white"}}>{step.name}</div>
        {step.detail&&<div style={{fontSize:13,color:"#94a3b8"}}>{step.detail}</div>}
        {step.how&&<button onClick={()=>setShowHow(!showHow)} style={{marginTop:6,fontSize:11,padding:"4px 12px",borderRadius:8,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"1px solid #334155",cursor:"pointer"}}>{showHow?"Fechar":"📖 Como fazer"}</button>}
        {showHow&&step.how&&<div style={{marginTop:8,padding:12,background:"rgba(255,255,255,0.04)",borderRadius:10,fontSize:12,color:"#cbd5e1",lineHeight:1.5,textAlign:"left"}}>{step.how}</div>}
      </div>

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
      {step.isTest&&<div style={{marginTop:16,padding:14,background:pc+"15",borderRadius:12,border:"1px solid "+pc+"33",textAlign:"center"}}><div style={{fontSize:24,marginBottom:4}}>🎯</div><div style={{fontSize:13,color:pc,fontWeight:700}}>DIA DE TESTE!</div><div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>Não acelere! COMPLETAR é o objetivo!</div></div>}
    </div>;}

  return<div style={{background:"#0f0f1a",color:"white",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><p>Carregando...</p></div>;
}
