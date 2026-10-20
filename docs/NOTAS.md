# Notas de trabalho (o que não é regra do jogo)

Resumo das decisões de processo, ferramentas e combinados das conversas. Regras e mecânicas ficam no
GAME.md, história no HISTORIA.md, tarefas no TODO.md.

## Como trabalhamos
- Marcel desenvolve **pelo celular**; testa no navegador do celular (GitHub Pages).
- Quer **mostrar o protótipo para outras pessoas** e colher opiniões → priorizar o que deixa o jogo apresentável.
- **Economia de tokens**: abrir **uma conversa nova por assunto** (cidade, arte, balanceamento...). A memória do
  projeto fica nos docs (CLAUDE.md, GAME.md, HISTORIA.md, TODO.md, este arquivo). Juntar pedidos numa mensagem só;
  imagens pesam. Evitar vai-e-volta de ajustes mínimos.
- Ter **referência** (print de um jogo, um tile, um rabisco) reduz rodadas e gasto.
- Teste manual: `?admin` no endereço liga o menu ADM (fica ligado no aparelho; `?admin=off` desliga).
- Teste `caso_tela_nao_pula` às vezes falha por 1 px (já falhava antes; não é regressão).

## Arte: decisões
- **Manter pixel art.** Arte "pintada" estilo Hades foi descartada: impossível manter consistência por código/IA,
  pesada no celular e é onde o Claude menos consegue ajustar sozinho.
- **Divisão**: PixelLab = personagens, inimigos, retratos (e depois tiles/objetos); código = cenário, interface,
  efeitos, luzes. Consistência: mesmo personagem + states no PixelLab; paleta fixa + mesmas funções no código.
- **Kit de peças**: cenário montado com peças repetidas (tiles de 16 px com transições, 3 árvores, flores,
  postes...), e o mapa como lista/grade de posições. Peças em código podem ser trocadas uma a uma pelas do PixelLab.
- Desenhar **personagens por código** é o mais caro e o que fica pior (o vídeo do RafaxLab, "Dunloc Online",
  gastou ~44 milhões de tokens num rosto) — não vale para nós.
- **Ideia futura (sem prioridade)**: pipeline **3D → pixel art** (estilo Dead Cells): modelos com esqueleto
  (ex.: Quaternius, CC0; animações do Mixamo — gratuito, mas só pelo site com login, Claude não opera direto)
  renderizados por script no Blender em 8 direções, pixelados na paleta. Só se precisarmos de muitas animações
  complexas. Claude não modela um personagem 3D bonito do zero.
- Ludo.ai descartado (gera "estilo pixel", não pixel real).
- **Arte gratuita provisória** (decidido): enquanto o PixelLab está parado, usar arte de terceiros **CC0/CC-BY**
  (Kenney, OpenGameArt) para tiles, objetos e inimigos genéricos, e trocar depois por arte própria. Registro, regras
  e o que trocar: `docs/ASSETS.md`. CraftPix grátis descartado (proíbe redistribuir os arquivos; repo é público).

## PixelLab: aprendizados
- Plano grátis: ~40 gerações rápidas e depois ~5 lentas/dia (segundo review de terceiros — conferir no site).
  **Acabaram.** Plano de entrada ~US$ 12/mês (conferir). Plano: **assinar 1 mês** com a lista pronta (TODO, "Arte
  pendente") e cancelar depois se não precisar.
- **Conectar o PixelLab ao Claude no PC** (MCP, Claude Desktop) deixa o Claude gerar/conferir/encaixar sozinho;
  atenção: uso pela API pode ser cobrado à parte da assinatura.
- Um **state de 8 direções custa ~10 gerações**. Economizar: **4 direções** para o mapa; retratos como personagem
  de **1 direção** (de frente) para os states de expressão saírem baratos.
- Animação: **Template motion → Skeleton v3** (move o mesmo personagem, não redesenha — preferir) em vez de Free
  motion (redesenha cada quadro, detalhes mudam; 1 geração por direção).
- **State ≠ animação**: state = nova versão parada (pose, expressão, roupa); animação = quadros em movimento.
- Personagem saindo **sem pernas** (meia-figura): usar **Reframe Canvas** para aumentar a área (ex.: 64×64, sprite
  encostado em cima) e um **state** "full body, standing, legs and boots visible". Marcar **"Use color palette
  from reference"** para manter as cores.
- Gerar com **folga em volta** (não encostar nas bordas) quando a pose for crescer; para andar/parado não precisa.
- Personagens da cidade: **todos 64 px**, mesmo tamanho; câmera **low top-down**. Descrições em inglês.
- Exportação: o ZIP traz `rotations/<direção>.png`; o original vai para `assets/.../_original/`.

## Cidade
- Vista **3/4 de cima** (estilo EarthBound) por ser mais simples; diagonal estilo Hades ficou para depois (a arte do
  Sid e as 8 direções da dona até combinariam). Tocar para andar.
- Cidade usa **zoom 1 no celular** (pixels menores que na luta) para os personagens ocuparem menos espaço.

## Sobre o jogo parecido
- Jogos com dados + roguelike já existem (Dicey Dungeons, Dice a Million, Dicealot...). Diferenciais nossos:
  combinações estilo pôquer com efeitos, economia de defesa (reserva/Concentrar), física da bandeja, livro-jogo com
  história emergente e o tema (o acaso dá graça e faz sofrer; não glamourizar jogo de azar).
