import { createServer } from "vite";
import assert from "node:assert";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const { getMacrofaseInfo, totalSemanas, getMacrofaseCalendario, diffDias, MARCO_ZERO } = await server.ssrLoadModule("/src/data/plano.js");
const { calcularPosicao, verificarGate, checkRecuoAutomatico, rathleffStatus, diasConsecutivosDorBaixa } = await server.ssrLoadModule("/src/lib/progressao.js");
const { buildCaminhadaSession, buildWalkRunSession, buildContinuoSession, buildMetaSession, CAMINHADAS_GATE_IDS } = await server.ssrLoadModule("/src/data/corrida.js");
const { buildMuscSession, MA, getMuscPhaseIndex } = await server.ssrLoadModule("/src/data/musculacao.js");
const { getRehabForMacrofase } = await server.ssrLoadModule("/src/data/rehab.js");
const { registrar, listar, editar, remover, migrarParaEventos } = await server.ssrLoadModule("/src/lib/eventos.js");

// ══════════════════════ CALENDÁRIO ══════════════════════
assert.strictEqual(totalSemanas(1), 4);
assert.strictEqual(totalSemanas(2), 4);
assert.strictEqual(totalSemanas(3), 4);
assert.strictEqual(totalSemanas(4), 3);
assert.strictEqual(getMacrofaseInfo(4).fim, "2027-01-03");
assert.strictEqual(diffDias(MARCO_ZERO, "2026-09-21"), 0);
assert.strictEqual(diffDias(MARCO_ZERO, "2026-09-22"), 1);
assert.deepStrictEqual(getMacrofaseCalendario(new Date("2026-09-21T00:00:00")), { macrofase: 1, semanaIdx: 0 });
assert.deepStrictEqual(getMacrofaseCalendario(new Date("2026-10-19T00:00:00")), { macrofase: 2, semanaIdx: 0 });

// ══════════════════════ ONBOARDING / POSIÇÃO ══════════════════════
let p = calcularPosicao({ dor: 6, semanasParado: "0" }, null);
assert.strictEqual(p.macrofase, 1);
assert.strictEqual(p.dorAlta, true);

p = calcularPosicao({ dor: 1, semanasParado: "0" }, null);
assert.strictEqual(p.acelerarTestes, true);
assert.strictEqual(p.force3x15, false);

p = calcularPosicao({ dor: 3, semanasParado: "+6" }, { macrofase: 3, semanaIdx: 2 });
assert.strictEqual(p.macrofase, 1); // gap reposiciona em M1
assert.strictEqual(p.force3x15, true);

p = calcularPosicao({ dor: 2, semanasParado: "0" }, { macrofase: 2, semanaIdx: 1 });
assert.strictEqual(p.macrofase, 2); // sem gap, mantém posição
assert.strictEqual(p.semanaIdx, 1);

// ══════════════════════ GATES ══════════════════════
let g = verificarGate(1, { testesLog: {}, dorLog: {}, hojeISO: "2026-10-18" });
assert.strictEqual(g.ok, false);
assert.ok(g.faltando.length === 2);

const testesOk = {};
CAMINHADAS_GATE_IDS.forEach(id => testesOk[id] = { passou: true, iso: "2026-10-10" });
const dorLog5dias = {};
["2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"].forEach(iso => dorLog5dias[iso] = 1);
g = verificarGate(1, { testesLog: testesOk, dorLog: dorLog5dias, hojeISO: "2026-10-18" });
assert.strictEqual(g.ok, true);

assert.strictEqual(diasConsecutivosDorBaixa(dorLog5dias, "2026-10-18", 2), 5);
assert.strictEqual(diasConsecutivosDorBaixa({}, "2026-10-18", 2), 0);

g = verificarGate(2, { testesLog: {} });
assert.strictEqual(g.ok, false);
g = verificarGate(2, { testesLog: { corrida5min: { passou: true } } });
assert.strictEqual(g.ok, true);

g = verificarGate(3, { testesLog: { teste5km: { passou: false } } });
assert.strictEqual(g.ok, false);
g = verificarGate(3, { testesLog: { teste5km: { passou: true } } });
assert.strictEqual(g.ok, true);

// ══════════════════════ RECUO AUTOMÁTICO ══════════════════════
let dorLog = { "2026-10-01": 1, "2026-10-02": 1, "2026-10-03": 1, "2026-10-04": 1, "2026-10-05": 1, "2026-10-06": 4, "2026-10-07": 4 };
let r = checkRecuoAutomatico(dorLog, "2026-10-07");
assert.strictEqual(r.trigger, true);

dorLog = { "2026-10-01": 1, "2026-10-02": 1, "2026-10-03": 1, "2026-10-04": 1, "2026-10-05": 1, "2026-10-06": 1, "2026-10-07": 1 };
r = checkRecuoAutomatico(dorLog, "2026-10-07");
assert.strictEqual(r.trigger, false);

r = checkRecuoAutomatico({}, "2026-10-07");
assert.strictEqual(r.trigger, false);

// ══════════════════════ RATHLEFF 36-72H ══════════════════════
const agora = Date.parse("2026-10-10T12:00:00");
let rl = rathleffStatus(null, agora);
assert.strictEqual(rl.liberado, true);
rl = rathleffStatus(agora - 10 * 3600000, agora); // 10h atrás
assert.strictEqual(rl.liberado, false);
rl = rathleffStatus(agora - 40 * 3600000, agora); // 40h atrás
assert.strictEqual(rl.liberado, true);

// ══════════════════════ SESSÕES DE CORRIDA ══════════════════════
let c = buildCaminhadaSession(0);
assert.strictEqual(c.testeId, "cam_s1_20");
c = buildCaminhadaSession(3);
assert.strictEqual(c.testeId, "cam_s4_45");

let wr = buildWalkRunSession(0);
assert.ok(wr.resumo.includes("min corrida"));

let cont = buildContinuoSession(3, "l");
assert.ok(cont.teste); // S12 longão é teste 5km
cont = buildContinuoSession(0, "l");
assert.strictEqual(cont.teste, null);

let meta = buildMetaSession(2, "l");
assert.ok(meta.teste); // S15 longão é teste 10km

// ══════════════════════ MUSCULAÇÃO ══════════════════════
assert.strictEqual(getMuscPhaseIndex(1, 0), 0);
assert.strictEqual(getMuscPhaseIndex(2, 0), 0);
assert.strictEqual(getMuscPhaseIndex(2, 3), 1);
assert.strictEqual(getMuscPhaseIndex(3, 0), 1);
assert.strictEqual(getMuscPhaseIndex(4, 0), 2);

let sessao = buildMuscSession(MA, 1, 0, false); // S1 — leve, 3x15
let main = sessao.find(s => s.name && s.name.includes("Supino reto halteres"));
assert.strictEqual(main.reps, 15);
assert.strictEqual(main.sets, 3);

sessao = buildMuscSession(MA, 1, 2, false); // S3 — pirâmide normal
main = sessao.find(s => s.name && s.name.includes("Supino reto halteres"));
assert.strictEqual(main.reps, "12-10-8-6");

sessao = buildMuscSession(MA, 1, 2, true); // force3x15 (parado +6 semanas)
main = sessao.find(s => s.name && s.name.includes("Supino reto halteres"));
assert.strictEqual(main.reps, 15);

// ══════════════════════ REHAB ══════════════════════
let reh = getRehabForMacrofase(1, 0, true, false);
assert.strictEqual(reh.carga, null); // S1 não tem carga ainda
reh = getRehabForMacrofase(1, 1, true, false);
assert.ok(reh.carga); // S2 dia alternado tem carga
assert.strictEqual(reh.carga.exercises[0].sets, 3);
assert.strictEqual(reh.carga.exercises[0].reps, 12);

reh = getRehabForMacrofase(2, 0, true, false);
assert.strictEqual(reh.carga.exercises[0].sets, 4);
assert.strictEqual(reh.carga.exercises[0].reps, 10);

reh = getRehabForMacrofase(1, 0, false, true); // dor alta — reforçado, sem carga
assert.strictEqual(reh.reforcado, true);
assert.strictEqual(reh.carga, null);

// ══════════════════════ EVENTOS ══════════════════════
let ev = registrar([], "dor_checkin", { nivel: 3 }, "2026-09-25");
assert.strictEqual(ev.length, 1);
assert.strictEqual(ev[0].tipo, "dor_checkin");
ev = registrar(ev, "peso", { kg: 89 }, "2026-09-26");
assert.strictEqual(listar(ev, { desde: "2026-09-26" }).length, 1);
assert.strictEqual(listar(ev, {}).length, 2);
const id0 = ev[0].id;
ev = editar(ev, id0, { retroativo: true });
assert.strictEqual(ev.find(e => e.id === id0).retroativo, true);
ev = remover(ev, id0);
assert.strictEqual(ev.length, 1);

const estadoLegado = {
  dorLog: { "2026-09-21": 4 }, pesoLog: { "2026-09-21": 89 },
  rehabLog: { "2026-09-21": { manha: true, carga: true } },
  rathleffLog: { "2026-09-21": 123 },
  historicoTreinos: [{ iso: "2026-09-21", label: "Treino A", duracaoSeg: 1800, volume: 500 }],
  testesLog: { caminhada20: { passou: true, iso: "2026-09-21" } },
  ultimoRecuoISO: "2026-09-22", eventos: [], eventosMigrados: false,
};
const migrado = migrarParaEventos(estadoLegado);
assert.strictEqual(migrado.eventosMigrados, true);
assert.strictEqual(migrado.eventos.length, 7); // dor + peso + rehab_dose(manha) + rathleff(carga) + treino_concluido + teste + recuo — rathleffLog não duplica pois já coberto via rehabLog.carga
assert.strictEqual(migrarParaEventos(migrado).eventos.length, migrado.eventos.length); // idempotente

console.log("check-plano.mjs: todos os testes passaram");
await server.close();
