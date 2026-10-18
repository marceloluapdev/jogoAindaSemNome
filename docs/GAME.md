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
  Vale só a **melhor** combinação (não acumulam), e **todos** os dados que atacam entram na soma, mesmo os
  que não fazem parte dela (ex.: 3-1-2-3 = Sequência curta, (3+1+2+3)×2). Decidido manter assim: para guardar
  o dado extra na defesa, basta não selecioná-lo.
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
- **Efeitos por combinação** (além do dano; valores pela soma dos dados que atacam), mostrados na prévia:
  **Par** escudo ⌈soma/2⌉ no próximo golpe · **Dois/Três pares** drena, cura ⌈soma/3⌉ ·
  **Trinca/Duas trincas** queima: inimigo perde "soma" depois do ataque dele ·
  **Sequência de 4+ / Duas sequências** raio: **chance** de atordoar (4: 35% · 5 e duas: 50% · 6: 70%;
  mostrada na prévia), inimigo perde o ataque; enquanto atordoado, **estrelinhas âmbar** giram sobre a cabeça dele. Futuro: magias/itens que aumentam a chance (`stunBonus`) ·
  **Quadra/Quinteto/Sexteto** maldição: inimigo ataca com metade da força pelo resto da luta ·
  **Casa cheia** escudo + queima · **Sequência curta** sem efeito (sai fácil demais para atordoar).
  Cada efeito tem sua magia (`SPELLS` em scene.js): rajada verde comum · azul + placa de escudo na sua frente ·
  vermelha + gotas drenadas voltando · âmbar com brasas + chamas no inimigo · raio em zigue-zague caindo do alto ·
  lilás + anel que se fecha e o inimigo escurece. Estados do inimigo aparecem como ícones ao lado da intenção. Futuro: modificados por alquimia/magias.
- **Fraqueza do inimigo por tipo de combinação: adiada.** Depender do dado para acertar a fraqueza
  pode parecer azar, e é difícil balancear agora. Se voltar: só como bônus (ex.: ×1,5), nunca obrigação,
  e quando houver mais inimigos diferentes.

## Dados e rolagens
- Começo: **4 dados** e **2 rolagens** por jogada.
- Dados e rolagens extras são recompensas (magias, ingredientes, escolhas da história).
- Limite: **6 dados** na bandeja; rolagens até **3 ou 4** no total (a decidir).
- Combinações (mult.) → efeito:
  Sexteto ×15 · Quinteto ×10 · Sequência completa (6) ×8 · Duas trincas ×7 · Quadra ×6 ·
  Sequência grande (5) ×5 · Casa cheia ×4 · Duas sequências ×4 · Sequência (4) ×3 · Trinca ×3 ·
  Três pares ×3 · Dois pares ×2 · Sequência curta (3) ×2 · Par ×1,5.
  Sequências contam pelo **tamanho** (3, 4, 5, 6 seguidos), não pelo nº de dados.
  Quinteto, casa cheia e sequência grande só com 5+ dados; sexteto, sequência completa e as
  **mãos duplas** (Duas sequências, Três pares, Duas trincas) só com 6.

## História emergente
- Lore, mitologia, personagens e tom: **`docs/HISTORIA.md`**.
- Estilo **livro-jogo**: escolhas entre as rodadas.
- As escolhas **mudam o personagem** (atributos, magias, maldições, aliados).
- Objetivo: histórias **emergentes**, diferentes a cada partida (referência: Dwarf Fortress).

## Tutorial integrado à história (rascunho)
- Começa com **3 dados** (menos coisa para entender); a história dá o **4º dado** depois do tutorial.
- Cada mecânica é apresentada por um momento da história, em lutas curtas e fáceis:
  1. **Prólogo (livro-jogo)**: a taverna, a aposta perdida, a maldição prende 3 dados à alma do apostador.
  2. **Luta 1** (na taverna): rolar, selecionar e atacar (1 rolagem, inimigo fraco).
  3. **Luta 2**: rolar de novo, dados "gastos" e a reserva de defesa; Defender x Concentrar.
  4. **Evento**: quem dá o **4º dado** é a **dona da taverna** onde ele estava jogando — ele a defendeu do inimigo
     das lutas do tutorial (o ataque acontece na própria taverna), e ela retribui com um dado.
     (Ideias descartadas por ora: arrancado do lodo derrotado; ganho numa nova aposta; oferecido pela maldição.)
  5. Carga da Maldição e Aposta Final podem ser ensinadas quando a carga encher pela primeira vez (no jogo livre).
- Depois disso, segue o jogo normal (livre).

## História: fases planejadas
- **Fase 1**: só retrato (rosto) + texto + escolhas (estilo visual novel simples).
- **Fase 2 (depois)**: exploração em mapinhas estilo **EarthBound** (andar, falar com personagens).
- Por isso as cenas/diálogos devem ser **dados separados da apresentação**: a mesma cena serve
  para a caixa de texto da fase 1 e para o diálogo de um personagem no mapa da fase 2.

## Livro-jogo: visual (a decidir)
Objetivo: **econômico, consistente e seguro**. Opções:
- **A) Estilo visual novel** (recomendado): poucos **cenários de fundo reutilizáveis** (taverna, masmorra, estrada...)
  + **retratos dos personagens** com expressões (normal, bravo, assustado, rindo) + caixa de texto e escolhas.
  Retratos/expressões via PixelLab **Create State** (mesmo personagem → consistente e barato).
  Fundos: desenhados em código no mesmo estilo da masmorra (grátis e consistente), ou gerados no PixelLab se
  houver ferramenta de cenário com custo aceitável.
- **B) Ilustração por cena** (cada página uma imagem): mais bonito, mas caro e difícil manter consistente.
- **C) Texto com vinhetas** (ícones/pequenas artes, estilo livros-jogo antigos): o mais barato.
- Imagens geradas por outra IA (ex.: GPT): risco de **inconsistência** de estilo; usar no máximo como referência.

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
- **Decidido**: foco no PixelLab + Claude montando em código. Divisão:
  personagens, inimigos e objetos → PixelLab · fundos de combate e da história → código ·
  mapinhas estilo EarthBound (fase 2) → tilesets do PixelLab. (Ludo.ai descartado por ora: gera "estilo pixel",
  não pixel real; no máximo um teste com os créditos grátis.)
- **Gerar sprites com folga**: o personagem não pode encostar na borda da imagem (ex.: imagem 64 px,
  personagem ~40–44 px de altura), senão poses maiores são cortadas (como o dado na Aposta Final).
  Magias/efeitos sempre em código, fora da sprite. Reduzir o tamanho geral na tela: polir depois.

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
