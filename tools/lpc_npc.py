"""Monta NPCs da cidade com as peças do gerador de personagens LPC, já na paleta do jogo.

Uso:
    python3 tools/lpc_npc.py <clone do Universal-LPC-Spritesheet-Character-Generator>

Basta um clone esparso com sheet_definitions/ e os walk.png das peças listadas abaixo
(git sparse-checkout). Gera em assets/temp/lpc/npc/:
    <nome>_walk.png   folha de caminhada (9 quadros × 4 direções de 64 px, linhas: costas, esq., frente, dir.)
    <nome>.png        um quadro parado, de frente (64×64)
    CREDITOS.txt      autores e licenças de cada peça usada (tirados das definições do gerador)

Cada peça é recolorida com uma "rampa" da paleta: as cores da peça, da mais escura à mais clara,
viram as cores da rampa na mesma ordem (a mais escura vira o contorno).
"""

import json
import pathlib
import sys

from PIL import Image

PAL = {
    "ink": "120d1a", "night": "1e1630", "dusk": "2e2347", "violet": "463565", "lilac": "9a7cc0",
    "amber": "f2b84b", "amberD": "c97f2a", "bone": "f3e7c9", "boneD": "c9b48f",
    "red": "d0455a", "redD": "8c2236", "green": "4fa35a", "greenD": "2f6b3f",
    "steel": "6f8fc7", "steelL": "c3d6f2", "wood": "7a4a1c", "woodL": "a86a33",
    "felt": "4a1228", "leaf": "8fd16a",
}
RGB = {k: tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)) for k, v in PAL.items()}

PELE = ["ink", "wood", "woodL", "boneD", "bone"]
CINZA = ["ink", "dusk", "lilac", "boneD", "bone"]

# NPC: lista de (arquivo em spritesheets/, rampa), de trás para a frente (ordem de desenho)
NPCS = {
    "cartomante": [
        ("body/bodies/female/walk.png", PELE),
        ("head/heads/human/female/walk.png", PELE),
        ("torso/clothes/robe/female/walk/purple.png", ["ink", "felt", "violet", "lilac"]),
        ("hair/long/adult/walk.png", ["ink", "night", "wood", "woodL"]),
        ("facial/earrings/moon/female/walk.png", ["ink", "amberD", "amber", "bone"]),
        ("hat/cloth/hood/adult/walk.png", ["ink", "felt", "redD", "red"]),
    ],
    "padre": [
        ("body/bodies/female/walk.png", PELE),
        ("head/heads/human/male_elderly/walk.png", PELE),
        ("torso/clothes/robe/female/walk/black.png", ["ink", "night", "dusk", "violet"]),
        ("hair/balding/adult/walk.png", CINZA),
    ],
    # Sid na cidade (provisório; no combate e nos retratos continua o do PixelLab)
    "sid": [
        ("body/bodies/male/walk.png", PELE),
        ("head/heads/human/male/walk.png", PELE),
        ("feet/boots/basic/male/walk.png", ["ink", "night", "felt", "wood"]),
        ("legs/pants/male/walk.png", ["ink", "night", "dusk", "violet"]),
        ("torso/clothes/longsleeve/longsleeve/male/walk.png", ["ink", "night", "greenD", "green"]),
        ("torso/jacket/frock/male/walk/brown.png", ["ink", "night", "dusk", "violet", "lilac"]),
        ("hair/long_messy/adult/walk.png", ["ink", "night", "greenD", "green"]),
        ("hat/pirate/cavalier/adult/walk.png", ["ink", "night", "felt", "wood", "woodL"]),
    ],
    "barto": [
        ("body/bodies/male/walk.png", PELE),
        ("head/heads/human/male_plump/walk.png", PELE),
        ("feet/shoes/basic/male/walk.png", ["ink", "night", "wood"]),
        ("legs/pants/male/walk.png", ["ink", "night", "dusk", "violet"]),
        ("torso/clothes/longsleeve/longsleeve/male/walk.png", ["ink", "wood", "boneD", "bone"]),
        ("torso/clothes/vest/male/walk/brown.png", ["ink", "felt", "wood", "woodL"]),
        ("beards/beard/basic/walk.png", CINZA),
        ("hair/balding/adult/walk.png", CINZA),
    ],
}

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "temp" / "lpc" / "npc"


def luz(c):
    r, g, b = c
    return 0.299 * r + 0.587 * g + 0.114 * b


def recolore(im, rampa):
    px = im.load()
    cores = sorted({px[x, y][:3] for y in range(im.height) for x in range(im.width) if px[x, y][3]}, key=luz)
    n = max(1, len(cores) - 1)
    mapa = {c: RGB[rampa[round(i / n * (len(rampa) - 1))]] for i, c in enumerate(cores)}
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (*mapa[(r, g, b)], a)
    return im


def dados_no_chapeu(folha):
    """Dadinhos (3×3, osso com contorno) pendurados na aba do chapéu do Sid, em todos os quadros.
    A aba é achada pela linha mais larga do chapéu em cada quadro; os dados ficam nas pontas."""
    px = folha.load()
    chapeu = RGB["wood"], RGB["woodL"], RGB["felt"]
    for fy in range(0, folha.height, 64):
        for fx in range(0, folha.width, 64):
            melhor = None
            for y in range(fy + 8, fy + 30):
                xs = [x for x in range(fx, fx + 64) if px[x, y][3] and px[x, y][:3] in chapeu]
                if xs and (melhor is None or xs[-1] - xs[0] > melhor[2] - melhor[1]):
                    melhor = (y, xs[0], xs[-1])
            if not melhor:
                continue
            y, x0, x1 = melhor
            for dx, dy in ((x0 + 1, y + 3), (x1 - 3, y + 2)):
                for yy in range(dy - 1, dy + 4):
                    for xx in range(dx - 1, dx + 4):
                        if fx <= xx < fx + 64:
                            inner = dx <= xx < dx + 3 and dy <= yy < dy + 3
                            px[xx, yy] = (*RGB["bone" if inner else "ink"], 255)
                px[dx + 1, dy + 1] = (*RGB["ink"], 255)       # o pontinho do dado
                px[dx + 1, dy - 2] = (*RGB["ink"], 255)       # cordinha


def creditos(base, usados):
    """Procura nas definições do gerador o crédito de cada pasta usada."""
    achados = {}
    for f in (base / "sheet_definitions").rglob("*.json"):
        try:
            d = json.loads(f.read_text())
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        for c in d.get("credits", []) if isinstance(d, dict) else []:
            pasta = c.get("file", "").rstrip("/")
            for u in usados:
                if pasta and u.startswith(pasta + "/") and len(pasta) > len(achados.get(u, ({},))[0].get("file", "")):
                    achados[u] = (c,)
    linhas = []
    for u in usados:
        if u in achados:
            c = achados[u][0]
            linhas.append(f"{u}\n  autores: {', '.join(c.get('authors', []))}\n  licenças: {', '.join(c.get('licenses', []))}\n"
                          + "".join(f"  {url}\n" for url in c.get("urls", [])))
        else:
            linhas.append(f"{u}\n  (crédito não encontrado nas definições — conferir no gerador)\n")
    return "\n".join(linhas)


def main(base):
    base = pathlib.Path(base)
    OUT.mkdir(parents=True, exist_ok=True)
    usados = []
    for nome, pecas in NPCS.items():
        folha = None
        for arq, rampa in pecas:
            src = base / "spritesheets" / arq
            if not src.exists():
                sys.exit(f"falta {src}")
            im = recolore(Image.open(src).convert("RGBA"), rampa)
            folha = im if folha is None else Image.alpha_composite(folha, im)
            if arq not in usados:
                usados.append(arq)
        if nome == "sid":
            dados_no_chapeu(folha)
        folha.save(OUT / f"{nome}_walk.png")
        folha.crop((0, 128, 64, 192)).save(OUT / f"{nome}.png")      # linha 2 = de frente, quadro parado
        print("ok", nome)
    (OUT / "CREDITOS.txt").write_text("Peças do Universal LPC Spritesheet Character Generator\n"
                                      "https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator\n\n"
                                      + creditos(base, usados))


if __name__ == "__main__":
    main(sys.argv[1])
