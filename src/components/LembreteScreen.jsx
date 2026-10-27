import { useState } from "react";
import Icon from "./Icon.jsx";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

const backBtn = { background: "none", border: "none", color: color.textDim, fontSize: ty.base, cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 6, minHeight: touch.min };

const LEMBRETES = [
  { hora: "06:00", texto: "Rehab manhã — Treino Híbrido" },
  { hora: "21:30", texto: "Rehab noite — Treino Híbrido" },
];

// Notificação agendada não existe em PWA no iOS sem backend (Notification Triggers nunca
// saiu de trial). O caminho confiável é o app Lembretes do iPhone — este é o caminho
// principal, não um plano B.
export default function LembreteScreen({ onBack }) {
  const [copiado, setCopiado] = useState(null);

  function copiar(texto, idx) {
    try {
      navigator.clipboard.writeText(texto);
      setCopiado(idx);
      setTimeout(() => setCopiado(null), 2000);
    } catch { /* clipboard indisponível */ }
  }

  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.xl + "px " + space.lg + "px", maxWidth: 480, margin: "0 auto" }}>
      <button onClick={onBack} style={backBtn}><Icon name="chevronLeft" size={16} /> Voltar</button>

      <div style={{ textAlign: "center", marginBottom: space.lg, marginTop: space.sm }}>
        <Icon name="check" size={28} color={color.success} />
        <h1 style={{ fontSize: ty.display, fontWeight: 800, marginTop: 8 }}>Lembretes</h1>
        <div style={{ fontSize: ty.xs, color: color.textDim, marginTop: 4 }}>O jeito que realmente funciona no iPhone</div>
      </div>

      <div style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg, border: "1px solid " + color.border }}>
        <div style={{ fontSize: ty.sm, color: color.textDim, lineHeight: 1.6 }}>
          O app não consegue agendar notificação sozinho fora de quando está aberto — o iOS não
          permite isso pra um app instalado da web. O caminho confiável é criar dois lembretes
          recorrentes no app <b>Lembretes</b> do iPhone. Leva 1 minuto, uma vez só.
        </div>
      </div>

      {LEMBRETES.map((l, i) => (
        <div key={i} style={{ background: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.sm, border: "1px solid " + color.border, display: "flex", justifyContent: "space-between", alignItems: "center", gap: space.sm }}>
          <div>
            <div style={{ fontSize: ty.md, fontWeight: 800 }}>{l.hora}</div>
            <div style={{ fontSize: ty.sm, color: color.textDim }}>{l.texto}</div>
          </div>
          <button onClick={() => copiar(l.texto, i)} style={{ minHeight: touch.min * 0.7, padding: "0 14px", borderRadius: radius.md, border: "1px solid " + color.border, background: "transparent", color: color.text, fontSize: ty.xs, fontWeight: 700, cursor: "pointer" }}>
            {copiado === i ? "Copiado!" : "Copiar texto"}
          </button>
        </div>
      ))}

      <div style={{ marginTop: space.lg, padding: space.md, background: color.surfaceAlt, borderRadius: radius.lg }}>
        <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.text, marginBottom: 6 }}>Como criar no app Lembretes</div>
        <div style={{ fontSize: ty.sm, color: color.textDim, lineHeight: 1.8 }}>
          1. Abra o app Lembretes, toque em "Novo Lembrete" e cole o texto copiado.<br />
          2. Toque no lembrete criado → "Data" → ative e escolha o horário (06:00 ou 21:30).<br />
          3. Em "Repetir", escolha "Diariamente".
        </div>
      </div>
    </div>
  );
}
