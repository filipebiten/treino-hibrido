import { useState, useEffect, useRef } from "react";
import { CT } from "./Timers.jsx";
import Icon from "./Icon.jsx";
import PainGraph from "./PainGraph.jsx";
import { avisar } from "../lib/audio.js";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";
import { formatarRestante } from "../lib/progressao.js";

const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 6, minHeight: touch.min };

export default function RehabScreen({ onBack, rotinas, onRoutineComplete, rathleff, dorLog, pesoLog, hojeISO }) {
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [tab, setTab] = useState("rotinas");
  const [sI, setSI] = useState(0);
  const [tmr, setTmr] = useState(0);
  const [tmrOn, setTmrOn] = useState(false);
  const [cS, setCS] = useState(1);
  const [rst, setRst] = useState(false);
  const iR = useRef(null);

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

  function abrir(key, rotina) { setActiveKey(key); setActiveRoutine(rotina); setSI(0); setCS(1); setTmr(0); setTmrOn(false); setRst(false); const ex = rotina.exercises[0]; if (ex && ex.duration && ex.type === "timer") setTmr(ex.duration); }

  if (!activeRoutine) {
    return (
      <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.xl + "px " + space.lg + "px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg }}>
          <button onClick={onBack} style={backBtn}><Icon name="chevronLeft" size={16} /> Voltar</button>
          <div style={{ display: "flex", gap: space.sm }}>
            <button onClick={() => setTab("rotinas")} style={{ ...backBtn, color: tab === "rotinas" ? color.text : color.textFaint, fontWeight: tab === "rotinas" ? 700 : 400 }}>Rotinas</button>
            <button onClick={() => setTab("historico")} style={{ ...backBtn, color: tab === "historico" ? color.text : color.textFaint, fontWeight: tab === "historico" ? 700 : 400 }}><Icon name="chart" size={15} /> Histórico</button>
          </div>
        </div>

        {tab === "historico" ? (
          <div>
            <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm }}>Dor matinal — 30 dias</div>
            <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.xl }}><PainGraph dorLog={dorLog} hojeISO={hojeISO} /></div>
            <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm }}>Peso corporal</div>
            <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md }}>
              {Object.keys(pesoLog).length === 0
                ? <div style={{ fontSize: ty.xs, color: color.textFaint }}>Sem registros ainda.</div>
                : Object.entries(pesoLog).sort((a, b) => a[0] < b[0] ? 1 : -1).slice(0, 10).map(([iso, kg]) => (
                  <div key={iso} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + color.border, fontSize: ty.sm }}>
                    <span style={{ color: color.textDim }}>{iso}</span><span style={{ fontWeight: 700 }}>{kg}kg</span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: "center", marginBottom: space.xl }}>
              <Icon name="foot" size={34} color={color.alert} />
              <h1 style={{ fontSize: ty.display, fontWeight: 800, marginTop: 8 }}>Reabilitação</h1>
              <div style={{ fontSize: ty.xs, color: color.textDim, marginTop: 4 }}>Protocolo baseado em evidência científica</div>
            </div>
            {rotinas.map(r => {
              const locked = r.key === "carga" && rathleff && !rathleff.liberado;
              return (
                <button key={r.key} disabled={locked} onClick={() => !locked && abrir(r.key, r.rotina)} style={{ width: "100%", minHeight: touch.min, padding: space.lg, marginBottom: space.sm, borderRadius: radius.lg, border: "1px solid " + color.border, background: locked ? color.surfaceAlt : color.surface, cursor: locked ? "default" : "pointer", textAlign: "left", opacity: locked ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: ty.md, fontWeight: 800, color: color.text }}>{r.rotina.title}</div>
                      <div style={{ fontSize: ty.xs, color: color.textDim, marginTop: 2 }}>{r.rotina.subtitle}</div>
                    </div>
                    {locked
                      ? <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ty.xs, color: color.textFaint }}><Icon name="lock" size={14} />{formatarRestante(rathleff.restanteMs)}</div>
                      : <div style={{ fontSize: ty.xs, color: color.textFaint, background: color.surfaceAlt, padding: "4px 10px", borderRadius: radius.sm }}>{r.rotina.time}</div>}
                  </div>
                </button>
              );
            })}
            <div style={{ marginTop: space.lg, padding: space.md, background: color.surface, borderRadius: radius.lg, border: "1px solid " + color.border }}>
              <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.pain, marginBottom: 6 }}>O que NÃO fazer</div>
              <div style={{ fontSize: ty.xs, color: color.textDim, lineHeight: 1.6 }}>
                Correr, saltar, burpees, polichinelos com dor ativa · andar descalço em piso duro · alongar agressivamente com pé "frio" · massagem forte no calcanhar
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const routine = activeRoutine;
  const exercises = routine.exercises;
  const step = exercises[sI];
  const tot = exercises.length;
  const mx = step.sets || 1;
  const isT = step.type === "timer" || step.type === "timed_exercise";
  const isE = step.type === "exercise" || step.type === "timed_exercise";

  function nxt() {
    setTmrOn(false); setRst(false); setCS(1);
    if (sI + 1 >= tot) { if (onRoutineComplete) onRoutineComplete(activeKey); setActiveRoutine(null); return; }
    const n = exercises[sI + 1]; setSI(sI + 1); if (n && n.duration && n.type === "timer") setTmr(n.duration); else setTmr(0);
  }
  function dn() { if (cS < mx) { if (step.rest) { setRst(true); setTmr(step.rest); setTmrOn(true); } setCS(cS + 1); } else nxt(); }
  const bb = (bg, cl) => ({ minHeight: touch.min, padding: "0 20px", border: "none", borderRadius: radius.md, fontSize: ty.md, fontWeight: 700, cursor: "pointer", background: bg, color: cl, flex: 1 });

  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.lg, maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
        <button onClick={() => { setTmrOn(false); setActiveRoutine(null); }} style={backBtn}><Icon name="chevronLeft" size={16} /> Sair</button>
        <div style={{ fontSize: ty.sm, color: color.textFaint }}>{sI + 1}/{tot}</div>
      </div>
      <div style={{ height: 4, background: color.surfaceAlt, borderRadius: 2, marginBottom: space.md, overflow: "hidden" }}><div style={{ height: 4, borderRadius: 2, background: routine.color, width: "100%", transform: "scaleX(" + ((sI + 1) / tot) + ")", transformOrigin: "left", transition: "transform 0.3s" }} /></div>
      <div style={{ fontSize: ty.xs, color: routine.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm, textAlign: "center" }}>{routine.title}</div>
      <div style={{ textAlign: "center", marginBottom: space.md }}>
        <h1 style={{ fontSize: ty.xl, fontWeight: 800, marginBottom: 4, lineHeight: 1.3 }}>{step.name}</h1>
        {step.detail && <div style={{ fontSize: ty.base, color: color.textDim }}>{step.detail}</div>}
        {step.sets && step.reps && <div style={{ fontSize: ty.base, color: routine.color, marginTop: 4 }}>{step.sets}x{step.reps}</div>}
      </div>

      {step.how && (
        <div style={{ padding: space.md, background: color.surface, borderRadius: radius.lg, marginBottom: space.md, border: "1px solid " + color.border }}>
          <div style={{ fontSize: ty.xs, fontWeight: 700, color: color.alert, marginBottom: 6 }}>Como fazer</div>
          <div style={{ fontSize: ty.sm, color: color.textDim, lineHeight: 1.6 }}>{step.how}</div>
        </div>
      )}

      {isE && !rst && (
        <div style={{ textAlign: "center", marginBottom: space.sm }}>
          <div style={{ display: "inline-flex", gap: 6, marginBottom: 8 }}>{Array.from({ length: mx }, (_, i) => <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: i < cS - 1 ? routine.color : i === cS - 1 ? routine.color + "66" : color.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ty.sm, fontWeight: 700, color: i < cS - 1 ? color.bg : i === cS - 1 ? color.text : color.textFaint }}>{i < cS - 1 ? <Icon name="check" size={14} /> : i + 1}</div>)}</div>
          <div style={{ fontSize: ty.md, fontWeight: 700 }}>Série {cS}/{mx}{step.reps ? " — " + (typeof step.reps === "string" ? (step.reps.split("-")[cS - 1] || step.reps) : step.reps) + " reps" : ""}</div>
        </div>
      )}
      {rst && <div style={{ textAlign: "center", marginBottom: space.sm }}><div style={{ fontSize: ty.sm, color: color.textDim, marginBottom: 4 }}>DESCANSO</div><CT time={tmr} total={step.rest || 60} running={tmrOn} cor={routine.color} /></div>}
      {isT && !rst && !isE && step.duration && <div style={{ textAlign: "center", marginBottom: space.sm }}><CT time={tmr} total={step.duration} running={tmrOn} cor={step.isIce ? color.rest : routine.color} /></div>}
      {isE && step.type === "timed_exercise" && !rst && <div style={{ textAlign: "center", marginBottom: space.sm }}><CT time={tmr} total={step.duration || 60} running={tmrOn} cor={routine.color} /></div>}

      <div style={{ display: "flex", gap: 10, marginTop: space.lg }}>
        {isT && !rst && !isE && step.duration && <>{!tmrOn && tmr > 0 && <button onClick={() => setTmrOn(true)} style={bb(routine.color, color.bg)}>{tmr === step.duration ? "Iniciar" : "Continuar"}</button>}{tmrOn && <button onClick={() => setTmrOn(false)} style={bb(color.surfaceAlt, color.text)}>Pausar</button>}{tmr === 0 && !tmrOn && <button onClick={nxt} style={bb(color.success, "#0f1115")}>Próximo</button>}</>}
        {isE && step.type === "timed_exercise" && !rst && <>{!tmrOn && <button onClick={() => { setTmr(step.duration || 60); setTmrOn(true); }} style={bb(routine.color, color.bg)}>Série {cS}</button>}{tmrOn && <button onClick={() => setTmrOn(false)} style={bb(color.surfaceAlt, color.text)}>Pausar</button>}{tmr === 0 && !tmrOn && <button onClick={dn} style={bb(color.success, "#0f1115")}>Concluída</button>}</>}
        {isE && step.type === "exercise" && !rst && <button onClick={dn} style={bb(color.success, "#0f1115")}>Série {cS} concluída</button>}
        {rst && <>{tmr > 0 && <button onClick={() => { setRst(false); setTmrOn(false); setTmr(0); }} style={bb(color.surfaceAlt, color.text)}>Pular descanso</button>}{tmr === 0 && <button onClick={() => { setRst(false); setTmr(0); }} style={bb(color.success, "#0f1115")}>Próxima série</button>}</>}
        {step.type === "reps" && !step.sets && <button onClick={nxt} style={bb(color.success, "#0f1115")}>Concluído</button>}
        {step.type === "reps" && step.sets && <button onClick={dn} style={bb(color.success, "#0f1115")}>Série {cS}/{mx}</button>}
      </div>
      <button onClick={nxt} style={{ width: "100%", marginTop: 10, minHeight: 44, background: "transparent", color: color.textFaint, border: "none", fontSize: ty.xs, cursor: "pointer" }}>Pular passo</button>
    </div>
  );
}
