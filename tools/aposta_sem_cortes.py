"""
Remendo das poses "flutuando" (Aposta Final): o PixelLab gerou num canvas 64x64
pequeno demais, e dados/aura que orbitam o personagem saíram cortados na borda.

Para cada quadro:
  1) apaga partes soltas (componentes conectados) que encostam na borda — os dados cortados;
  2) na peça principal, apaga pixels de aura verde a até MARGEM px da borda
     (mantém chapéu, roupa e corpo).
Uso: python3 tools/aposta_sem_cortes.py assets/hero/aposta/   (originais em aposta/_original/)
"""
import os, shutil, sys
from PIL import Image

MARGEM = 4


def verde(c):
    r, g, b, a = c
    return a and g > r + 25 and g > b + 10


def componentes(px, w, h):
    seen, comps = set(), []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] and (x, y) not in seen:
                pilha, pts = [(x, y)], []
                seen.add((x, y))
                while pilha:
                    a, b = pilha.pop()
                    pts.append((a, b))
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        n = (a + dx, b + dy)
                        if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen and px[n][3]:
                            seen.add(n)
                            pilha.append(n)
                comps.append(pts)
    comps.sort(key=len, reverse=True)
    return comps


def remendar(caminho):
    im = Image.open(caminho).convert("RGBA")
    px = im.load()
    w, h = im.size
    dist = lambda x, y: min(x, y, w - 1 - x, h - 1 - y)
    comps = componentes(px, w, h)
    principal = set(comps[0])
    borda = lambda p: p[0] in (0, w - 1) or p[1] in (0, h - 1)

    # 1) partes soltas encostando na borda (dados/aura cortados e separados)
    for pts in comps[1:]:
        if any(borda(p) for p in pts):
            for p in pts:
                px[p] = (0, 0, 0, 0)

    # 2) na peça principal: segue o verde a partir da borda (dado cortado + aura cortada),
    #    só até ALCANCE px da borda, para não comer a aura inteira
    ALCANCE = 16
    pilha = [(x, y) for (x, y) in principal if dist(x, y) < MARGEM and verde(px[x, y])]
    apagar = set(pilha)
    while pilha:
        a, b = pilha.pop()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            n = (a + dx, b + dy)
            if n in principal and n not in apagar and dist(*n) <= ALCANCE and verde(px[n]):
                apagar.add(n)
                pilha.append(n)
    for p in apagar:
        px[p] = (0, 0, 0, 0)

    # 3) restos que se soltaram da peça principal (contornos/pips do dado apagado)
    #    e pontinhos soltos (< 12 px): partículas da aura que parecem pixels aleatórios
    for pts in componentes(px, w, h)[1:]:
        if (len(pts) < 60 and set(pts) <= principal) or len(pts) < 12:
            for p in pts:
                px[p] = (0, 0, 0, 0)
    # 4) pixel verde isolado no meio do corpo/chapéu: pinta com a cor dos vizinhos
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if not verde(px[x, y]):
                continue
            viz = [px[x + dx, y + dy] for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy]
            if sum(1 for c in viz if verde(c)) == 0 and all(c[3] for c in viz):
                cores = sorted(viz, key=lambda c: c[0] + c[1] + c[2])
                px[x, y] = cores[len(cores) // 2]
    im.save(caminho)


if __name__ == "__main__":
    pasta = sys.argv[1]
    orig = os.path.join(pasta, "_original")
    os.makedirs(orig, exist_ok=True)
    for nome in sorted(os.listdir(pasta)):
        if not nome.endswith(".png"):
            continue
        src = os.path.join(pasta, nome)
        bak = os.path.join(orig, nome)
        if not os.path.exists(bak):
            shutil.copy(src, bak)
        shutil.copy(bak, src)                  # sempre parte do original
        remendar(src)
        print("ok", nome)
