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
function heroCast(color = "#8fd16a") {
  if (window.TEST_MODE) return Promise.resolve();
  heroPose("cast");
  const from = { x: HERO_POS.x + CAST_HAND.x, y: HERO_POS.y + CAST_HAND.y };
  const er = enemyCanvas;
  const to = {
    x: parseFloat(enemyWrap.style.left) + er.width / 2,
    y: parseFloat(enemyWrap.style.top) + er.height * 0.45,
  };
  const bolt = document.createElement("div");
  bolt.className = "bolt";
  bolt.style.setProperty("--bolt", color);
  stage.appendChild(bolt);
  const dx = to.x - from.x, dy = to.y - from.y;
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
  fx.level = 0; fx.fade = 1; fx.running = true;
  requestAnimationFrame(fxLoop);
}

function fxStop() {
  fx.running = false;
  if (fx.canvas) fx.canvas.remove();
  fx.canvas = null;
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

  // 3) círculo mágico em volta de você: anel translúcido com traços girando
  const rr = 30 + 4 * L;
  for (let a = 0; a < Math.PI * 2; a += 0.012) {
    const dash = Math.sin(a * 8 - t * 5) > -0.3;
    const I = L * (dash ? 1 : 0.4);
    const cy = hy + 6;
    fxDot(d, hx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7, I, FX_GREEN[2], 230);
    fxDot(d, hx + Math.cos(a) * (rr - 2), cy + Math.sin(a) * (rr - 2) * 0.7, I * 0.7, FX_GREEN[1], 200);
    fxDot(d, hx + Math.cos(a) * (rr - 5), cy + Math.sin(a) * (rr - 5) * 0.7, I * 0.35, FX_GREEN[0], 160);
  }

  // 4) faíscas verdes subindo em volta de você
  for (let k = 0; k < 18; k++) {
    const phase = (t * 0.6 + k * 0.137) % 1;
    const sx = hx + Math.sin(k * 12.9) * (14 + 12 * L);
    const sy = hy + 26 - phase * 60;
    fxDot(d, sx, sy, L * (1 - phase) * 1.2, FX_GREEN[2], 255);
  }

  fx.ctx.putImageData(fx.img, 0, 0);
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
