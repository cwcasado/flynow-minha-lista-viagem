import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "../components/Icon";
import { CATALOGO_DESTINOS } from "../data/destinos";

/** Credenciais públicas de teste do DummyJSON (mesmas do README). */
const USUARIO_TESTE = "emilys";
const SENHA_TESTE = "emilyspass";

const TOTAL_DESTINOS = CATALOGO_DESTINOS.length;
const TOTAL_FOTOS = CATALOGO_DESTINOS.reduce(
  (total, destino) => total + (destino.fotos?.length ?? 0),
  0,
);

export default function Login() {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const botaoEntrarRef = useRef<HTMLButtonElement>(null);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (usuario) {
      navigate("/", { replace: true });
    }
  }, [usuario, navigate]);

  async function enviar(e: FormEvent) {
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

  function usarCredenciaisTeste() {
    setUsername(USUARIO_TESTE);
    setSenha(SENHA_TESTE);
    setErro(null);
    botaoEntrarRef.current?.focus();
  }

  return (
    <main className="login-page">
      <section className="login-form-col" aria-labelledby="login-titulo">
        <div className="login-card">
          <div className="login-brand">
            <img
              src="/flynow-logo-176.png"
              srcSet="/flynow-logo-88.png 1x, /flynow-logo-176.png 2x"
              width={88}
              height={88}
              alt="FlyNow Viagens"
              className="login-logo"
              aria-hidden="true"
            />
            <span className="login-brand-name">FlyNow</span>
          </div>

          <h1 className="login-titulo" id="login-titulo">
            Entre na sua lista de viagem
          </h1>
          <p className="login-sub">
            Monte a rota dos sonhos: {TOTAL_DESTINOS} destinos, {TOTAL_FOTOS} fotos e 8 categorias.
          </p>

          {erro && (
            <p className="login-erro" role="alert" id="login-erro">
              <Icon name="vazio" size={18} />
              <span>{erro}</span>
            </p>
          )}

          <form onSubmit={enviar} noValidate>
            <div className="login-field">
              <input
                id="login-usuario"
                name="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (erro) setErro(null);
                }}
                placeholder=" "
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                disabled={enviando}
                aria-invalid={erro ? true : undefined}
                aria-describedby={erro ? "login-erro" : undefined}
              />
              <label htmlFor="login-usuario">Usuário</label>
            </div>

            <div className="login-field login-field-senha">
              <input
                id="login-senha"
                name="password"
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  if (erro) setErro(null);
                }}
                placeholder=" "
                autoComplete="current-password"
                disabled={enviando}
                aria-invalid={erro ? true : undefined}
                aria-describedby={erro ? "login-erro" : undefined}
              />
              <label htmlFor="login-senha">Senha</label>
              <button
                type="button"
                className="login-olho"
                onClick={() => setMostrarSenha((visivel) => !visivel)}
                aria-pressed={mostrarSenha}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                disabled={enviando}
              >
                <Icon name={mostrarSenha ? "eye-off" : "eye"} size={20} />
              </button>
            </div>

            <button
              ref={botaoEntrarRef}
              type="submit"
              className="btn btn-primary login-submit"
              disabled={enviando}
            >
              {enviando ? "Entrando..." : "Entrar"}
            </button>

            <button
              type="button"
              className="login-teste"
              onClick={usarCredenciaisTeste}
              disabled={enviando}
            >
              Usar {USUARIO_TESTE} / {SENHA_TESTE}
            </button>
          </form>
        </div>
      </section>

      <aside className="login-foto" aria-hidden="true">
        <div className="login-foto-texto">
          <p className="login-foto-kicker">Minha Lista de Viagem</p>
          <h2 className="login-foto-titulo">
            {TOTAL_DESTINOS} destinos brasileiros,
            <br />
            {TOTAL_FOTOS} fotos para sonhar.
          </h2>
          <p className="login-foto-sub">
            Natureza, praias, história e gastronomia — curate, salve e organize a sua rota.
          </p>
        </div>
        <p className="login-foto-credito">
          <span className="credito-claro">
            Foto: Trustable — CC BY-SA 4.0 (Wikimedia Commons)
          </span>
          <span className="credito-noturno">
            Foto: Adam Jones, Ph.D. — CC BY-SA 3.0 (Wikimedia Commons)
          </span>
        </p>
      </aside>
    </main>
  );
}
