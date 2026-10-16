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

function render(animate = false) {
  const box = $("dice");
  box.innerHTML = "";
  dice.forEach((v, i) => {
    const d = document.createElement("div");
    d.className = "die" + (held[i] ? " held" : "") + (animate && !held[i] ? " rolling" : "");
    d.textContent = v ?? "?";
    d.onclick = () => {
      if (v === null || rollsLeft === 0) return;
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

$("roll").onclick = () => {
  if (rollsLeft === 0) return;
  dice = dice.map((v, i) => (held[i] ? v : 1 + Math.floor(Math.random() * 6)));
  rollsLeft--;
  render(true);
};

$("score-btn").onclick = () => {
  total += evaluate(dice).points;
  dice = Array(NUM_DICE).fill(null);
  held = Array(NUM_DICE).fill(false);
  rollsLeft = MAX_ROLLS;
  render();
};

render();
