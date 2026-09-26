import { useState, useEffect } from "react";
import { toISO, diffDias, MARCO_ZERO, getMacrofaseInfo, totalSemanas, META_OFICIAL } from "./data/plano.js";
import { MA, MB, MC, buildMuscSession } from "./data/musculacao.js";
import { getRehabForMacrofase } from "./data/rehab.js";
import { buildCaminhadaSession, buildWalkRunSession, buildContinuoSession, buildMetaSession } from "./data/corrida.js";
import { loadState, saveState } from "./lib/storage.js";
import { calcularPosicao, verificarGate, checkRecuoAutomatico, rathleffStatus, formatarRestante } from "./lib/progressao.js";
import { registrarCarga, registrarHistoricoTreino, registrarPeso } from "./lib/treino.js";
import { registrar as registrarEvento } from "./lib/eventos.js";
import { color } from "./lib/tokens.js";

import Onboarding from "./components/Onboarding.jsx";
import Home from "./components/Home.jsx";
import Preview from "./components/Preview.jsx";
import WorkoutScreen from "./components/WorkoutScreen.jsx";
import RehabScreen from "./components/RehabScreen.jsx";
import Historico from "./components/Historico/index.jsx";
import Relatorios from "./components/Relatorios/index.jsx";
import TesteScreen from "./components/TesteScreen.jsx";
import Icon from "./components/Icon.jsx";

const SESSOES_MF = {
  1: ["muscA", "caminhada", "muscB", "muscC"],
  2: ["muscA", "walkrun", "muscB", "walkrun", "muscC", "walkrun"],
  3: ["muscA", "qualidade", "muscB", "muscC", "longao"],
  4: ["muscA", "qualidade", "muscB", "muscC", "longao"],
};

function tipoInfo(tipo) {
  const m = { icon: "dumbbell", cor: color.musc };
  const r = { icon: "run", cor: color.corrida };
  switch (tipo) {
    case "muscA": return { label: "Musculação A", grupo: "superior", ...m };
    case "muscB": return { label: "Musculação B", grupo: "inferior", ...m };
    case "muscC": return { label: "Musculação C", grupo: "superior", ...m };
    case "caminhada": return { label: "Caminhada", grupo: null, ...r };
    case "walkrun": return { label: "Walk/Run", grupo: null, ...r };
    case "qualidade": return { label: "Qualidade", grupo: null, icon: "flame", cor: color.corrida };
    case "longao": return { label: "Longão", grupo: null, ...r };
    default: return { label: tipo, grupo: null, icon: "run", cor: color.corrida };
  }
}

function buildSessao(tipo, macrofase, semanaIdx, force3x15) {
  switch (tipo) {
    case "muscA": return { steps: buildMuscSession(MA, macrofase, semanaIdx, force3x15), resumo: null, testeId: null, testeNome: null };
    case "muscB": return { steps: buildMuscSession(MB, macrofase, semanaIdx, force3x15), resumo: null, testeId: null, testeNome: null };
    case "muscC": return { steps: buildMuscSession(MC, macrofase, semanaIdx, force3x15), resumo: null, testeId: null, testeNome: null };
    case "caminhada": { const r = buildCaminhadaSession(semanaIdx); return { steps: r.steps, resumo: r.testeNome, testeId: r.testeId, testeNome: "Dor ≤2/10 durante e na manhã seguinte?" }; }
    case "walkrun": { const r = buildWalkRunSession(semanaIdx); const ultima = semanaIdx >= 3; return { steps: r.steps, resumo: r.resumo, testeId: ultima ? "corrida5min" : null, testeNome: "Consegui 5min de corrida contínua sem piorar a dor?" }; }
    case "qualidade": { const r = macrofase === 3 ? buildContinuoSession(semanaIdx, "q") : buildMetaSession(semanaIdx, "q"); return { steps: r.steps, resumo: r.resumo, testeId: null, testeNome: null }; }
    case "longao": {
      const r = macrofase === 3 ? buildContinuoSession(semanaIdx, "l") : buildMetaSession(semanaIdx, "l");
      let testeId = null;
      if (macrofase === 3 && r.teste) testeId = "teste5km";
      if (macrofase === 4 && r.teste) testeId = "teste10km";
      return { steps: r.steps, resumo: r.resumo, testeId, testeNome: testeId === "teste5km" ? "Completei o teste de 5km contínuo sem piora de dor?" : "Completei o teste de 10km?" };
    }
    default: return { steps: [], resumo: null, testeId: null, testeNome: null };
  }
}

const RESUME_KEY = "th1-resume";
function lerResume() { try { const r = JSON.parse(localStorage.getItem(RESUME_KEY)); return r && r.iso === isoHojeReal() ? r : null; } catch { return null; } }

function isoHojeReal() { return toISO(new Date()); }

export default function App() {
  const [state, setState] = useState(null);
  const [scr, setScr] = useState("carregando");
  const [sessaoAtual, setSessaoAtual] = useState(null); // { tipo, steps, label, cor, icon, resumo, testeId, testeNome, grupo }
  const [activeDoseKey, setActiveDoseKey] = useState(null);
  const [recalibrando, setRecalibrando] = useState(false);
  const [resume, setResume] = useState(null);      // treino interrompido hoje: { tipo, label, tot, iso, sI, cS, startMs, volume }
  const [retomando, setRetomando] = useState(false);

  useEffect(() => {
    const s = loadState();
    setState(s);
    setScr(s.onboarding ? "home" : "onboarding");
    setResume(lerResume());
  }, []);

  // dor / rehab reforçado — verifica recuo automático 1x por dia
  useEffect(() => {
    if (!state || !state.progresso) return;
    const hoje = isoHojeReal();
    if (state.ultimoRecuoISO === hoje) return;
    const r = checkRecuoAutomatico(state.dorLog, hoje);
    if (r.trigger) {
      const novoSemana = Math.max(0, state.progresso.semanaIdx - 1);
      setState(s => {
        const eventos = registrarEvento(s.eventos, "recuo_automatico", { de: s.progresso.semanaIdx, para: novoSemana, motivo: "dor_subiu_2dias" }, hoje);
        const n = { ...s, progresso: { ...s.progresso, semanaIdx: novoSemana }, ultimoRecuoISO: hoje, eventos };
        saveState(n); return n;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state && state.dorLog && state.dorLog[isoHojeReal()]]);

  if (!state) return <div style={{ background: color.bg, color: color.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}><p style={{ opacity: .6 }}>Carregando...</p></div>;

  function patch(partial) { setState(s => { const n = { ...s, ...partial }; saveState(n); return n; }); }

  const hojeISO = isoHojeReal();
  const progresso = state.progresso || { macrofase: 1, semanaIdx: 0, sessaoIdx: 0, dorAlta: false, acelerarTestes: false, force3x15: false };
  const sessoesTipos = SESSOES_MF[progresso.macrofase] || SESSOES_MF[1];
  const macInfo = getMacrofaseInfo(progresso.macrofase);
  const totSem = totalSemanas(progresso.macrofase);
  const diaAlternado = diffDias(MARCO_ZERO, hojeISO) % 2 === 0;
  const rehabDoses = getRehabForMacrofase(progresso.macrofase, progresso.semanaIdx, diaAlternado, progresso.dorAlta);
  const ultimoRathleffMs = Object.keys(state.rathleffLog).length ? Math.max(...Object.values(state.rathleffLog)) : 0;
  const rathleff = rathleffStatus(ultimoRathleffMs, Date.now());

  function avancarProgresso(tipoCompletado) {
    let { macrofase, semanaIdx } = progresso;
    const tipos = SESSOES_MF[macrofase];
    const idxCompletado = tipoCompletado ? tipos.indexOf(tipoCompletado) : progresso.sessaoIdx;
    const baseIdx = idxCompletado === -1 ? progresso.sessaoIdx : idxCompletado;
    let novoSessaoIdx = (baseIdx + 1) % tipos.length;
    let novoSemanaIdx = semanaIdx, novoMacrofase = macrofase;
    if (novoSessaoIdx === 0) {
      const max = totalSemanas(macrofase);
      if (semanaIdx + 1 >= max) {
        const gate = verificarGate(macrofase, { testesLog: state.testesLog, dorLog: state.dorLog, hojeISO });
        if (gate.ok && macrofase < 4) { novoMacrofase = macrofase + 1; novoSemanaIdx = 0; }
      } else novoSemanaIdx = semanaIdx + 1;
    }
    patch({ progresso: { ...progresso, macrofase: novoMacrofase, semanaIdx: novoSemanaIdx, sessaoIdx: novoSessaoIdx } });
  }

  function limparResume() { setResume(null); setRetomando(false); try { localStorage.removeItem(RESUME_KEY); } catch { /* sem localStorage */ } }
  function guardarResume(p) {
    if (!sessaoAtual) return;
    const tot = sessaoAtual.steps.filter(x => !x.section).length;
    try { localStorage.setItem(RESUME_KEY, JSON.stringify({ tipo: sessaoAtual.tipo, label: sessaoAtual.label, tot, iso: hojeISO, ...p })); } catch { /* sem localStorage */ }
  }
  function retomarSessao() {
    const built = buildSessao(resume.tipo, progresso.macrofase, progresso.semanaIdx, progresso.force3x15);
    setSessaoAtual({ tipo: resume.tipo, ...tipoInfo(resume.tipo), ...built });
    setRetomando(true);
    setScr("workout");
  }

  function iniciarSessao(tipo) {
    limparResume();
    const info = tipoInfo(tipo);
    const built = buildSessao(tipo, progresso.macrofase, progresso.semanaIdx, progresso.force3x15);
    setSessaoAtual({ tipo, ...info, ...built });
    setScr("workout");
  }

  function registrarDor(nota) { patch({ dorLog: { ...state.dorLog, [hojeISO]: nota }, eventos: registrarEvento(state.eventos, "dor_checkin", { nivel: nota }, hojeISO) }); }
  function diasSemRegistroDor() {
    const piso = (state.onboarding && state.onboarding.iso) || hojeISO;
    let n = 0, d = new Date(hojeISO + "T00:00:00");
    for (;;) {
      const iso = toISO(d);
      if (state.dorLog[iso] !== undefined || iso < piso) break;
      n++; d = new Date(d.getTime() - 86400000);
    }
    return n;
  }

  function markDose(key) {
    const novo = { ...state.rehabLog, [hojeISO]: { ...(state.rehabLog[hojeISO] || {}), [key]: true } };
    const patchObj = { rehabLog: novo };
    if (key === "carga") {
      patchObj.rathleffLog = { ...state.rathleffLog, [hojeISO]: Date.now() };
      patchObj.eventos = registrarEvento(state.eventos, "rathleff", {}, hojeISO);
    } else {
      patchObj.eventos = registrarEvento(state.eventos, "rehab_dose", { periodo: key }, hojeISO);
    }
    patch(patchObj);
  }
  function doseFeita(key) { return !!(state.rehabLog[hojeISO] && state.rehabLog[hojeISO][key]); }

  function onRegistrarCarga(exName, kg, atingiuTopo) { patch({ cargas: registrarCarga(state.cargas, exName, kg, atingiuTopo, hojeISO) }); }

  function onFinishWorkout(entry) {
    limparResume();
    const historicoTreinos = registrarHistoricoTreino(state.historicoTreinos, { iso: hojeISO, ...entry });
    const tipoSessao = sessaoAtual && sessaoAtual.tipo;
    const eventos = registrarEvento(state.eventos, "treino_concluido", { tipo: tipoSessao || null, ...entry }, hojeISO);
    patch({ historicoTreinos, eventos });
    if (sessaoAtual && sessaoAtual.testeId) { setScr("teste"); return; }
    avancarProgresso(tipoSessao);
    setScr("home");
  }

  function onResultadoTeste(passou) {
    if (sessaoAtual && sessaoAtual.testeId) {
      patch({
        testesLog: { ...state.testesLog, [sessaoAtual.testeId]: { passou, iso: hojeISO } },
        eventos: registrarEvento(state.eventos, "teste", { testeId: sessaoAtual.testeId, passou }, hojeISO),
      });
    }
    avancarProgresso(sessaoAtual && sessaoAtual.tipo);
    setScr("home");
  }

  // ══════════════════════ ONBOARDING / RECALIBRAÇÃO ══════════════════════
  if (scr === "onboarding") {
    return <Onboarding recalibrando={recalibrando} onFinish={(respostas) => {
      const posicao = calcularPosicao({ dor: respostas.dor, semanasParado: respostas.semanasParado }, state.progresso);
      patch({
        onboarding: { dorInicial: respostas.dor, semanasParado: respostas.semanasParado, pesoInicial: respostas.peso, iso: hojeISO },
        progresso: { ...posicao, sessaoIdx: 0 },
        pesoLog: registrarPeso(state.pesoLog, hojeISO, respostas.peso),
        eventos: registrarEvento(state.eventos, "peso", { kg: respostas.peso }, hojeISO),
      });
      setRecalibrando(false);
      setScr("home");
    }} />;
  }

  // ══════════════════════ TESTE (caminhada / corrida contínua / 5km / 10km) ══════════════════════
  if (scr === "teste" && sessaoAtual) {
    return <TesteScreen nome={sessaoAtual.resumo || "Teste"} criterio={sessaoAtual.testeNome} onResultado={onResultadoTeste} />;
  }

  // ══════════════════════ REHAB ══════════════════════
  if (scr === "rehabDose" && activeDoseKey) {
    const baseRotina = activeDoseKey === "carga" ? rehabDoses.carga : activeDoseKey === "gelo" ? rehabDoses.gelo : rehabDoses.base;
    const tituloPeriodo = activeDoseKey === "manha" ? "Rotina — Manhã" : activeDoseKey === "tarde" ? "Rotina — Tarde" : activeDoseKey === "noite" ? "Rotina — Noite" : null;
    const rotinas = [{ key: activeDoseKey, rotina: tituloPeriodo ? { ...baseRotina, title: tituloPeriodo } : baseRotina }];
    return <RehabScreen
      rotinas={rotinas}
      rathleff={rathleff}
      dorLog={state.dorLog}
      pesoLog={state.pesoLog}
      hojeISO={hojeISO}
      onBack={() => { setScr("home"); setActiveDoseKey(null); }}
      onRoutineComplete={() => markDose(activeDoseKey)}
    />;
  }

  // ══════════════════════ HISTÓRICO ══════════════════════
  if (scr === "historico") return <Historico eventos={state.eventos} hojeISO={hojeISO} onBack={() => setScr("home")} onEventosChange={(eventos) => patch({ eventos })} />;

  // ══════════════════════ RELATÓRIOS ══════════════════════
  if (scr === "relatorios") return <Relatorios eventos={state.eventos} hojeISO={hojeISO} onBack={() => setScr("home")} />;

  // ══════════════════════ PREVIEW ══════════════════════
  if (scr === "preview" && sessaoAtual) {
    return <Preview steps={sessaoAtual.steps} label={sessaoAtual.label} cor={sessaoAtual.cor} icon={sessaoAtual.icon} resumo={sessaoAtual.resumo}
      onBack={() => setScr("home")} onIniciar={() => { limparResume(); setScr("workout"); }} />;
  }

  // ══════════════════════ WORKOUT ══════════════════════
  if (scr === "workout" && sessaoAtual) {
    return <WorkoutScreen steps={sessaoAtual.steps} sessionLabel={sessaoAtual.label} cor={sessaoAtual.cor} grupoCarga={sessaoAtual.grupo}
      cargas={state.cargas} onRegistrarCarga={onRegistrarCarga}
      resume={retomando ? resume : null} onProgress={guardarResume}
      onBack={() => { setRetomando(false); setResume(lerResume()); setScr("home"); }} onFinish={onFinishWorkout} />;
  }

  // ══════════════════════ PROGRAMA CONCLUÍDO ══════════════════════
  const concluido = progresso.macrofase === 4 && state.testesLog.teste10km;
  if (concluido) {
    return <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: 24, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <Icon name="flag" size={40} color={color.success} />
      <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 16, marginBottom: 8 }}>Programa concluído</h1>
      <div style={{ fontSize: 13, color: color.textDim, lineHeight: 1.6 }}>{META_OFICIAL}</div>
    </div>;
  }

  // ══════════════════════ HOME ══════════════════════
  const proximoTipo = sessoesTipos[progresso.sessaoIdx];
  const infoProx = tipoInfo(proximoTipo);
  const previewProx = buildSessao(proximoTipo, progresso.macrofase, progresso.semanaIdx, progresso.force3x15);
  const ultimaSemana = progresso.semanaIdx === totSem - 1;
  const ultimaSessaoDaSemana = progresso.sessaoIdx === sessoesTipos.length - 1;
  const gateInfo = (ultimaSemana && ultimaSessaoDaSemana) ? verificarGate(progresso.macrofase, { testesLog: state.testesLog, dorLog: state.dorLog, hojeISO }) : null;

  const doses = progresso.dorAlta
    ? [{ key: "manha", label: "Rotina — Manhã" }, { key: "tarde", label: "Rotina — Tarde" }, { key: "noite", label: "Rotina — Noite" }]
    : progresso.macrofase === 1
      ? [{ key: "manha", label: "Rotina — Manhã" }, { key: "noite", label: "Rotina — Noite" }]
      : [{ key: "unica", label: rehabDoses.base.title }];

  return <Home
    macrofaseNome={macInfo.nome} semanaIdx={progresso.semanaIdx} totalSemanas={totSem} hojeISO={hojeISO}
    dorHoje={state.dorLog[hojeISO]} diasSemRegistroDor={diasSemRegistroDor()} onRegistrarDor={registrarDor}
    doses={doses} doseFeitaFn={doseFeita}
    onAbrirDose={(key) => { setActiveDoseKey(key); setScr("rehabDose"); }}
    cargaDisponivel={!!rehabDoses.carga} cargaFeita={doseFeita("carga")} cargaTitulo={rehabDoses.carga ? rehabDoses.carga.title : ""}
    cargaBloqueada={!rathleff.liberado} restanteRathleff={formatarRestante(rathleff.restanteMs)}
    proximaSessao={{ label: infoProx.label, icon: infoProx.icon, cor: infoProx.cor, resumo: previewProx.resumo }}
    onIniciar={() => iniciarSessao(proximoTipo)}
    onPular={() => { patch({ eventos: registrarEvento(state.eventos, "treino_pulado", { tipo: proximoTipo }, hojeISO) }); avancarProgresso(); }}
    gateInfo={gateInfo}
    sessoes={sessoesTipos.map(t => tipoInfo(t))}
    onVerSessao={(i) => { const tipo = sessoesTipos[i]; const info = tipoInfo(tipo); const built = buildSessao(tipo, progresso.macrofase, progresso.semanaIdx, progresso.force3x15); setSessaoAtual({ tipo, ...info, ...built }); setScr("preview"); }}
    onAbrirHistorico={() => setScr("historico")}
    onAbrirRelatorios={() => setScr("relatorios")}
    onRecalibrar={() => { setRecalibrando(true); setScr("onboarding"); }}
    retomar={resume ? { label: resume.label, passo: resume.sI + 1, total: resume.tot } : null}
    onRetomar={retomarSessao} onDescartarRetomar={limparResume}
  />;
}
