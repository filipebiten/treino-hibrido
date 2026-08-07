import { createServer } from "vite";
import assert from "node:assert";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const { getMacrofase, hojeEfetivo, getRehabForMacrofase } = await server.ssrLoadModule("/src/App.jsx");

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

console.log("OK - getMacrofase: todos os casos passaram");
await server.close();
