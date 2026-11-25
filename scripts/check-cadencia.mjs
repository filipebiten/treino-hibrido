// Self-check da regra de cadência (Bloco 2). Rodar: node scripts/check-cadencia.mjs
import assert from "node:assert";
import { sugestaoCadencia, presetMetronomo } from "../src/lib/cadencia.js";
let n = 0;
const ev = (tipo, payload, data) => ({ id: String(++n), data, timestamp: n, tipo, payload });
const corrida = (data, cadencia, tipo = "walkrun") => ev("treino_concluido", { tipo, cadencia }, data);
const dor = (ini, dias, v) => Object.fromEntries(Array.from({ length: dias }, (_, i) => { const d = new Date(ini + "T00:00:00"); d.setDate(d.getDate() + i); return [d.toISOString().slice(0, 10), v]; }));

assert.equal(sugestaoCadencia([corrida("2026-11-01", 150), corrida("2026-11-02", 150), corrida("2026-11-03", 110, "caminhada")], {}, "2026-11-10").fase, "medir");
const base = [corrida("2026-11-01", 150), corrida("2026-11-03", 152), corrida("2026-11-05", 154)];
let s = sugestaoCadencia(base, {}, "2026-11-06");
assert.deepEqual([s.fase, s.mediaAtual, s.alvo], ["sugerir", 152, 160]);           // 152*1.05=159.6→160
assert.equal(sugestaoCadencia([corrida("a", 166), corrida("b", 167), corrida("c", 166)].map((e, i) => ({ ...e, data: "2026-11-0" + (i + 1) })), {}, "2026-11-06").alvo, 168); // teto
const comAlvo = [...base, ev("cadencia_alvo", { ppm: 160 }, "2026-11-06"), corrida("2026-11-10", 159), corrida("2026-11-15", 161)];
assert.equal(sugestaoCadencia(comAlvo, {}, "2026-11-12").fase, "manter");           // <14 dias
const dorOk = { ...dor("2026-10-30", 7, 2), ...dor("2026-11-14", 7, 2) };
s = sugestaoCadencia(comAlvo, dorOk, "2026-11-20");
assert.deepEqual([s.fase, s.proximo], ["proximo", 168]);                          // 160*1.05=168
assert.equal(sugestaoCadencia(comAlvo, { ...dor("2026-10-30", 7, 2), ...dor("2026-11-14", 7, 4) }, "2026-11-20").fase, "manter"); // dor piorou
assert.equal(sugestaoCadencia(comAlvo, {}, "2026-11-20").fase, "manter");           // sem dor = não confirma
assert.equal(presetMetronomo(comAlvo), 160);
assert.equal(presetMetronomo([]), 160);
console.log("check-cadencia ok");
