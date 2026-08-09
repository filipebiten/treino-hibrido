import { createServer } from "vite";
import assert from "node:assert";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const { getMacrofase, hojeEfetivo, getRehabForMacrofase, isDiaAtivo, proximoDiaAtivo, ultimoDiaAtivoAte, diaCompleto, computeChaveDiaEfetivo, INICIO_TREINO, getMuscPhaseIndex, levePeso, buildMuscSession, indicesDisponiveis, sessaoDados, sessaoDesc, MA, MB, MC, bw, grd, getRehabM2, TESTES_CAMINHADA, mkWR, buildRunM3, grdM3, getRehabM3 } = await server.ssrLoadModule("/src/App.jsx");

const d = iso => new Date(iso + "T00:00:00");

// Macrofase 0 — primeiro e último dia
assert.strictEqual(getMacrofase(d("2026-08-04")).macrofase, 0);
assert.strictEqual(getMacrofase(d("2026-08-04")).semanaIdx, 0);
assert.strictEqual(getMacrofase(d("2026-08-10")).macrofase, 0);

// Transição 0 -> 1
assert.strictEqual(getMacrofase(d("2026-08-11")).macrofase, 1);
assert.strictEqual(getMacrofase(d("2026-08-11")).semanaIdx, 0);

// Macrofase 1, semana 3 (25-31 ago, índice 2)
assert.strictEqual(getMacrofase(d("2026-08-27")).semanaIdx, 2);

// Transição 1 -> 2
assert.strictEqual(getMacrofase(d("2026-09-07")).macrofase, 1);
assert.strictEqual(getMacrofase(d("2026-09-08")).macrofase, 2);

// Macrofase 4, última semana (22-28 dez, índice 7)
assert.strictEqual(getMacrofase(d("2026-12-28")).macrofase, 4);
assert.strictEqual(getMacrofase(d("2026-12-28")).semanaIdx, 7);

// Clamp antes do início da macrofase 0
assert.strictEqual(getMacrofase(d("2026-01-01")).macrofase, 0);
assert.strictEqual(getMacrofase(d("2026-01-01")).semanaIdx, 0);

// Clamp depois do fim da macrofase 4
assert.strictEqual(getMacrofase(d("2027-01-01")).macrofase, 4);
assert.strictEqual(getMacrofase(d("2027-01-01")).semanaIdx, 7);

// Dias desde a cirurgia (11/08)
assert.strictEqual(getMacrofase(d("2026-08-18")).diasDesdeCirurgia, 7);
assert.strictEqual(getMacrofase(d("2026-08-11")).diasDesdeCirurgia, 0);

const base = d("2026-08-15").getTime();
assert.strictEqual(toISOLocal(hojeEfetivo(base, 0)), "2026-08-15");
assert.strictEqual(toISOLocal(hojeEfetivo(base, 3)), "2026-08-18");
assert.strictEqual(toISOLocal(hojeEfetivo(base, -5)), "2026-08-10");

function toISOLocal(dt) { const y=dt.getFullYear(), m=String(dt.getMonth()+1).padStart(2,"0"), dd=String(dt.getDate()).padStart(2,"0"); return y+"-"+m+"-"+dd; }

const mf0 = getRehabForMacrofase(0, 0, false);
assert.strictEqual(mf0.length, 1);
assert.strictEqual(mf0[0].exercises.length, 6);

const mf1s0 = getRehabForMacrofase(1, 0, true);
assert.strictEqual(mf1s0.length, 1); // semana 1 não tem dose de carga

const mf1s2ComCarga = getRehabForMacrofase(1, 2, true);
assert.strictEqual(mf1s2ComCarga.length, 2);
assert.strictEqual(mf1s2ComCarga[1].id, "m1-s3-carga");

const mf1s2SemCarga = getRehabForMacrofase(1, 2, false);
assert.strictEqual(mf1s2SemCarga.length, 1);

const mf1s3ComCarga = getRehabForMacrofase(1, 3, true);
assert.strictEqual(mf1s3ComCarga[1].id, "m1-s4-carga");
assert.strictEqual(mf1s3ComCarga[1].exercises.length, 4);

// isDiaAtivo — terça(2) a sexta(5)
assert.strictEqual(isDiaAtivo("2026-08-11"), true);  // terça
assert.strictEqual(isDiaAtivo("2026-08-12"), true);  // quarta
assert.strictEqual(isDiaAtivo("2026-08-14"), true);  // sexta
assert.strictEqual(isDiaAtivo("2026-08-15"), false); // sábado
assert.strictEqual(isDiaAtivo("2026-08-16"), false); // domingo
assert.strictEqual(isDiaAtivo("2026-08-17"), false); // segunda

// proximoDiaAtivo — pula fim de semana + segunda
assert.strictEqual(proximoDiaAtivo("2026-08-11"), "2026-08-12"); // terça -> quarta
assert.strictEqual(proximoDiaAtivo("2026-08-14"), "2026-08-18"); // sexta -> terça seguinte

// ultimoDiaAtivoAte
assert.strictEqual(ultimoDiaAtivoAte("2026-08-12"), "2026-08-12"); // já ativo
assert.strictEqual(ultimoDiaAtivoAte("2026-08-15"), "2026-08-14"); // sábado -> sexta anterior
assert.strictEqual(ultimoDiaAtivoAte("2026-08-17"), "2026-08-14"); // segunda -> sexta anterior

// diaCompleto — macrofase 1 semana 0 (08-11..17), dia par (diaAlternado=true) mas semana 0 não tem carga
assert.strictEqual(diaCompleto("2026-08-12", {}), false);
assert.strictEqual(diaCompleto("2026-08-12", { "2026-08-12": { manha: true, noite: true } }), true);

// diaCompleto — macrofase 1 semana 2 (08-25..31), dia par exige carga
assert.strictEqual(diaCompleto("2026-08-27", { "2026-08-27": { manha: true, noite: true } }), false);
assert.strictEqual(diaCompleto("2026-08-27", { "2026-08-27": { manha: true, noite: true, carga: true } }), true);

// computeChaveDiaEfetivo — sem base
assert.strictEqual(computeChaveDiaEfetivo(null, {}, "2026-08-13"), null);

// computeChaveDiaEfetivo — caso feliz: dia anterior completo, avança até hoje
assert.strictEqual(
  computeChaveDiaEfetivo("2026-08-12", { "2026-08-12": { manha: true, noite: true } }, "2026-08-13"),
  "2026-08-13"
);

// computeChaveDiaEfetivo — carryover: dia incompleto trava, mesmo com hoje real adiantado
assert.strictEqual(
  computeChaveDiaEfetivo("2026-08-12", {}, "2026-08-14"),
  "2026-08-12"
);

// computeChaveDiaEfetivo — avança um passo, trava no próximo incompleto
assert.strictEqual(
  computeChaveDiaEfetivo("2026-08-11", { "2026-08-11": { manha: true, noite: true } }, "2026-08-14"),
  "2026-08-12"
);

// computeChaveDiaEfetivo — chaveDiaBase empurrado pelo finalizarDia além do teto real (sábado, teto = sexta anterior):
// a função pura não clampa de volta, retorna a data futura intacta (o fix vive no branch do Home, não aqui).
assert.strictEqual(
  computeChaveDiaEfetivo("2026-08-18", {}, "2026-08-15"),
  "2026-08-18"
);

assert.strictEqual(INICIO_TREINO, "2026-08-12");

// getMuscPhaseIndex
assert.strictEqual(getMuscPhaseIndex(2, 0), 0);
assert.strictEqual(getMuscPhaseIndex(2, 3), 0);
assert.strictEqual(getMuscPhaseIndex(3, 0), 0);
assert.strictEqual(getMuscPhaseIndex(3, 1), 0);
assert.strictEqual(getMuscPhaseIndex(3, 2), 1);
assert.strictEqual(getMuscPhaseIndex(3, 3), 1);
assert.strictEqual(getMuscPhaseIndex(4, 0), 1);
assert.strictEqual(getMuscPhaseIndex(4, 3), 1);
assert.strictEqual(getMuscPhaseIndex(4, 4), 2);
assert.strictEqual(getMuscPhaseIndex(4, 7), 2);

// levePeso — converte pirâmide (reps string) e exercício simples (reps number)
assert.deepStrictEqual(levePeso({ name: "X", detail: "PIRÂMIDE", sets: 4, reps: "12-10-8-6", rest: 90, type: "exercise" }), { name: "X", sets: 3, reps: 15, rest: 90, type: "exercise" });
assert.deepStrictEqual(levePeso({ name: "Y", sets: 4, reps: 12, rest: 45, type: "exercise" }), { name: "Y", sets: 3, reps: 15, rest: 45, type: "exercise" });

// levePeso — não mexe em exercícios que não são "exercise" (timed_exercise, tabata passam intocados)
const timedEx = { name: "Prancha", detail: "Core", sets: 3, duration: 60, rest: 30, type: "timed_exercise" };
assert.deepStrictEqual(levePeso(timedEx), timedEx);
const tabataEx = { name: "Tabata", sets: 2, type: "tabata", tabataWork: 20, tabataRest: 10, tabataRounds: 8, rest: 60 };
assert.deepStrictEqual(levePeso(tabataEx), tabataEx);

// buildMuscSession — macrofase 2 semana 0 (leve) vs semana 3 (padrão, = MA[0] literal)
const m2s0 = buildMuscSession(MA, 2, 0);
const secaoTreinoS0 = m2s0.find(s => s.section && s.section.startsWith("💪"));
assert.ok(secaoTreinoS0);
const primeiroExS0 = m2s0[m2s0.indexOf(secaoTreinoS0) + 1];
assert.strictEqual(primeiroExS0.sets, 3);
assert.strictEqual(primeiroExS0.reps, 15);

const m2s3 = buildMuscSession(MA, 2, 3);
const secaoTreinoS3 = m2s3.find(s => s.section && s.section.startsWith("💪"));
const primeiroExS3 = m2s3[m2s3.indexOf(secaoTreinoS3) + 1];
assert.strictEqual(primeiroExS3.sets, MA[0].m[0].sets);
assert.strictEqual(primeiroExS3.reps, MA[0].m[0].reps);

// buildMuscSession — semana leve não altera Prancha (timed_exercise) nem Tabata: idênticos entre semana leve e padrão
const mbLeve = buildMuscSession(MB, 2, 0);
const mbPadrao = buildMuscSession(MB, 2, 3);
const acharPrancha = e => e.name === "Prancha abdominal";
const acharTabata = e => e.name === "Abdominal Tabata";
assert.deepStrictEqual(mbLeve.find(acharPrancha), mbPadrao.find(acharPrancha));
assert.deepStrictEqual(mbLeve.find(acharTabata), mbPadrao.find(acharTabata));

// indicesDisponiveis
assert.deepStrictEqual(indicesDisponiveis(2), [0, 2, 4]);
assert.deepStrictEqual(indicesDisponiveis(3), [0, 1, 2, 3, 4, 5]);
assert.deepStrictEqual(indicesDisponiveis(4), [0, 1, 2, 3, 4, 5]);

// sessaoDados — macrofase 2 usa buildMuscSession, ses ímpar (corrida) retorna vazio
const sd2_0 = sessaoDados(2, 0, 0, 2);
assert.ok(sd2_0.some(s => s.section && s.section.startsWith("💪")));
assert.deepStrictEqual(sessaoDados(2, 0, 1, 2), []);

// sessaoDados — macrofase < 2 continua usando o motor antigo (bw)
assert.deepStrictEqual(sessaoDados(1, 0, 0, 5), bw(5, 0));

// sessaoDesc — slots de musculação não têm descrição; macrofase < 2 usa grd
assert.strictEqual(sessaoDesc(2, 0, 0, 2), "");
assert.strictEqual(sessaoDesc(1, 0, 1, 5), grd(5, 1));

const m2semCarga = getRehabM2(false);
assert.strictEqual(m2semCarga.length, 1);
assert.strictEqual(m2semCarga[0].id, "m2-base");

const m2comCarga = getRehabM2(true);
assert.strictEqual(m2comCarga.length, 2);
assert.strictEqual(m2comCarga[1].id, "m2-carga");
assert.strictEqual(m2comCarga[1].exercises[0].reps, 10);

assert.strictEqual(TESTES_CAMINHADA.length, 3);
assert.strictEqual(TESTES_CAMINHADA[0].id, "caminhada20");
assert.strictEqual(TESTES_CAMINHADA[2].id, "caminhada40");

// mkWR
const wr = mkWR(2, 60, 120);
assert.strictEqual(wr.length, 4); // 2 ciclos = 4 steps (corrida+caminhada cada)
assert.strictEqual(wr[0].name, "Corrida 1");
assert.strictEqual(wr[0].duration, 60);
assert.strictEqual(wr[1].name, "Caminhada 1");
assert.strictEqual(wr[1].duration, 120);

// buildRunM3 — semana 0 (1min/2min x8) vs semana 3 (5min/1min x5, última entrada — clampada)
const rm3s0 = buildRunM3(0);
const secaoWR_s0 = rm3s0.find(s => s.section && s.section.includes("WALK/RUN"));
assert.ok(secaoWR_s0.section.includes("1min corrida"));
const rm3s3 = buildRunM3(3);
const secaoWR_s3 = rm3s3.find(s => s.section && s.section.includes("WALK/RUN"));
assert.ok(secaoWR_s3.section.includes("5min corrida"));
assert.strictEqual(buildRunM3(99).length, rm3s3.length); // clamp na última semana

// grdM3
assert.strictEqual(grdM3(0), "~5km");
assert.strictEqual(grdM3(3), "~8km");

// getRehabM3
const m3semCarga = getRehabM3(false);
assert.strictEqual(m3semCarga.length, 1);
assert.strictEqual(m3semCarga[0].id, "m3-base");
const m3comCarga = getRehabM3(true);
assert.strictEqual(m3comCarga.length, 2);
assert.strictEqual(m3comCarga[1].id, "m3-carga");
assert.strictEqual(m3comCarga[1].exercises[0].reps, 8);

// sessaoDados/sessaoDesc — macrofase 3 roteia corrida pros índices ímpares
const sd3_1 = sessaoDados(3, 0, 1, 2);
assert.ok(sd3_1.some(s => s.section && s.section.includes("WALK/RUN")));
assert.strictEqual(sessaoDesc(3, 0, 1, 2), "~5km");
// musculação continua igual (já coberto pela macrofase 2, só confirma que macrofase 3 não quebrou)
assert.ok(sessaoDados(3, 0, 0, 2).some(s => s.section && s.section.startsWith("💪")));

console.log("OK - getMacrofase: todos os casos passaram");
await server.close();
