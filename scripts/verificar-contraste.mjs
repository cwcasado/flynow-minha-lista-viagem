import { readFileSync } from "node:fs";

const CSS = "src/styles/tokens.css";

/** Pares obrigatórios: [frente, fundo, mínimo]. Mínimo 3 para borda de controle, 4,5 para texto. */
const PARES = [
  ["--text", "--bg", 4.5],
  ["--text-light", "--bg", 4.5],
  ["--text-soft", "--bg-card", 4.5],
  ["--primary", "--bg", 4.5],
  ["--primary-light", "--bg", 4.5],
  ["--accent", "--bg", 4.5],
  ["--accent-hover", "--bg", 4.5],
  ["--on-accent", "--accent", 4.5],
  ["--border-strong", "--bg-card", 3],
  ["--error", "--bg", 4.5],
  ["--error-text", "--bg", 4.5],
  ["--success", "--bg-card", 4.5],
];

function luminancia(hex) {
  const canais = hex.replace("#", "").match(/../g).map((par) => parseInt(par, 16) / 255);
  const [r, g, b] = canais.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

const css = readFileSync(CSS, "utf8");
const tema = new Map();

for (const achado of css.matchAll(/--([\w-]+):\s*light-dark\(\s*(#[0-9a-fA-F]{6})\s*,\s*(#[0-9a-fA-F]{6})\s*\)/g)) {
  tema.set(`--${achado[1]}`, [achado[2], achado[3]]);
}

const problemas = [];
let verificados = 0;

for (const [frente, fundo, minimo] of PARES) {
  const parFrente = tema.get(frente);
  const parFundo = tema.get(fundo);

  if (!parFrente || !parFundo) {
    problemas.push(`${frente} ou ${fundo}: token ausente ou fora do formato light-dark()`);
    continue;
  }

  for (const [indice, nome] of [[0, "claro"], [1, "escuro"]]) {
    const valor = contraste(parFrente[indice], parFundo[indice]);
    verificados += 1;
    if (valor < minimo) {
      problemas.push(`${frente} sobre ${fundo} (${nome}) = ${valor.toFixed(2)}:1, mínimo ${minimo}:1`);
    }
  }
}

if (problemas.length) {
  console.error(`Contraste reprovado (${problemas.length}):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}

console.log(`contraste OK (${verificados} pares)`);
