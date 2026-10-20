"""Converte o tileset Kenney "Tiny Town" (CC0) para a paleta do jogo.

Uso:
    python3 tools/kenney_paleta.py <tilemap_packed.png do ZIP>

Gera em assets/temp/kenney-tiny-town/:
    tiles.png            folha 12x11 de tiles 16 px, já na paleta (usada pela cidade)
    tiles_original.png   cópia do original, sem mudança

Cada cor do Kenney vira uma cor da paleta (:root em src/style.css). Os verdes têm dois
mapas: no CHÃO a grama fica escura (como a cidade em código); nos OBJETOS (arbustos,
brotos) ficam um tom acima, para não sumirem na grama.
"""

import pathlib
import shutil
import sys

from PIL import Image

PAL = {
    "ink": "120d1a", "night": "1e1630", "dusk": "2e2347", "violet": "463565",
    "amber": "f2b84b", "amberD": "c97f2a", "bone": "f3e7c9", "boneD": "c9b48f",
    "red": "d0455a", "redD": "8c2236", "green": "4fa35a", "greenD": "2f6b3f",
    "steel": "6f8fc7", "steelL": "c3d6f2", "wood": "7a4a1c", "woodL": "a86a33",
    "felt": "4a1228", "leaf": "8fd16a",
}

BASE = {
    # contornos e sombras
    "3f2631": "ink", "3d212d": "ink", "262b44": "night",
    # terra e madeira
    "eaa56c": "woodL", "eba66c": "woodL", "cf8254": "woodL",
    "bd6c4a": "wood", "be6c49": "wood", "763b36": "felt", "773833": "felt",
    # pedra (cinza vira o roxo do calçamento da cidade)
    "c0cbdc": "violet", "c1ccdd": "violet", "8b9bb4": "dusk", "8c9cb5": "dusk",
    "5a6988": "night", "52607c": "night", "51607d": "night",
    # flores, frutas, fogo
    "fdbe53": "amber", "e38628": "amberD", "c34b35": "redD",
    "e84537": "red", "e94334": "red", "f28462": "red", "ff706d": "red",
    "fcbc8f": "bone", "fec99c": "bone", "ffffff": "bone",
    # água
    "009adc": "steel", "76e4ff": "steelL",
}
VERDE_CHAO = {"84c669": "greenD", "65a556": "dusk", "8bd87d": "green", "479f4a": "dusk"}
VERDE_OBJETO = {"84c669": "green", "65a556": "greenD", "8bd87d": "leaf", "479f4a": "greenD"}

# Tiles de chão (grama, terra e as bordas terra/grama, grama com pedras)
CHAO = {0, 1, 2, 12, 13, 14, 24, 25, 26, 36, 37, 38, 39, 40, 41, 42, 43}

T, COLS = 16, 12
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "temp" / "kenney-tiny-town"


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def main(src):
    im = Image.open(src).convert("RGBA")
    px = im.load()
    faltando = set()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h = f"{r:02x}{g:02x}{b:02x}"
            tile = (y // T) * COLS + x // T
            mapa = {**BASE, **(VERDE_CHAO if tile in CHAO else VERDE_OBJETO)}
            if h not in mapa:
                faltando.add(h)
                continue
            px[x, y] = (*rgb(PAL[mapa[h]]), 255)
    if faltando:
        sys.exit(f"Cores sem mapa: {sorted(faltando)}")
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, OUT / "tiles_original.png")
    im.save(OUT / "tiles.png")
    print(f"ok: {OUT / 'tiles.png'}")


if __name__ == "__main__":
    main(sys.argv[1])
