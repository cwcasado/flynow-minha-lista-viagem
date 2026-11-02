import { CATEGORIAS } from "../data/categorias";
import { useDestinos } from "../contexts/DestinosContext";
import { Icon } from "./Icon";
import type { Categoria } from "../types";

type HeaderProps = {
  titulo: string;
  subtitulo: string;
};

export function Header({ titulo, subtitulo }: HeaderProps) {
  const {
    busca,
    setBusca,
    categoria,
    setCategoria,
    contagemCategorias,
    destinos,
    minhaLista,
    tema,
    alternarTema,
  } = useDestinos();

  const noturno = tema === "noturno";

  const selecionarCategoria = (valor: Categoria | "todas") => {
    setCategoria(valor);
    document.getElementById("destinos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="header">
      <div className="header-brand">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <img src="/logo-brand.svg" alt="" className="brand-logo" width="48" height="48" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">{titulo}</h1>
            <p className="brand-subtitle">{subtitulo}</p>
          </div>
        </div>

        <div className="brand-actions">
          <div className="stat-pill">
            <Icon name="todos" size={16} className="stat-icon" />
            <span><strong>{destinos.length}</strong> destinos</span>
          </div>
          <div className="stat-pill stat-pill-primary">
            <Icon name="favorito" size={16} className="stat-icon" />
            <span><strong>{minhaLista.length}</strong> salvos</span>
          </div>
          <button
            type="button"
            className={`theme-toggle ${noturno ? "theme-toggle-dark" : ""}`}
            onClick={alternarTema}
            aria-label={noturno ? "Ativar modo claro" : "Ativar modo noturno"}
            aria-pressed={noturno}
          >
            {noturno ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="header-hero">
        <div className="hero-search">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Para onde você quer voar? Digite capivara, marajó, paraty..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="search-input"
            aria-label="Buscar destinos"
            autoComplete="off"
          />
          {busca && (
            <button className="search-clear" onClick={() => setBusca("")} aria-label="Limpar busca">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="hero-filters" role="group" aria-label="Filtrar destinos por categoria">
          <button
            type="button"
            className={`filter-chip ${categoria === "todas" ? "active" : ""}`}
            aria-pressed={categoria === "todas"}
            onClick={() => selecionarCategoria("todas")}
          >
            <Icon name="todos" size={16} className="filter-emoji" />
            <span>Todos ({destinos.length})</span>
          </button>
          {CATEGORIAS.map((item) => {
            const quantidade = contagemCategorias.get(item.chave) ?? 0;
            const ativo = categoria === item.chave;
            return (
              <button
                key={item.chave}
                type="button"
                className={`filter-chip ${ativo ? "active" : ""}`}
                aria-pressed={ativo}
                disabled={quantidade === 0}
                onClick={() => selecionarCategoria(ativo ? "todas" : item.chave)}
              >
                <Icon name={item.icone} size={16} className="filter-emoji" />
                <span>{item.chave} ({quantidade})</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
