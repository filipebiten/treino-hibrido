import StatBox from "./StatBox.jsx";
import { color, space, type as ty, radius } from "../../lib/tokens.js";

export default function Relatorio3DorAderencia({ dados }) {
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>3. Dor × aderência</div>
      {dados.suficiente ? (
        <div style={{ display: "flex", gap: space.lg }}>
          <StatBox label={"Semanas ≥80% (" + dados.alta.n + ")"} valor={dados.alta.dorMedia + "/10"} cor={color.success} />
          <StatBox label={"Semanas <80% (" + dados.baixa.n + ")"} valor={dados.baixa.dorMedia + "/10"} cor={color.pain} />
        </div>
      ) : (
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>
          Dados insuficientes ainda. Faltam {dados.faltamAlta} semana(s) com aderência ≥80% e {dados.faltamBaixa} semana(s) com aderência abaixo de 80% (mínimo 4 de cada lado) pra comparar com confiança.
        </div>
      )}
    </div>
  );
}
