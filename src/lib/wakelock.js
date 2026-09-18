// ══════════════════════ WAKE LOCK — tela não apaga durante treino/timer ══════════════════════
let sentinel = null;

export async function pedirWakeLock() {
  try {
    if (!("wakeLock" in navigator)) return false;
    sentinel = await navigator.wakeLock.request("screen");
    return true;
  } catch { return false; }
}

export async function liberarWakeLock() {
  try { if (sentinel) { await sentinel.release(); sentinel = null; } } catch { /* já liberado */ }
}

export function reativarWakeLockSeVisivel() {
  try {
    if (sentinel !== null && document.visibilityState === "visible") pedirWakeLock();
  } catch { /* indisponível */ }
}
