// Logo da marca FlyNow — avião de papel (paper plane) ascendente.
// Vetorial, minimalista e geométrico: reconhecível em favicon e em telas grandes.
// Faces com opacidades diferentes criam profundidade; herda a cor via currentColor.
export function Logo() {
  return (
    <svg
      viewBox="0 0 64 64"
      width="100%"
      height="100%"
      fill="none"
      role="img"
      aria-label="FlyNow"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Asa superior (translúcida) */}
      <path d="M8 34 L56 16 L36 34 Z" fill="currentColor" opacity="0.45" strokeLinejoin="round" />
      {/* Dobra central */}
      <path d="M8 34 L36 34 L10 46 Z" fill="currentColor" opacity="0.7" strokeLinejoin="round" />
      {/* Asa inferior (sólida) */}
      <path d="M36 34 L56 16 L10 46 Z" fill="currentColor" opacity="1" strokeLinejoin="round" />
    </svg>
  );
}