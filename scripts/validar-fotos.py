"""Verifica se todas as URLs de fotos respondem (GET com Range de 1 KB).

Uso:
    python scripts/validar-fotos.py
"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import commons_lib as lib  # noqa: E402

ENTRADA = Path(__file__).with_name("verificacao-fotos.json")
PAUSA = 1.5

fotos = json.loads(ENTRADA.read_text(encoding="utf-8"))
contagem: Counter[str] = Counter()
falhas = []

for i, foto in enumerate(fotos, start=1):
    req = urllib.request.Request(
        foto["url"],
        headers={"User-Agent": lib.USER_AGENT, "Range": "bytes=0-1024"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resposta:
            status = resposta.status
            tipo = resposta.headers.get("Content-Type", "?")
    except urllib.error.HTTPError as erro:
        status = erro.code
        tipo = erro.headers.get("Content-Type", "?") if erro.headers else "?"
    except Exception as erro:  # noqa: BLE001
        status = 0
        tipo = type(erro).__name__

    contagem[status] += 1
    marca = "OK " if status in (200, 206) else "!! "
    if status not in (200, 206):
        falhas.append(foto)
    print(
        f"{marca}{i:02d}/{len(fotos)} {status} {tipo:12s} "
        f"{foto['destino']} — {foto['categoria']} ({Path(foto['arquivo']).name})",
        flush=True,
    )
    time.sleep(PAUSA)

print("\nResumo:", dict(contagem))
if falhas:
    print("\nFALHAS:")
    for foto in falhas:
        print("  -", foto["destino"], "|", foto["arquivo"])
    raise SystemExit(1)
print("Todas as fotos responderam.")
