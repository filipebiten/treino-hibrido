import { useState } from "react";
import { progressaoCarga, exerciciosEstagnados } from "../../lib/relatorios.js";
import { color, space, type as ty, radius } from "../../lib/tokens.js";

export default function Relatorio6Progressao({ cargas }) {
  const nomes = Object.keys(cargas);
  const [selecionado, setSelecionado] = useState(nomes[0] || null);
  const historico = selecionado ? progressaoCarga(cargas, selecionado).historico : [];
  const estagnados = exerciciosEstagnados(cargas);

  const largura = Math.max(historico.length * 24, 100), altura = 70;
  const kgs = historico.map(h => h.kg);
  const min = kgs.length ? Math.min(...kgs) : 0, max = kgs.length ? Math.max(...kgs) : 1;
  const yFor = kg => altura - ((kg - min) / (max - min || 1)) * altura;
  const xFor = i => (historico.length <= 1 ? largura / 2 : (i / (historico.length - 1)) * (largura - 12) + 6);

  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>6. Progressão de carga por exercício</div>
      {nomes.length === 0 ? (
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>Sem exercícios registrados ainda.</div>
      ) : (
        <>
          <select value={selecionado || ""} onChange={(e) => setSelecionado(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: radius.sm, background: color.surfaceAlt, color: color.text, border: "1px solid " + color.border, fontSize: ty.xs, marginBottom: space.md }}>
            {nomes.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {historico.length ? (
            <div style={{ overflowX: "auto" }}>
              <svg width={largura} height={altura + 8} viewBox={`0 0 ${largura} ${altura + 8}`} style={{ display: "block" }}>
                <polyline points={historico.map((h, i) => xFor(i) + "," + yFor(h.kg)).join(" ")} fill="none" stroke={color.musc} strokeWidth={2} />
                {historico.map((h, i) => <circle key={i} cx={xFor(i)} cy={yFor(h.kg)} r={3} fill={color.musc} />)}
              </svg>
            </div>
          ) : <div style={{ fontSize: ty.xs, color: color.textFaint }}>Sem histórico pra esse exercício.</div>}
        </>
      )}
      {estagnados.length > 0 && (
        <div style={{ marginTop: space.md, paddingTop: space.md, borderTop: "1px solid " + color.border }}>
          <div style={{ fontSize: 11, color: color.alert, fontWeight: 700, marginBottom: 4 }}>Estagnados (mesma carga 3+ sessões)</div>
          {estagnados.map(e => <div key={e.nome} style={{ fontSize: ty.xs, color: color.textDim }}>{e.nome} — {e.kg}kg</div>)}
        </div>
      )}
    </div>
  );
}
