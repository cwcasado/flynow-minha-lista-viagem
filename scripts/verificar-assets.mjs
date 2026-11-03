import { existsSync, readFileSync, statSync } from "node:fs";

const LOGO = ["public/flynow-logo-88.png", "public/flynow-logo-176.png"];
const LIMITE_BYTES = 40 * 1024;
const FONTES = [
  "node_modules/@fontsource-variable/fraunces",
  "node_modules/@fontsource-variable/inter",
];

const problemas = [];

for (const caminho of LOGO) {
  if (!existsSync(caminho)) {
    problemas.push(`logo ausente: ${caminho}`);
    continue;
  }
  const tamanho = statSync(caminho).size;
  if (caminho.includes("176") && tamanho > LIMITE_BYTES) {
    problemas.push(`${caminho} tem ${(tamanho / 1024).toFixed(1)} KB (limite 40 KB)`);
  }
}

for (const caminho of FONTES) {
  if (!existsSync(caminho)) problemas.push(`pacote de fonte ausente: ${caminho}`);
}

function ler(caminho) {
  try {
    return readFileSync(caminho, "utf8");
  } catch {
    return "";
  }
}

const main = ler("src/main.tsx");
if (!main.includes("./styles/fontes.css")) {
  problemas.push("src/main.tsx não importa ./styles/fontes.css");
}

const fontes = ler("src/styles/fontes.css");
for (const pacote of ["@fontsource-variable/fraunces", "@fontsource-variable/inter"]) {
  if (!fontes.includes(pacote)) problemas.push(`src/styles/fontes.css não importa ${pacote}`);
}

for (const arquivo of ["src/components/Header.tsx", "src/pages/Login.tsx"]) {
  const tsx = ler(arquivo);
  if (!tsx.includes("srcSet")) problemas.push(`${arquivo}: logo sem srcSet`);
  if (!/width=\{[^}]+\}/.test(tsx) || !/height=\{[^}]+\}/.test(tsx)) {
    problemas.push(`${arquivo}: logo sem width/height explícitos`);
  }
}

if (problemas.length) {
  console.error(`Assets reprovados (${problemas.length}):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}

console.log("assets OK");
