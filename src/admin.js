// Menu de administrador para testar no celular.
// Aparece abrindo o jogo com ?admin no endereço (fica ligado neste aparelho; ?admin=off desliga).
//
// - Escolher os valores da próxima rolagem de ataque (ou um atalho: Par, Trinca...)
// - Forçar a chance de atordoar (sempre / nunca)
// - Encher carga/reserva, mexer na vida, trocar de inimigo, aplicar estados

(function () {
  // Liga com ?admin (e fica ligado neste aparelho); desliga com ?admin=off
  const q = location.search;
  try {
    if (/[?&]admin=off\b/.test(q)) localStorage.removeItem("jasn.admin");
    else if (/[?&]admin\b/.test(q)) localStorage.setItem("jasn.admin", "1");
  } catch (e) {}
  let on = /[?&]admin\b/.test(q) && !/[?&]admin=off\b/.test(q);
  try { on = on || (!window.TEST_MODE && localStorage.getItem("jasn.admin") === "1"); } catch (e) {}
  if (!on) return;

  // Valores escolhidos para a próxima rolagem (null = aleatório). dice.js consome window.ADMIN_ROLLS.
  let pick = Array(NUM_DICE).fill(null);
  const PRESETS = {
    "Nada": [1, 3, 5, 6], "Par": [6, 6, 1, 3], "Dois pares": [5, 5, 4, 4],
    "Trinca": [5, 5, 5, 2], "Seq. curta": [2, 3, 4, 6], "Sequência": [3, 4, 5, 6],
    "Quadra": [4, 4, 4, 4],
  };
  const STUN_MODES = [["normal", undefined], ["sempre", true], ["nunca", false]];
  let stunMode = 0;

  const btn = document.createElement("button");
  btn.id = "admin-btn";
  btn.textContent = "ADM";
  document.body.appendChild(btn);

  const panel = document.createElement("div");
  panel.id = "admin";
  panel.hidden = true;
  document.body.appendChild(panel);

  const act = (label, fn) => `<button data-act="${label}">${label}</button>`;
  const ACTIONS = {
    "Encher carga": () => { charge = CHARGE_MAX; },
    "Encher reserva": () => { reserve = NUM_DICE; },
    "Zerar reserva": () => { reserve = 0; },
    "Vida cheia": () => { player.hp = player.maxHp; },
    "Vida 5": () => { player.hp = 5; },
    "Inimigo 1 de vida": () => { enemy.hp = 1; },
    "Inimigo 999": () => { enemy.hp = enemy.maxHp = 999; },
    "Próximo inimigo": () => { level++; newEnemy(); startPlayerTurn(); },
    "+1 rolagem": () => { rollsLeft++; },
    "Atordoar já": () => { enemy.stunned = true; setStunned(true); },
    "Queimar já": () => { enemy.burn = 10; },
    "Ir à cidade": () => { window.RUN = null; window.enterCity && window.enterCity(); },
    "Derrotas +1": () => { try { localStorage.setItem("jasn.derrotas", String((+localStorage.getItem("jasn.derrotas") || 0) + 1)); } catch (e) {} },
    "Zerar derrotas": () => { try { localStorage.removeItem("jasn.derrotas"); } catch (e) {} },
    "Ver tutorial": () => { try { localStorage.removeItem("jasn.tutorial"); } catch (e) {} location.reload(); },
    "Pular tutorial": () => { try { localStorage.setItem("jasn.tutorial", "feito"); } catch (e) {} location.reload(); },
    "Zerar grimório": () => { try { localStorage.removeItem("jasn.grimorio"); } catch (e) {} location.reload(); },
    "Amaldiçoar já": () => { if (!enemy.cursed) { enemy.cursed = true; enemy.intent = cursedAtk(enemy.intent); } },
  };

  function draw() {
    panel.innerHTML = `
      <div class="admin-box">
        <h3>Administrador <button data-close>✕</button></h3>
        <p>Dados forçados nas rolagens (toque para trocar; ? = aleatório)</p>
        <div class="admin-row">${pick.map((v, i) => `<button data-pick="${i}" class="admin-die">${v ?? "?"}</button>`).join("")}</div>
        <div class="admin-grid">${Object.keys(PRESETS).map(n => `<button data-preset="${n}">${n}</button>`).join("")}
          <button data-preset="">Aleatório</button></div>
        <p>Chance de atordoar</p>
        <div class="admin-row"><button data-stun>${STUN_MODES[stunMode][0]}</button></div>
        <p>Estado</p>
        <div class="admin-grid">${Object.keys(ACTIONS).map(act).join("")}</div>
      </div>`;
  }

  // Entrega os valores escolhidos para a próxima rolagem
  function arm() {
    window.ADMIN_ROLLS = pick.some(v => v !== null) ? [...pick] : null;
  }

  btn.onclick = () => { draw(); panel.hidden = false; };
  panel.onclick = e => {
    const t = e.target.closest("button");
    if (!t) { if (e.target === panel) panel.hidden = true; return; }
    if (t.dataset.close !== undefined) { panel.hidden = true; return; }
    if (t.dataset.pick !== undefined) {
      const i = +t.dataset.pick;
      pick[i] = pick[i] === null ? 1 : pick[i] === 6 ? null : pick[i] + 1;
    } else if (t.dataset.preset !== undefined) {
      pick = t.dataset.preset ? [...PRESETS[t.dataset.preset]] : Array(NUM_DICE).fill(null);
    } else if (t.dataset.stun !== undefined) {
      stunMode = (stunMode + 1) % STUN_MODES.length;
      window.FORCE_CHANCE = STUN_MODES[stunMode][1];
    } else if (t.dataset.act) {
      ACTIONS[t.dataset.act]();
      render();
      log(`[adm] ${t.dataset.act}`);
    }
    arm();
    draw();
  };
})();
