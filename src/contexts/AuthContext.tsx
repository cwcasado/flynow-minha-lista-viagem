import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import axios from "axios";

export interface Usuario {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

type AuthValue = {
  usuario: Usuario | null;
  token: string | null;
  carregando: boolean;
  login: (username: string, senha: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

const CHAVE = "flynow.token";

// Funções para comunicação com a API (DummyJSON)
async function loginApi(username: string, password: string): Promise<Usuario & { accessToken: string }> {
  const res = await axios.post(
    "https://dummyjson.com/auth/login",
    { username, password, expiresInMins: 30 },
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data;
}

async function me(token: string): Promise<Usuario> {
  const res = await axios.get<Usuario>("https://dummyjson.com/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Restaurar sessão ao abrir o app
  useEffect(() => {
    async function restaurarSessao() {
      const salvo = localStorage.getItem(CHAVE);
      if (!salvo) {
        setCarregando(false);
        return;
      }

      try {
        const user = await me(salvo);
        setToken(salvo);
        setUsuario(user);
      } catch {
        // Token inválido ou expirado
        localStorage.removeItem(CHAVE);
      } finally {
        setCarregando(false);
      }
    }

    restaurarSessao();
  }, []);

  async function login(username: string, senha: string) {
    const dados = await loginApi(username, senha);
    localStorage.setItem(CHAVE, dados.accessToken);
    setToken(dados.accessToken);
    setUsuario({
      id: dados.id,
      username: dados.username,
      email: dados.email,
      firstName: dados.firstName,
      lastName: dados.lastName,
      image: dados.image,
    });
  }

  function logout() {
    localStorage.removeItem(CHAVE);
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, token, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  }
  return ctx;
}
