import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { DestinosProvider } from "./contexts/DestinosContext";
import ErrorBoundary, { instalarOverlayGlobalDeErros } from "./components/ErrorBoundary";
import "./styles/fontes.css";
import "./styles/tokens.css";
import "./index.css";

// Mostra erros de runtime não capturados como um balão na tela
instalarOverlayGlobalDeErros();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <DestinosProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </DestinosProvider>
    </AuthProvider>
  </BrowserRouter>,
);
