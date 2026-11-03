import { existsSync, readFileSync, statSync } from "node:fs";

const LIMITE_BYTES = 40 * 1024;
const LOGO_CLARA = "public/flynow-logo-176.png";
const LOGO_ESCURA = "public/flynow-logo-escuro-176.png";
const FONTES = [
  "node_modules/@fontsource-variable/fraunces",
  "node_modules/@fontsource-variable/inter",
];

const problemas = [];

function ler(caminho) {
  try {
    return readFileSync(caminho, "utf8");
  } catch {
    return "";
  }
}

/** Lê largura e altura direto do cabeçalho IHDR do PNG. */
function dimensoesPng(caminho) {
  const bytes = readFileSync(caminho);
  if (bytes.subarray(1, 4).toString("latin1") !== "PNG") {
    throw new Error(`${caminho} não é um PNG válido`);
  }
  return { largura: bytes.readUInt32BE(16), altura: bytes.readUInt32BE(20) };
}

// Regressão conhecida: a logo já foi recortada em quadrado e perdia as laterais.
// Ela é um lockup horizontal (globo + "FlyNow" + "VIAGENS"), entre 2,4:1 e 3:1.
const referencias = new Map();

for (const caminho of [LOGO_CLARA, LOGO_ESCURA, "public/flynow-logo-88.png", "public/flynow-logo-escuro-88.png"]) {
  if (!existsSync(caminho)) {
    problemas.push(`logo ausente: ${caminho}`);
    continue;
  }

  const tamanho = statSync(caminho).size;
  if (caminho.includes("176") && tamanho > LIMITE_BYTES) {
    problemas.push(`${caminho} tem ${(tamanho / 1024).toFixed(1)} KB (limite 40 KB)`);
  }

  const { largura, altura } = dimensoesPng(caminho);
  const proporcao = largura / altura;
  referencias.set(caminho, proporcao);

  if (caminho.includes("176") && largura !== 176) {
    problemas.push(`${caminho} deveria ter 176 px de largura, tem ${largura}`);
  }
  if (proporcao < 2.4 || proporcao > 3) {
    problemas.push(
      `${caminho} está com proporção ${proporcao.toFixed(2)}:1; a logo é horizontal (2,4:1 a 3:1). ` +
        "Rode scripts/otimizar-logo.ps1 para regerar sem cortar.",
    );
  }
}

const proporcaoClara = referencias.get(LOGO_CLARA);
if (proporcaoClara !== undefined) {
  for (const [caminho, proporcao] of referencias) {
    if (Math.abs(proporcao - proporcaoClara) > 0.12) {
      problemas.push(`${caminho} tem proporção diferente da logo clara (${proporcaoClara.toFixed(2)}:1)`);
    }
  }
}

for (const caminho of FONTES) {
  if (!existsSync(caminho)) problemas.push(`pacote de fonte ausente: ${caminho}`);
}

const main = ler("src/main.tsx");
if (!main.includes("./styles/fontes.css")) {
  problemas.push("src/main.tsx não importa ./styles/fontes.css");
}

const fontes = ler("src/styles/fontes.css");
for (const pacote of ["@fontsource-variable/fraunces", "@fontsource-variable/inter"]) {
  if (!fontes.includes(pacote)) problemas.push(`src/styles/fontes.css não importa ${pacote}`);
}

// A marca é um background (para trocar de arte com o tema) e precisa estar
// declarada como imagem acessível, com a variante noturna ligada ao data-tema.
const base = ler("src/index.css");
if (!base.includes("flynow-logo-escuro-176.png")) {
  problemas.push("src/index.css não troca a logo no tema noturno");
}
if (!/\[data-tema="noturno"\][^{]*\.brand-logo/.test(base)) {
  problemas.push("src/index.css: variante noturna da logo não está presa ao data-tema");
}

for (const arquivo of ["src/components/Header.tsx", "src/pages/Login.tsx"]) {
  const tsx = ler(arquivo);
  if (!tsx.includes('role="img"') || !tsx.includes('aria-label="FlyNow Viagens"')) {
    problemas.push(`${arquivo}: logo sem role="img"/aria-label`);
  }
}

if (problemas.length) {
  console.error(`Assets reprovados (${problemas.length}):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}

console.log("assets OK");
