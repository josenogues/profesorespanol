# -*- coding: utf-8 -*-
"""El examen de nivel del hub de ejercicios, de principio a fin.

    python3 herramientas/prueba_examen.py

No estaba probado en ningún sitio y es de lo más enrevesado que tiene la web:
preguntas de cinco tipos, el progreso que se guarda si te sales a medias, el
«continuar donde lo dejaste»… Al sacar el hub de script.js a su propio archivo
había que poder demostrar que seguía igual.

Qué mira:
  · se entra por nivel, empieza el examen y cuenta las preguntas;
  · acertar avanza, suma al contador de ejercicios y felicita;
  · fallar enseña la respuesta y avanza también;
  · salir a medias lo guarda —en el navegador y en la ficha— y al volver
    ofrece continuar justo donde estaba, también tras recargar la página;
  · y que una pregunta de emparejar sigue funcionando al continuar sin
    recargar: ahí había un fallo (ver «emparejar tras continuar»).

Se puede apuntar a otra copia del sitio con BASE=http://127.0.0.1:PUERTO.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from firebase_falso import monta
from playwright.sync_api import sync_playwright

B = os.environ.get("BASE", "http://127.0.0.1:8947")
QUIEN = "brandon@x.com"
DB = {QUIEN: {"email": QUIEN, "nombre": "Brandon", "idioma": "en", "nivel": "A1",
              "activo": True, "exerciseCount": 0, "clases": []}}

err = []


def comprueba(cond, texto):
    if not cond:
        err.append(texto)
    print("   %s %s" % ("ok " if cond else "MAL", texto))


# Azar fijo: el examen baraja, y así sale siempre el mismo.
AZAR = """
(() => { let s = 4321;
  Math.random = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; })();
"""

# Qué tipo de pregunta hay delante.
TIPO = """() => {
  const it = document.querySelector('#ex-exam-question .ex-exam-item');
  if(!it) return 'nada';
  if(it.querySelector('.ex-exam-option')) return 'elegir';
  if(it.querySelector('.ex-exam-order-word')) return 'ordenar';
  if(it.querySelector('.ex-exam-match-item')) return 'emparejar';
  return 'escribir';
}"""

# Contesta BIEN la pregunta que hay delante. Devuelve false si no sabe (una
# de ordenar cuyas fichas no casan a la primera con la respuesta).
ACIERTA = """() => {
  const it = document.querySelector('#ex-exam-question .ex-exam-item');
  if(it.querySelector('.ex-exam-option')){
    const a = it.dataset.answer.trim().toLowerCase();
    [...it.querySelectorAll('.ex-exam-option')].find(b => b.dataset.value.trim().toLowerCase() === a).click();
    return true;
  }
  if(it.querySelector('.ex-exam-order-word')){
    let resto = it.dataset.answer.trim();
    const banco = it.querySelector('.ex-exam-order-bank');
    while(resto){
      const fichas = [...banco.querySelectorAll('.ex-exam-order-word')]
        .filter(w => resto.startsWith(w.dataset.word))
        .sort((x, y) => y.dataset.word.length - x.dataset.word.length);
      if(!fichas.length) return false;
      resto = resto.slice(fichas[0].dataset.word.length).trim();
      fichas[0].click();
    }
    it.querySelector('.ex-exam-order-check').click();
    return true;
  }
  if(it.querySelector('.ex-exam-match-item')){
    const cols = it.querySelectorAll('.match-col');
    [...cols[0].querySelectorAll('.ex-exam-match-item')].forEach(izq => {
      izq.click();
      cols[1].querySelector('.ex-exam-match-item[data-key="' + izq.dataset.key + '"]').click();
    });
    return true;
  }
  const inp = it.querySelector('.ex-exam-input');
  inp.value = it.dataset.answer.split('|')[0];
  it.querySelector('.ex-exam-check').click();
  return true;
}"""

FALLA = """() => {
  const it = document.querySelector('#ex-exam-question .ex-exam-item');
  if(it.querySelector('.ex-exam-option')){
    const a = it.dataset.answer.trim().toLowerCase();
    [...it.querySelectorAll('.ex-exam-option')].find(b => b.dataset.value.trim().toLowerCase() !== a).click();
  } else if(it.querySelector('.ex-exam-order-word')){
    it.querySelector('.ex-exam-order-check').click();
  } else if(it.querySelector('.ex-exam-match-item')){
    const cols = it.querySelectorAll('.match-col');
    const izq = cols[0].querySelector('.ex-exam-match-item');
    izq.click();
    [...cols[1].querySelectorAll('.ex-exam-match-item')].find(d => d.dataset.key !== izq.dataset.key).click();
    return 'emparejar';
  } else {
    it.querySelector('.ex-exam-input').value = 'zzz';
    it.querySelector('.ex-exam-check').click();
  }
  return 'otra';
}"""


def rotulo(pg):
    return pg.locator("#ex-exam-progress-label").inner_text().strip()


def hechos(pg):
    return pg.evaluate("parseInt(localStorage.getItem('jn_total_done') || '0', 10)")


def entra_al_nivel(pg):
    if pg.locator('.ex-mode-card[data-mode="nivel"]').is_visible():
        pg.locator('.ex-mode-card[data-mode="nivel"]').click()
        pg.wait_for_timeout(200)
    pg.locator('.ex-level-card[data-level="A1"]').click()
    pg.wait_for_timeout(300)


def acierta(pg):
    """Acierta la pregunta de delante y espera a la siguiente."""
    antes = rotulo(pg)
    if not pg.evaluate(ACIERTA):
        pg.evaluate(FALLA)
        pg.wait_for_timeout(1900)
        return False
    pg.wait_for_function("a => document.getElementById('ex-exam-progress-label').textContent.trim() !== a",
                         arg=antes, timeout=5000)
    return True


with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    c = br.new_context(viewport={"width": 1200, "height": 900})
    monta(c, json.loads(json.dumps(DB)))
    c.add_init_script(AZAR + "localStorage.setItem('__falso_usuario','%s');"
                      "localStorage.setItem('jn_access_granted','true');"
                      "localStorage.setItem('jn_student_email','%s');"
                      "localStorage.setItem('jn_track','en');" % (QUIEN, QUIEN))
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    pg.goto(B + "/ejercicios-en.html", wait_until="load")
    pg.wait_for_timeout(900)

    print("\n═══ empezar ═══")
    entra_al_nivel(pg)
    comprueba(pg.locator("#ex-level-exam-step").is_visible(), "al elegir nivel sale la invitación al examen")
    comprueba("A1" in pg.locator("#ex-exam-cta-title").inner_text(), "y dice de qué nivel es")
    pg.locator("#ex-exam-start-btn").click()
    pg.wait_for_timeout(400)
    comprueba(pg.locator("#ex-exam-runner").is_visible() and not pg.locator("#ex-mode-panel-nivel").is_visible(),
              "empezar esconde el panel y enseña el examen")
    r = rotulo(pg)
    total = int(r.split("/")[1])
    comprueba(r.startswith("1 /") and 10 <= total <= 100, "empieza en la 1 de %d" % total)

    print("\n═══ acertar ═══")
    base = hechos(pg)
    buenas, tipos = 0, set()
    for _ in range(5):
        tipos.add(pg.evaluate(TIPO))
        if acierta(pg):
            buenas += 1
    comprueba(buenas >= 4, "las respuestas buenas se dan por buenas (%d de 5; tipos: %s)" % (buenas, sorted(tipos)))
    comprueba(rotulo(pg).startswith("6 /"), "cinco contestadas: va por la 6 (%s)" % rotulo(pg))
    comprueba(hechos(pg) == base + buenas, "cada acierto suma al contador de ejercicios (%d)" % hechos(pg))

    print("\n═══ fallar ═══")
    # una que no sea de emparejar, que esa no enseña la respuesta
    while pg.evaluate(TIPO) == "emparejar":
        if acierta(pg):
            buenas += 1
    antes_fallo, en_fallo = hechos(pg), rotulo(pg)
    pg.evaluate(FALLA)
    pg.wait_for_timeout(300)
    fb = pg.locator("#ex-exam-question .ex-exam-feedback")
    comprueba("incorrect" in (fb.get_attribute("class") or ""), "un fallo se marca como fallo")
    pg.wait_for_timeout(1700)
    comprueba(rotulo(pg) != en_fallo, "y pasa a la siguiente")
    comprueba(hechos(pg) == antes_fallo, "sin sumar al contador")

    print("\n═══ salir a medias y continuar ═══")
    vistas = int(rotulo(pg).split("/")[0]) - 1
    pg.locator("#ex-exam-exit").click()
    pg.wait_for_timeout(400)
    comprueba(not pg.locator("#ex-exam-runner").is_visible() and pg.locator("#ex-mode-panel-nivel").is_visible(),
              "salir devuelve al panel de niveles")
    pend = pg.evaluate("JSON.parse(localStorage.getItem('jn_exam_pending_en') || '{}').A1 || null")
    comprueba(bool(pend) and pend["correctCount"] == buenas and len(pend["remainingItems"]) == total - vistas
              and len(pend["wrongItems"]) == vistas - buenas,
              "lo hecho queda guardado: %s buenas, %s por ver" % (pend and pend["correctCount"],
                                                                  pend and len(pend["remainingItems"])))
    nube = pg.evaluate("(window.__DB['%s'].examPending || {}).en" % QUIEN)
    comprueba(bool(nube) and nube["A1"]["correctCount"] == buenas, "y también en su ficha")
    entra_al_nivel(pg)
    pg.locator("#ex-exam-start-btn").click()
    pg.wait_for_timeout(300)
    comprueba(pg.locator("#ex-exam-resume-continue").is_visible(), "al volver pregunta si continúa")
    pg.locator("#ex-exam-resume-continue").click()
    pg.wait_for_timeout(400)
    comprueba(rotulo(pg) == "1 / %d" % (total - vistas), "y sigue con las %d que quedaban" % (total - vistas))
    if acierta(pg):
        buenas += 1
    comprueba(rotulo(pg).startswith("2 /"), "se puede seguir contestando")

    print("\n═══ emparejar tras continuar ═══")
    # Las de emparejar solo existen de B1 para arriba y salen pocas, así que
    # en vez de esperar a que toque una se le pone delante: se sale, se cuelan
    # dos al principio de lo que quedaba —con el mismo formato en que el
    # examen guarda las suyas— y se continúa.
    #
    # Lo que se prueba: llegar a una de emparejar, salirse sin contestarla y
    # continuar SIN recargar. El examen escuchaba los clics de emparejar en la
    # caja que dura todo el examen, no en la pregunta: al continuar, la
    # pregunta abandonada seguía escuchando, cada clic se apuntaba dos veces
    # —una marca y la otra desmarca— y no había forma de emparejar nada.
    pg.locator("#ex-exam-exit").click()
    pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      const todo = JSON.parse(localStorage.getItem('jn_exam_pending_en'));
      const tema = todo.A1.remainingItems[0]._topicKey;
      const una = (pares) => ({ type: 'match', level: 'A1', prompt: 'Match each word', pairs: pares, _topicKey: tema });
      todo.A1.remainingItems.unshift(
        una([['uno', 'one'], ['dos', 'two'], ['tres', 'three']]),
        una([['rojo', 'red'], ['azul', 'blue']]));
      localStorage.setItem('jn_exam_pending_en', JSON.stringify(todo));
    }""")

    def continua():
        entra_al_nivel(pg)
        pg.locator("#ex-exam-start-btn").click()
        pg.wait_for_timeout(300)
        pg.locator("#ex-exam-resume-continue").click()
        pg.wait_for_timeout(400)

    continua()
    comprueba(pg.evaluate(TIPO) == "emparejar", "sale la pregunta de emparejar")
    # se abandona sin contestar…
    pg.locator("#ex-exam-exit").click()
    pg.wait_for_timeout(300)
    # …y se continúa sin recargar la página
    continua()
    comprueba(pg.evaluate(TIPO) == "emparejar", "al continuar vuelve la misma")
    pares = int(pg.locator("#ex-exam-question .ex-exam-item").get_attribute("data-pairs"))
    en_esta = rotulo(pg)
    pg.evaluate(ACIERTA)
    pg.wait_for_timeout(200)
    casadas = pg.locator("#ex-exam-question .ex-exam-match-item.matched").count()
    comprueba(casadas == pares * 2, "y se puede emparejar (%d de %d casadas)" % (casadas, pares * 2))
    pg.wait_for_timeout(1200)
    comprueba(rotulo(pg) != en_esta, "al completarla pasa a la siguiente")
    # la segunda: un par mal y luego bien. En la primera ronda cuenta como
    # fallo aunque acabe emparejándolo todo, y tiene que avanzar igual.
    comprueba(pg.evaluate(TIPO) == "emparejar", "que es la otra de emparejar")
    en_esta = rotulo(pg)
    pg.evaluate(FALLA)
    pg.wait_for_timeout(700)
    comprueba(pg.locator("#ex-exam-question .ex-exam-match-item.matched").count() == 0
              and pg.locator("#ex-exam-question .ex-exam-match-item.selected").count() == 0,
              "un par equivocado no se queda casado ni marcado")
    pg.evaluate(ACIERTA)
    pg.wait_for_timeout(2000)
    comprueba(rotulo(pg) != en_esta, "y emparejándolo todo después, sigue adelante")

    print("\n═══ tras recargar ═══")
    quedaban = int(rotulo(pg).split("/")[1]) - int(rotulo(pg).split("/")[0]) + 1
    pg.locator("#ex-exam-exit").click()
    pg.wait_for_timeout(300)
    pg.reload(wait_until="load")
    pg.wait_for_timeout(900)
    entra_al_nivel(pg)
    pg.locator("#ex-exam-start-btn").click()
    pg.wait_for_timeout(300)
    comprueba(pg.locator("#ex-exam-resume-continue").is_visible(), "recargada la página, sigue ofreciendo continuar")
    pg.locator("#ex-exam-resume-continue").click()
    pg.wait_for_timeout(400)
    comprueba(rotulo(pg) == "1 / %d" % quedaban, "con las %d que quedaban" % quedaban)
    comprueba(pg.evaluate(TIPO) != "nada", "y la pregunta está ahí")
    pg.locator("#ex-exam-exit").click()
    pg.wait_for_timeout(300)

    print("\n═══ empezar de cero ═══")
    entra_al_nivel(pg)
    pg.locator("#ex-exam-start-btn").click()
    pg.wait_for_timeout(300)
    pg.locator("#ex-exam-resume-restart").click()
    pg.wait_for_timeout(400)
    comprueba(rotulo(pg) == "1 / %d" % total, "«empezar de cero» vuelve a las %d" % total)
    comprueba(not pg.evaluate("(JSON.parse(localStorage.getItem('jn_exam_pending_en') || '{}')).A1"),
              "y borra lo que había a medias")
    br.close()

print("\n" + ("SIN ERRORES" if not err else "ERRORES:\n  " + "\n  ".join(err)))
sys.exit(1 if err else 0)
