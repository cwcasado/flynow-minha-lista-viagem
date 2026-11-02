import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { listarDesejos, criarDesejo, atualizarDesejo, excluirDesejo } from "../services/desejos";
import { mensagemDeErro } from "../utils/erros";
import type { Desejo } from "../types";
import DesejoItem from "../components/DesejoItem";

export default function Desejos() {
  const { usuario } = useAuth();
  const userId = usuario?.id;

  const [desejos, setDesejos] = useState<Desejo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [texto, setTexto] = useState("");
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [ocupado, setOcupado] = useState<number | null>(null);

  useEffect(() => {
    if (userId === undefined) return;

    async function carregar(id: number) {
      try {
        setDesejos(await listarDesejos(id));
      } catch (err) {
        setErro(mensagemDeErro(err));
      } finally {
        setLoading(false);
      }
    }

    carregar(userId);
  }, [userId]);

  function validar(valor: string): string | null {
    if (valor.length < 3) return "Escreve pelo menos 3 letras.";
    if (valor.length > 80) return "Máximo de 80 letras.";
    return null;
  }

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    const limpo = texto.trim();
    const aviso = validar(limpo);
    if (aviso) {
      setErroForm(aviso);
      return;
    }
    if (userId === undefined) return;

    setErroForm(null);
    setEnviando(true);

    try {
      const novo = await criarDesejo(limpo, userId);
      setDesejos((lista) => [...lista, novo]);
      setTexto("");
    } catch (err) {
      setErroForm(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  async function alternar(d: Desejo) {
    setOcupado(d.id);
    try {
      await atualizarDesejo(d.id, { completed: !d.completed });
      setDesejos((lista) =>
        lista.map((x) => (x.id === d.id ? { ...x, completed: !x.completed } : x))
      );
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setOcupado(null);
    }
  }

  async function excluir(d: Desejo) {
    if (!window.confirm(`Excluir "${d.todo}"?`)) return;

    setOcupado(d.id);
    try {
      await excluirDesejo(d.id);
      setDesejos((lista) => lista.filter((x) => x.id !== d.id));
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setOcupado(null);
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="section-head">
          <h2>Meus desejos</h2>
          <p className="muted">Carregando...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>Meus desejos</h2>
      </div>

      {erro && (
        <p className="error-box" role="alert">
          {erro}
        </p>
      )}

      <form onSubmit={aoEnviar} noValidate>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="desejo">Novo desejo</label>
          <input
            id="desejo"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={enviando}
            aria-invalid={erroForm !== null}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
          />
          {erroForm && <p className="error-box" role="alert" style={{ marginTop: "0.5rem" }}>{erroForm}</p>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? "Salvando..." : "Adicionar"}
        </button>
      </form>

      {desejos.length === 0 ? (
        <p className="muted">Nenhum desejo ainda. Que tal "Conhecer Lisboa"?</p>
      ) : (
        <ul className="desejos">
          {desejos.map((d) => (
            <DesejoItem
              key={d.id}
              desejo={d}
              ocupado={ocupado === d.id}
              aoAlternar={alternar}
              aoExcluir={excluir}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
