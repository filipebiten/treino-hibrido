import { useState } from "react";
import Icon from "./Icon.jsx";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

const inputStyle = { width: "100%", minHeight: 40, padding: "8px 10px", borderRadius: radius.sm, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.sm, marginBottom: space.sm };

// Plano se-então com manejo de barreira — setup de 30s, reapresentado toda segunda-feira.
export default function PlanoSeEntaoCard({ plano, isSegunda, onSalvar }) {
  const temPlano = !!(plano && plano.ancora && plano.acao);
  const [editando, setEditando] = useState(!temPlano);
  const [ancora, setAncora] = useState((plano && plano.ancora) || "");
  const [acao, setAcao] = useState((plano && plano.acao) || "");
  const [barreira, setBarreira] = useState((plano && plano.barreira) || "");

  function salvar() {
    if (!ancora.trim() || !acao.trim()) return;
    onSalvar({ ancora: ancora.trim(), acao: acao.trim(), barreira: barreira.trim() });
    setEditando(false);
  }

  const destaque = isSegunda && temPlano;

  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.md, border: "1px solid " + (destaque ? color.success + "88" : color.border) }}>
      {destaque && <div style={{ fontSize: ty.xs, color: color.success, fontWeight: 700, marginBottom: 6 }}>Começo de semana — relembra seu plano:</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: space.sm }}>
        <Icon name="flag" size={14} color={color.textDim} />
        <span style={{ fontSize: ty.xs, color: color.textDim, textTransform: "uppercase", letterSpacing: 1 }}>Plano se-então</span>
      </div>

      {!editando && temPlano ? (
        <div onClick={() => setEditando(true)} style={{ cursor: "pointer" }}>
          <div style={{ fontSize: ty.sm, color: color.text, marginBottom: 4 }}>Depois de <b>{plano.ancora}</b>, eu vou fazer a dose em <b>{plano.acao}</b>.</div>
          {plano.barreira && <div style={{ fontSize: ty.sm, color: color.textDim }}>Se <b>{plano.barreira}</b>, então eu faço a dose mínima.</div>}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: 2 }}>Depois de...</div>
          <input style={inputStyle} value={ancora} onChange={e => setAncora(e.target.value)} placeholder="ex: tomar café da manhã" />
          <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: 2 }}>...eu vou fazer a dose em</div>
          <input style={inputStyle} value={acao} onChange={e => setAcao(e.target.value)} placeholder="ex: na sala, perto do sofá" />
          <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: 2 }}>Se (barreira), então eu faço a dose mínima</div>
          <input style={inputStyle} value={barreira} onChange={e => setBarreira(e.target.value)} placeholder="ex: tiver com pressa" />
          <button onClick={salvar} style={{ width: "100%", minHeight: touch.min * 0.7, borderRadius: radius.md, border: "none", background: color.success, color: color.bg, fontSize: ty.sm, fontWeight: 700, cursor: "pointer" }}>Salvar</button>
        </div>
      )}
    </div>
  );
}
