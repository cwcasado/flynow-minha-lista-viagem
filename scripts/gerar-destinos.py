"""Gera src/data/destinos.ts a partir de scripts/curadoria.json.

- Resolve a URL de thumbnail 960px de cada arquivo via API do Commons.
- Confere que todos os arquivos do catálogo existem (a API só devolve imageinfo se existir).
- Deriva a lista de categorias do destino a partir das fotos (filtro do topo e
  etiquetas do carrossel nunca podem divergir).
- Falha alto se faltar qualquer foto ou URL.
- Grava também scripts/verificacao-fotos.json com as URLs finais.

Uso:
    python scripts/gerar-destinos.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import commons_lib as lib  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CURADORIA = RAIZ / "scripts" / "curadoria.json"
SAIDA_TS = RAIZ / "src" / "data" / "destinos.ts"
VERIFICACAO = RAIZ / "scripts" / "verificacao-fotos.json"

CATEGORIAS_FIXAS = [
    "Natureza",
    "Praias",
    "Histórico",
    "Monumentos",
    "Gastronomia",
    "Cultura",
    "Aventura",
    "Ponto turístico",
]


def main() -> None:
    dados = json.loads(CURADORIA.read_text(encoding="utf-8"))
    destinos = dados["destinos"]

    arquivos = [foto["arquivo"] for destino in destinos for foto in destino["fotos"]]
    print(f"Resolvendo {len(arquivos)} arquivos no Commons...")
    info = lib.info_titulos(arquivos)

    faltando = [arquivo for arquivo in arquivos if arquivo not in info]
    if faltando:
        print("ERRO: arquivos sem imageinfo:")
        for arquivo in faltando:
            print("  -", arquivo)
        raise SystemExit(1)

    for destino in destinos:
        if len(destino["fotos"]) != 6:
            raise SystemExit(
                f"ERRO: {destino['nome']} tem {len(destino['fotos'])} fotos (esperado 6)"
            )

        # A categoria do destino é a união das categorias das fotos, na ordem fixa.
        usadas = {foto["categoria"] for foto in destino["fotos"]}
        desconhecidas = usadas - set(CATEGORIAS_FIXAS)
        if desconhecidas:
            raise SystemExit(
                f"ERRO: {destino['nome']} usa categoria fora do catálogo: {sorted(desconhecidas)}"
            )
        destino["categorias"] = [c for c in CATEGORIAS_FIXAS if c in usadas]

    CURADORIA.write_text(
        json.dumps(dados, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    linhas = [
        'import type { Categoria, Destino } from "../types";',
        "",
        "// Arquivo gerado por scripts/gerar-destinos.py — não editar à mão.",
        "// Fonte das imagens: Wikimedia Commons (thumbnails de 960px).",
        "// Curadoria registrada em scripts/curadoria.json.",
        "",
        "export const CATALOGO_DESTINOS: Destino[] = [",
    ]

    verificacao = []
    for destino in destinos:
        linhas.append("  {")
        linhas.append(f'    id: "{destino["id"]}",')
        linhas.append(f'    nome: {json.dumps(destino["nome"], ensure_ascii=False)},')
        linhas.append(f'    descricao: {json.dumps(destino["descricao"], ensure_ascii=False)},')
        linhas.append(f'    url: {json.dumps(destino["url"], ensure_ascii=False)},')
        categorias = ", ".join(f'"{c}"' for c in destino["categorias"])
        linhas.append(f"    categorias: [{categorias}],")
        linhas.append("    fotos: [")
        for foto in destino["fotos"]:
            registro = info[foto["arquivo"]]
            url = (registro["url"] or "").replace("http://", "https://")
            if not url:
                raise SystemExit(f"ERRO: sem URL para {foto['arquivo']}")
            verificacao.append(
                {
                    "destino": destino["nome"],
                    "arquivo": foto["arquivo"],
                    "url": url,
                    "categoria": foto["categoria"],
                }
            )
            linhas.append("      {")
            linhas.append(f'        url: {json.dumps(url, ensure_ascii=False)},')
            linhas.append(
                f'        titulo: {json.dumps(foto["titulo"], ensure_ascii=False)},'
            )
            linhas.append(
                f'        categoria: "{foto["categoria"]}" as Categoria,'
            )
            if registro.get("credito"):
                linhas.append(
                    f'        credito: {json.dumps(registro["credito"], ensure_ascii=False)},'
                )
            if registro.get("licenca"):
                linhas.append(
                    f'        licenca: {json.dumps(registro["licenca"], ensure_ascii=False)},'
                )
            linhas.append("      },")
        linhas.append("    ],")
        primeira = info[destino["fotos"][0]["arquivo"]]["url"].replace("http://", "https://")
        linhas.append(f'    imagem: {json.dumps(primeira, ensure_ascii=False)},')
        linhas.append("  },")

    linhas.append("];")
    linhas.append("")

    SAIDA_TS.parent.mkdir(parents=True, exist_ok=True)
    SAIDA_TS.write_text("\n".join(linhas), encoding="utf-8")
    VERIFICACAO.write_text(
        json.dumps(verificacao, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"OK: {len(destinos)} destinos, {len(verificacao)} fotos")
    print(f"Gravado {SAIDA_TS}")
    print(f"Gravado {VERIFICACAO}")


if __name__ == "__main__":
    main()
