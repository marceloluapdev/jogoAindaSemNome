// Cidade: vista de cima em 3/4 (estilo EarthBound), tocar para andar (com desvio de obstáculos).
//
// Áreas: praça central (fonte), taverna e casa do Bartô ao norte, rua do mercado com a tenda da
// cartomante a oeste, capela a leste, portão (fechado) ao sul e o portal do azar num beco.
// Provisório até chegar a arte do PixelLab (ver docs/ASSETS.md): casas, árvores, barris e guarda do LPC;
// chão e objetos pequenos do Kenney "Tiny Town"; o resto em código. Tudo na paleta do jogo.
//
// - Portal do azar: RUN_FIGHTS lutas (o combate de sempre); vencendo ou perdendo, volta à cidade.
// - Perder: "a Mesa reembaralha". Cada derrota afrouxa a maldição no amor: a dona fica menos grossa.
// - Falas pelo mesmo motor do tutorial (story.js: playScene). Lore espalhada entre as pessoas (HISTORIA.md).
//
// Escala: a cidade usa pixels menores na tela que a luta (zoom 1 no celular), para os personagens
// ocuparem menos espaço e caber mais cidade — os sprites nunca são esticados.

const CITY_ON = !window.TEST_MODE || window.TEST_CITY;
const RUN_FIGHTS = 3;
const DEFEATS_KEY = "jasn.derrotas";

const CW = 640, CH = 760;          // tamanho do mundo (pixels lógicos)
const cityEl = document.createElement("div");
cityEl.id = "city";
cityEl.hidden = true;
cityEl.innerHTML = `<canvas class="px"></canvas><p class="city-hint">Toque para andar</p>`;
document.body.appendChild(cityEl);
const cityCanvas = cityEl.querySelector("canvas");
const cx = cityCanvas.getContext("2d");
let viewW = 360, viewH = 640, viewK = 1;

const C = {
  ink: "#120d1a", night: "#1e1630", dusk: "#2e2347", violet: "#463565", lilac: "#9a7cc0",
  amber: "#f2b84b", amberD: "#c97f2a", bone: "#f3e7c9", boneD: "#c9b48f", red: "#d0455a", redD: "#8c2236",
  green: "#4fa35a", greenD: "#2f6b3f", steel: "#6f8fc7", steelL: "#c3d6f2", wood: "#7a4a1c", woodL: "#a86a33",
  felt: "#4a1228", leaf: "#8fd16a",
};

// Aleatório com semente (o mapa sai igual toda vez)
function seeded(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function makeCanvas(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d");
  draw((col, x, y, ww = 1, hh = 1) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), ww, hh); }, g);
  return c;
}

// ---------- Imagens dos personagens ----------
function cityImage(src) { const i = new Image(); i.src = src; return i; }
const IMG = {
  dona_south: cityImage("assets/npc/dona/south.png"),
  sid_front: cityImage("assets/hero/apostador_frente.png"),
  sid_back: cityImage("assets/hero/apostador_costas.png"),
};

// Pessoas provisórias (até chegarem as do PixelLab), no mesmo tamanho de pixel
function makePerson(o) {
  return makeCanvas(30, 54, p => {
    const k = C.ink;
    // sombra no chão
    p("rgba(18,13,26,0.45)", 6, 51, 18, 3);
    // pernas / barra da roupa
    if (o.robe) { p(k, 6, 30, 18, 23); p(o.coat, 7, 31, 16, 21); p(o.coatL || o.coat, 7, 31, 2, 21); p(k, 8, 50, 6, 3); p(k, 16, 50, 6, 3); }
    else { p(k, 9, 40, 5, 13); p(o.pants, 10, 40, 3, 11); p(k, 16, 40, 5, 13); p(o.pants, 17, 40, 3, 11); p(k, 8, 50, 7, 3); p(k, 15, 50, 7, 3); }
    // tronco
    p(k, 6, 23, 18, 19); p(o.coat, 7, 24, 16, 17); p(o.coatL || o.coat, 7, 24, 2, 17);
    if (o.belt) { p(k, 7, 34, 16, 2); o.belt.forEach(([x, c]) => { p(k, x - 1, 35, 4, 5); p(c, x, 36, 2, 3); }); }
    if (o.collar) p(o.collar, 12, 24, 6, 3);
    // braços
    p(k, 3, 25, 5, 13); p(o.coat, 4, 26, 3, 11); p(k, 22, 25, 5, 13); p(o.coat, 23, 26, 3, 11);
    p(o.skin, 4, 36, 3, 2); p(o.skin, 23, 36, 3, 2);
    if (o.item) o.item(p);
    // cabeça
    p(k, 8, 6, 14, 15); p(o.skin, 9, 7, 12, 13); p(o.skinD, 9, 17, 12, 3);
    if (o.hair) { p(k, 7, 4, 16, 7); p(o.hair, 8, 5, 14, 5); if (o.longHair) { p(k, 6, 8, 4, 16); p(o.hair, 7, 8, 2, 15); p(k, 20, 8, 4, 16); p(o.hair, 21, 8, 2, 15); } }
    else { p(C.bone, 11, 7, 3, 2); }
    if (o.hood) { p(k, 6, 3, 18, 11); p(o.hood, 7, 4, 16, 9); p(k, 6, 9, 3, 15); p(o.hood, 7, 9, 2, 14); p(k, 21, 9, 3, 15); p(o.hood, 21, 9, 2, 14); }
    if (o.helmet) { p(k, 7, 3, 16, 8); p(C.steel, 8, 4, 14, 6); p(C.steelL, 9, 4, 8, 1); p(k, 14, 8, 2, 4); }
    if (o.beard) { p(k, 8, 15, 14, 11); p(o.beard, 9, 16, 12, 9); p(C.boneD, 9, 22, 12, 3); }
    p(k, 11, 11, 2, 3); p(k, 17, 11, 2, 3);
    if (o.nose) p(o.nose, 14, 13, 2, 2);
    if (o.earring) { p(C.amber, 8, 15, 1, 2); p(C.amber, 21, 15, 1, 2); }
  });
}
const PEOPLE = {
  bebado: makePerson({ skin: C.boneD, skinD: C.woodL, coat: C.wood, coatL: C.woodL, pants: C.dusk, beard: C.bone, nose: C.red,
    belt: [[9, C.green], [13, C.steel], [19, C.red]],
    item: p => { p(C.ink, 24, 33, 6, 7); p(C.boneD, 25, 34, 4, 5); p(C.amber, 25, 34, 4, 1); } }),
  cartomante: makePerson({ skin: C.boneD, skinD: C.woodL, coat: C.violet, coatL: C.lilac, robe: true, hood: C.felt, earring: true,
    item: p => { p(C.ink, 11, 30, 8, 6); p(C.bone, 12, 31, 3, 4); p(C.amber, 15, 31, 3, 4); } }),
  padre: makePerson({ skin: C.boneD, skinD: C.woodL, coat: C.night, coatL: C.dusk, robe: true, collar: C.bone, hair: C.boneD,
    item: p => { p(C.amber, 14, 28, 2, 6); p(C.amber, 12, 30, 6, 2); } }),
  guarda: makePerson({ skin: C.boneD, skinD: C.woodL, coat: C.steel, coatL: C.steelL, pants: C.dusk, helmet: true,
    item: p => { p(C.ink, 26, 2, 3, 50); p(C.wood, 27, 4, 1, 47); p(C.steelL, 26, 0, 3, 4); } }),
};

// ---------- Construções (pré-desenhadas) ----------
// Vista 3/4: telhado em cima, parede da frente embaixo. base = linha do chão (onde a parede encosta).
function makeBuilding(o, doorX) {
  const W = o.w, RH = o.roofH, WH = o.wallH, H = RH + WH + 4;
  const canvas = makeCanvas(W + 8, H, (p, g) => {
    const x0 = 4, wy = RH;     // parede começa embaixo do telhado
    // sombra no chão
    p("rgba(18,13,26,0.5)", x0 + 2, H - 4, W, 4);
    // parede
    p(C.ink, x0, wy - 1, W, WH + 1);
    if (o.wall === "stone") {
      p(C.boneD, x0 + 1, wy, W - 2, WH - 1);
      for (let y = wy + 2, r = 0; y < wy + WH - 2; y += 6, r++)
        for (let x = x0 + 1 + (r % 2) * 5; x < x0 + W - 2; x += 10) { p(C.wood, x, y + 4, 9, 1); p(C.bone, x, y, 8, 1); p(C.wood, x + 9, y, 1, 5); }
    } else if (o.wall === "plaster") {
      p(C.bone, x0 + 1, wy, W - 2, WH - 1);
      p(C.boneD, x0 + 1, wy + WH - 6, W - 2, 5);
      for (let x = x0 + 1; x < x0 + W; x += 16) p(C.wood, x, wy, 3, WH - 1);           // vigas
      p(C.wood, x0 + 1, wy, W - 2, 3); p(C.wood, x0 + 1, wy + Math.floor(WH / 2), W - 2, 2);
    } else {
      p(C.wood, x0 + 1, wy, W - 2, WH - 1);
      for (let x = x0 + 4; x < x0 + W - 2; x += 7) { p(C.night, x, wy, 1, WH - 1); p(C.woodL, x + 1, wy, 1, WH - 1); }
    }
    p("rgba(18,13,26,0.45)", x0 + 1, wy, W - 2, 4);                     // sombra do beiral
    // janelas
    (o.windows || []).forEach(wx => {
      const x = x0 + wx, y = wy + 8;
      p(C.ink, x - 1, y - 1, 14, 14); p(C.wood, x, y, 12, 12);
      p(o.dark ? C.night : C.amber, x + 1, y + 1, 10, 10); if (!o.dark) { p(C.bone, x + 2, y + 2, 3, 3); }
      p(C.wood, x + 5, y + 1, 2, 10); p(C.wood, x + 1, y + 5, 10, 2);
      p(C.woodL, x - 2, y + 12, 16, 2); p(C.ink, x - 2, y + 14, 16, 1);
      if (o.flowers) { p(C.greenD, x - 1, y + 10, 14, 3); p(C.red, x + 1, y + 10, 2, 2); p(C.amber, x + 6, y + 10, 2, 2); p(C.lilac, x + 10, y + 10, 2, 2); }
    });
    // porta
    if (o.door !== undefined) {
      const dw = o.doorW || 16, x = x0 + o.door, y = wy + WH - 24;
      p(C.ink, x - 2, y - 2, dw + 4, 26); p(o.doorFrame || C.woodL, x - 1, y - 1, dw + 2, 25);
      p(o.arch ? C.night : C.wood, x, y, dw, 24);
      if (!o.arch) { for (let i = x + 3; i < x + dw; i += 4) p(C.night, i, y, 1, 24); p(C.amber, x + dw - 4, y + 12, 2, 2); }
      p(C.boneD, x - 3, wy + WH, dw + 6, 2); p(C.ink, x - 3, wy + WH + 2, dw + 6, 1);   // degrau
    }
    // placa
    if (o.sign) {
      const sx = x0 + o.sign.x, sy = wy + 6;
      p(C.ink, sx - 1, sy - 1, o.sign.w + 2, 13); p(C.woodL, sx, sy, o.sign.w, 11); p(C.wood, sx, sy + 9, o.sign.w, 2);
      g.fillStyle = C.ink; g.font = "8px monospace"; g.textBaseline = "top"; g.fillText(o.sign.text, sx + 3, sy + 2);
    }
    // telhado
    const rx = x0 - 4, rw = W + 8;
    p(C.ink, rx, 0, rw, RH + 1);
    for (let y = 1, row = 0; y < RH; y += 5, row++) {
      p(row % 2 ? o.roof : o.roofD, rx + 1, y, rw - 2, 5);
      for (let x = rx + 1 + (row % 2) * 4; x < rx + rw - 2; x += 8) p(o.roofD, x, y + 4, 7, 1);
      p(o.roofL, rx + 1, y, rw - 2, 1);
    }
    p(o.roofL, rx + 1, 1, rw - 2, 2);                                     // cumeeira
    p(C.ink, rx, RH, rw, 1);
    if (o.chimney !== undefined) { const c = rx + o.chimney; p(C.ink, c - 1, 0, 12, RH - 6); p(C.boneD, c, 1, 10, RH - 8); p(C.wood, c, 1, 10, 2); }
    if (o.cross) { const c = x0 + W / 2 - 3; p(C.ink, c - 1, 0, 8, 2); p(C.amber, c + 2, 2, 2, 12); p(C.amber, c, 5, 6, 2); }
  });
  return { canvas, w: W + 8, h: H, ox: 4, wallTop: RH, doorX: doorX ?? 4 + (o.door || 0) + (o.doorW || 16) / 2 };
}

const B = {
  taverna: makeBuilding({ w: 176, wallH: 64, roofH: 44, wall: "wood", roof: C.red, roofD: C.redD, roofL: "#e0738a".replace("e0738a", "d0455a"),
    windows: [14, 40, 124, 150], door: 80, doorW: 18, sign: { x: 58, w: 62, text: "TAVERNA" }, chimney: 20, flowers: true }, 4 + 80 + 9),
  bartô: makeBuilding({ w: 92, wallH: 52, roofH: 34, wall: "plaster", roof: C.violet, roofD: C.dusk, roofL: C.lilac,
    windows: [12, 66], door: 40, chimney: 70 }),
  capela: makeBuilding({ w: 96, wallH: 70, roofH: 40, wall: "stone", roof: C.dusk, roofD: C.night, roofL: C.violet,
    windows: [12, 72], door: 38, doorW: 20, arch: true, cross: true }),
  casaO: makeBuilding({ w: 80, wallH: 48, roofH: 30, wall: "plaster", roof: C.greenD, roofD: C.dusk, roofL: C.green, windows: [10, 56], door: 32, dark: true }),
  casaL: makeBuilding({ w: 84, wallH: 48, roofH: 30, wall: "wood", roof: C.amberD, roofD: C.wood, roofL: C.amber, windows: [12, 58], door: 34, dark: true }),
};

// ---------- Objetos ----------
const PROP = {
  tree: makeCanvas(40, 52, p => {
    p("rgba(18,13,26,0.45)", 8, 47, 24, 5);
    p(C.ink, 17, 30, 7, 19); p(C.wood, 18, 31, 5, 17); p(C.woodL, 18, 31, 1, 17);
    const blob = (x, y, w, h, c) => { p(c, x + 2, y, w - 4, h); p(c, x, y + 2, w, h - 4); };
    blob(3, 3, 34, 30, C.ink); blob(4, 4, 32, 28, C.greenD); blob(7, 5, 22, 18, C.green); blob(10, 6, 10, 8, C.leaf);
    p(C.greenD, 12, 24, 4, 2); p(C.greenD, 25, 18, 3, 3);
  }),
  lamp: makeCanvas(12, 46, p => {
    p("rgba(18,13,26,0.45)", 1, 43, 10, 3);
    p(C.ink, 4, 10, 4, 34); p(C.steel, 5, 11, 2, 32); p(C.ink, 2, 42, 8, 3);
    p(C.ink, 1, 2, 10, 10); p(C.amber, 2, 3, 8, 8); p(C.bone, 4, 5, 3, 3); p(C.ink, 3, 0, 6, 3);
  }),
  barrel: makeCanvas(16, 20, p => {
    p("rgba(18,13,26,0.45)", 1, 17, 14, 3);
    p(C.ink, 1, 0, 14, 18); p(C.wood, 2, 1, 12, 16); p(C.woodL, 3, 1, 3, 16); p(C.ink, 2, 4, 12, 1); p(C.ink, 2, 12, 12, 1);
    p(C.woodL, 2, 1, 12, 2);
  }),
  crate: makeCanvas(18, 18, p => {
    p("rgba(18,13,26,0.45)", 1, 15, 16, 3);
    p(C.ink, 0, 0, 18, 16); p(C.woodL, 1, 1, 16, 14); p(C.wood, 1, 1, 16, 2); p(C.wood, 8, 3, 2, 12); p(C.wood, 1, 8, 16, 2);
  }),
  bench: makeCanvas(32, 14, p => {
    p("rgba(18,13,26,0.45)", 1, 11, 30, 3);
    p(C.ink, 0, 2, 32, 6); p(C.woodL, 1, 3, 30, 4); p(C.wood, 1, 6, 30, 1); p(C.ink, 3, 7, 3, 5); p(C.ink, 26, 7, 3, 5);
  }),
  flowers: makeCanvas(20, 10, p => {
    p(C.greenD, 0, 4, 20, 6); p(C.green, 1, 5, 18, 2);
    [[2, C.red], [6, C.amber], [10, C.lilac], [14, C.bone], [17, C.red]].forEach(([x, c]) => { p(c, x, 2, 2, 2); p(C.greenD, x, 4, 1, 2); });
  }),
  stall: (cA, cB) => makeCanvas(48, 40, p => {
    p("rgba(18,13,26,0.45)", 2, 36, 44, 4);
    p(C.ink, 3, 10, 2, 28); p(C.ink, 43, 10, 2, 28);
    p(C.ink, 2, 22, 44, 14); p(C.wood, 3, 23, 42, 12); p(C.woodL, 3, 23, 42, 2);
    [[6, C.red], [12, C.amber], [18, C.green], [26, C.bone], [33, C.lilac], [39, C.amberD]].forEach(([x, c]) => { p(C.ink, x - 1, 18, 6, 5); p(c, x, 19, 4, 4); });
    p(C.ink, 0, 2, 48, 11);
    for (let x = 1; x < 47; x += 6) { p(cA, x, 3, 3, 9); p(cB, x + 3, 3, 3, 9); }
    for (let x = 1; x < 47; x += 6) p(cA, x, 12, 3, 2);
  }),
  tent: makeCanvas(64, 60, p => {
    p("rgba(18,13,26,0.5)", 4, 55, 56, 5);
    for (let y = 0; y < 52; y++) {
      const half = 4 + Math.round((y / 52) * 26);
      p(C.ink, 32 - half - 1, y + 3, half * 2 + 2, 1);
      for (let x = -half; x < half; x++) p(Math.floor((x + 40) / 6) % 2 ? C.violet : C.felt, 32 + x, y + 3, 1, 1);
    }
    p(C.ink, 22, 30, 20, 25); p(C.night, 23, 31, 18, 24); p(C.amber, 30, 40, 4, 4); p(C.amberD, 31, 41, 2, 2);
    p(C.ink, 30, 0, 4, 5); p(C.amber, 31, 0, 2, 3);
  }),
  gate: makeCanvas(96, 72, p => {
    p("rgba(18,13,26,0.5)", 4, 66, 88, 6);
    p(C.ink, 0, 6, 26, 62); p(C.boneD, 1, 7, 24, 60); p(C.ink, 70, 6, 26, 62); p(C.boneD, 71, 7, 24, 60);
    for (let y = 9; y < 66; y += 7) { p(C.wood, 1, y + 5, 24, 1); p(C.wood, 71, y + 5, 24, 1); }
    p(C.ink, 22, 0, 52, 22); p(C.boneD, 23, 1, 50, 20); p(C.bone, 23, 1, 50, 2);
    p(C.ink, 26, 22, 44, 46); p(C.wood, 27, 23, 42, 45);
    for (let x = 30; x < 68; x += 6) p(C.night, x, 23, 1, 45);
    p(C.ink, 27, 40, 42, 3); p(C.steel, 27, 41, 42, 1); p(C.amber, 46, 36, 4, 4);
  }),
  grave: makeCanvas(14, 18, p => { p("rgba(18,13,26,0.45)", 1, 15, 12, 3); p(C.ink, 2, 0, 10, 16); p(C.boneD, 3, 1, 8, 14); p(C.wood, 6, 4, 2, 6); p(C.wood, 4, 6, 6, 2); }),
};
// ---------- Arte provisória do LPC (OpenGameArt, na paleta — ver docs/ASSETS.md) ----------
// Casas montadas com o kit house.png (parede de tijolo, porta, janela, chaminé, telhado),
// árvores = copa + tronco, barris, o guarda (soldier.png) e Bartô, cartomante e padre
// (montados com peças do gerador de personagens LPC, tools/lpc_npc.py). Até carregar, fica o desenho em código.
const LPC = {};
["house", "house_pedra", "treetop", "trunk", "barrel", "signs", "soldier", "npc/barto", "npc/cartomante", "npc/padre"].forEach(k => { LPC[k] = cityImage(`assets/temp/lpc/${k}.png`); });
const ART = {};                       // peças montadas quando as imagens chegam
function crop(img, sx, sy, w, h) { return makeCanvas(w, h, (p, g) => g.drawImage(img, sx, sy, w, h, 0, 0, w, h)); }

// Casa: largura 32 + 32·cols, parede 16 + 32·rows + 32 (topo, meio repetido, alicerce)
function makeHouse(o) {
  const kit = LPC[o.kit || "house"];
  const W = 32 + 32 * o.cols, WH = 16 + 32 * o.rows + 32, RH = o.roofH, H = RH + WH + 4;
  const d = (g, sx, sy, w, h, dx, dy) => g.drawImage(kit, sx, sy, w, h, Math.round(dx), Math.round(dy), w, h);
  const canvas = makeCanvas(W + 8, H, (p, g) => {
    const x0 = 4, wy = RH;
    p("rgba(18,13,26,0.5)", x0 + 2, H - 4, W, 4);                         // sombra no chão
    // parede (9 partes): colunas 16 | 32... | 16 ; linhas 16 | 32... | 32
    const rows = [[0, 16, 1], [32, 32, o.rows], [64, 32, 1]];
    let y = wy;
    rows.forEach(([sy, sh, n]) => { for (let r = 0; r < n; r++, y += sh) {
      d(g, 0, sy, 16, sh, x0, y);
      for (let c = 0; c < o.cols; c++) d(g, 32, sy, 32, sh, x0 + 16 + c * 32, y);
      d(g, 80, sy, 16, sh, x0 + W - 16, y);
    } });
    (o.windows || []).forEach(wx => d(g, 224, 0, 32, 32, x0 + wx, wy + 14));
    if (o.door !== undefined) d(g, o.doorKind ? 160 : 96, 0, 32, 48, x0 + o.door, wy + WH - 48);
    if (o.sign) g.drawImage(LPC.signs, o.sign.i * 32, 0, 32, 32, x0 + o.sign.x, wy - 2, 32, 32);   // placa pendurada no beiral
    // telhado: painel de telhas com moldura de 4 px, miolo repetido
    const rx = x0 - 4, rw = W + 8, B4 = 4;
    d(g, 96, 128, B4, B4, rx, 0); d(g, 192 - B4, 128, B4, B4, rx + rw - B4, 0);
    d(g, 96, 188, B4, B4, rx, RH - B4); d(g, 192 - B4, 188, B4, B4, rx + rw - B4, RH - B4);
    for (let x = rx + B4; x < rx + rw - B4; x += 32) {
      const w = Math.min(32, rx + rw - B4 - x);
      d(g, 128, 128, w, B4, x, 0); d(g, 128, 188, w, B4, x, RH - B4);
      for (let yy = B4; yy < RH - B4; yy += 16) d(g, 128, 132, w, Math.min(16, RH - B4 - yy), x, yy);
    }
    for (let yy = B4; yy < RH - B4; yy += 16) { const h = Math.min(16, RH - B4 - yy); d(g, 96, 132, B4, h, rx, yy); d(g, 192 - B4, 132, B4, h, rx + rw - B4, yy); }
    if (o.chimney !== undefined) d(g, 192, 8, 32, 48, rx + o.chimney, -14);
    if (o.cross) { const c = x0 + W / 2 - 3; p(C.ink, c - 1, 0, 8, 2); p(C.amber, c + 2, 2, 2, 12); p(C.amber, c, 5, 6, 2); }
  });
  return { canvas, w: W + 8, h: H, ox: 4, wallTop: RH, doorX: 4 + (o.door || 0) + 16 };
}
// Árvore: copa por cima do tronco; o tronco começa 40 px acima do pé da copa
function makeTree(cx0, cy0, ch, trunkX) {
  const bottom = ch, trunkY = bottom - 40;
  return { canvas: makeCanvas(96, trunkY + 74, (p, g) => {
    g.drawImage(LPC.trunk, trunkX, 0, 96, 74, 0, trunkY, 96, 74);
    g.drawImage(LPC.treetop, cx0, cy0, 96, ch, 0, 0, 96, ch);
  }), base: trunkY + 62 };
}
function buildLPC() {
  if (!Object.values(LPC).every(i => i.complete && i.naturalWidth)) return;
  ART.trees = [makeTree(0, 0, 80, 0), makeTree(96, 0, 96, 96), makeTree(0, 96, 96, 0), makeTree(96, 96, 112, 96)];
  ART.barrel = crop(LPC.barrel, 0, 10, 32, 38);
  ART.guarda = crop(LPC.soldier, 0, 128, 64, 64);
  ART.bebado = LPC["npc/barto"]; ART.cartomante = LPC["npc/cartomante"]; ART.padre = LPC["npc/padre"];
  Object.assign(B.taverna, makeHouse({ cols: 5, rows: 1, roofH: 52, windows: [16, 48, 128, 160], door: 80, sign: { i: 0, x: 80 }, chimney: 24 }));
  Object.assign(B.bartô, makeHouse({ cols: 2, rows: 1, roofH: 40, windows: [8], door: 56, doorKind: 1, sign: { i: 2, x: 56 }, chimney: 70 }));
  Object.assign(B.capela, makeHouse({ kit: "house_pedra", cols: 2, rows: 2, roofH: 44, windows: [8, 56], door: 32, cross: true }));
  Object.assign(B.casaO, makeHouse({ cols: 2, rows: 1, roofH: 36, windows: [8, 56], door: 32, doorKind: 1 }));
  Object.assign(B.casaL, makeHouse({ cols: 2, rows: 1, roofH: 36, windows: [8, 56], door: 32, chimney: 10 }));
  if (cityRunning) buildGrid();
}
Object.values(LPC).forEach(i => i.addEventListener("load", buildLPC));

const GLOW = makeCanvas(48, 48, p => {
  for (let y = -24; y < 24; y++) for (let x = -24; x < 24; x++) {
    const d = Math.hypot(x, y) / 24; if (d > 1) continue;
    if (d > 0.55 && (x + y) % 2) continue;
    if (d <= 0.55 && x % 2 === 0 && y % 2 === 0) continue;
    p(C.amber, x + 24, y + 24);
  }
});

// ---------- O mapa ----------
// Calçamento (retângulos) — o resto é grama
const COBBLE = [
  [150, 270, 340, 230],   // praça
  [40, 250, 120, 320],    // rua do mercado
  [490, 300, 120, 120],   // largo da capela
  [270, 500, 100, 200],   // rua para o portão
  [380, 600, 190, 60],    // beco do portal
];
// Terra (múltiplos de 16, por causa dos tiles): saída do portão e chão da tenda da cartomante
const DIRT = [[288, 688, 64, 80], [56, 528, 80, 64]];

// Construções: x, base (y do chão), modelo
const BUILDINGS = [
  { x: 214, base: 262, b: B.taverna, door: { get x() { return 214 + B.taverna.doorX; } } },
  { x: 420, base: 250, b: B.bartô },
  { x: 504, base: 300, b: B.capela },
  { x: 28, base: 232, b: B.casaO },
  { x: 520, base: 560, b: B.casaL },
];
const PORTAL = { x: 520, y: 636, r: 13 };
window.CITY_PORTAL = PORTAL;

const rnd = seeded(7);
const PROPS = [
  // praça
  { x: 320, y: 404, k: "fountain" },
  ...[[230, 300], [410, 300], [230, 470], [410, 470]].map(([x, y]) => ({ x, y, k: "lamp" })),
  { x: 262, y: 452, k: "bench" }, { x: 378, y: 452, k: "bench" },
  { x: 180, y: 310, k: "flowers" }, { x: 460, y: 310, k: "flowers" }, { x: 180, y: 486, k: "flowers" }, { x: 460, y: 486, k: "flowers" },
  // mercado
  { x: 70, y: 330, k: "stall", a: C.red, b: C.bone }, { x: 70, y: 420, k: "stall", a: C.green, b: C.bone },
  { x: 130, y: 470, k: "crate" }, { x: 116, y: 476, k: "crate" }, { x: 128, y: 300, k: "barrel" }, { x: 52, y: 470, k: "barrel" },
  { x: 92, y: 560, k: "tent" },
  // taverna / Bartô
  { x: 196, y: 268, k: "barrel" }, { x: 404, y: 266, k: "barrel" }, { x: 418, y: 270, k: "crate" },
  // capela: cemitério pequeno
  { x: 520, y: 450, k: "grave" }, { x: 548, y: 456, k: "grave" }, { x: 576, y: 448, k: "grave" },
  // portão
  { x: 320, y: 744, k: "gate" },
  // beco
  { x: 400, y: 652, k: "barrel" }, { x: 590, y: 640, k: "crate" },
  // tiles do Kenney: cercas do cemitério e da horta, arbustos, cogumelos, brotos, colmeia, placa do beco
  { x: 496, y: 482, k: "fence", n: 7 }, { x: 524, y: 596, k: "fence", n: 5 },
  { x: 380, y: 670, k: "kt", t: 83 },
  { x: 540, y: 584, k: "kt", t: 17 }, { x: 562, y: 586, k: "kt", t: 17 }, { x: 584, y: 583, k: "kt", t: 17 },
  { x: 168, y: 246, k: "kt", t: 94 },
  ...[[144, 600], [600, 330], [470, 576], [36, 160], [250, 600], [140, 720]].map(([x, y]) => ({ x, y, k: "kt", t: 5 })),
  ...[[160, 612], [596, 486], [26, 640], [456, 588]].map(([x, y]) => ({ x, y, k: "kt", t: 29 })),
  // árvores na borda
  ...[[20, 40], [90, 60], [170, 30], [470, 40], [560, 60], [620, 120], [20, 200], [620, 230], [610, 470], [20, 620],
      [150, 640], [200, 700], [450, 720], [620, 700], [240, 560], [430, 540], [40, 720]].map(([x, y], i) => ({ x, y, k: "tree", v: (i * 7) % 4 })),
];

// Pessoas (lore espalhada: cada uma sabe um pedaço)
const npcs = [
  { id: "dona", x: 312, y: 286, img: () => IMG.dona_south, w: 64, h: 64, talk: () => donaScene() },
  { id: "bebado", x: 466, y: 276, img: () => ART.bebado || PEOPLE.bebado, w: 30, h: 54, talk: () => lines("bebado", BARTO_LINES) },
  { id: "cartomante", x: 128, y: 572, img: () => ART.cartomante || PEOPLE.cartomante, w: 30, h: 54, talk: () => lines("cartomante", CARTO_LINES) },
  { id: "padre", x: 552, y: 330, img: () => ART.padre || PEOPLE.padre, w: 30, h: 54, talk: () => lines("padre", PADRE_LINES) },
  { id: "guarda", x: 360, y: 716, img: () => ART.guarda || PEOPLE.guarda, w: 30, h: 54, talk: () => lines("guarda", GUARDA_LINES) },
];
Object.assign(SPEAKERS, {
  cartomante: { name: "Cartomante" }, padre: { name: "Padre" }, guarda: { name: "Guarda" },
});

// ---------- Tiles provisórios (Kenney "Tiny Town", CC0, já na paleta — ver docs/ASSETS.md) ----------
// Folha 12×11 de tiles de 16 px. Grama, terra e objetos pequenos; casas e árvores do pacote
// ficam de fora (feitos para bonecos de 16 px — os nossos têm ~50 px).
const KT = cityImage("assets/temp/kenney-tiny-town/tiles.png");
const KT_SIZE = 16, KT_COLS = 12;
const tileReady = () => KT.complete && KT.naturalWidth > 0;
function tile(g, i, x, y) {
  g.drawImage(KT, (i % KT_COLS) * KT_SIZE, Math.floor(i / KT_COLS) * KT_SIZE, KT_SIZE, KT_SIZE, Math.round(x), Math.round(y), KT_SIZE, KT_SIZE);
}
const KT_DIRT = [[12, 13, 14], [24, 25, 26], [36, 37, 38]];    // terra com borda de grama (3×3)

// ---------- Chão pré-desenhado ----------
// Sem os tiles (ainda carregando ou faltando): grama e terra em código, como antes.
let ground = makeGround();
KT.addEventListener("load", () => { ground = makeGround(); });
function makeGround() { return makeCanvas(CW, CH, (p, g) => {
  const r = seeded(3);
  if (tileReady()) {
    for (let ty = 0; ty < CH; ty += KT_SIZE) for (let tx = 0; tx < CW; tx += KT_SIZE) {
      const v = r();
      tile(g, v < 0.015 ? 2 : v < 0.4 ? 1 : 0, tx, ty);
    }
    DIRT.forEach(([x, y, w, h]) => {
      const nx = w / KT_SIZE, ny = h / KT_SIZE;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++)
        tile(g, KT_DIRT[j === 0 ? 0 : j === ny - 1 ? 2 : 1][i === 0 ? 0 : i === nx - 1 ? 2 : 1], x + i * KT_SIZE, y + j * KT_SIZE);
    });
  } else {
    p(C.greenD, 0, 0, CW, CH);
    for (let i = 0; i < 1400; i++) {                              // tufos de grama
      const x = r() * CW, y = r() * CH;
      p(r() < 0.5 ? C.green : C.dusk, x, y, 1, 2); if (r() < 0.3) p(C.leaf, x + 1, y, 1, 1);
    }
    DIRT.forEach(([x, y, w, h]) => { p(C.wood, x, y, w, h); for (let i = 0; i < 80; i++) p(C.woodL, x + r() * w, y + r() * h, 2, 1); });
  }
  COBBLE.forEach(([x0, y0, w, h]) => {
    p(C.ink, x0 - 1, y0 - 1, w + 2, h + 2);
    p(C.night, x0, y0, w, h);
    for (let y = y0; y < y0 + h; y += 6)
      for (let x = x0 + ((y - y0) / 6 % 2 ? -4 : 0); x < x0 + w; x += 9) {
        const sx = Math.max(x0, x + 1), ex = Math.min(x0 + w, x + 8);
        if (ex <= sx) continue;
        const c = r() < 0.12 ? C.violet : C.dusk;
        p(c, sx, y + 1, ex - sx, 4);
        p(r() < 0.4 ? C.violet : c, sx, y + 1, ex - sx, 1);
      }
  });
  // fonte: base de pedra e água (o brilho anima por cima)
  const fx = 320, fy = 404;
  for (let y = -26; y <= 26; y++) for (let x = -40; x <= 40; x++) {
    const d = (x * x) / (40 * 40) + (y * y) / (26 * 26);
    if (d <= 1) p(d > 0.86 ? C.ink : d > 0.62 ? (y < 0 ? C.boneD : C.wood) : d > 0.52 ? C.ink : (y < -6 ? C.steelL : C.steel), fx + x, fy - 8 + y);
  }
}); }

// ---------- Desenho por quadro ----------
function sprite(img, x, y, w, h, flip, bob = 0) {
  if (!img || img.complete === false) return;
  cx.save();
  if (flip) { cx.translate(Math.round(x), 0); cx.scale(-1, 1); cx.drawImage(img, Math.round(-w / 2), Math.round(y - h + bob)); }
  else cx.drawImage(img, Math.round(x - w / 2), Math.round(y - h + bob));
  cx.restore();
}
function glow(x, y, a) { cx.globalAlpha = a; cx.drawImage(GLOW, Math.round(x - 24), Math.round(y - 24)); cx.globalAlpha = 1; }

function drawFountainTop(t) {
  const fx = 320, fy = 404, f = Math.floor(t / 220) % 3;
  cx.fillStyle = C.ink; cx.fillRect(fx - 4, fy - 40, 8, 26);
  cx.fillStyle = C.boneD; cx.fillRect(fx - 3, fy - 39, 6, 25);
  cx.fillStyle = C.steelL;
  cx.fillRect(fx - 1, fy - 50 + f, 2, 12);
  [[-10, 2], [8, 0], [-4, 6], [14, 4], [-16, -2]].forEach(([dx, dy], i) => { if ((i + f) % 3) cx.fillRect(fx + dx, fy - 8 + dy, 2, 1); });
}

function drawPortal(t) {
  const { x, y } = PORTAL, a = t / 320;
  glowGreen(x, y - 10);
  for (let ring = 3; ring >= 0; ring--) {
    const rad = 5 + ring * 4;
    cx.fillStyle = [C.bone, "#c4ee8a", C.leaf, C.green][ring];
    for (let k = 0; k < 12; k++) {
      const ang = a * (ring % 2 ? 1 : -1) + (k / 12) * Math.PI * 2;
      cx.fillRect(Math.round(x + Math.cos(ang) * rad - 1), Math.round(y - 12 + Math.sin(ang) * rad * 0.7 - 1), 2, 2);
    }
  }
}
function glowGreen(x, y) {
  cx.globalAlpha = 0.25; cx.fillStyle = C.green;
  for (let dy = -16; dy <= 16; dy += 2) for (let dx = -22; dx <= 22; dx += 2)
    if ((dx * dx) / 484 + (dy * dy) / 256 < 1 && ((dx + dy) / 2) % 2 === 0) cx.fillRect(x + dx, y + dy, 1, 1);
  cx.globalAlpha = 1;
}

function drawCity(t) {
  const camX = Math.round(Math.max(0, Math.min(CW - viewW, sid.x - viewW / 2)));
  const camY = Math.round(Math.max(0, Math.min(CH - viewH, sid.y - viewH / 2 - 20)));
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.fillStyle = C.ink; cx.fillRect(0, 0, viewW, viewH);
  cx.setTransform(1, 0, 0, 1, -camX, -camY);
  cx.drawImage(ground, 0, 0);
  drawPortal(t);
  // tudo que tem altura, ordenado pelo pé (y): quem está mais embaixo fica na frente
  const things = [];
  BUILDINGS.forEach(o => things.push({ y: o.base, draw: () => cx.drawImage(o.b.canvas, o.x, o.base - o.b.h + 4) }));
  PROPS.forEach(o => things.push({ y: o.y, draw: () => drawProp(o, t) }));
  npcs.forEach(n => things.push({ y: n.y, draw: () => { const im = n.img(); sprite(im, n.x, n.y + 1, im.width || n.w, im.height || n.h, false, Math.floor(t / 650 + n.x) % 2); } }));
  things.push({ y: sid.y, draw: () => {
    const walking = sid.path.length > 0;
    const bob = walking ? Math.floor(t / 120) % 2 : Math.floor(t / 650) % 2;
    sprite(sid.dir === "up" ? IMG.sid_back : IMG.sid_front, sid.x, sid.y + 2, 64, 64, sid.dir === "left", -bob);
  } });
  things.sort((a, b) => a.y - b.y).forEach(o => o.draw());
  // luzes por cima (janelas e postes)
  const flick = Math.floor(t / 400) % 2 ? 0.16 : 0.13;
  PROPS.filter(o => o.k === "lamp").forEach(o => glow(o.x, o.y - 40, flick + 0.04));
  if (tapMark) {
    const age = t - tapMark.t;
    if (age > 500) tapMark = null;
    else { cx.fillStyle = C.amber; const s = 3 + Math.floor(age / 120); cx.fillRect(tapMark.x - s, tapMark.y, 2, 1); cx.fillRect(tapMark.x + s - 1, tapMark.y, 2, 1); cx.fillRect(tapMark.x, tapMark.y - Math.ceil(s / 2), 1, 2); }
  }
  cityCanvas.dataset.cam = `${camX},${camY}`;
}
function drawProp(o, t) {
  if (o.k === "fountain") return drawFountainTop(t);
  if (o.k === "stall") { o.c = o.c || PROP.stall(o.a, o.b); return cx.drawImage(o.c, o.x - 24, o.y - 38); }
  if (o.k === "kt") { if (tileReady()) tile(cx, o.t, o.x - 8, o.y - 15); return; }
  if (o.k === "fence") {                       // cerca reta: ponta esquerda, meio, ponta direita
    if (tileReady()) for (let i = 0; i < o.n; i++) tile(cx, i === 0 ? 80 : i === o.n - 1 ? 82 : 81, o.x + i * KT_SIZE, o.y - 15);
    return;
  }
  if (o.k === "tree" && ART.trees) {
    const t = ART.trees[o.v ?? 0];
    return cx.drawImage(t.canvas, Math.round(o.x - 48), Math.round(o.y - t.base));
  }
  const c = o.k === "barrel" && ART.barrel ? ART.barrel : PROP[o.k];
  cx.drawImage(c, Math.round(o.x - c.width / 2), Math.round(o.y - c.height + 2));
}

// ---------- Onde dá para andar (grade de 8 px) + caminho (A*) ----------
const CELL = 8, GW = Math.ceil(CW / CELL), GH = Math.ceil(CH / CELL);
const solid = new Uint8Array(GW * GH);
function block(x, y, w, h) {
  for (let gy = Math.floor(y / CELL); gy <= Math.floor((y + h) / CELL); gy++)
    for (let gx = Math.floor(x / CELL); gx <= Math.floor((x + w) / CELL); gx++)
      if (gx >= 0 && gy >= 0 && gx < GW && gy < GH) solid[gy * GW + gx] = 1;
}
function buildGrid() {
  solid.fill(0);
  block(0, 0, CW, 16); block(0, 0, 6, CH); block(CW - 6, 0, 6, CH); block(0, CH - 6, CW, 6);
  BUILDINGS.forEach(o => block(o.x + 2, o.base - o.b.h + o.b.wallTop + 8, o.b.w - 4, o.b.h - o.b.wallTop - 10));
  PROPS.forEach(o => {
    if (o.k === "fountain") block(o.x - 40, o.y - 30, 80, 44);
    else if (o.k === "tree") block(o.x - 5, o.y - 6, 10, 6);
    else if (o.k === "lamp") block(o.x - 3, o.y - 4, 6, 4);
    else if (o.k === "stall") block(o.x - 24, o.y - 16, 48, 16);
    else if (o.k === "tent") block(o.x - 30, o.y - 30, 60, 30);
    else if (o.k === "gate") block(o.x - 48, o.y - 30, 96, 30);
    else if (o.k === "bench") block(o.x - 16, o.y - 6, 32, 6);
    else if (o.k === "fence") block(o.x, o.y - 6, o.n * 16 - 1, 5);
    else if (o.k === "kt") { if (o.t !== 17) block(o.x - 6, o.y - 5, 12, 5); }
    else block(o.x - 8, o.y - 6, 16, 6);
  });
  npcs.forEach(n => block(n.x - 7, n.y - 5, 14, 6));
}
const free = (gx, gy) => gx >= 0 && gy >= 0 && gx < GW && gy < GH && !solid[gy * GW + gx];
function nearestFree(gx, gy) {
  if (free(gx, gy)) return [gx, gy];
  for (let r = 1; r < 12; r++)
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
      if ((Math.abs(dx) === r || Math.abs(dy) === r) && free(gx + dx, gy + dy)) return [gx + dx, gy + dy];
  return null;
}
function findPath(x0, y0, x1, y1) {
  const s = nearestFree(Math.floor(x0 / CELL), Math.floor(y0 / CELL));
  const e = nearestFree(Math.floor(x1 / CELL), Math.floor(y1 / CELL));
  if (!s || !e) return [];
  const key = (x, y) => y * GW + x;
  const g = new Map([[key(...s), 0]]), from = new Map(), open = [[0, ...s]];
  const h = (x, y) => Math.hypot(x - e[0], y - e[1]);
  const seen = new Set();
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]);
    const [, x, y] = open.shift();
    const k = key(x, y);
    if (seen.has(k)) continue;
    seen.add(k);
    if (x === e[0] && y === e[1]) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!free(nx, ny) || (dx && dy && (!free(x + dx, y) || !free(x, y + dy)))) continue;
      const ng = g.get(k) + (dx && dy ? 1.414 : 1);
      const nk = key(nx, ny);
      if (ng < (g.get(nk) ?? Infinity)) { g.set(nk, ng); from.set(nk, k); open.push([ng + h(nx, ny), nx, ny]); }
    }
    if (seen.size > 6000) break;
  }
  const ek = key(...e);
  if (!from.has(ek) && ek !== key(...s)) return [];
  const pts = [];
  for (let k = ek; k !== undefined && k !== key(...s); k = from.get(k)) pts.push([(k % GW) * CELL + CELL / 2, Math.floor(k / GW) * CELL + CELL / 2]);
  pts.reverse();
  // ponto final exato (se livre)
  if (free(Math.floor(x1 / CELL), Math.floor(y1 / CELL)) && pts.length) pts[pts.length - 1] = [x1, y1];
  return pts;
}

// ---------- Sid ----------
const sid = { x: 312, y: 330, dir: "down", path: [], then: null };
const SID_SPEED = 72;
function stepSid(dt) {
  if (!sid.path.length) return;
  let left = SID_SPEED * dt;
  while (left > 0 && sid.path.length) {
    const [tx, ty] = sid.path[0];
    const dx = tx - sid.x, dy = ty - sid.y, d = Math.hypot(dx, dy);
    if (Math.abs(dx) > Math.abs(dy) * 1.2) sid.dir = dx > 0 ? "right" : "left";
    else if (d > 0.5) sid.dir = dy > 0 ? "down" : "up";
    if (d <= left) { sid.x = tx; sid.y = ty; sid.path.shift(); left -= d; }
    else { sid.x += (dx / d) * left; sid.y += (dy / d) * left; left = 0; }
    if (Math.hypot(sid.x - PORTAL.x, sid.y - PORTAL.y) < PORTAL.r) { sid.path = []; sid.then = null; enterPortal(); return; }
  }
  if (!sid.path.length) { const then = sid.then; sid.then = null; if (then) then(); }
}
function walkTo(x, y, then) {
  sid.path = findPath(sid.x, sid.y, Math.max(8, Math.min(CW - 8, x)), Math.max(20, Math.min(CH - 8, y)));
  sid.then = then || null;
  if (!sid.path.length && then) then();
}

// ---------- Laço, escala e toque ----------
let cityRunning = false, cityBusy = false, lastT = 0, tapMark = null;
function cityLoop(t) {
  if (!cityRunning) return;
  const dt = Math.min(0.05, (t - (lastT || t)) / 1000);
  lastT = t;
  if (!cityBusy) stepSid(dt);
  drawCity(t);
  requestAnimationFrame(cityLoop);
}
function fitCity() {
  const vw = window.innerWidth, vh = window.innerHeight;
  viewK = Math.max(1, Math.floor(Math.min(vw / 340, vh / 520)));   // celular: zoom 1 (cidade maior)
  viewW = Math.min(CW, Math.ceil(vw / viewK));
  viewH = Math.min(CH, Math.ceil(vh / viewK));
  cityCanvas.width = viewW; cityCanvas.height = viewH;
  cityCanvas.style.width = `${viewW * viewK}px`;
  cityCanvas.style.height = `${viewH * viewK}px`;
}
window.addEventListener("resize", () => { if (cityRunning) fitCity(); });

cityCanvas.addEventListener("click", e => {
  if (cityBusy) return;
  cityEl.querySelector(".city-hint").hidden = true;
  const rect = cityCanvas.getBoundingClientRect();
  const [camX, camY] = (cityCanvas.dataset.cam || "0,0").split(",").map(Number);
  const wx = (e.clientX - rect.left) / viewK + camX, wy = (e.clientY - rect.top) / viewK + camY;
  tapMark = { x: Math.round(wx), y: Math.round(wy), t: performance.now() };
  const npc = npcs.find(n => Math.abs(wx - n.x) < 16 && wy > n.y - 56 && wy < n.y + 6);
  if (npc) return walkTo(npc.x, npc.y + 16, () => { sid.dir = "up"; talkTo(npc); });
  const door = BUILDINGS[0].door;
  if (Math.abs(wx - door.x) < 14 && wy > BUILDINGS[0].base - 30 && wy < BUILDINGS[0].base + 4)
    return walkTo(door.x - 22, BUILDINGS[0].base + 14, () => { sid.dir = "up"; talkTo({ talk: doorScene }); });
  walkTo(wx, wy);
});

async function talkTo(npc) {
  cityBusy = true;
  await npc.talk();
  cityBusy = false;
}

// ---------- Falas ----------
function defeats() { try { return +localStorage.getItem(DEFEATS_KEY) || 0; } catch (e) { return 0; } }

// A dona vai mudando a cada derrota (perder aproxima do amor)
const DONA_LINES = [
  ["Vai ficar parado aí ou vai pagar a conta?", "E nem pense em entrar com esses dados brilhando."],
  ["Voltou inteiro? Hmph. Que pena pros lodos."],
  ["Guardei um prato. Não que eu me importe... é que ia estragar."],
  ["Onde você foi dessa vez, Sid?", "...Toma cuidado lá dentro, tá?"],
];
function donaScene() {
  const ls = DONA_LINES[Math.min(defeats(), DONA_LINES.length - 1)];
  return playScene(ls.map(text => ({ say: "dona", text })));
}
const BARTO_LINES = [
  ["Tá vendo aquele redemoinho verde no beco? É sorte vazando do mundo, forasteiro.", "Quem entra volta mais rico... ou volta diferente."],
  ["Dizem que tem gente que joga com a gente lá de cima. Eu só jogo com quem paga a bebida."],
  ["Já misturei poções, sabia? Antes dos dados. Antes de tudo."],
];
const CARTO_LINES = [
  ["Senta, forasteiro. As cartas já sabiam que você vinha.", "...Estranho. Elas dizem que você carrega alguém aí dentro. Alguém que não para de jogar."],
  ["A Roda da Fortuna gira pra todo mundo. Pra você, ela gira mais rápido."],
];
const PADRE_LINES = [
  ["O povo chama de portal do azar. Eu chamo de tentação.", "Quem atravessa sempre acha que vai sair ganhando."],
  ["A sorte se lança no colo, filho... mas a decisão não é de quem joga."],
];
const GUARDA_LINES = [
  ["Ninguém sai da cidade desde que os redemoinhos começaram.", "Engraçado... começaram mais ou menos quando você chegou."],
  ["Portão fechado. Ordens. Vai incomodar o beco, que é pra lá que os loucos vão."],
];
const lineIdx = {};
function lines(who, list) {
  const i = lineIdx[who] = (lineIdx[who] ?? -1) + 1;
  return playScene(list[i % list.length].map(text => ({ say: who, text })));
}
function doorScene() {
  return playScene([{ say: "dona", text: "Fechado. Pra você, pelo menos até pagar o que deve." }]);
}

// ---------- Portal / lutas ----------
let seenPortal = false;
async function enterPortal() {
  cityBusy = true;
  if (!seenPortal) {
    seenPortal = true;
    await playScene([{ narra: "O redemoinho cheira a dado velho e sorte queimada. Sid respira fundo... e entra." }]);
  }
  startRun();
}
function startRun() {
  hideCity();
  window.RUN = { fights: RUN_FIGHTS };
  setBackdrop("masmorra");
  storyFight = null;
  MAX_ROLLS = 2; over = false; level = 0; reserve = 0; charge = 0; shield = 0;
  player.hp = player.maxHp;
  newEnemy();
  log(`Do outro lado do portal... (luta 1 de ${RUN_FIGHTS})`);
  startPlayerTurn();
}

// Fim da ida ao portal (chamado pelo combate)
window.endRun = async won => {
  window.RUN = null;
  if (!won) { try { localStorage.setItem(DEFEATS_KEY, String(defeats() + 1)); } catch (e) {} }
  enterCity();
  sid.x = PORTAL.x - 40; sid.y = PORTAL.y + 4; sid.dir = "down"; sid.path = [];
  cityBusy = true;
  await playScene([{ narra: won
    ? "O portal se fecha atrás de Sid. Os dados no chapéu ainda estão quentes."
    : "A Mesa reembaralha. Sid acorda no beco, com o gosto amargo de quem perdeu... de novo." }]);
  cityBusy = false;
};

function enterCity() {
  if (!CITY_ON) return false;
  buildGrid();
  fitCity();
  cityEl.hidden = false;
  if (!cityRunning) { cityRunning = true; lastT = 0; requestAnimationFrame(cityLoop); }
  cityBusy = false;
  return true;
}
function hideCity() {
  cityEl.hidden = true;
  cityRunning = false;
}
window.enterCity = enterCity;
window.cityState = () => ({ visible: !cityEl.hidden, sid: { x: sid.x, y: sid.y }, run: window.RUN });
window.cityWalkTo = walkTo;
window.cityTeleport = (x, y) => { sid.x = x; sid.y = y; sid.path = []; };
