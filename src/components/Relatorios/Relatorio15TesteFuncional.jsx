import { useState } from "react";
import { calcularAssimetria } from "../../data/forcaProtetiva.js";
import { color, space, type as ty, radius, touch } from "../../lib/tokens.js";

const numInput = { width: 70, height: touch.min * 0.6, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.md, textAlign: "center" };
const label = { fontSize: ty.xs, color: color.textDim, fontWeight: 700, marginBottom: 4, display: "block" };

// Bloco 5.2 — teste funcional mensal: heel raise unilateral até falha, cada perna.
export default function Relatorio15TesteFuncional({ historico, onRegistrar }) {
  const [esq, setEsq] = useState("");
  const [dir, setDir] = useState("");

  function salvar() {
    const e = Number(esq), d = Number(dir);
    if (!e || !d) return;
    onRegistrar(e, d);
    setEsq(""); setDir("");
  }

  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm }}>15. Teste funcional — heel raise unilateral</div>
      <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: space.sm }}>Mensal: suba na ponta de um pé só até a falha (perder a forma). Repita no outro.</div>

      <div style={{ display: "flex", gap: space.sm, alignItems: "flex-end", marginBottom: space.md }}>
        <div><span style={label}>Esquerda</span><input type="number" min={0} value={esq} onChange={e => setEsq(e.target.value)} style={numInput} /></div>
        <div><span style={label}>Direita</span><input type="number" min={0} value={dir} onChange={e => setDir(e.target.value)} style={numInput} /></div>
        <button onClick={salvar} style={{ minHeight: touch.min * 0.6, padding: "0 14px", borderRadius: radius.sm, border: "none", background: color.musc, color: "#08120c", fontWeight: 700, cursor: "pointer" }}>Salvar</button>
      </div>

      {historico.length === 0 ? (
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>Sem teste registrado ainda.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {historico.slice(0, 6).map((t, i) => {
            const assim = calcularAssimetria(t.esq, t.dir);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: ty.xs }}>
                <span style={{ color: color.textDim }}>{t.data.split("-").reverse().join("/")}</span>
                <span>E {t.esq} · D {t.dir}</span>
                <b style={{ color: assim.acimaDoLimiar ? color.alert : color.textDim }}>{assim.pct}% assimetria</b>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
