import { color, space, type as ty, radius, touch } from "../../lib/tokens.js";
import { CADENCIA_2021, META_CADENCIA } from "../../lib/cadencia.js";

const Y_MIN = 140, Y_MAX = 180, ALT = 110;

// Bloco 2 — evolução da cadência: faixa-alvo 161-168 sombreada, 153 de 2021 pontilhado e datado.
// 153 é medida de 2021 (esteira, 9 km/h) — linha de base atual é desconhecida até nova avaliação.
export default function Relatorio17Cadencia({ serie, sugestao, alvo, onDefinirAlvo }) {
  const n = serie.length;
  const larg = Math.max(n * 18, 240);
  const y = v => ALT - ((Math.max(Y_MIN, Math.min(Y_MAX, v)) - Y_MIN) / (Y_MAX - Y_MIN)) * ALT;
  const x = i => (n <= 1 ? larg / 2 : 8 + (i / (n - 1)) * (larg - 16));
  const botao = { minHeight: touch.min * 0.7, padding: "0 14px", borderRadius: radius.sm, border: "none", background: color.corrida || color.success, color: "#0f1115", fontWeight: 700, fontSize: ty.xs, cursor: "pointer", marginTop: space.sm };

  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>17. Cadência</div>
      <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: space.sm, lineHeight: 1.5 }}>
        Meta do fisio: {META_CADENCIA.min}-{META_CADENCIA.max} PPM (+5-10% sobre {CADENCIA_2021.ppm}, medido em {CADENCIA_2021.data.split("-").reverse().join("/")}). Sua cadência atual real só aparece com registros novos — 2021 é histórico, não medida de hoje.
      </div>

      {n > 0 && (
        <div style={{ overflowX: "auto", marginBottom: space.sm }}>
          <svg width={larg} height={ALT + 4} viewBox={`0 0 ${larg} ${ALT + 4}`} style={{ display: "block" }} role="img" aria-label="Cadência por corrida, com faixa-alvo e linha de 2021">
            <rect x={0} y={y(META_CADENCIA.max)} width={larg} height={y(META_CADENCIA.min) - y(META_CADENCIA.max)} fill={color.success} opacity={0.12} />
            <line x1={0} x2={larg} y1={y(CADENCIA_2021.ppm)} y2={y(CADENCIA_2021.ppm)} stroke={color.textFaint} strokeDasharray="4 4" />
            <text x={4} y={y(CADENCIA_2021.ppm) - 3} fontSize={9} fill={color.textFaint}>{CADENCIA_2021.ppm} · 19/08/2021</text>
            {alvo && <line x1={0} x2={larg} y1={y(alvo.ppm)} y2={y(alvo.ppm)} stroke={color.success} strokeWidth={1} opacity={0.7} />}
            {serie.length > 1 && <path d={serie.map((p, i) => (i ? "L" : "M") + x(i) + " " + y(p.val)).join(" ")} fill="none" stroke={color.text} strokeWidth={1} opacity={0.4} />}
            {serie.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.val)} r={3} fill={color.text} />)}
          </svg>
        </div>
      )}

      <div style={{ fontSize: ty.xs, color: color.textDim, lineHeight: 1.5 }}>
        {sugestao.fase === "medir" && <>Sem 3 corridas com cadência registrada ainda (faltam {sugestao.faltam}). Use o metrônomo livre e meça sua cadência atual numa corrida normal, sem forçar — é dessa medida que sai o primeiro alvo.</>}
        {sugestao.fase === "meta" && <>Média recente {sugestao.mediaAtual} PPM — dentro/acima da meta. Mantém.</>}
        {sugestao.fase === "sugerir" && <>
          Média recente {sugestao.mediaAtual} PPM. Primeiro degrau sugerido: <b>{sugestao.alvo} PPM</b> (+5% no máximo, teto {META_CADENCIA.max}).
          <div><button onClick={() => onDefinirAlvo(sugestao.alvo)} style={botao}>Usar {sugestao.alvo} como alvo</button></div>
        </>}
        {sugestao.fase === "manter" && <>Alvo atual {sugestao.alvo} PPM (média recente {sugestao.mediaAtual}). {sugestao.motivo}</>}
        {sugestao.fase === "proximo" && <>
          2 semanas no alvo de {sugestao.alvo} PPM sem piora da dor. Próximo degrau: <b>{sugestao.proximo} PPM</b>.
          <div><button onClick={() => onDefinirAlvo(sugestao.proximo)} style={botao}>Subir pra {sugestao.proximo}</button></div>
        </>}
      </div>
    </div>
  );
}
