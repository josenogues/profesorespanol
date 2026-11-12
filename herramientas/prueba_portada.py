# -*- coding: utf-8 -*-
"""La portada: saluda por el nombre y pone delante lo que toca.

    python3 herramientas/prueba_portada.py

  · saluda con el nombre de pila de la ficha, y a secas si no hay ficha;
  · enseña la próxima clase, en el idioma del alumno;
  · «cinco minutos» sale solo si ya ha dado alguna clase, y lleva a lo visto;
  · las puertas, las materias y «Sobre mí» llevan a su sitio;
  · en el móvil no se sale nada por los lados.
"""
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from firebase_falso import monta
from playwright.sync_api import sync_playwright

B = os.environ.get("BASE", "http://127.0.0.1:8947")


def mas(d):
    return (datetime.date.today() + datetime.timedelta(days=d)).isoformat()


DB = {
    "anna@x.com": {"email": "anna@x.com", "nombre": "Anna Rossi", "activo": True, "clases": [
        {"id": "motor", "fecha": mas(-9), "nota": ""},
        {"rapida": {"rid": "r1", "titulo": "Por y para", "temas": ["por-para"]}, "fecha": mas(-3), "nota": ""},
        {"id": "cuando-llegues", "fecha": mas(9), "nota": ""},
        {"id": "si-tuviera", "fecha": mas(3), "nota": ""}]},
    # recién dada de alta: ni nombre, ni clases
    "nueva@x.com": {"email": "nueva@x.com", "activo": True, "clases": []},
}
err = []


def comprueba(cond, texto):
    if not cond:
        err.append(texto)
    print("   %s %s" % ("ok " if cond else "MAL", texto))


def abre(br, quien, pista, ancho=1200):
    c = br.new_context(viewport={"width": ancho, "height": 900})
    monta(c, json.loads(json.dumps(DB)))
    c.add_init_script("localStorage.setItem('__falso_usuario','%s');localStorage.setItem('jn_access_granted','true');"
                      "localStorage.setItem('jn_student_email','%s');localStorage.setItem('jn_track','%s');" % (quien, quien, pista))
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    pg.goto(B + "/index.html", wait_until="load")
    pg.wait_for_timeout(1300)
    return c, pg


with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")

    print("\n═══ con su ficha ═══")
    c, pg = abre(br, "anna@x.com", "it")
    comprueba(pg.locator("#hola-saludo").inner_text().strip() == "¡Hola, Anna!", "saluda con el nombre de pila")
    prox = pg.locator("#hola-prox")
    comprueba(prox.is_visible() and "La tua prossima lezione:" in prox.inner_text() and "Si tuviera dinero" in prox.inner_text()
              and "Cuando llegues" not in prox.inner_text(), "enseña la próxima clase, que es la más cercana, y en italiano")
    hoy = pg.locator("#hola-hoy")
    comprueba(hoy.is_visible() and hoy.get_attribute("href") == "ejercicios-it.html?hoy=t:por-para,motor",
              "«cinco minutos» lleva a lo ya visto, de lo último a lo más antiguo (%s)" % hoy.get_attribute("href"))
    comprueba(pg.evaluate("localStorage.getItem('jn_nombre')") == "Anna Rossi", "y recuerda el nombre para la próxima vez")
    # cambiar de idioma sin recargar
    pg.locator('.lang-track-btn[data-track="en"]').click()
    pg.wait_for_timeout(300)
    comprueba("Your next class:" in prox.inner_text() and hoy.get_attribute("href").startswith("ejercicios-en.html"),
              "al pasar a inglés cambian la próxima clase y el enlace")
    comprueba(pg.locator("#hola-saludo").inner_text().strip() == "¡Hola, Anna!", "y el saludo sigue en español")

    print("\n═══ adónde llevan las cosas ═══")
    hoy.click()
    pg.wait_for_load_state("load")
    pg.wait_for_timeout(700)
    comprueba("ejercicios-en.html" in pg.url and pg.locator("#ex-uno-label").inner_text().strip() == "1 / 6",
              "«cinco minutos» abre la tanda")
    for selector, destino, que in (('.puerta[data-base="mis-clases"]', "mis-clases-it.html", "la puerta de «Mis clases»"),
                                   ('.puerta[data-base="ejercicios"]', "ejercicios-it.html", "la de ejercicios"),
                                   ('.teja[data-base="vocabulario"]', "vocabulario-it.html", "la materia «Vocabulario»"),
                                   ('.teja[data-base="profesional"]', "profesional-it.html", "«Español profesional»"),
                                   (".sobre-tira", "sobre-mi.html", "la tira de «Sobre mí»")):
        pg.goto(B + "/index.html", wait_until="load")
        pg.wait_for_timeout(500)
        pg.locator(selector).click()
        pg.wait_for_load_state("load")
        comprueba(pg.url.endswith(destino), "%s lleva a %s" % (que, destino))
    pg.goto(B + "/index.html", wait_until="load")
    pg.wait_for_timeout(300)
    comprueba(pg.locator(".tejas .teja").count() == 5 and pg.locator(".sobre-tira img").is_visible(),
              "están las cinco materias y la foto de José")
    aula = pg.locator(".hola-btn-linea")
    comprueba(aula.get_attribute("href") == "https://meet.google.com/xhh-wujz-ywi" and aula.get_attribute("target") == "_blank",
              "y el botón de entrar en clase abre la sala en otra pestaña")
    # la segunda visita saluda con el nombre sin esperar a la ficha
    pg.goto(B + "/index.html", wait_until="domcontentloaded")
    comprueba(pg.locator("#hola-saludo").inner_text().strip() == "¡Hola, Anna!", "la segunda vez saluda por el nombre desde el primer momento")
    c.close()

    print("\n═══ sin nombre y sin clases ═══")
    c, pg = abre(br, "nueva@x.com", "es")
    comprueba(pg.locator("#hola-saludo").inner_text().strip() == "¡Hola!", "sin nombre en la ficha, saluda a secas")
    comprueba(not pg.locator("#hola-prox").is_visible() and not pg.locator("#hola-hoy").is_visible(),
              "sin clases, ni próxima clase ni «cinco minutos»")
    comprueba(pg.locator('.hola-btn[data-base="mis-clases"]').is_visible(), "pero «Mis clases» está")
    c.close()

    print("\n═══ en el móvil ═══")
    for ancho in (390, 320):
        c, pg = abre(br, "anna@x.com", "it", ancho)
        comprueba(pg.evaluate("document.documentElement.scrollWidth <= innerWidth"), "a %d px nada se sale por los lados" % ancho)
        comprueba(pg.evaluate("document.getElementById('hola-saludo').getBoundingClientRect().top") < 330,
                  "a %d px el saludo está arriba, a la vista" % ancho)
        c.close()
    br.close()

print("\n" + ("SIN ERRORES" if not err else "ERRORES:\n  " + "\n  ".join(err)))
sys.exit(1 if err else 0)
