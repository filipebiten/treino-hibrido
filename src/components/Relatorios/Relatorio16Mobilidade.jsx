import { useState } from "react";
import { color, space, type as ty, radius, touch } from "../../lib/tokens.js";

const numInput = { width: 70, height: touch.min * 0.6, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.md, textAlign: "center" };
const label = { fontSize: ty.xs, color: color.textDim, fontWeight: 700, marginBottom: 4, display: "block" };
const fmt = n => String(n).replace(".", ",");

// Bloco 3 — teste quinzenal joelho-à-parede (cm). Evolução relativa por pé + diferença entre lados.
// Sem comparar com a referência de 42° do laudo de 2021 (inconsistência não resolvida).
export default function Relatorio16Mobilidade({ historico, onRegistrar }) {
  const [editando, setEditando] = useState(false);
  const [esq, setEsq] = useState("");
  const [dir, setDir] = useState("");

  function salvar() {
    const e = Number(String(esq).replace(",", ".")), d = Number(String(dir).replace(",", "."));
    if (!(e >= 0 && d >= 0) || esq === "" || dir === "") return;
    onRegistrar(e, d);
    setEsq(""); setDir(""); setEditando(false);
  }

  const primeiro = historico[historico.length - 1];
  const ultimo = historico[0];

  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.sm }}>
        <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1 }}>16. Mobilidade — joelho-à-parede</div>
        {!editando && <button onClick={() => setEditando(true)} style={{ background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer" }}>+ novo teste</button>}
      </div>
      {editando && (
        <>
          <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: space.sm }}>Quinzenal: maior distância do dedão à parede (cm) em que o joelho toca a parede sem o calcanhar levantar.</div>
          <div style={{ display: "flex", gap: space.sm, alignItems: "flex-end", marginBottom: space.md }}>
            <div><span style={label}>Esq. (cm)</span><input type="number" inputMode="decimal" min={0} step={0.5} value={esq} onChange={e => setEsq(e.target.value)} style={numInput} /></div>
            <div><span style={label}>Dir. (cm)</span><input type="number" inputMode="decimal" min={0} step={0.5} value={dir} onChange={e => setDir(e.target.value)} style={numInput} /></div>
            <button onClick={salvar} style={{ minHeight: touch.min * 0.6, padding: "0 14px", borderRadius: radius.sm, border: "none", background: color.musc, color: "#08120c", fontWeight: 700, cursor: "pointer" }}>Salvar</button>
          </div>
        </>
      )}

      {historico.length === 0 ? (
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>Sem teste registrado ainda.</div>
      ) : (
        <>
          {historico.length >= 2 && (
            <div style={{ fontSize: ty.xs, color: color.textDim, marginBottom: space.sm }}>
              Desde {primeiro.data.split("-").reverse().join("/")}: esq. {ultimo.esq - primeiro.esq >= 0 ? "+" : ""}{fmt(+(ultimo.esq - primeiro.esq).toFixed(1))} cm · dir. {ultimo.dir - primeiro.dir >= 0 ? "+" : ""}{fmt(+(ultimo.dir - primeiro.dir).toFixed(1))} cm
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {historico.slice(0, 8).map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: ty.xs }}>
                <span style={{ color: color.textDim }}>{t.data.split("-").reverse().join("/")}</span>
                <span>E {fmt(t.esq)} · D {fmt(t.dir)} cm</span>
                <b style={{ color: color.textDim }}>dif. {fmt(+Math.abs(t.esq - t.dir).toFixed(1))} cm</b>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
