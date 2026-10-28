import Icon from "./Icon.jsx";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

function ft(s) { if (s == null) return "--:--"; return Math.floor(s / 60) + ":" + (s % 60).toString().padStart(2, "0"); }

export default function Preview({ steps, label, cor, icon, resumo, onBack, onIniciar, aviso }) {
  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.lg, maxWidth: 480, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, minHeight: touch.min, display: "flex", alignItems: "center", gap: 6, marginBottom: space.sm }}><Icon name="chevronLeft" size={16} /> Voltar</button>
      <div style={{ textAlign: "center", marginBottom: space.md }}>
        <Icon name={icon} size={30} color={cor} />
        <h1 style={{ fontSize: ty.xl, fontWeight: 800, marginTop: 6 }}>{label}</h1>
        {resumo && <div style={{ fontSize: ty.sm, color: cor, fontWeight: 600, marginTop: 6, background: cor + "18", borderRadius: radius.sm, padding: "4px 12px", display: "inline-block" }}>{resumo}</div>}
      </div>
      {aviso && aviso.bloqueado && (
        <div style={{ padding: space.md, borderRadius: radius.md, border: "1px solid " + color.alert + "88", background: color.alert + "14", marginBottom: space.md, fontSize: ty.sm, color: color.alert, lineHeight: 1.5 }}>{aviso.motivo}</div>
      )}
      {aviso && !aviso.bloqueado && aviso.sugestaoForte && (
        <div style={{ padding: space.md, borderRadius: radius.md, border: "1px solid " + color.pain + "66", background: color.pain + "0e", marginBottom: space.md, fontSize: ty.xs, color: color.textDim, lineHeight: 1.5 }}>{aviso.sugestaoForte}</div>
      )}
      {aviso && !aviso.bloqueado && aviso.info && (
        <div style={{ padding: space.md, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surface, marginBottom: space.md, fontSize: ty.xs, color: color.textDim, lineHeight: 1.5 }}>{aviso.info}</div>
      )}
      <div tabIndex={0} role="region" aria-label="Exercícios do treino" style={{ maxHeight: "55vh", overflowY: "auto" }}>
        {steps.map((s, i) => s.section
          ? <div key={i} style={{ fontSize: ty.xs, fontWeight: 700, color: color.textFaint, textTransform: "uppercase", letterSpacing: 1, marginTop: 14, marginBottom: 6 }}>{s.section}</div>
          : <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: color.surface, borderRadius: radius.sm, marginBottom: 3 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: ty.sm, fontWeight: 600, color: s.name && s.name.startsWith("↑") ? color.success : color.text }}>{s.name}</div>
                {s.detail && <div style={{ fontSize: ty.xs, color: color.textFaint }}>{s.detail}</div>}
              </div>
              <div style={{ fontSize: ty.xs, color: color.textFaint, textAlign: "right", minWidth: 55 }}>{s.sets && s.reps ? s.sets + "x" + s.reps : s.duration && !s.sets ? ft(s.duration) : s.sets && s.duration ? s.sets + "x" + ft(s.duration) : s.reps ? s.reps + " reps" : ""}</div>
            </div>)}
      </div>
      <button onClick={onIniciar} disabled={aviso && aviso.bloqueado} style={{ width: "100%", marginTop: space.lg, minHeight: touch.min, background: aviso && aviso.bloqueado ? color.surfaceAlt : cor, color: aviso && aviso.bloqueado ? color.textFaint : color.bg, border: "none", borderRadius: radius.lg, fontSize: ty.md, fontWeight: 800, cursor: aviso && aviso.bloqueado ? "default" : "pointer", letterSpacing: 1, textTransform: "uppercase" }}>{aviso && aviso.bloqueado ? "Bloqueado" : "Iniciar este treino"}</button>
    </div>
  );
}
