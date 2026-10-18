"""
Testes de casos de uso do jogo.

Abre o jogo num navegador invisível (Chromium headless), liga o modo de teste
(rolagens instantâneas com valores escolhidos pelo teste) e confere as regras.

Como rodar:
    pip install playwright
    python -m playwright install chromium
    python3 tests/run_tests.py            # todos
    python3 tests/run_tests.py reserva    # só os que têm "reserva" no nome
    python3 tests/run_tests.py rapido     # todos menos os lentos (física de verdade)

Para cada regra nova do jogo, adicione um caso aqui (função começando com
"caso_"). A docstring da função vira a descrição mostrada no resultado.
"""

import pathlib
import sys
import traceback

from playwright.sync_api import sync_playwright

GAME = (pathlib.Path(__file__).resolve().parent.parent / "index.html").as_uri()


class Jogo:
    """Atalhos para controlar o jogo pelo navegador."""

    def __init__(self, page):
        self.page = page

    def js(self, code):
        return self.page.evaluate(code)

    def estado(self):
        return self.js("""({
            dados: [...dice], selecionados: [...held], rolagens: rollsLeft,
            reserva: reserve, vida: player.hp, vidaMax: player.maxHp,
            inimigo: enemy.name, vidaInimigo: enemy.hp, intencao: enemy.intent,
            nivel: level, fim: over,
        })""")

    def rolar(self, *valores):
        """Rola os dados não selecionados; eles recebem estes valores, em ordem."""
        self.js(f"window.TEST_ROLLS.push(...{list(valores)})")
        self.page.click("#roll")
        self.page.wait_for_function("!rolling")

    def selecionar(self, *indices):
        """Toca nos dados (0 = primeiro) para selecionar/desselecionar."""
        for i in indices:
            self.page.locator(".die.attack").nth(i).click()

    def atacar(self):
        """Ataca e espera até: escolha de defesa, próximo turno ou tela de fim."""
        self.page.click("#attack")
        self.page.wait_for_function(
            "!document.getElementById('defense-buttons').hidden"
            " || !busy || !document.getElementById('overlay').hidden"
        )

    def esperando_defesa(self):
        return self.page.is_visible("#defense-buttons")

    def defender(self, *valores):
        self.js(f"window.TEST_ROLLS.push(...{list(valores)})")
        self.page.click("#defend")
        self.page.wait_for_function("!busy || !document.getElementById('overlay').hidden")

    def aguentar(self):
        self.page.click("#endure")
        self.page.wait_for_function("!busy || !document.getElementById('overlay').hidden")

    def inimigo(self, vida=None, intencao=None):
        """Ajusta o inimigo para o teste (ex.: vida alta para não morrer)."""
        if vida is not None:
            self.js(f"enemy.hp = enemy.maxHp = {vida}")
        if intencao is not None:
            self.js(f"enemy.intent = {intencao}")
        self.js("render()")

    def tela_final(self):
        return self.page.inner_text("#overlay-title") if self.page.is_visible("#overlay") else None


def igual(atual, esperado, o_que):
    assert atual == esperado, f"{o_que}: esperado {esperado!r}, veio {atual!r}"


# ---------------------------------------------------------------------------
# Casos de uso
# ---------------------------------------------------------------------------

def caso_inicio_do_jogo(j):
    """Começa com 4 dados, 2 rolagens, vida cheia e reserva vazia."""
    e = j.estado()
    igual(len(e["dados"]), 4, "dados")
    igual(e["rolagens"], 2, "rolagens")
    igual(e["vida"], e["vidaMax"], "vida")
    igual(e["reserva"], 0, "reserva")
    igual(j.page.is_disabled("#attack"), True, "Atacar antes de rolar")


def caso_rolagens_acabam(j):
    """Cada rolagem gasta uma; sem rolagens o botão Rolar fica desativado."""
    j.rolar(1, 2, 3, 4)
    igual(j.estado()["rolagens"], 1, "rolagens após 1ª")
    j.rolar(1, 2, 3, 4)
    igual(j.estado()["rolagens"], 0, "rolagens após 2ª")
    igual(j.page.is_disabled("#roll"), True, "Rolar sem rolagens")


def caso_selecionados_ficam_na_rerrolagem(j):
    """Dados selecionados não são rolados de novo."""
    j.rolar(6, 6, 2, 3)
    j.selecionar(0, 1)
    j.rolar(5, 5)  # só os 2 não selecionados rolam
    igual(j.estado()["dados"], [6, 6, 5, 5], "dados")


def caso_ataque_so_com_selecionados(j):
    """Só os selecionados atacam: dano = soma deles × multiplicador da combinação deles."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(5, 5, 5, 2)
    j.selecionar(0, 1, 2)            # trinca de 5
    j.atacar()
    j.aguentar()                      # a queimadura arde depois do ataque do inimigo
    igual(999 - j.estado()["vidaInimigo"], 45 + 15, "dano (15 × 3) + queimadura da trinca (15)")


def caso_sem_selecao_ataca_com_todos(j):
    """Sem nenhum selecionado, ataca com todos e nada vai para a reserva."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(3, 4, 5, 6)              # sequência de 4: 18 × 3
    j.atacar()
    e = j.estado()
    igual(999 - e["vidaInimigo"], 54, "dano")
    igual(e["reserva"], 0, "reserva")


def caso_nao_selecionados_vao_para_reserva(j):
    """Ao atacar, os não selecionados entram na reserva de defesa."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(6, 1, 2, 3)
    j.selecionar(0)
    j.atacar()
    igual(j.estado()["reserva"], 3, "reserva")


def caso_rerrolados_nao_vao_para_reserva(j):
    """Dado não selecionado que foi rolado de novo está gasto: não vai para a reserva."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(6, 6, 2, 3)
    j.selecionar(0, 1)
    j.rolar(1, 4)                    # os 2 não selecionados foram rolados de novo
    igual(j.page.inner_text("#damage").endswith("defesa"), False, "prévia sem defesa")
    j.atacar()
    igual(j.estado()["reserva"], 0, "reserva")


def caso_protegido_e_desselecionado_vai_para_reserva(j):
    """Selecionado na rerrolagem (não rolou de novo) e desselecionado antes do ataque: vai para a reserva."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(6, 6, 2, 3)
    j.selecionar(0, 1, 2)            # protege o 2 da rerrolagem
    j.rolar(5)                       # só o último rola de novo
    j.selecionar(2)                  # desseleciona o 2 → não foi rolado de novo
    j.atacar()
    igual(j.estado()["reserva"], 1, "reserva")


def caso_excesso_vira_carga(j):
    """O que não cabe na reserva vira Carga da Maldição (nada se perde)."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(6, 1, 2, 3)
    j.selecionar(0, 1)
    j.atacar()
    j.aguentar()                      # reserva 2 (+1 carga por Concentrar)
    j.rolar(6, 1, 2, 3)
    j.selecionar(0)                   # 3 iriam para a reserva: 2 cabem, 1 vira carga
    texto = j.page.inner_text("#damage")
    assert "+2" in texto and "+1" in texto, f"prévia: {texto!r}"
    j.atacar()
    e = j.estado()
    igual((e["reserva"], j.js("charge")), (4, 2), "(reserva, carga)")


def caso_concentrar_da_carga(j):
    """Concentrar (não defender) dá +1 de carga."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(6, 1, 2, 3)
    j.selecionar(0)
    j.atacar()
    j.aguentar()
    igual(j.js("charge"), 1, "carga")


def caso_concentrar_mostra_carga(j):
    """Não defender: 'Concentrar +1 carga'; com a carga cheia o botão vira 'Sem sorte' (só guarda a reserva)."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(6, 1, 2, 3)
    j.selecionar(0)
    j.atacar()
    assert "+1 carga" in j.page.inner_text("#endure"), j.page.inner_text("#endure")
    j.aguentar()
    j.js("charge = 5; render()")
    j.rolar(6, 1, 2, 3)
    j.selecionar(0, 1, 2)
    j.atacar()
    assert "Sem sorte" in j.page.inner_text("#endure"), j.page.inner_text("#endure")
    j.aguentar()
    igual(j.js("charge"), 5, "carga continua cheia")


def caso_tudo_cheio_bloqueia_ataque(j):
    """Reserva e carga cheias: Atacar fica bloqueado e pede para selecionar mais dados."""
    j.inimigo(vida=999, intencao=1)
    j.js("reserve = 4; charge = 5; render()")
    j.rolar(6, 1, 2, 3)
    j.selecionar(0)
    assert "selecione +3" in j.page.inner_text("#damage"), j.page.inner_text("#damage")
    igual(j.page.is_disabled("#attack"), True, "Atacar bloqueado")
    j.selecionar(1, 2, 3)
    igual(j.page.is_disabled("#attack"), False, "Atacar liberado")


def caso_aposta_final(j):
    """Carga cheia mostra a Aposta Final: 5 dados da maldição, dano = soma × 3, carga zera."""
    j.inimigo(vida=999, intencao=1)
    igual(j.page.is_visible("#ultimate"), False, "botão escondido sem carga")
    j.js("charge = 5; render()")
    igual(j.page.is_visible("#ultimate"), True, "botão visível com carga cheia")
    j.js("window.TEST_ROLLS.push(6, 5, 4, 3, 2)")
    j.page.click("#ultimate")
    j.page.wait_for_function("!busy || !document.getElementById('defense-buttons').hidden")
    e = j.estado()
    igual(999 - e["vidaInimigo"], 60, "dano (20 × 3)")
    igual(j.js("charge"), 0, "carga")


def caso_reserva_tem_limite(j):
    """A reserva acumula entre turnos até o número de dados (4)."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(6, 1, 2, 3)
    j.selecionar(0)
    j.atacar()
    j.aguentar()                      # reserva 3
    j.rolar(6, 1, 2, 3)
    j.selecionar(0, 1, 2)             # só 1 vai para a reserva: cabe
    j.atacar()
    j.aguentar()
    igual(j.estado()["reserva"], 4, "reserva (3 + 1, limite 4)")


def caso_defender_bloqueia_e_zera_reserva(j):
    """Defender rola a reserva toda; a soma bloqueia o ataque e a reserva zera."""
    j.inimigo(vida=999, intencao=10)
    j.rolar(6, 1, 2, 3)
    j.selecionar(0)
    j.atacar()
    assert j.esperando_defesa(), "deveria perguntar Defender/Concentrar"
    vida = j.estado()["vida"]
    j.defender(2, 3, 1)              # bloqueia 6 de 10
    e = j.estado()
    igual(vida - e["vida"], 4, "dano recebido")
    igual(e["reserva"], 0, "reserva")


def caso_defesa_maior_que_ataque(j):
    """Bloqueio maior que o ataque: não leva dano (o excesso não acumula)."""
    j.inimigo(vida=999, intencao=4)
    j.rolar(6, 1, 2, 3)
    j.selecionar(0)
    j.atacar()
    vida = j.estado()["vida"]
    j.defender(6, 6, 6)
    e = j.estado()
    igual(e["vida"], vida, "vida")
    igual(e["reserva"], 0, "reserva")


def caso_aguentar_guarda_reserva(j):
    """Concentrar: leva o dano inteiro e mantém a reserva."""
    j.inimigo(vida=999, intencao=7)
    j.rolar(6, 1, 2, 3)
    j.selecionar(0)
    j.atacar()
    vida = j.estado()["vida"]
    j.aguentar()
    e = j.estado()
    igual(vida - e["vida"], 7, "dano recebido")
    igual(e["reserva"], 3, "reserva")


def caso_sem_reserva_nao_pergunta(j):
    """Sem reserva, o inimigo ataca direto (sem botões de defesa)."""
    j.inimigo(vida=999, intencao=5)
    vida = j.estado()["vida"]
    j.rolar(1, 3, 5, 6)               # sem combinação (sequência atordoaria)
    j.atacar()
    igual(j.esperando_defesa(), False, "pergunta de defesa")
    igual(vida - j.estado()["vida"], 5, "dano recebido")


def caso_novo_turno_reseta(j):
    """Depois do ataque inimigo: rolagens voltam a 2 e seleção é limpa."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(1, 2, 3, 4)
    j.selecionar(0)
    j.rolar(5, 5, 5)
    j.atacar()
    e = j.estado()
    igual(e["rolagens"], 2, "rolagens")
    igual(e["selecionados"], [False] * 4, "seleção")
    igual(e["dados"], [None] * 4, "dados")


def caso_vitoria_traz_proximo_inimigo(j):
    """Zerar a vida do inimigo: vitória, cura 30% e próximo inimigo."""
    j.inimigo(vida=10, intencao=1)
    j.js("player.hp = 20; render()")
    j.rolar(6, 6, 6, 6)
    j.atacar()
    igual(j.tela_final(), "Vitória!", "tela")
    nome = j.estado()["inimigo"]
    j.page.click("#overlay-btn")
    e = j.estado()
    igual(e["nivel"], 1, "nível")
    assert e["inimigo"] != nome, "deveria ser outro inimigo"
    igual(e["vida"], 32, "vida (20 + 30% de 40)")


def caso_derrota(j):
    """Vida zerada: tela de derrota; Recomeçar volta ao início."""
    j.inimigo(vida=999, intencao=50)
    j.rolar(1, 3, 5, 6)
    j.atacar()
    igual(j.tela_final(), "Derrota", "tela")
    j.page.click("#overlay-btn")
    e = j.estado()
    igual((e["vida"], e["nivel"], e["reserva"], e["fim"]), (40, 0, 0, False), "recomeço")


def caso_combinacoes(j):
    """Tabela de combinações e pontos (soma × multiplicador)."""
    casos = {
        (2, 2, 2, 2): ("Quadra", 48),
        (3, 4, 5, 6): ("Sequência", 54),
        (5, 5, 5, 2): ("Trinca", 51),
        (1, 1, 5, 5): ("Dois pares", 24),
        (6, 6, 1, 3): ("Par", 24),
        (1, 2, 4, 6): ("Nada", 13),
        (1, 2, 3, 4, 5): ("Sequência grande", 75),
        (3, 3, 3, 2, 2): ("Casa cheia", 52),
        (4, 4, 4, 4, 4): ("Quinteto", 200),
        (6, 6, 6, 6, 6, 6): ("Sexteto", 540),
        (2, 3, 4, 6): ("Sequência curta", 30),
        (1, 2, 3, 4, 5, 6): ("Sequência completa", 168),
        (2, 3, 4, 2, 3, 4): ("Duas sequências", 72),
        (1, 1, 3, 3, 6, 6): ("Três pares", 60),
        (2, 2, 2, 5, 5, 5): ("Duas trincas", 147),
    }
    for dados, (nome, pontos) in casos.items():
        r = j.js(f"evaluate({list(dados)})")
        igual((r["name"], r["points"]), (nome, pontos), f"evaluate{dados}")


def caso_par_da_escudo(j):
    """Par: além do dano, um escudo de ⌈soma/2⌉ bloqueia o próximo golpe."""
    j.inimigo(vida=999, intencao=10)
    j.rolar(6, 6, 1, 1)
    j.selecionar(0, 1)               # par de 6: escudo 6, reserva 2
    assert "escudo" in j.page.inner_html("#combo"), "prévia mostra o escudo"
    j.atacar()
    j.aguentar()                      # não usa a reserva: só o escudo bloqueia
    igual(j.estado()["vida"], 40 - 4, "vida (10 - escudo 6)")


def caso_dois_pares_cura(j):
    """Dois pares: drena e cura ⌈soma/3⌉."""
    j.inimigo(vida=999, intencao=0)
    j.js("player.hp = 20; render()")
    j.rolar(5, 5, 4, 4)
    j.atacar()
    igual(j.estado()["vida"], 26, "vida (20 + 6)")


def caso_trinca_queima(j):
    """Trinca: o inimigo queima (perde a soma dos dados) depois do ataque dele."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(2, 2, 2, 6)
    j.selecionar(0, 1, 2)
    j.atacar()
    j.aguentar()
    igual(999 - j.estado()["vidaInimigo"], 18 + 6, "dano (6 × 3) + queimadura 6")


def caso_sequencia_atordoa(j):
    """Sequência: o inimigo fica atordoado e não ataca neste turno."""
    j.inimigo(vida=999, intencao=10)
    j.rolar(3, 4, 5, 6)
    j.atacar()
    igual(j.estado()["vida"], 40, "vida intacta")


def caso_quadra_amaldicoa(j):
    """Quadra: o inimigo ataca com metade da força pelo resto da luta."""
    j.inimigo(vida=999, intencao=10)
    j.rolar(2, 2, 2, 2)
    j.atacar()
    igual(j.estado()["vida"], 35, "vida (10 / 2)")
    j.js("newIntent(); render()")
    assert j.estado()["intencao"] <= 4, "próximas intenções pela metade"


def caso_par_da_escudo(j):
    """Par: além do dano, um escudo de ⌈soma/2⌉ bloqueia o próximo golpe."""
    j.inimigo(vida=999, intencao=10)
    j.rolar(6, 6, 1, 5)
    j.selecionar(0, 1)               # par de 6: escudo 6, reserva 2
    assert "escudo" in j.page.inner_html("#combo"), "prévia mostra o escudo"
    j.atacar()
    j.aguentar()                      # não usa a reserva: só o escudo bloqueia
    igual(j.estado()["vida"], 40 - 4, "vida (10 - escudo 6)")


def caso_dois_pares_cura(j):
    """Dois pares: drena e cura ⌈soma/3⌉."""
    j.inimigo(vida=999, intencao=0)
    j.js("player.hp = 20; render()")
    j.rolar(5, 5, 4, 4)
    j.atacar()
    igual(j.estado()["vida"], 26, "vida (20 + 6)")


def caso_trinca_queima(j):
    """Trinca: o inimigo queima (perde a soma dos dados) depois do ataque dele."""
    j.inimigo(vida=999, intencao=1)
    j.rolar(2, 2, 2, 6)
    j.selecionar(0, 1, 2)
    j.atacar()
    j.aguentar()
    igual(999 - j.estado()["vidaInimigo"], 18 + 6, "dano (6 × 3) + queimadura 6")


def caso_sequencia_atordoa(j):
    """Sequência de 4: chance de atordoar (prévia mostra %); acertando, o inimigo não ataca."""
    j.inimigo(vida=999, intencao=10)
    j.js("window.TEST_CHANCE = true")
    j.rolar(3, 4, 5, 6)
    assert "35%" in j.page.inner_text("#combo"), j.page.inner_text("#combo")
    j.atacar()
    igual(j.estado()["vida"], 40, "vida intacta")


def caso_sequencia_pode_falhar(j):
    """Sequência de 4: se a chance falhar, o inimigo ataca normalmente."""
    j.inimigo(vida=999, intencao=10)
    j.js("window.TEST_CHANCE = false")
    j.rolar(3, 4, 5, 6)
    j.atacar()
    igual(j.estado()["vida"], 30, "vida (40 - 10)")


def caso_sequencia_curta_nao_atordoa(j):
    """Sequência curta (3): só dano ×2, o inimigo ataca normalmente."""
    j.inimigo(vida=999, intencao=10)
    j.rolar(2, 3, 4, 1)
    j.selecionar(0, 1, 2)
    j.atacar()
    j.aguentar()
    e = j.estado()
    igual((999 - e["vidaInimigo"], e["vida"]), (18, 30), "(dano 9 × 2, vida 40 - 10)")


def caso_quadra_amaldicoa(j):
    """Quadra: o inimigo ataca com metade da força pelo resto da luta."""
    j.inimigo(vida=999, intencao=10)
    j.rolar(2, 2, 2, 2)
    j.atacar()
    igual(j.estado()["vida"], 35, "vida (10 / 2)")
    j.js("newIntent(); render()")
    assert j.estado()["intencao"] <= 4, "próximas intenções pela metade"


def caso_cena_pixel_carrega(j):
    """A cena em pixel art carrega o sprite do inimigo (48×48) e o personagem (64×64)."""
    j.page.wait_for_function("document.getElementById('enemy-sprite').width === 48")
    j.page.wait_for_function("document.getElementById('hero').naturalWidth === 64")
    igual(j.estado()["inimigo"], "Lodo Errante", "primeiro inimigo")


def caso_variacao_de_cor_do_inimigo(j):
    """Vencer troca para a variação seguinte (mesmo sprite, outra cor)."""
    j.inimigo(vida=1, intencao=1)
    j.rolar(1, 1, 1, 1)
    j.atacar()
    j.page.click("#overlay-btn")
    igual(j.estado()["inimigo"], "Lodo Venenoso", "segundo inimigo")
    j.page.wait_for_function("document.getElementById('enemy-sprite').width === 48")


def caso_fisica_sem_dados_encavalados(j):
    """Física de verdade (10 rodadas): ao final, nenhum dado fica encavalado em outro — inclusive defesa x selecionados."""
    j.js("window.TEST_MODE = false")
    medir = """() => { const a = bodies.filter(b => b.active); let w = 0;
      for (let i = 0; i < a.length; i++) for (let k = i + 1; k < a.length; k++) {
        const ox = DIE_SIZE - Math.abs(a[i].x - a[k].x), oy = DIE_SIZE - Math.abs(a[i].y - a[k].y);
        if (ox > 0 && oy > 0) w = Math.max(w, Math.min(ox, oy)); }
      return w; }"""
    for rodada in range(10):
        j.js("resetDice()")
        j.js("new Promise(res => rollDice(res))")
        j.page.wait_for_function("!rolling", timeout=10000)
        assert j.js(medir) <= 0.5, f"rodada {rodada}: dados de ataque encavalados"
        j.js("held = [true, true, false, false]; render()")
        j.js("new Promise(res => rollDefense(3, res))")
        j.page.wait_for_function("!rolling", timeout=10000)
        assert j.js(medir) <= 0.5, f"rodada {rodada}: dado de defesa encavalado"


def caso_tela_nao_pula(j):
    """Cena, bandeja e botões ficam no mesmo lugar ao rolar e ao trocar ataque ↔ defesa (mesmo com nome longo)."""
    for w, h in [(320, 600), (360, 640), (412, 760)]:
        j.page.set_viewport_size({"width": w, "height": h})
        j.js("resetDice(); busy = false; over = false; reserve = 0; charge = 5; rollsLeft = 2;"
             "enemy.name = 'Lodo de Brasa Ancestral'; enemy.hp = enemy.maxHp = 999; render()")
        pos = """['scene', 'tray'].map(i => document.getElementById(i).getBoundingClientRect().top | 0)
                 .concat([document.querySelector('.buttons:not([hidden])').getBoundingClientRect().top | 0])"""
        antes = j.js(pos)
        j.rolar(6, 1, 2, 3)
        j.selecionar(0)
        depois = j.js(pos)
        j.atacar()
        defesa = j.js(pos)
        igual((depois, defesa), (antes, antes), f"{w}x{h} posições (cena, bandeja, botões)")
        j.defender(1, 1, 1)


def caso_tela_cabe_no_celular(j):
    """Em vários tamanhos de celular, nome do inimigo e botões ficam visíveis sem rolar."""
    for w, h in [(360, 560), (360, 640), (390, 664), (412, 760), (430, 860)]:
        j.page.set_viewport_size({"width": w, "height": h})
        j.page.wait_for_timeout(50)
        nome = j.page.locator("#enemy-name").bounding_box()
        botao = j.page.locator("#attack").bounding_box()
        assert nome["y"] >= 0, f"{w}x{h}: nome do inimigo fora da tela"
        assert botao["y"] + botao["height"] <= h, f"{w}x{h}: botões fora da tela"
        igual(j.js("document.documentElement.scrollHeight") <= h, True, f"{w}x{h} sem rolagem")


# ---------------------------------------------------------------------------

def main():
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    LENTOS = ("fisica",)
    if filtro == "rapido":
        casos = [(n, f) for n, f in globals().items()
                 if n.startswith("caso_") and not any(l in n for l in LENTOS)]
    else:
        casos = [(n, f) for n, f in globals().items() if n.startswith("caso_") and filtro in n]
    falhas = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for nome, caso in casos:
            page = browser.new_page(viewport={"width": 390, "height": 800})
            erros = []
            page.on("pageerror", lambda e: erros.append(str(e)))
            page.add_init_script("window.TEST_MODE = true; window.TEST_ROLLS = [];")
            page.goto(GAME)
            descricao = (caso.__doc__ or nome).strip()
            try:
                caso(Jogo(page))
                assert not erros, f"erro no jogo: {erros[0]}"
                print(f"  ✓ {descricao}")
            except Exception as e:
                falhas += 1
                msg = str(e) or traceback.format_exc(limit=1)
                print(f"  ✗ {descricao}\n      → {msg}")
            page.close()
        browser.close()
    total = len(casos)
    print(f"\n{total - falhas}/{total} casos passaram.")
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
