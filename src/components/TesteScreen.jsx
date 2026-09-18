import Icon from "./Icon.jsx";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

export default function TesteScreen({ nome, criterio, onResultado }) {
  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.lg, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ textAlign: "center", marginBottom: space.xl }}>
        <Icon name="flag" size={36} color={color.alert} />
        <div style={{ fontSize: ty.xl, fontWeight: 800, marginTop: space.sm, marginBottom: space.sm }}>{nome}</div>
        <div style={{ fontSize: ty.base, color: color.textDim }}>{criterio}</div>
      </div>
      <button onClick={() => onResultado(true)} style={{ width: "100%", minHeight: touch.min, marginBottom: space.sm, borderRadius: radius.lg, border: "2px solid " + color.success + "88", background: color.success + "1a", color: color.text, fontSize: ty.md, fontWeight: 700, cursor: "pointer" }}>Passou</button>
      <button onClick={() => onResultado(false)} style={{ width: "100%", minHeight: touch.min, borderRadius: radius.lg, border: "2px solid " + color.pain + "88", background: color.pain + "1a", color: color.text, fontSize: ty.md, fontWeight: 700, cursor: "pointer" }}>Não passou</button>
    </div>
  );
}
