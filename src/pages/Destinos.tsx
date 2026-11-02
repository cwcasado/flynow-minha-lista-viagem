import { useState } from "react";
import { DestinoForm } from "../components/DestinoForm";
import { DestinoLista } from "../components/DestinoLista";
import { useAuth } from "../contexts/AuthContext";
import { useDestinos } from "../contexts/DestinosContext";
import type { ContatoFormData } from "../types";

export default function Destinos() {
  const { carregando: authCarregando } = useAuth();
  const {
    destinosFiltrados,
    carregando,
    aviso,
    busca,
    categoria,
    setCategoria,
    minhaLista,
    minhaListaIds,
    alternarMinhaLista,
    limparMinhaLista,
  } = useDestinos();

  const [filtro, setFiltro] = useState<"todos" | "lista">("todos");

  const [form, setForm] = useState<ContatoFormData>({ nome: "", email: "", mensagem: "" });
  const [enviado, setEnviado] = useState(false);

  const handleFormChange = (field: keyof ContatoFormData, value: string) => {
    setForm((anterior) => ({ ...anterior, [field]: value }));
    if (enviado) setEnviado(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // O DestinoForm já mostra o erro no campo e leva o foco até ele.
    const valido =
      form.nome.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
      form.mensagem.trim().length >= 8;

    if (!valido) return;
    setEnviado(true);
  };

  if (authCarregando) {
    return (
      <div className="section" style={{ textAlign: "center", padding: "2rem" }}>
        <p>Carregando sessão...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="main">
        {minhaLista.length > 0 && (
          <section className="minha-lista-banner" aria-live="polite">
            <div className="banner-head">
              <h3>✈ Minha Lista — {minhaLista.length} destino(s)</h3>
              <button className="btn btn-ghost small" onClick={limparMinhaLista}>
                Limpar lista
              </button>
            </div>
            <p className="muted">Seus favoritos ficam salvos no navegador.</p>
            <div className="chips">
              {minhaLista.map((destino) => (
                <span key={destino.id} className="chip">
                  {destino.nome}
                  <button
                    aria-label={`Remover ${destino.nome}`}
                    onClick={() => alternarMinhaLista(destino)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>
        )}

        <DestinoLista
          destinos={destinosFiltrados}
          minhaListaIds={minhaListaIds}
          onToggle={alternarMinhaLista}
          loading={carregando}
          aviso={aviso}
          filtro={filtro}
          onFiltroChange={setFiltro}
          busca={busca}
          categoria={categoria}
          onCategoriaReset={() => setCategoria("todas")}
        />

        <DestinoForm
          form={form}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          enviado={enviado}
        />
      </main>
    </div>
  );
}
