import Icon from "../Icon.jsx";
import { toISO } from "../../data/plano.js";
import { color, space, type as ty, radius } from "../../lib/tokens.js";

const TIPO_LABEL = { muscA: "Musculação A", muscB: "Musculação B", muscC: "Musculação C", caminhada: "Caminhada", walkrun: "Walk/Run", qualidade: "Qualidade", longao: "Longão" };

function listaDias(marcoZero, hojeISO) {
  const dias = [];
  const limite = new Date(marcoZero + "T00:00:00");
  for (let d = new Date(hojeISO + "T00:00:00"); d >= limite; d.setDate(d.getDate() - 1)) {
    dias.push(toISO(d));
  }
  return dias;
}

function ResumoDia({ resumo }) {
  if (!resumo) return <span style={{ color: color.textFaint }}>Sem registro</span>;
  const partes = [];
  if (resumo.dor != null) partes.push("Dor " + resumo.dor + "/10");
  const doses = resumo.periodos.filter(p => p !== "gelo" && p !== "carga");
  if (doses.length) partes.push("Rehab: " + doses.join(", "));
  if (resumo.periodos.includes("carga")) partes.push("Rathleff");
  if (resumo.treino) partes.push((TIPO_LABEL[resumo.treino.tipo] || resumo.treino.label || "Treino") + (resumo.treino.manual ? " (manual)" : ""));
  if (resumo.pulado) partes.push("Treino pulado");
  if (resumo.testes.length) partes.push(...resumo.testes.map(t => t.passou ? "Teste aprovado" : "Teste não aprovado"));
  if (resumo.recuo) partes.push("Recuo automático");
  if (!partes.length) return <span style={{ color: color.textFaint }}>Sem registro</span>;
  return <span>{partes.join(" · ")}</span>;
}

export default function Timeline({ diasResumo, marcoZero, hojeISO, onSelecionarDia }) {
  const dias = listaDias(marcoZero, hojeISO);
  return (
    <div>
      {dias.map(iso => {
        const resumo = diasResumo[iso];
        const dataFmt = iso.split("-").reverse().join("/");
        return (
          <div key={iso} onClick={() => onSelecionarDia(iso)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: space.md, padding: space.md, borderRadius: radius.md, marginBottom: 6, background: color.surface, cursor: "pointer" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ty.xs, fontWeight: 700, color: color.textDim, marginBottom: 2 }}>{dataFmt}</div>
              <div style={{ fontSize: ty.xs, color: color.text }}><ResumoDia resumo={resumo} /></div>
            </div>
            <Icon name="edit" size={14} color={color.textFaint} />
          </div>
        );
      })}
    </div>
  );
}
