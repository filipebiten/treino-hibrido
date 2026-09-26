import { color, space, type as ty, radius } from "../../lib/tokens.js";

const FAIXA_COR = { subcarga: color.rest, ideal: color.success, "atenção": color.alert, "risco alto": color.pain };

export default function Relatorio5Acwr({ dados }) {
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>5. ACWR — carga aguda:crônica</div>
      {dados.suficiente ? (
        <div>
          <div style={{ fontSize: ty.hero, fontWeight: 800, color: FAIXA_COR[dados.faixa] }}>{dados.ratio}</div>
          <div style={{ fontSize: ty.sm, color: FAIXA_COR[dados.faixa], fontWeight: 700, textTransform: "capitalize" }}>{dados.faixa}</div>
          <div style={{ fontSize: 10, color: color.textFaint, marginTop: 6 }}>&lt;0,8 subcarga · 0,8–1,3 ideal · 1,3–1,5 atenção · &gt;1,5 risco alto</div>
        </div>
      ) : (
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>Dados insuficientes — faltam {dados.faltamDias} dia(s) de histórico (precisa de 28 dias corridos desde o início do plano).</div>
      )}
    </div>
  );
}
