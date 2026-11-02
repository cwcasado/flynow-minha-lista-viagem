import { Link } from "react-router-dom";

export default function NaoEncontrada() {
  return (
    <section className="section" style={{ textAlign: "center", padding: "2rem" }}>
      <h2>404 — Página não encontrada</h2>
      <p className="muted">Essa sala não existe.</p>
      <Link to="/" className="btn btn-primary">
        Voltar ao início
      </Link>
    </section>
  );
}
