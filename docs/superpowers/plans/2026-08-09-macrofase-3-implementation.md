# Macrofase 3 — Retorno à Corrida — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ativar macrofase 3 (06/10-02/11/2026): corrida walk/run progressiva, musculação transiciona Fase 1→2, rehab reduz pra 1x/dia.

**Architecture:** Toda a infraestrutura de dispatch já existe (do plano da macrofase 2): `mfInfo` no topo do componente, `sessaoDados`/`sessaoDesc`/`indicesDisponiveis` como camada de seleção, `buildMuscSession`/`getMuscPhaseIndex` já cobrem macrofase 3 pra musculação (`getMuscPhaseIndex(3,semanaIdx)` já retorna 0 pras semanas 0-1 e 1 pras semanas 2-3 — nenhum trabalho novo aí). `indicesDisponiveis(3)` já retorna os 6 índices completos (só a macrofase 2 tinha grid reduzido). Falta só: (1) o motor de corrida walk/run (dados + função pura), plugado em `sessaoDados`/`sessaoDesc`; (2) a UI da Home pra macrofase 3, espelhando o padrão já usado pra macrofase 2.

**Tech Stack:** Mesma stack. TDD via `scripts/check-macrofase.mjs`.

## Global Constraints

- Tudo em `src/App.jsx`.
- Sem dependências novas.
- `WorkoutScreen`/`RehabScreen`/`PVList` NÃO mudam — genéricos o suficiente.
- `sessaoDados`/`sessaoDesc` (já existem, macrofase 2) ganham um `else if(macrofase===3)` novo — não reescrever a lógica de macrofase 2 dentro delas.
- `chaveDiaEfetivo`/carryover continuam exclusivos do checklist macrofase 0-1 — não tocar aqui.

---

## Task 1: Motor de corrida walk/run + rehab reduzido macrofase 3

**Files:**
- Modify: `scripts/check-macrofase.mjs`
- Modify: `src/App.jsx` (insere bloco novo logo depois do fechamento de `sessaoDesc` — mesma região do motor de sessão da macrofase 2 — e depois estende `sessaoDados`/`sessaoDesc` em si; insere dados de rehab na região `REHAB REDUZIDO — MACROFASE 2`, criando uma seção irmã `MACROFASE 3` logo depois)

**Interfaces:**
- Consumes: `getMuscPhaseIndex`, `buildMuscSession`, `indicesDisponiveis` (já existem).
- Produces:
  - `export function mkWR(ciclos, corridaSeg, caminhadaSeg): Array`
  - `export function buildRunM3(semanaIdx): Array`
  - `export function grdM3(semanaIdx): string`
  - `export function getRehabM3(diaAlternado): Array<RehabRoutine>`
  - `sessaoDados`/`sessaoDesc` estendidas com um branch `macrofase===3`.

- [ ] **Step 1: Adicionar asserções (vai falhar)**

Estenda a linha de import (adicione `mkWR, buildRunM3, grdM3, getRehabM3` à lista já existente) e adicione ao final do script, antes de `console.log(...)`:

```js
// mkWR
const wr = mkWR(2, 60, 120);
assert.strictEqual(wr.length, 4); // 2 ciclos = 4 steps (corrida+caminhada cada)
assert.strictEqual(wr[0].name, "Corrida 1");
assert.strictEqual(wr[0].duration, 60);
assert.strictEqual(wr[1].name, "Caminhada 1");
assert.strictEqual(wr[1].duration, 120);

// buildRunM3 — semana 0 (1min/2min x8) vs semana 3 (5min/1min x5, última entrada — clampada)
const rm3s0 = buildRunM3(0);
const secaoWR_s0 = rm3s0.find(s => s.section && s.section.includes("WALK/RUN"));
assert.ok(secaoWR_s0.section.includes("1min corrida"));
const rm3s3 = buildRunM3(3);
const secaoWR_s3 = rm3s3.find(s => s.section && s.section.includes("WALK/RUN"));
assert.ok(secaoWR_s3.section.includes("5min corrida"));
assert.strictEqual(buildRunM3(99).length, rm3s3.length); // clamp na última semana

// grdM3
assert.strictEqual(grdM3(0), "~5km");
assert.strictEqual(grdM3(3), "~8km");

// getRehabM3
const m3semCarga = getRehabM3(false);
assert.strictEqual(m3semCarga.length, 1);
assert.strictEqual(m3semCarga[0].id, "m3-base");
const m3comCarga = getRehabM3(true);
assert.strictEqual(m3comCarga.length, 2);
assert.strictEqual(m3comCarga[1].id, "m3-carga");
assert.strictEqual(m3comCarga[1].exercises[0].reps, 8);

// sessaoDados/sessaoDesc — macrofase 3 roteia corrida pros índices ímpares
const sd3_1 = sessaoDados(3, 0, 1, 2);
assert.ok(sd3_1.some(s => s.section && s.section.includes("WALK/RUN")));
assert.strictEqual(sessaoDesc(3, 0, 1, 2), "~5km");
// musculação continua igual (já coberto pela macrofase 2, só confirma que macrofase 3 não quebrou)
assert.ok(sessaoDados(3, 0, 0, 2).some(s => s.section && s.section.startsWith("💪")));
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `node scripts/check-macrofase.mjs`
Expected: `TypeError: mkWR is not a function`

- [ ] **Step 3: Implementar em `src/App.jsx`**

Insira este bloco logo depois do fechamento de `sessaoDesc` (a função que hoje termina com `return "";\n}` na região "MOTOR DE SESSÃO POR MACROFASE"):

```js

// ══════════════════════ MOTOR DE CORRIDA — MACROFASE 3 (WALK/RUN) ══════════════════════
export function mkWR(ciclos, corridaSeg, caminhadaSeg) {
  const s = [];
  for (let i = 1; i <= ciclos; i++) {
    s.push({ name: "Corrida " + i, duration: corridaSeg, type: "timer", ph: "r", how: "Ritmo Z1-Z2 confortável — consegue conversar sem ofegar." });
    s.push({ name: "Caminhada " + i, duration: caminhadaSeg, type: "timer", ph: "i", how: "Recuperação ativa, caminhada." });
  }
  return s;
}

const RUN_M3 = [
  { nome: "1min corrida / 2min caminhada", ciclos: 8, corrida: 60, caminhada: 120, volumeKm: 5 },
  { nome: "2min corrida / 2min caminhada", ciclos: 6, corrida: 120, caminhada: 120, volumeKm: 6 },
  { nome: "3min corrida / 1min caminhada", ciclos: 6, corrida: 180, caminhada: 60, volumeKm: 7 },
  { nome: "5min corrida / 1min caminhada", ciclos: 5, corrida: 300, caminhada: 60, volumeKm: 8 },
];

export function buildRunM3(semanaIdx) {
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

export function grdM3(semanaIdx) { const cfg = RUN_M3[Math.min(semanaIdx, RUN_M3.length - 1)]; return "~" + cfg.volumeKm + "km"; }
```

Depois, troque a definição de `sessaoDados`/`sessaoDesc` (a versão atual, que já cobre macrofase<2 e macrofase>=2 musculação):

```js
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

por:

```js
function sessaoDados(macrofase, semanaIdx, ses, wk) {
  if (macrofase < 2) return bw(wk, ses);
  if (ses === 0) return buildMuscSession(MA, macrofase, semanaIdx);
  if (ses === 2) return buildMuscSession(MB, macrofase, semanaIdx);
  if (ses === 4) return buildMuscSession(MC, macrofase, semanaIdx);
  if (macrofase === 3) return buildRunM3(semanaIdx);
  return [];
}

function sessaoDesc(macrofase, semanaIdx, ses, wk) {
  if (macrofase < 2) return grd(wk, ses);
  if (macrofase === 3 && (ses === 1 || ses === 3 || ses === 5)) return grdM3(semanaIdx);
  return "";
}
```

Nota: `mkWR`/`buildRunM3`/`grdM3` precisam estar definidos ANTES de `sessaoDados` (que agora os chama) — a ordem do bloco acima (motor de corrida primeiro, depois a troca de `sessaoDados`/`sessaoDesc`) já garante isso.

Por fim, insira o bloco de rehab reduzido macrofase 3 logo depois de `getRehabM2`/`TESTES_CAMINHADA` (mesma região "REHAB REDUZIDO — MACROFASE 2"):

```js

// ══════════════════════ REHAB REDUZIDO — MACROFASE 3 ══════════════════════
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

export function getRehabM3(diaAlternado) { return diaAlternado ? [REHAB_M3_BASE, REHAB_M3_CARGA] : [REHAB_M3_BASE]; }
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `node scripts/check-macrofase.mjs`
Expected: `OK - getMacrofase: todos os casos passaram`

- [ ] **Step 5: Commit**

```bash
git add scripts/check-macrofase.mjs src/App.jsx
git commit -m "feat: motor de corrida walk/run e rehab reduzido macrofase 3"
```

---

## Task 2: Home reconectada pra macrofase 3

**Files:**
- Modify: `src/App.jsx` — troca `if(mfInfo.macrofase>2){...}` (fallback 🚧, hoje cobre macrofase 3 e 4) por `if(mfInfo.macrofase===3){...}` (UI real) + `if(mfInfo.macrofase>3){...}` (fallback, cobre só macrofase 4 agora); estende a linha `if(scr==="rehab") return<RehabScreen ... routines={...}/>;` pra incluir macrofase 3.

**Interfaces:**
- Consumes: `buildRunM3`, `grdM3` (via `sessaoDados`/`sessaoDesc`, Task 1), `getRehabM3` (Task 1).
- Produces: Home funcional pra macrofase 3 (grid de 6, card "próximo treino", iniciar treino, banner rehab, banner "regra inegociável", botão "Pular corrida leve").

- [ ] **Step 1: Trocar o fallback 🚧 (macrofase>2 vira macrofase===3 real + macrofase>3 fallback)**

Troque:

```js
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

por:

```js
    if(mfInfo.macrofase===3){
      const descM3=sessaoDesc(mfInfo.macrofase,mfInfo.semanaIdx,sesEf,wk);
      const idxM3=indicesDisponiveis(mfInfo.macrofase);
      const rotinasRehabM3=getRehabM3(mfInfo.diaAlternado);
      return<div style={{background:"linear-gradient(180deg,#0f0f1a,#1a1a2e)",color:"white",minHeight:"100vh",fontFamily:"system-ui",padding:"20px 16px",maxWidth:480,margin:"0 auto"}}><style>{G}</style>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:12,color:"#94a3b8",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Treino Híbrido</div>
          <div style={{fontSize:22,fontWeight:800}}>{mfInfo.nome}</div>
          <div style={{fontSize:12,color:"#64748b",marginTop:4}}>Semana {mfInfo.semanaIdx+1}/4 — {hojeReal}</div>
          <div style={{fontSize:10,color:"#64748b",marginTop:4}}>🏋️ {PHASE_NAMES[getMuscPhaseIndex(mfInfo.macrofase,mfInfo.semanaIdx)]}</div>
        </div>
        <div style={{padding:14,background:"#f59e0b15",border:"1px solid #f59e0b44",borderRadius:12,marginBottom:16,fontSize:12,color:"#fbbf24",lineHeight:1.5}}>⚠️ Regra inegociável: se a dor matinal piorar no dia seguinte à corrida, volte uma etapa. Sem exceção.</div>
        <button onClick={()=>setScr("rehab")} style={{width:"100%",padding:"14px 16px",marginBottom:16,borderRadius:14,border:"1px solid #ef444444",background:"linear-gradient(135deg,#ef444415,#ef444405)",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:28}}>🦶</div>
          <div><div style={{fontSize:14,fontWeight:700,color:"#ef4444"}}>{rotinasRehabM3[0].title}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Manutenção — toque a qualquer momento</div></div>
        </button>
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:4,marginBottom:16}}>
          <div style={{display:"flex",gap:2}}>{idxM3.map(i=><div key={i} style={{flex:1,height:6,borderRadius:3,background:i<sesEf?SCO[i]:i===sesEf?SCO[i]+"99":"#1a1a2e",animation:i===sesEf?"pulse 2s infinite":"none"}}/>)}</div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"6px 2px 2px",fontSize:9,color:"#64748b"}}>{SS.map((l,i)=><span key={i} style={{flex:1,textAlign:"center",fontWeight:i===sesEf?700:400,color:i===sesEf?"white":"#64748b"}}>{l}</span>)}</div>
        </div>
        <div style={{background:"linear-gradient(135deg,"+SCO[sesEf]+"22,"+SCO[sesEf]+"08)",border:"1px solid "+SCO[sesEf]+"44",borderRadius:20,padding:28,textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:56,marginBottom:8}}>{SIC[sesEf]}</div>
          <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Próximo treino</div>
          <div style={{fontSize:22,fontWeight:800,marginBottom:6}}>{SL[sesEf]}</div>
          {descM3&&<div style={{fontSize:14,color:SCO[sesEf],fontWeight:600,background:SCO[sesEf]+"18",borderRadius:8,padding:"6px 14px",display:"inline-block"}}>{descM3}</div>}
        </div>
        <button onClick={()=>startAny(sesEf)} style={{width:"100%",padding:"16px 0",fontSize:17,fontWeight:800,background:"linear-gradient(135deg,"+SCO[sesEf]+","+SCO[sesEf]+"cc)",color:"white",border:"none",borderRadius:14,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>INICIAR TREINO</button>
        {sesEf===3&&<button onClick={adv} style={{width:"100%",padding:"12px 0",fontSize:13,fontWeight:600,background:"transparent",color:"#94a3b8",border:"1px solid #334155",borderRadius:12,cursor:"pointer",marginBottom:6}}>Pular corrida leve</button>}
        <button onClick={adv} style={{width:"100%",padding:"10px 0",fontSize:12,background:"transparent",color:"#475569",border:"none",cursor:"pointer"}}>Pular treino →</button>
        <div style={{marginTop:24}}><div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Treinos — toque para ver ou iniciar</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{idxM3.map(i=><button key={i} onClick={()=>{setPvS(i);setScr("preview")}} style={{padding:"12px 6px",borderRadius:12,border:i===sesEf?"2px solid "+SCO[i]:"1px solid #1e293b",background:i===sesEf?SCO[i]+"15":"rgba(255,255,255,0.02)",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:22,marginBottom:2}}>{SIC[i]}</div><div style={{fontSize:10,color:i===sesEf?SCO[i]:"#94a3b8",fontWeight:i===sesEf?700:500}}>{SL[i].replace("Musculação ","").replace("Corrida ","")}</div>{i===sesEf&&<div style={{fontSize:8,color:SCO[i],marginTop:2,fontWeight:700}}>PRÓXIMO</div>}</button>)}</div></div>
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
    if(mfInfo.macrofase>3){
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

Nota: o grid usa `idxM3.map` mas o rótulo embaixo (`SS[i]`) usa `SS.map` direto (não filtrado) — igual ao padrão original de 6 sessões (o strip de progresso mostra todos os 6 rótulos "A/🏃/B/🏃/C/🏃‍♂️" sempre, já que macrofase 3 usa todos os 6 índices; diferente da macrofase 2 que precisou filtrar `idxM2.map` porque só tinha 3). Se preferir consistência visual com a macrofase 2 (usar `idxM3.map` também no strip de rótulos), pode trocar — mas como `idxM3` aqui é sempre `[0,1,2,3,4,5]` (idêntico a `SS.length`), o resultado visual é o mesmo.

- [ ] **Step 2: Estender a rota `scr==="rehab"` pra incluir macrofase 3**

Troque:

```js
  if(scr==="rehab") return<RehabScreen onBack={()=>setScr("home")} routines={mfInfo.macrofase===2?getRehabM2(mfInfo.diaAlternado):REHAB_ROUTINES}/>;
```

por:

```js
  if(scr==="rehab") return<RehabScreen onBack={()=>setScr("home")} routines={mfInfo.macrofase===2?getRehabM2(mfInfo.diaAlternado):mfInfo.macrofase===3?getRehabM3(mfInfo.diaAlternado):REHAB_ROUTINES}/>;
```

- [ ] **Step 3: Rodar e confirmar**

Run: `node scripts/check-macrofase.mjs` → OK, sem regressão.
Run: `npx eslint src/App.jsx` → sem erro de sintaxe novo.

- [ ] **Step 4: Verificação manual completa no browser**

Run: `npm run dev`. Ajuste `localStorage.tp7.o` pra uma data dentro de 06/10-02/11/2026.

1. Home mostra "Retorno à Corrida", banner "⚠️ Regra inegociável", grid de 6 (A/Qualidade/B/Leve/C/Longa), card "Próximo treino".
2. Tocar uma sessão de corrida (índice 1, 3 ou 5) no grid → preview mostra os intervalos walk/run corretos pra semana (ex.: semana 1 = "1min corrida / 2min caminhada" x8).
3. "INICIAR ESTE TREINO" → `WorkoutScreen` roda os intervalos com timer (corrida/caminhada alternando), gelo pós-corrida no final.
4. Sessão de musculação (índice 0/2/4) → preview mostra Fase 1 (semanas 1-2) ou Fase 2 com exercícios "↑ NOVO" (semanas 3-4) — confirma a transição de fase.
5. Botão "Pular corrida leve" aparece só quando `sesEf===3`.
6. Botão de rehab abre `getRehabM3` (1 rotina reduzida, ou 2 com carga em dia alternado — 5x8 Rathleff).
7. Avançar a data de teste pra depois de 02/11/2026 (macrofase 4) → volta a mostrar 🚧 (macrofase 4 ainda não implementada).
8. Console sem erros em todo o fluxo.
9. Resetar `localStorage` de teste antes de terminar (voltar offset a 0).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: home reconectada para macrofase 3 (retorno a corrida)"
```

---

## Self-Review

- **Cobertura da spec:** motor walk/run + rehab reduzido (Task 1), Home com regra inegociável + grid completo + rehab banner (Task 2). Musculação Fase 1→2 já coberta pelo motor existente (`getMuscPhaseIndex`), nenhum trabalho novo necessário — confirmado no design spec.
- **Placeholders:** nenhum.
- **Consistência de tipos:** `buildRunM3`/`grdM3` seguem a mesma assinatura `(semanaIdx)` de `getMuscPhaseIndex`. `getRehabM3` mesmo shape de `getRehabM2`/`getRehabForMacrofase`. `sessaoDados`/`sessaoDesc` recebem sempre `(macrofase, semanaIdx, ses, wk)` — a extensão desta task só adiciona um `if`, não muda a assinatura nem os branches já existentes (macrofase<2, musculação macrofase>=2).
