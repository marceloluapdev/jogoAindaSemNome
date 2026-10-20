"""Converte peças do LPC (Liberated Pixel Cup, OpenGameArt) para a paleta do jogo.

Uso:
    python3 tools/lpc_paleta.py "<pasta 'LPC Base Assets' do ZIP>"

Gera em assets/temp/lpc/ cada PNG já na paleta, o original com sufixo _original e o CREDITS.TXT.
Licenças e créditos: docs/ASSETS.md.

Cada cor vira a cor mais próxima (no espaço Lab) dentro de um grupo da paleta escolhido por
região da imagem — assim as folhas só viram verdes, o telhado só vira roxo etc. "escurecer"
puxa tudo um pouco para baixo, porque o LPC é de dia e a cidade é de noite.
"""

import pathlib
import shutil
import sys

from PIL import Image

PAL = {
    "ink": "120d1a", "night": "1e1630", "dusk": "2e2347", "violet": "463565", "lilac": "9a7cc0",
    "amber": "f2b84b", "amberD": "c97f2a", "bone": "f3e7c9", "boneD": "c9b48f",
    "red": "d0455a", "redD": "8c2236", "green": "4fa35a", "greenD": "2f6b3f",
    "steel": "6f8fc7", "steelL": "c3d6f2", "wood": "7a4a1c", "woodL": "a86a33",
    "felt": "4a1228", "leaf": "8fd16a",
}
TUDO = list(PAL)
FOLHA = ["ink", "night", "dusk", "greenD", "green", "leaf"]
TRONCO = ["ink", "night", "dusk", "felt", "wood", "woodL"]
TIJOLO = ["ink", "night", "felt", "redD", "red", "boneD", "bone", "wood", "woodL", "dusk", "steel", "steelL", "amber"]
PEDRA = ["ink", "night", "dusk", "violet", "lilac", "boneD", "bone"]
TELHA = ["ink", "night", "dusk", "violet", "lilac"]

# arquivo de saída: (arquivo do LPC, [(região x0, y0, x1, y1) ou None = tudo, grupo, escurecer]...)
PECAS = {
    "treetop.png": ("tiles/treetop.png", [((0, 0, 192, 100), ("degrau", FOLHA), 0), (None, ("degrau", FOLHA), 0)]),
    "trunk.png": ("tiles/trunk.png", [(None, TRONCO, 0.9)]),
    "house.png": ("tiles/house.png", [((0, 0, 288, 96), TIJOLO, 0.9), ((0, 96, 288, 224), TELHA, 0.8)]),
    "house_pedra.png": ("tiles/house.png", [((0, 0, 96, 96), ("degrau", ["ink", "dusk", "violet", "lilac", "boneD", "bone"]), 0), ((96, 0, 288, 96), TIJOLO, 0.9),
                                            ((0, 96, 288, 224), TELHA, 0.7)]),
    "barrel.png": ("tiles/barrel.png", [(None, TRONCO + ["steel", "boneD"], 0.9)]),
    "signs.png": ("tiles/signs.png", [(None, TUDO, 0.9)]),
    "soldier.png": ("sprites/people/soldier.png", [(None, TUDO, 0.95)]),
}

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "temp" / "lpc"


def lab(rgb):
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in rgb)
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


RGB = {k: tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)) for k, v in PAL.items()}
LAB = {k: lab(v) for k, v in RGB.items()}


def nearest(rgb, grupo, escurecer):
    L, a, b = lab(rgb)
    L *= escurecer
    return RGB[min(grupo, key=lambda k: (LAB[k][0] - L) ** 2 + (LAB[k][1] - a) ** 2 + (LAB[k][2] - b) ** 2)]


def luz(rgb):
    return lab(rgb)[0]


def degraus(px, regiao, rampa, w, h):
    """("degrau", rampa): as cores da região, da mais escura à mais clara, são espalhadas pela rampa
    (escura → clara) na mesma ordem — mantém o volume mesmo com poucas cores na paleta."""
    x0, y0, x1, y1 = regiao or (0, 0, w, h)
    cores = sorted({px[x, y][:3] for y in range(y0, y1) for x in range(x0, x1) if px[x, y][3]}, key=luz)
    n = max(1, len(cores) - 1)
    return {c: RGB[rampa[round(i / n * (len(rampa) - 1))]] for i, c in enumerate(cores)}


def converte(src, regras):
    im = Image.open(src).convert("RGBA")
    px = im.load()
    orig = im.copy().load()
    mapas = [degraus(orig, r, g[1], im.width, im.height) if isinstance(g, tuple) else None for r, g, _ in regras]
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            for (regiao, grupo, esc), mapa in zip(regras, mapas):
                if regiao is None or (regiao[0] <= x < regiao[2] and regiao[1] <= y < regiao[3]):
                    px[x, y] = (*(mapa[(r, g, b)] if mapa else nearest((r, g, b), grupo, esc)), a)
                    break
    return im


def main(base):
    base = pathlib.Path(base)
    OUT.mkdir(parents=True, exist_ok=True)
    for nome, (src, regras) in PECAS.items():
        converte(base / src, regras).save(OUT / nome)
        orig = OUT / (pathlib.Path(src).stem + "_original.png")
        if not orig.exists():
            shutil.copyfile(base / src, orig)
    shutil.copyfile(base / "CREDITS.TXT", OUT / "CREDITS.TXT")
    print(f"ok: {OUT}")


if __name__ == "__main__":
    main(sys.argv[1])
