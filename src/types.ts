export type Categoria =
  | "Natureza"
  | "Praias"
  | "Histórico"
  | "Monumentos"
  | "Gastronomia"
  | "Cultura"
  | "Aventura"
  | "Ponto turístico";

export interface Foto {
  url: string;
  titulo: string;
  categoria: Categoria;
  credito?: string;
  licenca?: string;
}

export interface Destino {
  id: string;
  nome: string;
  descricao: string;
  /** Foto de capa — sempre igual a `fotos[0].url` quando há galeria. */
  imagem?: string;
  url?: string;
  /** Categorias do destino, usadas nos filtros. */
  categorias?: Categoria[];
  /** Galeria com 6 fotos, cada uma com sua própria categoria. */
  fotos?: Foto[];
}

export interface ContatoFormData {
  nome: string;
  email: string;
  mensagem: string;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

export interface Desejo {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}
