# Conceito do jogo (rascunho)

> Nome provisório: **Jogo Ainda Sem Nome**

## Ideia central
Roguelike inspirado no **Balatro**, mas **sem cartas**: o jogador rola **dados** e combina
os resultados com **alquimia e magias** para atingir pontuações cada vez maiores.

## Loop de jogo
1. **Rodada de dados** — rola os dados, segura os que quiser, rerola (número limitado).
2. **Combinação** — o resultado vira uma "receita" (par, trinca, sequência...) que gera pontos.
3. **Alquimia / magias** — ingredientes e feitiços modificam dados, receitas e multiplicadores
   (o equivalente aos coringas do Balatro).
4. **Entre as jogadas: livro-jogo** — trechos de história com escolhas.

## Combate
- Em turnos, **primeira pessoa**: inimigo de frente no topo, ações do jogador embaixo
  (layout inspirado em Undertale; a **estética será própria**, ainda a definir — manter um estilo único no jogo todo).
- Turno do jogador: rola, **seleciona** dados (toque) e rola de novo; os selecionados ficam.
  Ao **Atacar**, só os selecionados atacam (nenhum selecionado = todos).
  Dano = soma dos selecionados × multiplicador da combinação deles.
- O inimigo mostra a **intenção** (quanto vai atacar) e ataca de volta depois do seu ataque.
- **Reserva de defesa**: os dados **não selecionados e que não foram rolados de novo** vão para a reserva,
  que acumula entre turnos até o nº de dados que você tem (hoje 4). Rerrolar um dado o **gasta**
  (aparece apagado). Assim, não rolar de novo tem valor: os dados parados viram defesa.
  Truque: selecionar um dado para protegê-lo da rerrolagem e desselecioná-lo antes de atacar — ele vai para a defesa.
  (Regra provisória; pode mudar depois.)
- Quando o inimigo vai atacar e há reserva: **Defender** (rola a reserva toda, a soma bloqueia, reserva zera)
  ou **Aguentar** (leva o dano e guarda a reserva para um ataque maior).
- Futuro: escolher **quantos** dados de defesa usar (como habilidade a ganhar).
- Vida do jogador: 40. Vencer cura 30% e traz o próximo inimigo (mais forte). Vida zerada = derrota.
- Futuro: **especiais** por combinação (ex.: trinca = queimadura, sequência = raio, par = escudo),
  modificados por alquimia/magias.

## Dados e rolagens
- Começo: **4 dados** e **2 rolagens** por jogada.
- Dados e rolagens extras são recompensas (magias, ingredientes, escolhas da história).
- Limite: **6 dados** na bandeja; rolagens até **3 ou 4** no total (a decidir).
- Combinações (mult.): Sexteto ×15 · Quinteto ×10 · Quadra ×6 · Sequência grande (5) ×5 ·
  Casa cheia ×4 · Sequência (4) ×3 · Trinca ×3 · Dois pares ×2 · Par ×1,5.
  Quinteto, casa cheia e sequência grande só aparecem com 5+ dados; sexteto com 6.

## História emergente
- Estilo **livro-jogo**: escolhas entre as rodadas.
- As escolhas **mudam o personagem** (atributos, magias, maldições, aliados).
- Objetivo: histórias **emergentes**, diferentes a cada partida (referência: Dwarf Fortress).

## Estética
- **Pixel art** com paleta fixa estilo grimório (roxos, âmbar, verde-alquímico, vinho).
  Resolução lógica um pouco maior que a da amostra, para reduzir o serrilhado.
- **Todo pixel tem o mesmo tamanho na tela**; o que varia é quantos pixels cada sprite tem.
  Nunca esticar/encolher uma imagem gerada (mistura "pixels gordos" e "finos").
- Inimigos de **tamanhos variados**: pequeno ~32×32 · normal ~64×64 · grande ~96–128 ·
  chefe pode ocupar a cena inteira, com fundo próprio.
- Arte: inimigos e personagem gerados no **PixelLab** (Marcel envia os PNGs, já no tamanho final);
  cenário, bandeja, dados, interface e efeitos feitos em código. Ajustar as cores das imagens à paleta.

## Layout (futuro)
- Você aparece **de costas, na diagonal** (um pouco do rosto visível); o inimigo de frente.
- A bandeja pode **entrar e sair da tela** (ex.: sair para mostrar ataques e cenas).
- Menus de combate contextuais (ex.: escolher quantos dados de defesa usar).
- Amostra em pixel art (`amostra-pixel.html`): a cena em tamanho menor deixa **espaço livre nas laterais e embaixo**
  para menus de escolha e outros elementos — manter essa proporção.

## Ideias para avaliar depois
- **Colisões como mecânica** (via magias/ingredientes): dado de defesa que bate num de ataque
  dá bônus — ricochete (+1 bloqueio por batida), contra-ataque (devolve dano), faísca (dano extra).
- **Dado guardado: deixar na bandeja ou tirar da frente** (escolha simples, sem arrastar com o dedo):
  um dado segurado pode ficar na bandeja como obstáculo ou ser recolhido para fora dela (ex.: uma
  prateleira). Ex.: um 6 guardado na frente — deixar e os arremessados batem só nele, ou tirar para
  baterem em mais dados. Combina com as magias de colisão. Testar se a física deixa a escolha
  previsível o bastante para parecer estratégia e não só sorte.

## Em aberto
- Nome do jogo
- Estética visual do jogo (arte de inimigos, interface, bandeja)
- Tipos de dados (d6, d8, dados especiais?)
- Limite de rolagens: 3 ou 4?
- Sistema de ingredientes/magias
- Como a história e os dados se influenciam
