// ══════════════════════ STORAGE — schema versionado, chave th1 ══════════════════════
import { migrarParaEventos } from "./eventos.js";

const KEY = "th1";
const SCHEMA_VERSION = 1;
const LEGACY_KEYS = ["tp7", "tp7rehab", "tp7dia", "tp7testes"];

export function defaultState() {
  return {
    v: SCHEMA_VERSION,
    onboarding: null,        // { dorInicial, semanasParado, pesoInicial, iso }
    progresso: null,         // { macrofase, semanaIdx, sinceISO, acelerar, dorAlta }
    dorLog: {},               // { iso: nota 0-10 }
    pesoLog: {},               // { iso: kg }
    cargas: {},                // { exName: { ultimaKg, historico:[{iso,kg,repsTopo}], streakTopo } }
    historicoTreinos: [],      // [{ iso, label, duracaoSeg, volume }]
    rathleffLog: {},          // { iso: timestampMs }
    rehabLog: {},               // { iso: { manha, noite, carga } }
    testesLog: {},               // { id: { passou, iso } }
    ultimoRecuoISO: null,
    legacy: null,
    eventos: [],               // [{ id, data, timestamp, tipo, payload }] — log append-only, ver lib/eventos.js
    eventosMigrados: false,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const state = migrarParaEventos({ ...defaultState(), ...JSON.parse(raw) });
      saveState(state);
      return state;
    }
  } catch { /* localStorage indisponível */ }
  return migrateFromLegacy();
}

function migrateFromLegacy() {
  let state = defaultState();
  try {
    const legacy = {};
    LEGACY_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v) legacy[k] = JSON.parse(v); });
    if (Object.keys(legacy).length) {
      state.legacy = legacy;
      if (legacy.tp7rehab) state.rehabLog = legacy.tp7rehab;
      if (legacy.tp7testes) state.testesLog = legacy.tp7testes;
    }
  } catch { /* localStorage indisponível */ }
  state = migrarParaEventos(state);
  saveState(state);
  return state;
}

export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* localStorage indisponível */ }
}
