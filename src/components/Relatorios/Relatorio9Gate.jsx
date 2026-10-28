import { verificarGate, ADOCAO_SILBERNAGEL_ATE } from "../../lib/progressao.js";
import { projecaoDorAteLimiar } from "../../lib/relatorios.js";
import { color, space, type as ty, radius } from "../../lib/tokens.js";

const dataFmt = ADOCAO_SILBERNAGEL_ATE.split("-").reverse().join("/");
const LIMIAR_SILBERNAGEL = 5;

export default function Relatorio9Gate({ macrofase, testesLog, dorLog, hojeISO, eventos }) {
  const gate = verificarGate(macrofase, { testesLog, dorLog, hojeISO });
  const projecao = !gate.ok && gate.criterio === "silbernagel" ? projecaoDorAteLimiar(eventos, hojeISO, LIMIAR_SILBERNAGEL) : null;
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>9. Prontidão pro próximo gate</div>
      {macrofase >= 4 ? (
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>Última macrofase — sem próximo gate.</div>
      ) : gate.ok ? (
        <div style={{ fontSize: ty.sm, color: color.success, fontWeight: 700 }}>Tudo pronto pra avançar de macrofase.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {gate.faltando.map((f, i) => <div key={i} style={{ fontSize: ty.xs, color: color.textDim }}>• {f}</div>)}
        </div>
      )}
      {projecao && projecao.tendencia === "caindo" && (
        <div style={{ fontSize: ty.xs, color: color.success, marginTop: space.sm }}>No ritmo atual de queda da dor, entrada no próximo gate em ~{projecao.dias} {projecao.dias === 1 ? "dia" : "dias"} (projeção pela tendência real, não promessa).</div>
      )}
      {gate.criterio === "silbernagel" && (
        <div style={{ fontSize: 10, color: color.textFaint, marginTop: space.sm }}>Critério: Silbernagel (dor ≤5/10, sem subir de semana) — substitui o antigo ≤2/10 por 5 dias.</div>
      )}
      {gate.comparacaoAntiga && (
        <div style={{ fontSize: 10, color: color.textFaint, marginTop: 4 }}>Pelo critério antigo (comparação, até {dataFmt}): {gate.comparacaoAntiga.ok ? "liberado" : gate.comparacaoAntiga.faltando.join("; ")}</div>
      )}
    </div>
  );
}
