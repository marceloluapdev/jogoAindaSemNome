// Cidade (protótipo): praça vista de cima em 3/4 (estilo EarthBound), tocar para andar.
//
// - Taverna (a dona na porta), casinha do Bartô, fonte, árvores — desenhados em código (provisório).
// - Portal do azar: entra e faz RUN_FIGHTS lutas (o combate de sempre); vencendo ou perdendo, volta à praça.
// - Perder: "a Mesa reembaralha" e Sid acorda na praça. Cada derrota afrouxa a maldição no amor:
//   a dona vai ficando menos grossa (ver HISTORIA.md "Azar no amor").
// Falas usam o mesmo motor do tutorial (story.js: playScene).

const CITY_ON = !window.TEST_MODE || window.TEST_CITY;
const RUN_FIGHTS = 3;
const DEFEATS_KEY = "jasn.derrotas";

const CW = 220, CH = 330;          // tamanho do mundo (pixels lógicos)
const cityEl = document.createElement("div");
cityEl.id = "city";
cityEl.hidden = true;
cityEl.innerHTML = `<canvas class="px"></canvas><p class="city-hint"></p>`;
document.body.appendChild(cityEl);
const cityCanvas = cityEl.querySelector("canvas");
const cx = cityCanvas.getContext("2d");
let viewW = 180, viewH = 320, viewK = 2;

// ---------- Imagens ----------
const IMG = {};
["south", "north", "east", "west"].forEach(d => { IMG["dona_" + d] = cityImage(`assets/npc/dona/${d}.png`); });
IMG.sid_front = cityImage("assets/hero/apostador_frente.png");
IMG.sid_back = cityImage("assets/hero/apostador_costas.png");
function cityImage(src) { const i = new Image(); i.src = src; return i; }

// Bartô provisório (até chegar o do PixelLab), desenhado em código no mesmo tamanho de pixel
const bartoCanvas = document.createElement("canvas");
bartoCanvas.width = 30; bartoCanvas.height = 52;
(() => {
  const g = bartoCanvas.getContext("2d");
  const p = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const k = "#120d1a", skin = "#c9b48f", skinD = "#a86a33", coat = "#7a4a1c", coatD = "#4a2c10".replace("4a2c10", "7a4a1c"),
        beard = "#f3e7c9", beardD = "#c9b48f", pants = "#2e2347", red = "#d0455a";
  // pernas e botas
  p(k, 9, 40, 5, 12); p(pants, 10, 40, 3, 10); p(k, 16, 40, 5, 12); p(pants, 17, 40, 3, 10);
  p(k, 8, 49, 7, 3); p(k, 15, 49, 7, 3);
  // casaco
  p(k, 5, 22, 20, 21); p(coat, 6, 23, 18, 19); p("#a86a33", 6, 23, 2, 19);
  p(k, 14, 23, 1, 19);
  // frascos vazios no cinto (pista: alquimista)
  p(k, 6, 34, 18, 2); p("#4fa35a", 8, 36, 2, 3); p("#6f8fc7", 11, 36, 2, 3); p(red, 18, 36, 2, 3);
  // braço com a caneca
  p(k, 23, 26, 6, 9); p(coat, 24, 27, 4, 7); p(k, 24, 33, 6, 7); p("#c9b48f", 25, 34, 4, 5); p("#f2b84b", 25, 34, 4, 1);
  // cabeça careca
  p(k, 8, 4, 14, 14); p(skin, 9, 5, 12, 12); p("#f3e7c9", 11, 6, 3, 2); p(skinD, 9, 14, 12, 3);
  p(k, 11, 10, 2, 2); p(k, 17, 10, 2, 2); p(red, 14, 12, 2, 2);  // olhos e nariz vermelho
  // barba
  p(k, 7, 14, 16, 12); p(beard, 8, 15, 14, 10); p(beardD, 8, 22, 14, 3); p(k, 13, 17, 4, 1);
  p(k, 11, 9, 2, 3); p(k, 17, 9, 2, 3); p(red, 14, 12, 2, 2);   // olhos (por cima de tudo)
})();

// ---------- Mundo ----------
// Retângulos sólidos (x, y, w, h) em que não se anda
const SOLIDS = [
  [14, 18, 132, 94],     // taverna
  [156, 44, 56, 64],     // casa do Bartô
  [96, 178, 30, 22],     // fonte
  [0, 0, CW, 16],        // limites
  [0, 0, 6, CH], [CW - 6, 0, 6, CH], [0, CH - 4, CW, 4],
];
const TREES = [[16, 150], [204, 150], [200, 250], [18, 312], [196, 318]];
const PORTAL = { x: 62, y: 270, r: 12 };
const DOOR = { x: 72, y: 112 };

const npcs = [
  { id: "dona", x: 104, y: 128, img: () => IMG.dona_south, w: 64, h: 64, talk: () => donaScene() },
  { id: "bebado", x: 184, y: 128, img: () => bartoCanvas, w: 30, h: 52, talk: () => bartoScene() },
];

const sid = { x: 110, y: 240, tx: null, ty: null, dir: "down", t: 0, then: null };

// ---------- Desenho ----------
const C = {
  ink: "#120d1a", night: "#1e1630", dusk: "#2e2347", violet: "#463565", lilac: "#9a7cc0",
  amber: "#f2b84b", amberD: "#c97f2a", bone: "#f3e7c9", boneD: "#c9b48f", red: "#d0455a", redD: "#8c2236",
  green: "#4fa35a", greenD: "#2f6b3f", steel: "#6f8fc7", steelL: "#c3d6f2", wood: "#7a4a1c", woodL: "#a86a33",
};
const r = (c, x, y, w = 1, h = 1) => { cx.fillStyle = c; cx.fillRect(Math.round(x), Math.round(y), w, h); };

function drawGround() {
  r(C.dusk, 0, 0, CW, CH);
  // pedras do calçamento
  for (let y = 0; y < CH; y += 6)
    for (let x = (y / 6) % 2 ? -5 : 0; x < CW; x += 10) { r(C.violet, x + 1, y + 1, 8, 4); r(C.night, x + 1, y + 5, 8, 1); }
  // grama nas laterais
  r(C.greenD, 0, 130, 10, CH - 130); r(C.greenD, CW - 10, 130, 10, CH - 130);
}

function drawTavern() {
  const x = 14, y = 18, w = 132, h = 94;
  r(C.ink, x - 1, y - 1, w + 2, h + 2);
  r(C.wood, x, y + 22, w, h - 22);
  for (let i = x + 6; i < x + w; i += 10) r(C.night, i, y + 22, 1, h - 22);
  // telhado
  r(C.redD, x - 4, y, w + 8, 24); r(C.red, x - 4, y, w + 8, 3);
  for (let i = 0; i < 4; i++) r(C.ink, x - 4, y + 6 + i * 5, w + 8, 1);
  // placa
  r(C.ink, x + 40, y + 28, 52, 12); r(C.woodL, x + 41, y + 29, 50, 10);
  cx.fillStyle = C.ink; cx.font = "8px monospace"; cx.textBaseline = "top";
  cx.fillText("TAVERNA", x + 47, y + 30);
  // janelas com luz
  [[x + 10, y + 46], [x + 104, y + 46]].forEach(([wx, wy]) => { r(C.ink, wx - 1, wy - 1, 20, 16); r(C.amber, wx, wy, 18, 14); r(C.amberD, wx + 8, wy, 1, 14); r(C.amberD, wx, wy + 7, 18, 1); });
  // porta
  r(C.ink, DOOR.x - 1, y + h - 30, 18, 30); r(C.night, DOOR.x, y + h - 29, 16, 29); r(C.amberD, DOOR.x + 12, y + h - 15, 2, 2);
}

function drawBartoHouse() {
  const x = 156, y = 44, w = 56, h = 64;
  r(C.ink, x - 1, y - 1, w + 2, h + 2);
  r(C.boneD, x, y + 18, w, h - 18);
  r(C.violet, x - 3, y, w + 6, 20); r(C.lilac, x - 3, y, w + 6, 2);
  r(C.ink, x + 20, y + h - 22, 14, 22); r(C.wood, x + 21, y + h - 21, 12, 21);
  // frascos na janela (pista: alquimista)
  r(C.ink, x + 4, y + 26, 12, 10); r(C.night, x + 5, y + 27, 10, 8);
  r(C.green, x + 6, y + 30, 2, 4); r(C.red, x + 9, y + 31, 2, 3); r(C.steel, x + 12, y + 29, 2, 5);
}

function drawFountain(t) {
  const x = 96, y = 178;
  r(C.ink, x - 1, y + 4, 32, 20); r(C.steel, x, y + 5, 30, 18); r(C.steelL, x, y + 5, 30, 2);
  r(C.night, x + 3, y + 8, 24, 12); r(C.steel, x + 4, y + 9, 22, 10);
  const f = Math.floor(t / 250) % 2;
  r(C.steelL, x + 14, y - 4 + f, 2, 10); r(C.bone, x + 10 + f * 2, y + 10, 2, 1); r(C.bone, x + 18 - f * 2, y + 12, 2, 1);
}

function drawTree(x, y) {
  r(C.wood, x - 2, y - 6, 4, 6);
  r(C.ink, x - 9, y - 22, 18, 17); r(C.greenD, x - 8, y - 21, 16, 15); r(C.green, x - 6, y - 20, 9, 6);
}

// Portal do azar: redemoinho verde em degraus (estilo das magias)
function drawPortal(t) {
  const { x, y } = PORTAL;
  const a = t / 300;
  cx.globalAlpha = 0.5; r(C.greenD, x - 14, y - 4, 28, 8); cx.globalAlpha = 1;
  for (let ring = 3; ring >= 0; ring--) {
    const rad = 4 + ring * 3;
    const col = [C.bone, "#c4ee8a", "#8fd16a", C.green][ring];
    for (let k = 0; k < 10; k++) {
      const ang = a * (ring % 2 ? 1 : -1) + (k / 10) * Math.PI * 2;
      r(col, x + Math.cos(ang) * rad - 1, y - 8 + Math.sin(ang) * rad * 0.6 - 1, 2, 2);
    }
  }
}

function spriteAt(img, x, y, w, h, flip, scale = 1, bob = 0) {
  if (!img || (img.complete === false)) return;
  const dw = w * scale, dh = h * scale;
  cx.save();
  if (flip) { cx.translate(Math.round(x), 0); cx.scale(-1, 1); cx.drawImage(img, Math.round(-dw / 2), Math.round(y - dh + bob), dw, dh); }
  else cx.drawImage(img, Math.round(x - dw / 2), Math.round(y - dh + bob), dw, dh);
  cx.restore();
}

function drawCity(t) {
  const camX = Math.max(0, Math.min(CW - viewW, sid.x - viewW / 2));
  const camY = Math.max(0, Math.min(CH - viewH, sid.y - viewH / 2));
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.fillStyle = C.ink; cx.fillRect(0, 0, viewW, viewH);
  cx.setTransform(1, 0, 0, 1, -Math.round(camX), -Math.round(camY));
  drawGround();
  drawTavern();
  drawBartoHouse();
  drawPortal(t);
  // o que fica na frente de quê: ordenado pelo pé (y)
  const things = [
    ...TREES.map(([x, y]) => ({ y, draw: () => drawTree(x, y) })),
    { y: 200, draw: () => drawFountain(t) },
    ...npcs.map(n => ({ y: n.y, draw: () => {
      const bob = Math.floor(t / 600 + n.x) % 2;   // respira
      spriteAt(n.img(), n.x, n.y + 1, n.w, n.h, false, n.scale || 1, bob);
    } })),
    { y: sid.y, draw: () => {
      const walking = sid.tx !== null;
      const bob = walking ? Math.floor(t / 130) % 2 : Math.floor(t / 600) % 2;
      const img = sid.dir === "up" ? IMG.sid_back : IMG.sid_front;
      spriteAt(img, sid.x, sid.y + 2, 64, 64, sid.dir === "left", 1, -bob);
    } },
  ].sort((a, b) => a.y - b.y);
  things.forEach(o => o.draw());
  cityCanvas.dataset.cam = `${camX},${camY}`;
}

// ---------- Andar ----------
const SID_SPEED = 55;   // pixels lógicos por segundo
function blocked(x, y) {
  return SOLIDS.some(([sx, sy, sw, sh]) => x > sx - 5 && x < sx + sw + 5 && y > sy && y < sy + sh + 3)
      || npcs.some(n => Math.abs(x - n.x) < 9 && Math.abs(y - n.y) < 5);
}
function stepSid(dt) {
  if (sid.tx === null) return;
  const dx = sid.tx - sid.x, dy = sid.ty - sid.y;
  const d = Math.hypot(dx, dy);
  if (Math.abs(dx) > Math.abs(dy)) sid.dir = dx > 0 ? "right" : "left";
  else sid.dir = dy > 0 ? "down" : "up";
  const step = SID_SPEED * dt;
  if (d <= step) { arrive(); return; }
  const nx = sid.x + (dx / d) * step, ny = sid.y + (dy / d) * step;
  // anda; se bater, escorrega pelo eixo livre; se travar, para
  if (!blocked(nx, ny)) { sid.x = nx; sid.y = ny; }
  else if (!blocked(nx, sid.y)) sid.x = nx;
  else if (!blocked(sid.x, ny)) sid.y = ny;
  else arrive();
  // encostou no portal: entra
  if (Math.hypot(sid.x - PORTAL.x, sid.y - PORTAL.y) < PORTAL.r) { sid.tx = sid.ty = null; sid.then = null; enterPortal(); }
}
function arrive() {
  sid.tx = sid.ty = null;
  const then = sid.then; sid.then = null;
  if (then) then();
}
function walkTo(x, y, then) {
  sid.tx = Math.max(8, Math.min(CW - 8, x));
  sid.ty = Math.max(20, Math.min(CH - 6, y));
  sid.then = then || null;
}

let cityRunning = false, cityBusy = false, lastT = 0;
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
  viewK = Math.max(1, Math.floor(Math.min(vw / 170, vh / 260)));
  viewW = Math.min(CW, Math.ceil(vw / viewK));
  viewH = Math.min(CH, Math.ceil(vh / viewK));
  cityCanvas.width = viewW; cityCanvas.height = viewH;
  cityCanvas.style.width = `${viewW * viewK}px`;
  cityCanvas.style.height = `${viewH * viewK}px`;
}
window.addEventListener("resize", () => { if (cityRunning) fitCity(); });

// Toque: pessoa → vai até ela e conversa; porta → fala da dona; portal → entra; chão → anda
cityCanvas.addEventListener("click", e => {
  if (cityBusy) return;
  const rect = cityCanvas.getBoundingClientRect();
  const [camX, camY] = (cityCanvas.dataset.cam || "0,0").split(",").map(Number);
  const wx = (e.clientX - rect.left) / viewK + camX;
  const wy = (e.clientY - rect.top) / viewK + camY;
  const npc = npcs.find(n => Math.abs(wx - n.x) < 14 && wy > n.y - 56 && wy < n.y + 4);
  if (npc) return walkTo(npc.x, npc.y + 14, () => { sid.dir = "up"; talkTo(npc); });
  if (Math.abs(wx - (DOOR.x + 8)) < 12 && wy > 82 && wy < 116) return walkTo(DOOR.x + 8, 122, () => { sid.dir = "up"; doorScene(); });
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
  const lines = DONA_LINES[Math.min(defeats(), DONA_LINES.length - 1)];
  return playScene(lines.map(text => ({ say: "dona", text })));
}
const BARTO_LINES = [
  ["Tá vendo aquele redemoinho verde? É sorte vazando do mundo, forasteiro.", "Quem entra volta mais rico... ou volta diferente."],
  ["Dizem que tem gente que joga com a gente lá de cima. Eu só jogo com quem paga a bebida."],
  ["Já misturei poções, sabia? Antes dos dados. Antes de tudo."],
];
let bartoIdx = 0;
function bartoScene() {
  const lines = BARTO_LINES[bartoIdx++ % BARTO_LINES.length];
  return playScene(lines.map(text => ({ say: "bebado", text })));
}
async function doorScene() {
  cityBusy = true;
  await playScene([{ say: "dona", text: "Fechado. Pra você, pelo menos até pagar o que deve." }]);
  cityBusy = false;
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
  sid.x = PORTAL.x + 26; sid.y = PORTAL.y; sid.dir = "down";
  cityBusy = true;
  await playScene([{ narra: won
    ? "O portal se fecha atrás de Sid. Os dados no chapéu ainda estão quentes."
    : "A Mesa reembaralha. Sid acorda na praça, com o gosto amargo de quem perdeu... de novo." }]);
  cityBusy = false;
};

function enterCity() {
  if (!CITY_ON) return false;
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
