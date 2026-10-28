import Icon from "./Icon.jsx";
import { dorAoLongoDoTempo, aderenciaRehab, pesoCorporal } from "../lib/relatorios.js";
import { MARCO_ZERO } from "../data/plano.js";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

// Bloco 6.2 — uma página imprimível pra consulta médica. CSV não serve em consultório;
// isso é pra abrir no celular/notebook e apertar Ctrl+P/Cmd+P na hora da consulta.
const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, minHeight: touch.min, display: "flex", alignItems: "center", gap: 6 };
const linha = { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #ddd", fontSize: 13 };

export default function RelatorioMedico({ eventos, hojeISO, onboarding, onBack }) {
  const dor = dorAoLongoDoTempo(eventos, MARCO_ZERO, hojeISO);
  const aderencia = aderenciaRehab(eventos, MARCO_ZERO, hojeISO);
  const peso = pesoCorporal(eventos);
  const diasLesao = Math.round((new Date(hojeISO) - new Date(MARCO_ZERO)) / 86400000) + 1;
  const dorRecente = dor.pontos.slice(-10);
  const dorMediaAtual = dor.mediaMovel.length ? dor.mediaMovel[dor.mediaMovel.length - 1].media : null;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      <div className="no-print" style={{ background: color.bg, padding: space.md }}>
        <button onClick={onBack} style={backBtn}><Icon name="chevronLeft" size={16} /> Voltar</button>
      </div>
      <div style={{ background: "white", color: "#111", fontFamily: "system-ui", padding: "24px", maxWidth: 680, margin: "0 auto", minHeight: "100vh" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>Relatório — Reabilitação de Fascite Plantar</h1>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 20 }}>Gerado em {hojeISO.split("-").reverse().join("/")} · Treino Híbrido (app pessoal)</div>

        <h2 style={{ fontSize: 14, fontWeight: 800, marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Linha do tempo</h2>
        <div style={linha}><span>Início do protocolo</span><b>{MARCO_ZERO.split("-").reverse().join("/")}</b></div>
        <div style={linha}><span>Dias desde o início</span><b>{diasLesao}</b></div>
        {onboarding && <div style={linha}><span>Dor inicial registrada</span><b>{onboarding.dorInicial}/10</b></div>}

        <h2 style={{ fontSize: 14, fontWeight: 800, marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Dor matinal</h2>
        <div style={linha}><span>Média móvel atual (7 dias)</span><b>{dorMediaAtual != null ? dorMediaAtual + "/10" : "sem dado"}</b></div>
        <div style={linha}><span>Total de registros</span><b>{dor.pontos.length}</b></div>
        {dorRecente.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 12 }}>
            <thead><tr><th style={{ textAlign: "left", borderBottom: "1px solid #999", padding: "4px 0" }}>Data</th><th style={{ textAlign: "right", borderBottom: "1px solid #999", padding: "4px 0" }}>Dor</th></tr></thead>
            <tbody>
              {dorRecente.map(p => (
                <tr key={p.iso}><td style={{ padding: "3px 0" }}>{p.iso.split("-").reverse().join("/")}</td><td style={{ textAlign: "right" }}>{p.nivel}/10</td></tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 style={{ fontSize: 14, fontWeight: 800, marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Aderência ao protocolo</h2>
        <div style={linha}><span>Dose manhã</span><b>{aderencia.manha.pct}% ({aderencia.manha.feitas}/{aderencia.manha.planejadas})</b></div>
        <div style={linha}><span>Dose noite</span><b>{aderencia.noite.pct}% ({aderencia.noite.feitas}/{aderencia.noite.planejadas})</b></div>

        <h2 style={{ fontSize: 14, fontWeight: 800, marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Peso corporal</h2>
        <div style={linha}><span>Registros</span><b>{peso.pontos.length}</b></div>
        {peso.tendencia != null && <div style={linha}><span>Variação no período</span><b>{peso.tendencia > 0 ? "+" : ""}{peso.tendencia}kg</b></div>}

        <div style={{ fontSize: 11, color: "#999", marginTop: 24, lineHeight: 1.5 }}>
          Dado auto-registrado pelo paciente em app pessoal, sem validação clínica. Critério de progressão de fase: Silbernagel (2007).
        </div>

        <button className="no-print" onClick={() => window.print()} style={{ marginTop: 24, width: "100%", minHeight: touch.min, borderRadius: radius.md, border: "none", background: "#111", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Imprimir / Salvar PDF</button>
      </div>
    </>
  );
}
