import { useState, useEffect, useRef } from "react";
import { avisar } from "../lib/audio.js";
import { color, type as ty } from "../lib/tokens.js";

function ft(s) { if (s == null) return "--:--"; return Math.floor(s / 60) + ":" + (s % 60).toString().padStart(2, "0"); }

// Timer regressivo circular — número grande, legível de longe.
export function CT({ time, total, running, cor }) {
  const r = 74, circ = 2 * Math.PI * r, off = circ * (1 - (total > 0 ? (total - time) / total : 0));
  return (
    <svg viewBox="0 0 180 180" style={{ width: 200, height: 200 }}>
      <circle cx="90" cy="90" r={r} fill="none" stroke={color.surfaceAlt} strokeWidth="10" />
      <circle cx="90" cy="90" r={r} fill="none" stroke={cor || color.success} strokeWidth="10" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.3s" }} />
      <text x="90" y="80" textAnchor="middle" fill={color.text} fontSize={ty.timer} fontWeight="800" fontFamily="ui-monospace, monospace">{ft(time)}</text>
      <text x="90" y="108" textAnchor="middle" fill={color.textDim} fontSize={ty.xs} letterSpacing="1">{running ? "EM ANDAMENTO" : time === 0 ? "CONCLUÍDO" : "PAUSADO"}</text>
    </svg>
  );
}

// Cronômetro progressivo (corridas por distância manual).
export function CU({ time, running }) {
  return (
    <svg viewBox="0 0 180 180" style={{ width: 200, height: 200 }}>
      <circle cx="90" cy="90" r="74" fill="none" stroke={color.surfaceAlt} strokeWidth="10" />
      <circle cx="90" cy="90" r="74" fill="none" stroke={color.corrida} strokeWidth="10" strokeDasharray="9 7" style={{ animation: running ? "spin 8s linear infinite" : "none" }} />
      <text x="90" y="80" textAnchor="middle" fill={color.text} fontSize={ty.timer} fontWeight="800" fontFamily="ui-monospace, monospace">{ft(time)}</text>
      <text x="90" y="108" textAnchor="middle" fill={color.textDim} fontSize={ty.xs} letterSpacing="1">{running ? "CORRENDO..." : "PAUSADO"}</text>
    </svg>
  );
}

export function TabataTimer({ work, rest: restT, rounds, onDone, cor }) {
  const [round, setRound] = useState(1), [phase, setPhase] = useState("work"), [time, setTime] = useState(work), [running, setRunning] = useState(false), [done, setDone] = useState(false);
  const ref = useRef(null);
  const phaseRef = useRef(phase), roundRef = useRef(round);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { roundRef.current = round; }, [round]);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setTime(t => {
        if (t > 1) return t - 1;
        avisar();
        if (phaseRef.current === "work") { setPhase("rest"); return restT; }
        if (roundRef.current < rounds) { setRound(r => r + 1); setPhase("work"); return work; }
        clearInterval(ref.current); setRunning(false); setDone(true); return 0;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running, rounds, work, restT]);

  const btn = (bg, cl) => ({ marginTop: 12, padding: "14px 28px", minHeight: 56, background: bg, color: cl, border: "none", borderRadius: 12, fontSize: ty.md, fontWeight: 700, cursor: "pointer" });
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: ty.base, fontWeight: 700, color: done ? color.success : phase === "work" ? color.pain : color.success, marginBottom: 4 }}>{done ? "COMPLETO" : phase === "work" ? "ESFORÇO" : "DESCANSO"}</div>
      <div style={{ fontSize: ty.sm, color: color.textDim, marginBottom: 8 }}>Round {round}/{rounds}</div>
      <CT time={time} total={phase === "work" ? work : restT} running={running} cor={phase === "work" ? color.pain : color.success} />
      {!running && !done && <button onClick={() => setRunning(true)} style={btn(cor, color.bg)}>{time === work && round === 1 ? "Iniciar Tabata" : "Continuar"}</button>}
      {running && <button onClick={() => setRunning(false)} style={btn(color.surfaceAlt, color.text)}>Pausar</button>}
      {done && <button onClick={onDone} style={btn(color.success, "#0f1115")}>Concluído</button>}
    </div>
  );
}
