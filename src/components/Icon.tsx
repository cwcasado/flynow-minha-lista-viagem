import type { SVGProps } from "react";

/**
 * Ícone do sistema FlyNow.
 *
 * Renderiza um <symbol> definido em public/icons.svg por meio de <use>.
 * O nome corresponde ao atributo `id` do símbolo (sem o sufixo "-icon").
 *
 * Exemplo: <Icon name="natureza" size={20} className="text-primary" />
 *
 * @param name - Nome do símbolo (ex.: "natureza", "favorito", "busca")
 * @param size - Largura e altura em px (padrão 20)
 * @param className - Classes CSS adicionais
 * @param title - Texto descritivo para acessibilidade (opcional)
 * @param ariaLabel - aria-label quando não há title visível
 */
export function Icon({
  name,
  size = 20,
  className = "",
  title,
  ariaLabel,
  ...props
}: SVGProps<SVGSVGElement> & {
  name: string;
  size?: number;
  title?: string;
  ariaLabel?: string;
}) {
  const aria = ariaLabel ? { "aria-label": ariaLabel, role: "img" } : {};

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title || ariaLabel ? undefined : true}
      {...aria}
      {...props}
    >
      {title && <title>{title}</title>}
      <use href={`/icons.svg#${name}-icon`} />
    </svg>
  );
}
