import Icon from "../Icon.jsx";
import { classificarDia } from "../../lib/eventos.js";
import { color, space, type as ty, radius } from "../../lib/tokens.js";

const CORES = {
  forte: color.success, medio: color.success + "66", fraco: color.textFaint + "33", alerta: color.pain + "66", vazio: "transparent",
};
const SIMBOLOS = { forte: "✓", medio: "~", fraco: "·", alerta: "!", vazio: "" };
const NOMES = { forte: "Completo + treino", medio: "Rehab completo", fraco: "Rehab parcial", alerta: "Só treino", vazio: "Sem registro" };

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function diasDoMes(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const ultimo = new Date(ano, mes + 1, 0);
  const offset = primeiro.getDay();
  const celulas = [];
  for (let i = 0; i < offset; i++) celulas.push(null);
  for (let d = 1; d <= ultimo.getDate(); d++) {
    const iso = ano + "-" + String(mes + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    celulas.push(iso);
  }
  return celulas;
}

export default function Heatmap({ diasResumo, ano, mes, hojeISO, marcoZero, onMudarMes, onSelecionarDia }) {
  const celulas = diasDoMes(ano, mes);
  const nomeMes = new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const podeVoltar = ano > Number(marcoZero.slice(0, 4)) || mes > Number(marcoZero.slice(5, 7)) - 1;
  const podeAvancar = (ano < Number(hojeISO.slice(0, 4))) || (ano === Number(hojeISO.slice(0, 4)) && mes < Number(hojeISO.slice(5, 7)) - 1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
        <button onClick={() => podeVoltar && onMudarMes(-1)} disabled={!podeVoltar} style={{ background: "none", border: "none", padding: 8, cursor: podeVoltar ? "pointer" : "default", opacity: podeVoltar ? 1 : 0.3 }}>
          <Icon name="chevronLeft" size={18} color={color.textDim} />
        </button>
        <div style={{ fontSize: ty.md, fontWeight: 800, textTransform: "capitalize" }}>{nomeMes}</div>
        <button onClick={() => podeAvancar && onMudarMes(1)} disabled={!podeAvancar} style={{ background: "none", border: "none", padding: 8, cursor: podeAvancar ? "pointer" : "default", opacity: podeAvancar ? 1 : 0.3 }}>
          <Icon name="chevronRight" size={18} color={color.textDim} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DIAS_SEMANA.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, color: color.textFaint, fontWeight: 700 }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {celulas.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const antesDoInicio = iso < marcoZero, depoisDeHoje = iso > hojeISO;
          const cat = antesDoInicio || depoisDeHoje ? null : classificarDia(diasResumo[iso]);
          const ehHoje = iso === hojeISO;
          return (
            <div key={i}
              onClick={() => !antesDoInicio && !depoisDeHoje && onSelecionarDia(iso)}
              style={{
                position: "relative", aspectRatio: "1", minHeight: 40, borderRadius: radius.sm,
                background: cat ? CORES[cat] : "transparent",
                border: "1px solid " + (ehHoje ? color.musc : color.border),
                opacity: antesDoInicio || depoisDeHoje ? 0.25 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: antesDoInicio || depoisDeHoje ? "default" : "pointer",
              }}>
              <span style={{ fontSize: 11, color: color.text, fontWeight: ehHoje ? 800 : 400 }}>{Number(iso.slice(8, 10))}</span>
              {cat && SIMBOLOS[cat] && <span style={{ position: "absolute", bottom: 2, right: 3, fontSize: 8, color: color.textDim }}>{SIMBOLOS[cat]}</span>}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: space.sm, marginTop: space.lg }}>
        {Object.keys(NOMES).map(cat => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: CORES[cat], border: cat === "vazio" ? "1px solid " + color.border : "none" }} />
            <span style={{ fontSize: 10, color: color.textFaint }}>{NOMES[cat]}{SIMBOLOS[cat] ? " (" + SIMBOLOS[cat] + ")" : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
