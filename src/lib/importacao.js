// ══════════════════════ IMPORTAÇÃO — dados do Atalho do iPhone (Bloco 3) ══════════════════════
// Funções puras. Sem HealthKit via web (não existe) — o Atalho lê o Saúde e copia um JSON
// pequeno pra área de transferência; aqui só valida, decide o que entra e grava eventos.
// Contrato (mudar quebra o Atalho já montado no iPhone):
//   { versao: 1, gerado: "YYYY-MM-DD",
//     passos: [{ data, total }], treinos: [{ data, tipo, distanciaKm, duracaoMin, fcMedia, cadencia }],
//     peso: [{ data, kg }] }
import { registrar, listar } from "./eventos.js";

export function validarImportacao(texto) {
  let json;
  try { json = JSON.parse(texto); } catch {
    return { ok: false, erro: "O que está colado não parece ser o export do Atalho (JSON inválido)." };
  }
  if (!json || typeof json !== "object" || json.versao !== 1) {
    return { ok: false, erro: "Formato não reconhecido — esperado o JSON versão 1 do Atalho." };
  }
  const passos = Array.isArray(json.passos) ? json.passos.filter(p => p && p.data && p.total != null) : [];
  const treinos = Array.isArray(json.treinos) ? json.treinos.filter(t => t && t.data && t.tipo) : [];
  const peso = Array.isArray(json.peso) ? json.peso.filter(p => p && p.data && p.kg != null) : [];
  if (!passos.length && !treinos.length && !peso.length) {
    return { ok: false, erro: "JSON válido, mas sem nenhum passo, treino ou peso dentro." };
  }
  return { ok: true, dados: { passos, treinos, peso } };
}

// Peso manual (sem payload.importado) sempre vence — conta quantos dias de peso importado
// seriam ignorados por já ter registro manual naquele dia. Passos e treinos não têm essa
// noção de conflito: passos_dia é só substituído por data, treino_importado nunca
// sobrescreve treino_concluido (ver mesclarTreinoImportado) — então nunca é "ignorado".
export function prepararPreview(dados, eventos) {
  const pesoManualDias = new Set(listar(eventos).filter(e => e.tipo === "peso" && !e.payload.importado).map(e => e.data));
  const pesoIgnorados = dados.peso.filter(p => pesoManualDias.has(p.data)).length;
  return { passos: dados.passos.length, treinos: dados.treinos.length, peso: dados.peso.length - pesoIgnorados, pesoIgnorados };
}

function substituirPorData(eventos, tipo, iso) { return eventos.filter(e => !(e.tipo === tipo && e.data === iso)); }
function substituirImportadoPorData(eventos, tipo, iso) { return eventos.filter(e => !(e.tipo === tipo && e.data === iso && e.payload && e.payload.importado)); }

// Idempotente: reimportar o mesmo arquivo não duplica — cada dia é substituído, nunca somado.
export function aplicarImportacao(eventosOriginais, dados) {
  let ev = eventosOriginais;

  dados.passos.forEach(p => {
    ev = registrar(substituirPorData(ev, "passos_dia", p.data), "passos_dia", { total: p.total }, p.data);
  });

  dados.treinos.forEach(t => {
    ev = registrar(substituirPorData(ev, "treino_importado", t.data), "treino_importado",
      { tipo: t.tipo, distanciaKm: t.distanciaKm, duracaoMin: t.duracaoMin, fcMedia: t.fcMedia, cadencia: t.cadencia }, t.data);
  });

  const pesoManualDias = new Set(listar(eventosOriginais).filter(e => e.tipo === "peso" && !e.payload.importado).map(e => e.data));
  dados.peso.forEach(p => {
    if (pesoManualDias.has(p.data)) return; // manual vence, dia ignorado
    ev = registrar(substituirImportadoPorData(ev, "peso", p.data), "peso", { kg: p.kg, importado: true }, p.data);
  });

  return ev;
}

// Dias com treino_importado E treino_concluido no mesmo dia — candidatos a mesclar campo
// ausente (distância, tempo, FC, cadência) no treino_concluido. Nunca automático.
export function diasComMergePendente(eventos) {
  const importados = new Map(listar(eventos).filter(e => e.tipo === "treino_importado").map(e => [e.data, e]));
  return listar(eventos)
    .filter(e => e.tipo === "treino_concluido" && importados.has(e.data))
    .map(e => e.data)
    .filter((data, i, arr) => arr.indexOf(data) === i);
}

export function mesclarTreinoImportado(eventos, iso) {
  const importado = listar(eventos).find(e => e.tipo === "treino_importado" && e.data === iso);
  const concluido = listar(eventos).find(e => e.tipo === "treino_concluido" && e.data === iso);
  if (!importado || !concluido) return eventos;
  const payload = { ...concluido.payload };
  if (payload.distanciaKm == null && importado.payload.distanciaKm != null) payload.distanciaKm = importado.payload.distanciaKm;
  if (payload.tempoTotalMin == null && importado.payload.duracaoMin != null) payload.tempoTotalMin = importado.payload.duracaoMin;
  if (payload.fcMedia == null && importado.payload.fcMedia != null) payload.fcMedia = importado.payload.fcMedia;
  if (payload.cadencia == null && importado.payload.cadencia != null) payload.cadencia = importado.payload.cadencia;
  return registrar(eventos.filter(e => e.id !== concluido.id), "treino_concluido", payload, iso);
}
