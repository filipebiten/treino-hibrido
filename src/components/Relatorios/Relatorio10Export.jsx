import { eventosParaCSV, eventosParaJSON } from "../../lib/relatorios.js";
import { color, space, type as ty, radius, touch } from "../../lib/tokens.js";

function baixar(conteudo, nome, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.click();
  URL.revokeObjectURL(url);
}

const btn = { flex: 1, minHeight: touch.min * 0.7, borderRadius: radius.md, border: "1px solid " + color.border, background: "transparent", color: color.text, fontSize: ty.xs, fontWeight: 700, cursor: "pointer" };

export default function Relatorio10Export({ eventos }) {
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.md }}>10. Exportação</div>
      <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: space.md }}>{eventos.length} evento(s) no total.</div>
      <div style={{ display: "flex", gap: space.sm }}>
        <button onClick={() => baixar(eventosParaCSV(eventos), "treino-eventos.csv", "text/csv;charset=utf-8;")} style={btn}>Exportar CSV</button>
        <button onClick={() => baixar(eventosParaJSON(eventos), "treino-eventos.json", "application/json")} style={btn}>Exportar JSON</button>
      </div>
    </div>
  );
}
