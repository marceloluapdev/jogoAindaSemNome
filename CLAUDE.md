# CLAUDE.md

Jogo 2D para navegador (HTML/CSS/JS puro, sem build), publicado no GitHub Pages.
Desenvolvido principalmente pelo celular — mantenha tudo testável no navegador mobile.

Leia só quando precisar:
- `docs/GAME.md` — conceito, mecânicas e regras do jogo
- `docs/TODO.md` — próximos passos e o que já foi feito
- `docs/HISTORIA.md` — lore, mitologia, personagens e tom (bíblia da história)

Muita coisa já está decidida só no GAME.md (tutorial integrado à história, livro-jogo, layout futuro,
personagens, ideias guardadas). Antes de propor ou discutir qualquer coisa de design, história ou
próximos passos, leia o GAME.md e o TODO.md — não presuma que algo ainda não foi pensado.

Convenções: código em `src/` (`dice.js` = dados/física/combinações, `scene.js` = cena em pixel art,
`combat.js` = combate e turnos, `story.js` = diálogos e tutorial, `admin.js` = menu de teste), entrada em `index.html`. Arte em `assets/` (PNGs do PixelLab;
originais guardados com sufixo `_original`), scripts de edição de arte em `tools/`. Textos do jogo em português.
Visual: pixel art, paleta fixa em `:root` no `src/style.css` — use só essas cores (ver "Estética" no GAME.md).

Teste manual no celular: abra o jogo com `?admin` no endereço (menu em `src/admin.js`; ao criar
mecânica nova, adicione lá um atalho para testá-la).

Ao mudar CSS/JS, aumente o `?v=N` deles no `index.html` (evita cache no celular).

Testes: `python3 tests/run_tests.py` (Playwright). Adicione um caso `caso_...` para cada regra nova ou bug corrigido.
- Mudança de **regra/mecânica**: rode **todos** antes de enviar.
- Mudança **só visual** (cor, tamanho, efeito, texto): rode só `python3 tests/run_tests.py rapido`
  (pula a física lenta) — ou nenhum, se não tocar em JS de jogo. Leia só a última linha do resultado.
