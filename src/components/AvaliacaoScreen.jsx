import Icon from "./Icon.jsx";
import { AVALIACAO_2021 as A } from "../data/avaliacao2021.js";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, minHeight: touch.min, display: "flex", alignItems: "center", gap: 6 };
const dataBR = A.data.split("-").reverse().join("/");

// Bloco 4 — ficha de consulta da avaliação de 2021. Só leitura.
export default function AvaliacaoScreen({ onBack }) {
  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.xl + "px " + space.lg + "px", maxWidth: 480, margin: "0 auto" }}>
      <button onClick={onBack} style={backBtn}><Icon name="chevronLeft" size={16} /> Voltar</button>
      <h1 style={{ fontSize: ty.xl, fontWeight: 800, margin: space.sm + "px 0 " + space.md + "px" }}>Avaliação biomecânica</h1>
      <div style={{ padding: space.md, borderRadius: radius.md, border: "1px solid " + color.alert + "66", background: color.alert + "12", fontSize: ty.sm, fontWeight: 700, marginBottom: space.md }}>
        Avaliação de {dataBR} — dados dinâmicos podem estar desatualizados.
      </div>
      <div style={{ fontSize: ty.xs, color: color.textDim, lineHeight: 1.6, marginBottom: space.lg }}>
        {A.local} · {A.profissional}<br />Encaminhado por: {A.encaminhamento}<br />{A.tipo}
      </div>
      {A.secoes.map(s => (
        <div key={s.titulo} style={{ marginBottom: space.lg }}>
          <div style={{ fontSize: ty.xs, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: space.sm }}>
            {s.titulo}{s.dinamico && <span style={{ color: color.alert, textTransform: "none", letterSpacing: 0 }}> · medida de {dataBR}, não atual</span>}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: ty.sm, lineHeight: 1.6 }}>
            {s.itens.map((it, i) => <li key={i} style={{ marginBottom: 4 }}>{it}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
