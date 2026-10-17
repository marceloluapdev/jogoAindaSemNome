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

## Personagem
- Inicial: **Apostador Amaldiçoado** — jogador de taverna que perdeu a alma numa aposta e ficou preso aos dados.
  Chapéu largo, casaco puído, **dados pendurados** no chapéu/cabelo/roupa como amuletos (visíveis de costas).
  Ideia: cada dado novo que você ganha aparece pendurado nele.
- Futuro: **mais de um personagem inicial**. Candidato: **Homúnculo** (criatura com frasco brilhando nas costas;
  a cor do líquido e partes do corpo mudam com poções e escolhas). Outras ideias: Aprendiz de Alquimista, Vidente Vendado.

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
  ou **Concentrar** ("respirar fundo": leva o dano e guarda a reserva para um ataque maior).
- Botões com ícone em pixel art + nome pequeno: dado (Rolar), espada (Atacar), escudo (Defender), energia verde (Concentrar).
- Com a carga cheia, Concentrar vira **"Sem sorte"** (ícone: dado branco com uma mini caveira vermelha no lugar do 1): só leva o golpe e guarda a reserva.
  Defender gasta só a reserva; Aposta Final gasta só a carga (um recurso não consome o outro).
- Se a reserva vai transbordar, a prévia **avisa** quantos dados se perdem (em vermelho) e os quadradinhos
  que vão encher piscam. Princípio: o jogador sempre vê a consequência antes de confirmar.
- **Nada se perde**: o que não cabe na reserva vira **Carga da Maldição**. Só se reserva E carga estiverem cheias,
  Atacar fica bloqueado e a prévia pede para selecionar mais dados. Quadradinhos/segmentos que vão encher piscam.
  Princípio: o jogador sempre vê a consequência antes de confirmar.
- **Carga da Maldição** (5 segmentos verdes): enche com o excesso da reserva e com **+1 a cada Concentrar**.
- **Aposta Final** (ultimate, carga cheia): o apostador flutua, a masmorra escurece e **5 dados da maldição caem**
  no inimigo. Dano = soma × 3. Substitui o ataque do turno; carga zera. Ele sobe e **gira**: para de frente para nós e volta a encarar o inimigo
  (pose "flutuando" do PixelLab nas 8 direções, em `assets/hero/aposta/`).
  Efeitos (estilo magia de Super Nintendo/FF6: formas preenchidas, translúcidas, poucas faixas de cor, somando luz;
  carregam devagar durante o giro): aura verde atrás dele e um casulo translúcido
  envolvendo-o, e uma **aurora boreal** verde se formando sobre o inimigo — que continua enquanto os dados caem.
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
- **Efeitos de magia** no estilo SNES/FF6: preenchidos e translúcidos, 4 faixas de cor (escuro → núcleo claro),
  somando luz sobre o fundo. Nada de pontilhado "peneira" nas magias (o pontilhado fica só no brilho das tochas).
- Fontes: **Pixelify Sans** nos textos e **Silkscreen** só nos números (mais legíveis: 1/7 e 2/8 distintos).
- Inimigos de **tamanhos variados**: pequeno ~32×32 · normal ~64×64 · grande ~96–128 ·
  chefe pode ocupar a cena inteira, com fundo próprio.
- Arte: inimigos e personagem gerados no **PixelLab** (Marcel envia os PNGs, já no tamanho final);
  cenário, bandeja, dados, interface e efeitos feitos em código. Ajustar as cores das imagens à paleta.

## Layout (futuro)
- Você aparece **de costas, na diagonal** (um pouco do rosto visível); o inimigo de frente.
- A bandeja pode **entrar e sair da tela**: desliza para fora por baixo quando não está em uso e volta
  subindo quando precisa. A cena **não cresce** (o resto da tela fica parado).
- Menus de combate contextuais (ex.: escolher quantos dados de defesa usar).
- **Menu de ação com 4 botões** (estilo RPG clássico), cada um com ícone pixel + nome pequeno. Proposta:
  **Rolar** · **Atacar** · **Itens** (poções, ingredientes) · **Habilidades** (magias, especiais, Carga da Maldição).
  Itens e Habilidades abrem **submenu**: a bandeja desliza para baixo e a lista sobe no lugar dela;
  escolher/voltar devolve a bandeja. Botões que não se aplicam ficam apagados (ex.: Itens sem itens).
  No turno do inimigo, os 4 viram as escolhas de defesa (Defender, Concentrar...).
  Layout: 2×2 em telas estreitas, ou 4 lado a lado se couber.
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

- **Habilidade "Segurar a magia" (não atacar)**: um turno guardando todos os dados na reserva, sem atacar.
  Hoje é impossível — e isso pode ser **parte do enredo**: o apostador acredita que, depois de lançar os dados,
  não consegue conter a magia (seria parte da maldição). Mais tarde descobre que **sempre pôde segurar**,
  só não sabia — momento **cômico** da história que destrava a habilidade. Cuidado: evitar turnos de só defender
  ficarem lentos/repetitivos (limite da reserva ajuda).

## Em aberto
- Nome do jogo
- Tipos de dados (d6, d8, dados especiais?)
- Limite de rolagens: 3 ou 4?
- Sistema de ingredientes/magias
- Como a história e os dados se influenciam
