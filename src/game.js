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
// ---------- Dados em 3D ----------
//
// Cada dado é um cubo CSS com 6 faces. A orientação do cubo é uma matriz de
// rotação 3x3 (M). Ao andar pela bandeja ele "capota" na direção do movimento,
// e o número que termina virado para cima é o resultado da rolagem.

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
const R = DIE_SIZE / 2; // metade do dado (raio de colisão e de rolagem)

// Para cada valor: direção da face no cubo (x direita, y baixo, z para quem olha)
// e o transform CSS que coloca a face lá. Faces opostas somam 7.
const FACES = {
  1: { n: [0, 0, 1],  css: `translateZ(${R}px)` },
  6: { n: [0, 0, -1], css: `rotateY(180deg) translateZ(${R}px)` },
  2: { n: [1, 0, 0],  css: `rotateY(90deg) translateZ(${R}px)` },
  5: { n: [-1, 0, 0], css: `rotateY(-90deg) translateZ(${R}px)` },
  3: { n: [0, 1, 0],  css: `rotateX(-90deg) translateZ(${R}px)` },
  4: { n: [0, -1, 0], css: `rotateX(90deg) translateZ(${R}px)` },
};

// ---------- Matrizes de rotação ----------

const IDENTITY = () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

function rotAxis(ax, ay, az, t) {
  const c = Math.cos(t), s = Math.sin(t), k = 1 - c;
  return [
    [c + ax * ax * k,      ax * ay * k - az * s, ax * az * k + ay * s],
    [ay * ax * k + az * s, c + ay * ay * k,      ay * az * k - ax * s],
    [az * ax * k - ay * s, az * ay * k + ax * s, c + az * az * k],
  ];
}
const rotZ = t => rotAxis(0, 0, 1, t);

function mul(A, B) {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      C[r][c] = A[r][0] * B[0][c] + A[r][1] * B[1][c] + A[r][2] * B[2][c];
  return C;
}

function apply(M, v) {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

// Corrige pequenos erros numéricos acumulados (mantém a matriz "rígida")
function orthonormalize(M) {
  const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
  const col = (i) => [M[0][i], M[1][i], M[2][i]];
  let x = norm(col(0));
  let y = col(1);
  const d = x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  y = norm(y.map((v, i) => v - d * x[i]));
  const z = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
  return [[x[0], y[0], z[0]], [x[1], y[1], z[1]], [x[2], y[2], z[2]]];
}

function randomOrientation() {
  let M = rotAxis(1, 0, 0, rand(0, 6.28));
  M = mul(rotAxis(0, 1, 0, rand(0, 6.28)), M);
  return mul(rotZ(rand(0, 6.28)), M);
}

// Qual valor está virado para cima (para quem olha)?
function topValue(M) {
  let best = 1, bestZ = -2;
  for (const v in FACES) {
    const z = apply(M, FACES[v].n)[2];
    if (z > bestZ) { bestZ = z; best = +v; }
  }
  return best;
}

// Rotação que deixa o dado assentado reto, com a face de cima virada para cima
function settleTarget(M) {
  const v = topValue(M);
  const w = apply(M, FACES[v].n);
  // 1) inclina até a face ficar exatamente para cima
  let ax = w[1], ay = -w[0]; // w × z
  const len = Math.hypot(ax, ay);
  const tilt = Math.acos(Math.max(-1, Math.min(1, w[2])));
  const C1 = len > 1e-6 ? rotAxis(ax / len, ay / len, 0, tilt) : IDENTITY();
  // 2) gira no próprio eixo até ficar "quadrado" com a bandeja
  const side = v === 1 || v === 6 ? FACES[2].n : FACES[1].n;
  const s = apply(mul(C1, M), side);
  const phi = Math.atan2(s[1], s[0]);
  const yaw = Math.round(phi / (Math.PI / 2)) * (Math.PI / 2) - phi;
  return { axis: len > 1e-6 ? [ax / len, ay / len, 0] : [1, 0, 0], tilt, yaw, value: v };
}

// ---------- Elementos na tela ----------

const tray = $("tray");
let rolling = false;
const bodies = [];

function pipsHTML(value) {
  let html = "";
  for (let p = 0; p < 9; p++) {
    html += `<span class="pip${PIPS[value].includes(p) ? "" : " off"}"></span>`;
  }
  return html;
}

function setUnknown(b, unknown) {
  b.sides.forEach(side => {
    side.el.innerHTML = unknown ? '<span class="blank">?</span>' : pipsHTML(side.value);
  });
}

function place(b) {
  b.el.style.transform = `translate(${b.x - R}px, ${b.y - R}px)`;
  const M = b.M;
  b.cube.style.transform =
    `translateZ(${-R}px) matrix3d(${M[0][0]},${M[1][0]},${M[2][0]},0,${M[0][1]},${M[1][1]},${M[2][1]},0,` +
    `${M[0][2]},${M[1][2]},${M[2][2]},0,0,0,0,1)`;
  // Luz vinda de cima: faces viradas para o lado ficam mais escuras
  b.sides.forEach(side => {
    const z = apply(M, side.n)[2];
    side.el.style.filter = `brightness(${(0.55 + 0.45 * Math.max(0, z)).toFixed(2)})`;
  });
}

function createDice() {
  for (let i = 0; i < NUM_DICE; i++) {
    const el = document.createElement("div");
    el.className = "die";
    el.innerHTML = '<div class="shadow"></div><div class="bounce"><div class="cube"></div></div>';
    const cube = el.querySelector(".cube");
    const sides = Object.entries(FACES).map(([value, f]) => {
      const s = document.createElement("div");
      s.className = "side";
      s.style.transform = f.css;
      cube.appendChild(s);
      return { el: s, value: +value, n: f.n };
    });
    el.onclick = () => {
      if (rolling || dice[i] === null || rollsLeft === 0) return;
      held[i] = !held[i];
      render();
    };
    tray.appendChild(el);
    const b = { el, cube, sides, bounce: el.querySelector(".bounce"),
                x: 0, y: 0, vx: 0, vy: 0, va: 0, M: IDENTITY(), state: "stopped" };
    setUnknown(b, true);
    bodies.push(b);
  }
  lineUp();
}

// Dados enfileirados no meio da bandeja (início de cada turno)
function lineUp() {
  const W = tray.clientWidth, H = tray.clientHeight;
  bodies.forEach((b, i) => {
    b.x = (W / (NUM_DICE + 1)) * (i + 1);
    b.y = H / 2;
    b.M = IDENTITY();
    setUnknown(b, true);
    place(b);
  });
}

function flash(b, strength) {
  b.el.classList.remove("hit");
  void b.el.offsetWidth; // reinicia a animação
  b.el.style.setProperty("--hit", Math.min(1, strength / 600).toFixed(2));
  b.el.classList.add("hit");
}

function landed(b) {
  b.bounce.classList.remove("landed");
  void b.bounce.offsetWidth;
  b.bounce.classList.add("landed");
}

// ---------- Física da rolagem ----------

function throwDice(onDone) {
  const W = tray.clientWidth, H = tray.clientHeight;
  const moving = bodies.filter((_, i) => !held[i]);

  // Arremessa da parte de baixo da bandeja, para cima e em direções variadas
  moving.forEach((b, k) => {
    b.x = rand(R, W - R) * 0.5 + (W / (moving.length + 1)) * (k + 1) * 0.5;
    b.y = H - R - rand(0, 10);
    const angle = rand(-Math.PI * 0.85, -Math.PI * 0.15);
    const speed = rand(650, 1100);
    b.vx = Math.cos(angle) * speed;
    b.vy = Math.sin(angle) * speed;
    b.va = rand(-6, 6); // giro no próprio eixo (rad/s)
    b.M = randomOrientation();
    b.state = "moving";
    setUnknown(b, false);
  });

  let last = performance.now();
  const start = last;

  function step(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    moving.forEach(b => {
      if (b.state === "stopped") return;

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const damp = Math.exp(-1.8 * dt);
      b.vx *= damp;
      b.vy *= damp;
      b.va *= Math.exp(-2.5 * dt);
      const speed = Math.hypot(b.vx, b.vy);

      if (b.state === "moving") {
        // Capota na direção do movimento: andar R*θ = girar θ
        if (speed > 1) {
          const t = (speed * dt) / R;
          b.M = mul(rotAxis(-b.vy / speed, b.vx / speed, 0, t), b.M);
        }
        b.M = orthonormalize(mul(rotZ(b.va * dt), b.M));

        // Devagar o bastante: começa a assentar
        if (speed < 45) {
          b.state = "settling";
          b.settle = { from: b.M, ...settleTarget(b.M), t: 0 };
        }
      } else if (b.state === "settling") {
        // Assenta suavemente na face de cima
        const s = b.settle;
        s.t = Math.min(1, s.t + dt / 0.22);
        const e = 1 - Math.pow(1 - s.t, 3);
        b.M = mul(rotZ(s.yaw * e), mul(rotAxis(...s.axis, s.tilt * e), s.from));
        if (speed > 120) b.state = "moving"; // levou uma pancada, volta a rolar
        if (s.t >= 1 && speed < 14) {
          b.state = "stopped";
          b.vx = b.vy = b.va = 0;
          onDone.result[bodies.indexOf(b)] = s.value;
          landed(b);
        }
      }

      // Bate nas paredes
      const e = 0.55;
      let wall = false;
      if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * e; wall = true; }
      if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx) * e; wall = true; }
      if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy) * e; wall = true; }
      if (b.y > H - R) { b.y = H - R; b.vy = -Math.abs(b.vy) * e; wall = true; }
      if (wall) {
        b.va += rand(-5, 5);
        if (speed > 150) flash(b, speed);
      }
    });

    // Colisões entre dados (os segurados e os já parados são obstáculos fixos)
    for (let i = 0; i < NUM_DICE; i++) {
      for (let j = i + 1; j < NUM_DICE; j++) {
        const A = bodies[i], B = bodies[j];
        const aFixed = held[i] || A.state === "stopped";
        const bFixed = held[j] || B.state === "stopped";
        if (aFixed && bFixed) continue;

        const dx = B.x - A.x, dy = B.y - A.y;
        const d = Math.hypot(dx, dy);
        if (d >= R * 2 || d === 0) continue;
        const nx = dx / d, ny = dy / d;
        const overlap = R * 2 - d;

        if (aFixed) { B.x += nx * overlap; B.y += ny * overlap; }
        else if (bFixed) { A.x -= nx * overlap; A.y -= ny * overlap; }
        else {
          A.x -= nx * overlap / 2; A.y -= ny * overlap / 2;
          B.x += nx * overlap / 2; B.y += ny * overlap / 2;
        }

        const rvx = (bFixed ? 0 : B.vx) - (aFixed ? 0 : A.vx);
        const rvy = (bFixed ? 0 : B.vy) - (aFixed ? 0 : A.vy);
        const vn = rvx * nx + rvy * ny;
        if (vn >= 0) continue;

        const e = 0.7;
        const share = aFixed || bFixed ? 1 : 0.5;
        const jImp = -(1 + e) * vn * share;
        if (!aFixed) { A.vx -= jImp * nx; A.vy -= jImp * ny; A.va += rand(-6, 6); }
        if (!bFixed) { B.vx += jImp * nx; B.vy += jImp * ny; B.va += rand(-6, 6); }

        const impact = -vn;
        if (impact > 120) {
          if (!aFixed || held[i]) flash(A, impact);
          if (!bFixed || held[j]) flash(B, impact);
        }
      }
    }

    moving.forEach(place);

    const allStopped = moving.every(b => b.state === "stopped");
    if (!allStopped && now - start < 5000) {
      requestAnimationFrame(step);
    } else {
      // Segurança: se algum dado demorou demais, assenta na hora
      moving.forEach(b => {
        if (b.state !== "stopped") {
          const s = settleTarget(b.M);
          b.M = mul(rotZ(s.yaw), mul(rotAxis(...s.axis, s.tilt), b.M));
          b.state = "stopped";
          onDone.result[bodies.indexOf(b)] = s.value;
          place(b);
        }
      });
      setTimeout(onDone, 200);
    }
  }
  requestAnimationFrame(step);
}

// ---------- Interface ----------

function render() {
  bodies.forEach((b, i) => b.el.classList.toggle("held", held[i]));

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

function rand(min, max) {
  return min + Math.random() * (max - min);
}

$("roll").onclick = () => {
  if (rolling || rollsLeft === 0) return;
  rolling = true;
  render();

  // O resultado de cada dado é a face que ficar virada para cima
  const result = [...dice];
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
