import { color, type as ty } from "../../lib/tokens.js";

export default function StatBox({ label, valor, sub, cor }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: color.textFaint, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: ty.xl, fontWeight: 800, color: cor || color.text }}>{valor}</div>
      {sub && <div style={{ fontSize: 10, color: color.textFaint }}>{sub}</div>}
    </div>
  );
}
