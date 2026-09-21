import Icon from "./Icon.jsx";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, minHeight: touch.min, display: "flex", alignItems: "center", gap: 6 };

function ft(s) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h > 0 ? h + "h" + String(m).padStart(2, "0") + "min" : m + "min"; }

export default function HistoricoTreinos({ historico, onBack }) {
  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.xl + "px " + space.lg + "px", maxWidth: 480, margin: "0 auto" }}>
      <button onClick={onBack} style={backBtn}><Icon name="chevronLeft" size={16} /> Voltar</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: space.lg, marginTop: space.sm }}>
        <Icon name="history" size={22} />
        <h1 style={{ fontSize: ty.display, fontWeight: 800 }}>Histórico de treinos</h1>
      </div>
      {historico.length === 0 && <div style={{ fontSize: ty.sm, color: color.textFaint, textAlign: "center", marginTop: space.xxl }}>Nenhum treino concluído ainda. Quando você terminar o primeiro, ele aparece aqui.</div>}
      {historico.map((h, i) => (
        <div key={i} style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.sm }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: ty.md, fontWeight: 700 }}>{h.label}</div>
            <div style={{ fontSize: ty.xs, color: color.textFaint }}>{h.iso.split("-").reverse().join("/")}</div>
          </div>
          <div style={{ fontSize: ty.xs, color: color.textDim, marginTop: 4 }}>
            {ft(h.duracaoSeg)}{h.volume > 0 ? " · " + h.volume + "kg de volume" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}
