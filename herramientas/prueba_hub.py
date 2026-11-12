# -*- coding: utf-8 -*-
"""El hub de ejercicios arranca, corrige y cambia de modo.

    python3 herramientas/prueba_hub.py

El hub vive en ejercicios.js, que solo cargan sus tres páginas con una
etiqueta <script> propia. Se prueba dos veces:

  · con la página tal como es ahora: ejercicios.js se pide una sola vez;
  · con una página «vieja», sin esa etiqueta, como la que tendría guardada
    el navegador de un alumno que entró justo antes de publicar el cambio.
    script.js lleva una red de seguridad que la carga igual; sin ella, el
    hub se queda sin arrancar y no sale ni un ejercicio.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from firebase_falso import monta
from playwright.sync_api import sync_playwright
B = "http://127.0.0.1:8947"
err = []
def comprueba(c, t):
    if not c: err.append(t)
    print("   %s %s" % ("ok " if c else "MAL", t))
DB = {"anna@x.com": {"email": "anna@x.com", "nombre": "Anna", "activo": True, "clases": []}}
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    for caso in ("página nueva", "página vieja en caché (sin la etiqueta)"):
        c = br.new_context(viewport={"width": 1200, "height": 900})
        monta(c, json.loads(json.dumps(DB)))
        c.add_init_script("localStorage.setItem('__falso_usuario','anna@x.com');localStorage.setItem('jn_access_granted','true');"
                          "localStorage.setItem('jn_student_email','anna@x.com');localStorage.setItem('jn_track','it');")
        if "vieja" in caso:
            def vieja(route):
                r = route.fetch()
                cuerpo, n = re.subn(r'<script src="ejercicios\.js\?v=[0-9a-z]+"></script>\n', '', r.text())
                assert n == 1
                route.fulfill(response=r, body=cuerpo)
            c.route("**/ejercicios-it.html*", vieja)
        pg = c.new_page()
        pg.on("pageerror", lambda e: err.append("JS: %s" % e))
        pedidos = []
        pg.on("request", lambda r: pedidos.append(r.url) if "/ejercicios.js" in r.url else None)
        pg.goto(B + "/ejercicios-it.html?tema=ser-estar", wait_until="load"); pg.wait_for_timeout(900)
        print("\n═══ %s ═══" % caso)
        comprueba(len(pedidos) == 1, "ejercicios.js se pide una vez (%d)" % len(pedidos))
        n = pg.locator("#ex-hub-container .exercise-block").count()
        comprueba(n > 0, "llegando con ?tema= salen los ejercicios (%d)" % n)
        b = pg.locator("#ex-hub-container .exercise-block").first
        if b.locator(".option-btn").count():
            a = b.get_attribute("data-answer")
            b.locator('.option-btn').evaluate_all("(bs, a) => bs.find(x => x.dataset.value.trim().toLowerCase() === a.trim().toLowerCase()).click()", a)
        elif b.locator(".exercise-input").count():
            b.locator(".exercise-input").fill(b.get_attribute("data-answer").split("|")[0]); b.locator(".exercise-check").click()
        pg.wait_for_timeout(200)
        comprueba(b.evaluate("e => e.classList.contains('is-done')") or b.locator(".order-word, .match-item").count() > 0, "y se corrigen")
        pg.locator("#ex-mode-back-tema").click(); pg.wait_for_timeout(300)
        comprueba(pg.locator('.ex-mode-card[data-mode="curso"]').is_visible(), "«cambiar de modo» vuelve a los tres modos")
        pg.locator('.ex-mode-card[data-mode="curso"]').click(); pg.wait_for_timeout(400)
        comprueba(pg.locator("[data-course]").count() > 0, "y los cursos se pintan (%d)" % pg.locator("[data-course]").count())
        c.close()
    br.close()
print("\n" + ("SIN ERRORES" if not err else "ERRORES:\n  " + "\n  ".join(err)))
sys.exit(1 if err else 0)
