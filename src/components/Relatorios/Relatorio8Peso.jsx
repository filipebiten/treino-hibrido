import LineChart from "./LineChart.jsx";
import { color, space, type as ty, radius } from "../../lib/tokens.js";

export default function Relatorio8Peso({ dados }) {
  const cru = dados.pontos.map(p => ({ iso: p.iso, val: p.kg }));
  const kgs = cru.map(p => p.val);
  const min = kgs.length ? Math.min(...kgs) - 1 : 0, max = kgs.length ? Math.max(...kgs) + 1 : 1;

  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>8. Peso corporal</div>
      {cru.length >= 2 ? (
        <>
          <LineChart cru={cru} media={dados.mediaMovel} min={min} max={max} corCru={color.textFaint} corMedia={color.forca} />
          <div style={{ fontSize: ty.xs, color: color.textDim, marginTop: 6 }}>Tendência: {dados.tendencia > 0 ? "+" : ""}{dados.tendencia}kg desde o primeiro registro</div>
        </>
      ) : <div style={{ fontSize: ty.xs, color: color.textFaint }}>Só 1 registro de peso — sem série pra mostrar tendência. O app só pede peso na tela de onboarding/recalibração.</div>}
    </div>
  );
}
