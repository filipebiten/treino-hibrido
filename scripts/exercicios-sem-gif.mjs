// Lista exercícios usados no app (musculacao/rehab/corrida) sem gif mapeado em gifs.js.
// Rodar: node scripts/exercicios-sem-gif.mjs
import { readFileSync } from "fs";

function collectNames(src) {
  const names = new Set();
  const re = /name\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) names.add(m[1].replace(/^↑\s*/, "").replace(/^❄️\s*/, "").trim());
  return names;
}

const musculacaoSrc = readFileSync(new URL("../src/data/musculacao.js", import.meta.url), "utf8");
const rehabSrc = readFileSync(new URL("../src/data/rehab.js", import.meta.url), "utf8");
const corridaSrc = readFileSync(new URL("../src/data/corrida.js", import.meta.url), "utf8");
const gifsSrc = readFileSync(new URL("../src/data/gifs.js", import.meta.url), "utf8");

const used = new Set([
  ...collectNames(musculacaoSrc),
  ...collectNames(rehabSrc),
  ...collectNames(corridaSrc),
]);

function collectGifMapKeys(src) {
  const body = src.split("const GIF_MAP")[1]?.split("};")[0] ?? "";
  const names = new Set();
  const re = /^\s*"([^"]+)"\s*:/gm;
  let m;
  while ((m = re.exec(body))) names.add(m[1]);
  return names;
}

const mapped = collectGifMapKeys(gifsSrc);

const semGif = [...used].filter((n) => !mapped.has(n)).sort();

console.log(`Total exercícios usados: ${used.size}`);
console.log(`Com gif mapeado: ${mapped.size}`);
console.log(`Sem gif: ${semGif.length}\n`);
semGif.forEach((n) => console.log("- " + n));
