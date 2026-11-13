# -*- coding: utf-8 -*-
"""«Cinco minutos de hoy»: del botón de «Mis clases» a la tanda en el hub.

    python3 herramientas/prueba_hoy.py

Qué mira:
  · el botón sale cuando el alumno ya ha dado alguna clase, y solo entonces;
  · lleva lo que ya se ha dado, de lo último a lo más antiguo, y nada de lo
    que todavía no se ha dado;
  · en el hub salen seis ejercicios, todos de lo visto en clase y al menos
    la mitad de lo último;
  · van de uno en uno: acertar pasa al siguiente, fallar no, y se puede
    saltar; al final dice cuántos ha acertado y ofrece otra tanda o volver;
  · al salir, el hub vuelve a ser el de siempre;
  · una dirección con cosas que no existen no rompe nada.
"""
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from firebase_falso import monta
from playwright.sync_api import sync_playwright

B = os.environ.get("BASE", "http://127.0.0.1:8947")


def mas(dias):
    return (datetime.date.today() + datetime.timedelta(days=dias)).isoformat()


DB = {
    # lo último que ha dado es «si-tuviera»; antes, una rápida de por/para, un
    # repaso de «gustar» y «motor». Y tiene una clase puesta para la semana
    # que viene, que todavía no cuenta.
    "anna@x.com": {"email": "anna@x.com", "nombre": "Anna", "idioma": "it", "activo": True, "clases": [
        {"id": "motor", "fecha": mas(-30), "nota": ""},
        {"rapida": {"rid": "r1", "titulo": "Repaso: gustar", "repasoDe": "gustar", "temas": []},
         "fecha": mas(-20), "nota": ""},
        {"rapida": {"rid": "r2", "titulo": "Por y para", "temas": ["por-para"]}, "fecha": mas(-10), "nota": ""},
        {"id": "si-tuviera", "fecha": mas(-2), "nota": ""},
        {"id": "cuando-llegues", "fecha": mas(5), "nota": ""}]},
    # solo tiene clases por dar: todavía no hay nada que repasar
    "nueva@x.com": {"email": "nueva@x.com", "nombre": "Nueva", "idioma": "en", "activo": True, "clases": [
        {"id": "saludos", "fecha": mas(3), "nota": ""}]},
    "nadie@x.com": {"email": "nadie@x.com", "nombre": "Nadie", "idioma": "es", "activo": True, "clases": []},
}

err = []


def comprueba(cond, texto):
    if not cond:
        err.append(texto)
    print("   %s %s" % ("ok " if cond else "MAL", texto))


def entra(br, quien, pista):
    c = br.new_context(viewport={"width": 1200, "height": 900})
    monta(c, json.loads(json.dumps(DB)))
    c.add_init_script("localStorage.setItem('__falso_usuario','%s');"
                      "localStorage.setItem('jn_access_granted','true');"
                      "localStorage.setItem('jn_student_email','%s');"
                      "localStorage.setItem('jn_track','%s');" % (quien, quien, pista))
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    return c, pg


# Los enunciados que pueden salir de una lista de temas, calculados aparte del
# hub: con el banco de la página y temas.js, sin pasar por su código.
ENUNCIADOS = """(temas) => {
  const cfg = window.EXERCISE_HUB_CONFIG, out = [];
  temas.forEach(id => {
    const t = window.jnTemaPorId(id);
    const tema = cfg.topics[t.ejercicios || t.id];
    ((tema && tema.items) || []).forEach(it => { if(!t.g || it.g === t.g) out.push(it.prompt); });
  });
  return out;
}"""

# el enunciado tal como queda en la página, para comparar con el del banco
EN_PAGINA = """() => [...document.querySelectorAll('#ex-hub-container .exercise-block .exercise-prompt')].map(p => p.innerHTML)"""
NORMAL = """(html) => { const d = document.createElement('p'); d.innerHTML = html; return d.innerHTML; }"""


def tanda(pg):
    return pg.evaluate(EN_PAGINA)


with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")

    print("\n═══ el botón, en «Mis clases» ═══")
    c, pg = entra(br, "anna@x.com", "it")
    pg.goto(B + "/mis-clases-it.html", wait_until="load")
    pg.wait_for_timeout(1200)
    boton = pg.locator("#cl-hoy")
    comprueba(boton.count() == 1 and boton.is_visible(), "con clases dadas, sale el botón")
    comprueba("Cinque minuti di oggi" in boton.inner_text(), "y en su idioma")
    href = boton.get_attribute("href") or ""
    lista = href.split("?hoy=")[1].split(",") if "?hoy=" in href else []
    comprueba(href.startswith("ejercicios-it.html?hoy="), "lleva al hub de su pista")
    comprueba(lista == ["si-tuviera", "t:por-para", "gustar", "motor"],
              "con lo dado, de lo último a lo más antiguo (%s)" % ",".join(lista))
    comprueba("cuando-llegues" not in lista, "y sin la clase que todavía no se ha dado")
    antes_de = pg.evaluate("""() => { const h = document.getElementById('cl-hoy'), n = document.querySelector('.cl-nums');
      return h.getBoundingClientRect().top < n.getBoundingClientRect().top; }""")
    comprueba(antes_de, "va arriba, antes de los números")
    # el fondo puede ser un color liso o un degradado: vale cualquiera de los dos
    fondo = pg.evaluate("""(() => { const c = getComputedStyle(document.getElementById('cl-hoy'));
      return c.backgroundImage !== 'none' ? 'degradado' : c.backgroundColor; })()""")
    comprueba(fondo not in ("rgba(0, 0, 0, 0)", "transparent"), "y tiene fondo propio (%s)" % fondo)

    print("\n═══ la tanda, en el hub ═══")
    boton.click()
    pg.wait_for_load_state("load")
    pg.wait_for_timeout(900)
    comprueba("ejercicios-it.html" in pg.url and "hoy=" in pg.url, "el botón abre el hub")
    cab = pg.locator("#ex-repaso")
    comprueba(cab.count() == 1 and "Cinque minuti di oggi" in cab.inner_text(), "con su cabecera")
    comprueba(not pg.locator("#ex-mode-panel-tema .ex-category-grid").first.is_visible(),
              "sin pedirle que elija materia")
    comprueba(not pg.locator("#ex-level-filter-step").is_visible() and not pg.locator("#ex-hub-mix").is_visible()
              and not pg.locator("#ex-hub-toolbar").is_visible(),
              "ni filtros, ni mezcla, ni «otra tanda» a medias")

    def temas_de(ids):
        return pg.evaluate("ids => [].concat.apply([], ids.map(i => i.indexOf('t:') === 0 ? [i.slice(2)] : window.jnClasePorId(i).temas))", ids)

    ultimo = set(pg.evaluate(NORMAL, e) for e in pg.evaluate(ENUNCIADOS, temas_de(["si-tuviera"])))
    todo = set(pg.evaluate(NORMAL, e) for e in pg.evaluate(ENUNCIADOS, temas_de(lista)))
    comprueba(len(ultimo) >= 3 and len(todo) > len(ultimo), "el banco tiene de lo último (%d) y de lo anterior (%d)"
              % (len(ultimo), len(todo) - len(ultimo)))

    def mira(nombre):
        t = tanda(pg)
        comprueba(len(t) == 6, "%s: seis ejercicios (%d)" % (nombre, len(t)))
        # el mismo ejercicio es mismo enunciado Y misma respuesta: hay enunciados
        # que se repiten a propósito («Elige la forma correcta») con frases distintas
        pares = pg.evaluate("""() => [...document.querySelectorAll('#ex-hub-container .exercise-block')]
          .map(b => b.querySelector('.exercise-prompt').innerHTML + '|' + (b.dataset.answer || b.dataset.pairs || ''))""")
        comprueba(len(set(pares)) == len(pares), "%s: ninguno repetido" % nombre)
        fuera = [e for e in t if e not in todo]
        comprueba(not fuera, "%s: todos de lo visto en clase (%d de fuera)" % (nombre, len(fuera)))
        del_ultimo = len([e for e in t if e in ultimo])
        comprueba(del_ultimo >= 3, "%s: al menos la mitad de lo último (%d)" % (nombre, del_ultimo))
        return t

    primera = mira("primera tanda")

    print("\n═══ de uno en uno ═══")
    visibles = "[...document.querySelectorAll('#ex-hub-container .exercise-block')].filter(b => b.offsetParent !== null).length"
    cual = "[...document.querySelectorAll('#ex-hub-container .exercise-block')].findIndex(b => b.offsetParent !== null)"
    rotulo = lambda: pg.locator("#ex-uno-label").inner_text().strip()
    hechos = lambda: pg.evaluate("parseInt(localStorage.getItem('jn_total_done') || '0', 10)")
    comprueba(pg.evaluate(visibles) == 1 and pg.evaluate(cual) == 0, "se ve uno solo, el primero")
    comprueba(rotulo() == "1 / 6", "y arriba dice 1 / 6")
    A_LA_VISTA = """() => { const r = document.querySelector('#ex-hub-container .exercise-block.ex-actual').getBoundingClientRect();
      return r.top >= 0 && r.top < window.innerHeight * 0.75; }"""
    comprueba(pg.evaluate(A_LA_VISTA), "el ejercicio queda a la vista al llegar, sin tener que bajar")

    # contesta BIEN el que está delante, sea del tipo que sea
    ACIERTA = """() => {
      const b = document.querySelector('#ex-hub-container .exercise-block.ex-actual');
      const a = (b.dataset.answer || '').split('|')[0];
      const op = [...b.querySelectorAll('.option-btn')].find(x => x.dataset.value.trim().toLowerCase() === a.trim().toLowerCase());
      if(op){ op.click(); return; }
      if(b.querySelector('.order-word')){
        let resto = b.dataset.answer.trim();
        while(resto){
          const f = [...b.querySelectorAll('.order-word-bank .order-word')].filter(w => resto.startsWith(w.dataset.word))
            .sort((x, y) => y.dataset.word.length - x.dataset.word.length)[0];
          if(!f) break;
          resto = resto.slice(f.dataset.word.length).trim(); f.click();
        }
        b.querySelector('.order-check').click(); return;
      }
      if(b.querySelector('.match-item')){
        const cols = b.querySelectorAll('.match-col');
        [...cols[0].querySelectorAll('.match-item')].forEach(i => { i.click(); cols[1].querySelector('.match-item[data-key="' + i.dataset.key + '"]').click(); });
        return;
      }
      b.querySelector('.exercise-input').value = a; b.querySelector('.exercise-check').click();
    }"""
    FALLA = """() => {
      const b = document.querySelector('#ex-hub-container .exercise-block.ex-actual');
      const a = (b.dataset.answer || '').split('|')[0].trim().toLowerCase();
      const op = [...b.querySelectorAll('.option-btn')].find(x => x.dataset.value.trim().toLowerCase() !== a);
      if(op){ op.click(); return true; }
      const inp = b.querySelector('.exercise-input');
      if(inp){ inp.value = 'zzz'; b.querySelector('.exercise-check').click(); return true; }
      return false;
    }"""

    antes = hechos()
    pg.evaluate(ACIERTA)
    pg.wait_for_timeout(300)
    comprueba(rotulo() == "1 / 6" and "correct" in (pg.locator(".exercise-block.ex-actual .exercise-feedback").get_attribute("class") or ""),
              "al acertar felicita, y deja un momento para leerlo")
    pg.wait_for_timeout(1100)
    comprueba(rotulo() == "2 / 6" and pg.evaluate(cual) == 1 and pg.evaluate(visibles) == 1, "y pasa solo al segundo")
    comprueba(hechos() == antes + 1, "sumando al contador de ejercicios")

    fallado = pg.evaluate(FALLA)
    pg.wait_for_timeout(1500)
    if fallado:
        comprueba(rotulo() == "2 / 6" and "incorrect" in (pg.locator(".exercise-block.ex-actual .exercise-feedback").get_attribute("class") or ""),
                  "al fallar no pasa: se queda para volver a intentarlo")
    pg.locator("#ex-uno-saltar").click()
    pg.wait_for_timeout(200)
    comprueba(rotulo() == "3 / 6" and pg.evaluate(cual) == 2, "«saltar» pasa al siguiente sin contestar")
    comprueba(hechos() == antes + 1, "y no suma")

    for _ in range(4):
        pg.evaluate(ACIERTA)
        pg.wait_for_timeout(1250)
    fin = pg.locator(".ex-uno-fin")
    comprueba(fin.count() == 1 and fin.is_visible() and "Fatto!" in fin.inner_text(), "al acabar los seis sale el final")
    comprueba("5 su 6" in fin.inner_text(), "que dice cuántos ha acertado (%s)" % fin.locator(".ex-signal-sub").inner_text())
    comprueba(pg.locator("#ex-uno-barra").count() == 0 and pg.locator("#ex-uno-saltar").count() == 0
              and pg.locator("#ex-hub-container .exercise-block").count() == 0,
              "y ya no quedan ni la barra ni ejercicios sueltos")
    comprueba(hechos() == antes + 5, "cinco aciertos, cinco más en el contador")

    pg.locator("#ex-uno-otra").click()
    pg.wait_for_timeout(300)
    segunda = mira("otra tanda")
    comprueba(primera != segunda, "y no es la misma")
    comprueba(rotulo() == "1 / 6" and pg.evaluate(visibles) == 1, "otra vez de uno en uno, desde el primero")

    # acertar y saltar a la vez no puede adelantar dos
    pg.evaluate(ACIERTA)
    pg.wait_for_timeout(150)
    pg.locator("#ex-uno-saltar").click()
    pg.wait_for_timeout(1400)
    comprueba(rotulo() == "2 / 6", "acertar y darle a «saltar» enseguida avanza uno, no dos")

    # saltándolos todos, también hay final; y «volver» lleva a sus clases
    for _ in range(5):
        pg.locator("#ex-uno-saltar").click()
        pg.wait_for_timeout(120)
    comprueba("1 su 6" in pg.locator(".ex-uno-fin").inner_text(), "saltando el resto, el final dice 1 su 6")
    pg.locator("#ex-uno-volver").click()
    pg.wait_for_load_state("load")
    pg.wait_for_timeout(500)
    comprueba("mis-clases-it.html" in pg.url, "«volver» lleva a sus clases")
    pg.go_back()
    pg.wait_for_load_state("load")
    pg.wait_for_timeout(900)
    comprueba(rotulo() == "1 / 6", "y volviendo atrás, la tanda empieza de nuevo")

    print("\n═══ salir ═══")
    pg.locator("#ex-mode-back-tema").click()
    pg.wait_for_timeout(300)
    comprueba(pg.locator("#ex-repaso").count() == 0 and pg.locator("#ex-uno-barra").count() == 0
              and pg.locator("#ex-uno-saltar").count() == 0, "al cambiar de modo se van la cabecera, la barra y «saltar»")
    comprueba(pg.locator('.ex-mode-card[data-mode="tema"]').is_visible(), "y vuelven los tres modos")
    pg.locator('.ex-mode-card[data-mode="tema"]').click()
    pg.wait_for_timeout(300)
    comprueba(pg.locator("#ex-mode-panel-tema .ex-category-grid").first.is_visible(),
              "en «por tema» vuelven a salir las materias")
    pg.locator(".ex-cat-card:not(.ex-level-card)").first.click()
    pg.wait_for_timeout(300)
    n_vis = pg.evaluate("[...document.querySelectorAll('#ex-hub-container .exercise-block')].filter(b => b.offsetParent !== null).length")
    comprueba(n_vis == 12, "y una materia da su tanda normal: doce, todos a la vista (%d)" % n_vis)
    comprueba(pg.locator("#ex-level-filter-step").is_visible() and pg.locator("#ex-hub-mix").is_visible()
              and pg.locator("#ex-hub-toolbar").is_visible(), "con sus filtros, su mezcla y su «otra tanda»")
    c.close()

    print("\n═══ en el móvil ═══")
    c = br.new_context(viewport={"width": 390, "height": 760})
    monta(c, json.loads(json.dumps(DB)))
    c.add_init_script("localStorage.setItem('__falso_usuario','anna@x.com');localStorage.setItem('jn_access_granted','true');"
                      "localStorage.setItem('jn_student_email','anna@x.com');localStorage.setItem('jn_track','it');")
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    pg.goto(B + "/ejercicios-it.html?hoy=si-tuviera,motor", wait_until="load")
    pg.wait_for_timeout(900)
    comprueba(pg.evaluate(A_LA_VISTA), "al llegar, el ejercicio ya está en pantalla")
    comprueba(pg.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"),
              "y nada se sale por los lados")
    for _ in range(6):
        pg.locator("#ex-uno-saltar").click()
        pg.wait_for_timeout(120)
    comprueba(pg.locator(".ex-uno-fin").is_visible() and pg.evaluate(
        "(() => { const r = document.querySelector('.ex-uno-fin').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight * 0.75; })()"),
        "y el final también, sin tener que buscarlo")
    c.close()

    print("\n═══ direcciones raras ═══")
    c, pg = entra(br, "anna@x.com", "en")
    pg.goto(B + "/ejercicios-en.html?hoy=no-existe,t:tampoco,,", wait_until="load")
    pg.wait_for_timeout(700)
    comprueba(pg.locator("#ex-repaso").count() == 0 and pg.locator('.ex-mode-card[data-mode="tema"]').is_visible(),
              "si nada de la lista existe, el hub se queda como siempre")
    pg.goto(B + "/ejercicios-en.html?hoy=no-existe,frio", wait_until="load")
    pg.wait_for_timeout(700)
    comprueba("Five minutes for today" in pg.locator("#ex-repaso").inner_text()
              and pg.locator("#ex-hub-container .exercise-block").count() == 6,
              "si algo existe, salta lo que no y hace la tanda con el resto")
    # con una sola clase vista, las seis salen de ella
    solo = set(pg.evaluate(NORMAL, e) for e in pg.evaluate(ENUNCIADOS, pg.evaluate("window.jnClasePorId('frio').temas")))
    comprueba(all(e in solo for e in tanda(pg)), "y con una sola clase, las seis son de ella")
    c.close()

    print("\n═══ quien todavía no ha dado ninguna ═══")
    for quien, pista, por in (("nueva@x.com", "en", "solo tiene clases por dar"), ("nadie@x.com", "es", "no tiene clases")):
        c, pg = entra(br, quien, pista)
        pg.goto(B + "/mis-clases-%s.html" % pista, wait_until="load")
        pg.wait_for_timeout(1200)
        comprueba(pg.locator("#cl-hoy").count() == 0, "%s: no sale el botón" % por)
        c.close()

    print("\n═══ en español y en inglés ═══")
    for pista, titulo in (("es", "Cinco minutos de hoy"), ("en", "Five minutes for today")):
        c, pg = entra(br, "anna@x.com", pista)
        pg.goto(B + "/mis-clases-%s.html" % pista, wait_until="load")
        pg.wait_for_timeout(1200)
        comprueba(titulo in pg.locator("#cl-hoy").inner_text()
                  and (pg.locator("#cl-hoy").get_attribute("href") or "").startswith("ejercicios-%s.html" % pista),
                  "%s: «%s» y lleva a su hub" % (pista, titulo))
        c.close()
    br.close()

print("\n" + ("SIN ERRORES" if not err else "ERRORES:\n  " + "\n  ".join(err)))
sys.exit(1 if err else 0)
