import { color } from "../../lib/tokens.js";

// Gráfico de linha genérico: pontos crus (dispersão) + linha de média móvel opcional.
// `cru`/`media`: [{iso, val}]. `marcadores`: isos a destacar embaixo do eixo (ex: recuo automático).
export default function LineChart({ cru, media = [], marcadores = [], min, max, corCru = color.pain, corMedia = color.text, altura = 90 }) {
  const n = cru.length;
  if (!n) return null;
  const largura = Math.max(n * 14, 120);
  const yFor = v => altura - ((v - min) / (max - min || 1)) * altura;
  const xFor = i => (n <= 1 ? largura / 2 : (i / (n - 1)) * (largura - 12) + 6);

  const pathMedia = media
    .map(p => ({ ...p, idx: cru.findIndex(q => q.iso === p.iso) }))
    .filter(p => p.idx !== -1 && p.media != null)
    .map((p, i) => (i === 0 ? "M" : "L") + xFor(p.idx) + " " + yFor(p.media))
    .join(" ");

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={largura} height={altura + 10} viewBox={`0 0 ${largura} ${altura + 10}`} style={{ display: "block" }}>
        {pathMedia && <path d={pathMedia} fill="none" stroke={corMedia} strokeWidth={2} />}
        {cru.map((p, i) => <circle key={p.iso} cx={xFor(i)} cy={yFor(p.val)} r={2.5} fill={corCru} opacity={0.8} />)}
        {marcadores.map(iso => {
          const idx = cru.findIndex(q => q.iso === iso);
          if (idx === -1) return null;
          return <circle key={iso} cx={xFor(idx)} cy={altura + 5} r={2.5} fill={color.alert} />;
        })}
      </svg>
    </div>
  );
}
