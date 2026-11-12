# -*- coding: utf-8 -*-
"""El menú: plegado en el móvil, de siempre en el ordenador.

    python3 herramientas/prueba_menu.py

En el móvil el menú ocupaba toda la primera pantalla de cada página. Ahora
queda una barra con el logo y el botón, y se abre al tocarlo. Aquí se mira
eso y que el ordenador sigue como estaba: el botón esconde el menú lateral y
lo recuerda.
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


def abre(br, ancho, extra=""):
    c = br.new_context(viewport={"width": ancho, "height": 800})
    monta(c, json.loads(json.dumps(DB)))
    c.add_init_script("localStorage.setItem('__falso_usuario','anna@x.com');"
                      "localStorage.setItem('jn_access_granted','true');"
                      "localStorage.setItem('jn_student_email','anna@x.com');"
                      "localStorage.setItem('jn_track','it');" + extra)
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    pg.goto(B + "/ser-estar-it.html", wait_until="load")
    pg.wait_for_timeout(700)
    return c, pg


def arriba_del_contenido(pg):
    return pg.evaluate("document.querySelector('main').getBoundingClientRect().top")


with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")

    print("\n═══ en el móvil ═══")
    c, pg = abre(br, 390)
    comprueba(pg.locator(".sidebar .logo-img").is_visible(), "arriba queda el logo")
    comprueba(not pg.locator("#site-search").is_visible() and not pg.locator(".sidebar .menu-item").first.is_visible(),
              "el menú empieza plegado")
    alto = arriba_del_contenido(pg)
    comprueba(alto < 110, "y el contenido empieza justo debajo de la barra (a %d px)" % alto)
    boton = pg.locator("#sidebar-toggle")
    comprueba(boton.is_visible() and boton.get_attribute("aria-expanded") == "false", "el botón está y dice que está plegado")
    boton.click()
    pg.wait_for_timeout(250)
    comprueba(pg.locator("#site-search").is_visible() and pg.locator(".sidebar .menu-item").first.is_visible(),
              "al tocarlo se abre el menú, con el buscador")
    comprueba(boton.get_attribute("aria-expanded") == "true", "y el botón lo dice")
    comprueba(pg.locator(".sidebar a.current-page").is_visible(), "con la página en la que estás marcada")
    boton.click()
    pg.wait_for_timeout(250)
    comprueba(not pg.locator("#site-search").is_visible(), "tocarlo otra vez lo cierra")
    boton.click()
    pg.wait_for_timeout(200)
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(200)
    comprueba(not pg.locator("#site-search").is_visible(), "y Escape también")
    # ir a otra página desde el menú: la nueva empieza plegada
    boton.click()
    pg.wait_for_timeout(200)
    pg.locator('.sidebar a.track-link[data-base="mis-clases"]').click()
    pg.wait_for_load_state("load")
    pg.wait_for_timeout(600)
    comprueba("mis-clases-it.html" in pg.url and not pg.locator("#site-search").is_visible(),
              "al ir a otra página desde el menú, llega con él plegado")
    comprueba(pg.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"),
              "sin que nada se salga por los lados")
    c.close()

    # quien en el ordenador dejó el menú escondido no puede quedarse sin barra en el móvil
    c, pg = abre(br, 390, "localStorage.setItem('jn_sidebar_collapsed','true');")
    comprueba(pg.locator(".sidebar .logo-img").is_visible() and pg.locator("#sidebar-toggle").is_visible(),
              "con el menú «escondido» del ordenador, en el móvil la barra sigue ahí")
    pg.locator("#sidebar-toggle").click()
    pg.wait_for_timeout(250)
    comprueba(pg.locator("#site-search").is_visible(), "y se abre igual")
    comprueba(pg.evaluate("localStorage.getItem('jn_sidebar_collapsed')") == "true",
              "sin tocarle la preferencia del ordenador")
    c.close()

    print("\n═══ en el ordenador ═══")
    c, pg = abre(br, 1200)
    comprueba(pg.locator("#site-search").is_visible() and pg.locator(".sidebar .menu-item").first.is_visible(),
              "el menú lateral está entero, como siempre")
    comprueba(pg.locator("#sidebar-toggle").get_attribute("aria-expanded") is None, "el botón no habla de plegado")
    pg.locator("#sidebar-toggle").click()
    pg.wait_for_timeout(450)
    comprueba(pg.evaluate("document.body.classList.contains('sidebar-collapsed')")
              and pg.evaluate("document.querySelector('.sidebar').getBoundingClientRect().right") <= 1,
              "el botón lo esconde")
    comprueba(pg.evaluate("localStorage.getItem('jn_sidebar_collapsed')") == "true", "y lo recuerda")
    comprueba(not pg.evaluate("document.body.classList.contains('menu-abierto')"), "sin mezclarse con lo del móvil")
    pg.locator("#sidebar-toggle").click()
    pg.wait_for_timeout(450)
    comprueba(pg.locator("#site-search").is_visible(), "y vuelve a enseñarlo")
    c.close()
    br.close()

print("\n" + ("SIN ERRORES" if not err else "ERRORES:\n  " + "\n  ".join(err)))
sys.exit(1 if err else 0)
