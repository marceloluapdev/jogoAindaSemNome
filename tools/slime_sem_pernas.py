import sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGBA"); px = im.load()
orig = im.copy().load()
C = lambda h: tuple(int(h[i:i+2], 16) for i in (1, 3, 5)) + (255,)
K = C("#000000")
CLEAR = (0, 0, 0, 0)

# 1) apaga as pernas (e o contorno entre elas)
for y in range(36, 48):
    for x in range(9, 39):
        px[x, y] = CLEAR

# 2) fecha o corpo numa curva, repetindo as cores da linha 34 (continuidade)
shape = {36: (12, 35), 37: (13, 34), 38: (15, 32)}
for y, (a, b) in shape.items():
    for x in range(a, b + 1):
        if y == 38 or x in (a, b):
            px[x, y] = K
        else:
            px[x, y] = orig[x, 34] if orig[x, 34][3] else orig[x, 33]
# cantinhos do contorno para a curva ficar suave
px[13, 37] = K; px[34, 37] = K
px[14, 38] = (0, 0, 0, 0); px[33, 38] = (0, 0, 0, 0)
px[14, 37] = K; px[33, 37] = K

# 3) parte de baixo na sombra: troca tons claros (topo das antigas pernas) por escuros
UNDER = [C("#2e4c42"), C("#273942"), C("#2a4442")]
for y in (35, 36, 37):
    for x in range(14, 34):
        r, g, b, a = px[x, y]
        if a and px[x, y] != K and (r + g + b) > 330:
            px[x, y] = UNDER[(x + y) % 3]

im.save(out)
