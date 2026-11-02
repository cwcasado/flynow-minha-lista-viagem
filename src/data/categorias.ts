import type { Categoria } from "../types";

/** Taxonomia única de categorias — usada nos filtros do topo e nas etiquetas das fotos. */
export const CATEGORIAS: { chave: Categoria; icone: string }[] = [
  { chave: "Natureza", icone: "natureza" },
  { chave: "Praias", icone: "praias" },
  { chave: "Histórico", icone: "historico" },
  { chave: "Monumentos", icone: "monumentos" },
  { chave: "Gastronomia", icone: "gastronomia" },
  { chave: "Cultura", icone: "cultura" },
  { chave: "Aventura", icone: "aventura" },
  { chave: "Ponto turístico", icone: "ponto-turistico" },
];

/** Categoria usada quando uma foto não tem etiqueta própria. */
export const CATEGORIA_PADRAO: Categoria = "Ponto turístico";

export function ehCategoria(valor: string): valor is Categoria {
  return CATEGORIAS.some((categoria) => categoria.chave === valor);
}

export function iconeDaCategoria(categoria: Categoria): string {
  return CATEGORIAS.find((item) => item.chave === categoria)?.icone ?? "ponto-turistico";
}
