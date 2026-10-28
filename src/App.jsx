import { useState, useEffect } from "react";
import { toISO, diffDias, MARCO_ZERO, MACRO_PHASES, getMacrofaseInfo, totalSemanas, META_OFICIAL } from "./data/plano.js";
import { MA, MB, MC, buildMuscSession } from "./data/musculacao.js";
import { getRehabForMacrofase, getRehabManutencaoVitalicia, precisaReativarManutencao } from "./data/rehab.js";
import { buildCaminhadaSession, buildWalkRunSession, buildContinuoSession, buildMetaSession } from "./data/corrida.js";
import { loadState, saveState } from "./lib/storage.js";
import { calcularPosicao, verificarGate, checkRecuoAutomatico, rathleffStatus, formatarRestante } from "./lib/progressao.js";
import { registrarCarga, registrarHistoricoTreino, registrarPeso, ehPR } from "./lib/treino.js";
import { registrar as registrarEvento } from "./lib/eventos.js";
import { eventosParaJSON, comparacaoRecaida } from "./lib/relatorios.js";
import { validarAgendamento } from "./lib/agendamento.js";
import { atualizarBadge } from "./lib/lembrete.js";
import { color } from "./lib/tokens.js";

import Onboarding from "./components/Onboarding.jsx";
import Home from "./components/Home.jsx";
import Preview from "./components/Preview.jsx";
import WorkoutScreen from "./components/WorkoutScreen.jsx";
import RehabScreen from "./components/RehabScreen.jsx";
import Historico from "./components/Historico/index.jsx";
import Relatorios from "./components/Relatorios/index.jsx";
import RelatorioMedico from "./components/RelatorioMedico.jsx";
import LembreteScreen from "./components/LembreteScreen.jsx";
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

  // badge do PWA com nº de doses de rehab pendentes hoje (Badging API, sem permissão)
  useEffect(() => {
    if (!state) return;
    const hoje = isoHojeReal();
    const prog = state.progresso || { macrofase: 1, dorAlta: false };
    const feitas = state.rehabLog[hoje] || {};
    const chaves = prog.dorAlta ? ["manha", "tarde", "noite"] : prog.macrofase === 1 ? ["manha", "noite"] : ["unica"];
    const pendentes = chaves.filter(k => !feitas[k]).length;
    atualizarBadge(pendentes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state && state.rehabLog && state.rehabLog[isoHojeReal()]]);

  if (!state) return <div style={{ background: color.bg, color: color.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}><p style={{ opacity: .6 }}>Carregando...</p></div>;

  function patch(partial) { setState(s => { const n = { ...s, ...partial }; saveState(n); return n; }); }

  const hojeISO = isoHojeReal();
  const progresso = state.progresso || { macrofase: 1, semanaIdx: 0, sessaoIdx: 0, dorAlta: false, acelerarTestes: false, force3x15: false };
  const sessoesTipos = SESSOES_MF[progresso.macrofase] || SESSOES_MF[1];
  const macInfo = getMacrofaseInfo(progresso.macrofase);
  const totSem = totalSemanas(progresso.macrofase);
  const diaAlternado = diffDias(MARCO_ZERO, hojeISO) % 2 === 0;
  // Bloco 6.1 — manutenção vitalícia assume quando o plano de 15 semanas termina.
  const planoAcabou = hojeISO > MACRO_PHASES[MACRO_PHASES.length - 1].fim;
  const dorPontos = state.eventos.filter(e => e.tipo === "dor_checkin").map(e => ({ iso: e.data, nivel: e.payload.nivel }));
  const baselineDor = dorPontos.length ? dorPontos.reduce((s, p) => s + p.nivel, 0) / dorPontos.length : null;
  const dorUltimos3Dias = [0, 1, 2].map(n => toISO(new Date(new Date(hojeISO + "T00:00:00").getTime() - n * 86400000)))
    .map(iso => { const p = dorPontos.find(p => p.iso === iso); return p ? p.nivel : null; });
  const reativadoManutencao = planoAcabou && precisaReativarManutencao(dorUltimos3Dias, baselineDor);
  const rehabDoses = planoAcabou
    ? getRehabManutencaoVitalicia(new Date(hojeISO + "T00:00:00").getDay(), reativadoManutencao)
    : getRehabForMacrofase(progresso.macrofase, progresso.semanaIdx, diaAlternado, progresso.dorAlta);
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
    const info = tipoInfo(tipo);
    const built = buildSessao(tipo, progresso.macrofase, progresso.semanaIdx, progresso.force3x15);
    // R1 bloqueia (ver lib/agendamento.js) — manda pro Preview em vez do treino direto,
    // que é onde o aviso/bloqueio é mostrado de verdade.
    if (validarAgendamento(state.eventos, hojeISO, tipo).bloqueado) {
      setSessaoAtual({ tipo, ...info, ...built });
      setScr("preview");
      return;
    }
    limparResume();
    setSessaoAtual({ tipo, ...info, ...built });
    setScr("workout");
  }

  function registrarDor(nota) { patch({ dorLog: { ...state.dorLog, [hojeISO]: nota }, eventos: registrarEvento(state.eventos, "dor_checkin", { nivel: nota }, hojeISO) }); }
  // Bloco 6.1 — em modo manutenção o check-in de dor é semanal, não diário: procura
  // qualquer registro desde a segunda-feira da semana atual, não só hoje.
  function dorDaSemanaAtual() {
    const d = new Date(hojeISO + "T00:00:00");
    const offset = d.getDay() === 0 ? 6 : d.getDay() - 1;
    for (let i = 0; i <= offset; i++) {
      const iso = toISO(new Date(d.getTime() - i * 86400000));
      if (state.dorLog[iso] !== undefined) return state.dorLog[iso];
    }
    return undefined;
  }

  // carga de pé — Bloco 1.1 do plano de evolução híbrida. Puramente eventos (sem log
  // paralelo, diferente de dorLog que é legado) — "hoje" lido direto do próprio eventos.
  function cargaPeHoje() {
    const e = state.eventos.filter(e => e.tipo === "carga_pe" && e.data === hojeISO).pop();
    return e ? e.payload.nivel : undefined;
  }
  function registrarCargaPe(nivel) { patch({ eventos: registrarEvento(state.eventos, "carga_pe", { nivel }, hojeISO) }); }

  // passos semanais — Bloco 1.2. Entrada manual (sem parsing de export do Apple Saúde,
  // deliberado — ver spec). Um evento por semana, identificado pela segunda-feira.
  function segundaFeiraDaSemana(iso) {
    const d = new Date(iso + "T00:00:00");
    const offset = d.getDay() === 0 ? 6 : d.getDay() - 1;
    return toISO(new Date(d.getTime() - offset * 86400000));
  }
  function passosSemanaAtual() {
    const semanaISO = segundaFeiraDaSemana(hojeISO);
    const e = state.eventos.filter(e => e.tipo === "passos_semana" && e.data === semanaISO).pop();
    return e ? e.payload.mediaDia : undefined;
  }
  function registrarPassosSemana(mediaDia) {
    const semanaISO = segundaFeiraDaSemana(hojeISO);
    const semEssaSemana = state.eventos.filter(e => !(e.tipo === "passos_semana" && e.data === semanaISO));
    patch({ eventos: registrarEvento(semEssaSemana, "passos_semana", { mediaDia }, semanaISO) });
  }
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

  // dias desde o último evento qualquer — pra "bem-vindo de volta" sem culpa, não é
  // métrica de punição, é só pra saber se o retorno pede acolhimento.
  function diasSemUsoApp() {
    if (!state.eventos.length) return 0;
    const ultimaData = state.eventos.reduce((max, e) => e.data > max ? e.data : max, state.eventos[0].data);
    return Math.max(0, diffDias(ultimaData, hojeISO));
  }

  function salvarPlanoSeEntao(plano) { patch({ planoSeEntao: plano }); }

  // Bloco 1.4 — rastreio de calçado. Inventário simples, sem auto-link a corridas
  // (deliberado, versão magra). Alerta aos 600km fica na UI (Relatorios).
  function adicionarTenis(nome) {
    const tenis = [...state.tenis, { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, nome, km: 0 }];
    patch({ tenis });
  }
  function registrarKmTenis(id, kmAdicional) {
    patch({ tenis: state.tenis.map(t => t.id === id ? { ...t, km: Math.round((t.km + kmAdicional) * 10) / 10 } : t) });
  }
  function removerTenis(id) { patch({ tenis: state.tenis.filter(t => t.id !== id) }); }

  // Bloco 2.6 — backup automático. localStorage sem backend está a uma limpeza de Safari
  // de perder tudo. Lembrete mensal, share nativo (iOS) com fallback de download.
  const DIAS_LEMBRETE_BACKUP = 30;
  function diasSemBackup() {
    const base = state.ultimoBackupISO || (state.onboarding && state.onboarding.iso);
    return base ? diffDias(base, hojeISO) : 0;
  }
  function precisaBackup() { return state.eventos.length > 0 && diasSemBackup() >= DIAS_LEMBRETE_BACKUP; }
  async function fazerBackup() {
    const nomeArquivo = `treino-eventos-${hojeISO}.json`;
    const blob = new Blob([eventosParaJSON(state.eventos)], { type: "application/json" });
    try {
      const file = new File([blob], nomeArquivo, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Backup Treino Híbrido" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = nomeArquivo; a.click();
        URL.revokeObjectURL(url);
      }
      patch({ ultimoBackupISO: hojeISO });
    } catch { /* usuário cancelou o share — não marca como feito, pergunta nas próximas vezes */ }
  }

  // Bloco 2.5 — semana declarada. "Apertada" vira modo manutenção: exclui a semana do
  // denominador de aderência nos relatórios (ver relatorios.js), sem marcar como falha.
  function declararSemana(segundaISO, tipo) { patch({ semanasDeclaradas: { ...state.semanasDeclaradas, [segundaISO]: tipo } }); }
  function semanaAtualDeclarada() { return state.semanasDeclaradas[segundaFeiraDaSemana(hojeISO)]; }

  // média de dor dos últimos 7 dias com registro — usada pra priorizar alternativa de
  // exercício sem impacto no pé (Bloco 2.5), não é métrica de risco nem gate.
  function dorMedia7d() {
    let soma = 0, n = 0, d = new Date(hojeISO + "T00:00:00");
    for (let i = 0; i < 7; i++) {
      const iso = toISO(d);
      if (state.dorLog[iso] !== undefined) { soma += state.dorLog[iso]; n++; }
      d = new Date(d.getTime() - 86400000);
    }
    return n ? soma / n : null;
  }

  function markDose(key, completude) {
    const novo = { ...state.rehabLog, [hojeISO]: { ...(state.rehabLog[hojeISO] || {}), [key]: true } };
    const patchObj = { rehabLog: novo };
    const extra = completude ? { completude } : {};
    if (key === "carga") {
      patchObj.rathleffLog = { ...state.rathleffLog, [hojeISO]: Date.now() };
      patchObj.eventos = registrarEvento(state.eventos, "rathleff", extra, hojeISO);
    } else {
      patchObj.eventos = registrarEvento(state.eventos, "rehab_dose", { periodo: key, ...extra }, hojeISO);
    }
    patch(patchObj);
  }
  function doseFeita(key) { return !!(state.rehabLog[hojeISO] && state.rehabLog[hojeISO][key]); }

  function onRegistrarCarga(exName, kg, atingiuTopo) {
    const pr = ehPR(state.cargas, exName, kg);
    const patchObj = { cargas: registrarCarga(state.cargas, exName, kg, atingiuTopo, hojeISO) };
    if (pr) patchObj.eventos = registrarEvento(state.eventos, "pr", { exercicio: exName, kg }, hojeISO);
    patch(patchObj);
    return pr;
  }

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
      feitaKeys={{ [activeDoseKey]: doseFeita(activeDoseKey) }}
      onBack={() => { setScr("home"); setActiveDoseKey(null); }}
      onRoutineComplete={(completude) => markDose(activeDoseKey, completude)}
    />;
  }

  // ══════════════════════ HISTÓRICO ══════════════════════
  if (scr === "historico") return <Historico eventos={state.eventos} hojeISO={hojeISO} onBack={() => setScr("home")} onEventosChange={(eventos) => patch({ eventos })} />;

  // ══════════════════════ RELATÓRIOS ══════════════════════
  if (scr === "relatorios") return <Relatorios eventos={state.eventos} hojeISO={hojeISO} cargas={state.cargas} macrofase={progresso.macrofase} testesLog={state.testesLog} dorLog={state.dorLog} onBack={() => setScr("home")}
    passosSemanaAtual={passosSemanaAtual()} onRegistrarPassosSemana={registrarPassosSemana}
    tenis={state.tenis} onAdicionarTenis={adicionarTenis} onRegistrarKmTenis={registrarKmTenis} onRemoverTenis={removerTenis}
    semanasDeclaradas={state.semanasDeclaradas} onDeclararSemana={declararSemana}
    onAbrirRelatorioMedico={() => setScr("relatorioMedico")}
    prioridadeTemporada={state.prioridadeTemporada} onMudarPrioridade={(v) => patch({ prioridadeTemporada: v })} />;

  // ══════════════════════ RELATÓRIO MÉDICO (Bloco 6.2) ══════════════════════
  if (scr === "relatorioMedico") return <RelatorioMedico eventos={state.eventos} hojeISO={hojeISO} onboarding={state.onboarding} onBack={() => setScr("relatorios")} />;

  // ══════════════════════ LEMBRETES ══════════════════════
  if (scr === "lembretes") return <LembreteScreen onBack={() => setScr("home")} />;

  // ══════════════════════ PREVIEW ══════════════════════
  if (scr === "preview" && sessaoAtual) {
    return <Preview steps={sessaoAtual.steps} label={sessaoAtual.label} cor={sessaoAtual.cor} icon={sessaoAtual.icon} resumo={sessaoAtual.resumo}
      aviso={validarAgendamento(state.eventos, hojeISO, sessaoAtual.tipo)}
      onBack={() => setScr("home")} onIniciar={() => { limparResume(); setScr("workout"); }} />;
  }

  // ══════════════════════ WORKOUT ══════════════════════
  if (scr === "workout" && sessaoAtual) {
    return <WorkoutScreen steps={sessaoAtual.steps} sessionLabel={sessaoAtual.label} cor={sessaoAtual.cor} grupoCarga={sessaoAtual.grupo}
      cargas={state.cargas} onRegistrarCarga={onRegistrarCarga} dorMedia7d={dorMedia7d()}
      isCorrida={["caminhada", "walkrun", "qualidade", "longao"].includes(sessaoAtual.tipo)}
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
    dorHoje={planoAcabou ? dorDaSemanaAtual() : state.dorLog[hojeISO]} diasSemRegistroDor={diasSemRegistroDor()} onRegistrarDor={registrarDor}
    modoManutencao={planoAcabou} reativadoManutencao={reativadoManutencao}
    cargaPeHoje={cargaPeHoje()} onRegistrarCargaPe={registrarCargaPe}
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
    onAbrirLembretes={() => setScr("lembretes")}
    onRecalibrar={() => { setRecalibrando(true); setScr("onboarding"); }}
    retomar={resume ? { label: resume.label, passo: resume.sI + 1, total: resume.tot } : null}
    onRetomar={retomarSessao} onDescartarRetomar={limparResume}
    planoSeEntao={state.planoSeEntao} onSalvarPlano={salvarPlanoSeEntao}
    isSegunda={new Date(hojeISO + "T00:00:00").getDay() === 1}
    diasSemUso={diasSemUsoApp()}
    instalarPwa={!(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) && !window.navigator.standalone}
    precisaBackup={precisaBackup()} onFazerBackup={fazerBackup}
    recaida={comparacaoRecaida(state.eventos, hojeISO)}
    semanaDeclarada={semanaAtualDeclarada()} onDeclararSemana={(tipo) => declararSemana(segundaFeiraDaSemana(hojeISO), tipo)}
  />;
}
