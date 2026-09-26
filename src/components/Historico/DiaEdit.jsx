import { useState } from "react";
import Icon from "../Icon.jsx";
import { color, space, type as ty, radius, touch } from "../../lib/tokens.js";

const TIPOS = [
  { v: "muscA", label: "Musculação A" }, { v: "muscB", label: "Musculação B" }, { v: "muscC", label: "Musculação C" },
  { v: "caminhada", label: "Caminhada" }, { v: "walkrun", label: "Walk/Run" }, { v: "qualidade", label: "Qualidade" }, { v: "longao", label: "Longão" },
];

const label = { fontSize: ty.xs, color: color.textDim, fontWeight: 700, marginBottom: space.xs, display: "block" };
const field = { marginBottom: space.lg };
const chip = (ativo) => ({
  padding: "8px 12px", borderRadius: radius.pill, fontSize: ty.xs, fontWeight: 700, cursor: "pointer",
  border: "1px solid " + (ativo ? color.musc : color.border), background: ativo ? color.musc + "22" : "transparent", color: ativo ? color.text : color.textDim,
});
const numInput = { width: 56, height: touch.min * 0.6, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.lg, textAlign: "center" };

export default function DiaEdit({ iso, resumoDia, onSalvar, onFechar }) {
  const [dor, setDor] = useState(resumoDia && resumoDia.dor != null ? resumoDia.dor : null);
  const [manha, setManha] = useState(!!(resumoDia && resumoDia.periodos.includes("manha")));
  const [noite, setNoite] = useState(!!(resumoDia && resumoDia.periodos.includes("noite")));
  const [treinoStatus, setTreinoStatus] = useState(resumoDia && resumoDia.treino ? "feito" : resumoDia && resumoDia.pulado ? "pulado" : null);
  const [treinoTipo, setTreinoTipo] = useState((resumoDia && resumoDia.treino && resumoDia.treino.tipo) || null);

  const dataFmt = iso.split("-").reverse().join("/");

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000aa", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onFechar}>
      <div style={{ background: color.surface, borderRadius: radius.lg + "px " + radius.lg + "px 0 0", padding: space.xl, width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg }}>
          <h2 style={{ fontSize: ty.lg, fontWeight: 800 }}>{dataFmt}</h2>
          <button onClick={onFechar} style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}><Icon name="close" size={18} color={color.textDim} /></button>
        </div>

        <div style={field}>
          <span style={label}>Dor matinal (0–10)</span>
          <div style={{ display: "flex", alignItems: "center", gap: space.sm }}>
            <input type="number" min={0} max={10} value={dor === null ? "" : dor} placeholder="—"
              onChange={(e) => setDor(e.target.value === "" ? null : Math.max(0, Math.min(10, Number(e.target.value))))} style={numInput} />
            {dor !== null && <button onClick={() => setDor(null)} style={{ background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer" }}>limpar</button>}
          </div>
        </div>

        <div style={field}>
          <span style={label}>Rehab</span>
          <div style={{ display: "flex", gap: space.sm }}>
            <div onClick={() => setManha(!manha)} style={chip(manha)}>Manhã</div>
            <div onClick={() => setNoite(!noite)} style={chip(noite)}>Noite</div>
          </div>
        </div>

        <div style={field}>
          <span style={label}>Treino</span>
          <div style={{ display: "flex", gap: space.sm, marginBottom: space.sm, flexWrap: "wrap" }}>
            <div onClick={() => setTreinoStatus(treinoStatus === "feito" ? null : "feito")} style={chip(treinoStatus === "feito")}>Feito</div>
            <div onClick={() => setTreinoStatus(treinoStatus === "pulado" ? null : "pulado")} style={chip(treinoStatus === "pulado")}>Pulado</div>
          </div>
          {treinoStatus === "feito" && (
            <div style={{ display: "flex", gap: space.xs, flexWrap: "wrap" }}>
              {TIPOS.map(t => <div key={t.v} onClick={() => setTreinoTipo(treinoTipo === t.v ? null : t.v)} style={{ ...chip(treinoTipo === t.v), fontSize: 11 }}>{t.label}</div>)}
            </div>
          )}
        </div>

        <button onClick={() => onSalvar({ dor, manha, noite, treinoStatus, treinoTipo })}
          style={{ width: "100%", minHeight: touch.min, borderRadius: radius.md, border: "none", background: color.musc, color: "#08120c", fontSize: ty.md, fontWeight: 800, cursor: "pointer" }}>
          Salvar
        </button>
      </div>
    </div>
  );
}
