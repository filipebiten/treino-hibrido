// ══════════════════════ CARGA POR EXERCÍCIO, HISTÓRICO, PESO CORPORAL ══════════════════════

// Registra o kg usado numa série. Se bateu o topo da faixa de reps em 2 sessões seguidas,
// sinaliza sugestão de aumento (+2,5kg superiores / +5kg inferiores). `reps` (Bloco 5.3,
// opcional) são as reps REALMENTE feitas — pré-preenchidas com o alvo prescrito na UI, mas
// o usuário pode ajustar ou limpar; sem isso, fica null (nunca inventa e1RM, ver `e1rm`).
export function registrarCarga(cargas, exName, kg, atingiuTopo, iso, reps = null) {
  const atual = cargas[exName] || { ultimaKg: null, historico: [], streakTopo: 0 };
  const streakTopo = atingiuTopo ? atual.streakTopo + 1 : 0;
  const historico = [...atual.historico, { iso, kg, atingiuTopo, reps }].slice(-20);
  return { ...cargas, [exName]: { ultimaKg: kg, historico, streakTopo } };
}

// e1RM por Epley — só quando reps realmente feitas foram registradas E reps ≤ 10 (acima
// disso a fórmula de Epley erra demais pra ser honesto). Sem reps, retorna null — nunca
// estima a partir do alvo prescrito.
export function e1rm(kg, reps) {
  if (reps == null || reps > 10 || reps < 1 || kg == null) return null;
  return Math.round(kg * (1 + reps / 30) * 10) / 10;
}

// PR por peso — compara contra o maior kg já registrado nesse exercício.
export function ehPR(cargas, exName, kg) {
  const reg = cargas[exName];
  if (!reg || !reg.historico || !reg.historico.length) return false;
  const maior = Math.max(...reg.historico.map(h => h.kg));
  return kg > maior;
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
