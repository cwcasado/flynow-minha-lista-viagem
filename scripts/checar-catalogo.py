"""Confere o catálogo gerado e valida o merge com a Wikipedia (usado no build).

A API da Wikipedia devolve no máximo 20 extracts por requisição (`exlimit`),
então os títulos são consultados em lotes de 20 — com 25 destinos isso evita
que os últimos fiquem sem descrição real no app.
"""

import json
import re
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FONTE = RAIZ / "src" / "data" / "destinos.ts"
TAMANHO_LOTE = 20

texto = FONTE.read_text(encoding="utf-8")
nomes = re.findall(r'^    nome: "(.*)",$', texto, re.M)
ids = re.findall(r'^    id: "(.*)",$', texto, re.M)
blocos = texto.split("    fotos: [")[1:]

print(f"destinos: {len(nomes)} | ids únicos: {len(set(ids))}")
print(f"blocos de fotos: {len(blocos)} | fotos por destino: {[b.count('categoria:') for b in blocos]}")

urls = re.findall(r'^        url: "(.*)",$', texto, re.M)
print(f"URLs de foto: {len(urls)} | duplicadas: {len(urls) - len(set(urls))}")

CATEGORIAS = {
    "Natureza",
    "Praias",
    "Histórico",
    "Monumentos",
    "Gastronomia",
    "Cultura",
    "Aventura",
    "Ponto turístico",
}

# categorias declaradas no destino x categorias presentes nas fotos
blocos_destino = re.split(r"(?m)^  \{$", texto)[1:]
divergentes: list[str] = []
for bloco in blocos_destino:
    nome = re.search(r'^    nome: "(.*)",$', bloco, re.M)
    lista_categorias = re.search(r"categorias: \[(.*?)\]", bloco, re.S)
    declaradas = set(re.findall(r'"([^"]+)"', lista_categorias.group(1))) if lista_categorias else set()
    das_fotos = set(re.findall(r'categoria: "([^"]+)"', bloco))
    if declaradas != das_fotos:
        divergentes.append(f"{nome.group(1) if nome else '?'}: {sorted(declaradas ^ das_fotos)}")

usadas = set(re.findall(r'categoria: "([^"]+)"', texto))
print(f"categorias usadas nas fotos: {len(usadas)} | fora do catálogo fixo: {sorted(usadas - CATEGORIAS)}")
print(f"divergência destino x fotos: {divergentes or 'nenhuma'}")


def normalizar(t: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", sem_acento.lower()).strip()


def consultar(titulos: list[str]) -> tuple[list[dict], list[dict]]:
    """Consulta a Wikipedia em lotes e devolve páginas + redirecionamentos."""
    paginas: list[dict] = []
    redirecionamentos: list[dict] = []
    for inicio in range(0, len(titulos), TAMANHO_LOTE):
        lote = titulos[inicio : inicio + TAMANHO_LOTE]
        consulta = urllib.parse.urlencode(
            {
                "action": "query",
                "titles": "|".join(lote),
                "prop": "extracts|info",
                "exintro": "1",
                "explaintext": "1",
                "exlimit": str(TAMANHO_LOTE),
                "redirects": "1",
                "inprop": "url",
                "format": "json",
            }
        )
        pedido = urllib.request.Request(
            f"https://pt.wikipedia.org/w/api.php?{consulta}",
            headers={"User-Agent": "FlyNow-MinhaListaViagem/1.0"},
        )
        with urllib.request.urlopen(pedido, timeout=30) as resposta:
            dados = json.load(resposta)
        consulta_dados = dados.get("query", {})
        paginas.extend(consulta_dados.get("pages", {}).values())
        redirecionamentos.extend(consulta_dados.get("redirects", []))
    return paginas, redirecionamentos


paginas, redirecionamentos = consultar(nomes)
paginas = [p for p in paginas if p.get("pageid")]
retornados = {normalizar(p["title"]) for p in paginas}
# títulos pedidos que respondem por redirecionamento também são correspondência
retornados.update(normalizar(r["from"]) for r in redirecionamentos)

print(f"páginas retornadas: {len(paginas)}")
print(f"sem correspondência: {[n for n in nomes if normalizar(n) not in retornados]}")
print(f"com extract: {sum(1 for p in paginas if p.get('extract'))}")
