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

// Atordoado: estrelinhas âmbar girando em cima da cabeça do inimigo
let stunEl = null;
function setStunned(on) {
  if (stunEl) { stunEl.remove(); stunEl = null; }
  if (!on) return;
  stunEl = document.createElement("div");
  stunEl.className = "stun-stars";
  stunEl.style.left = `${parseFloat(enemyWrap.style.left) + enemyCanvas.width / 2}px`;
  stunEl.style.top = `${parseFloat(enemyWrap.style.top) + 3}px`;
  for (let i = 0; i < 3; i++) {
    const star = document.createElement("span");
    star.innerHTML = `<svg viewBox="0 0 5 5" shape-rendering="crispEdges"><path d="M2 0h1v2h2v1h-2v2h-1v-2h-2v-1h2z" fill="#f2b84b"/><rect x="2" y="2" width="1" height="1" fill="#f3e7c9"/></svg>`;
    star.style.animationDelay = `${-i * 400}ms`;
    stunEl.appendChild(star);
  }
  stage.appendChild(stunEl);
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

// ---------- Você: poses e magia ----------

const HERO_POSES = {
  idle: "assets/hero/apostador_costas.png",
  cast: "assets/hero/apostador_conjurando_costas.png",
};
Object.values(HERO_POSES).forEach(loadImage);   // pré-carrega para não piscar

// Onde fica o dado brilhante na pose de conjurar (pixels do sprite) e o personagem no palco
const HERO_POS = { x: -8, y: 58 };
const CAST_HAND = { x: 56, y: 9 };

function heroPose(name) {
  heroImg.src = HERO_POSES[name];
}

// Conjura: troca para a pose, uma rajada sai da mão até o inimigo.
// Resolve quando a rajada acerta (para o dano aparecer na hora certa).
// Cada efeito de combinação tem sua magia (cor do projétil + impacto próprio).
// kinds: tipos de efeito da combinação (ex.: ["escudo", "fogo"]); vazio = rajada verde comum.
const SPELLS = {
  base:     { core: "#f3e7c9", c: "#8fd16a", halo: "rgba(143,209,106,0.5)" },
  escudo:   { core: "#f3e7c9", c: "#6f8fc7", halo: "rgba(195,214,242,0.6)" },
  cura:     { core: "#f3e7c9", c: "#d0455a", halo: "rgba(208,69,90,0.5)" },
  fogo:     { core: "#f3e7c9", c: "#f2b84b", halo: "rgba(208,69,90,0.6)" },
  raio:     { core: "#f3e7c9", c: "#f2b84b", halo: "rgba(243,231,201,0.6)" },
  maldicao: { core: "#f3e7c9", c: "#9a7cc0", halo: "rgba(70,53,101,0.7)" },
};

// Pixel solto no palco (unidades do palco), anima e some
function pxBit(x, y, w, h, color, frames, ms) {
  const el = document.createElement("div");
  el.className = "spell-bit";
  el.style.cssText = `width:${w}px;height:${h}px;background:${color};left:0;top:0;transform:translate(${x}px,${y}px)`;
  stage.appendChild(el);
  return new Promise(res => (el.animate(frames, { duration: ms, easing: "steps(6)" }).onfinish = () => { el.remove(); res(); }));
}
// Explosão de pixels saindo do ponto (ficam acesos e somem no fim)
function burst(at, color, n = 12, dist = 18, size = 3) {
  return Promise.all(Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const ex = Math.round(Math.cos(a) * dist), ey = Math.round(Math.sin(a) * dist);
    return pxBit(at.x - 1, at.y - 1, size, size, color, [
      { transform: `translate(${at.x - 1}px,${at.y - 1}px)`, opacity: 1 },
      { transform: `translate(${at.x + ex * 0.7}px,${at.y + ey * 0.7}px)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${at.x + ex}px,${at.y + ey}px)`, opacity: 0 },
    ], 420);
  }));
}
// Chamas subindo pelo inimigo (fogo)
function flames(at) {
  return Promise.all(Array.from({ length: 10 }, (_, i) => {
    const x = at.x - 14 + i * 3, y = at.y + 10 - (i % 3) * 3;
    const col = ["#d0455a", "#f2b84b", "#f3e7c9"][i % 3];
    return pxBit(x, y, 2, 4, col, [
      { transform: `translate(${x}px,${y}px)`, opacity: 0 },
      { transform: `translate(${x}px,${y - 8}px)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${x}px,${y - 20}px)`, opacity: 0 },
    ], 560 + (i % 4) * 60);
  }));
}
// Anel que se fecha sobre o inimigo (maldição)
function curseRing(at) {
  return Promise.all(Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const ox = Math.round(Math.cos(a) * 24), oy = Math.round(Math.sin(a) * 20);
    return pxBit(at.x, at.y, 3, 3, i % 2 ? "#9a7cc0" : "#463565", [
      { transform: `translate(${at.x + ox}px,${at.y + oy}px)`, opacity: 0 },
      { transform: `translate(${at.x + ox * 0.6}px,${at.y + oy * 0.6}px)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${at.x}px,${at.y}px)`, opacity: 0 },
    ], 600);
  }));
}
// Raio em zigue-zague caindo do alto até o inimigo
function lightning(to) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "spell-svg");
  svg.setAttribute("width", SW); svg.setAttribute("height", SH);
  svg.setAttribute("viewBox", `0 0 ${SW} ${SH}`);
  svg.setAttribute("shape-rendering", "crispEdges");
  // zigue-zague em volta da coluna do inimigo, terminando nele
  const cx = Math.round(to.x);
  let y = 0, i = 0, d = `M${cx} 0`;
  while (y < to.y) {
    y = Math.min(to.y, y + 5 + (i % 2) * 3);
    d += ` L${y === to.y ? cx : cx + (i % 2 ? 4 : -4) + (Math.random() < 0.5 ? -1 : 1)} ${y}`;
    i++;
  }
  for (const [w, col] of [[4, "#c97f2a"], [2, "#f2b84b"], [1, "#f3e7c9"]]) {
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d); path.setAttribute("fill", "none");
    path.setAttribute("stroke", col); path.setAttribute("stroke-width", w);
    svg.appendChild(path);
  }
  stage.appendChild(svg);
  return new Promise(res => (svg.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }, { opacity: 0 }],
    { duration: 380, easing: "steps(4)" }).onfinish = () => { svg.remove(); res(); }));
}

function heroCast(kinds = []) {
  if (window.TEST_MODE) return Promise.resolve();
  const main = kinds.includes("raio") ? "raio" : kinds[kinds.length - 1] || "base";
  const sp = SPELLS[main] || SPELLS.base;
  heroPose("cast");
  const from = { x: HERO_POS.x + CAST_HAND.x, y: HERO_POS.y + CAST_HAND.y };
  const er = enemyCanvas;
  const to = {
    x: parseFloat(enemyWrap.style.left) + er.width / 2,
    y: parseFloat(enemyWrap.style.top) + er.height * 0.45,
  };
  const bolt = document.createElement("div");
  bolt.className = "bolt";
  bolt.style.setProperty("--bolt", sp.c);
  bolt.style.setProperty("--bolt-halo", sp.halo);
  bolt.style.background = sp.core;
  stage.appendChild(bolt);
  // Fogo deixa brasas pelo caminho
  const embers = kinds.includes("fogo") ? setInterval(() => {
    const m = new DOMMatrix(getComputedStyle(bolt).transform);
    pxBit(m.e, m.f, 1, 1, Math.random() < 0.5 ? "#f2b84b" : "#d0455a", [
      { transform: `translate(${m.e}px,${m.f}px)`, opacity: 1 },
      { transform: `translate(${m.e}px,${m.f + 6}px)`, opacity: 0 }], 300);
  }, 40) : null;
  const anim = bolt.animate(
    [
      { transform: `translate(${from.x}px, ${from.y}px) scale(0.4)`, opacity: 0 },
      { transform: `translate(${from.x}px, ${from.y}px) scale(1.2)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${to.x}px, ${to.y}px) scale(1.6)`, opacity: 1 },
    ],
    { duration: 480, easing: "linear" }
  );
  return new Promise(res => {
    anim.onfinish = () => {
      bolt.remove();
      clearInterval(embers);
      // Impacto: explosão de pixels na cor da magia + o efeito de cada tipo
      burst(to, sp.c);
      if (kinds.includes("raio")) lightning(to);
      if (kinds.includes("maldicao")) {
        curseRing(to);
        enemyCanvas.animate([{ filter: "none" }, { filter: "brightness(0.5) sepia(1) hue-rotate(220deg) saturate(3)" },
          { filter: "none" }], { duration: 700 });
      }
      if (kinds.includes("fogo")) flames(to);
      if (kinds.includes("cura")) {   // drena: gotas vermelhas voltam do inimigo até você
        for (let i = 0; i < 5; i++) {
          const y0 = to.y + (i % 2 ? -4 : 4);
          pxBit(to.x, y0, 3, 3, i % 2 ? "#d0455a" : "#8c2236", [
            { transform: `translate(${to.x}px,${y0}px)`, opacity: 0 },
            { transform: `translate(${to.x}px,${y0}px)`, opacity: 1, offset: 0.1 + i * 0.1 },
            { transform: `translate(${from.x - 6}px,${from.y}px)`, opacity: 1, offset: 0.9 },
            { transform: `translate(${from.x - 6}px,${from.y}px)`, opacity: 0 }], 800);
        }
      }
      if (kinds.includes("escudo")) { // escudo azul translúcido na sua frente
        const sx = HERO_POS.x + 38, sy = HERO_POS.y - 2;
        const sh = document.createElement("div");
        sh.className = "spell-shield";
        sh.style.transform = `translate(${sx}px,${sy}px)`;
        stage.appendChild(sh);
        sh.animate([
          { transform: `translate(${sx}px,${sy}px) scaleY(0.1)`, opacity: 0 },
          { transform: `translate(${sx}px,${sy}px) scaleY(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${sx}px,${sy}px) scaleY(1)`, opacity: 1, offset: 0.75 },
          { transform: `translate(${sx}px,${sy}px) scaleY(1)`, opacity: 0 }],
          { duration: 900, easing: "steps(8)" }).onfinish = () => sh.remove();
      }
      setTimeout(() => heroPose("idle"), 350);
      res();
    };
  });
}

// ---------- Aposta Final (ultimate) ----------
// O apostador flutua, a masmorra escurece e 5 dados da maldição caem do alto
// no inimigo, um de cada vez. onImpact(valor, i) é chamado a cada dado que cai.

// Pose flutuando (PixelLab) nas 8 direções: ele gira até olhar para nós
// e completa a volta até encarar o inimigo de novo.
const ULT_DIRS = ["north-east", "east", "south-east", "south", "south-west", "west", "north-west", "north", "north-east"];
const ultFrame = d => `assets/hero/aposta/${d}.png`;
ULT_DIRS.forEach(d => loadImage(ultFrame(d)));
HERO_POSES.ultimate = ultFrame("north-east");
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- Efeitos da maldição (pixel art pontilhado num canvas próprio) ----------
// Desenhados num ImageData de SW×SH, ampliado como o resto do palco.
// level: 0..1 (o quanto a magia já carregou). Some com fade no final.

const FX_GREEN = [[0x8f, 0xd1, 0x6a], [0x4f, 0xa3, 0x5a], [0xd4, 0xf5, 0x9a], [0x6f, 0x8f, 0xc7]];
const fx = { canvas: null, ctx: null, img: null, level: 0, fade: 1, running: false, heroY: 0, heroX: 0 };

function fxStart() {
  const c = document.createElement("canvas");
  c.width = SW; c.height = SH;
  c.className = "px fx";
  stage.insertBefore(c, enemyWrap);               // atrás do inimigo e de você
  fx.canvas = c; fx.ctx = c.getContext("2d");
  fx.img = fx.ctx.createImageData(SW, SH);
  // camada da frente: aura translúcida que envolve o personagem
  const f = document.createElement("canvas");
  f.width = SW; f.height = SH;
  f.className = "px fx fx-front";
  stage.appendChild(f);                            // na frente de você
  fx.front = f; fx.fctx = f.getContext("2d");
  fx.fimg = fx.fctx.createImageData(SW, SH);
  fx.level = 0; fx.fade = 1; fx.running = true;
  requestAnimationFrame(fxLoop);
}

function fxStop() {
  fx.running = false;
  if (fx.canvas) fx.canvas.remove();
  if (fx.front) fx.front.remove();
  fx.canvas = null; fx.front = null;
}

// Pixel preenchido e translúcido, estilo magias de Super Nintendo (FF6):
// a intensidade vira poucos níveis de transparência (faixas de cor bem definidas)
// e o tom clareia no núcleo. O canvas soma luz sobre o fundo (mix-blend-mode: screen).
const FX_LEVELS = 4;
const FX_RAMP = [[0x4f, 0xa3, 0x5a], [0x8f, 0xd1, 0x6a], [0xc4, 0xee, 0x8a], [0xf0, 0xff, 0xd8]];
function fxDot(d, x, y, intensity, color, alpha = 200) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= SW || y >= SH) return;
  const q = Math.min(FX_LEVELS, Math.floor(intensity * FX_LEVELS + 0.15));   // 0..4
  if (q <= 0) return;
  const k = (y * SW + x) * 4;
  const a = Math.round((q / FX_LEVELS) * alpha);
  if (a <= d[k + 3]) return;                     // fica a camada mais forte
  const c = color || FX_RAMP[q - 1];             // sem cor fixa: rampa escuro → claro
  d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2];
  d[k + 3] = a;
}

function fxLoop(now) {
  if (!fx.running) return;
  const t = now / 1000, L = fx.level * fx.fade;
  const d = fx.img.data;
  d.fill(0);

  // 1) aurora boreal sobre o inimigo: cortinas verdes ondulando, do teto até ele
  const ex = parseFloat(enemyWrap.style.left) || 48, ey = parseFloat(enemyWrap.style.top) || 40;
  const ew = enemyCanvas.width || 48, eh = enemyCanvas.height || 48;
  const x0 = ex - 30, x1 = ex + ew + 30, yBottom = Math.min(SH, ey + eh + 10);   // até o chão
  for (let x = x0; x < x1; x++) {
    const edge = Math.min(1, (x - x0) / 14, (x1 - x) / 14);            // some nas bordas
    const wave = 0.5 + 0.5 * Math.sin(x * 0.23 + t * 2.1) * Math.sin(x * 0.07 - t * 1.3);
    const top = 1 + 7 * (0.5 + 0.5 * Math.sin(x * 0.11 + t * 1.7));     // borda de cima ondulada, bem no alto
    for (let y = top; y < yBottom; y++) {
      const v = (y - top) / (yBottom - top);                             // 0 em cima, 1 embaixo
      // acende rápido no alto e continua forte até embaixo (só um pouco mais fraco no chão)
      const fall = v < 0.15 ? v / 0.15 : 1 - ((v - 0.15) / 0.85) * 0.45;
      const I = Math.min(1, L * edge * wave * fall * 1.6);
      if (I <= 0.02) continue;
      fxDot(d, x, y, I, null, 235);
    }
  }

  // 2) aura atrás de você: brilho que cresce com a carga
  const hx = HERO_POS.x + 32 + fx.heroX, hy = HERO_POS.y + 20 + fx.heroY;
  const R = 10 + 26 * L + Math.sin(t * 6) * 2;      // grande o bastante para aparecer em volta dele
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
    const dist = Math.hypot(x, y) / R;
    if (dist > 1) continue;
    const I = Math.min(1, L * (1 - dist) * 1.8);
    fxDot(d, hx + x, hy + y, I, null, 240);
  }

  fx.ctx.putImageData(fx.img, 0, 0);

  // 4) aura na frente de você: um "casulo" de energia translúcido e claro,
  //    no formato do corpo (oval alto), mais forte nas bordas e ondulando
  const fd = fx.fimg.data;
  fd.fill(0);
  const ax = 22 + 3 * L, ay = 30 + 3 * L;
  for (let y = -ay - 2; y <= ay + 2; y++) for (let x = -ax - 2; x <= ax + 2; x++) {
    const wob = 1 + 0.06 * Math.sin(Math.atan2(y, x) * 5 + t * 4);
    const r = Math.hypot(x / ax, y / ay) / wob;
    if (r > 1) continue;
    const rim = Math.max(0, (r - 0.55) / 0.45);         // borda mais forte, meio bem leve
    const I = Math.min(1, L * (0.35 + 0.65 * rim));
    fxDot(fd, hx + x, hy + 8 + y, I, null, 110);       // bem translúcido
  }
  fx.fctx.putImageData(fx.fimg, 0, 0);
  requestAnimationFrame(fxLoop);
}

// Anima um valor de fx ao longo do tempo
function fxTween(key, to, ms) {
  const from = fx[key], start = performance.now();
  return new Promise(res => {
    (function step(now) {
      const k = Math.min(1, (now - start) / ms);
      fx[key] = from + (to - from) * k;
      k < 1 ? requestAnimationFrame(step) : res();
    })(start);
  });
}

async function heroUltimate(values, onImpact) {
  if (window.TEST_MODE) { values.forEach((v, i) => onImpact(v, i)); return; }
  // garante que todos os quadros do giro já estão baixados e decodificados
  // (no celular, com a rede lenta, os quadros eram pulados antes de aparecer)
  await Promise.all(ULT_DIRS.map(async d => {
    const img = await loadImage(ultFrame(d));
    if (img && img.decode) { try { await img.decode(); } catch (e) {} }
  }));

  // 1) sobe flutuando enquanto a cena escurece; os efeitos começam a carregar
  heroPose("ultimate");
  // sobe e se afasta um pouco da borda esquerda (para nada da pose ficar cortado)
  const float = heroImg.animate(
    [{ transform: "translate(0, 0)" }, { transform: "translate(8px, -8px)" }],
    { duration: 700, easing: "ease-out", fill: "forwards" }
  );
  const dark = document.createElement("div");
  dark.className = "darken";
  stage.insertBefore(dark, enemyWrap);
  dark.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, fill: "forwards" });
  fxStart();
  fxTween("heroY", -8, 700);
  fxTween("heroX", 8, 700);
  const charging = fxTween("level", 1, 3200);     // carrega durante todo o giro
  await sleep(500);

  // 2) gira devagar: para de frente para nós e volta a encarar o inimigo
  for (let i = 1; i < ULT_DIRS.length; i++) {
    heroImg.src = ultFrame(ULT_DIRS[i]);
    await sleep(ULT_DIRS[i] === "south" ? 1000 : 170);
  }
  await charging;
  await sleep(250);

  // 3) os dados caem, ainda dentro da aurora
  const ex = parseFloat(enemyWrap.style.left), ey = parseFloat(enemyWrap.style.top);
  const ew = enemyCanvas.width, eh = enemyCanvas.height;
  for (let i = 0; i < values.length; i++) {
    const die = document.createElement("div");
    die.className = "fall-die";
    die.innerHTML = iconSVG(null, cursedDie(values[i]));
    stage.appendChild(die);
    const x = ex + ew / 2 - 5 + (i - 2) * 7 + Math.round(Math.random() * 4 - 2);
    const y = ey + eh * 0.35 + Math.round(Math.random() * 6);
    const spin = (Math.random() < 0.5 ? -1 : 1) * 360;
    await die.animate(
      [{ transform: `translate(${x}px, -14px) rotate(0deg)` },
       { transform: `translate(${x}px, ${y}px) rotate(${spin}deg)` }],
      { duration: 300, easing: "ease-in", fill: "forwards" }
    ).finished;
    onImpact(values[i], i);
    die.animate(
      [{ transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 },
       { transform: `translate(${x}px, ${y - 4}px) scale(1.3)`, opacity: 0 }],
      { duration: 350, easing: "ease-out", fill: "forwards" }
    ).onfinish = () => die.remove();
    await sleep(170);
  }

  // 4) a aurora e a aura se dissipam
  await sleep(300);
  await Promise.all([fxTween("fade", 0, 600), fxTween("heroY", 0, 600), fxTween("heroX", 0, 600)]);
  fxStop();
  dark.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).onfinish = () => dark.remove();
  float.cancel();
  heroPose("idle");
}
