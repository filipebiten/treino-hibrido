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
