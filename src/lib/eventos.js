// ══════════════════════ EVENTOS — log append-only ══════════════════════
// { id, data (ISO YYYY-MM-DD), timestamp, tipo, payload }
// Funções puras: entram eventos, saem eventos. Sem side-effect (persistência é papel de storage.js).

function gerarId() { return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`; }

export function registrar(eventos, tipo, payload, iso, opts = {}) {
  const evento = { id: gerarId(), data: iso, timestamp: Date.now(), tipo, payload, ...opts };
  return [...eventos, evento];
}

export function listar(eventos, { desde, ate } = {}) {
  return eventos
    .filter(e => (!desde || e.data >= desde) && (!ate || e.data <= ate))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function editar(eventos, id, changes) {
  return eventos.map(e => e.id === id ? { ...e, ...changes } : e);
}

export function remover(eventos, id) {
  return eventos.filter(e => e.id !== id);
}

// Migração idempotente dos logs antigos (dorLog/pesoLog/rehabLog/rathleffLog/
// historicoTreinos/testesLog/ultimoRecuoISO) pra eventos. Roda uma vez só
// (flag state.eventosMigrados) — nada é perdido, nada duplica em loads seguintes.
export function migrarParaEventos(state) {
  if (state.eventosMigrados) return state;
  let eventos = state.eventos || [];

  Object.entries(state.dorLog || {}).forEach(([iso, nivel]) => {
    eventos = registrar(eventos, "dor_checkin", { nivel }, iso);
  });
  Object.entries(state.pesoLog || {}).forEach(([iso, kg]) => {
    eventos = registrar(eventos, "peso", { kg }, iso);
  });
  Object.entries(state.rehabLog || {}).forEach(([iso, doses]) => {
    Object.keys(doses).forEach(key => {
      if (!doses[key]) return;
      eventos = key === "carga"
        ? registrar(eventos, "rathleff", {}, iso)
        : registrar(eventos, "rehab_dose", { periodo: key }, iso);
    });
  });
  Object.keys(state.rathleffLog || {}).forEach(iso => {
    // cobre rathleffLog sem rehabLog.carga correspondente (dado legado divergente)
    if (!(state.rehabLog[iso] && state.rehabLog[iso].carga)) {
      eventos = registrar(eventos, "rathleff", {}, iso);
    }
  });
  (state.historicoTreinos || []).forEach(h => {
    eventos = registrar(eventos, "treino_concluido", { tipo: h.tipo || null, label: h.label, duracaoSeg: h.duracaoSeg, volume: h.volume }, h.iso);
  });
  Object.entries(state.testesLog || {}).forEach(([testeId, r]) => {
    eventos = registrar(eventos, "teste", { testeId, passou: r.passou }, r.iso);
  });
  if (state.ultimoRecuoISO) {
    eventos = registrar(eventos, "recuo_automatico", { motivo: "dor_subiu_2dias" }, state.ultimoRecuoISO);
  }

  return { ...state, eventos, eventosMigrados: true };
}
