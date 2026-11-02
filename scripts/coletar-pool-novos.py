"""Coleta o pool de fotos candidatas dos 15 destinos novos + pageids da Wikipedia.

Gera scripts/pool-novos.json e imprime uma lista compacta para curadoria manual.

Uso:
    python scripts/coletar-pool-novos.py
"""

from __future__ import annotations

import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import commons_lib as lib  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "scripts" / "pool-novos.json"

NOVOS = [
    ("Fernando de Noronha", "Fernando de Noronha"),
    ("Lençóis Maranhenses", "Lençóis Maranhenses"),
    ("Gramado", "Gramado Rio Grande do Sul"),
    ("Cataratas do Iguaçu", "Iguazu Falls"),
    ("Chapada Diamantina", "Chapada Diamantina"),
    ("Manaus", "Manaus"),
    ("Ouro Preto", "Ouro Preto"),
    ("Salvador", "Salvador Bahia"),
    ("Recife", "Recife"),
    ("Olinda", "Olinda Pernambuco"),
    ("Búzios", "Buzios"),
    ("Ubatuba", "Ubatuba"),
    ("Bonito", "Bonito Mato Grosso do Sul"),
    ("Vila Velha", "Vila Velha Espirito Santo"),
    ("Angra dos Reis", "Angra dos Reis"),
]


def pageids(titulos: list[str]) -> dict:
    """Pageid + título canônico + url de cada página da Wikipedia PT."""
    consulta = urllib.parse.urlencode(
        {
            "action": "query",
            "titles": "|".join(titulos),
            "prop": "info",
            "redirects": "1",
            "inprop": "url",
            "format": "json",
            "formatversion": "2",
        }
    )
    pedido = urllib.request.Request(
        f"https://pt.wikipedia.org/w/api.php?{consulta}",
        headers={"User-Agent": lib.USER_AGENT},
    )
    with urllib.request.urlopen(pedido, timeout=30) as resposta:
        dados = json.load(resposta)

    redirecionados = {r["from"]: r["to"] for r in dados.get("query", {}).get("redirects", [])}
    por_titulo = {}
    for pagina in dados.get("query", {}).get("pages", []):
        por_titulo[pagina["title"]] = pagina

    resultado = {}
    for titulo in titulos:
        alvo = redirecionados.get(titulo, titulo)
        pagina = por_titulo.get(alvo, {})
        resultado[titulo] = {
            "pageid": pagina.get("pageid"),
            "titulo_canônico": pagina.get("title"),
            "url": pagina.get("fullurl"),
            "existe": pagina.get("pageid") is not None,
        }
    return resultado


def pool_destino(titulo: str, termo: str) -> dict:
    fotos = lib.do_artigo(titulo)
    categorias = lib.achar_categorias(termo)
    time.sleep(lib.PAUSA)

    for categoria in categorias[:2]:
        try:
            fotos.extend(lib.da_categoria(categoria))
        except Exception as erro:  # noqa: BLE001
            print(f"     [aviso] categoria {categoria}: {erro}", flush=True)
        time.sleep(lib.PAUSA)

    vistos: set[str] = set()
    validas = []
    for foto in fotos:
        chave = foto["arquivo"].lower()
        if chave in vistos or not lib.valida(foto):
            continue
        vistos.add(chave)
        validas.append(foto)

    validas.sort(key=lambda f: (f["altura"] > f["largura"], -f["largura"]))

    return {
        "titulo": titulo,
        "categorias_commons": categorias,
        "total_pool": len(validas),
        "fotos": validas[:60],
    }


def main() -> None:
    ids = pageids([titulo for titulo, _ in NOVOS])
    print("=== Wikipedia ===")
    for titulo, dados in ids.items():
        marca = "ok " if dados["existe"] else "!! "
        print(f"{marca}{titulo:<26} id={dados['pageid']}  -> {dados['titulo_canônico']}")

    resultado = []
    for titulo, termo in NOVOS:
        print(f"\n=== {titulo} ===", flush=True)
        try:
            dados = pool_destino(titulo, termo)
        except Exception as erro:  # noqa: BLE001
            print(f"[!!] {type(erro).__name__}: {erro}", flush=True)
            continue
        resultado.append(dados)
        print(f"pool={dados['total_pool']} cats={dados['categorias_commons'][:2]}")
        for foto in dados["fotos"][:24]:
            print(
                f"  {foto['arquivo'][5:][:88]:<88} {foto['largura']}x{foto['altura']} "
                f"{foto['mime'].replace('image/', '')}"
            )

    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nGravado {SAIDA}")


if __name__ == "__main__":
    main()
