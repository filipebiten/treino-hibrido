import { useState } from "react";
import Icon from "../Icon.jsx";
import Relatorio1Aderencia from "./Relatorio1Aderencia.jsx";
import { aderenciaRehab, periodoParaDatas } from "../../lib/relatorios.js";
import { color, space, type as ty, touch } from "../../lib/tokens.js";

const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, minHeight: touch.min, display: "flex", alignItems: "center", gap: 6 };
const PERIODOS = [["7d", "7 dias"], ["30d", "30 dias"], ["90d", "90 dias"], ["tudo", "Tudo"]];

export default function Relatorios({ eventos, hojeISO, onBack }) {
  const [periodo, setPeriodo] = useState("30d");
  const { desde, ate } = periodoParaDatas(periodo, hojeISO);
  const dadosAderencia = aderenciaRehab(eventos, desde, ate);

  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.xl + "px " + space.lg + "px", maxWidth: 480, margin: "0 auto" }}>
      <button onClick={onBack} style={backBtn}><Icon name="chevronLeft" size={16} /> Voltar</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: space.lg, marginTop: space.sm }}>
        <Icon name="chart" size={22} />
        <h1 style={{ fontSize: ty.display, fontWeight: 800 }}>Relatórios</h1>
      </div>

      <div style={{ display: "flex", gap: space.sm, marginBottom: space.lg }}>
        {PERIODOS.map(([key, label]) => (
          <button key={key} onClick={() => setPeriodo(key)}
            style={{
              flex: 1, minHeight: touch.min * 0.6, borderRadius: 10, border: "1px solid " + (periodo === key ? color.musc : color.border),
              background: periodo === key ? color.musc + "1a" : "transparent", color: periodo === key ? color.text : color.textDim,
              fontSize: ty.xs, fontWeight: 700, cursor: "pointer",
            }}>
            {label}
          </button>
        ))}
      </div>

      <Relatorio1Aderencia dados={dadosAderencia} />
    </div>
  );
}
