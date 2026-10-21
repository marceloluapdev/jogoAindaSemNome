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
- [x] Tutorial (`src/story.js`): abertura, taverna (jogo com Bartô), 2 lutas, 4º dado da dona; caixa de diálogo com retrato
- [x] Grimório de combinações (toque na combinação; novas aparecem como aviso)
- [x] Cidade (protótipo, `src/city.js`): praça 3/4, tocar para andar, dona (arte nova) e Bartô (provisório) conversam, portal do azar → 3 lutas → volta; derrota = "a Mesa reembaralha" e a dona fica menos grossa a cada derrota
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
- [ ] Teste `caso_tela_nao_pula` às vezes falha por 1px (já falhava antes; investigar)
- [ ] **Arte pendente no PixelLab** (créditos grátis acabaram; um state de 8 direções custa ~10 gerações):
  - [x] Dona no mapa: corpo inteiro, 8 direções, 64 px (`assets/npc/dona/`)
  - [ ] Dona: **caminhada** (Template motion → Skeleton v3 → Walking) — hoje a caminhada é feita no código
  - [ ] Dona: **expressões do retrato** (brava, neutra, sorrisinho tímido). Dica: criar o retrato como personagem
        de **1 direção** (de frente), para os states saírem mais baratos
  - [ ] **Sid no mapa**: low top-down, 64 px, corpo inteiro (usar o Sid atual como referência) + caminhada
  - [ ] **Cartomante, padre e guarda** no mapa (4 direções; hoje provisórios em código)
  - [ ] **Tiles da cidade** (calçamento, grama, caminho) e, se der, casas/objetos
  - [ ] **Bartô**: mapa (64 px, corpo inteiro) + retrato com expressões (bêbado, sóbrio, assustado)
  - Regra: personagens da cidade todos no **mesmo tamanho (64 px)**; pés com folga embaixo (Reframe Canvas)
- [ ] Nome da dona
- [x] Cidade maior (640×760, zoom 1 no celular): praça com fonte, taverna, casa do Bartô, mercado + tenda da cartomante, capela + padre, portão + guarda, beco do portal; caminho com desvio (A*)
- [ ] Cidade: entrar na taverna, tiles do PixelLab, caminhada animada do Sid/dona, cartomante/padre/guarda do PixelLab
- [ ] Layout: bandeja que entra/sai só na hora da ação (sobrepondo botões) + espaço para até 7 dados
- [ ] Cenário da taverna no PixelLab? (hoje em código, 144×106)
- [ ] Assinar o PixelLab (1 mês) e conectar ao Claude no PC (ver NOTAS.md) para produzir a arte pendente
- [ ] Cidade: kit de peças em código (tiles 16 px com transições, árvores/flores com variações, mapa como grade)
- [ ] (Futuro, sem prioridade) Testar pipeline 3D → pixel art com 1 personagem (ver NOTAS.md)
- [ ] Escolher um nome para o jogo
- [x] Arte provisória CC0 na cidade: grama, terra e objetos pequenos do Kenney *Tiny Town*, na paleta (ver `docs/ASSETS.md`)
- [x] Arte provisória LPC na cidade: casas (kit montado em código), árvores, barris, placas, guarda
- [x] Inimigos provisórios do LPC em 3 faixas (pequenos, médios, grandes), sorteados por luta
- [ ] Animar os monstros do LPC (3 quadros); balancear vida/ataque de cada um
- [x] NPCs provisórios do gerador LPC: Bartô, cartomante e padre (`tools/lpc_npc.py`)
- [x] Sid na cidade com caminhada animada (gerador LPC); no combate segue o do PixelLab
- [x] Fonte da praça refeita (bacia de pedra, duas taças, água animada)
- [x] Retratos das falas para todos (recorte do sprite; dona e LPC ampliados 2×) — provisórios até os retratos do PixelLab
- [ ] PixelLab (quando assinar): novas magias/poses do Sid, expressões, inimigos próprios
- [ ] Arte provisória: interior da taverna; mais monstros do OpenGameArt (diabrete, aranha, goblin, golem, lobisomem, ratos, ectoplasma)
- [ ] Tela de créditos no jogo (arte de terceiros, ver `docs/ASSETS.md`)
