import axios from "axios";
import type { Desejo } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://dummyjson.com",
  timeout: 10000,
});

// Adicionar interceptor para token (Aula 10)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("flynow.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function listarDesejos(userId: number): Promise<Desejo[]> {
  const res = await api.get<{ todos: Desejo[] }>(`/todos/user/${userId}`);
  return res.data.todos;
}

export async function criarDesejo(todo: string, userId: number): Promise<Desejo> {
  const res = await api.post<Desejo>("/todos/add", {
    todo,
    completed: false,
    userId,
  });
  return res.data;
}

export async function atualizarDesejo(
  id: number,
  campos: Partial<Pick<Desejo, "todo" | "completed">>
): Promise<Desejo> {
  const res = await api.patch<Desejo>(`/todos/${id}`, campos);
  return res.data;
}

export async function excluirDesejo(id: number): Promise<void> {
  await api.delete(`/todos/${id}`);
}
