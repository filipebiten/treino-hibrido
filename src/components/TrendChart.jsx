import { color, type as ty } from "../lib/tokens.js";

function ddmm(iso) { const [, m, d] = iso.split("-"); return d + "/" + m; }

// Gráfico de linha genérico, escala automática — para séries sem faixa fixa (volume, peso corporal).
export default function TrendChart({ pontos, cor }) {
  if (pontos.length < 2) {
    return <div style={{ fontSize: ty.xs, color: color.textFaint, textAlign: "center", padding: "20px 0" }}>Sem dados suficientes ainda.</div>;
  }

  const W = 320, H = 132, padL = 32, padR = 8, padT = 10, padB = 32;
  const valores = pontos.map(p => p.valor);
  let min = Math.min(...valores), max = Math.max(...valores);
  if (min === max) { min -= 1; max += 1; }
  const folga = (max - min) * 0.1;
  min -= folga; max += folga;

  const stepX = (W - padL - padR) / (pontos.length - 1);
  const y = v => padT + (H - padT - padB) * (1 - (v - min) / (max - min));
  const pts = pontos.map((p, i) => ({ x: padL + i * stepX, y: y(p.valor), ...p }));
  const dateStep = Math.max(1, Math.ceil(pts.length / 6));

  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto" }}>
      {[min + folga, (min + max) / 2, max - folga].map((v, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke={color.border} strokeWidth="1" />
          <text x={2} y={y(v) + 4} fontSize={ty.micro} fill={color.textFaint}>{Math.round(v)}</text>
        </g>
      ))}
      <polyline points={pts.map(p => p.x + "," + p.y).join(" ")} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={cor} />)}
      {pts.map((p, i) => (i % dateStep === 0 || i === pts.length - 1) && (
        <text key={"d" + i} x={p.x} y={H - padB + 16} fontSize={ty.micro} fill={color.textFaint} textAnchor="middle">{ddmm(p.iso)}</text>
      ))}
    </svg>
  );
}
