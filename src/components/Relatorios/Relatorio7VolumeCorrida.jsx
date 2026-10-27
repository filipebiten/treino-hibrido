import { color, space, type as ty, radius } from "../../lib/tokens.js";

export default function Relatorio7VolumeCorrida({ dados, srpe }) {
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>7. Volume de corrida</div>
      {dados.temDado ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {dados.porSemana.map(s => (
            <div key={s.inicio} style={{ display: "flex", justifyContent: "space-between", fontSize: ty.xs, color: color.textDim }}>
              <span>{s.inicio.split("-").reverse().join("/")}</span><span>{s.km}km</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>Sem dados — o app ainda não captura distância/tempo ao finalizar sessões de corrida (só duração total). Fica pronto pro dia em que isso existir.</div>
      )}
      {srpe && srpe.temDado ? (
        <div style={{ marginTop: space.md, paddingTop: space.md, borderTop: "1px solid " + color.border }}>
          <div style={{ fontSize: 11, color: color.textFaint, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Carga por esforço (sRPE)</div>
          <div style={{ fontSize: ty.md, fontWeight: 800, color: color.text }}>{srpe.semanaAtual}</div>
          <div style={{ fontSize: ty.xs, color: color.textDim }}>média das últimas 4 semanas: {srpe.mediaSemanal4}{srpe.variacaoPct != null && (srpe.variacaoPct >= 0 ? " · +" : " · ") + srpe.variacaoPct + "%"}</div>
        </div>
      ) : (
        <div style={{ marginTop: space.md, fontSize: ty.xs, color: color.textFaint }}>sRPE sem dados — responde "como foi o esforço" ao finalizar uma corrida pra começar a aparecer aqui.</div>
      )}
    </div>
  );
}
