# Macrofase 3 — Retorno à Corrida — Design

## Contexto

Depende de Macrofase 2 já implementada (`buildMuscSession`, `getMuscPhaseIndex`, `sv()` corrigido, grid/preview/workout reconectados). Macrofase 3 (06/10 a 02/11/2026, 4 semanas) reintroduz corrida via walk/run e migra a musculação de Fase 1 pra Fase 2 na metade da fase.

Fonte: seção 6 de `app-treino-corrida.md`.

## Pré-requisitos de entrada (informativo, sem gate automático)

- Testes de caminhada aprovados (macrofase 2)
- Dor matinal ≤2/10 por 5 dias consecutivos
- Rathleff em 4×10/5×8 sem piora

Sem tracking de dor matinal no app ainda (fora de escopo, sub-projeto próprio) — isso vira só um texto informativo no banner da Home, o usuário decide se está pronto. Automatizar o gate seria over-engineering pra um app de uso único onde a decisão clínica é do próprio usuário.

## Sequência de sessões

Reaproveita a sequência de 6 completa (`SL`/`SS`/`SIC`/`SCO`, índices 0-5: A/Qualidade/B/Leve/C/Longa) — volta ao formato híbrido original. Diferente de macrofase 2 (só 3 sessões), aqui os 3 slots de corrida (índices 1,3,5) usam o MESMO conteúdo walk/run daquela semana — o spec não diferencia qualidade/leve/longa dentro do walk/run, só varia o volume total pela frequência sugerida. Slot 3 (Corrida Leve) mantém o botão "Pular corrida leve" já existente.

## Motor de corrida walk/run

```js
function mkWR(ciclos, corridaSeg, caminhadaSeg) {
  const s = [];
  for (let i = 1; i <= ciclos; i++) {
    s.push({ name: "Corrida " + i, duration: corridaSeg, type: "timer", ph: "r", how: "Ritmo Z1-Z2 confortável — consegue conversar sem ofegar." });
    s.push({ name: "Caminhada " + i, duration: caminhadaSeg, type: "timer", ph: "i", how: "Recuperação ativa, caminhada." });
  }
  return s;
}

const RUN_M3 = [
  { nome: "1min corrida / 2min caminhada", ciclos: 8, corrida: 60, caminhada: 120, vezesSemana: 2, volumeKm: 5 },
  { nome: "2min corrida / 2min caminhada", ciclos: 6, corrida: 120, caminhada: 120, vezesSemana: 2, volumeKm: 6 },
  { nome: "3min corrida / 1min caminhada", ciclos: 6, corrida: 180, caminhada: 60, vezesSemana: 3, volumeKm: 7 },
  { nome: "5min corrida / 1min caminhada", ciclos: 5, corrida: 300, caminhada: 60, vezesSemana: 3, volumeKm: 8 },
];

function buildRunM3(semanaIdx) {
  const cfg = RUN_M3[Math.min(semanaIdx, RUN_M3.length - 1)];
  const r = [];
  r.push({ section: "🔥 AQUECIMENTO" });
  r.push({ name: "Caminhada rápida", duration: 300, type: "timer", ph: "w", how: "5 min pra aquecer antes dos intervalos." });
  r.push({ section: "🏃 WALK/RUN — " + cfg.nome });
  mkWR(cfg.ciclos, cfg.corrida, cfg.caminhada).forEach(e => r.push(e));
  r.push({ section: "🧘 ALONGAMENTO" });
  r.push({ name: "Along. panturrilha (joelho reto + dobrado)", sets: 2, duration: 30, type: "timer", ph: "s", how: "Pé na parede. 2x30s joelho reto + 2x30s joelho dobrado." });
  r.push({ section: "❄️ GELO PÓS-CORRIDA" });
  r.push({ name: "Gelo nos pés", duration: 900, type: "timer", ph: "f", isIce: true, how: "15 minutos, obrigatório pós-corrida nesta fase de retorno." });
  return r;
}

function grdM3(semanaIdx) { const cfg = RUN_M3[Math.min(semanaIdx, RUN_M3.length - 1)]; return "~" + cfg.volumeKm + "km"; }
```

**Regra inegociável (banner informativo, não bloqueia):** "Se a dor matinal piorar no dia seguinte à corrida, volte uma etapa." Mostrado como nota fixa na Home quando `mfInfo.macrofase===3`, mesmo estilo do banner de restrição já usado nas macrofases 0-1.

## Musculação

Já coberta pelo motor de `buildMuscSession`/`getMuscPhaseIndex` da macrofase 2 — `getMuscPhaseIndex(3, semanaIdx)` já retorna `0` (semanas 0-1) ou `1` (semanas 2-3), sem trabalho novo aqui além de garantir que a Home passe `macrofase=3` corretamente.

## Rehab reduzido (1x/dia + gelo pós-corrida)

```js
const REHAB_M3_BASE = {
  id: "m3-base", title: "🦶 Manutenção fascite", subtitle: "1x/dia — ao acordar", time: "~8 min", when: "Todos os dias, 1x", color: "#f59e0b",
  exercises: [
    { name: "Alongamento DiGiovanni (fáscia)", reps: 10, type: "reps",
      how: "Sentado, cruze a perna afetada. Segure a base dos dedos, puxe para cima e para trás. Palpe a fáscia. 10s x 10 repetições." },
    { name: "Along. panturrilha (joelho reto + dobrado)", sets: 2, duration: 30, type: "timer",
      how: "Mãos na parede. 2x30s joelho reto (gastrocnêmio) + 2x30s joelho dobrado (sóleo)." },
    { name: "Bolinha de tênis na sola", duration: 120, type: "timer",
      how: "Role a bolinha do calcanhar à base dos dedos. Pressão moderada (≤3/10 de dor). 2 minutos." },
  ],
};

const REHAB_M3_CARGA = {
  id: "m3-carga", title: "💪 Rathleff — 5×8 com carga", subtitle: "3x por semana", time: "~12 min", when: "Dias alternados", color: "#ef4444",
  exercises: [
    { name: "Heel Raise Rathleff c/ carga", sets: 5, reps: 8, type: "exercise", rest: 120,
      how: "Toalha sob os dedos no degrau, com carga adicional (mochila). Sobe 3s, pausa 2s, desce 3s abaixo do degrau. Unilateral. 5x8." },
    { name: "Equilíbrio unilateral", sets: 3, duration: 45, type: "timer",
      how: "Um pé só, Short Foot ativo. Progressão: olhos fechados. 3x45s." },
  ],
};

function getRehabM3(diaAlternado) { return diaAlternado ? [REHAB_M3_BASE, REHAB_M3_CARGA] : [REHAB_M3_BASE]; }
```

## Tela Home (macrofase 3)

Mesmo layout reconectado da macrofase 2 (card "Próximo treino", grid — agora de 6, não 3 —, preview, iniciar treino), trocando a fonte de dados:
- Sessões 0/2/4 (musculação): `buildMuscSession(MA|MB|MC, 3, mfDia.semanaIdx)`.
- Sessões 1/3/5 (corrida): `buildRunM3(mfDia.semanaIdx)`, descrição via `grdM3(mfDia.semanaIdx)`.
- Banner rehab reduzido: link pra `getRehabM3(mfDia.diaAlternado)`.
- Banner "regra inegociável" fixo.
- Botão "Pular corrida leve" mantido pro slot 3 (código já existe, só precisa continuar funcionando com a nova fonte de dados).

## Edge cases

- `semanaIdx` sempre 0-3 dentro da macrofase 3 (garantido por `getMacrofase`) — `Math.min(semanaIdx, RUN_M3.length-1)` é defensivo, nunca deveria disparar na prática.
- Transição macrofase 2→3: `sesM2`/`sesM3` são estados independentes (chaves de localStorage diferentes) — não há migração de progresso entre eles, cada macrofase começa do zero na primeira sessão.

## Teste

Estende `scripts/check-macrofase.mjs`: `buildRunM3` (shape/tamanho por semana), `grdM3` (texto de volume), `getRehabM3` (com/sem carga), `getMuscPhaseIndex(3, semanaIdx)` (já teria sido testado na macrofase 2, mas confirma aqui os casos específicos de fronteira semana1/2).

## Fora de escopo aqui

Macrofase 4 (spec próprio). Tracking de dor matinal (o gate de entrada nesta fase é manual/informativo até esse sub-projeto existir).
