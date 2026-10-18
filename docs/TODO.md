# TODO

## Feito
- [x] Estrutura inicial (CLAUDE.md, docs, index.html)
- [x] GitHub Pages ativo
- [x] Protótipo: rolar dados, segurar, rerolar, pontuação por combinação (começa com 4 dados e 2 rolagens; limite 6 dados)
- [x] Bandeja de dados estilo RPG com física simples (paredes, colisões, brilho na batida)
- [x] Dados em 3D que capotam de verdade; resultado = face que fica para cima
- [x] Combate em turnos em primeira pessoa (inimigo com vida e intenção, jogador com vida, vitória/derrota)
- [x] Seleção de dados para atacar; não selecionados e não rerrolados vão para a reserva de defesa (Defender/Aguentar)
- [x] Testes automáticos de casos de uso (`tests/run_tests.py`)
- [x] Estética pixel art aplicada ao jogo: cena (masmorra, tochas), Apostador Amaldiçoado e lodo do PixelLab, interface e dados no estilo
- [x] Variações de inimigo por cor (Lodo Errante / Venenoso / de Brasa)
- [x] Carga da Maldição + Aposta Final (pose flutuando do PixelLab girando nas 8 direções, dados caindo)
- [x] Menu de administrador (`?admin` no endereço, `src/admin.js`): forçar dados, chance de atordoar, estados
- [x] Efeitos por combinação (escudo, cura, queima, atordoa, maldição) + sequências de 3 a 6 e mãos duplas de 6 dados

## Próximos passos
- [ ] Mais inimigos (PixelLab) de tamanhos variados
- [ ] Layout: bandeja que desliza para baixo; menu de 4 botões (Rolar, Atacar, Itens, Habilidades) com submenus
- [ ] Balancear vida/ataque dos inimigos
- [ ] Primeiras magias/ingredientes que alteram dados ou multiplicador (ex.: aumentar a chance de atordoar)
- [ ] Ganhar dados/rolagens extras como recompensa (até 6 dados)
- [ ] Usar as colisões como mecânica (ver "Ideias para avaliar depois" no GAME.md)
- [ ] Decidir o visual do livro-jogo (ver opções no GAME.md) e fazer a primeira cena com 2–3 escolhas
- [ ] Atributos do personagem afetados pelas escolhas
- [ ] Tutorial integrado à história (começa com 3 dados; 4º dado vem da história — ver GAME.md). Explicar, um de cada vez:
  - selecionar dados = os que atacam e os que ficam na rerrolagem
  - não selecionados e não rerrolados vão para a reserva de defesa (rerrolar "gasta" o dado)
  - Defender x Concentrar (Concentrar = leva o golpe e guarda a reserva)
  - Carga da Maldição enche por **dois caminhos**: excesso da reserva **e** +1 a cada Concentrar
  - carga cheia libera a Aposta Final
- [ ] Teste `caso_tela_nao_pula` às vezes falha por 1px (já falhava antes; investigar)
- [ ] Escolher um nome para o jogo
