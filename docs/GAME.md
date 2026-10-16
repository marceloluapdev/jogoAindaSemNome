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
- Turno do jogador: rola, segura, rola de novo e **Ataca**. Dano = soma dos dados × multiplicador da combinação.
- O inimigo mostra a **intenção** (quanto vai atacar) e ataca de volta depois do seu ataque.
- **Defesa**: cada rolagem que você não usou vira 1 **dado de defesa** (azul), rolado quando o inimigo ataca;
  a soma bloqueia o dano daquele ataque (o excesso não acumula — com poucos dados quase nunca sobra).
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
