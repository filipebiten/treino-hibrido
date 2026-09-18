import { useState, useEffect, useRef } from "react";
import { CT, CU, TabataTimer } from "./Timers.jsx";
import Icon from "./Icon.jsx";
import { avisar } from "../lib/audio.js";
import { pedirWakeLock, liberarWakeLock } from "../lib/wakelock.js";
import { sugestaoCarga } from "../lib/treino.js";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, minHeight: touch.min, display: "flex", alignItems: "center", gap: 6 };

export default function WorkoutScreen({ steps, sessionLabel, cor, grupoCarga, cargas, onRegistrarCarga, onExit, onFinish }) {
  const all = steps, list = all.filter(s => !s.section);
  const [sI, setSI] = useState(0);
  const [cS, setCS] = useState(1);
  const [tmr, setTmr] = useState(() => { const first = list[0]; return first && first.duration && first.type === "timer" ? first.duration : 0; });
  const [tmrOn, setTmrOn] = useState(false);
  const [rst, setRst] = useState(false);
  const [cup, setCup] = useState(0), [cupOn, setCupOn] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [kgInput, setKgInput] = useState("");
  const iR = useRef(null), cR = useRef(null);
  const startRef = useRef(null);
  const volumeRef = useRef(0);

  const step = list[sI], tot = list.length;
  function curSec() { let sec = "", c = 0; for (const s of all) { if (s.section) { sec = s.section; continue; } if (c === sI) return sec; c++; } return sec; }

  useEffect(() => { startRef.current = Date.now(); pedirWakeLock(); return () => liberarWakeLock(); }, []);
  useEffect(() => {
    if (step && step.type === "exercise") { const reg = cargas[step.name]; setKgInput(reg && reg.ultimaKg != null ? String(reg.ultimaKg) : step.startKg != null ? String(step.startKg) : ""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sI]);

  useEffect(() => {
    if (!tmrOn) return;
    iR.current = setInterval(() => {
      setTmr(t => {
        if (t <= 1) { clearInterval(iR.current); avisar(); setTmrOn(false); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iR.current);
  }, [tmrOn]);
  useEffect(() => { if (cupOn) cR.current = setInterval(() => setCup(t => t + 1), 1000); else clearInterval(cR.current); return () => clearInterval(cR.current); }, [cupOn]);

  function registrarCargaExercicio() {
    if (step.type !== "exercise" || !kgInput) return;
    const kg = parseFloat(kgInput);
    if (isNaN(kg)) return;
    const atingiuTopo = typeof step.reps === "number";
    volumeRef.current += kg * (typeof step.reps === "number" ? step.reps : 0) * (step.sets || 1);
    onRegistrarCarga(step.name, kg, atingiuTopo);
  }

  function finalizarTreino() {
    const duracaoSeg = Math.round((Date.now() - startRef.current) / 1000);
    onFinish({ label: sessionLabel, duracaoSeg, volume: Math.round(volumeRef.current) });
  }

  function nxt() {
    setTmrOn(false); setCupOn(false); setRst(false); setCS(1); setCup(0); setShowHow(false);
    if (sI + 1 >= tot) { finalizarTreino(); return; }
    const n = list[sI + 1]; setSI(sI + 1); if (n && n.duration && n.type === "timer") setTmr(n.duration); else setTmr(0);
  }
  function dn() {
    const mx = step.sets || 1;
    if (step.type === "exercise") registrarCargaExercicio();
    if (cS < mx) { if (step.rest) { setRst(true); setTmr(step.rest); setTmrOn(true); } setCS(cS + 1); } else nxt();
  }

  if (!step) return null;
  const sec = curSec();
  const iT = step.type === "timer" || step.type === "timed_exercise";
  const iE = step.type === "exercise" || step.type === "timed_exercise";
  const isTab = step.type === "tabata";
  const mx = step.sets || 1;
  const pc = step.ph === "r" ? color.corrida : step.ph === "fp" || step.ph === "f" ? color.alert : step.ph === "i" ? color.rest : step.ph === "w" ? color.alert : step.ph === "s" ? color.forca : cor;
  const bb = (bg, cl) => ({ minHeight: touch.min, padding: "0 20px", border: "none", borderRadius: radius.md, fontSize: ty.md, fontWeight: 700, cursor: "pointer", background: bg, color: cl, flex: 1 });
  const sugestao = step.type === "exercise" ? sugestaoCarga(cargas, step.name, grupoCarga) : null;

  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.lg, maxWidth: 480, margin: "0 auto" }}>
      <style>{"@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}"}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
        <button onClick={() => { setTmrOn(false); setCupOn(false); onExit(); }} style={backBtn}><Icon name="chevronLeft" size={16} /> Sair</button>
        <span style={{ fontSize: ty.sm, color: color.textFaint }}>{sI + 1}/{tot}</span>
      </div>
      <div style={{ height: 4, background: color.surfaceAlt, borderRadius: 2, marginBottom: space.md, overflow: "hidden" }}><div style={{ height: 4, borderRadius: 2, background: pc, width: (100 * (sI + 1) / tot) + "%", transition: "width 0.3s" }} /></div>
      <div style={{ fontSize: ty.xs, color: pc, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm, textAlign: "center" }}>{sec}</div>
      <div style={{ textAlign: "center", marginBottom: space.sm }}>
        <div style={{ fontSize: ty.xl, fontWeight: 800, marginBottom: 4, lineHeight: 1.3, color: step.name && step.name.startsWith("↑") ? color.success : color.text }}>{step.name}</div>
        {step.detail && <div style={{ fontSize: ty.base, color: color.textDim }}>{step.detail}</div>}
        {step.how && <button onClick={() => setShowHow(!showHow)} style={{ marginTop: 6, minHeight: 36, fontSize: ty.xs, padding: "4px 12px", borderRadius: radius.sm, background: color.surface, color: color.textDim, border: "1px solid " + color.border, cursor: "pointer" }}>{showHow ? "Fechar" : "Como fazer"}</button>}
        {showHow && step.how && <div style={{ marginTop: 8, padding: space.md, background: color.surface, borderRadius: radius.md, fontSize: ty.sm, color: color.textDim, lineHeight: 1.5, textAlign: "left" }}>{step.how}</div>}
      </div>

      {isTab && <TabataTimer work={step.tabataWork} rest={step.tabataRest} rounds={step.tabataRounds} onDone={() => { if (cS < (step.sets || 1)) { if (step.rest) { setRst(true); setTmr(step.rest); setTmrOn(true); } setCS(cS + 1); } else nxt(); }} cor={pc} />}
      {iE && !rst && !isTab && (
        <div style={{ textAlign: "center", marginBottom: space.sm }}>
          <div style={{ display: "inline-flex", gap: 6, marginBottom: 8 }}>{Array.from({ length: mx }, (_, i) => <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: i < cS - 1 ? pc : i === cS - 1 ? pc + "66" : color.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ty.sm, fontWeight: 700, color: i < cS ? "white" : color.textFaint }}>{i < cS - 1 ? <Icon name="check" size={14} /> : i + 1}</div>)}</div>
          <div style={{ fontSize: ty.md, fontWeight: 700 }}>Série {cS}/{mx}{step.reps ? " — " + (typeof step.reps === "string" ? (step.reps.split("-")[cS - 1] || step.reps) : step.reps) + " reps" : ""}</div>
        </div>
      )}
      {step.type === "exercise" && !rst && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: space.sm }}>
          <input type="number" inputMode="decimal" value={kgInput} onChange={e => setKgInput(e.target.value)} placeholder="kg" style={{ width: 90, minHeight: 48, textAlign: "center", fontSize: ty.lg, fontWeight: 700, background: color.surface, border: "1px solid " + color.border, borderRadius: radius.md, color: color.text }} />
          <span style={{ fontSize: ty.sm, color: color.textFaint }}>kg nesta série</span>
        </div>
      )}
      {sugestao && !rst && <div style={{ textAlign: "center", fontSize: ty.xs, color: color.success, marginBottom: space.sm }}>Bateu o topo 2x seguidas — sugestão: {sugestao.kg}kg (+{sugestao.incremento})</div>}
      {rst && <div style={{ textAlign: "center", marginBottom: space.sm }}><div style={{ fontSize: ty.sm, color: color.textDim, marginBottom: 4 }}>DESCANSO</div><CT time={tmr} total={step.rest || 60} running={tmrOn} cor={pc} /></div>}
      {iT && !rst && !iE && step.duration && <div style={{ textAlign: "center", marginBottom: space.sm }}><CT time={tmr} total={step.duration} running={tmrOn} cor={step.isIce ? color.rest : pc} /></div>}
      {iE && step.type === "timed_exercise" && !rst && <div style={{ textAlign: "center", marginBottom: space.sm }}><CT time={tmr} total={step.duration || 60} running={tmrOn} cor={pc} /></div>}
      {step.type === "manual" && (
        <div style={{ textAlign: "center", marginBottom: space.sm }}>
          <CU time={cup} running={cupOn} />
          {!cupOn && <button onClick={() => setCupOn(true)} style={{ marginTop: 12, minHeight: touch.min, padding: "0 28px", background: pc, color: "white", border: "none", borderRadius: radius.md, fontSize: ty.md, fontWeight: 700, cursor: "pointer" }}>{cup === 0 ? "Iniciar" : "Continuar"}</button>}
          {cupOn && <button onClick={() => setCupOn(false)} style={{ marginTop: 12, minHeight: touch.min, padding: "0 28px", background: color.surfaceAlt, color: color.text, border: "none", borderRadius: radius.md, fontSize: ty.md, fontWeight: 700, cursor: "pointer" }}>Pausar</button>}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: space.lg }}>
        {iT && !rst && !iE && step.duration && <>{!tmrOn && tmr > 0 && <button onClick={() => setTmrOn(true)} style={bb(pc, "white")}>{tmr === step.duration ? "Iniciar" : "Continuar"}</button>}{tmrOn && <button onClick={() => setTmrOn(false)} style={bb(color.surfaceAlt, color.text)}>Pausar</button>}{tmr === 0 && !tmrOn && <button onClick={nxt} style={bb(color.success, "#0f1115")}>Próximo</button>}</>}
        {iE && step.type === "timed_exercise" && !rst && <>{!tmrOn && <button onClick={() => { setTmr(step.duration || 60); setTmrOn(true); }} style={bb(pc, "white")}>Série {cS}</button>}{tmrOn && <button onClick={() => setTmrOn(false)} style={bb(color.surfaceAlt, color.text)}>Pausar</button>}{tmr === 0 && !tmrOn && <button onClick={dn} style={bb(color.success, "#0f1115")}>Concluída</button>}</>}
        {step.type === "exercise" && !rst && <button onClick={dn} style={bb(color.success, "#0f1115")}>Série {cS} concluída</button>}
        {rst && <>{tmr > 0 && <button onClick={() => { setRst(false); setTmrOn(false); setTmr(0); }} style={bb(color.surfaceAlt, color.text)}>Pular descanso</button>}{tmr === 0 && <button onClick={() => { setRst(false); setTmr(0); }} style={bb(color.success, "#0f1115")}>Próxima série</button>}</>}
        {step.type === "reps" && !step.sets && <button onClick={nxt} style={bb(color.success, "#0f1115")}>Concluído</button>}
        {step.type === "reps" && step.sets && <button onClick={dn} style={bb(color.success, "#0f1115")}>Série {cS}/{mx}</button>}
        {step.type === "manual" && <button onClick={() => { setCupOn(false); nxt(); }} style={bb(color.success, "#0f1115")}>Concluído</button>}
      </div>
      <button onClick={nxt} style={{ width: "100%", marginTop: 10, minHeight: 44, background: "transparent", color: color.textFaint, border: "none", fontSize: ty.xs, cursor: "pointer" }}>Pular passo</button>
      {sI + 1 < tot && <div style={{ marginTop: space.lg, padding: space.md, background: color.surface, borderRadius: radius.md }}><div style={{ fontSize: ty.micro, color: color.textFaint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>A seguir</div><div style={{ fontSize: ty.sm, color: color.textDim }}>{list[sI + 1] && list[sI + 1].name}</div></div>}
      {step.isTest && <div style={{ marginTop: space.lg, padding: space.md, background: pc + "18", borderRadius: radius.md, border: "1px solid " + pc + "44", textAlign: "center" }}><Icon name="flag" size={20} color={pc} /><div style={{ fontSize: ty.sm, color: pc, fontWeight: 700, marginTop: 4 }}>DIA DE TESTE</div><div style={{ fontSize: ty.xs, color: color.textDim, marginTop: 4 }}>Não acelere. Completar é o objetivo.</div></div>}
    </div>
  );
}
