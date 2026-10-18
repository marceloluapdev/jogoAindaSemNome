// Combate em turnos, visão em primeira pessoa:
// inimigo de frente no topo, suas ações embaixo.
//
// Turno do jogador: rola (MAX_ROLLS vezes) e seleciona dados (toque).
// Selecionados ficam na rerrolagem e são os que ATACAM.
// Dano = soma dos selecionados × multiplicador da combinação deles
// (sem nenhum selecionado, ataca com todos).
// Os dados NÃO selecionados e que NÃO foram rolados de novo vão para a
// RESERVA DE DEFESA (até o nº de dados). Rerrolar um dado "gasta" esse dado.
// Turno do inimigo: ele faz o ataque anunciado (a "intenção"). Se houver
// reserva, você escolhe: Defender (rola a reserva toda, a soma bloqueia)
// ou Concentrar (leva o dano e guarda a reserva para depois).

const PLAYER_MAX_HP = 40;

// Inimigos. sprite: PNG do PixelLab; foot: última linha desenhada do sprite
// (para apoiar no chão); tint: troca a cor para criar variações sem arte nova.
const SLIME = "assets/enemies/slime.png";
const ENEMIES = [
  { name: "Lodo Errante",  hp: 50,  atk: [4, 7],  sprite: SLIME, foot: 38, tint: null },
  { name: "Lodo Venenoso", hp: 90,  atk: [6, 10], sprite: SLIME, foot: 38, tint: "#9a5cd0" },
  { name: "Lodo de Brasa", hp: 140, atk: [8, 13], sprite: SLIME, foot: 38, tint: "#e0603a" },
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
    sprite: base.sprite,
    foot: base.foot,
    tint: base.tint,
  };
}

let player = { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP };
let enemy;
let level = 0;
let rollsLeft = MAX_ROLLS;
let reserve = 0;    // dados guardados para defesa (até NUM_DICE)
// Carga da Maldição: dados que não cabem mais na reserva viram carga; Concentrar dá +1.
// Carga cheia libera a Aposta Final.
const CHARGE_MAX = 5;
const ULTIMATE_DICE = 5, ULTIMATE_MULT = 3;
let charge = 0;
let shield = 0;     // escudo do Par: bloqueia o próximo golpe do inimigo
let busy = false;   // animações / turno do inimigo em andamento
let over = false;   // derrota

const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

// Números na fonte própria (Silkscreen): 1, 2, 7 e 8 bem distintos
const N = v => `<b class="num">${v}</b>`;
const withNums = text => String(text).replace(/[-+×]?\d+(?:[.,]\d+)?/g, m => N(m));

// Usado por dice.js: pode selecionar dados agora? (inclusive após a última rolagem)
function canHoldDice() {
  return !busy && !over;
}

// Dados que vão atacar: os selecionados, ou todos se nenhum foi selecionado
function attackValues() {
  const sel = dice.filter((v, i) => held[i]);
  return sel.length ? sel : [...dice];
}
// Efeitos das combinações (além do dano). Valores pela soma dos dados que atacam:
//   escudo  (Par)        bloqueia ⌈soma/2⌉ do próximo golpe do inimigo
//   cura    (Dois pares) drena: cura ⌈soma/3⌉
//   fogo    (Trinca)     queima: o inimigo perde "soma" de vida depois do ataque dele
//   raio    (Sequência de 4+) CHANCE de atordoar (STUN_CHANCE): o inimigo perde o próximo ataque
//           (Sequência curta, de 3, não tem efeito: sai fácil demais para atordoar)
//   maldição (Quadra)    o inimigo ataca com metade da força pelo resto da luta
// Mãos de 5–6 dados herdam: Casa cheia = escudo + fogo; Sequências grande/completa e
// Duas sequências = raio; Três pares = cura; Duas trincas = fogo; Quinteto/Sexteto = maldição.
const COMBO_EFFECTS = {
  "Par": ["escudo"], "Dois pares": ["cura"], "Trinca": ["fogo"], "Sequência": ["raio"],
  "Quadra": ["maldicao"], "Casa cheia": ["escudo", "fogo"], "Sequência grande": ["raio"],
  "Quinteto": ["maldicao"], "Sexteto": ["maldicao"], "Sequência completa": ["raio"],
  "Duas sequências": ["raio"], "Três pares": ["cura"], "Duas trincas": ["fogo"],
};
// Raio: CHANCE de atordoar (%), maior quanto mais longa a sequência.
// stunBonus soma a todas — para magias/itens futuros que aumentam a chance.
const STUN_CHANCE = {
  "Sequência": 35, "Duas sequências": 50, "Sequência grande": 50, "Sequência completa": 70,
};
let stunBonus = 0;
const stunChance = name => Math.min(100, (STUN_CHANCE[name] || 0) + stunBonus);
// Sorteio de chance (no modo de teste, window.TEST_CHANCE = true/false decide)
const chance = pct =>
  window.TEST_MODE && typeof window.TEST_CHANCE === "boolean" ? window.TEST_CHANCE : Math.random() * 100 < pct;

function comboEffects(r, values) {
  const sum = values.reduce((a, v) => a + v, 0);
  return (COMBO_EFFECTS[r.name] || []).map(type => ({
    type,
    amount: type === "escudo" ? Math.ceil(sum / 2) : type === "cura" ? Math.ceil(sum / 3)
          : type === "fogo" ? sum : type === "raio" ? stunChance(r.name) : 0,
  }));
}
// Prévia curta do efeito (ícone + número; o raio mostra a chance em %)
const effectPreview = e =>
  `<span class="mini" title="${e.type}">${iconSVG(e.type)}</span>` +
  (e.amount ? N(e.amount + (e.type === "raio" ? "%" : "")) : "");
const cursedAtk = v => (enemy.cursed ? Math.ceil(v / 2) : v);

// Vão para a reserva: não selecionados que não foram rolados de novo
const toReserve = () =>
  held.some(h => h) ? held.filter((h, i) => !h && !spent[i]).length : 0;

// ---------- Tela ----------

function render() {
  bodies.forEach(b => {
    b.el.classList.toggle("held", isHeld(b));
    // gasto (rolado de novo) e fora do ataque: aparece apagado
    b.el.classList.toggle("spent", b.kind === "attack" && spent[b.idx] && !held[b.idx] && held.some(h => h));
  });

  $("enemy-name").textContent = enemy.name;
  $("enemy-hp-text").textContent = `${Math.max(0, enemy.hp)} / ${enemy.maxHp}`;
  $("enemy-hp-fill").style.width = `${(100 * Math.max(0, enemy.hp)) / enemy.maxHp}%`;
  // Estados do inimigo (queimando, amaldiçoado) aparecem como ícones ao lado da intenção
  const status = (enemy.burn ? `<span class="mini" title="queimando">${iconSVG("fogo")}</span>` : "") +
                 (enemy.cursed ? `<span class="mini" title="amaldiçoado">${iconSVG("maldicao")}</span>` : "");
  $("enemy-intent").innerHTML = enemy.hp > 0
    ? status + (enemy.stunned ? " Atordoado" : ` Vai atacar: ${N(enemy.intent)}`) +
      // escudo ativo (Par): quanto do próximo golpe já está bloqueado
      (shield && !enemy.stunned ? ` <span class="shield-on">−${N(shield)}<span class="mini">${iconSVG("escudo")}</span></span>` : "")
    : "";

  $("player-hp-text").textContent = `${Math.max(0, player.hp)} / ${player.maxHp}`;
  $("player-hp-fill").style.width = `${(100 * Math.max(0, player.hp)) / player.maxHp}%`;

  const rolled = dice[0] !== null;
  // Prévia da reserva: quantos dados entram e quantos se perdem (reserva cheia)
  const going = rolled && !busy ? toReserve() : 0;
  const gain = Math.min(going, NUM_DICE - reserve);
  const toCharge = Math.min(going - gain, CHARGE_MAX - charge);   // o que não cabe vira carga
  const lost = going - gain - toCharge;                            // reserva E carga cheias
  if (rolled) {
    const r = evaluate(attackValues());
    $("combo").innerHTML = `${r.name} ${N("×" + r.mult)}` +
      comboEffects(r, attackValues()).map(e => " " + effectPreview(e)).join("");
    // Reserva cheia: não deixa perder dados — pede para selecionar mais antes de atacar
    $("damage").innerHTML = lost
      ? `<span class="lost">tudo cheio · selecione ${N("+" + lost)}</span>`
      : `${N(r.points)} de dano` +
        (gain ? ` · ${N("+" + gain)}<span class="mini" title="defesa">${iconSVG("escudo")}</span>` : "") +
        (toCharge ? ` · ${N("+" + toCharge)}<span class="mini" title="carga">${iconSVG("carga")}</span>` : "");
  } else {
    $("combo").textContent = "Role os dados";
    $("damage").textContent = "";
  }
  $("rolls").textContent = `(${rollsLeft})`;

  // Reserva de defesa: quadradinhos azuis (cheios = guardados)
  // cheios = guardados; piscando = vão entrar se você atacar agora
  $("reserve").innerHTML = Array.from({ length: NUM_DICE }, (_, i) =>
    `<span class="slot${i < reserve ? " full" : i < reserve + gain ? " incoming" : ""}"></span>`).join("");
  $("reserve").classList.toggle("overflow", lost > 0);

  // Carga da Maldição: segmentos verdes; piscando = vão encher se atacar agora
  $("charge").innerHTML = Array.from({ length: CHARGE_MAX }, (_, i) =>
    `<span class="seg${i < charge ? " full" : i < charge + toCharge ? " incoming" : ""}"></span>`).join("");
  $("charge").classList.toggle("ready", charge >= CHARGE_MAX);
  $("ultimate").hidden = charge < CHARGE_MAX;
  $("ultimate").disabled = rolling || busy || over;

  $("roll").disabled = rolling || busy || over || rollsLeft === 0;
  $("attack").disabled = rolling || busy || over || !rolled || lost > 0;
}

function log(text) {
  $("log").textContent = text;
}

// Número que sobe e some (dano, cura...)
function floatText(anchor, text, cls) {
  const el = document.createElement("div");
  el.className = `float ${cls}`;
  el.innerHTML = withNums(text);
  anchor.appendChild(el);
  el.animate(
    [{ transform: "translate(-50%, 0) scale(0.6)", opacity: 0 },
     { transform: "translate(-50%, -20px) scale(1.2)", opacity: 1, offset: 0.2 },
     { transform: "translate(-50%, -70px) scale(1)", opacity: 0 }],
    { duration: 1100, easing: "ease-out" }
  ).onfinish = () => el.remove();
}

// Pausas das animações (zeradas no modo de teste, para os testes rodarem rápido)
const wait = ms => new Promise(r => setTimeout(r, window.TEST_MODE ? 0 : ms));

// ---------- Fluxo do combate ----------

function newEnemy() {
  enemy = enemyFor(level);
  enemy.hp = enemy.maxHp;
  setEnemySprite(enemy);
  enemyGone(false);
  newIntent();
}

function newIntent() {
  enemy.intent = cursedAtk(randInt(...enemy.atk));
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
  const r = evaluate(attackValues());
  const effects = comboEffects(r, attackValues());
  // Os não selecionados vão para a reserva de defesa
  const going = toReserve();
  const gained = Math.min(going, NUM_DICE - reserve);
  const charged = Math.min(going - gained, CHARGE_MAX - charge);
  if (gained > 0) {
    reserve += gained;
    floatText($("player-hp"), `+${gained} defesa`, "block");
  }
  if (charged > 0) {
    charge += charged;
    floatText($("player-hp"), `+${charged} carga`, "charge");
  }
  render();

  // Seu ataque
  const sprite = $("enemy-sprite");
  await heroCast(effects.map(e => e.type));   // a magia da combinação voa até o inimigo
  enemy.hp -= r.points;
  sprite.animate(
    [{ transform: "translateX(0)", filter: "brightness(3)" },
     { transform: "translateX(-3px)" }, { transform: "translateX(3px)" },
     { transform: "translateX(-1px)" }, { transform: "translateX(0)", filter: "brightness(1)" }],
    { duration: 400 }
  );
  floatText($("enemy-area"), `-${r.points}`, "dmg");
  log(`${r.name}! Você causou ${r.points} de dano.`);
  render();
  await wait(700);
  if (enemy.hp > 0) await applyEffects(effects);
  await enemyTurn();
};

// Aplica os efeitos da combinação depois do dano
async function applyEffects(effects) {
  for (const e of effects) {
    if (e.type === "escudo") {
      shield += e.amount;
      floatText($("player-hp"), `+${e.amount} escudo`, "block");
      log(`Um escudo de ${e.amount} se forma à sua frente.`);
    } else if (e.type === "cura") {
      const heal = Math.min(e.amount, player.maxHp - player.hp);
      player.hp += heal;
      floatText($("player-hp"), `+${heal}`, "heal");
      log(`Você drena ${heal} de vida do inimigo.`);
    } else if (e.type === "fogo") {
      enemy.burn = Math.max(enemy.burn || 0, e.amount);
      log(`${enemy.name} pega fogo!`);
    } else if (e.type === "raio") {
      if (chance(e.amount)) {
        enemy.stunned = true;
        log(`${enemy.name} ficou atordoado!`);
      } else {
        log(`O raio passa raspando: ${enemy.name} resiste.`);
      }
    } else if (e.type === "maldicao" && !enemy.cursed) {
      enemy.cursed = true;
      enemy.intent = cursedAtk(enemy.intent);
      log(`${enemy.name} foi amaldiçoado: ataca com metade da força.`);
    }
    render();
    await wait(600);
  }
}

// Vitória: tela de vitória e próximo inimigo
async function victory() {
  enemyGone(true);
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
}

// Aposta Final: 5 dados da maldição caem no inimigo. Dano = soma × 3.
$("ultimate").onclick = async () => {
  if (busy || rolling || over || charge < CHARGE_MAX) return;
  busy = true;
  charge = 0;
  render();
  log("Aposta Final! A maldição desaba sobre o inimigo...");
  const values = Array.from({ length: ULTIMATE_DICE }, () =>
    window.TEST_MODE && window.TEST_ROLLS && window.TEST_ROLLS.length ? window.TEST_ROLLS.shift() : randInt(1, 6));
  const sprite = $("enemy-sprite");
  let sum = 0;
  await heroUltimate(values, v => {
    sum += v;
    floatText($("enemy-area"), `${v}`, "dmg");
    sprite.animate(
      [{ transform: "translateY(0)", filter: "brightness(3)" }, { transform: "translateY(2px)" },
       { transform: "translateY(0)", filter: "brightness(1)" }],
      { duration: 200 }
    );
    document.querySelector("main").animate(
      [{ transform: "translate(0,0)" }, { transform: "translate(-3px,2px)" }, { transform: "translate(0,0)" }],
      { duration: 160 }
    );
  });
  const dmg = sum * ULTIMATE_MULT;
  enemy.hp -= dmg;
  floatText($("enemy-area"), `-${dmg}`, "dmg big");
  log(`Aposta Final! ${values.join(" + ")} = ${sum} × ${ULTIMATE_MULT} = ${dmg} de dano.`);
  render();
  await wait(900);
  await enemyTurn();
};

// Depois do seu ataque: vitória, ou o inimigo ataca (com a chance de defender)
async function enemyTurn() {
  const sprite = $("enemy-sprite");
  if (enemy.hp <= 0) return victory();

  // Atordoado (Sequência): perde este ataque; a reserva fica guardada
  if (enemy.stunned) {
    enemy.stunned = false;
    log(`${enemy.name} está atordoado e não ataca.`);
    sprite.animate([{ transform: "rotate(-6deg)" }, { transform: "rotate(6deg)" }, { transform: "rotate(0)" }],
      { duration: 500 });
    await wait(800);
    return afterEnemyAttack();
  }

  // Defesa: com reserva, você escolhe se defende agora ou guarda
  let block = 0;
  const shielded = shield;          // escudo do Par entra no bloqueio deste golpe
  if (shield > 0) {
    block += shield;
    shield = 0;
  }
  if (reserve > 0 && block < enemy.intent) {
    log(`${enemy.name} vai atacar (${enemy.intent}). Defender?`);
    const defend = await askDefense();
    if (!defend) {
      // Concentrar: leva o golpe e junta +1 de carga
      if (charge < CHARGE_MAX) {
        charge++;
        floatText($("player-hp"), "+1 carga", "charge");
      }
    }
    if (defend) {
      const n = reserve;
      reserve = 0;
      render();
      log(`Você se defende com ${n} ${n === 1 ? "dado" : "dados"}...`);
      const values = await new Promise(res => rollDefense(n, res));
      block += values.reduce((a, v) => a + v, 0);
      floatText($("player-hp"), `Bloqueio ${block}`, "block");
      await wait(500);
    }
  }
  // Só o escudo (sem rolar defesa): mostra uma vez, na hora do golpe
  if (shielded && block === shielded) floatText($("player-hp"), `Escudo bloqueia ${Math.min(block, enemy.intent)}`, "block");
  const hit = Math.max(0, enemy.intent - block);

  // Ataque do inimigo
  log(`${enemy.name} ataca!`);
  sprite.animate(
    [{ transform: "scale(1)" }, { transform: "translateY(6px) scale(1.2)", offset: 0.4 }, { transform: "scale(1)" }],
    { duration: 450, easing: "ease-in-out" }
  );
  await wait(220);
  player.hp -= hit;
  if (hit > 0) {
    document.querySelector("main").animate(
      [{ transform: "translate(0,0)" }, { transform: "translate(-8px,4px)" },
       { transform: "translate(7px,-3px)" }, { transform: "translate(-4px,2px)" }, { transform: "translate(0,0)" }],
      { duration: 350 }
    );
    $("hurt").animate([{ opacity: 0.45 }, { opacity: 0 }], { duration: 500 });
    floatText($("player-hp"), `-${hit}`, "dmg");
  }
  if (block > 0 && hit === 0) log(`Você bloqueou todo o ataque de ${enemy.name}!`);
  else if (block > 0) log(`Você bloqueou ${Math.min(block, enemy.intent)} e levou ${hit} de dano.`);
  else log(`${enemy.name} causou ${hit} de dano em você.`);
  render();
  await wait(700);

  if (player.hp <= 0) {
    over = true;
    render();
    showOverlay("Derrota", `Você chegou ao inimigo ${level + 1}.`, "Recomeçar", restart);
    return;
  }
  await afterEnemyAttack();
}

// Fim do turno do inimigo: a queimadura (Trinca) arde, depois volta a sua vez
async function afterEnemyAttack() {
  if (enemy.burn) {
    const dmg = enemy.burn;
    enemy.burn = 0;
    enemy.hp -= dmg;
    $("enemy-sprite").animate([{ filter: "brightness(2) sepia(1) saturate(4)" }, { filter: "none" }],
      { duration: 500 });
    floatText($("enemy-area"), `-${dmg}`, "dmg");
    log(`${enemy.name} queima e perde ${dmg} de vida.`);
    render();
    await wait(700);
    if (enemy.hp <= 0) return victory();
  }
  newIntent();
  startPlayerTurn();
}

// Troca os botões por Defender / Concentrar e espera a escolha
function askDefense() {
  $("defend-count").textContent = `(${reserve})`;
  // Não defender: com carga sobrando é "Concentrar" (+1 carga);
  // com a carga cheia vira "Sem sorte" (só leva o golpe e guarda a reserva)
  const full = charge >= CHARGE_MAX;
  $("endure-name").textContent = full ? "Sem sorte" : "Concentrar";
  $("endure-info").textContent = full ? "(sem ação)" : "+1 carga";
  $("endure").querySelector(".ico").innerHTML = iconSVG(full ? "semsorte" : "foco");
  $("turn-buttons").hidden = true;
  $("defense-buttons").hidden = false;
  return new Promise(res => {
    const choose = v => {
      $("defense-buttons").hidden = true;
      $("turn-buttons").hidden = false;
      res(v);
    };
    $("defend").onclick = () => choose(true);
    $("endure").onclick = () => choose(false);
  });
}

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
  reserve = 0;
  charge = 0;
  shield = 0;
  player.hp = player.maxHp;
  newEnemy();
  log("Um inimigo bloqueia o caminho.");
  startPlayerTurn();
}

createDice();
restart();
