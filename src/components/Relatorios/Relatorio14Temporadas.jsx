import { useState } from "react";
import { color, space, type as ty, radius, touch } from "../../lib/tokens.js";

const FASES = [["base", "Base"], ["build", "Build"], ["pico", "Pico"], ["taper", "Taper"], ["recuperacao", "Recuperação"], ["manutencao", "Manutenção"]];
const label = { fontSize: ty.xs, color: color.textDim, fontWeight: 700, marginBottom: 4, display: "block" };
const inputSm = { minHeight: touch.min * 0.6, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.sm, padding: "0 10px" };

// Bloco 4.1 estrutura de temporadas + 4.8 calendário de provas. Registro paralelo à
// macrofase existente (plano.js) — o usuário gerencia manualmente, não dirige o app
// sozinho. "Não encurtar": o roteiro do spec é 10km/2026 → meia/2027 → maratona/2028,
// sem pular a meia (volume triplica da meia pra maratona).
export default function Relatorio14Temporadas({ temporadas, hojeISO, onAdicionar, onRemover }) {
  const [nome, setNome] = useState("");
  const [prova, setProva] = useState("");
  const [dataProva, setDataProva] = useState("");
  const [distanciaProvaKm, setDistanciaProvaKm] = useState("");
  const [volumePicoSemanalKm, setVolumePicoSemanalKm] = useState("");
  const [fase, setFase] = useState("base");

  function salvar() {
    if (!nome.trim() || !dataProva) return;
    onAdicionar({ nome: nome.trim(), prova: prova.trim() || null, dataProva, distanciaProvaKm: Number(distanciaProvaKm) || null, volumePicoSemanalKm: Number(volumePicoSemanalKm) || null, fase });
    setNome(""); setProva(""); setDataProva(""); setDistanciaProvaKm(""); setVolumePicoSemanalKm(""); setFase("base");
  }

  const ordenadas = [...temporadas].sort((a, b) => a.dataProva < b.dataProva ? -1 : 1);

  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm }}>14. Temporadas e calendário de provas</div>

      {ordenadas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: space.md }}>
          {ordenadas.map(t => {
            const dias = Math.round((new Date(t.dataProva) - new Date(hojeISO)) / 86400000);
            return (
              <div key={t.id} style={{ padding: space.sm, borderRadius: radius.md, border: "1px solid " + color.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: ty.sm, fontWeight: 700 }}>{t.nome}{t.prova && " — " + t.prova}</div>
                    <div style={{ fontSize: ty.xs, color: color.textFaint }}>
                      {t.dataProva.split("-").reverse().join("/")} · {dias >= 0 ? `faltam ${dias}d` : `há ${-dias}d`}
                      {t.distanciaProvaKm && ` · ${t.distanciaProvaKm}km`}{t.volumePicoSemanalKm && ` · pico ${t.volumePicoSemanalKm}km/sem`} · {FASES.find(f => f[0] === t.fase)?.[1] || t.fase}
                    </div>
                  </div>
                  <button onClick={() => onRemover(t.id)} style={{ background: "none", border: "none", color: color.textFaint, cursor: "pointer", fontSize: ty.sm }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: space.sm, flexWrap: "wrap", marginBottom: space.sm }}>
        <div style={{ flex: 1, minWidth: 100 }}><span style={label}>Nome</span><input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="ex: 10km Dez/2026" style={{ ...inputSm, width: "100%" }} /></div>
        <div style={{ flex: 1, minWidth: 100 }}><span style={label}>Prova</span><input type="text" value={prova} onChange={e => setProva(e.target.value)} placeholder="opcional" style={{ ...inputSm, width: "100%" }} /></div>
      </div>
      <div style={{ display: "flex", gap: space.sm, flexWrap: "wrap", marginBottom: space.sm }}>
        <div><span style={label}>Data</span><input type="date" value={dataProva} onChange={e => setDataProva(e.target.value)} style={inputSm} /></div>
        <div><span style={label}>km prova</span><input type="number" value={distanciaProvaKm} onChange={e => setDistanciaProvaKm(e.target.value)} style={{ ...inputSm, width: 70 }} /></div>
        <div><span style={label}>Pico sem.</span><input type="number" value={volumePicoSemanalKm} onChange={e => setVolumePicoSemanalKm(e.target.value)} style={{ ...inputSm, width: 70 }} /></div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: space.sm }}>
        {FASES.map(([v, l]) => (
          <div key={v} onClick={() => setFase(v)} style={{ padding: "6px 10px", borderRadius: radius.pill, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid " + (fase === v ? color.musc : color.border), background: fase === v ? color.musc + "22" : "transparent", color: color.text }}>{l}</div>
        ))}
      </div>
      <button onClick={salvar} style={{ width: "100%", minHeight: touch.min * 0.7, borderRadius: radius.md, border: "none", background: color.surfaceAlt, color: color.text, fontWeight: 700, cursor: "pointer" }}>+ temporada</button>
    </div>
  );
}
