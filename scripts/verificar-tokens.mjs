import { readFileSync } from "node:fs";

const ARQUIVOS = ["src/styles/tokens.css", "src/index.css"];

const EXIGIDOS = [
  "--bg", "--bg-card", "--text", "--text-light", "--text-soft",
  "--primary", "--primary-light", "--accent", "--accent-hover", "--border",
  "--error", "--error-text", "--success", "--shadow", "--shadow-hover",
  "--radius", "--radius-sm", "--transition",
  "--icon-size", "--icon-size-sm", "--icon-size-lg", "--icon-color",
  "--space-1", "--space-2", "--space-3", "--space-4", "--space-5",
  "--space-6", "--space-7", "--space-8", "--space-9",
  "--fs-display", "--fs-h1", "--fs-h2", "--fs-body", "--fs-sm", "--fs-xs", "--fs-kicker",
  "--radius-lg", "--radius-pill",
  "--elev-1", "--elev-2", "--elev-3",
  "--dur-fast", "--dur", "--dur-slow", "--ease",
  "--font-display", "--font-text",
];

function ler(caminho) {
  try {
    return readFileSync(caminho, "utf8");
  } catch {
    return "";
  }
}

const definicoes = new Map();
const usados = new Set();
const duplicados = [];

for (const arquivo of ARQUIVOS) {
  const css = ler(arquivo);

  for (const achado of css.matchAll(/^\s*(--[\w-]+)\s*:/gm)) {
    const nome = achado[1];
    const anterior = definicoes.get(nome);
    if (anterior && anterior !== arquivo) duplicados.push(`${nome} (${anterior} + ${arquivo})`);
    definicoes.set(nome, arquivo);
  }

  for (const achado of css.matchAll(/var\(\s*(--[\w-]+)/g)) {
    usados.add(achado[1]);
  }
}

const naoDefinidos = [...usados].filter((nome) => !definicoes.has(nome)).sort();
const faltando = EXIGIDOS.filter((nome) => !definicoes.has(nome));

if (naoDefinidos.length || faltando.length || duplicados.length) {
  if (naoDefinidos.length) console.error(`Tokens usados sem definição (${naoDefinidos.length}):\n  ${naoDefinidos.join("\n  ")}`);
  if (faltando.length) console.error(`Tokens exigidos ausentes (${faltando.length}):\n  ${faltando.join("\n  ")}`);
  if (duplicados.length) console.error(`Tokens definidos em mais de um arquivo (${duplicados.length}):\n  ${duplicados.join("\n  ")}`);
  process.exit(1);
}

console.log(`tokens OK (${definicoes.size} definidos)`);
