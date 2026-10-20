# Arte de terceiros (provisória)

Registro de toda arte que **não** é nossa (nem do PixelLab, nem feita em código). Serve para dar crédito
quando a licença pedir e para saber **o que trocar depois** por arte própria.

## Regras
- Licenças aceitas: **CC0** (preferida, sem crédito) e **CC-BY** (dar crédito no jogo).
  Evitar **CC-BY-SA**, **GPL** e qualquer licença que proíba redistribuir os arquivos.
- O repositório é **público** e o GitHub Pages serve os PNGs direto dele → **CraftPix (grátis) não serve**:
  a licença proíbe redistribuir os arquivos originais.
- Arte provisória fica em `assets/temp/<pacote>/`, para ser fácil achar o que falta trocar.
- Ajustar as cores à paleta do jogo com script em `tools/` (original guardado com sufixo `_original`).
  Nunca esticar/encolher: todo pixel com o mesmo tamanho na tela (ver "Estética" no GAME.md).
- Sid e a dona ficam no PixelLab (são a cara do jogo). Terceiros: tiles, objetos, inimigos genéricos.

## Onde procurar
1. **Kenney** (kenney.nl) — tudo CC0, estilo uniforme entre pacotes. Candidatos: *Tiny Town* (16 px, cidade)
   e *Tiny Dungeon* (16 px, masmorra/inimigos).
2. **OpenGameArt** (opengameart.org) — licença varia por arte; filtrar por CC0.
3. **itch.io** — filtrar por "CC0"/"public domain" e ler a licença de cada pacote.

## Em uso
| Arquivo / pasta | Origem (link) | Autor | Licença | Uso no jogo | Trocar por |
|---|---|---|---|---|---|
| `assets/temp/kenney-tiny-town/tiles.png` | [Kenney — Tiny Town](https://kenney.nl/assets/tiny-town) | Kenney | CC0 | Cidade: grama, terra, cercas, arbustos, cogumelos, brotos, colmeia, placa | Tiles da cidade do PixelLab |

Notas do Tiny Town:
- Cores convertidas por `tools/kenney_paleta.py` (original em `tiles_original.png`, licença em `License.txt`).
- **Escala**: o pacote é feito para bonecos de 16 px; os nossos têm ~50 px. Por isso casas, árvores, castelo e
  poço do pacote **não** são usados (ficariam do tamanho de um joelho). Só chão e objetos pequenos.
  Para casas/árvores provisórias, procurar pacotes com bonecos de ~48–64 px (tiles de 32 px).
