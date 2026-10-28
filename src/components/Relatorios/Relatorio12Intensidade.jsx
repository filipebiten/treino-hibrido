import { color, space, type as ty, radius } from "../../lib/tokens.js";

// 3.3 / R4 — base aeróbica exige predominância de treino leve. Aviso só, nunca bloqueio
// (ver lib/agendamento.js).
export default function Relatorio12Intensidade({ dados }) {
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>12. Distribuição de intensidade — corrida</div>
      {!dados.suficiente ? (
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>Dados insuficientes — menos de 3 treinos de corrida no período.</div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: space.sm, marginBottom: space.sm }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: ty.lg, fontWeight: 800, color: color.success }}>{dados.contagem.leve}</div>
              <div style={{ fontSize: 10, color: color.textFaint }}>leve</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: ty.lg, fontWeight: 800, color: color.textDim }}>{dados.contagem.moderado}</div>
              <div style={{ fontSize: 10, color: color.textFaint }}>moderado</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: ty.lg, fontWeight: 800, color: dados.avisoAlto ? color.alert : color.text }}>{dados.contagem.intenso}</div>
              <div style={{ fontSize: 10, color: color.textFaint }}>intenso</div>
            </div>
          </div>
          <div style={{ fontSize: ty.xs, color: color.textDim }}>{dados.pctIntenso}% dos treinos de corrida foram intensos ({dados.total} no total).</div>
          {dados.avisoAlto && <div style={{ fontSize: ty.xs, color: color.alert, marginTop: 6, lineHeight: 1.4 }}>Acima de 20% — base aeróbica pede predominância de leve (R4 do método híbrido). Quem vem da musculação tende a tratar todo treino como recorde.</div>}
        </div>
      )}
    </div>
  );
}
