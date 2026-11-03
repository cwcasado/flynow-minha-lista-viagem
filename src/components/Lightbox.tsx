import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import "../styles/lightbox.css";

type Props = {
  url: string;
  titulo: string;
  aoFechar: () => void;
  aoAnterior?: () => void;
  aoProxima?: () => void;
  contador?: string;
};

/**
 * Lightbox de foto: imagem ampliada centralizada, com fundo escuro.
 *
 * Fecha por ESC, pelo botão ✕ ou pelo clique fora da imagem. O foco vai para o
 * botão de fechar ao abrir e volta para o elemento que estava ativo ao fechar.
 * Enquanto aberto, o scroll do fundo fica travado.
 */
export function Lightbox({ url, titulo, aoFechar, aoAnterior, aoProxima, contador }: Props) {
  const botaoFecharRef = useRef<HTMLButtonElement>(null);
  const temNavegacao = Boolean(aoAnterior && aoProxima);

  useEffect(() => {
    const anter = document.activeElement as HTMLElement | null;
    botaoFecharRef.current?.focus();

    const corpoAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = corpoAnterior;
      anter?.focus();
    };
  }, [aoFechar]);

  // Portal para <body>: o .main mantém transform (animação "surgir"), o que
  // quebraria o position:fixed do overlay e o prenderia à página.
  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ampliada: ${titulo}`}
      onClick={aoFechar}
    >
      <button
        ref={botaoFecharRef}
        type="button"
        className="lightbox-fechar"
        onClick={aoFechar}
        aria-label="Fechar foto ampliada"
      >
        <span aria-hidden="true">✕</span>
      </button>

      <figure className="lightbox-figura" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt={titulo} className="lightbox-img" />
        <figcaption className="lightbox-legenda">{titulo}</figcaption>
      </figure>

      {temNavegacao && (
        <div className="lightbox-nav" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="lightbox-nav-btn" onClick={aoAnterior} aria-label="Foto anterior">
            <Icon name="seta-esquerda" size={24} />
          </button>
          <span className="lightbox-contador">{contador}</span>
          <button type="button" className="lightbox-nav-btn" onClick={aoProxima} aria-label="Próxima foto">
            <Icon name="seta-direita" size={24} />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
