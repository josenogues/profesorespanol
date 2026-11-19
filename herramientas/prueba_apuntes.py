# -*- coding: utf-8 -*-
"""El cuaderno de las clases: «Esta clase» y «Todos mis apuntes».

    python3 herramientas/prueba_apuntes.py

Qué mira:
  · en una clase, el cuaderno abre en «Esta clase» con lo escrito en ella;
  · «Todos mis apuntes» lista los de las OTRAS clases, lo último primero,
    con su título en el idioma de la página (también las clases rápidas);
  · se abre una, se lee y se puede seguir escribiendo, y se guarda en la
    ficha sin tocar los apuntes de las demás;
  · todo sin salir de la página: el enlace a la otra clase va en otra pestaña;
  · «Volver a la lista» enseña lo recién escrito;
  · sin apuntes en otras clases, lo dice; y en inglés, nada en español.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from firebase_falso import monta
from playwright.sync_api import sync_playwright

B = os.environ.get("BASE", "http://127.0.0.1:8947")
CAPTURAS = os.environ.get("CAPTURAS")

DB = {
    "anna@x.com": {"email": "anna@x.com", "nombre": "Anna", "idioma": "it", "activo": True,
        "clases": [
            {"id": "motor", "fecha": "2026-10-01", "nota": ""},
            {"rapida": {"rid": "r2", "titulo": "Por y para", "temas": ["por-para"]},
             "fecha": "2026-11-01", "nota": ""},
            {"id": "avere-it", "fecha": "2026-11-10", "nota": ""}],
        "apuntes": {
            "avere-it": {"t": "tengo que = devo", "at": "2026-11-10T10:00:00.000Z"},
            "motor": {"t": "voy a + infinitivo\nsegunda línea", "at": "2026-10-01T10:00:00.000Z"},
            "r2": {"t": "por = causa, para = finalidad", "at": "2026-11-01T10:00:00.000Z"},
            "vacia": {"t": "   ", "at": "2026-11-02T10:00:00.000Z"}}},
    "tom@x.com": {"email": "tom@x.com", "nombre": "Tom", "idioma": "en", "activo": True,
        "clases": [], "apuntes": {}},
}

err = []


def comprueba(cond, texto):
    if not cond:
        err.append(texto)
    print("   %s %s" % ("ok " if cond else "MAL", texto))


def entra(br, quien, pista, **kw):
    c = br.new_context(**({"viewport": {"width": 1200, "height": 900}} if not kw else kw))
    monta(c, json.loads(json.dumps(DB)))
    c.add_init_script("localStorage.setItem('__falso_usuario','%s');"
                      "localStorage.setItem('jn_access_granted','true');"
                      "localStorage.setItem('jn_student_email','%s');"
                      "localStorage.setItem('jn_track','%s');" % (quien, quien, pista))
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    return c, pg


def foto(pg, nombre):
    if CAPTURAS:
        pg.screenshot(path=os.path.join(CAPTURAS, nombre + ".png"))


with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")

    print("\n═══ en una clase, en italiano ═══")
    c, pg = entra(br, "anna@x.com", "it")
    url = B + "/clase-avere-it.html"
    pg.goto(url, wait_until="load")
    pg.wait_for_timeout(1500)
    pg.click(".apu-boton")
    pg.wait_for_timeout(300)
    comprueba(pg.locator(".apu-v-esta .apu-texto").input_value() == "tengo que = devo",
              "abre en «Questa lezione» con lo de esta clase")
    pest = pg.locator(".apu-pest").all_inner_texts()
    comprueba(pest == ["Questa lezione", "Tutti i miei appunti"], "las dos pestañas, en italiano (%s)" % pest)
    foto(pg, "1-esta")

    pg.click(".apu-pest[data-v=todas]")
    pg.wait_for_timeout(1200)
    tits = pg.locator(".apu-item-tit").all_inner_texts()
    comprueba(len(tits) == 2, "salen las otras dos clases, sin esta ni la vacía (%s)" % tits)
    comprueba(len(tits) == 2 and tits[0] == "Por y para", "lo último primero, y la rápida con su título")
    motor_it = pg.evaluate("() => window.jnClasePorId('motor').titulo.it")
    comprueba(len(tits) == 2 and tits[1] == motor_it, "la del catálogo con su título en italiano")
    comprueba(pg.locator(".apu-item-txt").all_inner_texts()[-1:] == ["voy a + infinitivo"],
              "de cada una, el principio")
    comprueba(pg.locator(".apu-traer").is_hidden(), "en la lista no sale «Porta»")
    foto(pg, "2-lista")

    pg.locator(".apu-item").nth(1).click()
    pg.wait_for_timeout(800)
    caja = pg.locator(".apu-det-caja:not([hidden]) .apu-texto")
    comprueba(caja.input_value() == "voy a + infinitivo\nsegunda línea", "se abren sus apuntes enteros")
    ir = pg.locator(".apu-ir")
    comprueba(ir.get_attribute("href") == "clase-motor-it.html" and ir.get_attribute("target") == "_blank",
              "el enlace a esa clase, en otra pestaña")
    foto(pg, "3-otra")
    caja.click()
    caja.press("End")
    pg.keyboard.press("Control+End")
    pg.keyboard.type("\nnueva")
    pg.click(".apu-volver")
    pg.wait_for_timeout(1500)
    db = pg.evaluate("() => JSON.parse(JSON.stringify(globalThis.__DB['anna@x.com'].apuntes))")
    comprueba(db["motor"]["t"].endswith("\nnueva"), "lo escrito en la otra clase se guarda en la ficha")
    comprueba(db["avere-it"]["t"] == "tengo que = devo" and db["r2"]["t"].startswith("por ="),
              "sin tocar los apuntes de las demás")
    comprueba(pg.locator(".apu-item-tit").first.inner_text() == motor_it,
              "de vuelta a la lista, la recién escrita sube arriba")
    comprueba(pg.url == url, "y sin haber salido de la clase")

    pg.click(".apu-pest[data-v=esta]")
    comprueba(pg.locator(".apu-v-esta .apu-texto").input_value() == "tengo que = devo",
              "«Questa lezione» sigue con lo suyo")
    c.close()

    print("\n═══ en inglés, sin apuntes en otras clases ═══")
    c, pg = entra(br, "tom@x.com", "en")
    pg.goto(B + "/clase-bando-en.html", wait_until="load")
    pg.wait_for_timeout(1200)
    pg.click(".apu-boton")
    pg.click(".apu-pest[data-v=todas]")
    pg.wait_for_timeout(1200)
    comprueba(pg.locator(".apu-pest").all_inner_texts() == ["This class", "All my notes"], "pestañas en inglés")
    comprueba(pg.locator(".apu-vacio").inner_text() == "You don’t have notes in other classes yet.",
              "dice que no hay apuntes en otras clases")
    c.close()

    if CAPTURAS:
        for nombre, kw in (("movil", {"viewport": {"width": 390, "height": 800}, "device_scale_factor": 2}),
                           ("oscuro", {"viewport": {"width": 1200, "height": 900}, "color_scheme": "dark"})):
            c, pg = entra(br, "anna@x.com", "it", **kw)
            if nombre == "oscuro":
                c.add_init_script("localStorage.setItem('jn_theme','dark')")
            pg = c.new_page()
            pg.goto(url, wait_until="load")
            pg.wait_for_timeout(1500)
            pg.click(".apu-boton")
            pg.click(".apu-pest[data-v=todas]")
            pg.wait_for_timeout(1200)
            foto(pg, nombre + "-lista")
            pg.locator(".apu-item").first.click()
            pg.wait_for_timeout(600)
            foto(pg, nombre + "-otra")
            c.close()

    br.close()

print("\n" + ("SIN FALLOS" if not err else "FALLOS:\n  " + "\n  ".join(err)))
sys.exit(1 if err else 0)
