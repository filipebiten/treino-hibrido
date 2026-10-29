// ══════════════════════ PERGUNTAS — motor da fila de captura (Bloco 1) ══════════════════════
// Funções puras, sem React. Decide O QUE perguntar hoje; a UI (Home.jsx) decide COMO mostrar
// e aplica o limite de 2 por abertura (estado local do componente, não vive aqui).
import { diffDias, toISO } from "../data/plano.js";
import { listar } from "./eventos.js";

const TIPOS_CORRIDA = ["caminhada", "walkrun", "qualidade", "longao"];

function segundaFeiraDaSemana(iso) {
  const d = new Date(iso + "T00:00:00");
  const offset = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return toISO(new Date(d.getTime() - offset * 86400000));
}

function treinoCorridaHoje(eventos, hojeISO) {
  return listar(eventos).find(e => e.tipo === "treino_concluido" && e.data === hojeISO && TIPOS_CORRIDA.includes(e.payload.tipo));
}

// Catálogo: cada item decide por si (deveriaPerguntar) se entra na fila hoje. `respondePor`
// lista os tipos de evento que contam como resposta real — usado só por pulosConsecutivos,
// pra saber se um pulo antigo já foi "superado" por uma resposta depois dele. Item sem
// evento próprio (semana_declarada, teste_campo — vivem em state, não em eventos) usa [].
export const CATALOGO = [
  { id: "dor_matinal", pergunta: "Dor no calcanhar hoje?", tipo: "escala0a10", prioridade: 100, respondePor: ["dor_checkin"],
    // Bloco 6 (manutenção vitalícia) já tem check-in semanal próprio na Home, fora da fila —
    // não duplicar aqui enquanto esse modo não for também migrado pra fila.
    deveriaPerguntar: ({ eventos, hojeISO, modoManutencao }) => !modoManutencao && !eventos.some(e => e.tipo === "dor_checkin" && e.data === hojeISO) },

  { id: "carga_pe", pergunta: "Quanto tempo em pé hoje?", tipo: "opcoes", prioridade: 90, respondePor: ["carga_pe"],
    opcoes: [["leve", "Leve (sentado maior parte)"], ["normal", "Normal"], ["muito", "Muito tempo em pé"]],
    deveriaPerguntar: ({ eventos, hojeISO }) => !eventos.some(e => e.tipo === "carga_pe" && e.data === hojeISO) },

  { id: "distancia_km", pergunta: "Quantos km você correu?", tipo: "numero", prioridade: 95, respondePor: ["treino_concluido"],
    deveriaPerguntar: ({ eventos, hojeISO }) => { const t = treinoCorridaHoje(eventos, hojeISO); return !!t && t.payload.distanciaKm == null; } },

  { id: "tempo_min", pergunta: "Quanto tempo durou a corrida?", tipo: "numero", prioridade: 95, respondePor: ["treino_concluido"],
    deveriaPerguntar: ({ eventos, hojeISO }) => { const t = treinoCorridaHoje(eventos, hojeISO); return !!t && t.payload.tempoTotalMin == null; } },

  { id: "temperatura", pergunta: "Temperatura durante a corrida? (°C)", tipo: "numero", prioridade: 60, respondePor: ["treino_concluido"],
    deveriaPerguntar: ({ eventos, hojeISO }) => { const t = treinoCorridaHoje(eventos, hojeISO); return !!t && t.payload.temperaturaC == null; } },

  { id: "umidade", pergunta: "Umidade durante a corrida? (%)", tipo: "numero", prioridade: 55, respondePor: ["treino_concluido"],
    deveriaPerguntar: ({ eventos, hojeISO }) => { const t = treinoCorridaHoje(eventos, hojeISO); return !!t && t.payload.umidadePct == null; } },

  { id: "superficie", pergunta: "Superfície da corrida?", tipo: "opcoes", prioridade: 50, respondePor: ["treino_concluido"],
    opcoes: [["asfalto", "Asfalto"], ["esteira", "Esteira"], ["terra", "Terra"]],
    deveriaPerguntar: ({ eventos, hojeISO }) => { const t = treinoCorridaHoje(eventos, hojeISO); return !!t && t.payload.superficie == null; } },

  // Sem `opcoes` fixo — Home monta as opções a partir de `tenis` (nome de cada par).
  { id: "tenis_usado", pergunta: "Qual tênis você usou?", tipo: "opcoes-tenis", prioridade: 50, respondePor: ["treino_concluido"],
    deveriaPerguntar: ({ eventos, hojeISO, tenis }) => { if (!tenis || tenis.length < 2) return false; const t = treinoCorridaHoje(eventos, hojeISO); return !!t && t.payload.tenisId == null; } },

  { id: "cadencia", pergunta: "Cadência média (passos/min)?", tipo: "numero", prioridade: 40, respondePor: ["treino_concluido"],
    deveriaPerguntar: ({ eventos, hojeISO }) => { const t = treinoCorridaHoje(eventos, hojeISO); return !!t && t.payload.cadencia == null; } },

  { id: "semana_declarada", pergunta: "Essa semana é normal ou apertada?", tipo: "opcoes", prioridade: 85, respondePor: [],
    opcoes: [["normal", "Normal"], ["apertada", "Apertada"]],
    deveriaPerguntar: ({ hojeISO, semanasDeclaradas, isSegunda }) => !!isSegunda && !semanasDeclaradas[segundaFeiraDaSemana(hojeISO)] },

  { id: "peso_corporal", pergunta: "Peso de hoje (kg)?", tipo: "numero", prioridade: 70, respondePor: ["peso"],
    deveriaPerguntar: ({ eventos, hojeISO }) => {
      const pesos = listar(eventos).filter(e => e.tipo === "peso");
      if (!pesos.length) return false;
      return diffDias(pesos[pesos.length - 1].data, hojeISO) >= 7;
    } },

  // Dispensada se o Bloco 3 (importação Atalhos) já cobriu a semana com `passos_dia`.
  { id: "passos_media", pergunta: "Média de passos/dia essa semana?", tipo: "numero", prioridade: 65, respondePor: ["passos_semana", "passos_dia"],
    deveriaPerguntar: ({ eventos, hojeISO }) => {
      const semanaISO = segundaFeiraDaSemana(hojeISO);
      const jaTem = eventos.some(e =>
        (e.tipo === "passos_semana" && e.data === semanaISO) ||
        (e.tipo === "passos_dia" && e.data >= semanaISO && e.data <= hojeISO));
      return !jaTem;
    } },

  // Convite, não pergunta direta — abre o formulário já existente em Relatórios (13).
  // Só nagueia manutenção de um hábito já estabelecido; não força o primeiro teste.
  { id: "teste_campo", pergunta: "Hora de um teste de campo pra atualizar zonas de ritmo", tipo: "convite", prioridade: 45, respondePor: [],
    deveriaPerguntar: ({ hojeISO, testesCampo }) => {
      if (!testesCampo || !testesCampo.length) return false;
      const ultimo = [...testesCampo].sort((a, b) => a.data < b.data ? 1 : -1)[0];
      return diffDias(ultimo.data, hojeISO) >= 42;
    } },

  // Convite mensal — bloqueado em semana de dor acima da baseline (mesma regra de
  // reativação do modo manutenção, ver App.jsx `dorAcimaBaseline`).
  { id: "teste_funcional", pergunta: "Teste funcional mensal (heel raise unilateral)", tipo: "convite", prioridade: 45, respondePor: ["teste_funcional"],
    deveriaPerguntar: ({ eventos, hojeISO, dorAcimaBaseline }) => {
      if (dorAcimaBaseline) return false;
      const testes = listar(eventos).filter(e => e.tipo === "teste_funcional");
      if (!testes.length) return true;
      return diffDias(testes[testes.length - 1].data, hojeISO) >= 28;
    } },
];

export function puladaHoje(eventos, hojeISO, perguntaId) {
  return eventos.some(e => e.tipo === "pergunta_pulada" && e.data === hojeISO && e.payload.perguntaId === perguntaId);
}

// Pulos seguidos sem resposta real depois — pra cada pulo (do mais recente pro mais antigo),
// se existir uma resposta depois dele, a sequência quebrou aí. Sem `respondePor` (item vive
// em state, não em eventos), nunca quebra — 3 pulos seguidos de algo que só se resolve fora
// da fila (ex: declarar semana manualmente de outro jeito) também entra em modo discreto.
export function pulosConsecutivos(eventos, pergunta) {
  const pulos = eventos.filter(e => e.tipo === "pergunta_pulada" && e.payload.perguntaId === pergunta.id).sort((a, b) => b.timestamp - a.timestamp);
  let n = 0;
  for (const p of pulos) {
    const respondidoDepois = eventos.some(e => pergunta.respondePor.includes(e.tipo) && e.timestamp > p.timestamp);
    if (respondidoDepois) break;
    n++;
  }
  return n;
}

const MAX_PULOS_MODO_DISCRETO = 3;

// Fila completa de hoje, ordenada por prioridade (empate: ordem do catálogo — early-exit
// sem desambiguação fina, amostra pequena o suficiente pra não importar). Não aplica o
// limite de 2 por abertura — isso é estado de UI (Home), não decisão do motor.
export function filaCandidatos(ctx) {
  return CATALOGO
    .filter(p => p.deveriaPerguntar(ctx) && !puladaHoje(ctx.eventos, ctx.hojeISO, p.id) && pulosConsecutivos(ctx.eventos, p) < MAX_PULOS_MODO_DISCRETO)
    .sort((a, b) => b.prioridade - a.prioridade);
}
