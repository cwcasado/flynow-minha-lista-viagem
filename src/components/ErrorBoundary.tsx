import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * ErrorBoundary — captura erros de runtime dos componentes filhos e os
 * mostra na tela (em vez de página em branco). Ajuda a depurar.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "2rem", maxWidth: "700px", margin: "3rem auto" }}>
          <h2 style={{ color: "#991b1b" }}>⚠️ Algo deu errado</h2>
          <pre
            style={{
              background: "#fee2e2",
              padding: "1rem",
              borderRadius: "8px",
              overflow: "auto",
              fontFamily: "monospace",
              fontSize: "0.85rem",
            }}
          >
            {this.state.error.toString()}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * OverlayGlobalDeErros — mostra no canto da tela qualquer erro de runtime
 * não capturado (window.onerror / unhandledrejection), incluindo erros
 * de módulos e de promessas não tratadas.
 */
export function instalarOverlayGlobalDeErros() {
  const styleId = "flynow-global-error-overlay-style";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .flynow-err-overlay {
      position: fixed;
      bottom: 12px;
      right: 12px;
      max-width: min(90vw, 480px);
      max-height: 40vh;
      overflow: auto;
      background: #7f1d1d;
      color: #fecaca;
      border: 2px solid #f87171;
      border-radius: 10px;
      padding: 12px 16px;
      font-family: Consolas, Menlo, monospace;
      font-size: 12px;
      white-space: pre-wrap;
      z-index: 2147483647;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    }
    .flynow-err-overlay h4 {
      margin: 0 0 6px;
      color: #fff;
      font-size: 13px;
    }
    .flynow-err-overlay button {
      margin-top: 8px;
      background: #fecaca;
      color: #7f1d1d;
      border: none;
      border-radius: 6px;
      padding: 4px 12px;
      cursor: pointer;
      font-weight: 600;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "flynow-err-overlay";
  overlay.hidden = true;
  overlay.innerHTML = "<h4>🐞 Erro capturado</h4><div class='msg'></div><button>Ignorar</button>";
  document.body.appendChild(overlay);

  const msgEl = overlay.querySelector<HTMLDivElement>(".msg")!;
  const mostrar = (texto: string) => {
    msgEl.textContent = texto;
    overlay.hidden = false;
  };

  window.addEventListener("error", (ev) => {
    mostrar(`window.onerror\n${ev.message}\n${ev.filename}:${ev.lineno}:${ev.colno}`);
  });

  window.addEventListener("unhandledrejection", (ev) => {
    const raz = ev.reason;
    mostrar(`unhandledrejection\n${raz && raz.stack ? raz.stack : String(raz)}`);
  });

  overlay.querySelector("button")!.addEventListener("click", () => {
    overlay.hidden = true;
  });
}
