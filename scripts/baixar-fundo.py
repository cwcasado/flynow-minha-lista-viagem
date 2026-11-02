"""Baixa e otimiza as duas imagens de fundo da seção de contato.

- public/fundo-contato.jpg        (tema noturno) — domínio público
- public/fundo-contato-claro.jpg  (tema claro)   — CC BY-SA 4.0

Uso: python scripts/baixar-fundo.py
"""

import json
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
PUBLIC = RAIZ / "public"
UA = {"User-Agent": "FlyNow-MinhaListaViagem/1.0 (estudo; contato: local)"}

ASSETS = [
    {
        "arquivo": "File:ChicoRasta RevoadaDosGuaras DeltaDoParnaiba Parnaiba PI (40822581422).jpg",
        "destino": "fundo-contato.jpg",
        "largura": 1280,
        "qualidade": None,
    },
    {
        "arquivo": "File:Areia e Mar.jpg",
        "destino": "fundo-contato-claro.jpg",
        "largura": 1280,
        "qualidade": 76,
    },
]


def info_do_arquivo(arquivo: str, largura: int) -> dict:
    consulta = urllib.parse.urlencode(
        {
            "action": "query",
            "titles": arquivo,
            "prop": "imageinfo",
            "iiprop": "url|size|extmetadata",
            "iiurlwidth": str(largura),
            "format": "json",
        }
    )
    pedido = urllib.request.Request(f"https://commons.wikimedia.org/w/api.php?{consulta}", headers=UA)
    with urllib.request.urlopen(pedido, timeout=60) as resposta:
        dados = json.load(resposta)

    pagina = next(iter(dados["query"]["pages"].values()))
    return pagina["imageinfo"][0]


for asset in ASSETS:
    info = info_do_arquivo(asset["arquivo"], asset["largura"])
    url = info.get("thumburl") or info["url"]
    meta = info.get("extmetadata", {})

    pedido = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(pedido, timeout=90) as resposta:
        bruto = resposta.read()

    saida = PUBLIC / asset["destino"]
    if asset["qualidade"] is None:
        saida.write_bytes(bruto)
    else:
        temporario = saida.with_suffix(".tmp.jpg")
        temporario.write_bytes(bruto)
        with Image.open(temporario) as imagem:
            imagem = imagem.convert("RGB")
            if imagem.width > asset["largura"]:
                altura = round(imagem.height * asset["largura"] / imagem.width)
                imagem = imagem.resize((asset["largura"], altura), Image.LANCZOS)
            imagem.save(saida, "JPEG", quality=asset["qualidade"], optimize=True, progressive=True)
        temporario.unlink()

    with Image.open(saida) as imagem:
        dimensoes = f"{imagem.width}x{imagem.height}"

    print(
        f"{saida.name:<26} {dimensoes:<10} {saida.stat().st_size / 1024:7.1f} KB  "
        f"licença: {meta.get('LicenseShortName', {}).get('value', '?')}"
    )
    print(f"   origem: {info.get('descriptionurl')}")
