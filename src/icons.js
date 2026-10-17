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

function iconSVG(name) {
  const rows = ICONS[name];
  const w = rows[0].length, h = rows.length;
  let rects = "";
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ICON_COLORS[ch]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${ICON_COLORS[ch]}"/>`;
    }));
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

document.querySelectorAll("[data-icon]").forEach(el => (el.innerHTML = iconSVG(el.dataset.icon)));
