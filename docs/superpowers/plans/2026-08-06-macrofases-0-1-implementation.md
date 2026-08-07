# Macrofases 0-1 (Pré-op + Pós-op) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a home do app (hoje presa a um plano de 30 semanas obsoleto) por um mecanismo dirigido por calendário real, cobrindo Macrofase 0 (pré-operatório) e Macrofase 1 (pós-operatório + rehab, 4 semanas) — as duas que importam nos próximos 33 dias, com a cirurgia em 2026-08-11.

**Architecture:** Função pura `getMacrofase(date)` resolve macrofase/semana a partir de uma tabela de datas fixas (`MACRO_PHASES`, cobrindo as 5 macrofases inteiras, pra nunca quebrar mesmo além da macrofase 1). A Home vira um checklist de doses de rehab (Manhã/Noite/+Carga) quando `macrofase <= 1`; pra `macrofase >= 2` mostra uma tela "ainda não implementada" (Macrofases 2-4 são planos futuros separados — ver spec, seção "Fora de escopo"). Todo o código continua em `src/App.jsx` (decisão de arquitetura do projeto).

**Tech Stack:** React 19 + Vite, sem dependências novas. Vite já instalado é reaproveitado como runner de teste (`server.ssrLoadModule`) pra rodar `assert` sobre funções puras que vivem dentro do `.jsx`, sem precisar de framework de teste.

## Global Constraints

- Tudo em `src/App.jsx` — não criar componentes em arquivos separados (decisão de design nº1 do projeto).
- Sem dependências novas no `package.json`.
- Tema escuro `#0f0f1a`, inline styles, sem framework CSS (padrão já usado no arquivo inteiro).
- Texto do app em português do Brasil.
- Datas das macrofases/semanas são as da spec, copiadas literalmente — não recalcular.

---

## Task 1: Motor de calendário — `MACRO_PHASES` + `getMacrofase`

**Files:**
- Create: `scripts/check-macrofase.mjs`
- Modify: `src/App.jsx` (insere bloco novo antes do comentário `// ══════════════════════ REHAB DATA ══════════════════════`, linha ~16)

**Interfaces:**
- Produces: `export const MACRO_PHASES` (array de `{id, nome, inicio, fim, semanas:[{inicio,fim}]}`, datas ISO `"YYYY-MM-DD"`), `export function getMacrofase(date: Date): {macrofase:number, nome:string, semanaIdx:number, diasDesdeInicioMacrofase:number, diasDesdeCirurgia:number, diaAlternado:boolean}`.

- [ ] **Step 1: Criar o diretório e o script de verificação (vai falhar — função ainda não existe)**

Crie `scripts/check-macrofase.mjs`:

```js
import { createServer } from "vite";
import assert from "node:assert";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const { getMacrofase } = await server.ssrLoadModule("/src/App.jsx");

const d = iso => new Date(iso + "T00:00:00");

// Macrofase 0 — primeiro e último dia
assert.strictEqual(getMacrofase(d("2026-08-04")).macrofase, 0);
assert.strictEqual(getMacrofase(d("2026-08-04")).semanaIdx, 0);
assert.strictEqual(getMacrofase(d("2026-08-10")).macrofase, 0);

// Transição 0 -> 1
assert.strictEqual(getMacrofase(d("2026-08-11")).macrofase, 1);
assert.strictEqual(getMacrofase(d("2026-08-11")).semanaIdx, 0);

// Macrofase 1, semana 3 (25-31 ago, índice 2)
assert.strictEqual(getMacrofase(d("2026-08-27")).semanaIdx, 2);

// Transição 1 -> 2
assert.strictEqual(getMacrofase(d("2026-09-07")).macrofase, 1);
assert.strictEqual(getMacrofase(d("2026-09-08")).macrofase, 2);

// Macrofase 4, última semana (22-28 dez, índice 7)
assert.strictEqual(getMacrofase(d("2026-12-28")).macrofase, 4);
assert.strictEqual(getMacrofase(d("2026-12-28")).semanaIdx, 7);

// Clamp antes do início da macrofase 0
assert.strictEqual(getMacrofase(d("2026-01-01")).macrofase, 0);
assert.strictEqual(getMacrofase(d("2026-01-01")).semanaIdx, 0);

// Clamp depois do fim da macrofase 4
assert.strictEqual(getMacrofase(d("2027-01-01")).macrofase, 4);
assert.strictEqual(getMacrofase(d("2027-01-01")).semanaIdx, 7);

// Dias desde a cirurgia (11/08)
assert.strictEqual(getMacrofase(d("2026-08-18")).diasDesdeCirurgia, 7);
assert.strictEqual(getMacrofase(d("2026-08-11")).diasDesdeCirurgia, 0);

console.log("OK - getMacrofase: todos os casos passaram");
await server.close();
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node scripts/check-macrofase.mjs`
Expected: erro tipo `TypeError: getMacrofase is not a function` (ainda não existe no App.jsx).

- [ ] **Step 3: Implementar no `src/App.jsx`**

Insira este bloco imediatamente antes da linha `// ══════════════════════ REHAB DATA ══════════════════════`:

```js
// ══════════════════════ MACROFASES (CALENDÁRIO) ══════════════════════
export const MACRO_PHASES = [
  { id: 0, nome: "Pré-operatório", inicio: "2026-08-04", fim: "2026-08-10", semanas: [
    { inicio: "2026-08-04", fim: "2026-08-10" },
  ]},
  { id: 1, nome: "Pós-operatório + Rehab", inicio: "2026-08-11", fim: "2026-09-07", semanas: [
    { inicio: "2026-08-11", fim: "2026-08-17" },
    { inicio: "2026-08-18", fim: "2026-08-24" },
    { inicio: "2026-08-25", fim: "2026-08-31" },
    { inicio: "2026-09-01", fim: "2026-09-07" },
  ]},
  { id: 2, nome: "Retorno à Força", inicio: "2026-09-08", fim: "2026-10-05", semanas: [
    { inicio: "2026-09-08", fim: "2026-09-14" },
    { inicio: "2026-09-15", fim: "2026-09-21" },
    { inicio: "2026-09-22", fim: "2026-09-28" },
    { inicio: "2026-09-29", fim: "2026-10-05" },
  ]},
  { id: 3, nome: "Retorno à Corrida", inicio: "2026-10-06", fim: "2026-11-02", semanas: [
    { inicio: "2026-10-06", fim: "2026-10-12" },
    { inicio: "2026-10-13", fim: "2026-10-19" },
    { inicio: "2026-10-20", fim: "2026-10-26" },
    { inicio: "2026-10-27", fim: "2026-11-02" },
  ]},
  { id: 4, nome: "Construção", inicio: "2026-11-03", fim: "2026-12-28", semanas: [
    { inicio: "2026-11-03", fim: "2026-11-09" },
    { inicio: "2026-11-10", fim: "2026-11-16" },
    { inicio: "2026-11-17", fim: "2026-11-23" },
    { inicio: "2026-11-24", fim: "2026-11-30" },
    { inicio: "2026-12-01", fim: "2026-12-07" },
    { inicio: "2026-12-08", fim: "2026-12-14" },
    { inicio: "2026-12-15", fim: "2026-12-21" },
    { inicio: "2026-12-22", fim: "2026-12-28" },
  ]},
];

const CIRURGIA = "2026-08-11";
function toISO(date) { const y=date.getFullYear(), m=String(date.getMonth()+1).padStart(2,"0"), d=String(date.getDate()).padStart(2,"0"); return y+"-"+m+"-"+d; }
const dOnly = iso => new Date(iso + "T00:00:00");
const diffDias = (a, b) => Math.round((dOnly(b) - dOnly(a)) / 86400000);

export function getMacrofase(date) {
  const iso = toISO(date);
  const primeira = MACRO_PHASES[0], ultima = MACRO_PHASES[MACRO_PHASES.length - 1];
  let mf, clampedBefore = false, clampedAfter = false;
  if (iso < primeira.inicio) { mf = primeira; clampedBefore = true; }
  else if (iso > ultima.fim) { mf = ultima; clampedAfter = true; }
  else mf = MACRO_PHASES.find(m => iso >= m.inicio && iso <= m.fim) || primeira;

  let semanaIdx;
  if (clampedBefore) semanaIdx = 0;
  else if (clampedAfter) semanaIdx = mf.semanas.length - 1;
  else semanaIdx = Math.max(0, mf.semanas.findIndex(s => iso >= s.inicio && iso <= s.fim));

  const diasDesdeInicioMacrofase = clampedBefore ? 0 : diffDias(mf.inicio, iso);
  const diasDesdeCirurgia = diffDias(CIRURGIA, iso);
  return { macrofase: mf.id, nome: mf.nome, semanaIdx, diasDesdeInicioMacrofase, diasDesdeCirurgia, diaAlternado: diasDesdeInicioMacrofase % 2 === 0 };
}
```

Nota: usa `getFullYear`/`getMonth`/`getDate` (hora local), não `toISOString` (UTC) — evita o dia virar errado perto da meia-noite em fuso do Brasil.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node scripts/check-macrofase.mjs`
Expected: `OK - getMacrofase: todos os casos passaram`

- [ ] **Step 5: Commit**

```bash
git add scripts/check-macrofase.mjs src/App.jsx
git commit -m "feat: motor de calendário getMacrofase para as 5 macrofases"
```

---

## Task 2: `hojeEfetivo` (override manual de data)

**Files:**
- Modify: `scripts/check-macrofase.mjs`
- Modify: `src/App.jsx` (adiciona logo depois de `getMacrofase`)

**Interfaces:**
- Consumes: nenhuma dependência nova.
- Produces: `export function hojeEfetivo(nowMs: number, diasOffset: number): Date`.

- [ ] **Step 1: Adicionar asserções (vai falhar)**

No topo do script, troque a linha do import por:

```js
const { getMacrofase, hojeEfetivo } = await server.ssrLoadModule("/src/App.jsx");
```

E adicione antes de `console.log("OK ...")`:

```js
const base = d("2026-08-15").getTime();
assert.strictEqual(toISOLocal(hojeEfetivo(base, 0)), "2026-08-15");
assert.strictEqual(toISOLocal(hojeEfetivo(base, 3)), "2026-08-18");
assert.strictEqual(toISOLocal(hojeEfetivo(base, -5)), "2026-08-10");

function toISOLocal(dt) { const y=dt.getFullYear(), m=String(dt.getMonth()+1).padStart(2,"0"), dd=String(dt.getDate()).padStart(2,"0"); return y+"-"+m+"-"+dd; }
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node scripts/check-macrofase.mjs`
Expected: `TypeError: hojeEfetivo is not a function`

- [ ] **Step 3: Implementar**

Logo após a função `getMacrofase` em `src/App.jsx`:

```js
export function hojeEfetivo(nowMs, diasOffset) {
  return new Date(nowMs + diasOffset * 86400000);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node scripts/check-macrofase.mjs`
Expected: `OK - getMacrofase: todos os casos passaram`

- [ ] **Step 5: Commit**

```bash
git add scripts/check-macrofase.mjs src/App.jsx
git commit -m "feat: hojeEfetivo para override manual de data"
```

---

## Task 3: Dados de rehab — Macrofase 0 e 1 + `getRehabForMacrofase`

**Files:**
- Modify: `scripts/check-macrofase.mjs`
- Modify: `src/App.jsx` (insere bloco novo antes do comentário `// ══════════════════════ FOOT PROTOCOL ══════════════════════`, logo após o fechamento do array `REHAB_ROUTINES`)

**Interfaces:**
- Consumes: nenhuma (dados literais).
- Produces: `export function getRehabForMacrofase(macrofase: number, semanaIdx: number, diaAlternado: boolean): Array<RehabRoutine>` — cada `RehabRoutine` tem o mesmo formato de `REHAB_ROUTINES[i]` (`{id, title, subtitle, time, when, color, exercises:[...]}`).

- [ ] **Step 1: Adicionar asserções de formato (vai falhar)**

Adicione ao script, antes do `console.log`:

```js
const { getRehabForMacrofase } = await server.ssrLoadModule("/src/App.jsx");

const mf0 = getRehabForMacrofase(0, 0, false);
assert.strictEqual(mf0.length, 1);
assert.strictEqual(mf0[0].exercises.length, 6);

const mf1s0 = getRehabForMacrofase(1, 0, true);
assert.strictEqual(mf1s0.length, 1); // semana 1 não tem dose de carga

const mf1s2ComCarga = getRehabForMacrofase(1, 2, true);
assert.strictEqual(mf1s2ComCarga.length, 2);
assert.strictEqual(mf1s2ComCarga[1].id, "m1-s3-carga");

const mf1s2SemCarga = getRehabForMacrofase(1, 2, false);
assert.strictEqual(mf1s2SemCarga.length, 1);

const mf1s3ComCarga = getRehabForMacrofase(1, 3, true);
assert.strictEqual(mf1s3ComCarga[1].id, "m1-s4-carga");
assert.strictEqual(mf1s3ComCarga[1].exercises.length, 4);
```

Atualize também a linha de import do `ssrLoadModule` pra incluir `getRehabForMacrofase` (mesma linha do Step 1 da Task 2).

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node scripts/check-macrofase.mjs`
Expected: `TypeError: getRehabForMacrofase is not a function`

- [ ] **Step 3: Implementar os dados e a função**

Insira este bloco antes de `// ══════════════════════ FOOT PROTOCOL ══════════════════════`:

```js
// ══════════════════════ REHAB — MACROFASE 0 E 1 ══════════════════════
const REHAB_PRE_OP = {
  id: "pre-op", title: "🩹 Pré-operatório", subtitle: "2x/dia — acordar + antes de dormir", time: "~25 min", when: "Todos os dias, 2x", color: "#f59e0b",
  exercises: [
    { name: "Bombas de tornozelo", duration: 120, type: "timer",
      how: "Deitado ou sentado na cama. Aponte a ponta do pé para baixo (como uma bailarina) e depois puxe para cima (direção da canela). Alterne suavemente. NÃO levante da cama antes de fazer isso — a fáscia está encurtada e fria." },
    { name: "Alongamento DiGiovanni (fáscia)", reps: 10, type: "reps",
      how: "Sentado, cruze a perna afetada sobre a outra. Com a mão do mesmo lado, segure a BASE DOS DEDOS (não a ponta) e puxe os dedos para CIMA e para TRÁS. Palpe a fáscia com a outra mão para confirmar tensão. Segure 10 segundos cada repetição. Faça 10 vezes." },
    { name: "Along. gastrocnêmio (joelho RETO)", sets: 3, duration: 30, type: "timer",
      how: "Em pé, mãos na parede. Perna afetada ATRÁS, perna boa na frente. Calcanhar de trás FIRME no chão. Joelho de trás RETO. Empurre o quadril para frente até sentir o alongamento na panturrilha. 30s. 3x cada perna." },
    { name: "Along. sóleo (joelho DOBRADO)", sets: 3, duration: 30, type: "timer",
      how: "MESMA posição, mas dobre levemente o joelho de trás. Alonga o SÓLEO. Calcanhar continua firme no chão. Sentido mais embaixo, perto do calcanhar. 30s x 3 cada perna." },
    { name: "Bolinha de tênis na sola", detail: "Cada pé", duration: 180, type: "timer",
      how: "Sentado, bolinha sob a sola do pé. Role do calcanhar à base dos dedos com pressão moderada (≤3/10 de dor). 3 minutos cada pé." },
    { name: "❄️ GELO NOS PÉS", detail: "OBRIGATÓRIO!", duration: 900, type: "timer", isIce: true,
      how: "Garrafa congelada com fronha, ou bolsa de gelo com toalha fina entre o gelo e a pele. 15 minutos. É o que faltou no protocolo anterior — não pule." },
  ],
};

function rehabSemana1() {
  return {
    id: "m1-s1", title: "🛏️ Pós-op — Semana 1", subtitle: "Repouso total — pé sentado/deitado", time: "~20 min", when: "Todos os dias, 2x (acordar + dormir)", color: "#f59e0b",
    exercises: [
      { name: "Bombas de tornozelo", duration: 120, type: "timer", how: "Deitado. Aponte e puxe a ponta do pé alternadamente." },
      { name: "Alongamento com toalha (panturrilha)", sets: 2, duration: 30, type: "timer",
        how: "Sentado na cama, toalha na planta do pé. Joelho esticado, puxe a toalha trazendo a ponta do pé em direção à canela. 30s. 2x cada perna." },
      { name: "Alongamento DiGiovanni (fáscia)", reps: 10, type: "reps",
        how: "Sentado, cruze a perna afetada. Segure a base dos dedos, puxe para cima/trás. Palpe a fáscia. 10s x 10 repetições." },
      { name: "Bolinha de tênis na sola", detail: "Cada pé", duration: 180, type: "timer", how: "Sentado, role a bolinha do calcanhar à base dos dedos. Pressão ≤3/10." },
      { name: "Short Foot (encurtamento do pé)", reps: 15, type: "reps",
        how: "Sentado, pé apoiado, SEM encolher os dedos. Aproxime a base do dedão do calcanhar, 'levante a cúpula' do arco. Segure 5s. Relaxe. 15 repetições." },
      { name: "❄️ GELO NOS PÉS", detail: "OBRIGATÓRIO!", duration: 900, type: "timer", isIce: true, how: "Sentado ou deitado. Gelo na sola com toalha fina. 15 minutos." },
    ],
  };
}

function rehabSemana2() {
  const base = rehabSemana1();
  return { ...base, id: "m1-s2", title: "🛏️ Pós-op — Semana 2", subtitle: "Adiciona fortalecimento sentado", time: "~25 min",
    exercises: [
      ...base.exercises,
      { name: "Toe Yoga (piano com os dedos)", reps: 10, type: "reps",
        how: "3 movimentos, 10 reps cada: (1) Só o dedão sobe, outros no chão. (2) Dedão desce, outros sobem. (3) Espalhe todos os dedos como um leque e feche." },
      { name: "Catador de toalha", sets: 2, reps: 15, type: "reps",
        how: "Toalha estendida no chão. Use apenas os dedos do pé para agarrar e puxar. 2 séries de 15." },
      { name: "4-vias tornozelo c/ elástico", sets: 3, reps: 10, type: "reps",
        how: "Sentado, perna esticada. 4 movimentos 3x10 cada: plantiflexão, dorsiflexão, INVERSÃO (mais importante — tibial posterior), eversão." },
    ]};
}

const REHAB_CARGA_S3 = {
  id: "m1-s3-carga", title: "💪 Carga leve — dias alternados", subtitle: "Em pé, sem toalha ainda", time: "~10 min", when: "Dias alternados", color: "#ef4444",
  exercises: [
    { name: "Heel Raise bilateral (chão)", sets: 3, reps: 12, type: "exercise", rest: 90,
      how: "Em pé, suba nos dois pés (sem toalha ainda). Desça lento em 3 segundos. 3 séries de 12." },
    { name: "Equilíbrio unipodal", sets: 3, duration: 30, type: "timer",
      how: "Fique em um pé só. Ative o Short Foot (levante o arco sem encolher os dedos). 30s. 3 séries cada pé." },
  ],
};

const REHAB_CARGA_S4 = {
  id: "m1-s4-carga", title: "💪 Carga — Rathleff completo", subtitle: "Unilateral, com toalha", time: "~12 min", when: "Dias alternados", color: "#ef4444",
  exercises: [
    { name: "Heel Raise Rathleff (PROTOCOLO PRINCIPAL)", sets: 3, reps: 12, type: "exercise", rest: 120,
      how: "Toalha enrolada sob os dedos no degrau. Antepé na borda, calcanhar no ar. SUBA em 3s (concêntrico), PAUSE 2s no topo, DESÇA em 3s abaixo do degrau (excêntrico). Unilateral, pé afetado. 3x12." },
    { name: "Equilíbrio unipodal", sets: 3, duration: 45, type: "timer",
      how: "Um pé só, Short Foot ativo. 45s. Progressão: olhos abertos → olhos fechados. 3 séries." },
    { name: "Glute bridge", sets: 3, reps: 12, type: "exercise", rest: 45,
      how: "Deitado de costas, joelhos dobrados. Eleve o quadril apertando o glúteo no topo. Desça controlado. Glúteo fraco = mais pronação = mais fascite. 3x12." },
    { name: "Clamshell c/ elástico", sets: 3, reps: 12, type: "exercise", rest: 30,
      how: "Deitado de lado, joelhos dobrados, elástico acima dos joelhos. Abra o joelho de cima mantendo os pés juntos. Trabalha o glúteo médio. 3x12 cada lado." },
  ],
};

const REHAB_M1 = [
  { base: rehabSemana1, carga: null },
  { base: rehabSemana2, carga: null },
  { base: rehabSemana2, carga: REHAB_CARGA_S3 },
  { base: rehabSemana2, carga: REHAB_CARGA_S4 },
];

export function getRehabForMacrofase(macrofase, semanaIdx, diaAlternado) {
  if (macrofase === 0) return [REHAB_PRE_OP];
  if (macrofase === 1) {
    const cfg = REHAB_M1[Math.min(semanaIdx, REHAB_M1.length - 1)];
    const rotinas = [cfg.base()];
    if (cfg.carga && diaAlternado) rotinas.push(cfg.carga);
    return rotinas;
  }
  return REHAB_ROUTINES; // macrofase 2+: fora de escopo deste plano, usa o menu genérico existente
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node scripts/check-macrofase.mjs`
Expected: `OK - getMacrofase: todos os casos passaram`

- [ ] **Step 5: Commit**

```bash
git add scripts/check-macrofase.mjs src/App.jsx
git commit -m "feat: dados de rehab e getRehabForMacrofase (macrofase 0 e 1)"
```

---

## Task 4: `RehabScreen` recebe `routines` por prop

**Files:**
- Modify: `src/App.jsx` — função `RehabScreen` (procure a assinatura `function RehabScreen({onBack}){`) e o único call site existente (procure `<RehabScreen onBack=`).

**Interfaces:**
- Consumes: `getRehabForMacrofase` (Task 3) — usado só no call site, não dentro de `RehabScreen`.
- Produces: `RehabScreen` agora aceita `{onBack, routines, onRoutineComplete}` — `onRoutineComplete` é opcional, chamado (sem argumento) quando a rotina ativa termina o último exercício.

- [ ] **Step 1: Trocar a assinatura e o uso interno**

Troque:
```js
function RehabScreen({onBack}){
```
por:
```js
function RehabScreen({onBack, routines, onRoutineComplete}){
```

Troque a linha que renderiza o menu (procure `{REHAB_ROUTINES.map(r=>`) trocando `REHAB_ROUTINES.map` por `routines.map` (mantém o resto do JSX igual).

Na função `nxt()` dentro de `RehabScreen` (procure `function nxt(){setTmrOn(false);setRst(false);setCS(1);setShowHow(true);if(sI+1>=tot){setActiveRoutine(null);return;}`), troque o corpo do `if` de:
```js
if(sI+1>=tot){setActiveRoutine(null);return;}
```
por:
```js
if(sI+1>=tot){if(onRoutineComplete)onRoutineComplete();setActiveRoutine(null);return;}
```

- [ ] **Step 2: Atualizar o call site existente**

Procure `<RehabScreen onBack={()=>setScr("home")}/>` e troque por:
```js
<RehabScreen onBack={()=>setScr("home")} routines={REHAB_ROUTINES}/>
```
(comportamento idêntico ao de antes — Task 6 troca isso pra usar `getRehabForMacrofase`.)

- [ ] **Step 3: Verificação manual (sem framework de teste de UI no projeto)**

Run: `npm run dev`

No navegador, na URL local impressa:
1. Na Home, toque o botão vermelho "🦶 Reabilitação Fascite Plantar".
2. Confirme que aparecem as 4 rotinas de sempre (Matinal/Manhã/Tarde/Carga).
3. Abra "Matinal", complete o primeiro exercício (timer ou reps), confirme que avança normalmente.
4. Volte com "← Sair" e confirme que retorna à Home sem erro no console.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: RehabScreen recebe lista de rotinas por prop"
```

---

## Task 5: Home dirigida por macrofase (checklist + banner + fallback)

**Files:**
- Modify: `src/App.jsx` — dentro de `export default function App(){`.

**Interfaces:**
- Consumes: `getMacrofase`, `hojeEfetivo`, `getRehabForMacrofase`, `REHAB_M1` (só o array, pra achar a rotina de carga sugerida quando `diaAlternado` é falso mas o usuário quer fazer mesmo assim), `RehabScreen` com `routines`/`onRoutineComplete`.
- Produces: tela nova `scr==="rehabDose"`; Home (`scr==="home"`) com dois ramos (checklist macrofase 0-1 / fallback macrofase 2+).

- [ ] **Step 1: Adicionar estado novo**

Logo após a linha `const[showHow,setShowHow]=useState(false);` dentro de `App`, adicione:

```js
const[diasOffset,setDiasOffset]=useState(0);
const[rehabLog,setRehabLog]=useState({});
const[activeDoseKey,setActiveDoseKey]=useState(null);
const[rehabScreenRoutines,setRehabScreenRoutines]=useState(null);
```

- [ ] **Step 2: Carregar/salvar `diasOffset` e `rehabLog`**

Troque o `useEffect` de carregamento (procure `const r=localStorage.getItem("tp7");if(r){const d=JSON.parse(r);setWk(d.w||2);setSes(d.s!==undefined?d.s:2);}`) adicionando a leitura de `o` e do rehab log:

```js
useEffect(()=>{(async()=>{try{const r=localStorage.getItem("tp7");if(r){const d=JSON.parse(r);setWk(d.w||2);setSes(d.s!==undefined?d.s:2);setDiasOffset(d.o||0);}const rl=localStorage.getItem("tp7rehab");if(rl)setRehabLog(JSON.parse(rl));}catch(e){}setOk(true);})();},[]);
```

Adicione, perto das outras funções auxiliares do componente (antes do `if(!ok)return...`):

```js
function setDias(n){const o=diasOffset+n;setDiasOffset(o);try{localStorage.setItem("tp7",JSON.stringify({w:wk,s:ses,o}))}catch(e){}}
function isoHoje(){const dt=hojeEfetivo(Date.now(),diasOffset);return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");}
function markDose(key){const iso=isoHoje();const novo={...rehabLog,[iso]:{...(rehabLog[iso]||{}),[key]:true}};setRehabLog(novo);try{localStorage.setItem("tp7rehab",JSON.stringify(novo))}catch(e){}}
function doseFeita(key){const iso=isoHoje();return !!(rehabLog[iso]&&rehabLog[iso][key]);}
function abrirDose(key,rotina){setActiveDoseKey(key);setRehabScreenRoutines([rotina]);setScr("rehabDose");}
const RESTRICOES=[
  {fim:"2026-08-17",texto:"Dias 1-7 pós-op: zero esforço físico. Alongamentos de pé sentado/deitado liberados."},
  {fim:"2026-08-25",texto:"Dias 8-15 pós-op: sem esforço moderado. Alongamentos + exercícios leves sentado liberados."},
  {fim:"2026-09-10",texto:"Dias 16-30 pós-op: sem esforço excessivo. Musculação leve retorna gradualmente."},
  {fim:"9999-12-31",texto:"Dia 31+ pós-op: liberado para treino normal."},
];
function textoLiberado(iso){if(iso<"2026-08-11")return"Pré-operatório — foco total na fascite antes da cirurgia.";return RESTRICOES.find(x=>iso<=x.fim).texto;}
```

- [ ] **Step 3: Calcular `mfInfo` a cada render**

Logo antes de `if(!ok)return...`, adicione:

```js
const mfInfo=getMacrofase(hojeEfetivo(Date.now(),diasOffset));
```

- [ ] **Step 4: Nova tela `rehabDose`**

Logo depois da linha `if(scr==="rehab") return<RehabScreen onBack={()=>setScr("home")} routines={REHAB_ROUTINES}/>;`, adicione:

```js
if(scr==="rehabDose") return<RehabScreen onBack={()=>{setScr("home");setRehabScreenRoutines(null);}} routines={rehabScreenRoutines} onRoutineComplete={()=>markDose(activeDoseKey)}/>;
```

- [ ] **Step 5: Substituir o bloco `if(scr==="home"){...}`**

Substitua o bloco inteiro (do `if(scr==="home"){const desc=grd(wk,ses);` até o `</div>;}` que fecha a Home) por:

```js
if(scr==="home"){
  if(mfInfo.macrofase<=1){
    const rotinas=getRehabForMacrofase(mfInfo.macrofase,mfInfo.semanaIdx,mfInfo.diaAlternado);
    const rotinaBase=rotinas[0];
    const cfgSemana=mfInfo.macrofase===1?REHAB_M1[Math.min(mfInfo.semanaIdx,REHAB_M1.length-1)]:null;
    const rotinaCarga=rotinas[1]||(cfgSemana?cfgSemana.carga:null);
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto"}}><style>{G}</style>
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:12,color:"#94a3b8",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Treino Híbrido</div>
        <div style={{fontSize:22,fontWeight:800}}>{mfInfo.nome}</div>
        <div style={{fontSize:12,color:"#64748b",marginTop:4}}>Dia {mfInfo.diasDesdeInicioMacrofase+1} — {isoHoje()}</div>
      </div>
      <div style={{padding:14,background:"#f59e0b15",border:"1px solid #f59e0b44",borderRadius:12,marginBottom:16,fontSize:12,color:"#fbbf24",lineHeight:1.5}}>🩹 {textoLiberado(isoHoje())}</div>
      <div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Checklist de hoje</div>
      {["manha","noite"].map(key=>{const feita=doseFeita(key);return<button key={key} onClick={()=>abrirDose(key,rotinaBase)} style={{width:"100%",padding:16,marginBottom:10,borderRadius:14,border:"1px solid "+(feita?"#4ade8044":"#f59e0b44"),background:feita?"#4ade8010":"#f59e0b10",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:15,fontWeight:700}}>{feita?"✓ ":""}Rotina {key==="manha"?"Manhã":"Noite"}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{rotinaBase.time}</div></div>
        <div style={{fontSize:20}}>{feita?"✅":"▶"}</div>
      </button>;})}
      {rotinaCarga&&<button onClick={()=>abrirDose("carga",rotinaCarga)} style={{width:"100%",padding:16,marginBottom:10,borderRadius:14,border:"1px solid "+(doseFeita("carga")?"#4ade8044":"#ef444444"),background:doseFeita("carga")?"#4ade8010":"#ef444410",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:15,fontWeight:700}}>{doseFeita("carga")?"✓ ":""}{rotinaCarga.title}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{mfInfo.diaAlternado?"Dia sugerido":"Fazer mesmo assim"}</div></div>
        <div style={{fontSize:20}}>{doseFeita("carga")?"✅":"▶"}</div>
      </button>}
      <div style={{marginTop:20,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:16}}>
        <div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Ajustar data (teste)</div>
        <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"center"}}>
          <button onClick={()=>setDias(-1)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"white",cursor:"pointer"}}>-1 dia</button>
          <span style={{fontSize:13,color:"#94a3b8",minWidth:110,textAlign:"center"}}>{diasOffset===0?"Hoje":(diasOffset>0?"+":"")+diasOffset+" dias"}</span>
          <button onClick={()=>setDias(1)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"white",cursor:"pointer"}}>+1 dia</button>
        </div>
      </div>
    </div>;
  }
  return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:40,marginBottom:12}}>🚧</div>
    <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>{mfInfo.nome} ainda não configurada no app</div>
    <div style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>Consulte o plano completo no CLAUDE.md do projeto até essa parte ser implementada.</div>
    <button onClick={()=>setScr("rehab")} style={{padding:"12px 20px",borderRadius:12,border:"1px solid #ef444444",background:"#ef444415",color:"#ef4444",cursor:"pointer",marginBottom:16}}>🦶 Abrir Reabilitação</button>
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <button onClick={()=>setDias(-7)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"white",cursor:"pointer"}}>-7 dias</button>
      <span style={{fontSize:13,color:"#94a3b8"}}>{isoHoje()}</span>
      <button onClick={()=>setDias(7)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"white",cursor:"pointer"}}>+7 dias</button>
    </div>
  </div>;
}
```

Não mexa nos blocos `preview` e `workout` — ficam intactos e inacessíveis por enquanto (motor reaproveitado pelo próximo plano, "Retorno à Força").

- [ ] **Step 6: Verificação manual completa**

Run: `npm run dev`

1. Abra a URL local. Data real do sistema cai em 04-10/08/2026 → deve aparecer "Pré-operatório", "Dia 1" (ou o dia correspondente), banner de pré-operatório.
2. Toque "Rotina Manhã" → completa os 6 exercícios → volta pra Home → card deve estar ✓ com fundo verde.
3. Toque "+1 dia" repetidas vezes até a data mostrada passar de 2026-08-11 → header deve virar "Pós-operatório + Rehab", "Dia 1", rotina agora com 6 itens (Semana 1).
4. Continue avançando até cair numa data de "Semana 3" (25-31/08) num dia com `diaAlternado` verdadeiro → card "💪 Carga leve — dias alternados" deve aparecer.
5. Recarregue a página (F5) → confirme que o offset de dias e os checkmarks de hoje continuam lá (persistência via localStorage).
6. Avance até 2026-09-08 ou depois → deve aparecer a tela "🚧 Retorno à Força ainda não configurada", com botão de reabilitação genérica funcionando e stepper de -7/+7 dias.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: home dirigida por macrofase (checklist rehab + banner + fallback)"
```

---

## Task 6: Atualizar o doc do projeto (handoff obrigatório)

**Files:**
- Modify: `/Users/filipebiten/Desktop/Documentos/claude_code/app treino/app-treino-corrida.md` (fora do repo git — arquivo de handoff do projeto, não precisa commit)

**Interfaces:** nenhuma — edição de texto.

- [ ] **Step 1: Atualizar seção 4 (Estado atual)**

Adicione uma linha na tabela indicando que o app agora reflete a Macrofase 0/1 automaticamente por calendário (não mais "semana 2/30, Musculação B").

- [ ] **Step 2: Atualizar seção 9 (Pendente/Melhorias)**

Marque como feito: "Reestruturar o app para o novo plano (Macrofases 0-4)" → ajuste pra "Macrofases 0-1 feitas; 2-4 em plano separado" e "Adaptar a tela home..." → feito para 0-1. Mantenha "Reabilitação: refazer com protocolo atualizado" como feito pras macrofases 0-1.

- [ ] **Step 3: Adicionar entrada na seção 13 (Log)**

```
| 2026-08-06 | App reestruturado pra macrofases 0-1 (calendário real, checklist de rehab, banner de restrição pós-op). Macrofases 2-4 ficam pra plano separado (menos urgente, começam em 08/09). |
```

- [ ] **Step 4: Salvar o arquivo (sem commit — está fora do repo git)**

---

## Self-Review

- **Cobertura da spec:** motor de calendário (Task 1-2), dados+seleção de rehab macrofase 0-1 (Task 3), motor de rehab genérico parametrizado (Task 4), Home checklist + banner + override + fallback (Task 5), handoff (Task 6). Testes de caminhada, musculação macrofase 2+, corrida macrofase 3-4, peso/histórico/dor matinal/offline ficam fora — são os próximos planos, já sinalizados como "fora de escopo" na spec.
- **Placeholders:** nenhum "TBD"/"implementar depois" — toda tabela de dados é conteúdo real transcrito da spec/doc do projeto.
- **Consistência de tipos:** `getRehabForMacrofase` sempre devolve array de objetos no formato `RehabRoutine` (mesmo shape de `REHAB_ROUTINES`), consumido igual por `RehabScreen` em ambos os call sites (`rehab` genérico e `rehabDose` específico).
