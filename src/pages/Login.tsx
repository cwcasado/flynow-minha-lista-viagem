import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";

export default function Login() {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (usuario) {
      navigate("/", { replace: true });
    }
  }, [usuario, navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      await login(username, senha);
      navigate("/", { replace: true });
    } catch (err) {
      setErro((err as Error).message || "Usuário ou senha incorretos");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="section" style={{ maxWidth: "400px", margin: "2rem auto" }}>
      <h2>Entrar</h2>
      <p className="muted">Teste com: emilys / emilyspass</p>

      {erro && (
        <p className="error-box" role="alert">
          {erro}
        </p>
      )}

      <form onSubmit={enviar} noValidate>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={enviando}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={enviando}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={enviando}
          style={{ width: "100%" }}
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
