"""Funções compartilhadas para consultar a API do Wikimedia Commons.

Usado pelos scripts de curadoria de fotos dos destinos (FlyNow).
Somente biblioteca padrão.
"""

from __future__ import annotations

import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request

API_PT = "https://pt.wikipedia.org/w/api.php"
API_COMMONS = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "FlyNow-MinhaListaViagem/1.0 (projeto academico; contato: aluno@example.com)"
PAUSA = 1.0

BLOQUEIO = re.compile(
    r"logo|bandeira|brasao|escudo|coat of arms|flag|mapa|\bmap\b|locator|icon|"
    r"selo|seal|diagram|planta|banner|wikimedia|commons-logo|question|disambig|"
    r"\.svg$|\.pdf$|\.ogg$|\.webm$|\.tif$|\.gif$",
    re.IGNORECASE,
)

MIMES_OK = {"image/jpeg", "image/png", "image/webp"}


def chamar(api: str, params: dict[str, str]) -> dict:
    """GET na API com User-Agent identificado (exigido pela Wikimedia)."""
    url = f"{api}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resposta:
        return json.loads(resposta.read().decode("utf-8"))


def limpar_html(valor: str | None) -> str:
    """Remove tags HTML (o campo Artist vem com markup)."""
    return re.sub(r"<[^>]+>", "", valor or "").strip()


def normalizar(texto: str) -> str:
    """Minúsculo, sem acentos e sem pontuação."""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", sem_acento.lower()).strip()


def extrair(paginas: list[dict], origem: str = "") -> list[dict]:
    """Converte páginas da API em registros de foto."""
    itens = []
    for pagina in paginas:
        info = (pagina.get("imageinfo") or [{}])[0]
        if not info:
            continue
        meta = info.get("extmetadata", {})
        itens.append(
            {
                "arquivo": pagina.get("title", ""),
                "url": info.get("thumburl") or info.get("url"),
                "original": info.get("url"),
                "largura": info.get("width", 0),
                "altura": info.get("height", 0),
                "mime": info.get("mime", ""),
                "credito": limpar_html(meta.get("Artist", {}).get("value")),
                "licenca": limpar_html(meta.get("LicenseShortName", {}).get("value")),
                "origem": origem,
            }
        )
    return itens


def valida(foto: dict) -> bool:
    """Regras mínimas para uma foto servir de capa de card."""
    if not foto.get("url") or not foto.get("original"):
        return False
    if BLOQUEIO.search(foto["arquivo"]):
        return False
    if foto.get("mime") not in MIMES_OK:
        return False
    return foto.get("largura", 0) >= 1000 and foto.get("altura", 0) >= 500


def info_titulos(titulos: list[str], largura: int = 960) -> dict[str, dict]:
    """Resolve imageinfo (URL 960px, crédito, licença) para arquivos do Commons."""
    resultado: dict[str, dict] = {}
    for inicio in range(0, len(titulos), 50):
        lote = titulos[inicio : inicio + 50]
        dados = chamar(
            API_COMMONS,
            {
                "action": "query",
                "titles": "|".join(lote),
                "prop": "imageinfo",
                "iiprop": "url|size|mime|extmetadata",
                "iiurlwidth": str(largura),
                "format": "json",
                "formatversion": "2",
            },
        )
        for foto in extrair(dados.get("query", {}).get("pages", [])):
            resultado[foto["arquivo"]] = foto
        time.sleep(PAUSA)
    return resultado


def do_artigo(titulo: str) -> list[dict]:
    """Imagens usadas no artigo da Wikipedia em português."""
    dados = chamar(
        API_PT,
        {
            "action": "query",
            "titles": titulo,
            "prop": "images",
            "imlimit": "100",
            "format": "json",
            "formatversion": "2",
        },
    )
    paginas = dados.get("query", {}).get("pages", [])
    if not paginas:
        return []
    arquivos = [
        re.sub(r"^Ficheiro:", "File:", img["title"], flags=re.IGNORECASE)
        for img in paginas[0].get("images", [])
    ]
    if not arquivos:
        return []
    dados_info = chamar(
        API_COMMONS,
        {
            "action": "query",
            "titles": "|".join(arquivos[:50]),
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": "960",
            "format": "json",
            "formatversion": "2",
        },
    )
    time.sleep(PAUSA)
    return extrair(dados_info.get("query", {}).get("pages", []), origem="artigo")


def achar_categorias(termo: str, limite: int = 5) -> list[str]:
    """Categorias do Commons relacionadas ao termo."""
    dados = chamar(
        API_COMMONS,
        {
            "action": "query",
            "list": "search",
            "srsearch": termo,
            "srnamespace": "14",
            "srlimit": str(limite),
            "format": "json",
            "formatversion": "2",
        },
    )
    return [item["title"] for item in dados.get("query", {}).get("search", [])]


def da_categoria(categoria: str, limite: int = 100) -> list[dict]:
    """Arquivos de uma categoria do Commons."""
    dados = chamar(
        API_COMMONS,
        {
            "action": "query",
            "generator": "categorymembers",
            "gcmtitle": categoria,
            "gcmtype": "file",
            "gcmlimit": str(limite),
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": "960",
            "format": "json",
            "formatversion": "2",
        },
    )
    return extrair(dados.get("query", {}).get("pages", []), origem=categoria)


def buscar(termo: str, limite: int = 12) -> list[dict]:
    """Busca livre por arquivos de imagem no Commons."""
    dados = chamar(
        API_COMMONS,
        {
            "action": "query",
            "generator": "search",
            "gsrsearch": f"filetype:bitmap {termo}",
            "gsrnamespace": "6",
            "gsrlimit": str(limite),
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": "960",
            "format": "json",
            "formatversion": "2",
        },
    )
    return extrair(dados.get("query", {}).get("pages", []), origem=f"busca:{termo}")
