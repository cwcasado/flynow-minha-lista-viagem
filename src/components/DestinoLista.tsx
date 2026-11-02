import type { FiltroCategoria } from "../contexts/DestinosContext";
import type { Destino } from "../types";
import { DestinoCard } from "./DestinoCard";

type Props = {
  destinos: Destino[];
  minhaListaIds: Set<string>;
  onToggle: (d: Destino) => void;
  loading: boolean;
  aviso: string | null;
  filtro: "todos" | "lista";
  onFiltroChange: (f: "todos" | "lista") => void;
  busca: string;
  categoria: FiltroCategoria;
  onCategoriaReset: () => void;
};

export function DestinoLista({
  destinos,
  minhaListaIds,
  onToggle,
  loading,
  aviso,
  filtro,
  onFiltroChange,
  busca,
  categoria,
  onCategoriaReset,
}: Props) {
  if (loading) {
    return (
      <section className="section">
        <div className="section-head">
          <h2>Destinos em destaque</h2>
          <p className="muted">Carregando fotos e histórias...</p>
        </div>
        <div className="grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="skeleton">
              <div className="skeleton-media" />
              <div className="skeleton-lines">
                <span />
                <span />
                <span className="short" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const listaFiltrada = filtro === "lista" ? destinos.filter((d) => minhaListaIds.has(d.id)) : destinos;
  const vazio = listaFiltrada.length === 0;

  return (
    <section className="section" id="destinos">
      <div className="section-head">
        <div>
          <h2>{categoria !== "todas" ? `Destinos — ${categoria}` : "Destinos em destaque"}</h2>
          <p className="muted">
            {busca ? (
              <>
                {listaFiltrada.length} resultado(s) para <strong>"{busca}"</strong>
              </>
            ) : categoria !== "todas" ? (
              <>Filtrando por <strong>{categoria}</strong>. Cada card tem 6 fotos — use as setas.</>
            ) : (
              <>6 fotos por destino, com categoria em cada imagem. Toque no ♡ para salvar.</>
            )}
          </p>
        </div>

        <div className="tabs" role="tablist" aria-label="Filtrar destinos">
          <button role="tab" aria-selected={filtro === "todos"} className={filtro === "todos" ? "tab active" : "tab"} onClick={() => onFiltroChange("todos")}>
            Todos ({destinos.length})
          </button>
          <button role="tab" aria-selected={filtro === "lista"} className={filtro === "lista" ? "tab active" : "tab"} onClick={() => onFiltroChange("lista")}>
            Salvos ({minhaListaIds.size})
          </button>
        </div>
      </div>

      {aviso && (
        <p className="error-box" role="status">
          {aviso}
        </p>
      )}

      {vazio ? (
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <h3>Nenhum destino encontrado</h3>
          <p>
            {filtro === "lista"
              ? "Sua lista está vazia. Toque no ♡ nos cards para salvar."
              : busca
                ? `Nenhum resultado para "${busca}". Tente "marajó", "paraty" ou "pantanal".`
                : categoria !== "todas"
                  ? `Nenhum destino na categoria "${categoria}". Toque em "Todos" para voltar.`
                  : "Recarregue a página."}
          </p>
          {filtro === "lista" ? (
            <button className="btn btn-primary" onClick={() => onFiltroChange("todos")}>
              Ver todos os destinos
            </button>
          ) : categoria !== "todas" ? (
            <button className="btn btn-primary" onClick={onCategoriaReset}>
              Mostrar todos os destinos
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid">
          {listaFiltrada.map((d) => (
            <DestinoCard key={d.id} destino={d} estaNaLista={minhaListaIds.has(d.id)} onToggle={onToggle} />
          ))}
        </div>
      )}
    </section>
  );
}
