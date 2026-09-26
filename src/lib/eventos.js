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

// Agrega eventos por dia (última ocorrência de cada valor pontual vence — `listar`
// já devolve em ordem cronológica, então o forEach naturalmente aplica "mais recente ganha").
export function agruparPorDia(eventos) {
  const dias = {};
  function dia(iso) { return dias[iso] || (dias[iso] = { periodos: [], treino: null, pulado: false, dor: null, testes: [], recuo: null }); }
  listar(eventos).forEach(e => {
    const d = dia(e.data);
    switch (e.tipo) {
      case "dor_checkin": d.dor = e.payload.nivel; break;
      case "rehab_dose": if (!d.periodos.includes(e.payload.periodo)) d.periodos.push(e.payload.periodo); break;
      case "rathleff": if (!d.periodos.includes("carga")) d.periodos.push("carga"); break;
      case "treino_concluido": d.treino = { tipo: e.payload.tipo, label: e.payload.label, duracaoSeg: e.payload.duracaoSeg, volume: e.payload.volume }; d.pulado = false; break;
      case "treino_pulado": d.pulado = true; break;
      case "teste": d.testes.push({ testeId: e.payload.testeId, passou: e.payload.passou }); break;
      case "recuo_automatico": d.recuo = e.payload; break;
      default: break;
    }
  });
  return dias;
}

function substituir(eventos, tipo, iso) { return eventos.filter(e => !(e.tipo === tipo && e.data === iso)); }

// Aplica edição retroativa (ou do dia atual) vinda da tela de Histórico.
// `edicao`: { dor: number|null, manha: bool, noite: bool, treinoStatus: "feito"|"pulado"|null, treinoTipo: string|null }
export function aplicarEdicaoDia(eventos, iso, edicao, retroativo) {
  let ev = eventos;
  const opts = retroativo ? { retroativo: true } : {};

  if (edicao.dor !== null && edicao.dor !== undefined) {
    ev = registrar(substituir(ev, "dor_checkin", iso), "dor_checkin", { nivel: edicao.dor }, iso, opts);
  }
  ["manha", "noite"].forEach(periodo => {
    const tem = ev.some(e => e.tipo === "rehab_dose" && e.data === iso && e.payload.periodo === periodo);
    if (edicao[periodo] && !tem) ev = registrar(ev, "rehab_dose", { periodo }, iso, opts);
    if (!edicao[periodo] && tem) ev = ev.filter(e => !(e.tipo === "rehab_dose" && e.data === iso && e.payload.periodo === periodo));
  });
  if (edicao.treinoStatus === "feito") {
    ev = registrar(substituir(substituir(ev, "treino_concluido", iso), "treino_pulado", iso), "treino_concluido", { tipo: edicao.treinoTipo || null, manual: true }, iso, opts);
  } else if (edicao.treinoStatus === "pulado") {
    ev = registrar(substituir(substituir(ev, "treino_concluido", iso), "treino_pulado", iso), "treino_pulado", { tipo: edicao.treinoTipo || null }, iso, opts);
  } else if (edicao.treinoStatus === null) {
    ev = substituir(substituir(ev, "treino_concluido", iso), "treino_pulado", iso);
  }
  return ev;
}

// ponytail: classificação assume o regime manhã+noite (macrofase 1, atual). Macrofases
// com dose "unica" já contam como completo; "tarde"/"gelo" não entram no critério —
// revisar se uma macrofase futura tornar isso ambíguo.
export function classificarDia(resumoDia) {
  if (!resumoDia) return "vazio";
  const core = resumoDia.periodos.filter(p => p !== "gelo" && p !== "carga");
  const completo = core.includes("unica") || (core.includes("manha") && core.includes("noite"));
  const parcial = !completo && core.length > 0;
  const treino = !!resumoDia.treino;
  if (completo && treino) return "forte";
  if (completo) return "medio";
  if (parcial) return "fraco";
  if (treino) return "alerta";
  return "vazio";
}
