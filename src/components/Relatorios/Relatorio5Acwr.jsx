import { color, space, type as ty, radius } from "../../lib/tokens.js";

// descritivo, não alerta de risco — ver nota abaixo (Impellizzeri 2020). Sem vermelho/pain:
// nenhuma faixa aqui é "perigo", é só volume relativo às últimas 4 semanas.
const FAIXA_COR = { subcarga: color.textFaint, ideal: color.success, "carga crescente": color.textDim, "carga alta": color.alert };

export default function Relatorio5Acwr({ dados }) {
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>5. ACWR — carga aguda:crônica</div>
      {dados.suficiente ? (
        <div>
          <div style={{ fontSize: ty.hero, fontWeight: 800, color: FAIXA_COR[dados.faixa] }}>{dados.ratio}</div>
          <div style={{ fontSize: ty.sm, color: FAIXA_COR[dados.faixa], fontWeight: 700, textTransform: "capitalize" }}>{dados.faixa}</div>
          <div style={{ fontSize: 10, color: color.textFaint, marginTop: 6 }}>&lt;0,8 subcarga · 0,8–1,3 ideal · 1,3–1,5 carga crescente · &gt;1,5 carga alta</div>
          <div style={{ fontSize: 10, color: color.textFaint, marginTop: 6, lineHeight: 1.4 }}>Gráfico de tendência, não alerta de risco — ACWR não tem evidência sólida como preditor de lesão (Impellizzeri et al., 2020, IJSPP).</div>
        </div>
      ) : (
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>Dados insuficientes — faltam {dados.faltamDias} dia(s) de histórico (precisa de 28 dias corridos desde o início do plano).</div>
      )}
    </div>
  );
}
