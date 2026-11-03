import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Login from "./Login";

const mocks = vi.hoisted(() => ({
  login: vi.fn<(username: string, senha: string) => Promise<void>>(),
  usuario: null as { id: number } | null,
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ login: mocks.login, usuario: mocks.usuario }),
}));

function renderizarLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<p>Início</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Login", () => {
  beforeEach(() => {
    mocks.login.mockReset();
    mocks.usuario = null;
  });

  it("associa os rótulos aos campos", () => {
    renderizarLogin();

    expect(screen.getByLabelText("Usuário")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
  });

  it("envia usuário e senha digitados", async () => {
    const pessoa = userEvent.setup();
    mocks.login.mockResolvedValueOnce();
    renderizarLogin();

    await pessoa.type(screen.getByLabelText("Usuário"), "emilys");
    await pessoa.type(screen.getByLabelText("Senha"), "emilyspass");
    await pessoa.click(screen.getByRole("button", { name: "Entrar" }));

    expect(mocks.login).toHaveBeenCalledWith("emilys", "emilyspass");
  });

  it("anuncia o erro de credenciais com role=alert", async () => {
    const pessoa = userEvent.setup();
    mocks.login.mockRejectedValueOnce(new Error("Usuário ou senha incorretos"));
    renderizarLogin();

    await pessoa.type(screen.getByLabelText("Usuário"), "emilys");
    await pessoa.type(screen.getByLabelText("Senha"), "errada");
    await pessoa.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Usuário ou senha incorretos");
  });

  it("limpa o erro quando a pessoa volta a digitar", async () => {
    const pessoa = userEvent.setup();
    mocks.login.mockRejectedValueOnce(new Error("Usuário ou senha incorretos"));
    renderizarLogin();

    await pessoa.type(screen.getByLabelText("Usuário"), "emilys");
    await pessoa.type(screen.getByLabelText("Senha"), "errada");
    await pessoa.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await pessoa.type(screen.getByLabelText("Senha"), "certa");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("redireciona quem já está autenticado", async () => {
    mocks.usuario = { id: 1 };
    renderizarLogin();

    expect(await screen.findByText("Início")).toBeInTheDocument();
  });
});
