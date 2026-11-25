// ══════════════════════ SOM + VIBRAÇÃO — timer zerou (academia é barulhenta) ══════════════════════
export function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1100, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = f; o.type = "sine";
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
      o.start(t); o.stop(t + 0.22);
    });
  } catch { /* Web Audio indisponível */ }
}

export function vibrar(padrao) {
  try { if (navigator.vibrate) navigator.vibrate(padrao || [200, 80, 200]); } catch { /* vibração indisponível */ }
}

export function avisar() { playBeep(); vibrar(); }

// ══════════════════════ METRÔNOMO DE CADÊNCIA (Bloco 2) ══════════════════════
// Clique curto e seco (ruído filtrado, ~25ms, volume baixo) — de propósito diferente do beep
// tonal de fim de timer. Agendamento com lookahead no relógio do AudioContext (setInterval
// sozinho deriva). Não funciona com tela bloqueada no iOS — quem chama segura Wake Lock.
export function criarMetronomo() {
  let ctx = null, ppm = 160, proximo = 0, timer = null, ruido = null;
  function clique(t) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = ruido; f.type = "highpass"; f.frequency.value = 2500;
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    src.start(t); src.stop(t + 0.03);
  }
  function agendar() {
    while (proximo < ctx.currentTime + 0.12) { clique(proximo); proximo += 60 / ppm; }
  }
  return {
    iniciar(novoPpm) {
      try {
        if (novoPpm) ppm = novoPpm;
        if (!ctx) {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          ruido = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.03), ctx.sampleRate);
          const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        if (ctx.state === "suspended") ctx.resume();
        clearInterval(timer);
        proximo = ctx.currentTime + 0.05;
        timer = setInterval(agendar, 25);
        return true;
      } catch { return false; }
    },
    definirPpm(novoPpm) { ppm = novoPpm; },
    parar() { clearInterval(timer); timer = null; },
    fechar() { clearInterval(timer); timer = null; try { if (ctx) ctx.close(); } catch { /* já fechado */ } ctx = null; },
  };
}
