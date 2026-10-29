import Icon from "./Icon.jsx";
import { color, space, type as ty, touch, radius } from "../lib/tokens.js";

const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, minHeight: touch.min, display: "flex", alignItems: "center", gap: 6 };
const item = { width: "100%", minHeight: touch.min, padding: space.md, marginBottom: space.sm, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surface, color: color.text, fontSize: ty.md, fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" };

// Bloco 5.2 — Lembretes e Recalibrar saíram do rodapé de texto da Home e viraram itens
// daqui, atrás da aba "Ajustes" da tab bar.
export default function AjustesScreen({ onBack, onAbrirLembretes, onRecalibrar, onAbrirImportacao }) {
  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.xl + "px " + space.lg + "px", maxWidth: 480, margin: "0 auto" }}>
      <button onClick={onBack} style={backBtn}><Icon name="chevronLeft" size={16} /> Voltar</button>
      <h1 style={{ fontSize: ty.display, fontWeight: 800, marginBottom: space.lg, marginTop: space.sm }}>Ajustes</h1>

      <button onClick={onAbrirLembretes} style={item}>
        <span>Lembretes</span>
        <Icon name="chevronRight" size={16} color={color.textFaint} />
      </button>
      <button onClick={onRecalibrar} style={item}>
        <span>Recalibrar</span>
        <Icon name="chevronRight" size={16} color={color.textFaint} />
      </button>
      <button onClick={onAbrirImportacao} style={item}>
        <span>Importar do iPhone</span>
        <Icon name="chevronRight" size={16} color={color.textFaint} />
      </button>
    </div>
  );
}
