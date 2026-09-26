import { color, space, type as ty, radius } from "../../lib/tokens.js";

const ROTULOS = { muscA: "Musculação A", muscB: "Musculação B", muscC: "Musculação C", corrida: "Corrida", semTreino: "Sem treino" };

export default function Relatorio4DorPorTipo({ dados }) {
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>4. Dor no dia seguinte, por tipo de treino</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(ROTULOS).map(([cat, label]) => {
          const d = dados[cat];
          return (
            <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: ty.xs, color: color.textDim }}>{label}</span>
              <span style={{ fontSize: ty.sm, fontWeight: 700, color: d.suficiente ? color.text : color.textFaint }}>
                {d.suficiente ? d.dorMedia + "/10" : "insuficiente (" + d.n + "/3)"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
