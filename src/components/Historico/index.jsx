import { useState } from "react";
import Icon from "../Icon.jsx";
import Heatmap from "./Heatmap.jsx";
import Timeline from "./Timeline.jsx";
import DiaEdit from "./DiaEdit.jsx";
import { agruparPorDia, aplicarEdicaoDia } from "../../lib/eventos.js";
import { MARCO_ZERO } from "../../data/plano.js";
import { color, space, type as ty, touch } from "../../lib/tokens.js";

const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, minHeight: touch.min, display: "flex", alignItems: "center", gap: 6 };

export default function Historico({ eventos, hojeISO, onBack, onEventosChange }) {
  const [aba, setAba] = useState("calendario");
  const [mesCursor, setMesCursor] = useState({ ano: Number(hojeISO.slice(0, 4)), mes: Number(hojeISO.slice(5, 7)) - 1 });
  const [diaEditando, setDiaEditando] = useState(null);

  const diasResumo = agruparPorDia(eventos);

  function mudarMes(delta) {
    setMesCursor(({ ano, mes }) => {
      let m = mes + delta, a = ano;
      if (m < 0) { m = 11; a--; } else if (m > 11) { m = 0; a++; }
      return { ano: a, mes: m };
    });
  }

  function salvarDia(edicao) {
    const retroativo = diaEditando < hojeISO;
    onEventosChange(aplicarEdicaoDia(eventos, diaEditando, edicao, retroativo));
    setDiaEditando(null);
  }

  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.xl + "px " + space.lg + "px", maxWidth: 480, margin: "0 auto" }}>
      <button onClick={onBack} style={backBtn}><Icon name="chevronLeft" size={16} /> Voltar</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: space.lg, marginTop: space.sm }}>
        <Icon name="history" size={22} />
        <h1 style={{ fontSize: ty.display, fontWeight: 800 }}>Histórico</h1>
      </div>

      <div style={{ display: "flex", gap: space.sm, marginBottom: space.lg }}>
        {[["calendario", "calendar", "Calendário"], ["timeline", "list", "Linha do tempo"]].map(([key, icon, texto]) => (
          <button key={key} onClick={() => setAba(key)}
            style={{
              flex: 1, minHeight: touch.min * 0.7, borderRadius: 10, border: "1px solid " + (aba === key ? color.musc : color.border),
              background: aba === key ? color.musc + "1a" : "transparent", color: aba === key ? color.text : color.textDim,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: ty.xs, fontWeight: 700, cursor: "pointer",
            }}>
            <Icon name={icon} size={14} /> {texto}
          </button>
        ))}
      </div>

      {aba === "calendario"
        ? <Heatmap diasResumo={diasResumo} ano={mesCursor.ano} mes={mesCursor.mes} hojeISO={hojeISO} marcoZero={MARCO_ZERO}
            onMudarMes={mudarMes} onSelecionarDia={setDiaEditando} />
        : <Timeline diasResumo={diasResumo} marcoZero={MARCO_ZERO} hojeISO={hojeISO} onSelecionarDia={setDiaEditando} />}

      {diaEditando && (
        <DiaEdit iso={diaEditando} resumoDia={diasResumo[diaEditando]} onFechar={() => setDiaEditando(null)} onSalvar={salvarDia} />
      )}
    </div>
  );
}
