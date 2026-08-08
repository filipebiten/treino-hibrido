# Macrofase 2 — Retorno à Força — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconectar o motor de treino antigo (grid de sessões, preview, `WorkoutScreen`) pra macrofase 2 (08/09-05/10/2026): musculação ABC Fase 1 com ramp-up de carga, rehab reduzido, testes de caminhada.

**Architecture:** O motor antigo (`bw`/`grd`/`startAny`/`adv`/preview/`WorkoutScreen`) já é genérico — só precisa de uma nova camada de dispatch (`sessaoDados`/`sessaoDesc`/`indicesDisponiveis`) que escolhe entre o motor antigo (macrofase<2) e o novo (`buildMuscSession`, macrofase>=2) sem tocar `WorkoutScreen` (já consome `step.ph` genericamente). `mfInfo` (macrofase real) sobe pro topo do componente pra ficar disponível onde `all`/`startAny`/`adv` precisam dele.

**Tech Stack:** Mesma stack — React 19 + Vite, `src/App.jsx` único arquivo, TDD via `scripts/check-macrofase.mjs`.

## Global Constraints

- Tudo em `src/App.jsx` — sem componentes novos em arquivos separados.
- Sem dependências novas.
- `MA`/`MB`/`MC`/`FEET_B`/`FEET_S`/`PHASE_NAMES`/`bw`/`grd`/`gp`/`bm`/`br`/`RD` NÃO mudam — só ganham uma segunda via de seleção (macrofase-aware), aditiva.
- `WorkoutScreen` (bloco `if(scr==="workout")`) e `RehabScreen` NÃO mudam — já são genéricos o suficiente.
- `chaveDiaEfetivo`/carryover são conceitos exclusivos do checklist de macrofase 0-1 — NÃO se aplicam ao fluxo de grid/preview/treino (macrofase>=2 usa `mfInfo` real diretamente, sem ponteiro de dia).

---

## Task 1: Motor de sessão por macrofase (funções puras)

**Files:**
- Modify: `scripts/check-macrofase.mjs`
- Modify: `src/App.jsx` (insere bloco novo logo depois do fechamento de `br()`, linha ~393, antes de `function bw(wk,si){...`)

**Interfaces:**
- Consumes: `MA`, `MB`, `MC`, `FEET_B`, `FEET_S`, `PHASE_NAMES` (já existem, linhas 286-346), `bw`, `grd` (já existem).
- Produces:
  - `export function getMuscPhaseIndex(macrofase, semanaIdx): number` (0, 1 ou 2)
  - `export function levePeso(ex): object`
  - `export function buildMuscSession(phases, macrofase, semanaIdx): Array`
  - `export function indicesDisponiveis(macrofase): number[]`
  - `export function sessaoDados(macrofase, semanaIdx, ses, wk): Array`
  - `export function sessaoDesc(macrofase, semanaIdx, ses, wk): string`

- [ ] **Step 1: Adicionar asserções (vai falhar)**

Troque a linha de import no topo do script:

```js
const { getMacrofase, hojeEfetivo, getRehabForMacrofase, isDiaAtivo, proximoDiaAtivo, ultimoDiaAtivoAte, diaCompleto, computeChaveDiaEfetivo, INICIO_TREINO } = await server.ssrLoadModule("/src/App.jsx");
```

por:

```js
const { getMacrofase, hojeEfetivo, getRehabForMacrofase, isDiaAtivo, proximoDiaAtivo, ultimoDiaAtivoAte, diaCompleto, computeChaveDiaEfetivo, INICIO_TREINO, getMuscPhaseIndex, levePeso, buildMuscSession, indicesDisponiveis, sessaoDados, sessaoDesc } = await server.ssrLoadModule("/src/App.jsx");
```

Adicione ao final, antes de `console.log("OK - getMacrofase: todos os casos passaram");`:

```js
// getMuscPhaseIndex
assert.strictEqual(getMuscPhaseIndex(2, 0), 0);
assert.strictEqual(getMuscPhaseIndex(2, 3), 0);
assert.strictEqual(getMuscPhaseIndex(3, 0), 0);
assert.strictEqual(getMuscPhaseIndex(3, 1), 0);
assert.strictEqual(getMuscPhaseIndex(3, 2), 1);
assert.strictEqual(getMuscPhaseIndex(3, 3), 1);
assert.strictEqual(getMuscPhaseIndex(4, 0), 1);
assert.strictEqual(getMuscPhaseIndex(4, 3), 1);
assert.strictEqual(getMuscPhaseIndex(4, 4), 2);
assert.strictEqual(getMuscPhaseIndex(4, 7), 2);

// levePeso — converte pirâmide (reps string) e exercício simples (reps number)
assert.deepStrictEqual(levePeso({ name: "X", detail: "PIRÂMIDE", sets: 4, reps: "12-10-8-6", rest: 90, type: "exercise" }), { name: "X", sets: 3, reps: 15, rest: 90, type: "exercise" });
assert.deepStrictEqual(levePeso({ name: "Y", sets: 4, reps: 12, rest: 45, type: "exercise" }), { name: "Y", sets: 3, reps: 15, rest: 45, type: "exercise" });

// buildMuscSession — macrofase 2 semana 0 (leve) vs semana 3 (padrão, = MA[0] literal)
const m2s0 = buildMuscSession(MA, 2, 0);
const secaoTreinoS0 = m2s0.find(s => s.section && s.section.startsWith("💪"));
assert.ok(secaoTreinoS0);
const primeiroExS0 = m2s0[m2s0.indexOf(secaoTreinoS0) + 1];
assert.strictEqual(primeiroExS0.sets, 3);
assert.strictEqual(primeiroExS0.reps, 15);

const m2s3 = buildMuscSession(MA, 2, 3);
const secaoTreinoS3 = m2s3.find(s => s.section && s.section.startsWith("💪"));
const primeiroExS3 = m2s3[m2s3.indexOf(secaoTreinoS3) + 1];
assert.strictEqual(primeiroExS3.sets, MA[0].m[0].sets);
assert.strictEqual(primeiroExS3.reps, MA[0].m[0].reps);

// indicesDisponiveis
assert.deepStrictEqual(indicesDisponiveis(2), [0, 2, 4]);
assert.deepStrictEqual(indicesDisponiveis(3), [0, 1, 2, 3, 4, 5]);
assert.deepStrictEqual(indicesDisponiveis(4), [0, 1, 2, 3, 4, 5]);

// sessaoDados — macrofase 2 usa buildMuscSession, ses ímpar (corrida) retorna vazio
const sd2_0 = sessaoDados(2, 0, 0, 2);
assert.ok(sd2_0.some(s => s.section && s.section.startsWith("💪")));
assert.deepStrictEqual(sessaoDados(2, 0, 1, 2), []);

// sessaoDados — macrofase < 2 continua usando o motor antigo (bw)
assert.deepStrictEqual(sessaoDados(1, 0, 0, 5), bw(5, 0));

// sessaoDesc — slots de musculação não têm descrição; macrofase < 2 usa grd
assert.strictEqual(sessaoDesc(2, 0, 0, 2), "");
assert.strictEqual(sessaoDesc(1, 0, 1, 5), grd(5, 1));
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node scripts/check-macrofase.mjs`
Expected: `TypeError: getMuscPhaseIndex is not a function`

- [ ] **Step 3: Implementar em `src/App.jsx`**

Insira este bloco imediatamente antes de `function bw(wk,si){...` (linha ~395):

```js
// ══════════════════════ MOTOR DE SESSÃO POR MACROFASE ══════════════════════
function getMuscPhaseIndex(macrofase, semanaIdx) {
  if (macrofase === 2) return 0;
  if (macrofase === 3) return semanaIdx < 2 ? 0 : 1;
  if (macrofase === 4) return semanaIdx < 4 ? 1 : 2;
  return 0;
}

function levePeso(ex) {
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

function indicesDisponiveis(macrofase) { return macrofase === 2 ? [0, 2, 4] : [0, 1, 2, 3, 4, 5]; }

function sessaoDados(macrofase, semanaIdx, ses, wk) {
  if (macrofase < 2) return bw(wk, ses);
  if (ses === 0) return buildMuscSession(MA, macrofase, semanaIdx);
  if (ses === 2) return buildMuscSession(MB, macrofase, semanaIdx);
  if (ses === 4) return buildMuscSession(MC, macrofase, semanaIdx);
  return [];
}

function sessaoDesc(macrofase, semanaIdx, ses, wk) {
  if (macrofase < 2) return grd(wk, ses);
  return "";
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node scripts/check-macrofase.mjs`
Expected: `OK - getMacrofase: todos os casos passaram`

- [ ] **Step 5: Commit**

```bash
git add scripts/check-macrofase.mjs src/App.jsx
git commit -m "feat: motor de sessao por macrofase (buildMuscSession, sessaoDados/Desc)"
```

---

## Task 2: Rehab reduzido + testes de caminhada (macrofase 2)

**Files:**
- Modify: `scripts/check-macrofase.mjs`
- Modify: `src/App.jsx` (insere bloco novo logo depois do fechamento de `getRehabForMacrofase`, antes de `// ══════════════════════ FOOT PROTOCOL ══════════════════════` — depois do bloco `AGENDA (TERÇA-SEXTA)` já existente ali)

**Interfaces:**
- Produces:
  - `export function getRehabM2(diaAlternado): Array<RehabRoutine>` (mesmo shape de `getRehabForMacrofase`)
  - `export const TESTES_CAMINHADA: Array<{id,nome,criterio}>`

- [ ] **Step 1: Adicionar asserções (vai falhar)**

Troque a linha de import (adicione `getRehabM2` e `TESTES_CAMINHADA` à lista já existente da Task 1) e adicione ao final do script, antes de `console.log(...)`:

```js
const { getRehabM2, TESTES_CAMINHADA } = await server.ssrLoadModule("/src/App.jsx");

const m2semCarga = getRehabM2(false);
assert.strictEqual(m2semCarga.length, 1);
assert.strictEqual(m2semCarga[0].id, "m2-base");

const m2comCarga = getRehabM2(true);
assert.strictEqual(m2comCarga.length, 2);
assert.strictEqual(m2comCarga[1].id, "m2-carga");
assert.strictEqual(m2comCarga[1].exercises[0].reps, 10);

assert.strictEqual(TESTES_CAMINHADA.length, 3);
assert.strictEqual(TESTES_CAMINHADA[0].id, "caminhada20");
assert.strictEqual(TESTES_CAMINHADA[2].id, "caminhada40");
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node scripts/check-macrofase.mjs`
Expected: `TypeError: getRehabM2 is not a function`

- [ ] **Step 3: Implementar em `src/App.jsx`**

```js
// ══════════════════════ REHAB REDUZIDO — MACROFASE 2 ══════════════════════
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

function getRehabM2(diaAlternado) { return diaAlternado ? [REHAB_M2_BASE, REHAB_M2_CARGA] : [REHAB_M2_BASE]; }

export const TESTES_CAMINHADA = [
  { id: "caminhada20", nome: "Caminhar 20min em piso plano", criterio: "Dor ≤ 2/10 durante E no dia seguinte" },
  { id: "caminhada30", nome: "Caminhar 30min", criterio: "Dor ≤ 2/10 durante E no dia seguinte" },
  { id: "caminhada40", nome: "Caminhar 40min com trechos em ritmo forte", criterio: "Dor ≤ 2/10 durante E no dia seguinte" },
];
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node scripts/check-macrofase.mjs`
Expected: `OK - getMacrofase: todos os casos passaram`

- [ ] **Step 5: Commit**

```bash
git add scripts/check-macrofase.mjs src/App.jsx
git commit -m "feat: rehab reduzido e testes de caminhada macrofase 2"
```

---

## Task 3: Reconexão do App — `mfInfo` sobe, `sv`/`all`/`startAny`/`adv` viram macrofase-aware

**Files:**
- Modify: `src/App.jsx` (dentro de `export default function App(){`)

**Interfaces:**
- Consumes: `sessaoDados`, `sessaoDesc`, `indicesDisponiveis` (Task 1).
- Produces: `mfInfo` disponível mais cedo no corpo do componente; `sv(w,s,o)` grava `o`; `all`/`startAny`/`adv` corretos pra qualquer macrofase.

- [ ] **Step 1: Mover `mfInfo` pra antes de `all=`**

Troque:

```js
  const all=bw(wk,ses),steps=all.filter(s=>!s.section),step=steps[sI],ph=gp(wk),tot=steps.length,mph=getMPh(wk);
  function curSec(){let sec="",c=0;for(const s of all){if(s.section){sec=s.section;continue;}if(c===sI)return sec;c++;}return sec;}
  function startAny(si){setSes(si);sv(wk,si);setSIdx(0);setCS(1);setRst(false);setTmr(0);setTmrOn(false);setCup(0);setCupOn(false);setShowHow(false);const w=bw(wk,si),st=w.filter(x=>!x.section);if(st[0]&&st[0].duration&&st[0].type==="timer")setTmr(st[0].duration);setScr("workout");}
  function adv(){let ns=ses+1,nw=wk;if(ns>=6){ns=0;nw=Math.min(wk+1,30);}setSes(ns);setWk(nw);sv(nw,ns);setScr("home");}
```

por:

```js
  const mfInfo=getMacrofase(hojeEfetivo(Date.now(),diasOffset));
  const all=sessaoDados(mfInfo.macrofase,mfInfo.semanaIdx,ses,wk),steps=all.filter(s=>!s.section),step=steps[sI],ph=gp(wk),tot=steps.length,mph=getMPh(wk);
  function curSec(){let sec="",c=0;for(const s of all){if(s.section){sec=s.section;continue;}if(c===sI)return sec;c++;}return sec;}
  function startAny(si){setSes(si);sv(wk,si,diasOffset);setSIdx(0);setCS(1);setRst(false);setTmr(0);setTmrOn(false);setCup(0);setCupOn(false);setShowHow(false);const w=sessaoDados(mfInfo.macrofase,mfInfo.semanaIdx,si,wk),st=w.filter(x=>!x.section);if(st[0]&&st[0].duration&&st[0].type==="timer")setTmr(st[0].duration);setScr("workout");}
  function adv(){const idx=indicesDisponiveis(mfInfo.macrofase);const pos=idx.indexOf(ses);const ns=idx[(pos+1)%idx.length];let nw=wk;if(mfInfo.macrofase<2&&pos===idx.length-1)nw=Math.min(wk+1,30);sv(nw,ns,diasOffset);setSes(ns);setWk(nw);setScr("home");}
```

Nota: pra macrofase<2 (código morto na prática — nunca alcançado, mas mantido íntegro), `adv()` preserva o comportamento antigo de incrementar `wk` ao completar o ciclo de 6. Pra macrofase>=2, `wk` nunca muda mais (a progressão é 100% via calendário real).

- [ ] **Step 2: Remover a segunda declaração de `mfInfo` (agora duplicada)**

Troque:

```js
  function textoLiberado(iso){if(iso<"2026-08-11")return"Pré-operatório — foco total na fascite antes da cirurgia.";return RESTRICOES.find(x=>iso<=x.fim).texto;}
  const mfInfo=getMacrofase(hojeEfetivo(Date.now(),diasOffset));

  if(!ok)return<div style={{background:"#0f0f1a",color:"white",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui"}}><p style={{opacity:.6}}>Carregando...</p></div>;
```

por:

```js
  function textoLiberado(iso){if(iso<"2026-08-11")return"Pré-operatório — foco total na fascite antes da cirurgia.";return RESTRICOES.find(x=>iso<=x.fim).texto;}

  if(!ok)return<div style={{background:"#0f0f1a",color:"white",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui"}}><p style={{opacity:.6}}>Carregando...</p></div>;
```

- [ ] **Step 3: Corrigir `sv()` (landmine já mapeado) pra gravar o campo `o`**

Troque:

```js
  const sv=useCallback((w,s)=>{try{localStorage.setItem("tp7",JSON.stringify({w,s}))}catch(e){}},[]);
```

por:

```js
  const sv=useCallback((w,s,o)=>{try{localStorage.setItem("tp7",JSON.stringify({w,s,o}))}catch(e){}},[]);
```

- [ ] **Step 4: Rodar e confirmar**

Run: `node scripts/check-macrofase.mjs` → `OK - getMacrofase: todos os casos passaram` (nenhuma função pura mudou de assinatura nesta task).
Run: `npx eslint src/App.jsx` → sem erro de sintaxe novo (contagem de warnings pré-existentes pode mudar).

- [ ] **Step 5: Verificação manual**

Run: `npm run dev`. Usando `localStorage` (`tp7.o` pra pular pra uma data dentro de 08/09-05/10/2026), confirme que a Home ainda mostra o fallback 🚧 (Task 4 é quem troca isso) mas SEM erro no console — essa task só troca o encanamento interno, não a UI ainda.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "fix: sv grava offset de data; all/startAny/adv viram macrofase-aware"
```

---

## Task 4: Estado + tela de teste de caminhada no App

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `TESTES_CAMINHADA` (Task 2).
- Produces: estado `testeAtivo`/`testesLog` no `App`; função `marcarTeste(id,passou)`; tela `scr==="testeCaminhada"`.

- [ ] **Step 1: Estado novo**

Adicione, logo após `const[chaveDiaBase,setChaveDiaBase]=useState(null);`:

```js
  const[testeAtivo,setTesteAtivo]=useState(null);
  const[testesLog,setTestesLog]=useState({});
```

- [ ] **Step 2: Carregar `testesLog` do localStorage**

Troque:

```js
  useEffect(()=>{(async()=>{try{const r=localStorage.getItem("tp7");if(r){const d=JSON.parse(r);setWk(d.w||2);setSes(d.s!==undefined?d.s:2);setDiasOffset(d.o||0);}const rl=localStorage.getItem("tp7rehab");if(rl)setRehabLog(JSON.parse(rl));const rd=localStorage.getItem("tp7dia");if(rd)setChaveDiaBase(JSON.parse(rd).b||null);}catch(e){}setOk(true);})();},[]);
```

por:

```js
  useEffect(()=>{(async()=>{try{const r=localStorage.getItem("tp7");if(r){const d=JSON.parse(r);setWk(d.w||2);setSes(d.s!==undefined?d.s:2);setDiasOffset(d.o||0);}const rl=localStorage.getItem("tp7rehab");if(rl)setRehabLog(JSON.parse(rl));const rd=localStorage.getItem("tp7dia");if(rd)setChaveDiaBase(JSON.parse(rd).b||null);const rt=localStorage.getItem("tp7testes");if(rt)setTestesLog(JSON.parse(rt));}catch(e){}setOk(true);})();},[]);
```

- [ ] **Step 3: Função `marcarTeste`**

Adicione, logo depois de `function finalizarDia(){...}`:

```js
  function marcarTeste(id,passou){const novo={...testesLog,[id]:{passou,data:isoHoje()}};setTestesLog(novo);try{localStorage.setItem("tp7testes",JSON.stringify(novo))}catch(e){}setScr("home");}
```

- [ ] **Step 4: Tela nova**

Adicione, logo depois da linha `if(scr==="rehabDose") return<RehabScreen onBack={()=>{setScr("home");setRehabScreenRoutines(null);}} routines={rehabScreenRoutines} onRoutineComplete={()=>markDose(activeDoseKey)}/>;`:

```js
  if(scr==="testeCaminhada"){const t=TESTES_CAMINHADA.find(x=>x.id===testeAtivo);if(!t)return<div style={{background:"#0f0f1a",color:"white",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><button onClick={()=>setScr("home")} style={{color:"white"}}>← Voltar</button></div>;
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:16,maxWidth:480,margin:"0 auto"}}>
      <button onClick={()=>setScr("home")} style={{background:"none",border:"none",color:"#94a3b8",fontSize:14,cursor:"pointer",padding:4,marginBottom:20}}>← Voltar</button>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:40,marginBottom:12}}>🚶</div>
        <div style={{fontSize:20,fontWeight:800,marginBottom:8}}>{t.nome}</div>
        <div style={{fontSize:13,color:"#94a3b8"}}>{t.criterio}</div>
      </div>
      <button onClick={()=>marcarTeste(t.id,true)} style={{width:"100%",padding:16,marginBottom:10,borderRadius:14,border:"2px solid #4ade8088",background:"#4ade8022",color:"white",fontSize:15,fontWeight:700,cursor:"pointer"}}>✓ Passou</button>
      <button onClick={()=>marcarTeste(t.id,false)} style={{width:"100%",padding:16,borderRadius:14,border:"2px solid #ef444488",background:"#ef444422",color:"white",fontSize:15,fontWeight:700,cursor:"pointer"}}>✗ Não passou (dor {'>'} 2/10)</button>
    </div>;}
```

- [ ] **Step 5: Rodar e confirmar**

Run: `node scripts/check-macrofase.mjs` → OK
Run: `npx eslint src/App.jsx` → sem erro de sintaxe novo

- [ ] **Step 6: Verificação manual**

Run: `npm run dev`. Definir `localStorage.tp7testes` manualmente pra `{}` (ou deixar vazio), e no console do navegador confirmar que `scr==="testeCaminhada"` não é alcançável ainda por essa task sozinha (Task 5 é quem adiciona o botão de entrada na Home) — a verificação aqui é só que não há erro de sintaxe/runtime ao carregar a Home normalmente com o novo estado presente.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: estado e tela de teste de caminhada no App"
```

---

## Task 5: Home + Preview reconectados pra macrofase 2

**Files:**
- Modify: `src/App.jsx` — bloco `if(mfInfo.macrofase>1){...}` dentro de `if(scr==="home")` (fallback 🚧) e bloco `if(scr==="preview")`.

**Interfaces:**
- Consumes: `sessaoDados`, `sessaoDesc`, `indicesDisponiveis` (Task 1), `getRehabM2`, `TESTES_CAMINHADA` (Task 2), `testesLog`, `setTesteAtivo` (Task 4).
- Produces: Home funcional pra macrofase 2 (grid de 3, card "próximo treino", iniciar treino, banner rehab, card de testes de caminhada quando `semanaIdx>=2`); Preview filtra o grid de abas pelas sessões disponíveis.

- [ ] **Step 1: Trocar o fallback 🚧 (só quando macrofase===2; macrofase 3-4 continuam mostrando 🚧 até os próximos planos)**

Troque:

```js
    if(mfInfo.macrofase>1){
      return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>🚧</div>
        <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>{mfInfo.nome} ainda não configurada no app</div>
        <div style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>Consulte o plano completo no CLAUDE.md do projeto até essa parte ser implementada.</div>
        <button onClick={()=>setScr("rehab")} style={{padding:"12px 20px",borderRadius:12,border:"1px solid #ef444444",background:"#ef444415",color:"#ef4444",cursor:"pointer",marginBottom:16}}>🦶 Abrir Reabilitação</button>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setDias(-7)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"white",cursor:"pointer"}}>-7 dias</button>
          <span style={{fontSize:13,color:"#94a3b8"}}>{hojeReal}</span>
          <button onClick={()=>setDias(7)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"white",cursor:"pointer"}}>+7 dias</button>
        </div>
      </div>;
    }
```

por:

```js
    if(mfInfo.macrofase===2){
      const descM2=sessaoDesc(mfInfo.macrofase,mfInfo.semanaIdx,ses,wk);
      const idxM2=indicesDisponiveis(mfInfo.macrofase);
      const rotinasRehabM2=getRehabM2(mfInfo.diaAlternado);
      return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto"}}><style>{G}</style>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:12,color:"#94a3b8",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Treino Híbrido</div>
          <div style={{fontSize:22,fontWeight:800}}>{mfInfo.nome}</div>
          <div style={{fontSize:12,color:"#64748b",marginTop:4}}>Semana {mfInfo.semanaIdx+1}/4 — {hojeReal}</div>
          <div style={{fontSize:10,color:"#64748b",marginTop:4}}>🏋️ {PHASE_NAMES[getMuscPhaseIndex(mfInfo.macrofase,mfInfo.semanaIdx)]}</div>
        </div>
        <button onClick={()=>setScr("rehab")} style={{width:"100%",padding:"14px 16px",marginBottom:16,borderRadius:14,border:"1px solid #ef444444",background:"linear-gradient(135deg,#ef444415,#ef444405)",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:28}}>🦶</div>
          <div><div style={{fontSize:14,fontWeight:700,color:"#ef4444"}}>{rotinasRehabM2[0].title}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Manutenção — toque a qualquer momento</div></div>
        </button>
        {mfInfo.semanaIdx>=2&&<div style={{marginBottom:16,padding:14,background:"rgba(255,255,255,0.03)",borderRadius:12}}>
          <div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🚶 Testes de caminhada</div>
          {TESTES_CAMINHADA.map(t=>{const r=testesLog[t.id];return<button key={t.id} onClick={()=>{setTesteAtivo(t.id);setScr("testeCaminhada")}} style={{width:"100%",padding:10,marginBottom:6,borderRadius:10,border:"1px solid #334155",background:"transparent",color:"white",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12}}>{t.nome}</span>
            <span style={{fontSize:11,color:r?(r.passou?"#4ade80":"#ef4444"):"#64748b"}}>{r?(r.passou?"✓ Passou":"✗ Não passou"):"Pendente"}</span>
          </button>;})}
        </div>}
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:4,marginBottom:16}}>
          <div style={{display:"flex",gap:2}}>{idxM2.map(i=><div key={i} style={{flex:1,height:6,borderRadius:3,background:i<ses?SCO[i]:i===ses?SCO[i]+"99":"#1a1a2e",animation:i===ses?"pulse 2s infinite":"none"}}/>)}</div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"6px 2px 2px",fontSize:9,color:"#64748b"}}>{idxM2.map(i=><span key={i} style={{flex:1,textAlign:"center",fontWeight:i===ses?700:400,color:i===ses?"white":"#64748b"}}>{SS[i]}</span>)}</div>
        </div>
        <div style={{background:"linear-gradient(135deg,"+SCO[ses]+"22,"+SCO[ses]+"08)",border:"1px solid "+SCO[ses]+"44",borderRadius:20,padding:28,textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:56,marginBottom:8}}>{SIC[ses]}</div>
          <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Próximo treino</div>
          <div style={{fontSize:22,fontWeight:800,marginBottom:6}}>{SL[ses]}</div>
          {descM2&&<div style={{fontSize:14,color:SCO[ses],fontWeight:600,background:SCO[ses]+"18",borderRadius:8,padding:"6px 14px",display:"inline-block"}}>{descM2}</div>}
        </div>
        <button onClick={()=>startAny(ses)} style={{width:"100%",padding:"16px 0",fontSize:17,fontWeight:800,background:"linear-gradient(135deg,"+SCO[ses]+","+SCO[ses]+"cc)",color:"white",border:"none",borderRadius:14,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>INICIAR TREINO</button>
        <button onClick={adv} style={{width:"100%",padding:"10px 0",fontSize:12,background:"transparent",color:"#475569",border:"none",cursor:"pointer"}}>Pular treino →</button>
        <div style={{marginTop:24}}><div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Treinos — toque para ver ou iniciar</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{idxM2.map(i=><button key={i} onClick={()=>{setPvS(i);setScr("preview")}} style={{padding:"12px 6px",borderRadius:12,border:i===ses?"2px solid "+SCO[i]:"1px solid #1e293b",background:i===ses?SCO[i]+"15":"rgba(255,255,255,0.02)",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:22,marginBottom:2}}>{SIC[i]}</div><div style={{fontSize:10,color:i===ses?SCO[i]:"#94a3b8",fontWeight:i===ses?700:500}}>{SL[i].replace("Musculação ","")}</div>{i===ses&&<div style={{fontSize:8,color:SCO[i],marginTop:2,fontWeight:700}}>PRÓXIMO</div>}</button>)}</div></div>
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
    if(mfInfo.macrofase>2){
      return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>🚧</div>
        <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>{mfInfo.nome} ainda não configurada no app</div>
        <div style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>Consulte o plano completo no CLAUDE.md do projeto até essa parte ser implementada.</div>
        <button onClick={()=>setScr("rehab")} style={{padding:"12px 20px",borderRadius:12,border:"1px solid #ef444444",background:"#ef444415",color:"#ef4444",cursor:"pointer",marginBottom:16}}>🦶 Abrir Reabilitação</button>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setDias(-7)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"white",cursor:"pointer"}}>-7 dias</button>
          <span style={{fontSize:13,color:"#94a3b8"}}>{hojeReal}</span>
          <button onClick={()=>setDias(7)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"white",cursor:"pointer"}}>+7 dias</button>
        </div>
      </div>;
    }
```

Nota: `mfInfo.macrofase>1` virou dois `if`s (`===2` primeiro, `>2` depois) — macrofase 3/4 continuam no fallback 🚧 até os planos delas rodarem.

- [ ] **Step 2: Preview — filtrar abas e usar `sessaoDados`/`sessaoDesc`**

Troque:

```js
  if(scr==="preview"){const pw=bw(wk,pvS),desc=grd(wk,pvS),isMu=pvS===0||pvS===2||pvS===4;
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:16,maxWidth:480,margin:"0 auto"}}><style>{G}</style>
      <button onClick={()=>setScr("home")} style={{background:"none",border:"none",color:"#94a3b8",fontSize:14,cursor:"pointer",padding:4,marginBottom:12}}>← Voltar</button>
      <div style={{display:"flex",gap:5,marginBottom:16,overflowX:"auto",paddingBottom:4}}>{[0,1,2,3,4,5].map(i=><button key={i} onClick={()=>setPvS(i)} style={{padding:"7px 12px",borderRadius:10,border:"none",cursor:"pointer",whiteSpace:"nowrap",fontSize:11,fontWeight:i===pvS?800:500,background:i===pvS?SCO[i]:"rgba(255,255,255,0.06)",color:i===pvS?"white":"#94a3b8"}}>{SS[i]}</button>)}</div>
      <div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:36,marginBottom:4}}>{SIC[pvS]}</div><div style={{fontSize:20,fontWeight:800}}>{SL[pvS]}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Semana {wk} — {ph.n}</div>{isMu&&<div style={{fontSize:11,color:"#4ade80",marginTop:4}}>🏋️ {PHASE_NAMES[mph]}</div>}{desc&&<div style={{fontSize:13,color:SCO[pvS],fontWeight:600,marginTop:6,background:SCO[pvS]+"18",borderRadius:8,padding:"4px 12px",display:"inline-block"}}>{desc}</div>}</div>
      <PVList steps={pw}/>
      <button onClick={()=>startAny(pvS)} style={{width:"100%",marginTop:16,padding:"14px 0",background:"linear-gradient(135deg,"+SCO[pvS]+","+SCO[pvS]+"cc)",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:"pointer",letterSpacing:1,textTransform:"uppercase"}}>INICIAR ESTE TREINO</button></div>;}
```

por:

```js
  if(scr==="preview"){const pw=sessaoDados(mfInfo.macrofase,mfInfo.semanaIdx,pvS,wk),desc=sessaoDesc(mfInfo.macrofase,mfInfo.semanaIdx,pvS,wk),isMu=pvS===0||pvS===2||pvS===4,idxPrev=indicesDisponiveis(mfInfo.macrofase),tituloFase=mfInfo.macrofase>=2?mfInfo.nome:"Semana "+wk+" — "+ph.n,faseM=mfInfo.macrofase>=2?PHASE_NAMES[getMuscPhaseIndex(mfInfo.macrofase,mfInfo.semanaIdx)]:PHASE_NAMES[mph];
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:16,maxWidth:480,margin:"0 auto"}}><style>{G}</style>
      <button onClick={()=>setScr("home")} style={{background:"none",border:"none",color:"#94a3b8",fontSize:14,cursor:"pointer",padding:4,marginBottom:12}}>← Voltar</button>
      <div style={{display:"flex",gap:5,marginBottom:16,overflowX:"auto",paddingBottom:4}}>{idxPrev.map(i=><button key={i} onClick={()=>setPvS(i)} style={{padding:"7px 12px",borderRadius:10,border:"none",cursor:"pointer",whiteSpace:"nowrap",fontSize:11,fontWeight:i===pvS?800:500,background:i===pvS?SCO[i]:"rgba(255,255,255,0.06)",color:i===pvS?"white":"#94a3b8"}}>{SS[i]}</button>)}</div>
      <div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:36,marginBottom:4}}>{SIC[pvS]}</div><div style={{fontSize:20,fontWeight:800}}>{SL[pvS]}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{tituloFase}</div>{isMu&&<div style={{fontSize:11,color:"#4ade80",marginTop:4}}>🏋️ {faseM}</div>}{desc&&<div style={{fontSize:13,color:SCO[pvS],fontWeight:600,marginTop:6,background:SCO[pvS]+"18",borderRadius:8,padding:"4px 12px",display:"inline-block"}}>{desc}</div>}</div>
      <PVList steps={pw}/>
      <button onClick={()=>startAny(pvS)} style={{width:"100%",marginTop:16,padding:"14px 0",background:"linear-gradient(135deg,"+SCO[pvS]+","+SCO[pvS]+"cc)",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:"pointer",letterSpacing:1,textTransform:"uppercase"}}>INICIAR ESTE TREINO</button></div>;}
```

- [ ] **Step 3: Rodar e confirmar**

Run: `node scripts/check-macrofase.mjs` → OK, sem regressão.
Run: `npx eslint src/App.jsx` → sem erro de sintaxe novo.

- [ ] **Step 4: Verificação manual completa no browser**

Run: `npm run dev`. Ajuste `localStorage.tp7.o` pra uma data dentro de 08/09-05/10/2026 (ex.: offset relativo à data real do sistema).

1. Home mostra "Retorno à Força", grid de 3 (A/B/C, sem corrida), card "Próximo treino" = Musculação A.
2. Tocar "Musculação A" no grid → preview mostra abas só A/B/C, exercícios com `sets:3,reps:15` (se semana 1-2) ou padrão (semana 3-4).
3. "Iniciar treino" → `WorkoutScreen` roda normalmente (timer, séries, descanso) — sem mudança de comportamento aí.
4. Completar/pular até voltar pra Home → grid avança pro próximo (`adv()`), sem tocar `wk`.
5. Avançar a data de teste pra semana 3 (offset maior) → card "🚶 Testes de caminhada" aparece com os 3 testes "Pendente". Tocar um teste → abre a tela (Task 4), marcar "✓ Passou" → volta pra Home com status atualizado.
6. Botão de rehab abre `scr==="rehab"` com as rotinas de `getRehabM2` (título "Manutenção fascite").
7. Recarregar a página → `tp7testes` persiste.
8. Console sem erros em todo o fluxo.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: home e preview reconectados para macrofase 2 (retorno a forca)"
```

---

## Self-Review

- **Cobertura da spec:** motor de sessão por macrofase (Task 1), rehab reduzido + dado de testes (Task 2), reconexão `sv`/`all`/`startAny`/`adv` (Task 3), estado e tela de teste de caminhada (Task 4), Home+Preview (Task 5). Todos os pontos da seção "Decisão de arquitetura", "Rehab reduzido", "Testes de caminhada" e "Tela Home" do spec estão cobertos.
- **Placeholders:** nenhum — todo código é literal, copiável.
- **Consistência de tipos:** `sessaoDados`/`sessaoDesc` sempre recebem `(macrofase, semanaIdx, ses, wk)` na mesma ordem em todos os call sites (`all=`, `startAny`, preview). `getRehabM2` sempre devolve `Array<RehabRoutine>` no mesmo shape usado por `getRehabForMacrofase`, consumido igual por `RehabScreen`. Ordem de tasks corrigida: Task 4 (estado/tela de teste) roda antes da Task 5 (Home), já que a Home consome `testesLog`/`setTesteAtivo`/`TESTES_CAMINHADA` que a Task 4 produz.
