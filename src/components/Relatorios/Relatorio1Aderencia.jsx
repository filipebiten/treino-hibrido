import { color, space, type as ty, radius } from "../../lib/tokens.js";

const BAR_W = 8, GAP_BARRA = 4, GAP_GRUPO = 6, ALTURA = 70;

function Numero({ label, pct, feitas, total, cor }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: color.textFaint, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: ty.xl, fontWeight: 800, color: cor }}>{pct}%</div>
      <div style={{ fontSize: 10, color: color.textFaint }}>{feitas}/{total} dias</div>
    </div>
  );
}

export default function Relatorio1Aderencia({ dados }) {
  const semanas = dados.porSemana;
  const larguraGrupo = BAR_W * 2 + GAP_BARRA;
  const svgW = Math.max(semanas.length * (larguraGrupo + GAP_GRUPO), 40);

  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>1. Aderência ao rehab</div>

      <div style={{ display: "flex", gap: space.lg, marginBottom: space.md }}>
        <Numero label="Manhã" pct={dados.manha.pct} feitas={dados.manha.feitas} total={dados.manha.planejadas} cor={color.corrida} />
        <Numero label="Noite" pct={dados.noite.pct} feitas={dados.noite.feitas} total={dados.noite.planejadas} cor={color.forca} />
      </div>

      {semanas.length > 0 ? (
        <>
          <div style={{ overflowX: "auto" }}>
          <svg width={svgW} height={ALTURA + 16} viewBox={`0 0 ${svgW} ${ALTURA + 16}`} style={{ display: "block" }}>
            {semanas.map((s, i) => {
              const x = i * (larguraGrupo + GAP_GRUPO);
              const hManha = (s.manhaPct / 100) * ALTURA, hNoite = (s.noitePct / 100) * ALTURA;
              return (
                <g key={i}>
                  <rect x={x} y={ALTURA - hManha} width={BAR_W} height={Math.max(hManha, 1)} fill={color.corrida} rx={1.5} />
                  <rect x={x + BAR_W + GAP_BARRA} y={ALTURA - hNoite} width={BAR_W} height={Math.max(hNoite, 1)} fill={color.forca} rx={1.5} />
                </g>
              );
            })}
          </svg>
          </div>
          <div style={{ display: "flex", gap: space.md, marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: color.corrida }} /><span style={{ fontSize: 10, color: color.textFaint }}>Manhã</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: color.forca }} /><span style={{ fontSize: 10, color: color.textFaint }}>Noite</span></div>
            <span style={{ fontSize: 10, color: color.textFaint, marginLeft: "auto" }}>{semanas.length} semana{semanas.length > 1 ? "s" : ""}</span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>Sem dados no período.</div>
      )}
    </div>
  );
}
