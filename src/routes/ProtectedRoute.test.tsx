import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "./ProtectedRoute";

const mocks = vi.hoisted(() => ({
  usuario: null as { id: number } | null,
  carregando: false,
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ usuario: mocks.usuario, carregando: mocks.carregando }),
}));

function renderizarRota() {
  return render(
    <MemoryRouter initialEntries={["/desejos"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/desejos" element={<p>Minha lista</p>} />
        </Route>
        <Route path="/login" element={<p>Entrar</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mocks.usuario = null;
    mocks.carregando = false;
  });

  it("redireciona para o login quando não há sessão", () => {
    renderizarRota();

    expect(screen.getByText("Entrar")).toBeInTheDocument();
    expect(screen.queryByText("Minha lista")).not.toBeInTheDocument();
  });

  it("renderiza a rota protegida com sessão ativa", () => {
    mocks.usuario = { id: 1 };
    renderizarRota();

    expect(screen.getByText("Minha lista")).toBeInTheDocument();
  });

  it("espera a verificação da sessão antes de redirecionar", () => {
    mocks.carregando = true;
    renderizarRota();

    expect(screen.getByText("Verificando sessão...")).toBeInTheDocument();
    expect(screen.queryByText("Entrar")).not.toBeInTheDocument();
  });
});
