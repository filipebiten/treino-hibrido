import { useEffect, useRef, useState } from "react";
import { criarMetronomo } from "../lib/audio.js";
import { pedirWakeLock } from "../lib/wakelock.js";
import { METRONOMO_MIN, METRONOMO_MAX } from "../lib/cadencia.js";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

const passo = { minWidth: touch.min, minHeight: touch.min, borderRadius: radius.sm, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.md, fontWeight: 700, cursor: "pointer" };

// Bloco 2 — metrônomo de cadência (150-180 PPM, passo 1). Visível em sessões de corrida.
// Wake Lock mantém a tela acesa: com tela bloqueada o iOS corta áudio em segundo plano.
export default function Metronomo({ preset, avisado, onAvisado }) {
  const [ppm, setPpm] = useState(preset);
  const [tocando, setTocando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const motor = useRef(null);

  useEffect(() => () => { if (motor.current) motor.current.fechar(); }, []);

  function mudar(v) {
    const n = Math.max(METRONOMO_MIN, Math.min(METRONOMO_MAX, v));
    setPpm(n);
    if (motor.current) motor.current.definirPpm(n);
  }
  function alternar() {
    if (tocando) { motor.current.parar(); setTocando(false); return; }
    if (!motor.current) motor.current = criarMetronomo();
    if (motor.current.iniciar(ppm)) { setTocando(true); pedirWakeLock(); }
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} style={{ width: "100%", minHeight: 40, marginBottom: space.md, borderRadius: radius.md, border: "1px solid " + color.border, background: "none", color: color.textDim, fontSize: ty.xs, cursor: "pointer" }}>
        Metrônomo de cadência ({ppm} PPM)
      </button>
    );
  }
  return (
    <div style={{ marginBottom: space.md, padding: space.md, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surface }}>
      {!avisado && (
        <div style={{ fontSize: ty.xs, color: color.textDim, marginBottom: space.sm, lineHeight: 1.5 }}>
          Deixe a tela acesa enquanto corre: com a tela bloqueada o iPhone pode cortar o som. O app já pede pra tela não apagar.{" "}
          <button onClick={onAvisado} style={{ background: "none", border: "none", color: color.text, fontSize: ty.xs, fontWeight: 700, cursor: "pointer", padding: 0 }}>Entendi</button>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: space.sm }}>
        <button onClick={() => mudar(ppm - 1)} aria-label="Diminuir 1 PPM" style={passo}>−</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: ty.xl, fontWeight: 800 }}>{ppm}</div>
          <div style={{ fontSize: ty.xs, color: color.textFaint }}>passos/min</div>
        </div>
        <button onClick={() => mudar(ppm + 1)} aria-label="Aumentar 1 PPM" style={passo}>+</button>
        <button onClick={alternar} style={{ ...passo, minWidth: 84, background: tocando ? color.alert : color.success, color: "#0f1115", border: "none" }}>{tocando ? "Parar" : "Iniciar"}</button>
      </div>
      <input type="range" min={METRONOMO_MIN} max={METRONOMO_MAX} step={1} value={ppm} onChange={e => mudar(Number(e.target.value))} aria-label="Cadência do metrônomo" style={{ width: "100%", marginTop: space.sm }} />
    </div>
  );
}
