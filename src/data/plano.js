// ══════════════════════ PLANO 15 SEMANAS (21/09/2026 → 03/01/2027) ══════════════════════
// Marco zero: segunda-feira 21/09/2026. 4 macrofases, progressão por critério.

export const MARCO_ZERO = "2026-09-21";

export const MACRO_PHASES = [
  { id: 1, nome: "Base", inicio: "2026-09-21", fim: "2026-10-18", semanas: [
    { inicio: "2026-09-21", fim: "2026-09-27" },
    { inicio: "2026-09-28", fim: "2026-10-04" },
    { inicio: "2026-10-05", fim: "2026-10-11" },
    { inicio: "2026-10-12", fim: "2026-10-18" },
  ]},
  { id: 2, nome: "Walk/Run", inicio: "2026-10-19", fim: "2026-11-15", semanas: [
    { inicio: "2026-10-19", fim: "2026-10-25" },
    { inicio: "2026-10-26", fim: "2026-11-01" },
    { inicio: "2026-11-02", fim: "2026-11-08" },
    { inicio: "2026-11-09", fim: "2026-11-15" },
  ]},
  { id: 3, nome: "Contínuo", inicio: "2026-11-16", fim: "2026-12-13", semanas: [
    { inicio: "2026-11-16", fim: "2026-11-22" },
    { inicio: "2026-11-23", fim: "2026-11-29" },
    { inicio: "2026-11-30", fim: "2026-12-06" },
    { inicio: "2026-12-07", fim: "2026-12-13" },
  ]},
  { id: 4, nome: "Meta", inicio: "2026-12-14", fim: "2027-01-03", semanas: [
    { inicio: "2026-12-14", fim: "2026-12-20" },
    { inicio: "2026-12-21", fim: "2026-12-27" },
    { inicio: "2026-12-28", fim: "2027-01-03" },
  ]},
];

export function toISO(date) { const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0"); return y + "-" + m + "-" + d; }
export const dOnly = iso => new Date(iso + "T00:00:00");
export const diffDias = (a, b) => Math.round((dOnly(b) - dOnly(a)) / 86400000);

export function hojeEfetivo(nowMs, diasOffset) { return new Date(nowMs + diasOffset * 86400000); }

// Posição sugerida pelo calendário (referência informativa — a posição REAL do usuário
// vive em `progresso`, persistida e avançada por critério, não recalculada daqui).
export function getMacrofaseCalendario(date) {
  const iso = toISO(date);
  const primeira = MACRO_PHASES[0], ultima = MACRO_PHASES[MACRO_PHASES.length - 1];
  if (iso < primeira.inicio) return { macrofase: 1, semanaIdx: 0, antesDoInicio: true };
  if (iso > ultima.fim) return { macrofase: 4, semanaIdx: ultima.semanas.length - 1, depoisDoFim: true };
  const mf = MACRO_PHASES.find(m => iso >= m.inicio && iso <= m.fim) || primeira;
  const semanaIdx = Math.max(0, mf.semanas.findIndex(s => iso >= s.inicio && iso <= s.fim));
  return { macrofase: mf.id, semanaIdx };
}

export function getMacrofaseInfo(macrofaseId) { return MACRO_PHASES.find(m => m.id === macrofaseId) || MACRO_PHASES[0]; }
export function totalSemanas(macrofaseId) { return getMacrofaseInfo(macrofaseId).semanas.length; }

export const META_OFICIAL = "10km em run/walk 9:1 (9min correndo / 1min caminhando) — 10km contínuo é alvo de fevereiro/2027, não de 2026.";
