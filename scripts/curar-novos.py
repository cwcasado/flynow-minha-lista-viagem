"""Curadoria dos 15 destinos novos -> acrescenta ao scripts/curadoria.json.

Regra de segurança: as fotos só podem vir do pool coletado **para aquele
destino** (artigo da Wikipedia + categorias do Commons) ou de buscas extras
com termo inequívoco. Nada de busca livre por palavra genérica.

O casamento ignora acentos (NFKD) para não errar o título do arquivo.

Pré-requisito: os pools de candidatos precisam existir.
    python scripts/coletar-pool-novos.py     # -> scripts/pool-novos.json
    python scripts/coletar-pool-alvo.py      # -> scripts/pool-alvo.json

O script é idempotente: rodar de novo substitui as entradas dos 15 destinos
pelas escolhas da tabela NOVOS, sem duplicar.

Uso:
    python scripts/curar-novos.py            # mostra a resolução e grava
    python scripts/curar-novos.py --dry-run  # só mostra
"""

from __future__ import annotations

import json
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import commons_lib as lib  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CURADORIA = RAIZ / "scripts" / "curadoria.json"

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

# Buscas extras por destino (termos inequívocos; o resultado ainda é
# conferido por substring do nome do arquivo).
EXTRA_BUSCAS = {
    "Búzios": ["camarão grelhado", "moqueca de camarão"],
    "Ubatuba": ["açaí na tigela"],
    "Salvador": ["Pelourinho Salvador", "comida de rua Salvador"],
}

# (nome, pageid, descrição, url, categorias, [(chave, título, categoria), ...])
NOVOS = [
    (
        "Fernando de Noronha",
        "21545",
        "Arquipélago no Atlântico com praias de areia branca, golfinhos e trilhas.",
        "https://pt.wikipedia.org/wiki/Fernando_de_Noronha",
        ["Natureza", "Praias", "Aventura", "Ponto turístico"],
        [
            ("arquipelago de fernando de noronha - ilha dois", "Arquipélago de Fernando de Noronha", "Natureza"),
            ("fernando de noronha-praia do sancho", "Praia do Sancho", "Praias"),
            ("bruno lima baia dos porcos", "Baía dos Porcos", "Aventura"),
            ("bruno lima enseada dos golfinhos", "Enseada dos Golfinhos", "Praias"),
            ("palacio de sao miguel", "Palácio de São Miguel", "Ponto turístico"),
            ("2013-08-15 - atoba", "Atobá-pardo", "Natureza"),
        ],
    ),
    (
        "Lençóis Maranhenses",
        "150576",
        "Dunas de areia branca e lagoas de água doce no Maranhão.",
        "https://pt.wikipedia.org/wiki/Len%C3%B3is_Maranhenses",
        ["Natureza", "Aventura", "Ponto turístico", "Cultura"],
        [
            ("lencois maranhenses panorama1", "Panorama dos Lençóis", "Natureza"),
            ("areias nos lencois", "Dunas de areia", "Natureza"),
            ("lagoa e as dunas", "Lagoa e dunas do Parque", "Praias"),
            ("anfiteatro de areia", "Anfiteatro de areia", "Ponto turístico"),
            ("capoeira em lencois", "Capoeira em Lençóis", "Aventura"),
            ("casa de pau a pique", "Casa de pau-a-pique", "Cultura"),
        ],
    ),
    (
        "Gramado",
        "11211",
        "Serra Gaúcha com clima de altitude, Festival de Cinema e o Lago Negro.",
        "https://pt.wikipedia.org/wiki/Gramado",
        ["Natureza", "Cultura", "Gastronomia", "Ponto turístico"],
        [
            ("lago negro, gramado-rs", "Lago Negro", "Natureza"),
            ("araucaria angustifolia trees", "Araucárias de Gramado", "Natureza"),
            ("mini mundo - gramado", "Mini Mundo", "Ponto turístico"),
            ("natal luz - gramado", "Natal Luz", "Cultura"),
            ("churrasco campeiro", "Churrasco campeiro", "Gastronomia"),
            ("costela no fogo", "Costela no fogo", "Gastronomia"),
        ],
    ),
    (
        "Cataratas do Iguaçu",
        "42117",
        "275 quedas de água no Parque Nacional do Iguaçu, entre Brasil e Argentina.",
        "https://pt.wikipedia.org/wiki/Cataratas_do_Igua%C3%A7u",
        ["Natureza", "Aventura", "Ponto turístico", "Histórico"],
        [
            ("00 1826 iguazu falls", "Cataratas do Iguaçu", "Natureza"),
            ("parque cataratas del iguazu 09", "Vista panorâmica das cataratas", "Natureza"),
            ("toco toucan foz", "Toco-toucan do parque", "Natureza"),
            ("10028910313", "Corredor das 275 quedas", "Aventura"),
            ("j31 131", "Trem turístico do Iguaçu", "Ponto turístico"),
            ("00 1854 iguazu", "Iguaçu em 1900", "Histórico"),
        ],
    ),
    (
        "Chapada Diamantina",
        "83255",
        "Planalto de formações rochosas na Bahia, com cânions, cachoeiras e vilas históricas.",
        "https://pt.wikipedia.org/wiki/Chapada_Diamantina",
        ["Natureza", "Cultura", "Aventura", "Histórico"],
        [
            ("vista do vale do pati", "Vale do Pati", "Natureza"),
            ("cachoeira do buracao", "Cachoeira do Buracão", "Natureza"),
            ("floresta de pedras", "Floresta de Pedras", "Natureza"),
            ("chdiam-teia-agua", "Teia de água", "Aventura"),
            ("cemiterio bizantino", "Cemitério Bizantino", "Histórico"),
            ("biblioteca publica municipal herberto sales", "Biblioteca Pública Herberto Sales", "Cultura"),
        ],
    ),
    (
        "Manaus",
        "8904",
        "Capital do Amazonas na confluência dos rios Negro e Solimões, cercada de floresta.",
        "https://pt.wikipedia.org/wiki/Manaus",
        ["Natureza", "Cultura", "Aventura", "Ponto turístico"],
        [
            ("teatro amazonas. manaus, brazil. 01", "Teatro Amazonas", "Cultura"),
            ("vista do centro de manaus", "Centro de Manaus", "Ponto turístico"),
            ("aerial view of the amazon rainforest", "Floresta amazônica", "Natureza"),
            ("amazon river - 2018", "Rio Amazonas", "Natureza"),
            ("amazon boat - panoramio", "Passeio de barco no Amazonas", "Aventura"),
            ("amazon sunset - panoramio", "Pôr do sol no Amazonas", "Natureza"),
        ],
    ),
    (
        "Ouro Preto",
        "13618",
        "Cidade colonial mineira com arquitetura barroca e mineração de ouro no século XVIII.",
        "https://pt.wikipedia.org/wiki/Ouro_Preto",
        ["Histórico", "Monumentos", "Cultura", "Gastronomia"],
        [
            ("conjunto arquitetonico e urbanistico", "Conjunto arquitetônico de Ouro Preto", "Histórico"),
            ("casa dos contos", "Casa dos Contos", "Monumentos"),
            ("chafariz de marilia", "Chafariz de Marília", "Monumentos"),
            ("cemiterio da igreja das merces", "Cemitério das Mercês de Baixo", "Histórico"),
            ("museu da inconfidencia", "Museu da Inconfidência", "Cultura"),
            ("cheese bread", "Pão de queijo", "Gastronomia"),
        ],
    ),
    (
        "Salvador",
        "26397",
        "Capital da Bahia, com o conjunto colonial do Pelourinho e a orla do Porto da Barra.",
        "https://pt.wikipedia.org/wiki/Salvador",
        ["Histórico", "Cultura", "Gastronomia", "Ponto turístico"],
        [
            ("largo do pelourinho, salvador 20150719", "Largo do Pelourinho", "Histórico"),
            ("pelourinho salvador bahia 2018-0601", "Casario do Pelourinho", "Ponto turístico"),
            ("centro historico salvador vista", "Centro histórico de Salvador", "Histórico"),
            ("caldo de sururu", "Caldo de sururu", "Gastronomia", ("salvador",)),
            ("baiana do acaraje claudia baiana", "Acarajé da Baiana", "Gastronomia", ("baiana",)),
            ("praia do porto da barra 7784", "Praia do Porto da Barra", "Praias"),
        ],
    ),
    (
        "Recife",
        "1679",
        "Capital de Pernambuco entre rios e canais, berço do frevo e da culinária local.",
        "https://pt.wikipedia.org/wiki/Recife",
        ["Histórico", "Cultura", "Gastronomia", "Ponto turístico"],
        [
            ("capela dourada da ordem franciscana", "Capela Dourada", "Histórico"),
            ("fachada da faculdade de direito", "Faculdade de Direito do Recife", "Histórico"),
            ("frevo dancer - recife", "Frevo no Recife", "Cultura"),
            ("bolo de rolo, doce brasileiro", "Bolo de rolo", "Gastronomia"),
            ("bicicleata bertotti 65613 na praca", "Marco Zero", "Ponto turístico"),
            ("boa viagem (2) - recife", "Praia de Boa Viagem", "Praias"),
        ],
    ),
    (
        "Olinda",
        "12904",
        "Sítio histórico pernambucano com igrejas coloniais e carnaval de frevo.",
        "https://pt.wikipedia.org/wiki/Olinda",
        ["Histórico", "Monumentos", "Cultura"],
        [
            ("igreja nossa senhora do monte (19641348536)", "Igreja Nossa Senhora do Monte", "Monumentos"),
            ("igreja do carmo - olinda - outside recife", "Igreja do Carmo", "Monumentos"),
            ("igreja da misericordia - olinda, pernambuco", "Igreja da Misericórdia", "Monumentos"),
            ("vista aerea do sitio historico de olinda", "Vista aérea do sítio histórico", "Histórico"),
            ("largo da igreja do rosario dos homens pretos", "Largo do Rosário dos Homens Pretos", "Histórico"),
            ("carnaval de olinda, polo erasto vasconcelos 05", "Carnaval de Olinda", "Cultura"),
        ],
    ),
    (
        "Búzios",
        "7703",
        "Arraial de pescadores entre ilhas, com praias, trapiche e ruelas de pedra.",
        "https://pt.wikipedia.org/wiki/B%C3%BAzios",
        ["Praias", "Aventura", "Gastronomia", "Ponto turístico"],
        [
            ("praia da armacao, buzios 3", "Praia da Armação", "Praias"),
            ("praia de buzios.jpg", "Praia de Búzios", "Praias"),
            ("alto da brava em buzios rj", "Alto da Brava", "Aventura"),
            ("armacao de buzios - rio de janeiro, brasil - panoramio", "Arraial de Búzios", "Ponto turístico"),
            ("camarao aberto grelhado", "Camarão grelhado", "Gastronomia"),
            ("moqueca de camarao", "Moqueca de camarão", "Gastronomia"),
        ],
    ),
    (
        "Ubatuba",
        "1880",
        "Litoral de Mata Atlântica entre serras e praias, rota famosa de surf.",
        "https://pt.wikipedia.org/wiki/Ubatuba",
        ["Praias", "Natureza", "Aventura", "Gastronomia"],
        [
            ("alamada beach, ubatuba", "Praia do Alamada", "Praias"),
            ("ubatuba praia da lagoinha", "Praia da Lagoinha ao pôr do sol", "Praias"),
            ("serra com mata atlantica", "Serra do Mar com Mata Atlântica", "Natureza"),
            ("6 ilha das couves - ubatuba", "Ilha das Coves", "Aventura"),
            ("gruta que chora (26219871263)", "Gruta que Chora", "Aventura"),
            ("acai na tigela", "Açaí na tigela", "Gastronomia"),
        ],
    ),
    (
        "Bonito",
        "25783",
        "Rio Formoso de águas claras, cachoeiras de tufa e grutas no Mato Grosso do Sul.",
        "https://pt.wikipedia.org/wiki/Bonito",
        ["Natureza", "Aventura", "Ponto turístico"],
        [
            ("cachoeira veu da noiva ii", "Cachoeira Véu da Noiva", "Natureza"),
            ("rio formoso, bonito(ms) caroline meirelles (02)", "Rio Formoso", "Natureza"),
            ("crystal clear waters.jpg", "Águas cristalinas", "Natureza"),
            ("espelho-nascente", "Espelho Nascente", "Aventura"),
            ("boca da onca, bonito, ms", "Boca da Onça", "Ponto turístico"),
            ("balneario ilha do padre (corda bamba)", "Balneário Ilha do Padre", "Ponto turístico"),
        ],
    ),
    (
        "Vila Velha",
        "15465",
        "Primeira vila do Brasil, com o Convento da Penha e as praias da Serra do Mar.",
        "https://pt.wikipedia.org/wiki/Vila_Velha",
        ["Histórico", "Monumentos", "Cultura", "Praias"],
        [
            ("convento da penha - panoramio.jpg", "Convento da Penha", "Monumentos"),
            ("subindo com fe", "Escadaria do Convento da Penha", "Histórico"),
            ("bencaos da penha", "Bençãos da Penha", "Cultura", ("penha",)),
            ("centro de vila velha, vila velha - es, brazil", "Centro de Vila Velha", "Histórico"),
            ("praia de itaparica, vila velha - es, brazil - panoramio", "Praia de Itaparica", "Praias"),
            ("praia de itapua, vila velha es", "Praia de Itapoã", "Praias"),
        ],
    ),
    (
        "Angra dos Reis",
        "33759",
        "Baía de ilhas entre serras e Mata Atlântica, com Praia Secreta e o Lazareto.",
        "https://pt.wikipedia.org/wiki/Angra_dos_Reis",
        ["Praias", "Natureza", "Histórico", "Ponto turístico"],
        [
            ("praia secreta - angra dos reis - brasil - panoramio.jpg", "Praia Secreta", "Praias"),
            ("beleza da lagoa azul", "Lagoa Azul", "Praias"),
            ("catarama ilha grande rio de janeiro", "Cachoeira de Catarama", "Natureza", ("ilha grande",)),
            ("cachoeira da feiticeira- ilha grande", "Cachoeira da Feiticeira", "Natureza"),
            ("a ponte de ilha grande", "Ponte de Ilha Grande", "Ponto turístico"),
            ("ruinas lazareto ilha grande", "Ruínas do Lazareto", "Histórico"),
        ],
    ),
]


def dobrar(texto: str) -> str:
    """Minúsculo e sem acento, para comparar nome de arquivo com chave."""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return sem_acento.lower()


def candidatos_do_pool(destino: str) -> list[dict]:
    """Fotos coletadas nas categorias/artigos daquele destino."""
    fotos: dict[str, dict] = {}
    for arquivo_pool in ("pool-alvo.json", "pool-novos.json"):
        caminho = RAIZ / "scripts" / arquivo_pool
        if not caminho.exists():
            continue
        for bloco in json.loads(caminho.read_text(encoding="utf-8")):
            if bloco["titulo"] != destino:
                continue
            for foto in bloco["fotos"]:
                fotos.setdefault(foto["arquivo"], foto)
    return list(fotos.values())


def candidatos_globais() -> list[dict]:
    """Todos os arquivos coletados em qualquer destino (fallback com token)."""
    fotos: dict[str, dict] = {}
    for arquivo_pool in ("pool-alvo.json", "pool-novos.json"):
        caminho = RAIZ / "scripts" / arquivo_pool
        if not caminho.exists():
            continue
        for bloco in json.loads(caminho.read_text(encoding="utf-8")):
            for foto in bloco["fotos"]:
                fotos.setdefault(foto["arquivo"], foto)
    return list(fotos.values())


def candidatos_extras(destino: str) -> list[dict]:
    """Fotos de buscas extras com termo inequívoco."""
    termos = EXTRA_BUSCAS.get(destino, [])
    if not termos:
        return []
    fotos: dict[str, dict] = {}
    for termo in termos:
        try:
            achados = lib.buscar(termo, limite=25)
        except Exception as erro:  # noqa: BLE001
            print(f"  [aviso] busca {termo}: {erro}")
            continue
        for foto in achados:
            if lib.valida(foto):
                fotos.setdefault(foto["arquivo"], foto)
    return list(fotos.values())


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    dados = json.loads(CURADORIA.read_text(encoding="utf-8"))
    nomes_novos = {item[0] for item in NOVOS}

    # Re-executável: as entradas anteriores dos 15 destinos saem da base e as
    # fotos que elas ocupavam voltam a ficar disponíveis.
    base = [d for d in dados["destinos"] if d["nome"] not in nomes_novos]
    usados = {foto["arquivo"] for d in base for foto in d["fotos"]}

    novos = []
    problemas = []

    for nome, pageid, descricao, url, categorias, picks in NOVOS:
        candidatos = candidatos_do_pool(nome) + candidatos_extras(nome)
        if not candidatos:
            problemas.append(f"{nome}: nenhum candidato coletado")
            continue

        fotos = []
        for pick in picks:
            chave, titulo, categoria = pick[0], pick[1], pick[2]
            tokens = pick[3] if len(pick) > 3 else None
            if categoria not in CATEGORIAS:
                problemas.append(f"{nome}: categoria inválida '{categoria}'")
                continue

            alvo = dobrar(chave)
            achados = [c for c in candidatos if alvo in dobrar(c["arquivo"])]
            origem = "pool do destino"

            if not achados and tokens:
                achados = [
                    c
                    for c in candidatos_globais()
                    if alvo in dobrar(c["arquivo"])
                    and any(dobrar(t) in dobrar(c["arquivo"]) for t in tokens)
                ]
                origem = "pool global (token de lugar)"

            if not achados:
                problemas.append(f"{nome}: nenhum arquivo casa com '{chave}'")
                continue

            livres = [c for c in achados if c["arquivo"] not in usados]
            escolhida = (livres or achados)[0]
            if escolhida["arquivo"] in usados:
                problemas.append(f"{nome}: foto repetida {escolhida['arquivo']}")
                continue

            usados.add(escolhida["arquivo"])
            fotos.append(
                {"arquivo": escolhida["arquivo"], "titulo": titulo, "categoria": categoria}
            )
            marca = "" if len(achados) == 1 else f"  ({len(achados)} candidatos)"
            print(
                f"{nome:<23} {categoria:<16} {titulo:<32} <- "
                f"{escolhida['arquivo'][5:][:50]}{marca} [{origem}]"
            )

        if len(fotos) != 6:
            problemas.append(f"{nome}: {len(fotos)}/6 fotos")
            continue

        categorias_efetivas = sorted(set(categorias) | {f["categoria"] for f in fotos})
        novos.append(
            {
                "id": pageid,
                "nome": nome,
                "descricao": descricao,
                "url": url,
                "categorias": categorias_efetivas,
                "fotos": fotos,
            }
        )

    print("\n=== problemas ===")
    if problemas:
        for problema in problemas:
            print(f"  [!!] {problema}")
    else:
        print("  nenhum")

    if dry_run:
        print("\n(dry-run: nada gravado)")
        return

    if problemas:
        raise SystemExit("Corrija os problemas acima antes de gravar.")

    dados["destinos"] = base + novos
    CURADORIA.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nGravado {CURADORIA}: {len(dados['destinos'])} destinos")


if __name__ == "__main__":
    main()
