// ══════════════════════ CADÊNCIA — retreinamento (Bloco 2, avaliação biomecânica 19/08/2021) ══════════════════════
// Linha de base 2021: 153 PPM a 9 km/h em esteira (marcado como alterado), com overstriding e fase
// de voo aumentada. Fisio pediu +5-10% → 161-168 PPM. 153 é medida de 2021: a linha de base ATUAL
// é desconhecida até nova avaliação — por isso a progressão parte da média real registrada no app.
// Regra: nunca subir mais de 5% de uma vez, teto 168, próximo degrau só após 2 semanas na faixa
// atual sem piora da dor matinal.
import { listar } from "./eventos.js";

export const CADENCIA_2021 = { ppm: 153, data: "2021-08-19" };
export const META_CADENCIA = { min: 161, max: 168 };
export const METRONOMO_MIN = 150, METRONOMO_MAX = 180;
const MIN_REGISTROS = 3;
const JANELA_MEDIA = 5;
const DIAS_NO_DEGRAU = 14;
const TOLERANCIA_FAIXA = 2; // PPM abaixo do alvo ainda conta como "na faixa" (relógio arredonda)
const PIORA_DOR = 0.5;      // média de dor 7d subir mais que isso = piorou

// Caminhada fica de fora: cadência de andar (~110-120) puxaria a média pra baixo sem ter a ver
// com a passada de corrida. ponytail: walk/run ainda mistura; separar se o relógio der só trechos de corrida.
const TIPOS_CORRIDA = ["walkrun", "qualidade", "longao"];

export function serieCadencia(eventos) {
  return listar(eventos)
    .filter(e => e.tipo === "treino_concluido" && TIPOS_CORRIDA.includes(e.payload.tipo) && e.payload.cadencia != null)
    .map(e => ({ iso: e.data, val: Number(e.payload.cadencia) }));
}

export function alvoAtual(eventos) {
  const ev = listar(eventos).filter(e => e.tipo === "cadencia_alvo");
  return ev.length ? { ppm: ev[ev.length - 1].payload.ppm, desdeISO: ev[ev.length - 1].data } : null;
}

const media = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
const diasEntre = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
const deslocar = (iso, dias) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + dias); return d.toISOString().slice(0, 10); };
const proximoDegrau = base => Math.min(META_CADENCIA.max, Math.round(base * 1.05));

function dorMediaJanela(dorLog, fimISO) {
  const vals = [];
  for (let i = 0; i < 7; i++) { const v = dorLog[deslocar(fimISO, -i)]; if (v != null) vals.push(v); }
  return vals.length >= 3 ? media(vals) : null;
}

// fase: "medir" (sem 3 registros) | "meta" (já ≥168) | "sugerir" (1º degrau) | "manter" | "proximo"
export function sugestaoCadencia(eventos, dorLog, hojeISO) {
  const serie = serieCadencia(eventos);
  if (serie.length < MIN_REGISTROS) return { fase: "medir", faltam: MIN_REGISTROS - serie.length };
  const mediaAtual = Math.round(media(serie.slice(-JANELA_MEDIA).map(p => p.val)));
  const alvo = alvoAtual(eventos);

  if (!alvo) {
    if (mediaAtual >= META_CADENCIA.max) return { fase: "meta", mediaAtual };
    return { fase: "sugerir", mediaAtual, alvo: proximoDegrau(mediaAtual) };
  }
  if (alvo.ppm >= META_CADENCIA.max) return { fase: "meta", mediaAtual, alvo: alvo.ppm };

  const dias = diasEntre(alvo.desdeISO, hojeISO);
  const desde = serie.filter(p => p.iso >= alvo.desdeISO);
  const mediaDesde = desde.length ? Math.round(media(desde.map(p => p.val))) : null;
  if (dias < DIAS_NO_DEGRAU) return { fase: "manter", mediaAtual, alvo: alvo.ppm, motivo: `Faltam ${DIAS_NO_DEGRAU - dias} dia(s) no degrau atual.` };
  if (desde.length < 2 || mediaDesde < alvo.ppm - TOLERANCIA_FAIXA) return { fase: "manter", mediaAtual, alvo: alvo.ppm, motivo: "Cadência ainda não está na faixa do alvo atual (precisa de 2+ corridas registradas perto dele)." };

  const dorAntes = dorMediaJanela(dorLog, deslocar(alvo.desdeISO, -1));
  const dorAgora = dorMediaJanela(dorLog, hojeISO);
  if (dorAntes == null || dorAgora == null) return { fase: "manter", mediaAtual, alvo: alvo.ppm, motivo: "Sem registro de dor matinal suficiente pra confirmar que não piorou." };
  if (dorAgora > dorAntes + PIORA_DOR) return { fase: "manter", mediaAtual, alvo: alvo.ppm, motivo: "Dor matinal subiu desde o início do degrau — fica nele." };

  return { fase: "proximo", mediaAtual, alvo: alvo.ppm, proximo: proximoDegrau(mediaDesde) };
}

// Preset do metrônomo: alvo aceito > média atual > 160.
export function presetMetronomo(eventos) {
  const alvo = alvoAtual(eventos);
  if (alvo) return alvo.ppm;
  const serie = serieCadencia(eventos);
  const p = serie.length ? Math.round(media(serie.slice(-JANELA_MEDIA).map(x => x.val))) : 160;
  return Math.max(METRONOMO_MIN, Math.min(METRONOMO_MAX, p));
}
