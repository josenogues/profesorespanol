# -*- coding: utf-8 -*-
"""El menú: una columna con tres botones (noviembre 2026).

    python3 herramientas/prueba_menu.py

En el ordenador, una columna estrecha con el logo, «Mis clases», «Práctica»
y «Teoría». Los dos últimos abren su panel flotando; se cierra al pulsar
fuera o con Escape, y con la chincheta se queda fijo (la página se aparta y
se recuerda al cambiar de página). En el móvil, una barra abajo con los tres
botones; el panel sube como una hoja, y el idioma y el modo oscuro van en la
cajita del botón de arriba.
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


def abre(br, ancho, pagina="ser-estar-it.html", extra=""):
    c = br.new_context(viewport={"width": ancho, "height": 800})
    monta(c, json.loads(json.dumps(DB)))
    c.add_init_script("localStorage.setItem('__falso_usuario','anna@x.com');"
                      "localStorage.setItem('jn_access_granted','true');"
                      "localStorage.setItem('jn_student_email','anna@x.com');"
                      "localStorage.setItem('jn_track','it');" + extra)
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    pg.goto(B + "/" + pagina, wait_until="load")
    pg.wait_for_timeout(700)
    return c, pg


def izquierda_del_contenido(pg):
    return pg.evaluate("document.querySelector('main').getBoundingClientRect().left")


TEORIA = 'button.riel-btn[data-sec="teoria"]'
PRACTICA = 'button.riel-btn[data-sec="ejer"]'

with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")

    print("\n═══ en el ordenador ═══")
    c, pg = abre(br, 1200)
    comprueba(pg.locator(".riel-logo").is_visible() and pg.locator(".riel-btn").count() == 3,
              "la columna tiene el logo y tres botones")
    comprueba(pg.locator(".riel-btn.actual").get_attribute("data-sec") == "teoria",
              "en una página de teoría, el botón de Teoría está marcado")
    comprueba(not pg.locator("#panel-teoria").is_visible() and pg.locator(".lupa-btn").is_visible(),
              "de entrada no hay panel abierto, y la lupa está abajo")
    antes = izquierda_del_contenido(pg)
    pg.locator(TEORIA).click(); pg.wait_for_timeout(200)
    comprueba(pg.locator("#panel-teoria").is_visible() and pg.locator(TEORIA).get_attribute("aria-expanded") == "true",
              "Teoría abre su panel")
    comprueba(pg.locator("#panel-teoria a.current-page").is_visible(),
              "con la materia de la página desplegada y la página marcada")
    comprueba(izquierda_del_contenido(pg) == antes, "flotando: la página no se mueve")
    grupo = pg.locator("#panel-teoria .panel-grupo").nth(1)
    grupo.locator(".panel-mat").click(); pg.wait_for_timeout(150)
    comprueba(grupo.locator(".panel-sub").is_visible(), "las otras materias se despliegan al pulsarlas")
    pg.mouse.click(900, 500); pg.wait_for_timeout(200)
    comprueba(not pg.locator("#panel-teoria").is_visible(), "pulsar fuera lo cierra")
    pg.locator(PRACTICA).click(); pg.wait_for_timeout(150)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(150)
    comprueba(not pg.locator("#panel-ejer").is_visible(), "Escape también")
    pg.locator(PRACTICA).click(); pg.wait_for_timeout(150)
    pg.locator(TEORIA).click(); pg.wait_for_timeout(150)
    comprueba(pg.locator("#panel-teoria").is_visible() and not pg.locator("#panel-ejer").is_visible(),
              "pulsar el otro botón cambia de panel")
    # la chincheta
    pg.locator("#panel-teoria .panel-fijar").click(); pg.wait_for_timeout(250)
    comprueba(pg.evaluate("document.body.classList.contains('menu-fijo')")
              and izquierda_del_contenido(pg) > antes + 200, "la chincheta lo deja fijo y la página se aparta")
    comprueba(pg.locator("#panel-teoria .panel-fijar").get_attribute("aria-pressed") == "true", "y lo dice")
    pg.mouse.click(900, 500); pg.wait_for_timeout(200)
    comprueba(pg.locator("#panel-teoria").is_visible(), "fijo, pulsar fuera ya no lo cierra")
    pg.locator(PRACTICA).click(); pg.wait_for_timeout(200)
    comprueba(pg.locator("#panel-ejer").is_visible() and pg.evaluate("localStorage.getItem('jn_menu_fijo')") == "ejer",
              "fijo, el otro botón cambia el panel y se queda fijo")
    pg.goto(B + "/ejercicios-it.html?modo=nivel", wait_until="load"); pg.wait_for_timeout(800)
    comprueba(pg.locator("#panel-ejer").is_visible() and izquierda_del_contenido(pg) > antes + 200,
              "al cambiar de página sigue fijo")
    comprueba(pg.locator('#panel-ejer a.current-page[data-q="modo=nivel"]').count() == 1,
              "con el modo de práctica abierto marcado")
    pg.locator("#panel-ejer .panel-fijar").click(); pg.wait_for_timeout(250)
    comprueba(not pg.locator("#panel-ejer").is_visible() and izquierda_del_contenido(pg) == antes
              and pg.evaluate("localStorage.getItem('jn_menu_fijo')") is None,
              "la chincheta otra vez lo quita y la página vuelve a su sitio")
    comprueba(pg.locator(".page-header .language-selector").is_visible(), "el idioma sigue arriba a la derecha")
    pg.locator(".riel-btn[data-sec=clases]").click()
    pg.wait_for_load_state("load"); pg.wait_for_timeout(500)
    comprueba("mis-clases-it.html" in pg.url, "«Mis clases» lleva directo")
    c.close()

    print("\n═══ en el móvil ═══")
    c, pg = abre(br, 390, extra="localStorage.setItem('jn_menu_fijo','teoria');")
    comprueba(pg.locator(".menu-movil .logo-img").is_visible() and pg.locator(".lupa-movil").is_visible(),
              "arriba quedan el logo y la lupa")
    comprueba(not pg.locator("#panel-teoria").is_visible()
              and not pg.evaluate("document.body.classList.contains('menu-fijo')"),
              "el panel fijo del ordenador no se pone en el móvil")
    caja = pg.evaluate("(()=>{const r=document.querySelector('.riel').getBoundingClientRect();return [r.top,r.bottom,innerHeight]})()")
    comprueba(caja[1] == caja[2] and caja[0] > caja[2] - 90, "los tres botones van en una barra abajo")
    arriba = pg.evaluate("document.querySelector('main').getBoundingClientRect().top")
    comprueba(arriba < 110, "y el contenido empieza justo debajo de la barra de arriba (a %d px)" % arriba)
    pg.locator(TEORIA).click(); pg.wait_for_timeout(250)
    comprueba(pg.locator("#panel-teoria").is_visible() and pg.locator("#panel-teoria a.current-page").is_visible(),
              "Teoría sube su hoja, con la página marcada")
    comprueba(not pg.locator("#panel-teoria .panel-fijar").is_visible(), "sin chincheta en el móvil")
    pg.mouse.click(200, 60); pg.wait_for_timeout(200)
    comprueba(not pg.locator("#panel-teoria").is_visible(), "tocar fuera la cierra")
    comprueba(not pg.locator(".language-selector").is_visible(), "el idioma no ocupa una franja arriba")
    pg.locator(".ajustes-movil").click(); pg.wait_for_timeout(200)
    comprueba(pg.locator(".ajustes-pop .lang-track-btn").first.is_visible() and pg.locator(".ajustes-pop .theme-switch").is_visible(),
              "el botón de arriba enseña el idioma y el modo oscuro")
    comprueba(pg.locator(".ajustes-movil").get_attribute("aria-label") == "Lingua e modalità scura",
              "y se llama en el idioma del alumno")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(150)
    comprueba(not pg.locator(".ajustes-pop .lang-track-btn").first.is_visible(), "Escape la cierra")
    comprueba(pg.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"),
              "sin que nada se salga por los lados")
    pg.locator(".lupa-movil").click(); pg.wait_for_timeout(250)
    comprueba(pg.locator("#site-search").is_visible(), "la lupa de arriba abre la búsqueda")
    pg.keyboard.type("subjuntivo", delay=20); pg.wait_for_timeout(900)
    comprueba(pg.locator("#search-results a").count() > 0, "y encuentra")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    comprueba(not pg.locator("#site-search").is_visible(), "Escape la cierra")
    pg.locator(PRACTICA).click(); pg.wait_for_timeout(200)
    pg.locator('#panel-ejer a[data-q="modo=tema"]').click()
    pg.wait_for_load_state("load"); pg.wait_for_timeout(600)
    comprueba("ejercicios-it.html?modo=tema" in pg.url and not pg.locator("#panel-ejer").is_visible(),
              "al elegir en la hoja va a la página, que llega sin la hoja")
    c.close()

    # el botón de apuntes, por encima de la barra de abajo
    c, pg = abre(br, 390, "mis-clases-it.html")
    if pg.locator(".apu-boton").count():
        r = pg.evaluate("(()=>{const a=document.querySelector('.apu-boton').getBoundingClientRect(),"
                        "b=document.querySelector('.riel').getBoundingClientRect();return [a.bottom,b.top]})()")
        comprueba(r[0] <= r[1], "el botón de apuntes queda por encima de la barra")
    c.close()
    br.close()

print("\n" + ("SIN ERRORES" if not err else "ERRORES:\n  " + "\n  ".join(err)))
sys.exit(1 if err else 0)
