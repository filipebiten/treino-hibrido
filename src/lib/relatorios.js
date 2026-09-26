// ══════════════════════ RELATÓRIOS — funções puras de cálculo (BI pessoal) ══════════════════════
// Entram eventos + período, saem números. Sem React, sem side-effect.

import { toISO, MARCO_ZERO } from "../data/plano.js";
import { agruparPorDia } from "./eventos.js";

const DIAS_PERIODO = { "7d": 7, "30d": 30, "90d": 90, tudo: null };

export function periodoParaDatas(periodo, hojeISO) {
  const dias = DIAS_PERIODO[periodo];
  if (dias == null) return { desde: MARCO_ZERO, ate: hojeISO };
  const hoje = new Date(hojeISO + "T00:00:00");
  const desde = toISO(new Date(hoje.getTime() - (dias - 1) * 86400000));
  return { desde: desde < MARCO_ZERO ? MARCO_ZERO : desde, ate: hojeISO };
}

function listaDatas(desde, ate) {
  const out = [];
  const fim = new Date(ate + "T00:00:00");
  for (let d = new Date(desde + "T00:00:00"); d <= fim; d.setDate(d.getDate() + 1)) out.push(toISO(d));
  return out;
}

// ponytail: "planejado" assume 1 dose de manhã + 1 de noite por dia — o regime
// atual (macrofase 1, único vivido até aqui). Uma macrofase futura com dose
// "unica"/"tarde" muda o que "planejado" significa — revisar quando chegar lá.
export function aderenciaRehab(eventos, desde, ate) {
  const dias = agruparPorDia(eventos);
  const datas = listaDatas(desde, ate);
  let manhaFeitas = 0, noiteFeitas = 0;
  const porSemana = [];
  for (let i = 0; i < datas.length; i += 7) {
    const semana = datas.slice(i, i + 7);
    let mF = 0, nF = 0;
    semana.forEach(iso => {
      const d = dias[iso];
      if (d && d.periodos.includes("manha")) { mF++; manhaFeitas++; }
      if (d && d.periodos.includes("noite")) { nF++; noiteFeitas++; }
    });
    porSemana.push({ inicio: semana[0], manhaPct: Math.round((mF / semana.length) * 100), noitePct: Math.round((nF / semana.length) * 100) });
  }
  const total = datas.length;
  return {
    manha: { feitas: manhaFeitas, planejadas: total, pct: total ? Math.round((manhaFeitas / total) * 100) : 0 },
    noite: { feitas: noiteFeitas, planejadas: total, pct: total ? Math.round((noiteFeitas / total) * 100) : 0 },
    porSemana,
  };
}
