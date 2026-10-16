// Protótipo: 5 dados, até 3 rolagens, pontuação = soma × multiplicador da combinação.

const NUM_DICE = 5;
const MAX_ROLLS = 3;

const COMBOS = [
  { name: "Quinteto",          mult: 10, test: c => c[0] === 5 },
  { name: "Quadra",            mult: 6,  test: c => c[0] === 4 },
  { name: "Sequência grande",  mult: 5,  test: (c, s) => isStraight(s, 5) },
  { name: "Casa cheia",        mult: 4,  test: c => c[0] === 3 && c[1] === 2 },
  { name: "Sequência pequena", mult: 3,  test: (c, s) => isStraight(s, 4) },
  { name: "Trinca",            mult: 3,  test: c => c[0] === 3 },
  { name: "Dois pares",        mult: 2,  test: c => c[0] === 2 && c[1] === 2 },
  { name: "Par",               mult: 1.5, test: c => c[0] === 2 },
  { name: "Nada",              mult: 1,  test: () => true },
];

let dice = Array(NUM_DICE).fill(null);
let held = Array(NUM_DICE).fill(false);
let rollsLeft = MAX_ROLLS;
let total = 0;

const $ = id => document.getElementById(id);

function isStraight(sortedUnique, len) {
  let run = 1;
  for (let i = 1; i < sortedUnique.length; i++) {
    run = sortedUnique[i] === sortedUnique[i - 1] + 1 ? run + 1 : 1;
    if (run >= len) return true;
  }
  return len === 1;
}

function evaluate(values) {
  const counts = {};
  values.forEach(v => (counts[v] = (counts[v] || 0) + 1));
  const c = Object.values(counts).sort((a, b) => b - a);
  const s = [...new Set(values)].sort((a, b) => a - b);
  const combo = COMBOS.find(k => k.test(c, s));
  const sum = values.reduce((a, b) => a + b, 0);
  return { ...combo, points: Math.round(sum * combo.mult) };
}

// ---------- Visual dos dados ----------

// Posições das bolinhas numa grade 3x3 (0 = canto superior esquerdo, 8 = inferior direito)
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const DIE_SIZE = 52;
const R = DIE_SIZE / 2; // raio de colisão (aproxima o dado por um círculo)

const tray = $("tray");
let rolling = false;

// Cada dado: elemento na tela + estado físico
const bodies = [];

function drawFace(face, value) {
  face.innerHTML = "";
  if (value === null) {
    face.innerHTML = '<span class="blank">?</span>';
    return;
  }
  for (let p = 0; p < 9; p++) {
    const pip = document.createElement("span");
    pip.className = PIPS[value].includes(p) ? "pip" : "pip off";
    face.appendChild(pip);
  }
}

function place(b) {
  b.el.style.transform = `translate(${b.x - R}px, ${b.y - R}px) rotate(${b.a}deg)`;
}

function createDice() {
  for (let i = 0; i < NUM_DICE; i++) {
    const el = document.createElement("div");
    el.className = "die";
    const face = document.createElement("div");
    face.className = "face";
    el.appendChild(face);
    el.onclick = () => {
      if (rolling || dice[i] === null || rollsLeft === 0) return;
      held[i] = !held[i];
      render();
    };
    tray.appendChild(el);
    bodies.push({ el, face, x: 0, y: 0, a: 0, vx: 0, vy: 0, va: 0, dist: 0 });
  }
  lineUp();
}

// Dados enfileirados no meio da bandeja (início de cada turno)
function lineUp() {
  const W = tray.clientWidth, H = tray.clientHeight;
  bodies.forEach((b, i) => {
    b.x = (W / (NUM_DICE + 1)) * (i + 1);
    b.y = H / 2;
    b.a = 0;
    place(b);
  });
}

function flash(b, strength) {
  b.face.classList.remove("hit");
  void b.face.offsetWidth; // reinicia a animação
  b.face.style.setProperty("--hit", Math.min(1, strength / 600));
  b.face.classList.add("hit");
}

// ---------- Física da rolagem ----------

function throwDice(onDone) {
  const W = tray.clientWidth, H = tray.clientHeight;
  const moving = bodies.filter((_, i) => !held[i]);

  // Arremessa da parte de baixo da bandeja, para cima e em direções variadas
  moving.forEach((b, k) => {
    b.x = rand(R, W - R) * 0.5 + (W / (moving.length + 1)) * (k + 1) * 0.5;
    b.y = H - R - rand(0, 10);
    const angle = rand(-Math.PI * 0.85, -Math.PI * 0.15); // para cima, com inclinação
    const speed = rand(650, 1100);
    b.vx = Math.cos(angle) * speed;
    b.vy = Math.sin(angle) * speed;
    b.va = rand(500, 1100) * (Math.random() < 0.5 ? -1 : 1);
    b.dist = 0;
    b.stopped = false;
    drawFace(b.face, randomFace());
  });

  let last = performance.now();
  const start = last;

  function step(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    // Movimento + atrito do feltro
    moving.forEach(b => {
      if (b.stopped) return;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.a += b.va * dt;

      const damp = Math.exp(-1.8 * dt);
      b.vx *= damp;
      b.vy *= damp;
      b.va *= Math.exp(-2.4 * dt);

      // Troca de face conforme rola pela bandeja
      const speed = Math.hypot(b.vx, b.vy);
      b.dist += speed * dt;
      if (b.dist > 38 && speed > 60) {
        b.dist = 0;
        drawFace(b.face, randomFace());
      }

      // Bate nas paredes
      const e = 0.55;
      if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * e; b.va += rand(-300, 300); if (speed > 150) flash(b, speed); }
      if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx) * e; b.va += rand(-300, 300); if (speed > 150) flash(b, speed); }
      if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy) * e; b.va += rand(-300, 300); if (speed > 150) flash(b, speed); }
      if (b.y > H - R) { b.y = H - R; b.vy = -Math.abs(b.vy) * e; b.va += rand(-300, 300); if (speed > 150) flash(b, speed); }
    });

    // Colisões entre dados (os segurados são obstáculos fixos)
    for (let i = 0; i < NUM_DICE; i++) {
      for (let j = i + 1; j < NUM_DICE; j++) {
        const A = bodies[i], B = bodies[j];
        const aFixed = held[i] || A.stopped, bFixed = held[j] || B.stopped;
        if (aFixed && bFixed) continue;

        let dx = B.x - A.x, dy = B.y - A.y;
        let d = Math.hypot(dx, dy);
        if (d >= R * 2 || d === 0) continue;
        const nx = dx / d, ny = dy / d;
        const overlap = R * 2 - d;

        // Separa os dois
        if (aFixed) { B.x += nx * overlap; B.y += ny * overlap; }
        else if (bFixed) { A.x -= nx * overlap; A.y -= ny * overlap; }
        else {
          A.x -= nx * overlap / 2; A.y -= ny * overlap / 2;
          B.x += nx * overlap / 2; B.y += ny * overlap / 2;
        }

        // Troca de impulso ao longo da linha de contato
        const rvx = (bFixed ? 0 : B.vx) - (aFixed ? 0 : A.vx);
        const rvy = (bFixed ? 0 : B.vy) - (aFixed ? 0 : A.vy);
        const vn = rvx * nx + rvy * ny;
        if (vn >= 0) continue; // já estão se afastando

        const e = 0.7;
        const share = aFixed || bFixed ? 1 : 0.5;
        const jImp = -(1 + e) * vn * share;
        if (!aFixed) { A.vx -= jImp * nx; A.vy -= jImp * ny; A.va += rand(-400, 400); }
        if (!bFixed) { B.vx += jImp * nx; B.vy += jImp * ny; B.va += rand(-400, 400); }

        const impact = -vn;
        if (impact > 120) {
          if (!aFixed || held[i]) flash(A, impact);
          if (!bFixed || held[j]) flash(B, impact);
        }
      }
    }

    // Quando quase parado, o dado assenta "reto" e para
    moving.forEach(b => {
      if (b.stopped) return;
      const speed = Math.hypot(b.vx, b.vy);
      if (speed < 90) {
        const target = Math.round(b.a / 90) * 90;
        b.a += (target - b.a) * Math.min(1, 10 * dt);
        b.va *= 0.8;
      }
      if (speed < 14 && Math.abs(b.va) < 25) {
        b.stopped = true;
        b.a = Math.round(b.a / 90) * 90;
        b.vx = b.vy = b.va = 0;
        const i = bodies.indexOf(b);
        drawFace(b.face, onDone.result[i]);
        b.el.classList.remove("landed");
        void b.el.offsetWidth;
        b.el.classList.add("landed");
      }
      place(b);
    });

    const allStopped = moving.every(b => b.stopped);
    if (!allStopped && now - start < 4000) {
      requestAnimationFrame(step);
    } else {
      moving.forEach((b, k) => {
        if (!b.stopped) {
          b.stopped = true;
          drawFace(b.face, onDone.result[bodies.indexOf(b)]);
        }
      });
      setTimeout(onDone, 200);
    }
  }
  requestAnimationFrame(step);
}

// ---------- Interface ----------

function render() {
  bodies.forEach((b, i) => {
    b.el.classList.toggle("held", held[i]);
    if (!rolling) drawFace(b.face, dice[i]);
  });

  const rolled = dice[0] !== null;
  if (rolled) {
    const r = evaluate(dice);
    $("combo").textContent = `${r.name} (×${r.mult})`;
    $("score").textContent = `Pontos: ${r.points}`;
  } else {
    $("combo").textContent = "—";
    $("score").textContent = "Pontos: 0";
  }
  $("rolls").textContent = `Rolagens: ${rollsLeft}`;
  $("roll").disabled = rolling || rollsLeft === 0;
  $("score-btn").disabled = rolling || !rolled;
  $("total").textContent = `Total: ${total}`;
}

const randomFace = () => 1 + Math.floor(Math.random() * 6);

function rand(min, max) {
  return min + Math.random() * (max - min);
}

$("roll").onclick = () => {
  if (rolling || rollsLeft === 0) return;
  rolling = true;
  render();

  // O resultado já é sorteado; a física só "mostra" os dados chegando nele
  const result = dice.map((v, i) => (held[i] ? v : randomFace()));
  const done = () => {
    dice = result;
    rollsLeft--;
    rolling = false;
    render();
  };
  done.result = result;
  throwDice(done);
};

$("score-btn").onclick = () => {
  if (rolling) return;
  total += evaluate(dice).points;
  dice = Array(NUM_DICE).fill(null);
  held = Array(NUM_DICE).fill(false);
  rollsLeft = MAX_ROLLS;
  lineUp();
  render();
};

window.addEventListener("resize", () => {
  if (!rolling && dice[0] === null) lineUp();
});

createDice();
render();
