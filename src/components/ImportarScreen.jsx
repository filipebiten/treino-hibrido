import { useState } from "react";
import Icon from "./Icon.jsx";
import { validarImportacao, prepararPreview, diasComMergePendente } from "../lib/importacao.js";
import { color, space, type as ty, touch, radius } from "../lib/tokens.js";

const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, minHeight: touch.min, display: "flex", alignItems: "center", gap: 6 };
const card = { background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.md, border: "1px solid " + color.border };
const btnPrimario = { width: "100%", minHeight: touch.min, borderRadius: radius.md, border: "none", background: color.success, color: "#0f1115", fontWeight: 700, fontSize: ty.md, cursor: "pointer" };
const btnLink = { background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer", minHeight: 44, textAlign: "center", width: "100%" };

const CONTRATO_JSON = `{
  "versao": 1,
  "gerado": "AAAA-MM-DD",
  "passos": [{ "data": "AAAA-MM-DD", "total": 7421 }],
  "treinos": [{ "data": "AAAA-MM-DD", "tipo": "corrida", "distanciaKm": 4.2, "duracaoMin": 32, "fcMedia": 138, "cadencia": 168 }],
  "peso": [{ "data": "AAAA-MM-DD", "kg": 86.8 }]
}`;

// Bloco 3 — importação do Atalho do iPhone, via clipboard (gesto do usuário obrigatório no
// iOS) com fallback textarea e fallback arquivo. Sem parsing do export.xml do Apple Saúde
// (arquivo gigante, trava navegador — ver CLAUDE.md "o que NÃO fazer").
export default function ImportarScreen({ eventos, onBack, onImportar, onMesclarTreino }) {
  const [erro, setErro] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mostrarTextarea, setMostrarTextarea] = useState(false);
  const [textoColado, setTextoColado] = useState("");
  const [importado, setImportado] = useState(false);
  const [camposCopiados, setCamposCopiados] = useState(false);

  function processar(texto) {
    const r = validarImportacao(texto);
    if (!r.ok) { setErro(r.erro); setPreview(null); return; }
    setErro(null);
    setPreview({ dados: r.dados, resumo: prepararPreview(r.dados, eventos) });
  }

  async function colar() {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) { setMostrarTextarea(true); return; }
      const texto = await navigator.clipboard.readText();
      processar(texto);
    } catch {
      setMostrarTextarea(true);
    }
  }

  function confirmarImportacao() {
    onImportar(preview.dados);
    setPreview(null);
    setImportado(true);
    setTextoColado("");
    setMostrarTextarea(false);
  }

  function lerArquivo(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => processar(String(reader.result));
    reader.readAsText(file);
    e.target.value = "";
  }

  async function copiarCampos() {
    try { await navigator.clipboard.writeText(CONTRATO_JSON); setCamposCopiados(true); setTimeout(() => setCamposCopiados(false), 2000); } catch { /* sem permissão de clipboard */ }
  }

  const pendentes = diasComMergePendente(eventos);

  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.xl + "px " + space.lg + "px", maxWidth: 480, margin: "0 auto" }}>
      <button onClick={onBack} style={backBtn}><Icon name="chevronLeft" size={16} /> Voltar</button>
      <h1 style={{ fontSize: ty.display, fontWeight: 800, marginBottom: space.sm, marginTop: space.sm }}>Importar do iPhone</h1>
      <div style={{ fontSize: ty.xs, color: color.textDim, marginBottom: space.lg, lineHeight: 1.5 }}>
        O app não consegue ler o Saúde sozinho — o iOS não deixa um app web acessar o HealthKit. O Atalho é a ponte: ele lê o Saúde e copia um JSON pra área de transferência; o toque em "Colar" aqui é a única parte manual.
      </div>

      {!preview && !importado && (
        <>
          <button onClick={colar} style={{ ...btnPrimario, marginBottom: space.sm }}>Colar dados do iPhone</button>
          {!mostrarTextarea && <button onClick={() => setMostrarTextarea(true)} style={btnLink}>ou colar manualmente</button>}
          {mostrarTextarea && (
            <div style={{ marginTop: space.sm }}>
              <textarea value={textoColado} onChange={e => setTextoColado(e.target.value)} placeholder="Cole aqui o JSON do Atalho"
                style={{ width: "100%", minHeight: 100, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.sm, padding: space.sm, fontFamily: "monospace", marginBottom: space.sm }} />
              <button onClick={() => processar(textoColado)} style={btnPrimario}>Importar</button>
            </div>
          )}
          <label style={{ display: "block", textAlign: "center", marginTop: space.md, fontSize: ty.xs, color: color.textFaint, cursor: "pointer", minHeight: 44, lineHeight: "44px" }}>
            ou escolher arquivo .json
            <input type="file" accept=".json,application/json" onChange={lerArquivo} style={{ display: "none" }} />
          </label>
          {erro && <div style={{ color: color.alert, fontSize: ty.xs, marginTop: space.sm, textAlign: "center" }}>{erro}</div>}
        </>
      )}

      {preview && (
        <div style={card}>
          <div style={{ fontSize: ty.sm, marginBottom: space.md }}>
            {preview.resumo.passos} dia(s) de passos, {preview.resumo.treinos} treino(s), {preview.resumo.peso} peso(s)
            {preview.resumo.pesoIgnorados > 0 && ` — ${preview.resumo.pesoIgnorados} peso(s) ignorado(s) por já ter registro manual nesse dia`} — importar?
          </div>
          <div style={{ display: "flex", gap: space.sm }}>
            <button onClick={confirmarImportacao} style={{ ...btnPrimario, flex: 1 }}>Importar</button>
            <button onClick={() => setPreview(null)} style={{ minHeight: touch.min, padding: "0 16px", borderRadius: radius.md, border: "1px solid " + color.border, background: "transparent", color: color.textDim, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {importado && (
        <div style={{ ...card, border: "1px solid " + color.success + "55", background: color.success + "12" }}>
          <div style={{ fontSize: ty.sm }}>Importado.</div>
        </div>
      )}

      {pendentes.length > 0 && (
        <div style={{ marginBottom: space.lg }}>
          <div style={{ fontSize: ty.xs, color: color.textDim, marginBottom: space.sm }}>Treino registrado no app e no Saúde no mesmo dia — mesclar o campo que falta (distância, tempo, FC, cadência)?</div>
          {pendentes.map(iso => (
            <div key={iso} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", padding: space.sm }}>
              <span style={{ fontSize: ty.sm }}>{iso.split("-").reverse().join("/")}</span>
              <button onClick={() => onMesclarTreino(iso)} style={{ minHeight: 36, padding: "0 14px", borderRadius: radius.sm, border: "none", background: color.surfaceAlt, color: color.text, fontWeight: 700, fontSize: ty.xs, cursor: "pointer" }}>Mesclar</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: space.xl, borderTop: "1px solid " + color.border, paddingTop: space.lg }}>
        <h2 style={{ fontSize: ty.md, fontWeight: 800, marginBottom: space.sm }}>Como montar o Atalho</h2>
        <ol style={{ fontSize: ty.xs, color: color.textDim, lineHeight: 1.8, paddingLeft: 18, marginBottom: space.md }}>
          <li>"Obter amostras de saúde" → Contagem de passos → últimos 30 dias</li>
          <li>"Obter amostras de saúde" → Treinos → últimos 30 dias</li>
          <li>"Obter amostras de saúde" → Peso corporal → últimos 30 dias</li>
          <li>"Repetir com cada" + "Definir valor do dicionário" pra montar o JSON (nomes de campo abaixo)</li>
          <li>"Copiar para a área de transferência"</li>
        </ol>
        <button onClick={copiarCampos} style={{ width: "100%", textAlign: "left", background: color.surfaceAlt, border: "1px solid " + color.border, borderRadius: radius.md, padding: space.sm, cursor: "pointer", marginBottom: space.md }}>
          <div style={{ fontSize: ty.xs, color: color.textFaint, marginBottom: 4 }}>{camposCopiados ? "Copiado!" : "Toque pra copiar os nomes exatos dos campos"}</div>
          <pre style={{ fontSize: 10, color: color.textDim, whiteSpace: "pre-wrap", margin: 0, fontFamily: "monospace" }}>{CONTRATO_JSON}</pre>
        </button>
        <div style={{ fontSize: ty.xs, color: color.textDim, lineHeight: 1.6 }}>
          <b>Automação diária:</b> Atalhos → aba Automação → Nova → Hora do Dia → 06:00 → Diariamente → escolher esse atalho → ativar "Executar imediatamente" (sem isso vira notificação e perde o sentido). Não precisa de ícone na Tela de Início — a automação roda sozinha; o toque em "Colar dados do iPhone" aqui é a única parte manual.
        </div>
      </div>
    </div>
  );
}
