import { useState } from "react";
import Icon from "../Icon.jsx";
import Relatorio1Aderencia from "./Relatorio1Aderencia.jsx";
import Relatorio2Dor from "./Relatorio2Dor.jsx";
import Relatorio3DorAderencia from "./Relatorio3DorAderencia.jsx";
import Relatorio4DorPorTipo from "./Relatorio4DorPorTipo.jsx";
import Relatorio5Acwr from "./Relatorio5Acwr.jsx";
import Relatorio6Progressao from "./Relatorio6Progressao.jsx";
import Relatorio7VolumeCorrida from "./Relatorio7VolumeCorrida.jsx";
import Relatorio8Peso from "./Relatorio8Peso.jsx";
import Relatorio9Gate from "./Relatorio9Gate.jsx";
import Relatorio10Export from "./Relatorio10Export.jsx";
import {
  periodoParaDatas, aderenciaRehab, dorAoLongoDoTempo, dorPorAderencia,
  dorPorTipoTreino, acwr, volumeCorrida, pesoCorporal,
} from "../../lib/relatorios.js";
import { color, space, type as ty, touch } from "../../lib/tokens.js";

const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, minHeight: touch.min, display: "flex", alignItems: "center", gap: 6 };
const PERIODOS = [["7d", "7 dias"], ["30d", "30 dias"], ["90d", "90 dias"], ["tudo", "Tudo"]];

export default function Relatorios({ eventos, hojeISO, cargas, macrofase, testesLog, dorLog, onBack }) {
  const [periodo, setPeriodo] = useState("30d");
  const { desde, ate } = periodoParaDatas(periodo, hojeISO);

  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.xl + "px " + space.lg + "px", maxWidth: 480, margin: "0 auto" }}>
      <button onClick={onBack} style={backBtn}><Icon name="chevronLeft" size={16} /> Voltar</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: space.lg, marginTop: space.sm }}>
        <Icon name="chart" size={22} />
        <h1 style={{ fontSize: ty.display, fontWeight: 800 }}>Relatórios</h1>
      </div>

      <div style={{ display: "flex", gap: space.sm, marginBottom: space.lg }}>
        {PERIODOS.map(([key, label]) => (
          <button key={key} onClick={() => setPeriodo(key)}
            style={{
              flex: 1, minHeight: touch.min * 0.6, borderRadius: 10, border: "1px solid " + (periodo === key ? color.musc : color.border),
              background: periodo === key ? color.musc + "1a" : "transparent", color: periodo === key ? color.text : color.textDim,
              fontSize: ty.xs, fontWeight: 700, cursor: "pointer",
            }}>
            {label}
          </button>
        ))}
      </div>

      <Relatorio1Aderencia dados={aderenciaRehab(eventos, desde, ate)} />
      <Relatorio2Dor dados={dorAoLongoDoTempo(eventos, desde, ate)} />
      <Relatorio3DorAderencia dados={dorPorAderencia(eventos, desde, ate)} />
      <Relatorio4DorPorTipo dados={dorPorTipoTreino(eventos, desde, ate)} />
      <Relatorio5Acwr dados={acwr(eventos, hojeISO)} />
      <Relatorio6Progressao cargas={cargas} />
      <Relatorio7VolumeCorrida dados={volumeCorrida(eventos, desde, ate)} />
      <Relatorio8Peso dados={pesoCorporal(eventos)} />
      <Relatorio9Gate macrofase={macrofase} testesLog={testesLog} dorLog={dorLog} hojeISO={hojeISO} />
      <Relatorio10Export eventos={eventos} />
    </div>
  );
}
