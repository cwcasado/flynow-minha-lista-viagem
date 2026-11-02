import { useEffect, useMemo, useState } from "react";
import { CATEGORIA_PADRAO, iconeDaCategoria } from "../data/categorias";
import { Icon } from "./Icon";
import type { Destino, Foto } from "../types";

type Props = {
  destino: Destino;
  estaNaLista: boolean;
  onToggle: (d: Destino) => void;
};

const PLACEHOLDER_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e0f2fe"/>
          <stop offset="1" stop-color="#ede9fe"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#g)"/>
      <text x="400" y="215" font-size="72" text-anchor="middle">🏝️</text>
      <text x="400" y="270" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="#64748b" text-anchor="middle">FlyNow</text>
    </svg>`,
  );

export function DestinoCard({ destino, estaNaLista, onToggle }: Props) {
  const fotos = useMemo<Foto[]>(() => {
    if (destino.fotos?.length) return destino.fotos;
    if (destino.imagem) {
      return [{ url: destino.imagem, titulo: destino.nome, categoria: CATEGORIA_PADRAO }];
    }
    return [];
  }, [destino]);

  const total = fotos.length;

  const [indice, setIndice] = useState(0);
  const [carregada, setCarregada] = useState<string | null>(null);
  const [falhas, setFalhas] = useState<Record<string, boolean>>({});

  // Ao trocar de destino (filtros), volta para a primeira foto.
  useEffect(() => {
    setIndice(0);
  }, [destino.id]);

  const indiceAtual = total > 0 ? Math.min(indice, total - 1) : 0;
  const foto = total > 0 ? fotos[indiceAtual] : undefined;
  const falhou = foto ? Boolean(falhas[foto.url]) : true;
  const carregando = Boolean(foto) && !falhou && carregada !== foto?.url;

  const irPara = (posicao: number) => {
    if (total === 0) return;
    setIndice((posicao + total) % total);
  };

  const aoTeclar = (evento: React.KeyboardEvent<HTMLDivElement>) => {
    if (total < 2) return;
    if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      irPara(indiceAtual - 1);
    }
    if (evento.key === "ArrowRight") {
      evento.preventDefault();
      irPara(indiceAtual + 1);
    }
  };

  return (
    <article className="card" aria-label={destino.nome}>
      <div
        className="card-media carousel"
        tabIndex={0}
        role="group"
        aria-roledescription="carrossel"
        aria-label={`Fotos de ${destino.nome}`}
        onKeyDown={aoTeclar}
      >
        {carregando && <div className="card-skeleton" />}

        {foto && !falhou ? (
          <img
            key={foto.url}
            src={foto.url}
            alt={`${destino.nome} — ${foto.titulo}`}
            loading="lazy"
            className="card-img"
            onLoad={() => setCarregada(foto.url)}
            onError={() =>
              setFalhas((anterior) => ({ ...anterior, [foto.url]: true }))
            }
          />
        ) : (
          <img
            src={PLACEHOLDER_SVG}
            alt=""
            aria-hidden="true"
            className="card-img placeholder"
          />
        )}

        <div className="card-overlay" />

        {foto && (
          <span className="card-category">
            <Icon name={iconeDaCategoria(foto.categoria)} size={14} aria-hidden />
            <span>{foto.categoria}</span>
          </span>
        )}

        <button
          className={`card-fav ${estaNaLista ? "is-active" : ""}`}
          onClick={() => onToggle(destino)}
          aria-label={estaNaLista ? `Remover ${destino.nome} da lista` : `Adicionar ${destino.nome} à lista`}
          aria-pressed={estaNaLista}
          title={estaNaLista ? "Remover da minha lista" : "Adicionar à minha lista"}
        >
          <span aria-hidden="true">{estaNaLista ? "♥" : "♡"}</span>
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              className="carousel-btn carousel-prev"
              onClick={() => irPara(indiceAtual - 1)}
              aria-label={`Foto anterior de ${destino.nome}`}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="carousel-btn carousel-next"
              onClick={() => irPara(indiceAtual + 1)}
              aria-label={`Próxima foto de ${destino.nome}`}
            >
              <span aria-hidden="true">›</span>
            </button>

            <div className="carousel-dots" role="group" aria-label={`Escolher foto de ${destino.nome}`}>
              {fotos.map((item, posicao) => (
                <button
                  key={item.url}
                  type="button"
                  className={`carousel-dot ${posicao === indiceAtual ? "is-active" : ""}`}
                  aria-current={posicao === indiceAtual ? "true" : undefined}
                  aria-label={`Foto ${posicao + 1} de ${total}: ${item.titulo}`}
                  onClick={() => irPara(posicao)}
                />
              ))}
            </div>

            <span className="carousel-counter" aria-live="polite">
              {indiceAtual + 1}/{total}
            </span>
          </>
        )}

        {foto && <span className="carousel-caption">{foto.titulo}</span>}
      </div>

      <div className="card-body">
        <h3 className="card-title">{destino.nome}</h3>
        <p className="card-desc">{destino.descricao}</p>

        <div className="card-foot">
          <button className={estaNaLista ? "btn btn-ghost is-active" : "btn btn-primary"} onClick={() => onToggle(destino)}>
            {estaNaLista ? "✓ Na minha lista" : "+ Adicionar"}
          </button>
          {destino.url && (
            <a href={destino.url} target="_blank" rel="noreferrer" className="card-link">
              Wikipedia ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
