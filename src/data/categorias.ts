import type { Categoria } from "../types";

/** Taxonomia única de categorias — usada nos filtros do topo e nas etiquetas das fotos. */
export const CATEGORIAS: { chave: Categoria; emoji: string }[] = [
  { chave: "Natureza", emoji: "🌿" },
  { chave: "Praias", emoji: "🏖️" },
  { chave: "Histórico", emoji: "🏛️" },
  { chave: "Monumentos", emoji: "🗿" },
  { chave: "Gastronomia", emoji: "🍲" },
  { chave: "Cultura", emoji: "🎭" },
  { chave: "Aventura", emoji: "🥾" },
  { chave: "Ponto turístico", emoji: "📍" },
];

/** Categoria usada quando uma foto não tem etiqueta própria. */
export const CATEGORIA_PADRAO: Categoria = "Ponto turístico";

export function ehCategoria(valor: string): valor is Categoria {
  return CATEGORIAS.some((categoria) => categoria.chave === valor);
}

export function emojiDaCategoria(categoria: Categoria): string {
  return CATEGORIAS.find((item) => item.chave === categoria)?.emoji ?? "📍";
}
