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
import Relatorio12Intensidade from "./Relatorio12Intensidade.jsx";
import {
  periodoParaDatas, aderenciaRehab, aderenciaRathleff, dorAoLongoDoTempo, dorPorAderencia,
  dorPorTipoTreino, acwr, volumeCorrida, pesoCorporal, volumePorGrupo, sugerirDeload, srpeCorrida,
  dorPorCargaPe,
} from "../../lib/relatorios.js";
import { distribuicaoIntensidade } from "../../lib/agendamento.js";
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

// Bloco 1.4 — rastreio de calçado. Só km (sem horas — versão magra, km é a métrica que
// importa pro alerta de troca). Lista + alerta só aparecem com 2+ pares cadastrados,
// como pede a spec — com 1 par só não há decisão a tomar.
const ALERTA_KM = 600;
function TenisCard({ tenis, onAdicionar, onRegistrarKm, onRemover }) {
  const [nomeNovo, setNomeNovo] = useState("");
  const [kmAdicional, setKmAdicional] = useState({});
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm }}>Calçado de corrida</div>
      {tenis.length >= 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: space.md }}>
          {tenis.map(t => (
            <div key={t.id} style={{ padding: space.sm, borderRadius: radius.md, border: "1px solid " + (t.km >= ALERTA_KM ? color.alert : color.border), background: t.km >= ALERTA_KM ? color.alert + "12" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: ty.sm, fontWeight: 700 }}>{t.nome}</span>
                <span style={{ fontSize: ty.sm, fontWeight: 700, color: t.km >= ALERTA_KM ? color.alert : color.text }}>{t.km}km</span>
              </div>
              {t.km >= ALERTA_KM && <div style={{ fontSize: ty.xs, color: color.alert, marginBottom: 6 }}>Passou de 600km — amortecimento já deve estar comprometido, considera trocar.</div>}
              <div style={{ display: "flex", gap: 6 }}>
                <input type="number" inputMode="decimal" value={kmAdicional[t.id] || ""} onChange={e => setKmAdicional({ ...kmAdicional, [t.id]: e.target.value })} placeholder="+km"
                  style={{ flex: 1, minHeight: 36, borderRadius: radius.sm, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.sm, padding: "0 8px" }} />
                <button onClick={() => { const v = Number(kmAdicional[t.id]); if (v) { onRegistrarKm(t.id, v); setKmAdicional({ ...kmAdicional, [t.id]: "" }); } }}
                  style={{ minHeight: 36, padding: "0 14px", borderRadius: radius.sm, border: "none", background: color.surfaceAlt, color: color.text, fontWeight: 700, cursor: "pointer" }}>+</button>
                <button onClick={() => onRemover(t.id)} style={{ minHeight: 36, padding: "0 10px", borderRadius: radius.sm, border: "1px solid " + color.border, background: "transparent", color: color.textFaint, cursor: "pointer" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {tenis.length === 1 && <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: space.md }}>Cadastre um 2º par pra ativar o rastreio de km e o alerta de troca.</div>}
      <div style={{ display: "flex", gap: space.sm }}>
        <input type="text" value={nomeNovo} onChange={e => setNomeNovo(e.target.value)} placeholder="ex: Asics Gel 2026"
          style={{ flex: 1, minHeight: touch.min, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.sm, padding: "0 12px" }} />
        <button onClick={() => { if (nomeNovo.trim()) { onAdicionar(nomeNovo.trim()); setNomeNovo(""); } }}
          style={{ minHeight: touch.min, padding: "0 16px", borderRadius: radius.md, border: "none", background: color.surfaceAlt, color: color.text, fontWeight: 700, cursor: "pointer" }}>+ par</button>
      </div>
    </div>
  );
}

// Bloco 2.5 — marcar semanas futuras (eventos, retiros, viagens) sem esperar a segunda
// chegar. Lista as próximas 6 segundas-feiras.
function segundasFuturas(hojeISO, n) {
  const out = [];
  const d = new Date(hojeISO + "T00:00:00");
  const offset = d.getDay() === 0 ? 6 : d.getDay() - 1;
  const segundaAtual = new Date(d.getTime() - offset * 86400000);
  for (let i = 0; i < n; i++) {
    const dt = new Date(segundaAtual.getTime() + i * 7 * 86400000);
    const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, "0"), dd = String(dt.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${dd}`);
  }
  return out;
}
function SemanasFuturasCard({ hojeISO, semanasDeclaradas, onDeclarar }) {
  const semanas = segundasFuturas(hojeISO, 6);
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm }}>Planejar semanas</div>
      <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: space.sm }}>Marca de antemão uma semana apertada (viagem, evento) — vira modo manutenção, sem contar como falha.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {semanas.map(iso => {
          const dataFmt = iso.split("-").reverse().join("/");
          const atual = semanasDeclaradas[iso];
          return (
            <div key={iso} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
              <span style={{ fontSize: ty.xs, color: color.textDim, minWidth: 70 }}>{dataFmt}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => onDeclarar(iso, "normal")} style={{ minHeight: 32, padding: "0 10px", borderRadius: radius.sm, border: "1px solid " + (atual === "normal" ? color.success : color.border), background: atual === "normal" ? color.success + "1a" : "transparent", color: color.text, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Normal</button>
                <button onClick={() => onDeclarar(iso, "apertada")} style={{ minHeight: 32, padding: "0 10px", borderRadius: radius.sm, border: "1px solid " + (atual === "apertada" ? color.alert : color.border), background: atual === "apertada" ? color.alert + "1a" : "transparent", color: color.text, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Apertada</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 3.2 — prioridade da temporada. Nunca zera a outra modalidade, só afeta a ordem
// sugerida quando dois treinos caem no mesmo dia (ver R3 em lib/agendamento.js).
const PRIORIDADES = [["corrida", "Corrida"], ["equilibrio", "Equilíbrio"], ["musculacao", "Musculação"]];
function PrioridadeCard({ valor, onMudar }) {
  return (
    <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm }}>Esta temporada prioriza</div>
      <div style={{ display: "flex", gap: 6 }}>
        {PRIORIDADES.map(([key, label]) => (
          <button key={key} onClick={() => onMudar(key)} style={{ flex: 1, minHeight: 40, borderRadius: radius.sm, border: "1px solid " + (valor === key ? color.musc : color.border), background: valor === key ? color.musc + "1a" : "transparent", color: color.text, fontWeight: 700, fontSize: ty.xs, cursor: "pointer" }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

export default function Relatorios({ eventos, hojeISO, cargas, macrofase, testesLog, dorLog, onBack, passosSemanaAtual, onRegistrarPassosSemana, tenis, onAdicionarTenis, onRegistrarKmTenis, onRemoverTenis, semanasDeclaradas, onDeclararSemana, onAbrirRelatorioMedico, prioridadeTemporada, onMudarPrioridade }) {
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

      <Relatorio1Aderencia dados={aderenciaRehab(eventos, desde, ate, semanasDeclaradas)} rathleff={aderenciaRathleff(eventos, desde, ate)} />
      <Relatorio2Dor dados={dorAoLongoDoTempo(eventos, desde, ate)} />
      <Relatorio3DorAderencia dados={dorPorAderencia(eventos, desde, ate)} />
      <Relatorio4DorPorTipo dados={dorPorTipoTreino(eventos, desde, ate)} />
      <Relatorio5Acwr dados={acwr(eventos, hojeISO)} />
      <Relatorio6Progressao cargas={cargas} volumeGrupo={volumePorGrupo(eventos, desde, ate)} deload={sugerirDeload(cargas)} />
      <Relatorio7VolumeCorrida dados={volumeCorrida(eventos, desde, ate)} srpe={srpeCorrida(eventos, desde, ate)} />
      <Relatorio8Peso dados={pesoCorporal(eventos)} />
      <Relatorio9Gate macrofase={macrofase} testesLog={testesLog} dorLog={dorLog} hojeISO={hojeISO} eventos={eventos} />
      <Relatorio10Export eventos={eventos} />
      <PassosSemanaCard valorAtual={passosSemanaAtual} onRegistrar={onRegistrarPassosSemana} />
      <TenisCard tenis={tenis} onAdicionar={onAdicionarTenis} onRegistrarKm={onRegistrarKmTenis} onRemover={onRemoverTenis} />
      <SemanasFuturasCard hojeISO={hojeISO} semanasDeclaradas={semanasDeclaradas} onDeclarar={onDeclararSemana} />
      <Relatorio11CargaPe dados={dorPorCargaPe(eventos, hojeISO)} />
      <Relatorio12Intensidade dados={distribuicaoIntensidade(eventos, desde, ate)} />
      <PrioridadeCard valor={prioridadeTemporada} onMudar={onMudarPrioridade} />

      <button onClick={onAbrirRelatorioMedico} style={{ width: "100%", minHeight: touch.min, borderRadius: 12, border: "1px solid " + color.border, background: color.surface, color: color.text, fontSize: ty.sm, fontWeight: 700, cursor: "pointer", marginBottom: space.lg }}>Relatório pra consulta médica</button>
    </div>
  );
}
