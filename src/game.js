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

// Posições das bolinhas numa grade 3x3 (0 = canto superior esquerdo, 8 = inferior direito)
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

let rolling = false;

function drawFace(el, value) {
  el.innerHTML = "";
  if (value === null) {
    el.innerHTML = '<span class="blank">?</span>';
    return;
  }
  for (let p = 0; p < 9; p++) {
    const pip = document.createElement("span");
    pip.className = PIPS[value].includes(p) ? "pip" : "pip off";
    el.appendChild(pip);
  }
}

function render() {
  const box = $("dice");
  box.innerHTML = "";
  dice.forEach((v, i) => {
    const d = document.createElement("div");
    d.className = "die" + (held[i] ? " held" : "");
    drawFace(d, v);
    d.onclick = () => {
      if (rolling || v === null || rollsLeft === 0) return;
      held[i] = !held[i];
      render();
    };
    box.appendChild(d);
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
  $("roll").disabled = rollsLeft === 0;
  $("score-btn").disabled = !rolled;
  $("total").textContent = `Total: ${total}`;
}

const randomFace = () => 1 + Math.floor(Math.random() * 6);

$("roll").onclick = () => {
  if (rolling || rollsLeft === 0) return;
  rolling = true;
  $("roll").disabled = true;
  $("score-btn").disabled = true;

  // O resultado já é sorteado; a animação só "mostra" ele chegando
  const result = dice.map((v, i) => (held[i] ? v : randomFace()));
  const els = [...$("dice").children];
  let longest = 0;

  els.forEach((el, i) => {
    if (held[i]) return;

    // Cada dado tem seu próprio jeito de rolar
    const tick = rand(55, 110);          // velocidade de troca de face (ms)
    const duration = rand(450, 900);     // quando ele para
    let dir = Math.random() < 0.5 ? -1 : 1;
    let angle = 0;
    longest = Math.max(longest, duration);

    el.style.transition = `transform ${tick}ms linear`;
    const spin = setInterval(() => {
      if (Math.random() < 0.2) dir *= -1; // às vezes inverte o giro
      angle += dir * rand(50, 160);
      const x = rand(-10, 10);
      const y = -rand(0, 16);
      const s = rand(0.85, 1.05);
      el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg) scale(${s})`;
      drawFace(el, randomFace());
    }, tick);

    setTimeout(() => {
      clearInterval(spin);
      el.style.transition = "";
      el.style.transform = "";
      drawFace(el, result[i]);
      el.classList.add("landed");
    }, duration);
  });

  // Depois que o último dado parou, atualiza a pontuação
  setTimeout(() => {
    dice = result;
    rollsLeft--;
    rolling = false;
    render();
  }, longest + 250);
};

function rand(min, max) {
  return min + Math.random() * (max - min);
}

$("score-btn").onclick = () => {
  if (rolling) return;
  total += evaluate(dice).points;
  dice = Array(NUM_DICE).fill(null);
  held = Array(NUM_DICE).fill(false);
  rollsLeft = MAX_ROLLS;
  render();
};

render();
