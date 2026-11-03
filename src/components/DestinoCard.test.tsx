import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DestinoCard } from "./DestinoCard";
import { CATALOGO_DESTINOS } from "../data/destinos";

const destino = CATALOGO_DESTINOS[0];
const fotos = destino.fotos ?? [];

function renderizarCard() {
  const onToggle = vi.fn();
  render(<DestinoCard destino={destino} estaNaLista={false} onToggle={onToggle} />);
  return { onToggle };
}

function abrirLightbox() {
  return screen.getByRole("dialog", { name: /Foto ampliada:/ });
}

describe("DestinoCard", () => {
  it("abre o lightbox com a foto ativa ao clicar em ampliar", async () => {
    const pessoa = userEvent.setup();
    renderizarCard();

    await pessoa.click(screen.getByRole("button", { name: `Ampliar foto de ${destino.nome}` }));

    const dialogo = abrirLightbox();
    expect(
      within(dialogo).getByRole("img", { name: `${destino.nome} — ${fotos[0].titulo}` }),
    ).toBeInTheDocument();
  });

  it("fecha com Escape", async () => {
    const pessoa = userEvent.setup();
    renderizarCard();

    await pessoa.click(screen.getByRole("button", { name: `Ampliar foto de ${destino.nome}` }));
    expect(abrirLightbox()).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fecha pelo botão ✕", async () => {
    const pessoa = userEvent.setup();
    renderizarCard();

    await pessoa.click(screen.getByRole("button", { name: `Ampliar foto de ${destino.nome}` }));
    await pessoa.click(screen.getByRole("button", { name: "Fechar foto ampliada" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fecha ao clicar fora da imagem (overlay)", async () => {
    const pessoa = userEvent.setup();
    renderizarCard();

    await pessoa.click(screen.getByRole("button", { name: `Ampliar foto de ${destino.nome}` }));
    fireEvent.click(abrirLightbox());

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("navega entre as fotos dentro do lightbox", async () => {
    const pessoa = userEvent.setup();
    renderizarCard();

    await pessoa.click(screen.getByRole("button", { name: `Ampliar foto de ${destino.nome}` }));
    const dialogo = abrirLightbox();

    expect(within(dialogo).getByText(`1/${fotos.length}`)).toBeInTheDocument();

    await pessoa.click(within(dialogo).getByRole("button", { name: "Próxima foto" }));

    expect(within(dialogo).getByText(`2/${fotos.length}`)).toBeInTheDocument();
    expect(
      within(dialogo).getByRole("img", { name: `${destino.nome} — ${fotos[1].titulo}` }),
    ).toBeInTheDocument();
  });
});
