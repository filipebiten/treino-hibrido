// ══════════════════════ CARGA POR EXERCÍCIO, HISTÓRICO, PESO CORPORAL ══════════════════════

// Registra o kg usado numa série. Se bateu o topo da faixa de reps em 2 sessões seguidas,
// sinaliza sugestão de aumento (+2,5kg superiores / +5kg inferiores).
export function registrarCarga(cargas, exName, kg, atingiuTopo, iso) {
  const atual = cargas[exName] || { ultimaKg: null, historico: [], streakTopo: 0 };
  const streakTopo = atingiuTopo ? atual.streakTopo + 1 : 0;
  const historico = [...atual.historico, { iso, kg, atingiuTopo }].slice(-20);
  return { ...cargas, [exName]: { ultimaKg: kg, historico, streakTopo } };
}

export function sugestaoCarga(cargas, exName, grupo) {
  const reg = cargas[exName];
  if (!reg || reg.streakTopo < 2 || reg.ultimaKg == null) return null;
  const incremento = grupo === "inferior" ? 5 : 2.5;
  return { kg: reg.ultimaKg + incremento, incremento };
}

export function registrarHistoricoTreino(historico, entry) {
  return [entry, ...historico].slice(0, 200);
}

export function registrarPeso(pesoLog, iso, kg) { return { ...pesoLog, [iso]: kg }; }

export function tendenciaPeso(pesoLog) {
  const entradas = Object.entries(pesoLog).sort((a, b) => a[0] < b[0] ? -1 : 1);
  if (entradas.length < 2) return null;
  const [, primeiro] = entradas[0], [, ultimo] = entradas[entradas.length - 1];
  return { delta: ultimo - primeiro, entradas };
}
