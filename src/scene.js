// Cena em pixel art: masmorra, tochas, inimigo (de frente) e você (de costas).
//
// Tudo fica num "palco" de SW×SH pixels lógicos, ampliado por CSS com
// image-rendering: pixelated — assim todo pixel do jogo tem o mesmo tamanho.
// O inimigo é um <canvas> próprio (#enemy-sprite) para as animações de
// combate (tremer, piscar, avançar) continuarem funcionando por CSS/WAAPI.

const SW = 144, SH = 106;   // tamanho lógico da cena
const FLOOR_Y = 86;         // onde começa o chão

const PAL = {
  ink: "#120d1a", night: "#1e1630", dusk: "#2e2347", violet: "#463565",
  amber: "#f2b84b", amberD: "#c97f2a", red: "#d0455a", wood: "#7a4a1c", woodL: "#a86a33",
};

const stage = $("stage");
const bg = $("scene-bg");
const bgx = bg.getContext("2d");
const enemyCanvas = $("enemy-sprite");
const enemyWrap = $("enemy-wrap");
const heroImg = $("hero");

bg.width = SW; bg.height = SH;

// ---------- Fundo (desenhado uma vez; só as tochas animam) ----------

function px(c, x, y, w = 1, h = 1) { bgx.fillStyle = c; bgx.fillRect(x, y, w, h); }

function drawWall() {
  px(PAL.night, 0, 0, SW, SH);
  for (let y = 0; y < FLOOR_Y; y += 8) {
    const off = (y / 8) % 2 ? 8 : 0;
    for (let x = -off; x < SW; x += 16) {
      px(PAL.dusk, x + 1, y + 1, 14, 6);
      px(PAL.violet, x + 1, y + 1, 14, 1);
    }
  }
  px(PAL.dusk, 0, FLOOR_Y, SW, SH - FLOOR_Y);
  for (let x = 0; x < SW; x += 12) px(PAL.night, x, FLOOR_Y, 1, SH - FLOOR_Y);
  px(PAL.violet, 0, FLOOR_Y, SW, 1);
}

// Brilho "pontilhado" (dithering) em volta das tochas
function glow(cx, cy, r) {
  bgx.globalAlpha = 0.18;
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y) / r;
      if (d > 1) continue;
      if (d >= 0.5 && (x + y) % 2) continue;
      if (d < 0.5 && x % 2 === 0 && y % 2 === 0) continue;
      px(PAL.amber, cx + x, cy + y);
    }
  bgx.globalAlpha = 1;
}

const TORCH = [
  [".a.", "aAa", "rar", ".r.", "kwk", ".w.", ".w.", ".w."],
  ["..a", ".aA", "rAr", ".r.", "kwk", ".w.", ".w.", ".w."],
];
const TORCH_COLORS = { a: PAL.amber, A: PAL.amberD, r: PAL.red, k: PAL.ink, w: PAL.wood };

function torch(frame, x, y) {
  TORCH[frame].forEach((row, j) =>
    [...row].forEach((ch, i) => { if (TORCH_COLORS[ch]) px(TORCH_COLORS[ch], x + i, y + j); }));
}

// Sombra no chão sob o inimigo
let enemyShadow = null;

function drawScene(t) {
  drawWall();
  glow(11, 38, 14); glow(133, 38, 14);
  const f = Math.floor(t / 160) % 2;
  torch(f, 10, 34); torch(1 - f, 132, 34);
  if (enemyShadow && !enemyWrap.classList.contains("gone")) {
    const { x, y, w } = enemyShadow;
    bgx.globalAlpha = 0.45;
    px(PAL.ink, x, y, w, 2);
    px(PAL.ink, x + 3, y + 2, w - 6, 1);
    bgx.globalAlpha = 1;
  }
}

// Redesenha só quando o quadro da tocha muda (leve no celular)
let lastFrame = -1;
function loop(t) {
  const f = Math.floor(t / 160);
  if (f !== lastFrame) { lastFrame = f; drawScene(t); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- Inimigo ----------

const imageCache = {};
function loadImage(src) {
  if (!imageCache[src]) {
    imageCache[src] = new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });
  }
  return imageCache[src];
}

// Desenha o sprite do inimigo; "tint" troca a cor (variações sem gerar arte nova)
async function setEnemySprite(def) {
  const img = await loadImage(def.sprite);
  if (!img) return;
  enemyCanvas.width = img.width;
  enemyCanvas.height = img.height;
  const c = enemyCanvas.getContext("2d");
  c.clearRect(0, 0, img.width, img.height);
  c.drawImage(img, 0, 0);
  if (def.tint) {
    c.globalCompositeOperation = "color";
    c.fillStyle = def.tint;
    c.fillRect(0, 0, img.width, img.height);
    c.globalCompositeOperation = "destination-in";   // devolve a transparência original
    c.drawImage(img, 0, 0);
    c.globalCompositeOperation = "source-over";
  }
  // centralizado, com o "pé" (última linha desenhada) apoiado no chão
  const x = Math.round((SW - img.width) / 2);
  const y = FLOOR_Y - 4 - def.foot;
  enemyWrap.style.left = x + "px";
  enemyWrap.style.top = y + "px";
  enemyShadow = { x: x + Math.round(img.width * 0.25), y: FLOOR_Y - 5, w: Math.round(img.width * 0.5) };
  lastFrame = -1;
}

function enemyGone(gone) {
  enemyWrap.classList.toggle("gone", gone);
  lastFrame = -1;
}

// ---------- Escala do palco ----------

// Amplia o palco para caber na área da cena, arredondando para o pixel físico
function fitStage() {
  const box = $("scene").getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  let k = Math.min(box.width / SW, box.height / SH);
  k = Math.max(1, Math.floor(k * dpr) / dpr);
  const ox = Math.round((box.width - SW * k) / 2);
  const oy = Math.round(box.height - SH * k);    // encostado embaixo (perto da bandeja)
  stage.style.transform = `translate(${ox}px, ${oy}px) scale(${k})`;
}
window.addEventListener("resize", fitStage);
new ResizeObserver(fitStage).observe($("scene"));
fitStage();
