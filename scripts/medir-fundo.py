"""Mede o contraste real do texto sobre o fundo (foto + gradiente).

Simula o gradiente CSS pixel a pixel na imagem usada pela seção de contato,
nos dois temas e nos dois layouts (desktop/mobile). Saída: pior contraste
encontrado na área onde existe texto.

Uso: python scripts/medir-fundo.py
"""

from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
PUBLIC = RAIZ / "public"


def alfa(t: float, stops: list[tuple[float, float]]) -> float:
    for (t0, a0), (t1, a1) in zip(stops, stops[1:]):
        if t <= t1:
            return a0 + (a1 - a0) * (t - t0) / (t1 - t0)
    return stops[-1][1]


def luminancia(rgb: tuple[float, float, float]) -> float:
    def linear(c: float) -> float:
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (linear(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(cor1, cor2) -> float:
    l1, l2 = sorted((luminancia(cor1), luminancia(cor2)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)


CENARIOS = [
    {
        "rotulo": "CLARO · desktop (horizontal, onde fica o texto)",
        "imagem": "fundo-contato-claro.jpg",
        "overlay": (250, 252, 254),
        "stops": [(0.0, 0.97), (0.50, 0.96), (0.72, 0.78), (1.0, 0.34)],
        "vertical": False,
        "fracao": 0.52,
        "cores": {
            "titulo/texto #2d3748": (45, 55, 72),
            "suave #4a5568": (74, 85, 104),
            "erro #9b2c2c": (155, 44, 44),
        },
    },
    {
        "rotulo": "CLARO · mobile (vertical, largura toda)",
        "imagem": "fundo-contato-claro.jpg",
        "overlay": (250, 252, 254),
        "stops": [(0.0, 0.97), (0.55, 0.96), (1.0, 0.88)],
        "vertical": True,
        "fracao": 1.0,
        "cores": {
            "titulo/texto #2d3748": (45, 55, 72),
            "suave #4a5568": (74, 85, 104),
            "erro #9b2c2c": (155, 44, 44),
        },
    },
    {
        "rotulo": "NOTURNO · desktop (horizontal)",
        "imagem": "fundo-contato.jpg",
        "overlay": (10, 20, 32),
        "stops": [(0.0, 0.95), (0.42, 0.90), (0.72, 0.72), (1.0, 0.55)],
        "vertical": False,
        "fracao": 0.52,
        "cores": {
            "titulo #ffffff": (255, 255, 255),
            "texto #eef3fa": (238, 243, 250),
            "suave #cbd5e1": (203, 213, 225),
            "erro #fecaca": (254, 202, 202),
        },
    },
    {
        "rotulo": "NOTURNO · mobile (vertical)",
        "imagem": "fundo-contato.jpg",
        "overlay": (10, 20, 32),
        "stops": [(0.0, 0.95), (0.60, 0.93), (1.0, 0.78)],
        "vertical": True,
        "fracao": 1.0,
        "cores": {
            "titulo #ffffff": (255, 255, 255),
            "texto #eef3fa": (238, 243, 250),
            "suave #cbd5e1": (203, 213, 225),
            "erro #fecaca": (254, 202, 202),
        },
    },
]


for cenario in CENARIOS:
    imagem = Image.open(PUBLIC / cenario["imagem"]).convert("RGB")
    largura, altura = imagem.size
    pixels = imagem.load()
    piores = {nome: 99.0 for nome in cenario["cores"]}

    passo = 3
    limite = int(largura * cenario["fracao"])
    for y in range(0, altura, passo):
        for x in range(0, limite, passo):
            t = (y / altura) if cenario["vertical"] else (x / largura)
            a = alfa(t, cenario["stops"])
            r, g, b = pixels[x, y]
            fundo = tuple(
                a * cenario["overlay"][i] + (1 - a) * canal for i, canal in enumerate((r, g, b))
            )
            for nome, cor in cenario["cores"].items():
                razao = contraste(cor, fundo)
                if razao < piores[nome]:
                    piores[nome] = razao

    print(f"\n{cenario['rotulo']}")
    for nome, razao in piores.items():
        status = "AA ok" if razao >= 4.5 else "REPROVA"
        print(f"  {nome:<22} {razao:5.2f}:1  {status}")
