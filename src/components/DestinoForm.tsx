import { useRef, useState } from "react";
import type { ContatoFormData } from "../types";

type Props = {
  form: ContatoFormData;
  onChange: (field: keyof ContatoFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  enviado: boolean;
};

type Campo = keyof ContatoFormData;

const SUGESTOES = [
  { nome: "Cristo Redentor", emoji: "🗽" },
  { nome: "Fernando de Noronha", emoji: "🏝️" },
  { nome: "Lençóis Maranhenses", emoji: "🌊" },
  { nome: "Gramado", emoji: "🏔️" },
  { nome: "Cataratas do Iguaçu", emoji: "💦" },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function DestinoForm({ form, onChange, onSubmit, enviado }: Props) {
  // Só mostramos erro depois que a pessoa saiu do campo (ou tentou enviar).
  // Nada de "Obrigatório" em vermelho num formulário ainda intocado.
  const [tocados, setTocados] = useState<Record<Campo, boolean>>({
    nome: false,
    email: false,
    mensagem: false,
  });

  const nomeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const mensagemRef = useRef<HTMLTextAreaElement>(null);

  const nomeOk = form.nome.trim().length >= 2;
  const emailOk = EMAIL.test(form.email.trim());
  const mensagemOk = form.mensagem.trim().length >= 8;

  const tocar = (campo: Campo) =>
    setTocados((anterior) => (anterior[campo] ? anterior : { ...anterior, [campo]: true }));

  const erroNome =
    tocados.nome && !nomeOk
      ? form.nome.trim()
        ? "Use pelo menos 2 caracteres."
        : "Digite seu nome."
      : null;

  const erroEmail =
    tocados.email && !emailOk
      ? form.email.trim()
        ? "Confira o formato: nome@email.com"
        : "Digite seu e-mail."
      : null;

  const erroMensagem =
    tocados.mensagem && !mensagemOk
      ? form.mensagem.trim()
        ? "Conte um pouco mais — pelo menos 8 caracteres."
        : "Escreva sua mensagem."
      : null;

  const aoEnviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    setTocados({ nome: true, email: true, mensagem: true });

    const primeiroInvalido = !nomeOk
      ? nomeRef.current
      : !emailOk
        ? emailRef.current
        : !mensagemOk
          ? mensagemRef.current
          : null;

    if (primeiroInvalido) {
      primeiroInvalido.focus();
      return;
    }

    onSubmit(evento);
  };

  return (
    <section className="section form-section" id="contato" aria-labelledby="contato-titulo">
      <div className="form-head">
        <h2 id="contato-titulo">Fale com a gente</h2>
        <p className="muted">Conte o destino e as datas. Respondemos por e-mail, sem compromisso.</p>
      </div>

      <form onSubmit={aoEnviar} noValidate className="form">
        <div className="field">
          <label htmlFor="nome">Nome</label>
          <input
            ref={nomeRef}
            id="nome"
            name="nome"
            type="text"
            placeholder="Como podemos te chamar?"
            value={form.nome}
            onChange={(e) => onChange("nome", e.target.value)}
            onBlur={() => tocar("nome")}
            aria-invalid={Boolean(erroNome)}
            aria-describedby={erroNome ? "nome-erro" : undefined}
            required
            autoComplete="name"
          />
          <small id="nome-erro" className={erroNome ? "help error" : "help"}>
            {erroNome ?? "\u00A0"}
          </small>
        </div>

        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            placeholder="voce@email.com"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={() => tocar("email")}
            aria-invalid={Boolean(erroEmail)}
            aria-describedby={erroEmail ? "email-erro" : undefined}
            required
            autoComplete="email"
          />
          <small id="email-erro" className={erroEmail ? "help error" : "help"}>
            {erroEmail ?? "\u00A0"}
          </small>
        </div>

        <div className="field">
          <label htmlFor="mensagem">Mensagem</label>
          <textarea
            ref={mensagemRef}
            id="mensagem"
            name="mensagem"
            placeholder="Quero ir a Lençóis Maranhenses em julho, com duas pessoas..."
            value={form.mensagem}
            onChange={(e) => onChange("mensagem", e.target.value)}
            onBlur={() => tocar("mensagem")}
            rows={4}
            aria-invalid={Boolean(erroMensagem)}
            aria-describedby={erroMensagem ? "mensagem-erro" : undefined}
            required
          />
          <small id="mensagem-erro" className={erroMensagem ? "help error" : "help"}>
            {erroMensagem ?? "\u00A0"}
          </small>

          <div className="sugestoes" role="group" aria-labelledby="sugestoes-label">
            <span className="sugestoes-label" id="sugestoes-label">
              Sugestões — toque para completar:
            </span>
            {SUGESTOES.map((s) => (
              <button
                key={s.nome}
                type="button"
                className="chip-sugestao"
                onClick={() =>
                  onChange(
                    "mensagem",
                    form.mensagem.trim()
                      ? `${form.mensagem.trim()} ${s.nome}`
                      : `Quero ir a ${s.nome}`,
                  )
                }
              >
                <span aria-hidden="true">{s.emoji}</span> {s.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Enviar mensagem
          </button>
          <span className="form-nota">Usamos seus dados apenas para esta resposta.</span>
        </div>

        {enviado && (
          <div className="alert alert-success" role="status" aria-live="polite">
            <strong>Mensagem enviada.</strong> Respondemos no e-mail informado.
            <div className="alert-preview">
              <span><strong>Nome:</strong> {form.nome}</span>
              <span><strong>E-mail:</strong> {form.email}</span>
              <span><strong>Mensagem:</strong> {form.mensagem.slice(0, 80)}...</span>
            </div>
          </div>
        )}
      </form>

      <p className="form-credito">
        <span className="credito-claro">
          Foto:{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:Areia_e_Mar.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Areia e Mar
          </a>{" "}
          — Wanessa Gabrielle / Wikimedia Commons, CC BY-SA 4.0
        </span>
        <span className="credito-noturno">
          Foto:{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:ChicoRasta_RevoadaDosGuaras_DeltaDoParnaiba_Parnaiba_PI_(40822581422).jpg"
            target="_blank"
            rel="noreferrer"
          >
            Revoada de guarás, Delta do Parnaíba
          </a>{" "}
          — MTur Destinos / Wikimedia Commons, domínio público
        </span>
      </p>
    </section>
  );
}
