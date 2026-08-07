# Agenda Terça-Sexta + Ponteiro de Dia com Carryover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rehab só roda terça-sexta a partir de 2026-08-12, com um ponteiro de "dia efetivo" que trava em dias incompletos (carryover automático) até o usuário terminar ou apertar "Dia finalizado"; Home passa a listar os exercícios de cada dose direto, sem precisar abrir a rotina.

**Architecture:** Duas datas coexistem: a data real (`hojeEfetivo`, motor existente) continua sendo a única fonte pra `getMacrofase` (macrofase/semana/banner de restrição médica). Um novo ponteiro `chaveDiaBase` (persistido, só muda por inicialização ou pelo botão "Dia finalizado") ancora um "dia efetivo" derivado por função pura (`computeChaveDiaEfetivo`), que anda pra frente automaticamente enquanto os dias percorridos estiverem 100% completos e trava no primeiro incompleto. `doseFeita`/`markDose` passam a chavear pelo dia efetivo, não mais pela data real — isso é o mecanismo de carryover.

**Tech Stack:** React 19 + Vite, sem dependências novas. Mesmo padrão de teste dos planos anteriores: `scripts/check-macrofase.mjs` roda `assert` sobre funções puras exportadas de `src/App.jsx` via `server.ssrLoadModule`.

## Global Constraints

- Tudo em `src/App.jsx` — não criar componentes em arquivos separados (decisão de design nº1 do projeto).
- Sem dependências novas no `package.json`.
- Tema escuro `#0f0f1a`, inline styles, sem framework CSS (padrão já usado no arquivo inteiro).
- Texto do app em português do Brasil.
- `INICIO_TREINO = "2026-08-12"` — data literal, não recalcular.
- Restrição médica/banner (`textoLiberado`, `mfInfo` do header de macrofase) continuam calculados pela **data real** (`hojeEfetivo`) — carryover não altera a linha do tempo de cicatrização.

---

## Task 1: Funções puras de agenda (dias ativos + ponteiro de dia efetivo)

**Files:**
- Modify: `scripts/check-macrofase.mjs`
- Modify: `src/App.jsx` (insere bloco novo depois do fechamento de `getRehabForMacrofase`, linha 220, antes do comentário `// ══════════════════════ FOOT PROTOCOL ══════════════════════`, linha 222)

**Interfaces:**
- Consumes: `getMacrofase` (Task anterior), `getRehabForMacrofase` (Task anterior), `toISO` (helper interno já existente em `src/App.jsx:52`, não exportado, mas está no mesmo escopo de módulo).
- Produces:
  - `export const INICIO_TREINO = "2026-08-12"`
  - `export function isDiaAtivo(iso: string): boolean` — true se terça(2)…sexta(5) via `Date.getDay()`.
  - `export function proximoDiaAtivo(iso: string): string` — próximo dia ativo depois de `iso` (pula fim de semana/segunda).
  - `export function ultimoDiaAtivoAte(iso: string): string` — `iso` se já ativo, senão o dia ativo anterior mais próximo.
  - `export function diaCompleto(iso: string, rehabLog: object): boolean` — true se `rehabLog[iso]` tem `manha` e `noite` marcados, e `carga` também se aquele dia exigir carga (via `getRehabForMacrofase` retornando mais de 1 rotina).
  - `export function computeChaveDiaEfetivo(chaveDiaBase: string|null, rehabLog: object, hojeReal: string): string|null` — deriva o dia efetivo (null se `chaveDiaBase` for null).

- [ ] **Step 1: Adicionar asserções (vai falhar)**

Troque a linha do import no topo do script:

```js
const { getMacrofase, hojeEfetivo, getRehabForMacrofase } = await server.ssrLoadModule("/src/App.jsx");
```

por:

```js
const { getMacrofase, hojeEfetivo, getRehabForMacrofase, isDiaAtivo, proximoDiaAtivo, ultimoDiaAtivoAte, diaCompleto, computeChaveDiaEfetivo, INICIO_TREINO } = await server.ssrLoadModule("/src/App.jsx");
```

Adicione ao final do script, antes de `console.log("OK - getMacrofase: todos os casos passaram");`:

```js
// isDiaAtivo — terça(2) a sexta(5)
assert.strictEqual(isDiaAtivo("2026-08-11"), true);  // terça
assert.strictEqual(isDiaAtivo("2026-08-12"), true);  // quarta
assert.strictEqual(isDiaAtivo("2026-08-14"), true);  // sexta
assert.strictEqual(isDiaAtivo("2026-08-15"), false); // sábado
assert.strictEqual(isDiaAtivo("2026-08-16"), false); // domingo
assert.strictEqual(isDiaAtivo("2026-08-17"), false); // segunda

// proximoDiaAtivo — pula fim de semana + segunda
assert.strictEqual(proximoDiaAtivo("2026-08-11"), "2026-08-12"); // terça -> quarta
assert.strictEqual(proximoDiaAtivo("2026-08-14"), "2026-08-18"); // sexta -> terça seguinte

// ultimoDiaAtivoAte
assert.strictEqual(ultimoDiaAtivoAte("2026-08-12"), "2026-08-12"); // já ativo
assert.strictEqual(ultimoDiaAtivoAte("2026-08-15"), "2026-08-14"); // sábado -> sexta anterior
assert.strictEqual(ultimoDiaAtivoAte("2026-08-17"), "2026-08-14"); // segunda -> sexta anterior

// diaCompleto — macrofase 1 semana 0 (08-11..17), dia par (diaAlternado=true) mas semana 0 não tem carga
assert.strictEqual(diaCompleto("2026-08-12", {}), false);
assert.strictEqual(diaCompleto("2026-08-12", { "2026-08-12": { manha: true, noite: true } }), true);

// diaCompleto — macrofase 1 semana 2 (08-25..31), dia par exige carga
assert.strictEqual(diaCompleto("2026-08-27", { "2026-08-27": { manha: true, noite: true } }), false);
assert.strictEqual(diaCompleto("2026-08-27", { "2026-08-27": { manha: true, noite: true, carga: true } }), true);

// computeChaveDiaEfetivo — sem base
assert.strictEqual(computeChaveDiaEfetivo(null, {}, "2026-08-13"), null);

// computeChaveDiaEfetivo — caso feliz: dia anterior completo, avança até hoje
assert.strictEqual(
  computeChaveDiaEfetivo("2026-08-12", { "2026-08-12": { manha: true, noite: true } }, "2026-08-13"),
  "2026-08-13"
);

// computeChaveDiaEfetivo — carryover: dia incompleto trava, mesmo com hoje real adiantado
assert.strictEqual(
  computeChaveDiaEfetivo("2026-08-12", {}, "2026-08-14"),
  "2026-08-12"
);

// computeChaveDiaEfetivo — avança um passo, trava no próximo incompleto
assert.strictEqual(
  computeChaveDiaEfetivo("2026-08-11", { "2026-08-11": { manha: true, noite: true } }, "2026-08-14"),
  "2026-08-12"
);

assert.strictEqual(INICIO_TREINO, "2026-08-12");
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node scripts/check-macrofase.mjs`
Expected: `TypeError: isDiaAtivo is not a function` (ou erro equivalente de import undefined)

- [ ] **Step 3: Implementar em `src/App.jsx`**

Insira este bloco imediatamente depois da linha 220 (`}` que fecha `getRehabForMacrofase`) e antes da linha 222 (`// ══════════════════════ FOOT PROTOCOL ══════════════════════`):

```js

// ══════════════════════ AGENDA (TERÇA-SEXTA) ══════════════════════
export const INICIO_TREINO = "2026-08-12";

export function isDiaAtivo(iso) {
  const dw = new Date(iso + "T00:00:00").getDay();
  return dw >= 2 && dw <= 5;
}

export function proximoDiaAtivo(iso) {
  let d = new Date(iso + "T00:00:00");
  do { d = new Date(d.getTime() + 86400000); } while (!isDiaAtivo(toISO(d)));
  return toISO(d);
}

export function ultimoDiaAtivoAte(iso) {
  let d = iso;
  while (!isDiaAtivo(d)) { d = toISO(new Date(new Date(d + "T00:00:00").getTime() - 86400000)); }
  return d;
}

export function diaCompleto(iso, rehabLog) {
  const mf = getMacrofase(new Date(iso + "T00:00:00"));
  const rotinas = getRehabForMacrofase(mf.macrofase, mf.semanaIdx, mf.diaAlternado);
  const precisaCarga = rotinas.length > 1;
  const log = rehabLog[iso] || {};
  return !!log.manha && !!log.noite && (!precisaCarga || !!log.carga);
}

export function computeChaveDiaEfetivo(chaveDiaBase, rehabLog, hojeReal) {
  if (!chaveDiaBase) return null;
  const teto = ultimoDiaAtivoAte(hojeReal);
  let d = chaveDiaBase;
  while (d < teto && diaCompleto(d, rehabLog)) { d = proximoDiaAtivo(d); }
  return d;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node scripts/check-macrofase.mjs`
Expected: `OK - getMacrofase: todos os casos passaram`

- [ ] **Step 5: Commit**

```bash
git add scripts/check-macrofase.mjs src/App.jsx
git commit -m "feat: funcoes puras de agenda terca-sexta e ponteiro de dia efetivo"
```

---

## Task 2: Estado `chaveDiaBase` no App + rewire de `doseFeita`/`markDose` pro dia efetivo

**Files:**
- Modify: `src/App.jsx` (dentro de `export default function App(){`, linhas ~483-519)

**Interfaces:**
- Consumes: `isDiaAtivo`, `proximoDiaAtivo`, `ultimoDiaAtivoAte`, `diaCompleto`, `computeChaveDiaEfetivo`, `INICIO_TREINO` (Task 1).
- Produces: estado `chaveDiaBase`; const `chaveDiaEfetivo` (calculado a cada render); função `finalizarDia()`; `doseFeita`/`markDose` agora chaveados pelo dia efetivo, não mais por `isoHoje()`.

- [ ] **Step 1: Adicionar estado `chaveDiaBase`**

Troque:

```js
  const[rehabScreenRoutines,setRehabScreenRoutines]=useState(null);
  const iR=useRef(null),cR=useRef(null),bp=useRef(false);
```

por:

```js
  const[rehabScreenRoutines,setRehabScreenRoutines]=useState(null);
  const[chaveDiaBase,setChaveDiaBase]=useState(null);
  const iR=useRef(null),cR=useRef(null),bp=useRef(false);
```

- [ ] **Step 2: Carregar `chaveDiaBase` do localStorage**

Troque:

```js
  useEffect(()=>{(async()=>{try{const r=localStorage.getItem("tp7");if(r){const d=JSON.parse(r);setWk(d.w||2);setSes(d.s!==undefined?d.s:2);setDiasOffset(d.o||0);}const rl=localStorage.getItem("tp7rehab");if(rl)setRehabLog(JSON.parse(rl));}catch(e){}setOk(true);})();},[]);
```

por:

```js
  useEffect(()=>{(async()=>{try{const r=localStorage.getItem("tp7");if(r){const d=JSON.parse(r);setWk(d.w||2);setSes(d.s!==undefined?d.s:2);setDiasOffset(d.o||0);}const rl=localStorage.getItem("tp7rehab");if(rl)setRehabLog(JSON.parse(rl));const rd=localStorage.getItem("tp7dia");if(rd)setChaveDiaBase(JSON.parse(rd).b||null);}catch(e){}setOk(true);})();},[]);
```

- [ ] **Step 3: Efeito de inicialização (primeira vez que a data real alcança `INICIO_TREINO`)**

Logo depois da linha `const sv=useCallback((w,s)=>{try{localStorage.setItem("tp7",JSON.stringify({w,s}))}catch(e){}},[]);`, adicione:

```js
  useEffect(()=>{if(ok&&!chaveDiaBase&&isoHoje()>=INICIO_TREINO){setChaveDiaBase(INICIO_TREINO);try{localStorage.setItem("tp7dia",JSON.stringify({b:INICIO_TREINO}))}catch(e){}}},[ok,chaveDiaBase,diasOffset]);
```

- [ ] **Step 4: Calcular `chaveDiaEfetivo` e adicionar `finalizarDia`**

Troque:

```js
  function markDose(key){const iso=isoHoje();const novo={...rehabLog,[iso]:{...(rehabLog[iso]||{}),[key]:true}};setRehabLog(novo);try{localStorage.setItem("tp7rehab",JSON.stringify(novo))}catch(e){}}
  function doseFeita(key){const iso=isoHoje();return !!(rehabLog[iso]&&rehabLog[iso][key]);}
```

por:

```js
  const chaveDiaEfetivo=computeChaveDiaEfetivo(chaveDiaBase,rehabLog,isoHoje());
  function markDose(key){const iso=chaveDiaEfetivo;if(!iso)return;const novo={...rehabLog,[iso]:{...(rehabLog[iso]||{}),[key]:true}};setRehabLog(novo);try{localStorage.setItem("tp7rehab",JSON.stringify(novo))}catch(e){}}
  function doseFeita(key){const iso=chaveDiaEfetivo;return !!(iso&&rehabLog[iso]&&rehabLog[iso][key]);}
  function finalizarDia(){if(!chaveDiaEfetivo)return;const b=proximoDiaAtivo(chaveDiaEfetivo);setChaveDiaBase(b);try{localStorage.setItem("tp7dia",JSON.stringify({b}))}catch(e){}}
```

Nota: `chaveDiaEfetivo` precisa estar declarado (via `const`) antes de `markDose`/`doseFeita`/`finalizarDia` no corpo do componente porque essas funções fecham sobre ele por escopo — como é `const` (não `function` hoistada), tem que vir antes textualmente. A troca acima já garante isso (a linha `const chaveDiaEfetivo=...` fica logo acima das 3 funções).

- [ ] **Step 5: Verificação manual rápida**

Run: `node scripts/check-macrofase.mjs` — deve continuar passando (nenhuma assinatura de função pura mudou).

Run: `npm run dev`, abra a URL local, confirme que a Home ainda carrega sem erro no console (comportamento visual só muda na Task 3, essa task é só encanamento de estado).

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: estado chaveDiaBase e rewire de doseFeita/markDose pro dia efetivo"
```

---

## Task 3: Home com 3 estados (pausado/checklist/descanso) + lista de exercícios inline + botão "Dia finalizado"

**Files:**
- Modify: `src/App.jsx` — bloco `if(scr==="home"){...}` (linhas ~539-582 antes desta task; os números exatos podem ter mudado ligeiramente pelas Tasks 1-2, use o texto como âncora).

**Interfaces:**
- Consumes: `chaveDiaEfetivo`, `finalizarDia`, `isDiaAtivo`, `diaCompleto`, `INICIO_TREINO` (Tasks 1-2).
- Produces: nenhuma interface nova pra fora — só re-renderização da Home.

- [ ] **Step 1: Substituir o bloco `if(scr==="home"){...}` inteiro**

Localize o bloco inteiro (do `if(scr==="home"){` até o `</div>;\n  }` que fecha, incluindo o fallback macrofase 2+):

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

Substitua o bloco inteiro acima por este (mesmos pontos de entrada — `scr==="home"` —, mesma saída — 3 telas possíveis):

```js
  if(scr==="home"){
    const hojeReal=isoHoje();
    if(hojeReal<INICIO_TREINO){
      return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>⏸️</div>
        <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>Pausado até {INICIO_TREINO}</div>
        <div style={{fontSize:13,color:"#94a3b8"}}>Reabilitação começa terça a sexta, a partir de 12/08.</div>
      </div>;
    }
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
    const diaCheckList=chaveDiaEfetivo||hojeReal;
    const completoHoje=diaCompleto(diaCheckList,rehabLog);
    if(completoHoje&&!isDiaAtivo(hojeReal)){
      return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>😴</div>
        <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>Dia de descanso</div>
        <div style={{fontSize:13,color:"#94a3b8"}}>Rehab é terça a sexta.</div>
      </div>;
    }
    const mfDia=getMacrofase(new Date(diaCheckList+"T00:00:00"));
    const rotinas=getRehabForMacrofase(mfDia.macrofase,mfDia.semanaIdx,mfDia.diaAlternado);
    const rotinaBase=rotinas[0];
    const cfgSemana=mfDia.macrofase===1?REHAB_M1[Math.min(mfDia.semanaIdx,REHAB_M1.length-1)]:null;
    const rotinaCarga=rotinas[1]||(cfgSemana?cfgSemana.carga:null);
    const atrasado=diaCheckList<hojeReal;
    return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto"}}><style>{G}</style>
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:12,color:"#94a3b8",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Treino Híbrido</div>
        <div style={{fontSize:22,fontWeight:800}}>{mfDia.nome}</div>
        <div style={{fontSize:12,color:"#64748b",marginTop:4}}>Dia {mfDia.diasDesdeInicioMacrofase+1} — {diaCheckList}</div>
        {atrasado&&<div style={{fontSize:11,color:"#ef4444",marginTop:4,fontWeight:700}}>⚠ Atrasado desde {diaCheckList} — hoje é {hojeReal}</div>}
      </div>
      <div style={{padding:14,background:"#f59e0b15",border:"1px solid #f59e0b44",borderRadius:12,marginBottom:16,fontSize:12,color:"#fbbf24",lineHeight:1.5}}>🩹 {textoLiberado(hojeReal)}</div>
      <div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Checklist de {diaCheckList===hojeReal?"hoje":diaCheckList}</div>
      {["manha","noite"].map(key=>{const feita=doseFeita(key);return<button key={key} onClick={()=>abrirDose(key,rotinaBase)} style={{width:"100%",padding:16,marginBottom:10,borderRadius:14,border:"1px solid "+(feita?"#4ade8044":"#f59e0b44"),background:feita?"#4ade8010":"#f59e0b10",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:15,fontWeight:700}}>{feita?"✓ ":""}Rotina {key==="manha"?"Manhã":"Noite"}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{rotinaBase.time}</div><div style={{fontSize:10,color:"#64748b",marginTop:4,lineHeight:1.4}}>{rotinaBase.exercises.map(e=>e.name).join(" · ")}</div></div>
        <div style={{fontSize:20}}>{feita?"✅":"▶"}</div>
      </button>;})}
      {rotinaCarga&&<button onClick={()=>abrirDose("carga",rotinaCarga)} style={{width:"100%",padding:16,marginBottom:10,borderRadius:14,border:"1px solid "+(doseFeita("carga")?"#4ade8044":"#ef444444"),background:doseFeita("carga")?"#4ade8010":"#ef444410",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:15,fontWeight:700}}>{doseFeita("carga")?"✓ ":""}{rotinaCarga.title}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{mfDia.diaAlternado?"Dia sugerido":"Fazer mesmo assim"}</div><div style={{fontSize:10,color:"#64748b",marginTop:4,lineHeight:1.4}}>{rotinaCarga.exercises.map(e=>e.name).join(" · ")}</div></div>
        <div style={{fontSize:20}}>{doseFeita("carga")?"✅":"▶"}</div>
      </button>}
      <button onClick={finalizarDia} style={{width:"100%",padding:14,marginTop:6,marginBottom:10,borderRadius:12,border:"1px solid #334155",background:"transparent",color:"#94a3b8",fontSize:13,fontWeight:600,cursor:"pointer"}}>✓ Dia finalizado</button>
      <div style={{marginTop:14,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:16}}>
        <div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Ajustar data (teste)</div>
        <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"center"}}>
          <button onClick={()=>setDias(-1)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"white",cursor:"pointer"}}>-1 dia</button>
          <span style={{fontSize:13,color:"#94a3b8",minWidth:110,textAlign:"center"}}>{diasOffset===0?"Hoje":(diasOffset>0?"+":"")+diasOffset+" dias"}</span>
          <button onClick={()=>setDias(1)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"white",cursor:"pointer"}}>+1 dia</button>
        </div>
      </div>
    </div>;
  }
```

Notas de leitura:
- `mfInfo` (real, calculado antes de `if(!ok)return`) só sobrevive nesse bloco pra 2 coisas: decidir se a macrofase real já passou de 1 (fallback 🚧) e, dentro dele, mostrar `mfInfo.nome`/`hojeReal` — nunca mais é usado pra escolher rotina.
- `mfDia` é uma segunda chamada de `getMacrofase`, mas calculada a partir de `diaCheckList` (o dia efetivo) em vez da data real — é isso que faz o conteúdo do checklist (nome da macrofase mostrado, semana, se tem carga) acompanhar o dia que está sendo fechado, não o dia real do calendário.
- Ordem das 3 checagens importa: pausado (antes de `INICIO_TREINO`) vem primeiro, depois fallback de macrofase (sempre por data real), só depois checklist/descanso — não dá pra inverter sem quebrar a lógica.

- [ ] **Step 2: Rodar e confirmar**

Run: `node scripts/check-macrofase.mjs` → `OK - getMacrofase: todos os casos passaram`
Run: `npx eslint src/App.jsx` → sem erro de sintaxe novo (a contagem de warnings pré-existentes pode mudar, mas não pode haver erro de parse)

- [ ] **Step 3: Teste manual completo no browser**

Run: `npm run dev`

Usando o stepper "Ajustar data (teste)" (ou `localStorage` direto, `{w,s,o}` em `tp7`):

1. Offset que caia antes de 12/08 → tela "⏸️ Pausado até 2026-08-12".
2. Offset pra exatamente 12/08 → checklist normal aparece (chaveDiaBase inicializa sozinho).
3. Marcar só "Manhã", avançar a data de teste pro próximo dia ativo (pular fim de semana se cair nele) sem marcar "Noite": o checklist continua mostrando **12/08** (não o novo dia real), com aviso "⚠ Atrasado desde 2026-08-12".
4. Marcar "Noite" também (fecha 12/08 100%, sem carga nessa semana): avançar mais um dia de teste → agora mostra o próximo dia útil zerado, sem aviso de atraso.
5. Deixar um dia incompleto de propósito e clicar "✓ Dia finalizado": avança pro próximo dia ativo mesmo faltando itens.
6. Avançar a data de teste pra um sábado com o dia anterior 100% completo → tela "😴 Dia de descanso".
7. Conferir que cada card de dose mostra a lista de nomes dos exercícios (separados por "·") sem precisar abrir a rotina.
8. Recarregar a página (F5) em cada um dos pontos acima → `chaveDiaBase` e `rehabLog` persistem via `localStorage` (chaves `tp7dia` e `tp7rehab`).
9. Console do navegador sem erros durante todo o fluxo.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: home com pausado/checklist/descanso, carryover e lista de exercicios inline"
```

---

## Self-Review

- **Cobertura da spec:** portão de início + dias ativos (Task 1, seção 1 do spec), ponteiro de dia + carryover (Task 1 funções puras + Task 2 estado, seção 2 do spec), 3 estados da Home (Task 3 Step 1, seção 3 do spec), lista de exercícios inline (Task 3 Step 1, seção 4 do spec). Todos os 9 casos de teste manual da seção "Testes manuais esperados" do spec estão cobertos no Step 3 da Task 3.
- **Placeholders:** nenhum "TBD"/"implementar depois" — todo código é literal, copiável.
- **Consistência de tipos:** `chaveDiaEfetivo` é sempre `string|null` (ISO date), mesma forma usada em `computeChaveDiaEfetivo`, `diaCompleto`, `isDiaAtivo` em todas as tasks. `rehabLog` mantém o mesmo shape `{[iso]: {manha?, noite?, carga?}}` já existente, só muda a chave usada pra gravar/ler (dia efetivo em vez de dia real).
