import axios from "axios";

export function mensagemDeErro(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED") {
      return "A resposta demorou demais. Tenta de novo.";
    }
    if (!err.response) {
      return "Sem conexão com o servidor. Confere a internet e tenta de novo.";
    }
    const status = err.response.status;
    if (status === 400) return "Os dados enviados não foram aceitos. Confere o que digitou.";
    if (status === 401) return "Tua sessão expirou. Entra de novo.";
    if (status === 404) return "Não encontramos o que tu pediu. Pode ter sido removido.";
    if (status >= 500) return "O servidor está com problema. Tenta de novo daqui a pouco.";
    return `Algo deu errado (código ${status}).`;
  }
  return "Erro inesperado no app. Tenta de novo.";
}
