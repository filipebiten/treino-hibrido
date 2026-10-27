// ══════════════════════ LEMBRETE — Badging API (sem permissão, sem agendamento) ══════════════════════
// Notificação local agendada não existe em PWA no iOS (Notification Triggers nunca saiu de
// trial; sem backend não há push). O badge + o fallback pro app Lembretes do iPhone são o
// que realmente funciona — ver LembreteScreen.jsx.

export function atualizarBadge(pendentes) {
  try {
    if (!navigator.setAppBadge) return;
    if (pendentes > 0) navigator.setAppBadge(pendentes);
    else if (navigator.clearAppBadge) navigator.clearAppBadge();
  } catch { /* Badging API indisponível neste navegador */ }
}
