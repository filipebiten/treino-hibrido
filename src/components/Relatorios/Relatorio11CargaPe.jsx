import { color, space, type as ty, radius } from "../../lib/tokens.js";

const NIVEL_LABEL = { leve: "Leve", normal: "Normal", muito: "Muito tempo em pé" };

export default function Relatorio11CargaPe({ dados }) {
  if (!dados.suficiente) {
    return (
      <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
        <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>11. Dor × carga de pé</div>
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>Dados insuficientes — faltam {dados.faltamDias} dia(s) de histórico (precisa de 4 semanas corridas desde o primeiro registro de "carga de pé" no Home).</div>
      </div>
    );
  }
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>11. Dor × carga de pé</div>
      <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: space.sm }}>Dor matinal, por nível de carga de pé do dia anterior</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: space.lg }}>
        {Object.entries(NIVEL_LABEL).map(([nivel, label]) => {
          const d = dados.porNivel[nivel];
          return (
            <div key={nivel} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: ty.xs, color: color.textDim }}>{label}</span>
              <span style={{ fontSize: ty.sm, fontWeight: 700, color: d.n ? color.text : color.textFaint }}>
                {d.n ? d.dorMedia + "/10 (n=" + d.n + ")" : "sem dado"}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: space.sm }}>Dor matinal, por dia da semana</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {dados.porDiaSemana.map(d => (
          <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: ty.xs, color: color.textDim }}>{d.label}</span>
            <span style={{ fontSize: ty.sm, fontWeight: 700, color: d.n ? color.text : color.textFaint }}>
              {d.n ? d.dorMedia + "/10 (n=" + d.n + ")" : "sem dado"}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: color.textFaint, marginTop: space.md, lineHeight: 1.4 }}>Dispersão descritiva, sem linha de tendência — n pequeno por célula não sustenta correlação estatística.</div>
    </div>
  );
}
