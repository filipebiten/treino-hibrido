import { useState } from "react";
import { riegel, zonasDeRitmo, formatarRitmo, ajusteRitmoPorCalor, checarRegra10Porcento, avaliarCadencia } from "../../lib/corrida-temporada.js";
import { color, space, type as ty, radius, touch } from "../../lib/tokens.js";

const numInput = { width: 70, height: touch.min * 0.6, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.md, textAlign: "center" };
const label = { fontSize: ty.xs, color: color.textDim, fontWeight: 700, marginBottom: 4, display: "block" };

// Bloco 4.2/4.3 — teste de campo + zonas de ritmo derivadas. 4.6 — regra dos 10%. 4.7 —
// cadência. 4.4 — ajuste por calor usa o último registro de temperatura/umidade de
// corrida disponível, se houver.
export default function Relatorio13Corrida({ testesCampo, onAdicionarTeste, kmSemanaAtual, kmMedia4Semanas, cadencias, ultimaTemperatura }) {
  const [editando, setEditando] = useState(false);
  const [distancia, setDistancia] = useState("");
  const [minutos, setMinutos] = useState("");
  const [segundos, setSegundos] = useState("");

  const testeMaisRecente = testesCampo.length ? [...testesCampo].sort((a, b) => a.data < b.data ? 1 : -1)[0] : null;
  const ritmoBaseSegPorKm = testeMaisRecente ? Math.round(testeMaisRecente.tempoSeg / testeMaisRecente.distanciaKm) : null;
  const zonas = ritmoBaseSegPorKm ? zonasDeRitmo(ritmoBaseSegPorKm) : null;
  const projecao10k = testeMaisRecente ? riegel(testeMaisRecente.tempoSeg, testeMaisRecente.distanciaKm, 10) : null;
  const regra10 = checarRegra10Porcento(kmSemanaAtual, kmMedia4Semanas);
  const cadenciaInfo = avaliarCadencia(cadencias || []);
  const ajusteCalor = ultimaTemperatura != null && ritmoBaseSegPorKm ? ajusteRitmoPorCalor(ritmoBaseSegPorKm, ultimaTemperatura, null) : null;

  function salvar() {
    const d = Number(distancia), min = Number(minutos) || 0, seg = Number(segundos) || 0;
    if (!d || (!min && !seg)) return;
    onAdicionarTeste({ distanciaKm: d, tempoSeg: min * 60 + seg });
    setDistancia(""); setMinutos(""); setSegundos(""); setEditando(false);
  }

  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.sm }}>
        <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1 }}>13. Teste de campo e zonas de ritmo</div>
        {!editando && <button onClick={() => setEditando(true)} style={{ background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer" }}>+ novo teste</button>}
      </div>
      {editando && (
        <>
          <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: space.sm }}>A cada 6-8 semanas: corre 1km, 3km ou 12min (Cooper) o mais rápido sustentável, registra aqui.</div>
          <div style={{ display: "flex", gap: space.sm, alignItems: "flex-end", marginBottom: space.md }}>
            <div><span style={label}>km</span><input type="number" step="0.1" value={distancia} onChange={e => setDistancia(e.target.value)} style={numInput} /></div>
            <div><span style={label}>min</span><input type="number" value={minutos} onChange={e => setMinutos(e.target.value)} style={numInput} /></div>
            <div><span style={label}>seg</span><input type="number" value={segundos} onChange={e => setSegundos(e.target.value)} style={numInput} /></div>
            <button onClick={salvar} style={{ minHeight: touch.min * 0.6, padding: "0 14px", borderRadius: radius.sm, border: "none", background: color.corrida || color.success, color: "#0f1115", fontWeight: 700, cursor: "pointer" }}>Salvar</button>
          </div>
        </>
      )}

      {zonas ? (
        <div>
          <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: 4 }}>Último teste: {testeMaisRecente.distanciaKm}km em {Math.floor(testeMaisRecente.tempoSeg / 60)}:{String(testeMaisRecente.tempoSeg % 60).padStart(2, "0")} ({testeMaisRecente.data.split("-").reverse().join("/")})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: space.sm }}>
            {[["Regenerativo", zonas.regenerativo], ["Fácil", zonas.facil], ["Moderado", zonas.moderado], ["Longão", zonas.longao], ["Limiar", zonas.limiar], ["Intervalado", zonas.intervalado]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: ty.xs }}><span style={{ color: color.textDim }}>{l}</span><b>{formatarRitmo(v)}</b></div>
            ))}
          </div>
          {projecao10k && <div style={{ fontSize: ty.xs, color: color.textFaint }}>Projeção pra 10km (Riegel): {Math.floor(projecao10k / 60)}min — superestima se ainda não tem base de volume, não é promessa.</div>}
          {ajusteCalor && ajusteCalor.pctAjuste > 0 && (
            <div style={{ fontSize: ty.xs, color: color.alert, marginTop: 6 }}>Com {ultimaTemperatura}°C: ritmo fácil ajustado pra {formatarRitmo(ajusteCalor.ritmoAjustado)} (+{ajusteCalor.pctAjuste}%).</div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: ty.xs, color: color.textFaint }}>Sem teste registrado ainda — sem isso não dá pra calcular zona de ritmo real, só FC.</div>
      )}

      <div style={{ borderTop: "1px solid " + color.border, marginTop: space.md, paddingTop: space.md }}>
        <div style={{ fontSize: ty.xs, color: color.textDim, marginBottom: 4 }}>Progressão de volume (regra dos 10%)</div>
        {regra10.suficiente ? (
          <div style={{ fontSize: ty.xs, color: regra10.violouSubida ? color.alert : color.textDim }}>
            Essa semana: {kmSemanaAtual}km · média 4 semanas: {kmMedia4Semanas}km · limite: {regra10.limiteMax}km
            {regra10.violouSubida && " — subiu mais de 10%, considera segurar o volume essa semana."}
          </div>
        ) : <div style={{ fontSize: ty.xs, color: color.textFaint }}>Sem dado de volume suficiente ainda.</div>}
      </div>

      <div style={{ borderTop: "1px solid " + color.border, marginTop: space.md, paddingTop: space.md }}>
        <div style={{ fontSize: ty.xs, color: color.textDim, marginBottom: 4 }}>Cadência</div>
        {cadenciaInfo.suficiente ? (
          <div style={{ fontSize: ty.xs, color: cadenciaInfo.abaixoDoAlvo ? color.alert : color.textDim }}>
            Média: {cadenciaInfo.media} passos/min{cadenciaInfo.abaixoDoAlvo && ` — abaixo de 165. Subir pra ~${cadenciaInfo.alvoSugerido} é uma das intervenções de maior retorno pra pé plano com fascite.`}
          </div>
        ) : <div style={{ fontSize: ty.xs, color: color.textFaint }}>Sem 3+ registros de cadência ainda.</div>}
      </div>
    </div>
  );
}
