// Ícones em pixel art para os botões, desenhados como grades de texto
// (cada letra é uma cor da paleta) e convertidos em SVG nítido.
//
// Uso no HTML: <span class="ico" data-icon="dado"></span>

const ICON_COLORS = {
  k: "#120d1a", b: "#f3e7c9", B: "#c9b48f",          // contorno, osso
  s: "#c3d6f2", S: "#6f8fc7",                        // aço claro / escuro
  a: "#f2b84b", A: "#c97f2a",                        // âmbar
  w: "#a86a33", W: "#7a4a1c",                        // couro
  g: "#8fd16a",                                      // verde da maldição
};

const ICONS = {
  // Dado (face 5)
  dado: [
    ".kkkkkkkkk.",
    "kbbbbbbbbbk",
    "kbkkbbbkkbk",
    "kbkkbbbkkbk",
    "kbbbbbbbbbk",
    "kbbbbkbbbbk",
    "kbbbbbbbbbk",
    "kbkkbbbkkbk",
    "kbkkbbbkkbk",
    "kBBBBBBBBBk",
    ".kkkkkkkkk.",
  ],
  // Espada na diagonal
  espada: [
    "........kkk",
    ".......kssk",
    "......kssSk",
    ".....kssSk.",
    "....kssSk..",
    ".k.kssSk...",
    ".kkkSSk....",
    "..kaak.....",
    ".kakkkk....",
    "kAk..k.....",
    "kk.........",
  ],
  // Escudo com cruz âmbar
  escudo: [
    ".kkkkkkkkk.",
    "kSssSaSssSk",
    "kSssSaSssSk",
    "kaaaaaaaaak",
    "kSssSaSssSk",
    "kSssSaSssSk",
    ".kSssaSssk.",
    ".kSSsaSSSk.",
    "..kSSaSSk..",
    "...kSaSk...",
    "....kkk....",
  ],
  // Energia se concentrando num ponto (concentrar: guardar a defesa)
  foco: [
    "....kkk....",
    "..kkgggkk..",
    ".kgg...ggk.",
    ".kg.kkk.gk.",
    "kg.kgggk.gk",
    "kg.kgagk.gk",
    "kg.kgggk.gk",
    ".kg.kkk.gk.",
    ".kgg...ggk.",
    "..kkgggkk..",
    "....kkk....",
  ],
  // Bolsinha de couro (reserva para uso futuro)
  bolsa: [
    "....kkk....",
    "...kaaak...",
    "....kak....",
    "..kkwwwkk..",
    ".kwwwwwwwk.",
    "kwwgwwwwwwk",
    "kwwwwwwwwwk",
    "kwwwwwwgwwk",
    "kWwwwwwwwWk",
    ".kWWWWWWWk.",
    "..kkkkkkk..",
  ],
};

// Dado branco com uma mini caveira vermelha no lugar do 1 (Sem sorte: a pior jogada)
ICONS.semsorte = [
  ".kkkkkkkkk.",
  "kbbbbbbbbbk",
  "kbbbrrrbbbk",
  "kbbrrrrrbbk",
  "kbbrkrkrbbk",
  "kbbrrrrrbbk",
  "kbbbrkrbbbk",
  "kbbbrbrbbbk",
  "kbbbbbbbbbk",
  "kmmmmmmmmmk",
  ".kkkkkkkkk.",
];
ICON_COLORS.m = "#5a4a38";
ICON_COLORS.r = "#d0455a";

// Raio verde (Carga da Maldição)
ICONS.carga = [
  "......kkk..",
  ".....kggk..",
  "....kggk...",
  "...kggk....",
  "..kggkkkk..",
  ".kgggggggk.",
  "..kkkkggk..",
  "....kggk...",
  "...kggk....",
  "..kggk.....",
  "..kkk......",
];

// Dado da maldição (verde) com qualquer face — usado na Aposta Final
const DIE_PIPS = {
  1: [[5, 5]], 2: [[2, 2], [8, 8]], 3: [[2, 2], [5, 5], [8, 8]],
  4: [[2, 2], [8, 2], [2, 8], [8, 8]], 5: [[2, 2], [8, 2], [5, 5], [2, 8], [8, 8]],
  6: [[2, 2], [8, 2], [2, 5], [8, 5], [2, 8], [8, 8]],
};
function cursedDie(value) {
  const g = Array.from({ length: 11 }, (_, y) =>
    Array.from({ length: 11 }, (_, x) => {
      const edge = x === 0 || y === 0 || x === 10 || y === 10;
      const corner = (x === 0 || x === 10) && (y === 0 || y === 10);
      return corner ? "." : edge ? "k" : y === 9 ? "D" : "G";
    }));
  DIE_PIPS[value].forEach(([px, py]) => {
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = Math.min(9, px - 1 + dx + (px === 5 ? 0 : 0)), y = Math.min(9, py - 1 + dy);
      g[y][x] = "k";
    }
  });
  return g.map(r => r.join(""));
}
ICON_COLORS.G = "#8fd16a";
ICON_COLORS.D = "#4fa35a";
ICONS.aposta = cursedDie(6);

function iconSVG(name, rowsOverride) {
  const rows = rowsOverride || ICONS[name];
  const w = rows[0].length, h = rows.length;
  let rects = "";
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ICON_COLORS[ch]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${ICON_COLORS[ch]}"/>`;
    }));
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

document.querySelectorAll("[data-icon]").forEach(el => (el.innerHTML = iconSVG(el.dataset.icon)));
