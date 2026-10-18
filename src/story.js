// História: caixa de diálogo com retrato, tela preta e o roteiro do tutorial.
//
// As cenas são DADOS (listas de passos), separadas da apresentação — a mesma fala
// servirá depois para os mapinhas estilo EarthBound (ver GAME.md "História: fases").
// Lore, personagens e falas aprovadas: docs/HISTORIA.md.
//
// Passos de uma cena:
//   { black: ["linha", ...] }        tela preta com frases (toque para seguir)
//   { say: "dona", text: "..." }     fala com retrato
//   { narra: "..." }                 narração (sem retrato)
//   { run: async () => {...} }       código (luta, trocar cenário, dar dado...)

const TUTORIAL_KEY = "jasn.tutorial";

// ---------- Personagens e retratos (provisórios até chegarem os do PixelLab) ----------

const SPEAKERS = {
  sid:    { name: "Sid" },
  dona:   { name: "Dona da taverna" },
  bebado: { name: "Bartô" },
};

const PW = 40, PH = 36;   // retrato em pixels lógicos (ampliado 2× na tela)

// Sid: recorte da cabeça do sprite de frente do PixelLab
const sidImg = new Image();
sidImg.src = "assets/hero/apostador_frente.png";

// Retrato provisório desenhado em código (rosto simples na paleta)
function drawPlaceholderFace(ctx, spec) {
  const p = (c, x, y, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const ink = "#120d1a", skin = "#c9b48f", skinD = "#a86a33";
  // roupa
  p(ink, 7, 27, 26, 9); p(spec.cloth, 8, 28, 24, 8);
  if (spec.apron) { p(ink, 15, 29, 10, 7); p("#f3e7c9", 16, 30, 8, 6); }
  // pescoço e rosto
  p(ink, 16, 22, 8, 6); p(skinD, 17, 22, 6, 6);
  p(ink, 11, 7, 18, 18); p(skin, 12, 8, 16, 16); p(skinD, 12, 20, 16, 4);
  // cabelo
  if (spec.hair) {
    p(ink, 10, 4, 20, 6); p(spec.hair, 11, 5, 18, 5);
    if (spec.longHair) { p(ink, 9, 8, 4, 20); p(spec.hair, 10, 8, 2, 19); p(ink, 27, 8, 4, 20); p(spec.hair, 28, 8, 2, 19); }
  } else {
    p(skin, 12, 6, 16, 2);   // careca
  }
  if (spec.beard) { p(ink, 12, 18, 16, 7); p(spec.beard, 13, 18, 14, 6); p(skinD, 18, 19, 4, 1); }
  // olhos e boca
  p(ink, 15, 13, 3, 2); p(ink, 22, 13, 3, 2);
  if (spec.blush) { p("#d0455a", 13, 16, 2, 1); p("#d0455a", 25, 16, 2, 1); }
  if (!spec.beard) p(ink, 18, 19, 4, 1);
}

const PORTRAIT_FACES = {
  dona:   { cloth: "#4fa35a", hair: "#8c2236", longHair: true, apron: true },
  bebado: { cloth: "#7a4a1c", beard: "#c9b48f", blush: true },
};

function drawPortrait(canvas, who) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, PW, PH);
  ctx.fillStyle = "#2e2347"; ctx.fillRect(0, 0, PW, PH);
  if (who === "sid") {
    const draw = () => { ctx.drawImage(sidImg, 12, 2, PW, PH, 0, 0, PW, PH); };
    if (sidImg.complete) draw(); else sidImg.onload = draw;
  } else if (PORTRAIT_FACES[who]) {
    drawPlaceholderFace(ctx, PORTRAIT_FACES[who]);
  }
}

// ---------- Caixa de diálogo e tela preta ----------

const talk = document.createElement("div");
talk.id = "talk";
talk.hidden = true;
talk.innerHTML = `<canvas class="portrait px" width="${PW}" height="${PH}"></canvas>
  <div class="talk-body"><b class="talk-name"></b><p class="talk-text"></p></div><span class="talk-next">▼</span>`;
document.body.appendChild(talk);

const black = document.createElement("div");
black.id = "black";
black.hidden = true;
document.body.appendChild(black);

const typeDelay = () => (window.TEST_MODE ? 0 : 22);

// Mostra um texto letra a letra; toque completa; toque de novo segue
function showLine({ who, text, narra }) {
  return new Promise(res => {
    const portrait = talk.querySelector(".portrait");
    const nameEl = talk.querySelector(".talk-name");
    const textEl = talk.querySelector(".talk-text");
    talk.classList.toggle("narra", !!narra);
    portrait.hidden = !!narra;
    nameEl.textContent = narra ? "" : SPEAKERS[who].name;
    if (!narra) drawPortrait(portrait, who);
    talk.hidden = false;
    let i = 0, timer = null;
    const done = () => { clearInterval(timer); timer = null; textEl.textContent = text; talk.classList.add("ready"); };
    talk.classList.remove("ready");
    textEl.textContent = "";
    if (typeDelay()) timer = setInterval(() => { textEl.textContent = text.slice(0, ++i); if (i >= text.length) done(); }, typeDelay());
    else done();
    talk.onclick = () => {
      if (timer) return done();
      talk.onclick = null;
      res();
    };
  });
}

function showBlack(lines) {
  return new Promise(res => {
    black.innerHTML = lines.map((l, i) => `<p style="animation-delay:${window.TEST_MODE ? 0 : 400 + i * 1400}ms">${l}</p>`).join("") +
      `<span class="talk-next">▼</span>`;
    black.hidden = false;
    const ready = window.TEST_MODE ? 0 : 400 + lines.length * 1400;
    const t0 = Date.now();
    black.onclick = () => {
      if (Date.now() - t0 < ready) return;
      black.onclick = null;
      black.animate([{ opacity: 1 }, { opacity: 0 }], { duration: window.TEST_MODE ? 1 : 600 }).onfinish = () => {
        black.hidden = true;
        res();
      };
    };
  });
}

async function playScene(steps) {
  for (const s of steps) {
    if (s.black) await showBlack(s.black);
    else if (s.say) await showLine({ who: s.say, text: s.text });
    else if (s.narra) await showLine({ narra: true, text: s.narra });
    else if (s.run) { talk.hidden = true; await s.run(); }
  }
  talk.hidden = true;
}

// ---------- Ajudas do roteiro ----------

const sleepS = ms => new Promise(r => setTimeout(r, window.TEST_MODE ? 0 : ms));

// Modo "fora de combate": esconde inimigo/vida dele e trava o Atacar
function peace(on) {
  document.querySelector("main").classList.toggle("peace", on);
  window.LOCK_ATTACK = on;
  if (typeof render === "function") render();
}

// Jogo de dados na taverna: só Rolar; a sorte do Sid garante uma trinca
function tavernGame() {
  return new Promise(res => {
    MAX_ROLLS = 1;
    startPlayerTurn();
    window.STORY_ROLLS = [4, 4, 4];
    log("Bartô empurra os dados para você.");
    const check = setInterval(() => {
      if (dice[0] !== null && !rolling) { clearInterval(check); setTimeout(res, window.TEST_MODE ? 0 : 900); }
    }, 100);
  });
}

// Os dados no chapéu brilham e um lodo sobe do porão
async function slimeRises(def) {
  heroImg.animate([{ filter: "none" }, { filter: "brightness(1.8) drop-shadow(0 0 2px #8fd16a)" }, { filter: "none" }],
    { duration: 900, iterations: 2 });
  await sleepS(900);
  enemy = { name: def.name, maxHp: def.hp, hp: def.hp, atk: def.atk, sprite: SLIME, foot: 38, tint: def.tint || null };
  setEnemySprite(enemy);
  enemyGone(false);
  enemyWrap.animate([{ transform: "translateY(24px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
    { duration: window.TEST_MODE ? 1 : 700, easing: "steps(6)" });
  await sleepS(800);
}

function fight(def, rolls) {
  return new Promise(res => {
    peace(false);
    startStoryFight(def, { rolls, onWin: res });
  });
}

// ---------- Tutorial ----------

const LODO_1 = { name: "Lodo do Porão", hp: 12, atk: [1, 2] };
const LODO_2 = { name: "Lodo do Porão", hp: 24, atk: [3, 5] };
let hintedDefense = false;

// A dona explica a reserva na 1ª vez que a defesa aparece
window.storyHook = async ev => {
  if (ev !== "defesa" || hintedDefense || !tutorialRunning) return;
  hintedDefense = true;
  await playScene([{ say: "dona", text: "Os dados que você não usar... guarda pra se proteger, Sid!" }]);
};

let tutorialRunning = false;

async function runTutorial() {
  tutorialRunning = true;
  hintedDefense = false;
  // estado inicial: taverna, 3 dados, sem inimigo
  over = false; reserve = 0; charge = 0; shield = 0; level = 0;
  player.hp = player.maxHp;
  enemy = { name: "", hp: 1, maxHp: 1, atk: [0, 0], intent: 0 };   // ninguém ainda (escondido)
  setBackdrop("taverna");
  enemyGone(true);
  setDiceCount(3);
  peace(true);
  log("");
  render();

  await playScene([
    { black: ["Deus não joga dados.", "Os anjos jogam por ele."] },
    { say: "bebado", text: "Mais uma, forasteiro. Quem fizer a maior combinação leva." },
    { say: "sid", text: "É a sua última moeda, Bartô." },
    { say: "bebado", text: "A última... de hoje. Rola aí." },
    { run: tavernGame },
    { say: "bebado", text: "Trinca?! De novo?!" },
    { say: "bebado", text: "Sorte no jogo, azar no amor, hein?" },
    { say: "sid", text: "..." },
    { run: () => slimeRises(LODO_1) },
    { say: "dona", text: "Sid! De novo não!" },
    { say: "sid", text: "Dessa vez eu juro que não fui eu." },
    { narra: "Escolho os dados que valem a pena... ou jogo todos de uma vez." },
    { run: () => fight(LODO_1, 1) },
    { run: () => { peace(true); return sleepS(400); } },
    { say: "bebado", text: "Tem mais um saindo do porão!" },
    { run: () => slimeRises(LODO_2) },
  ]);
  if (!hintedDefense) {
    hintedDefense = true;
    await playScene([{ say: "dona", text: "Sid! Os dados que você não usar, guarda pra se proteger!" }]);
  }
  await fight(LODO_2, 2);
  peace(true);
  reserve = 0;
  render();

  await playScene([
    { say: "dona", text: "Toma. Você vai precisar." },
    { narra: "Ela se aproxima com um dado na mão... e tropeça numa caneca. A bandeja inteira vai ao chão." },
    { say: "sid", text: "É... acontece." },
    { say: "dona", text: "Era de alguém que também tinha sorte demais." },
    { run: async () => { setDiceCount(4); render(); floatText($("player-hp"), "+1 dado", "charge"); await sleepS(900); } },
    { say: "dona", text: "Agora você me deve uma." },
    { narra: "O rastro do lodo desce pelo porão. Sid ajeita o chapéu e vai atrás." },
  ]);

  tutorialRunning = false;
  try { localStorage.setItem(TUTORIAL_KEY, "feito"); } catch (e) {}
  peace(false);
  setBackdrop("masmorra");
  restart();
}

function tutorialDone() {
  try { return localStorage.getItem(TUTORIAL_KEY) === "feito"; } catch (e) { return false; }
}

// Chamado no fim de combat.js. true = a história assumiu o começo.
window.startGame = () => {
  const force = /[?&]tutorial\b/.test(location.search);
  if (window.TEST_MODE && !window.TEST_TUTORIAL) return false;
  if (tutorialDone() && !force) return false;
  runTutorial();
  return true;
};

// Derrota durante o tutorial: recomeça o tutorial
window.storyRestart = () => {
  if (!tutorialRunning) return false;
  runTutorial();
  return true;
};
