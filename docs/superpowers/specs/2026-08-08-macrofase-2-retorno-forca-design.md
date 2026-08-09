# Macrofase 2 — Retorno à Força — Design

## Contexto

Macrofases 0-1 (pré/pós-operatório, rehab intensiva) e a agenda terça-sexta com carryover já estão implementadas e no ar. Macrofase 2 (08/09 a 05/10/2026, 4 semanas) é a primeira fase "de volta ao treino de verdade" — musculação ABC retorna (Fase 1, com ramp-up de carga), fascite vira manutenção reduzida, e surgem os testes de caminhada que liberam (ou não) a corrida na macrofase 3.

Fonte de conteúdo: seção 6 de `app-treino-corrida.md` (transcrição mecânica, sem decisão de design nova) e o spec original `docs/superpowers/specs/2026-08-06-macrofases-restructure-design.md`.

## Decisão de arquitetura

Home hoje tem: `if(mfInfo.macrofase>1)` → fallback "🚧 não configurada". Essa guarda vira `if(mfInfo.macrofase>4)` (nunca verdadeiro na prática, já que `MACRO_PHASES` clampa em macrofase 4 pra sempre — mantido só por defensividade) e a Home para `mfInfo.macrofase===2` passa a renderizar o **grid antigo reconectado**: card "Próximo treino" + botão "Iniciar treino" + grid de 6 sessões + preview — reaproveitando `RehabScreen`-equivalente já existente (`WorkoutScreen` é o bloco `if(scr==="workout")`, já genérico) em vez do checklist da macrofase 0-1 (decisão já tomada com o usuário).

Duas peças novas de motor, ambas puras, ao lado de `bm`/`bw`/`grd`:

```js
function getMuscPhaseIndex(macrofase, semanaIdx) {
  if (macrofase === 2) return 0;                    // Fase 1 inteira
  if (macrofase === 3) return semanaIdx < 2 ? 0 : 1; // sem1-2 Fase1, sem3-4 Fase2
  if (macrofase === 4) return semanaIdx < 4 ? 1 : 2; // nov=Fase2, dez=Fase3
  return 0;
}

function levePeso(ex) {
  if (ex.type !== "exercise") return ex; // preserva timer/timed_exercise/tabata (ex: Prancha, Tabata em MB) intactos
  if (typeof ex.reps === "string") { const { detail, ...rest } = ex; return { ...rest, sets: 3, reps: 15 }; }
  return { ...ex, sets: 3, reps: 15 };
}

function buildMuscSession(phases, macrofase, semanaIdx) {
  const p = getMuscPhaseIndex(macrofase, semanaIdx);
  const fase = phases[p];
  const leve = macrofase === 2 && semanaIdx < 2;
  const m = leve ? fase.m.map(levePeso) : fase.m;
  const r = [];
  r.push({ section: "🔥 AQUECIMENTO" }); fase.w.forEach(e => r.push({ ...e, ph: "w" }));
  r.push({ section: "💪 TREINO — " + PHASE_NAMES[p] }); m.forEach(e => r.push({ ...e, ph: "m" }));
  r.push({ section: "🧘 ALONGAMENTO" }); fase.s.forEach(e => r.push({ ...e, ph: "s" }));
  r.push({ section: "🦶 FORTALECIMENTO PÉS" }); (phases === MB ? FEET_B : FEET_S).forEach(e => r.push({ ...e, ph: "f" }));
  return r;
}
```

`buildMuscSession` espelha `bm()` mas troca a seleção de fase (`getMPh(wk)`, baseada no contador antigo de 1-30 semanas) por `getMuscPhaseIndex(macrofase,semanaIdx)`. `MA`/`MB`/`MC`/`FEET_B`/`FEET_S`/`PHASE_NAMES` não mudam — só ganham um segundo modo de seleção. `bm`/`bw`/`getMPh`/`RD`/`grd` continuam existindo intactos (código morto, mas sem risco de remover algo que a macrofase 4 pode precisar revisitar).

`sv()` (`useCallback((w,s)=>...`) ganha o campo `o` que faltava — hoje grava `{w,s}` sem `diasOffset`, derrubando silenciosamente o offset de teste sempre que o fluxo antigo de treino salva progresso. Vira `sv(w,s,o)` gravando `{w,s,o}`; os dois call sites existentes (`startAny`, `adv`) passam `diasOffset` no lugar.

## Sequência de sessões (macrofase 2)

Reaproveita `SL`/`SS`/`SIC`/`SCO` (já existem, 6 entradas: A/Qualidade/B/Leve/C/Longa) — mas SEM corrida ainda. Sequência efetiva vira só 3 sessões (A/B/C), sem os índices de corrida (1,3,5). Nova constante:

```js
const SEQ_M2 = [0, 2, 4]; // índices em SL/SS/SIC/SCO — só Musculação A/B/C
```

`sesM2` (estado, 0/1/2, persiste em `tp7musc2` como `{i}`) indexa `SEQ_M2` pra saber qual das 3 é a próxima.

## Rehab reduzido (macrofase 2)

```js
const REHAB_M2_BASE = {
  id: "m2-base", title: "🦶 Manutenção fascite", subtitle: "2x/dia — acordar + antes de dormir", time: "~10 min", when: "Todos os dias, 2x", color: "#f59e0b",
  exercises: [
    { name: "Alongamento DiGiovanni (fáscia)", reps: 10, type: "reps",
      how: "Sentado, cruze a perna afetada sobre a outra. Segure a base dos dedos (não a ponta) e puxe para cima e para trás. Palpe a fáscia com a outra mão. Segure 10 segundos cada repetição. 10 vezes." },
    { name: "Along. panturrilha (joelho reto + dobrado)", sets: 3, duration: 30, type: "timer",
      how: "Mãos na parede, perna afetada atrás, calcanhar firme no chão. 30s joelho reto (gastrocnêmio) + 30s joelho dobrado (sóleo). 3x cada." },
    { name: "Bolinha de tênis na sola", duration: 180, type: "timer",
      how: "Role a bolinha do calcanhar à base dos dedos. Pressão moderada (≤3/10 de dor). 3 minutos." },
    { name: "❄️ GELO NOS PÉS", detail: "OBRIGATÓRIO!", duration: 900, type: "timer", isIce: true,
      how: "Garrafa congelada com fronha ou bolsa de gelo com toalha fina. 15 minutos." },
  ],
};

const REHAB_M2_CARGA = {
  id: "m2-carga", title: "💪 Rathleff — 4×10 com mochila", subtitle: "Unilateral, com carga", time: "~12 min", when: "Dias alternados", color: "#ef4444",
  exercises: [
    { name: "Heel Raise Rathleff c/ mochila", sets: 4, reps: 10, type: "exercise", rest: 120,
      how: "Toalha enrolada sob os dedos no degrau, mochila nas costas com peso adicional. Antepé na borda, calcanhar no ar. Sobe 3s, pausa 2s, desce 3s abaixo do degrau. Unilateral, pé afetado. 4x10." },
    { name: "Equilíbrio unilateral", sets: 3, duration: 45, type: "timer",
      how: "Um pé só, Short Foot ativo (arco levantado sem encolher dedos). 45s. Progressão: olhos fechados. 3 séries." },
    { name: "Glute bridge", sets: 3, reps: 12, type: "exercise", rest: 45,
      how: "Deitado de costas, joelhos dobrados. Eleve o quadril apertando o glúteo no topo. 3x12." },
  ],
};

function getRehabM2(diaAlternado) {
  return diaAlternado ? [REHAB_M2_BASE, REHAB_M2_CARGA] : [REHAB_M2_BASE];
}
```

`diaAlternado` reaproveita o mesmo campo já calculado por `getMacrofase` (paridade de `diasDesdeInicioMacrofase`).

## Testes de caminhada (a partir da semana 3 de macrofase 2, ou seja `semanaIdx>=2`)

Tela nova simples, mesmo padrão de `RehabScreen` mas sem timer — checklist de 1 item com dois botões.

```js
const TESTES_CAMINHADA = [
  { id: "caminhada20", nome: "Caminhar 20min em piso plano", criterio: "Dor ≤ 2/10 durante E no dia seguinte" },
  { id: "caminhada30", nome: "Caminhar 30min", criterio: "Dor ≤ 2/10 durante E no dia seguinte" },
  { id: "caminhada40", nome: "Caminhar 40min com trechos em ritmo forte", criterio: "Dor ≤ 2/10 durante E no dia seguinte" },
];
```

Resultado salvo em `localStorage["tp7testes"]` como `{"caminhada20": {passou:true, data:"2026-09-22"}, ...}`. Não bloqueia nada automaticamente na macrofase 2 — é só registro; a checagem de "passou nos 3 testes" fica pro pré-requisito de entrada da macrofase 3 (informativo, o usuário decide se está pronto — não há gate automático de macrofase, seria over-engineering pra um app de uso único).

Tela nova: `scr==="testeCaminhada"`, recebe qual teste via um estado `testeAtivo` (id). Botões "✓ Passou" / "✗ Não passou (dor > 2/10)" gravam e voltam pra Home.

## Tela Home (macrofase 2)

Substitui o fallback 🚧 quando `mfInfo.macrofase===2` por:
- Card "Próximo treino" (reaproveita visual do card antigo: ícone, nome da sessão via `SL[SEQ_M2[sesM2]]`, botão "Iniciar treino").
- Grid de 3 (não 6) — só A/B/C.
- Banner de rehab reduzido (não checklist obrigatório — link simples "🦶 Manutenção fascite" abrindo `scr==="rehab"` com `routines=getRehabM2(mfDia.diaAlternado)`, mesmo padrão de `abrirDose` já existente pra macrofase 0-1, reaproveitando `RehabScreen`).
- Se `mfDia.semanaIdx>=2`: card extra "🚶 Testes de caminhada" listando os 3 testes com status (pendente/passou/não passou), cada um abrindo a tela de teste.

`startAny`/`adv`/`WorkoutScreen` continuam existindo — só a origem dos dados muda: em vez de `bw(wk,si)`, quando `mfInfo.macrofase===2` chama `buildMuscSession(MA|MB|MC, 2, mfDia.semanaIdx)` pros índices de musculação (`SEQ_M2[sesM2]===0→MA, ===2→MB, ===4→MC`).

## Edge cases

- `sesM2` fora de [0,2] → clamp pra 0 (mesma defesa que outros estados já têm via try/catch no load).
- Teste de caminhada marcado antes da semana 3 → tecnicamente possível se o usuário abrir a tela manualmente (não hà rota direta antes da semana 3, mas o registro em si não valida data — aceitável, não é dado crítico).
- `diaAlternado` de macrofase 2 usa a mesma fórmula existente (paridade desde o início da MACROFASE, não da semana) — confirmado consistente com o padrão já usado em macrofase 1.

## Teste

Estende `scripts/check-macrofase.mjs`: `getMuscPhaseIndex` (casos macrofase 2/3/4 em cada semana), `levePeso` (converte pirâmide corretamente, mantém exercícios simples), `getRehabM2` (com/sem carga).

## Fora de escopo aqui

Macrofase 3 e 4 (specs próprios, depois deste). Peso por exercício / histórico / dor matinal / modo offline — sub-projetos separados já sinalizados no doc principal.
