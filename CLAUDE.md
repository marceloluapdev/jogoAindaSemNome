# CLAUDE.md

Jogo 2D para navegador (HTML/CSS/JS puro, sem build), publicado no GitHub Pages.
Desenvolvido principalmente pelo celular — mantenha tudo testável no navegador mobile.

Leia só quando precisar:
- `docs/GAME.md` — conceito, mecânicas e regras do jogo
- `docs/TODO.md` — próximos passos e o que já foi feito

Convenções: código em `src/` (`dice.js` = dados/física/combinações, `scene.js` = cena em pixel art,
`combat.js` = combate e turnos), entrada em `index.html`. Arte em `assets/` (PNGs do PixelLab;
originais guardados com sufixo `_original`), scripts de edição de arte em `tools/`. Textos do jogo em português.
Visual: pixel art, paleta fixa em `:root` no `src/style.css` — use só essas cores (ver "Estética" no GAME.md).

Ao mudar CSS/JS, aumente o `?v=N` deles no `index.html` (evita cache no celular).

Testes: `python3 tests/run_tests.py` (Playwright). Rode antes de enviar mudanças de mecânica
e adicione um caso `caso_...` para cada regra nova ou bug corrigido.
