# -*- coding: utf-8 -*-
"""«Cinco minutos de hoy»: del botón de «Mis clases» a la tanda en el hub.

    python3 herramientas/prueba_hoy.py

Qué mira:
  · el botón sale cuando el alumno ya ha dado alguna clase, y solo entonces;
  · lleva lo que ya se ha dado, de lo último a lo más antiguo, y nada de lo
    que todavía no se ha dado;
  · en el hub salen seis ejercicios, todos de lo visto en clase y al menos
    la mitad de lo último;
  · «otra tanda» y los filtros de nivel siguen funcionando, y al salir el
    hub vuelve a ser el de siempre;
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
    fondo = pg.evaluate("getComputedStyle(document.getElementById('cl-hoy')).backgroundColor")
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
    comprueba(pg.locator("#ex-hub-toolbar").is_visible(), "y con el botón de otra tanda")

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
    pg.locator("#ex-hub-generate").click()
    pg.wait_for_timeout(300)
    segunda = mira("otra tanda")
    comprueba(primera != segunda, "y no es la misma")

    # se corrigen como cualquier ejercicio y suman al contador
    antes = pg.evaluate("parseInt(localStorage.getItem('jn_total_done') || '0', 10)")
    hecho = pg.evaluate("""() => {
      for(const b of document.querySelectorAll('#ex-hub-container .exercise-block')){
        const a = (b.dataset.answer || '').split('|')[0];
        const op = [...b.querySelectorAll('.option-btn')].find(x => x.dataset.value.trim().toLowerCase() === a.trim().toLowerCase());
        if(op){ op.click(); return true; }
        const inp = b.querySelector('.exercise-input');
        if(inp){ inp.value = a; b.querySelector('.exercise-check').click(); return true; }
      }
      return false;
    }""")
    pg.wait_for_timeout(200)
    comprueba(hecho and pg.evaluate("parseInt(localStorage.getItem('jn_total_done') || '0', 10)") == antes + 1,
              "acertar uno suma al contador de ejercicios")

    # el filtro de nivel
    nivel = pg.evaluate("""() => { const n = {}; document.querySelectorAll('#ex-hub-container .exercise-level-badge')
      .forEach(b => { n[b.textContent.trim()] = 1; }); return Object.keys(n)[0]; }""")
    pg.locator('#ex-level-filter-pills .ex-pill[data-level-filter="%s"]' % nivel).click()
    pg.wait_for_timeout(300)
    niveles = pg.evaluate("[...document.querySelectorAll('#ex-hub-container .exercise-level-badge')].map(b => b.textContent.trim())")
    comprueba(len(niveles) > 0 and set(niveles) == {nivel}, "filtrando por %s, salen solo de %s (%d)" % (nivel, nivel, len(niveles)))
    comprueba(all(e in todo for e in tanda(pg)), "y siguen siendo de lo visto en clase")
    pg.locator('#ex-level-filter-pills .ex-pill[data-level-filter="%s"]' % nivel).click()
    pg.wait_for_timeout(200)

    print("\n═══ salir ═══")
    pg.locator("#ex-mode-back-tema").click()
    pg.wait_for_timeout(300)
    comprueba(pg.locator("#ex-repaso").count() == 0, "al cambiar de modo se va la cabecera")
    comprueba(pg.locator('.ex-mode-card[data-mode="tema"]').is_visible(), "y vuelven los tres modos")
    pg.locator('.ex-mode-card[data-mode="tema"]').click()
    pg.wait_for_timeout(300)
    comprueba(pg.locator("#ex-mode-panel-tema .ex-category-grid").first.is_visible(),
              "en «por tema» vuelven a salir las materias")
    pg.locator(".ex-cat-card:not(.ex-level-card)").first.click()
    pg.wait_for_timeout(300)
    comprueba(pg.locator("#ex-hub-container .exercise-block").count() == 12,
              "y una materia da su tanda normal de doce (%d)" % pg.locator("#ex-hub-container .exercise-block").count())
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
