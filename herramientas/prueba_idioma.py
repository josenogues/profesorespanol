# -*- coding: utf-8 -*-
"""Lo que rodea al contenido le habla al alumno en su idioma.

    python3 herramientas/prueba_idioma.py

La regla de la casa: las explicaciones, en italiano o en inglés; en español,
solo lo que se aprende. Aquí se mira lo que no es contenido y se había
quedado en español: la ventana que pregunta el idioma, la ruta de arriba, el
pie y los rótulos que no se ven (el del interruptor de tema, el del menú).
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from firebase_falso import monta
from playwright.sync_api import sync_playwright

B = os.environ.get("BASE", "http://127.0.0.1:8947")
DB = {"anna@x.com": {"email": "anna@x.com", "nombre": "Anna", "activo": True, "clases": []}}
err = []


def comprueba(cond, texto):
    if not cond:
        err.append(texto)
    print("   %s %s" % ("ok " if cond else "MAL", texto))


def abre(br, pagina, pista=None, navegador="es-ES", ancho=1200):
    c = br.new_context(viewport={"width": ancho, "height": 800}, locale=navegador)
    monta(c, json.loads(json.dumps(DB)))
    ini = ("localStorage.setItem('__falso_usuario','anna@x.com');"
           "localStorage.setItem('jn_access_granted','true');"
           "localStorage.setItem('jn_student_email','anna@x.com');")
    if pista:
        ini += "localStorage.setItem('jn_track','%s');" % pista
    c.add_init_script(ini)
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    pg.goto(B + "/" + pagina, wait_until="load")
    pg.wait_for_timeout(600)
    return c, pg


with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")

    print("\n═══ la ventana que pregunta el idioma ═══")
    for navegador, titulo in (("en-GB", "Which language do you want the explanations in?"),
                              ("it-IT", "In che lingua vuoi le spiegazioni?"),
                              ("es-ES", "¿En qué idioma quieres las explicaciones?"),
                              ("de-DE", "¿En qué idioma quieres las explicaciones?")):
        c, pg = abre(br, "index.html", None, navegador)
        pg.locator('.puerta[data-base="mis-clases"]').click()
        pg.wait_for_timeout(300)
        comprueba(pg.locator(".track-modal h3").inner_text().strip() == titulo,
                  "con el navegador en %s pregunta en ese idioma (o en español si no lo tenemos)" % navegador)
        if navegador == "en-GB":
            nombres = [b.inner_text().strip() for b in pg.locator(".track-modal-buttons button").all()]
            comprueba(nombres == ["🇪🇸 Español", "🇮🇹 Italiano", "🇬🇧 English"],
                      "cada idioma con su propio nombre (%s)" % ", ".join(nombres))
            altos = pg.evaluate("[...document.querySelectorAll('.track-modal-buttons button')].map(b => Math.round(b.getBoundingClientRect().height))")
            comprueba(len(set(altos)) == 1, "y los tres botones iguales de alto")
            pg.locator('.track-modal-buttons button[data-track="en"]').click()
            pg.wait_for_load_state("load")
            pg.wait_for_timeout(300)
            comprueba(pg.url.endswith("mis-clases-en.html") and pg.evaluate("localStorage.getItem('jn_track')") == "en",
                      "elegir uno lo guarda y lleva a la página en ese idioma")
        c.close()

    print("\n═══ la ruta, el pie y los rótulos ═══")
    for pista, pagina, miga, pie, tema, menu in (
            ("it", "ser-estar-it.html", "Home / Verbi / Ser y estar", "Insegnante di spagnolo · Chi sono · Privacy",
             "Modalità scura", "Mostra o nascondi il menù"),
            ("en", "perifrasis-en.html", "Home / Verbs / Verbal periphrases", "Spanish teacher · About me · Privacy",
             "Dark mode", "Show or hide the menu"),
            ("es", "ser-estar-es.html", "Inicio / Verbos / Ser y estar", "Profesor de español · Sobre mí · Privacidad",
             "Modo oscuro", "Mostrar u ocultar el menú")):
        c, pg = abre(br, pagina, pista)
        comprueba(pg.locator(".breadcrumb").inner_text().strip() == miga, "%s: la ruta dice «%s»" % (pista, miga))
        comprueba(pie in pg.locator("footer").inner_text(), "%s: el pie, «%s»" % (pista, pie))
        comprueba(pg.locator(".theme-switch").get_attribute("title") == tema
                  and pg.locator("#sidebar-toggle").get_attribute("aria-label") == menu,
                  "%s: y los rótulos que no se ven («%s», «%s»)" % (pista, tema, menu))
        c.close()

    # las páginas que no son de ninguna pista cambian al cambiar de idioma, sin recargar
    c, pg = abre(br, "sobre-mi.html", "es")
    pg.locator('.lang-track-btn[data-track="it"]').click()
    pg.wait_for_timeout(300)
    comprueba(pg.locator(".breadcrumb").inner_text().strip() == "Home / Chi sono"
              and "Insegnante di spagnolo" in pg.locator("footer").inner_text()
              and pg.locator(".theme-switch").get_attribute("title") == "Modalità scura",
              "en una página común, cambiar a italiano cambia ruta, pie y rótulos al momento")
    c.close()

    print("\n═══ en un móvil estrecho ═══")
    c, pg = abre(br, "ser-estar-it.html", "it", ancho=320)
    comprueba(pg.evaluate("document.documentElement.scrollWidth <= innerWidth"),
              "a 320 px los botones de idioma caben y la página no se mueve de lado")
    c.close()
    br.close()

print("\n" + ("SIN ERRORES" if not err else "ERRORES:\n  " + "\n  ".join(err)))
sys.exit(1 if err else 0)
