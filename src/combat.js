// Combate em turnos, visão em primeira pessoa:
// inimigo de frente no topo, suas ações embaixo.
//
// Turno do jogador: rola (MAX_ROLLS vezes), segura dados, e ataca.
// Dano = soma dos dados × multiplicador da combinação.
// Turno do inimigo: ele faz o ataque que anunciou (a "intenção").

const PLAYER_MAX_HP = 40;

// Inimigos provisórios (arte e nomes trocam quando a estética estiver definida)
const ENEMIES = [
  { name: "Lodo Errante",     hp: 50,  atk: [4, 7],   color: "#7fbf6a" },
  { name: "Morcego de Cinza", hp: 90,  atk: [6, 10],  color: "#9a8fb8" },
  { name: "Golem de Sal",     hp: 140, atk: [8, 13],  color: "#d8cfc0" },
];

// Depois da lista, os inimigos repetem cada vez mais fortes
function enemyFor(level) {
  const base = ENEMIES[level % ENEMIES.length];
  const loop = Math.floor(level / ENEMIES.length);
  const k = Math.pow(1.6, loop);
  return {
    name: loop ? `${base.name} ${"+".repeat(loop)}` : base.name,
    maxHp: Math.round(base.hp * k),
    atk: base.atk.map(a => Math.round(a * k)),
    color: base.color,
  };
}

let player = { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP };
let enemy;
let level = 0;
let rollsLeft = MAX_ROLLS;
let busy = false;   // animações / turno do inimigo em andamento
let over = false;   // derrota

const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

// Usado por dice.js: pode segurar dados agora?
function canHoldDice() {
  return !busy && !over && rollsLeft > 0;
}

// ---------- Tela ----------

function render() {
  bodies.forEach((b, i) => b.el.classList.toggle("held", held[i]));

  $("enemy-name").textContent = enemy.name;
  $("enemy-hp-text").textContent = `${Math.max(0, enemy.hp)} / ${enemy.maxHp}`;
  $("enemy-hp-fill").style.width = `${(100 * Math.max(0, enemy.hp)) / enemy.maxHp}%`;
  $("enemy-intent").textContent = enemy.hp > 0 ? `Vai atacar: ${enemy.intent}` : "";

  $("player-hp-text").textContent = `${Math.max(0, player.hp)} / ${player.maxHp}`;
  $("player-hp-fill").style.width = `${(100 * Math.max(0, player.hp)) / player.maxHp}%`;

  const rolled = dice[0] !== null;
  if (rolled) {
    const r = evaluate(dice);
    $("combo").textContent = `${r.name} ×${r.mult}`;
    $("damage").textContent = `${r.points} de dano`;
  } else {
    $("combo").textContent = "Role os dados";
    $("damage").textContent = "";
  }
  $("rolls").textContent = `(${rollsLeft})`;
  $("roll").disabled = rolling || busy || over || rollsLeft === 0;
  $("attack").disabled = rolling || busy || over || !rolled;
}

function log(text) {
  $("log").textContent = text;
}

// Número que sobe e some (dano, cura...)
function floatText(anchor, text, cls) {
  const el = document.createElement("div");
  el.className = `float ${cls}`;
  el.textContent = text;
  anchor.appendChild(el);
  el.animate(
    [{ transform: "translate(-50%, 0) scale(0.6)", opacity: 0 },
     { transform: "translate(-50%, -20px) scale(1.2)", opacity: 1, offset: 0.2 },
     { transform: "translate(-50%, -70px) scale(1)", opacity: 0 }],
    { duration: 1100, easing: "ease-out" }
  ).onfinish = () => el.remove();
}

const wait = ms => new Promise(r => setTimeout(r, ms));

// ---------- Fluxo do combate ----------

function newEnemy() {
  enemy = enemyFor(level);
  enemy.hp = enemy.maxHp;
  $("enemy-sprite").style.setProperty("--enemy-color", enemy.color);
  $("enemy-sprite").classList.remove("dead");
  newIntent();
}

function newIntent() {
  enemy.intent = randInt(...enemy.atk);
}

function startPlayerTurn() {
  rollsLeft = MAX_ROLLS;
  resetDice();
  busy = false;
  render();
}

$("roll").onclick = () => {
  if (!canHoldDice() || rolling) return;
  rollsLeft--;
  render();
  rollDice(render);
};

$("attack").onclick = async () => {
  if (busy || rolling || over || dice[0] === null) return;
  busy = true;
  const r = evaluate(dice);
  render();

  // Seu ataque
  const sprite = $("enemy-sprite");
  enemy.hp -= r.points;
  sprite.animate(
    [{ transform: "translateX(0)", filter: "brightness(3)" },
     { transform: "translateX(-10px)" }, { transform: "translateX(8px)" },
     { transform: "translateX(-4px)" }, { transform: "translateX(0)", filter: "brightness(1)" }],
    { duration: 400 }
  );
  floatText($("enemy-area"), `-${r.points}`, "dmg");
  log(`${r.name}! Você causou ${r.points} de dano.`);
  render();
  await wait(700);

  if (enemy.hp <= 0) {
    sprite.classList.add("dead");
    log(`${enemy.name} foi derrotado!`);
    await wait(900);
    showOverlay("Vitória!", `${enemy.name} caiu. Você recupera um pouco de vida.`, "Próximo inimigo", () => {
      level++;
      const heal = Math.round(player.maxHp * 0.3);
      player.hp = Math.min(player.maxHp, player.hp + heal);
      newEnemy();
      log("Um novo inimigo surge...");
      startPlayerTurn();
      floatText($("player-hp"), `+${heal}`, "heal");
    });
    return;
  }

  // Ataque do inimigo
  log(`${enemy.name} ataca!`);
  sprite.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.25) translateY(16px)", offset: 0.4 }, { transform: "scale(1)" }],
    { duration: 450, easing: "ease-in-out" }
  );
  await wait(220);
  player.hp -= enemy.intent;
  document.querySelector("main").animate(
    [{ transform: "translate(0,0)" }, { transform: "translate(-8px,4px)" },
     { transform: "translate(7px,-3px)" }, { transform: "translate(-4px,2px)" }, { transform: "translate(0,0)" }],
    { duration: 350 }
  );
  $("hurt").animate([{ opacity: 0.45 }, { opacity: 0 }], { duration: 500 });
  floatText($("player-hp"), `-${enemy.intent}`, "dmg");
  log(`${enemy.name} causou ${enemy.intent} de dano em você.`);
  render();
  await wait(700);

  if (player.hp <= 0) {
    over = true;
    render();
    showOverlay("Derrota", `Você chegou ao inimigo ${level + 1}.`, "Recomeçar", restart);
    return;
  }

  newIntent();
  startPlayerTurn();
};

function showOverlay(title, text, button, action) {
  $("overlay-title").textContent = title;
  $("overlay-text").textContent = text;
  $("overlay-btn").textContent = button;
  $("overlay").hidden = false;
  $("overlay-btn").onclick = () => {
    $("overlay").hidden = true;
    action();
  };
}

function restart() {
  over = false;
  level = 0;
  player.hp = player.maxHp;
  newEnemy();
  log("Um inimigo bloqueia o caminho.");
  startPlayerTurn();
}

createDice();
restart();
