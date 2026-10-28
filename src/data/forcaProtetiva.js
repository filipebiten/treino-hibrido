// ══════════════════════ BLOCO 5.1 — FORÇA PROTETIVA ══════════════════════
// Aditivo, não mexe no ABC existente (musculacao.js). Oferecido como bloco opcional
// extra pra quem quer reforçar prevenção de lesão de corrida, não substitui o ABC.
export const FORCA_PROTETIVA = {
  id: "forca-protetiva", title: "Força protetiva", subtitle: "2-3x/semana, fora do dia de leg day", time: "~15 min",
  exercises: [
    { name: "Heel raise joelho reto (panturrilha)", sets: 3, reps: 15, type: "exercise", rest: 45,
      how: "Em pé, joelhos esticados. Suba na ponta dos pés, pause 1s no topo, desça lento (gastrocnêmio)." },
    { name: "Heel raise joelho dobrado (panturrilha)", sets: 3, reps: 15, type: "exercise", rest: 45,
      how: "Mesma subida, joelhos levemente dobrados o tempo todo (sóleo)." },
    { name: "Glúteo médio — step-down lateral", sets: 3, reps: 10, type: "exercise", rest: 45,
      how: "Em pé num degrau, desça o outro pé devagar até quase tocar o chão sem deixar o quadril cair de lado. Unilateral." },
    { name: "Nórdico (isquiotibiais)", sets: 3, reps: 6, type: "exercise", rest: 60,
      how: "Ajoelhado, tornozelos presos (parceiro ou móvel fixo). Incline o corpo pra frente o mais devagar possível, freando com os isquiotibiais. Pode apoiar as mãos no chão no fim." },
    { name: "Core antirrotação (Pallof press)", sets: 3, reps: 12, type: "exercise", rest: 45,
      how: "Elástico fixado ao lado, segure na altura do peito. Empurre pra frente sem deixar o tronco girar. Troca de lado a cada série." },
  ],
};

// Pliometria — maior impacto articular, por isso tem gate: só libera depois de 4
// semanas (28 dias) com dor estável e baixa. Sem isso, pliometria em fascite ativa
// pode piorar o quadro.
export const PLIOMETRIA = {
  id: "pliometria", title: "Pliometria leve", subtitle: "1x/semana — só após gate liberado", time: "~8 min",
  exercises: [
    { name: "Skip baixo", sets: 3, duration: 20, type: "timer", how: "Corrida no lugar, joelhos baixos, contato rápido e leve com o chão." },
    { name: "Pular corda (ou simulado)", sets: 3, duration: 30, type: "timer", how: "Saltos pequenos, aterrissagem na ponta do pé, joelhos levemente flexionados." },
  ],
};

const GATE_DIAS = 28;
const GATE_DOR_MAX_MEDIA = 2;
const GATE_DOR_MAX_PICO = 4;

// Bloco 5.1 — gate de pliometria: dor baixa e estável nas últimas 4 semanas.
export function gatePliometria(dorLog, hojeISO) {
  const dias = [];
  for (let i = 0; i < GATE_DIAS; i++) {
    const d = new Date(hojeISO + "T00:00:00"); d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (dorLog[iso] != null) dias.push(dorLog[iso]);
  }
  if (dias.length < GATE_DIAS * 0.7) return { liberado: false, motivo: `Faltam registros de dor — precisa de ~${GATE_DIAS} dias de histórico pra avaliar estabilidade.` };
  const media = dias.reduce((s, d) => s + d, 0) / dias.length;
  const pico = Math.max(...dias);
  if (media > GATE_DOR_MAX_MEDIA || pico > GATE_DOR_MAX_PICO) {
    return { liberado: false, motivo: `Dor ainda não está baixa e estável o suficiente (média ${media.toFixed(1)}, pico ${pico}) — pliometria fica pra depois.` };
  }
  return { liberado: true };
}

// Bloco 5.2 — teste funcional mensal: heel raise unilateral até falha, cada perna.
// Assimetria >10% entre as pernas é sinal de alerta (não crítico, só pra acompanhar).
const LIMIAR_ASSIMETRIA_PCT = 10;
export function calcularAssimetria(repsEsquerda, repsDireita) {
  if (!repsEsquerda || !repsDireita) return null;
  const maior = Math.max(repsEsquerda, repsDireita), menor = Math.min(repsEsquerda, repsDireita);
  const pct = Math.round(((maior - menor) / maior) * 100);
  return { pct, acimaDoLimiar: pct > LIMIAR_ASSIMETRIA_PCT };
}
