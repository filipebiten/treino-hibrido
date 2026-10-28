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
import Relatorio11CargaPe from "./Relatorio11CargaPe.jsx";
import {
  periodoParaDatas, aderenciaRehab, aderenciaRathleff, dorAoLongoDoTempo, dorPorAderencia,
  dorPorTipoTreino, acwr, volumeCorrida, pesoCorporal, volumePorGrupo, sugerirDeload, srpeCorrida,
  dorPorCargaPe,
} from "../../lib/relatorios.js";
import { color, space, type as ty, touch, radius } from "../../lib/tokens.js";

const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, minHeight: touch.min, display: "flex", alignItems: "center", gap: 6 };
const PERIODOS = [["7d", "7 dias"], ["30d", "30 dias"], ["90d", "90 dias"], ["tudo", "Tudo"]];

// Bloco 1.2 — entrada manual da média de passos/dia que o app Saúde do iPhone já exibe.
// Deliberadamente magro: sem parsing de export, campo semanal só.
function PassosSemanaCard({ valorAtual, onRegistrar }) {
  const [valor, setValor] = useState(valorAtual != null ? String(valorAtual) : "");
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm }}>Passos/dia essa semana</div>
      <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: space.sm }}>Média que o app Saúde do iPhone já mostra — só copiar o número.</div>
      <div style={{ display: "flex", gap: space.sm }}>
        <input type="number" inputMode="numeric" value={valor} onChange={e => setValor(e.target.value)} placeholder="ex: 6500"
          style={{ flex: 1, minHeight: touch.min, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.md, padding: "0 12px" }} />
        <button onClick={() => valor && onRegistrar(Number(valor))}
          style={{ minHeight: touch.min, padding: "0 20px", borderRadius: radius.md, border: "none", background: color.success, color: "#0f1115", fontWeight: 700, cursor: "pointer" }}>Salvar</button>
      </div>
    </div>
  );
}

export default function Relatorios({ eventos, hojeISO, cargas, macrofase, testesLog, dorLog, onBack, passosSemanaAtual, onRegistrarPassosSemana }) {
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

      <Relatorio1Aderencia dados={aderenciaRehab(eventos, desde, ate)} rathleff={aderenciaRathleff(eventos, desde, ate)} />
      <Relatorio2Dor dados={dorAoLongoDoTempo(eventos, desde, ate)} />
      <Relatorio3DorAderencia dados={dorPorAderencia(eventos, desde, ate)} />
      <Relatorio4DorPorTipo dados={dorPorTipoTreino(eventos, desde, ate)} />
      <Relatorio5Acwr dados={acwr(eventos, hojeISO)} />
      <Relatorio6Progressao cargas={cargas} volumeGrupo={volumePorGrupo(eventos, desde, ate)} deload={sugerirDeload(cargas)} />
      <Relatorio7VolumeCorrida dados={volumeCorrida(eventos, desde, ate)} srpe={srpeCorrida(eventos, desde, ate)} />
      <Relatorio8Peso dados={pesoCorporal(eventos)} />
      <Relatorio9Gate macrofase={macrofase} testesLog={testesLog} dorLog={dorLog} hojeISO={hojeISO} />
      <Relatorio10Export eventos={eventos} />
      <PassosSemanaCard valorAtual={passosSemanaAtual} onRegistrar={onRegistrarPassosSemana} />
      <Relatorio11CargaPe dados={dorPorCargaPe(eventos, hojeISO)} />
    </div>
  );
}
