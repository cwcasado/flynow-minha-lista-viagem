import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CATALOGO_DESTINOS } from "../data/destinos";
import type { Categoria, Destino } from "../types";

const CHAVE_LISTA = "flynow-minha-lista";
const CHAVE_TEMA = "flynow-tema";

export type Tema = "claro" | "noturno";
export type FiltroCategoria = Categoria | "todas";

type PaginaWiki = {
  pageid?: number;
  title?: string;
  extract?: string;
  fullurl?: string;
};

type Redirecionamento = { from: string; to: string };

type RespostaWiki = {
  query?: {
    pages?: Record<string, PaginaWiki>;
    redirects?: Redirecionamento[];
  };
};

/** A API devolve no máximo 20 extracts por requisição (exlimit). */
const TAMANHO_LOTE = 20;

type DestinosContextValue = {
  destinos: Destino[];
  destinosFiltrados: Destino[];
  carregando: boolean;
  /** Aviso discreto quando a Wikipedia falha e o catálogo local assume. */
  aviso: string | null;
  busca: string;
  setBusca: (valor: string) => void;
  categoria: FiltroCategoria;
  setCategoria: (categoria: FiltroCategoria) => void;
  contagemCategorias: Map<Categoria, number>;
  minhaLista: Destino[];
  minhaListaIds: Set<string>;
  alternarMinhaLista: (destino: Destino) => void;
  limparMinhaLista: () => void;
  tema: Tema;
  alternarTema: () => void;
};

const DestinosContext = createContext<DestinosContextValue | null>(null);

/** Minúsculo e sem acentos, para casar títulos da Wikipedia e buscas. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function recortar(texto: string, limite = 180): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite);
  const ultimoEspaco = corte.lastIndexOf(" ");
  return `${(ultimoEspaco > 80 ? corte.slice(0, ultimoEspaco) : corte).trim()}…`;
}

function lerListaSalva(): Destino[] {
  try {
    const bruto = localStorage.getItem(CHAVE_LISTA);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? (dados as Destino[]) : [];
  } catch {
    return [];
  }
}

function lerTemaSalvo(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    if (salvo === "noturno" || salvo === "claro") return salvo;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "noturno" : "claro";
  } catch {
    return "claro";
  }
}

export function DestinosProvider({ children }: { children: ReactNode }) {
  const [destinos, setDestinos] = useState<Destino[]>(CATALOGO_DESTINOS);
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<FiltroCategoria>("todas");

  const [minhaListaSalva, setMinhaListaSalva] = useState<Destino[]>(lerListaSalva);
  const [tema, setTema] = useState<Tema>(lerTemaSalvo);

  // Textos (descrição) vêm da Wikipedia; fotos e categorias vêm do catálogo local.
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const titulos = CATALOGO_DESTINOS.map((destino) => destino.nome);
        const lotes: string[][] = [];
        for (let inicio = 0; inicio < titulos.length; inicio += TAMANHO_LOTE) {
          lotes.push(titulos.slice(inicio, inicio + TAMANHO_LOTE));
        }

        // A Wikipedia devolve no máximo 20 extracts por requisição. Com 25
        // destinos é preciso mais de um lote para todos receberem o texto real.
        const respostas = await Promise.all(
          lotes.map(async (lote) => {
            const url =
              "https://pt.wikipedia.org/w/api.php" +
              `?action=query&titles=${encodeURIComponent(lote.join("|"))}` +
              "&prop=extracts|info&exintro&explaintext&exlimit=20&redirects=1" +
              "&inprop=url&format=json&origin=*";

            const resposta = await fetch(url);
            if (!resposta.ok) throw new Error(`Wikipedia respondeu ${resposta.status}`);
            return (await resposta.json()) as RespostaWiki;
          }),
        );

        const porTitulo = new Map<string, PaginaWiki>();
        const redirecionamentos: Redirecionamento[] = [];
        let totalPaginas = 0;

        for (const dados of respostas) {
          const paginas = Object.values(dados.query?.pages ?? {});
          totalPaginas += paginas.length;
          for (const pagina of paginas) {
            if (pagina.title) porTitulo.set(normalizar(pagina.title), pagina);
          }
          redirecionamentos.push(...(dados.query?.redirects ?? []));
        }

        if (totalPaginas === 0) throw new Error("Resposta sem páginas");

        // A API devolve o título canônico (ex.: "Jalapão" → "Parque Estadual do Jalapão").
        const acharPagina = (nome: string): PaginaWiki | undefined => {
          const chave = normalizar(nome);
          const direta = porTitulo.get(chave);
          if (direta) return direta;

          const redirecionado = redirecionamentos.find(
            (item) => normalizar(item.from) === chave,
          );
          return redirecionado ? porTitulo.get(normalizar(redirecionado.to)) : undefined;
        };

        const mesclados = CATALOGO_DESTINOS.map((base) => {
          const pagina = acharPagina(base.nome);
          const extract = pagina?.extract?.trim();

          return {
            ...base,
            descricao: extract && extract.length > 20 ? recortar(extract) : base.descricao,
            url: pagina?.fullurl ?? base.url,
            imagem: base.fotos?.[0]?.url ?? base.imagem,
          } satisfies Destino;
        });

        if (!cancelado) {
          setDestinos(mesclados);
          setAviso(null);
        }
      } catch (erro) {
        console.error(erro);
        if (!cancelado) {
          setDestinos(CATALOGO_DESTINOS);
          setAviso("Textos da Wikipedia indisponíveis — mostrando as descrições locais.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  // Favoritos sempre com as fotos/descrições atuais do catálogo.
  const minhaLista = useMemo(
    () =>
      minhaListaSalva.map(
        (item) => destinos.find((destino) => destino.id === item.id) ?? item,
      ),
    [minhaListaSalva, destinos],
  );

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_LISTA, JSON.stringify(minhaListaSalva));
    } catch {
      /* quota cheia: a lista continua válida em memória */
    }
  }, [minhaListaSalva]);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    try {
      localStorage.setItem(CHAVE_TEMA, tema);
    } catch {
      /* sem persistência, mas o tema aplica na sessão */
    }
  }, [tema]);

  const alternarMinhaLista = useCallback((destino: Destino) => {
    setMinhaListaSalva((anterior) =>
      anterior.some((item) => item.id === destino.id)
        ? anterior.filter((item) => item.id !== destino.id)
        : [...anterior, destino],
    );
  }, []);

  const limparMinhaLista = useCallback(() => setMinhaListaSalva([]), []);

  const alternarTema = useCallback(() => {
    setTema((anterior) => (anterior === "noturno" ? "claro" : "noturno"));
  }, []);

  const minhaListaIds = useMemo(
    () => new Set(minhaLista.map((destino) => destino.id)),
    [minhaLista],
  );

  const contagemCategorias = useMemo(() => {
    const contagem = new Map<Categoria, number>();
    for (const destino of destinos) {
      for (const item of destino.categorias ?? []) {
        contagem.set(item, (contagem.get(item) ?? 0) + 1);
      }
    }
    return contagem;
  }, [destinos]);

  const destinosFiltrados = useMemo(() => {
    let lista = destinos;

    if (categoria !== "todas") {
      lista = lista.filter((destino) => destino.categorias?.includes(categoria));
    }

    const termo = normalizar(busca);
    if (termo) {
      lista = lista.filter(
        (destino) =>
          normalizar(destino.nome).includes(termo) ||
          normalizar(destino.descricao).includes(termo),
      );
    }

    return lista;
  }, [destinos, categoria, busca]);

  const valor: DestinosContextValue = {
    destinos,
    destinosFiltrados,
    carregando,
    aviso,
    busca,
    setBusca,
    categoria,
    setCategoria,
    contagemCategorias,
    minhaLista,
    minhaListaIds,
    alternarMinhaLista,
    limparMinhaLista,
    tema,
    alternarTema,
  };

  return <DestinosContext.Provider value={valor}>{children}</DestinosContext.Provider>;
}

export function useDestinos(): DestinosContextValue {
  const contexto = useContext(DestinosContext);
  if (!contexto) {
    throw new Error("useDestinos precisa estar dentro de DestinosProvider");
  }
  return contexto;
}
