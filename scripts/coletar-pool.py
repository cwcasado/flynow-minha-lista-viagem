"""Coleta um pool de fotos candidatas por destino (artigo + categorias do Commons).

Ferramenta de curadoria: gera scripts/pool.json para revisão humana.
A seleção final fica em scripts/curadoria.json.

Uso:
    python scripts/coletar-pool.py
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import commons_lib as lib  # noqa: E402

SAIDA = Path(__file__).with_name("pool.json")

TITULOS = [
    ("Parque Nacional da Serra da Capivara", "Serra da Capivara"),
    ("Delta do Parnaíba", "Delta do Parnaíba"),
    ("Cânion Itaimbezinho", "Itaimbezinho"),
    ("Jalapão", "Jalapão"),
    ("Parque Nacional Marinho dos Abrolhos", "Abrolhos Bahia"),
    ("São Luís", "São Luís Maranhão"),
    ("Paraty", "Paraty"),
    ("Tiradentes (Minas Gerais)", "Tiradentes Minas Gerais"),
    ("Ilha de Marajó", "Ilha de Marajó"),
    ("Pantanal", "Pantanal"),
]


def pool_destino(titulo: str, termo: str) -> dict:
    """Junta imagens do artigo e das duas categorias mais relevantes do Commons."""
    fotos = lib.do_artigo(titulo)
    categorias = lib.achar_categorias(termo)
    time.sleep(lib.PAUSA)

    for categoria in categorias[:2]:
        fotos.extend(lib.da_categoria(categoria))
        time.sleep(lib.PAUSA)

    vistos: set[str] = set()
    validas = []
    for foto in fotos:
        chave = foto["arquivo"].lower()
        if chave in vistos or not lib.valida(foto):
            continue
        vistos.add(chave)
        validas.append(foto)

    # Paisagem primeiro, maior resolução antes.
    validas.sort(key=lambda f: (f["altura"] > f["largura"], -f["largura"]))

    return {
        "titulo": titulo,
        "categorias_commons": categorias,
        "total_pool": len(validas),
        "fotos": validas[:40],
    }


def main() -> None:
    resultado = []
    for titulo, termo in TITULOS:
        print(f"[..] {titulo}", flush=True)
        try:
            dados = pool_destino(titulo, termo)
        except Exception as erro:  # noqa: BLE001 - relatório, não crash
            print(f"[!!] {type(erro).__name__}: {erro}", flush=True)
            continue
        resultado.append(dados)
        print(
            f"     pool={dados['total_pool']:3d}  cats={dados['categorias_commons'][:2]}",
            flush=True,
        )

    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nGravado em {SAIDA}")


if __name__ == "__main__":
    main()
