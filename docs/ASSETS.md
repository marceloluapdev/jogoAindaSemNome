# Arte de terceiros (provisória)

Registro de toda arte que **não** é nossa (nem do PixelLab, nem feita em código). Serve para dar crédito
quando a licença pedir e para saber **o que trocar depois** por arte própria.

## Regras
- Licenças aceitas: **CC0** (preferida, sem crédito), **CC-BY / OGA-BY** (dar crédito) e, para arte provisória,
  **CC-BY-SA** (crédito + a arte modificada, ex. recolorida, fica sob a mesma licença; o repo já é público e o
  código não é afetado). Evitar qualquer licença que proíba redistribuir os arquivos.
- Crédito: listado aqui e no `CREDITS.TXT` de cada pacote; quando o jogo tiver tela de créditos, levar para lá.
- O repositório é **público** e o GitHub Pages serve os PNGs direto dele → **CraftPix (grátis) não serve**:
  a licença proíbe redistribuir os arquivos originais.
- Arte provisória fica em `assets/temp/<pacote>/`, para ser fácil achar o que falta trocar.
- Ajustar as cores à paleta do jogo com script em `tools/` (original guardado com sufixo `_original`).
  Nunca esticar/encolher: todo pixel com o mesmo tamanho na tela (ver "Estética" no GAME.md).
- Pode usar personagens de terceiros também (NPCs, inimigos); se precisar, trocamos depois pelo PixelLab.
  O tamanho dos bonecos não precisa bater por enquanto.

## Onde procurar
1. **Kenney** (kenney.nl) — tudo CC0, estilo uniforme entre pacotes. Candidatos: *Tiny Town* (16 px, cidade)
   e *Tiny Dungeon* (16 px, masmorra/inimigos).
2. **OpenGameArt** (opengameart.org) — licença varia por arte; filtrar por CC0.
3. **itch.io** — filtrar por "CC0"/"public domain" e ler a licença de cada pacote.
4. **LPC** (Liberated Pixel Cup, no OpenGameArt) — tiles de 32 px e bonecos de 64 px, muita coisa da comunidade
   no mesmo estilo (casas, interiores, monstros, roupas para os bonecos).

## Em uso
| Arquivo / pasta | Origem (link) | Autor | Licença | Uso no jogo | Trocar por |
|---|---|---|---|---|---|
| `assets/temp/kenney-tiny-town/tiles.png` | [Kenney — Tiny Town](https://kenney.nl/assets/tiny-town) | Kenney | CC0 | Cidade: grama, terra, cercas, arbustos, cogumelos, brotos, colmeia, placa | Tiles da cidade do PixelLab |
| `assets/temp/lpc/house*.png`, `treetop.png`, `trunk.png`, `barrel.png`, `signs.png` | [LPC Base Assets](https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles) | Lanea Zimmerman (Sharm) | CC-BY-SA 3.0 / GPL 3.0; também OGA-BY 3.0 | Cidade: casas (montadas com o kit), árvores, barris, placas da taverna e do Bartô | Casas/árvores do PixelLab ou desenho próprio |
| `assets/temp/lpc/soldier.png` | idem | Manuel Riecke (MrBeast) | CC-BY-SA 3.0 / GPL 3.0 | Cidade: guarda do portão | Guarda do PixelLab |
| `assets/temp/lpc/monstros/*.png` | idem | Charles Sanchez (CharlesGabriel) | CC-BY-SA 3.0 / GPL 3.0 | Lutas: morcego, cobra, larva, vespa, assombração, olho, minhocão, flor devoradora, rei abóbora (1 quadro de frente) | Inimigos do PixelLab |
| `assets/temp/lpc/npc/*.png` | [Gerador de personagens LPC](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) | vários (lista por peça em `npc/CREDITOS.txt`) | OGA-BY 3.0 / CC-BY-SA 3.0 / GPL 3.0 (por peça) | Cidade: Bartô, cartomante e padre (montados por `tools/lpc_npc.py`, com folha de caminhada); `sid_walk.png` = Sid andando na cidade | NPCs do PixelLab |

Notas do LPC:
- Cores convertidas por `tools/lpc_paleta.py` (originais com sufixo `_original`, créditos em `CREDITS.TXT`).
  Folhas e a pedra da capela usam "degraus" (a ordem de claro/escuro do original vira a rampa da paleta).
- Monstros: só 1 quadro (de frente); o ZIP tem 3 quadros por direção, dá para animar depois. O slime do LPC
  não é usado (temos o lodo do PixelLab).
- NPCs: montados por script direto do repositório do gerador (clone esparso no GitHub), sem usar o site.
  Para um NPC novo, basta listar as peças e as rampas de cor em `tools/lpc_npc.py`.
- Ainda não usados, mas no ZIP: móveis/interiores (taverna por dentro), castelo, água, pontes, baús.

Notas do Tiny Town:
- Cores convertidas por `tools/kenney_paleta.py` (original em `tiles_original.png`, licença em `License.txt`).
- **Escala**: o pacote é feito para bonecos de 16 px; os nossos têm ~50 px. Por isso casas, árvores, castelo e
  poço do pacote **não** são usados (ficariam do tamanho de um joelho). Só chão e objetos pequenos.
  Para casas/árvores provisórias, procurar pacotes com bonecos de ~48–64 px (tiles de 32 px).
