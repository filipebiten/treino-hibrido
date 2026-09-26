import { verificarGate } from "../../lib/progressao.js";
import { color, space, type as ty, radius } from "../../lib/tokens.js";

export default function Relatorio9Gate({ macrofase, testesLog, dorLog, hojeISO }) {
  const gate = verificarGate(macrofase, { testesLog, dorLog, hojeISO });
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
    </div>
  );
}
