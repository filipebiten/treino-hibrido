import LineChart from "./LineChart.jsx";
import { color, space, type as ty, radius } from "../../lib/tokens.js";

function Legenda({ cor, label }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: cor }} /><span style={{ fontSize: 10, color: color.textFaint }}>{label}</span></div>;
}

export default function Relatorio2Dor({ dados }) {
  const cru = dados.pontos.map(p => ({ iso: p.iso, val: p.nivel }));
  const media = dados.mediaMovel.filter(p => p.media != null);

  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>2. Dor matinal ao longo do tempo</div>
      {cru.length ? (
        <>
          <LineChart cru={cru} media={media} marcadores={dados.marcadoresRecuo} min={0} max={10} corCru={color.pain} corMedia={color.text} />
          <div style={{ display: "flex", gap: space.md, marginTop: 6, flexWrap: "wrap" }}>
            <Legenda cor={color.pain} label="Dor do dia" />
            <Legenda cor={color.text} label="Média móvel 7d" />
            {dados.marcadoresRecuo.length > 0 && <Legenda cor={color.alert} label="Recuo automático" />}
          </div>
        </>
      ) : <div style={{ fontSize: ty.xs, color: color.textFaint }}>Sem registros de dor no período.</div>}
    </div>
  );
}
