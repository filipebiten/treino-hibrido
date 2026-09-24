import { color, type as ty } from "../lib/tokens.js";

function toISO(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function ddmm(iso) { const [, m, d] = iso.split("-"); return d + "/" + m; }

// Gráfico de dor matinal — 30 dias, SVG puro, sem interpolação (dia sem registro = buraco).
export default function PainGraph({ dorLog, hojeISO }) {
  const dias = [];
  let d = new Date(hojeISO + "T00:00:00");
  for (let i = 29; i >= 0; i--) dias.push(toISO(new Date(d.getTime() - i * 86400000)));

  const W = 320, H = 132, padL = 20, padR = 8, padT = 10, padB = 32;
  const stepX = (W - padL - padR) / (dias.length - 1);
  const y = nota => padT + (H - padT - padB) * (1 - nota / 10);
  const dateStep = Math.ceil(dias.length / 6);

  const segments = [];
  let atual = [];
  dias.forEach((iso, i) => {
    const nota = dorLog[iso];
    if (nota === undefined) { if (atual.length) segments.push(atual); atual = []; return; }
    atual.push({ x: padL + i * stepX, y: y(nota), nota, iso });
  });
  if (atual.length) segments.push(atual);

  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto" }}>
      {[0, 5, 10].map(n => (
        <g key={n}>
          <line x1={padL} x2={W - padR} y1={y(n)} y2={y(n)} stroke={color.border} strokeWidth="1" />
          <text x={2} y={y(n) + 4} fontSize={ty.micro} fill={color.textFaint}>{n}</text>
        </g>
      ))}
      {segments.map((seg, i) => (
        <polyline key={i} points={seg.map(p => p.x + "," + p.y).join(" ")} fill="none" stroke={color.pain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {segments.flat().map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color.pain} />)}
      {segments.length === 0 && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={ty.xs} fill={color.textFaint}>Sem registros ainda</text>}
      {dias.map((iso, i) => (i % dateStep === 0 || i === dias.length - 1) && (
        <text key={"d" + i} x={padL + i * stepX} y={H - padB + 16} fontSize={ty.micro} fill={color.textFaint} textAnchor="middle">{ddmm(iso)}</text>
      ))}
    </svg>
  );
}
