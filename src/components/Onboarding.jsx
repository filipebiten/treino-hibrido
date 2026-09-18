import { useState } from "react";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

const SEMANAS_OPCOES = [
  { v: "0", l: "Treinei essa semana" },
  { v: "1-2", l: "1-2 semanas" },
  { v: "3-6", l: "3-6 semanas" },
  { v: "+6", l: "Mais de 6 semanas" },
];

const btnBase = { minHeight: touch.min, borderRadius: radius.lg, border: "1px solid " + color.border, background: color.surface, color: color.text, fontSize: ty.md, fontWeight: 600, cursor: "pointer", width: "100%" };

export default function Onboarding({ onFinish, recalibrando }) {
  const [step, setStep] = useState(0);
  const [dor, setDor] = useState(null);
  const [semanasParado, setSemanasParado] = useState(null);
  const [peso, setPeso] = useState("");

  const wrap = { background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.xl + "px " + space.lg + "px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", justifyContent: "center" };
  const title = { fontSize: ty.xl, fontWeight: 800, marginBottom: space.sm, textAlign: "center" };
  const sub = { fontSize: ty.sm, color: color.textDim, textAlign: "center", marginBottom: space.xl };

  if (step === 0) {
    return (
      <div style={wrap}>
        <div style={title}>{recalibrando ? "Recalibrar" : "Antes de começar"}</div>
        <div style={sub}>Dor no calcanhar ao dar os primeiros passos da manhã?</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: space.sm }}>
          {Array.from({ length: 11 }, (_, i) => i).map(n => (
            <button key={n} onClick={() => setDor(n)} style={{ ...btnBase, minHeight: 48, padding: 0, border: dor === n ? "2px solid " + (n >= 5 ? color.pain : n >= 3 ? color.alert : color.success) : btnBase.border, background: dor === n ? (n >= 5 ? color.pain : n >= 3 ? color.alert : color.success) + "22" : color.surface, fontWeight: 800 }}>{n}</button>
          ))}
        </div>
        <div style={{ fontSize: ty.xs, color: color.textFaint, textAlign: "center", marginTop: space.sm }}>0 = sem dor · 10 = pior dor possível</div>
        <button disabled={dor === null} onClick={() => setStep(1)} style={{ ...btnBase, marginTop: space.xl, background: dor === null ? color.surface : color.success, color: dor === null ? color.textFaint : "#0f1115", fontWeight: 800 }}>Continuar</button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div style={wrap}>
        <div style={title}>Tempo parado</div>
        <div style={sub}>Há quantas semanas você não treina?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: space.sm }}>
          {SEMANAS_OPCOES.map(o => (
            <button key={o.v} onClick={() => setSemanasParado(o.v)} style={{ ...btnBase, border: semanasParado === o.v ? "2px solid " + color.success : btnBase.border, background: semanasParado === o.v ? color.success + "1a" : color.surface }}>{o.l}</button>
          ))}
        </div>
        <button disabled={!semanasParado} onClick={() => setStep(2)} style={{ ...btnBase, marginTop: space.xl, background: !semanasParado ? color.surface : color.success, color: !semanasParado ? color.textFaint : "#0f1115", fontWeight: 800 }}>Continuar</button>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={title}>Peso atual</div>
      <div style={sub}>Em kg</div>
      <input type="number" inputMode="decimal" value={peso} onChange={e => setPeso(e.target.value)} placeholder="89" style={{ ...btnBase, textAlign: "center", fontSize: ty.hero, fontWeight: 800, padding: space.md }} />
      <button disabled={!peso} onClick={() => onFinish({ dor, semanasParado, peso: parseFloat(peso) })} style={{ ...btnBase, marginTop: space.xl, background: !peso ? color.surface : color.success, color: !peso ? color.textFaint : "#0f1115", fontWeight: 800 }}>{recalibrando ? "Recalibrar" : "Começar"}</button>
    </div>
  );
}
