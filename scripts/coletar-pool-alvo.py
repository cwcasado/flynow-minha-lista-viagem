"""Segunda coleta: categorias e buscas direcionadas para os 15 destinos novos.

Objetivo: garantir 6 fotos relevantes por destino, incluindo gastronomia.
Imagens do artigo + categorias do Commons + busca livre por termo.

Uso:
    python scripts/coletar-pool-alvo.py
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import commons_lib as lib  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "scripts" / "pool-alvo.json"

ALVOS: dict[str, dict] = {
    "Fernando de Noronha": {
        "artigo": "Fernando de Noronha",
        "categorias": [
            "Category:Fernando de Noronha",
            "Category:Beaches of Fernando de Noronha",
            "Category:Fernando de Noronha Marine National Park",
        ],
        "buscas": ["Fernando de Noronha praia", "Fernando de Noronha peixe prato"],
    },
    "Lençóis Maranhenses": {
        "artigo": "Parque Nacional dos Lençóis Maranhenses",
        "categorias": [
            "Category:Lençóis Maranhenses",
            "Category:Parque Nacional dos Lençóis Maranhenses",
            "Category:Lençóis",
        ],
        "buscas": ["Lençóis Maranhenses dunas", "Laguna Lençóis Maranhão"],
    },
    "Gramado": {
        "artigo": "Gramado",
        "categorias": ["Category:Gramado", "Category:Churrasco", "Category:Pão de queijo"],
        "buscas": ["churrasco carneNewswire", "Festival de Cinema de Gramado"],
    },
    "Cataratas do Iguaçu": {
        "artigo": "Cataratas do Iguaçu",
        "categorias": ["Category:Iguazu Falls", "Category:Birds of Iguaçu"],
        "buscas": ["Iguazu bird toucan", "Foz do Iguaçu treetop walk"],
    },
    "Chapada Diamantina": {
        "artigo": "Chapada Diamantina",
        "categorias": ["Category:Chapada Diamantina", "Category:Cuisine of Bahia"],
        "buscas": ["Chapada Diamantina cachoeira", "moqueca baiana"],
    },
    "Manaus": {
        "artigo": "Manaus",
        "categorias": ["Category:Manaus", "Category:Amazon River", "Category:Tambaqui"],
        "buscas": ["tambaqui peixe Manaus", "cupuaçu Manaus"],
    },
    "Ouro Preto": {
        "artigo": "Ouro Preto",
        "categorias": ["Category:Ouro Preto", "Category:Pão de queijo", "Category:Cachaça"],
        "buscas": ["Ouro Preto igreja", "Ouro Preto comida mineira"],
    },
    "Salvador": {
        "artigo": "Salvador",
        "categorias": [
            "Category:Pelourinho",
            "Category:Acarajé",
            "Category:Food of Bahia",
            "Category:Beaches of Salvador",
        ],
        "buscas": ["moqueca de peixe", "Salvador Porto da Barra"],
    },
    "Recife": {
        "artigo": "Recife",
        "categorias": [
            "Category:Recife",
            "Category:Frevo",
            "Category:Acarajé",
            "Category:Bolo de rolo",
            "Category:Capela Dourada",
        ],
        "buscas": ["Recife centro histórico", "Recife praia Boa Viagem"],
    },
    "Olinda": {
        "artigo": "Olinda",
        "categorias": [
            "Category:Olinda, Pernambuco",
            "Category:Centro Histórico de Olinda",
            "Category:Churches in Olinda",
        ],
        "buscas": ["Olinda igreja", "Olinda Carnaval frevo"],
    },
    "Búzios": {
        "artigo": "Armação dos Búzios",
        "categorias": [
            "Category:Armação dos Búzios",
            "Category:Búzios",
            "Category:Beaches of Armação dos Búzios",
        ],
        "buscas": ["Búzios praia", "Búzios marina"],
    },
    "Ubatuba": {
        "artigo": "Ubatuba",
        "categorias": [
            "Category:Beaches of Ubatuba",
            "Category:Ilha das Coves",
            "Category:Ubatuba",
        ],
        "buscas": ["Ubatuba praia", "açaí Ubatuba"],
    },
    "Bonito": {
        "artigo": "Bonito",
        "categorias": [
            "Category:Bonito (Mato Grosso do Sul)",
            "Category:Gruta do Lago Azul",
            "Category:Waterfalls of Mato Grosso do Sul",
        ],
        "buscas": ["Bonito cachoeira Mato Grosso do Sul", "Bonito mergulho rio Formoso"],
    },
    "Vila Velha": {
        "artigo": "Vila Velha",
        "categorias": [
            "Category:Vila Velha, Espírito Santo",
            "Category:Convento da Penha",
            "Category:Beaches of Vila Velha",
        ],
        "buscas": ["Vila Velha praia", "Vila Velha Penha morro"],
    },
    "Angra dos Reis": {
        "artigo": "Angra dos Reis",
        "categorias": [
            "Category:Angra dos Reis",
            "Category:Beaches of Angra dos Reis",
            "Category:Ilha Grande",
        ],
        "buscas": ["Angra dos Reis praia", "Angra dos Reis ilha"],
    },
}


def coletar(nome: str, config: dict) -> dict:
    fotos = lib.do_artigo(config["artigo"])
    fontes: list[tuple[str, list[dict]]] = []

    for categoria in config["categorias"]:
        try:
            arquivos = lib.da_categoria(categoria)
        except Exception as erro:  # noqa: BLE001
            print(f"  [aviso] {categoria}: {erro}", flush=True)
            arquivos = []
        fontes.append((categoria, arquivos))
        time.sleep(lib.PAUSA)

    for termo in config["buscas"]:
        try:
            arquivos = lib.buscar(termo, limite=20)
        except Exception as erro:  # noqa: BLE001
            print(f"  [aviso] busca {termo}: {erro}", flush=True)
            arquivos = []
        fontes.append((f"busca:{termo}", arquivos))
        time.sleep(lib.PAUSA)

    vistos: set[str] = set()
    validas = []
    for origem, lista in fontes:
        for foto in lista:
            chave = foto["arquivo"].lower()
            if chave in vistos or not lib.valida(foto):
                continue
            vistos.add(chave)
            foto = dict(foto)
            foto["origem"] = origem
            validas.append(foto)

    return {"titulo": nome, "total_pool": len(validas), "fotos": validas}


def main() -> None:
    resultado = []
    for nome, config in ALVOS.items():
        print(f"\n=== {nome} ===", flush=True)
        try:
            dados = coletar(nome, config)
        except Exception as erro:  # noqa: BLE001
            print(f"[!!] {type(erro).__name__}: {erro}", flush=True)
            continue
        resultado.append(dados)
        print(f"pool={dados['total_pool']}")
        for foto in dados["fotos"][:70]:
            print(
                f"  {foto['arquivo'][5:][:82]:<82} {foto['largura']}x{foto['altura']} "
                f"{foto['mime'].replace('image/', '')} [{foto['origem'][:34]}]"
            )

    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nGravado {SAIDA}")


if __name__ == "__main__":
    main()
