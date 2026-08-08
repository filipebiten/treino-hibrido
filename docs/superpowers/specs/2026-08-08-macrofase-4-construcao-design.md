# Macrofase 4 — Construção — Design

## Contexto

Depende de Macrofases 2 e 3 já implementadas. Macrofase 4 (03/11 a 28/12/2026, 8 semanas) é a fase final: corrida progressiva até 10km contínuos, testes de 5km (semana 4) e 10km (semana 8), musculação Fase 2→3.

Fonte: seção 6 de `app-treino-corrida.md`.

## Motor de corrida — reaproveita `br()` quase literalmente

`br(wk,rt)` (função existente, linha ~384 de `src/App.jsx`) já tem exatamente a forma certa: lê uma entrada `{q,qS,e,l,test,tD}` de uma tabela indexada por semana e monta os steps (pés pré-corrida, aquecimento, corrida, alongamento pós, gelo) — reaproveitando `FOOT_PRE`/`WARMUP_RUN`/`STRETCH`/`ICE`, todos já existentes e não tocados por nenhuma macrofase anterior. Só precisa de uma nova tabela no lugar de `RD` e uma cópia da função trocando o array de origem:

```js
const RUN_M4 = [
  { q: "Fartlek 15min", qS: [{ n: "Fartlek", d: "Varie o ritmo!", dur: 900 }], e: 2.5, l: 3 },
  { q: "4x400m Z4", qS: mkT(4, "400m", 150, 120), e: 3, l: 3.5 },
  { q: "Fartlek 20min", qS: [{ n: "Fartlek", d: "Varie o ritmo", dur: 1200 }], e: 3, l: 4 },
  { q: "4x400m Z4", qS: mkT(4, "400m", 150, 120), e: 3.5, test: "🎯 TESTE 5KM!", tD: 5 },
  { q: "Fartlek 25min", qS: [{ n: "Fartlek", d: "Varie", dur: 1500 }], e: 4, l: 5 },
  { q: "4x600m Z4", qS: mkT(4, "600m", 210, 120), e: 4.5, l: 6 },
  { q: "Tempo Run 15min Z3", qS: [{ n: "Tempo Run Z3", d: "129-145 bpm", dur: 900 }], e: 5, l: 7 },
  { q: "5km leve Z2", qS: [{ n: "Corrida Z2", d: "5km, ritmo leve" }], e: 4, test: "🎯 TESTE 10KM!", tD: 10 },
];

function brM4(semanaIdx, rt) {
  const rd = RUN_M4[semanaIdx]; if (!rd) return [];
  const r = [];
  r.push({ section: "🦶 PÉS PRÉ-CORRIDA" }); FOOT_PRE.forEach(e => r.push({ ...e, ph: "fp" }));
  r.push({ section: "🔥 AQUECIMENTO" }); WARMUP_RUN.forEach(e => r.push({ ...e, ph: "w" }));
  r.push({ section: "🏃 CORRIDA" });
  r.push({ name: "Aquecimento: Caminhada", detail: "Z1 (92-109 bpm)", duration: 300, type: "timer", ph: "r", how: "Caminhe 5 min." });
  if (rt === "q") rd.qS.forEach(x => r.push({ name: x.n, detail: x.d, duration: x.dur, type: x.dur ? "timer" : "manual", ph: "r" }));
  else if (rt === "e") r.push({ name: "Corrida Z2 — " + rd.e + "km", detail: "110-127 bpm", type: "manual", ph: "r", how: "Ritmo leve, conversação." });
  else if (rt === "l") { if (rd.test) r.push({ name: rd.test, detail: "Z2 — " + rd.tD + "km", type: "manual", ph: "r", isTest: true, how: "NÃO ACELERE! Completar é o objetivo." }); else r.push({ name: "Longão Z2 — " + rd.l + "km", detail: "CONVERSA", type: "manual", ph: "r", how: "Ritmo de conversa." }); }
  r.push({ name: "Volta à calma", detail: "Caminhada Z1", duration: 300, type: "timer", ph: "r", how: "5 min caminhada." });
  r.push({ section: "🧘 ALONGAMENTO PÓS" }); STRETCH.forEach(e => r.push({ ...e, ph: "s" }));
  r.push({ section: "❄️ GELO NOS PÉS" }); ICE.forEach(e => r.push({ ...e, ph: "i" }));
  return r;
}

function grdM4(semanaIdx, rt) { const rd = RUN_M4[semanaIdx]; if (!rd) return ""; if (rt === "q") return rd.q; if (rt === "e") return rd.e + "km Z2"; if (rt === "l") return rd.test || (rd.l ? rd.l + "km Longão" : ""); return ""; }
```

`brM4` é uma cópia direta de `br()` trocando `RD[wk-1]` por `RUN_M4[semanaIdx]` — sem decisão de design nova, é o mesmo motor com fonte de dados diferente. `grdM4` espelha `grd()` do mesmo jeito.

## Musculação

`getMuscPhaseIndex(4, semanaIdx)` já definido na macrofase 2: `semanaIdx<4` (novembro, semanas 0-3) → índice 1 (Fase 2); `semanaIdx>=4` (dezembro, semanas 4-7) → índice 2 (Fase 3). Nenhum trabalho novo além de garantir que a Home passe `macrofase=4` corretamente pro `buildMuscSession`.

## Rehab manutenção

Gelo pós-corrida já vem embutido em `brM4` (seção `❄️ GELO NOS PÉS`, reaproveitando `ICE`) — não precisa de dose separada pra isso.

```js
const REHAB_M4_BASE = {
  id: "m4-base", title: "🦶 Manutenção fascite", subtitle: "1x/dia — ao acordar", time: "~5 min", when: "Todos os dias, 1x", color: "#f59e0b",
  exercises: [
    { name: "Alongamento DiGiovanni (fáscia)", reps: 10, type: "reps",
      how: "Sentado, cruze a perna afetada. Segure a base dos dedos, puxe para cima e para trás. Palpe a fáscia. 10s x 10 repetições." },
  ],
};

const REHAB_M4_CARGA = {
  id: "m4-carga", title: "💪 Rathleff — manutenção", subtitle: "2x por semana", time: "~10 min", when: "Dias alternados", color: "#ef4444",
  exercises: [
    { name: "Heel Raise Rathleff", sets: 4, reps: 10, type: "exercise", rest: 90,
      how: "Toalha sob os dedos no degrau. Sobe 3s, pausa 2s, desce 3s abaixo do degrau. Unilateral. 4x10 — dose de manutenção." },
  ],
};

function getRehabM4(diaAlternado) { return diaAlternado ? [REHAB_M4_BASE, REHAB_M4_CARGA] : [REHAB_M4_BASE]; }
```

**Nota informativa (banner fixo na Home quando macrofase===4):** "Se a dor voltar, retorne pra rehab 2x/dia imediatamente" — texto, sem lógica automática (o usuário decide, mesmo padrão das macrofases 2-3).

## Tela Home (macrofase 4)

Mesmo layout reconectado das macrofases 2-3 (grid de 6, preview, iniciar treino):
- Sessões 0/2/4: `buildMuscSession(MA|MB|MC, 4, mfDia.semanaIdx)`.
- Sessões 1/3/5: `brM4(mfDia.semanaIdx, "q"|"e"|"l")`, descrição via `grdM4(mfDia.semanaIdx, rt)`.
- Banner rehab manutenção: link pra `getRehabM4(mfDia.diaAlternado)`.
- Banner "se a dor voltar" fixo.
- Card de destaque nas semanas 3 e 7 (`semanaIdx===3||semanaIdx===7`): "🎯 Teste 5km/10km esta semana" — sem tela nova, o teste já é a sessão "Longa" normal daquela semana (`rd.test`/`isTest:true` já existente no motor, reaproveitando o mesmo badge visual "DIA DE TESTE!" que `WorkoutScreen` já renderiza pra `step.isTest`).

## Edge cases

- `semanaIdx` 0-7 garantido por `getMacrofase` (macrofase 4 tem 8 semanas cadastradas em `MACRO_PHASES`) — `RUN_M4[semanaIdx]` sempre existe, sem necessidade de clamp defensivo (diferente de macrofase 2/3 que usavam `Math.min` porque reaproveitavam tabelas menores que o número de semanas de outras fases).
- Fim da macrofase 4 (28/12) = fim de `MACRO_PHASES` — `getMacrofase` já clampa qualquer data depois disso na última semana da macrofase 4 (comportamento já existente e testado desde a Task 1 do primeiro plano). Sem trabalho novo aqui.

## Teste

Estende `scripts/check-macrofase.mjs`: `brM4`/`grdM4` (formato correto pros 3 tipos q/e/l em semanas-chave, incluindo os testes de 5km/10km nas semanas 3 e 7), `getRehabM4`.

## Fora de escopo aqui

Nenhuma macrofase depois desta no plano atual. Tracking de dor matinal, peso por exercício, histórico, offline — sub-projetos separados.
