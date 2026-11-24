# -*- coding: utf-8 -*-
"""La bienvenida: lo que ve quien todavía no es alumno.

    python3 herramientas/prueba_bienvenida.py

Qué mira:
  · quien llega a la portada sin haber entrado nunca va a la bienvenida;
    el alumno que ya entró, el profesor, quien viene a entrar (?entrar), quien
    vuelve con el enlace del correo y quien lo está esperando, no;
  · la bienvenida sale en el idioma del navegador (o en el elegido), con su
    vídeo —el de móvil en el móvil— y la clase de muestra en ese idioma;
  · los botones de reservar llevan a Preply y a TidyCal, y «Entrar» a la puerta;
  · la clase de muestra y su lectura se ven sin entrar, con la franja de
    reservar; cualquier otra página sigue cerrada, y su puerta enlaza con la
    bienvenida;
  · al alumno, la clase de muestra le sale como siempre (sin franja);
  · nada se sale por los lados en el móvil.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from firebase_falso import monta, ENLACE_FALSO
from playwright.sync_api import sync_playwright

B = os.environ.get("BASE", "http://127.0.0.1:8947")
DB = {"anna@x.com": {"email": "anna@x.com", "nombre": "Anna", "idioma": "it", "activo": True,
                     "clases": [{"id": "si-tuviera", "fecha": "2026-11-19", "nota": ""}]}}
err = []


def comprueba(cond, texto):
    if not cond:
        err.append(texto)
    print("   %s %s" % ("ok " if cond else "MAL", texto))


def nuevo(br, ancho=1200, navegador="it-IT", init=""):
    c = br.new_context(viewport={"width": ancho, "height": 900}, locale=navegador)
    monta(c, json.loads(json.dumps(DB)), reglas=True)
    if init:
        c.add_init_script(init)
    return c


def pagina(c):
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    return pg


ALUMNA = ("localStorage.setItem('__falso_usuario','anna@x.com');localStorage.setItem('jn_access_granted','true');"
          "localStorage.setItem('jn_student_email','anna@x.com');localStorage.setItem('jn_track','it');")

with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")

    print("\n═══ quién va a la bienvenida ═══")
    c = nuevo(br); pg = pagina(c)
    pg.goto(B + "/index.html", wait_until="load"); pg.wait_for_timeout(600)
    comprueba("bienvenida" in pg.url, "sin haber entrado nunca, la portada lleva a la bienvenida")
    comprueba(pg.locator(".access-gate-overlay").count() == 0, "y ahí no sale la puerta")
    c.close()

    for qué, url, init in (
            ("el alumno que ya entró", "/index.html", ALUMNA),
            ("el profesor", "/index.html", "localStorage.setItem('jn_profe','true');"),
            ("quien viene a entrar", "/index.html?entrar", ""),
            ("quien vuelve con el enlace del correo", "/index.html" + ENLACE_FALSO, ""),
            ("quien está esperando el enlace", "/index.html", "localStorage.setItem('jn_email_pendiente','a@x.com');")):
        c = nuevo(br, init=init); pg = pagina(c)
        pg.goto(B + url, wait_until="load"); pg.wait_for_timeout(500)
        comprueba("bienvenida" not in pg.url, "%s se queda en la portada" % qué)
        c.close()

    c = nuevo(br); pg = pagina(c)
    pg.goto(B + "/index.html?entrar", wait_until="load"); pg.wait_for_timeout(900)
    comprueba(pg.locator(".access-gate-overlay").is_visible(), "con ?entrar sale la puerta")
    c.close()

    print("\n═══ la bienvenida ═══")
    for navegador, l, frase in (("it-IT", "it", "Le tue lezioni"), ("en-GB", "en", "Your Spanish lessons"),
                                ("es-ES", "es", "Tus clases"), ("de-DE", "en", "Your Spanish lessons")):
        c = nuevo(br, navegador=navegador); pg = pagina(c)
        pg.goto(B + "/bienvenida.html", wait_until="load"); pg.wait_for_timeout(400)
        comprueba(frase in pg.locator("h1").inner_text(), "navegador %s: sale en %s" % (navegador, l))
        comprueba(pg.locator("#bv-video").get_attribute("src") == "bienvenida/recorrido-%s.mp4" % l,
                  "  con su vídeo en %s" % l)
        comprueba(pg.locator('a[data-pag="clase-si-tuviera"]').get_attribute("href") == "clase-si-tuviera-%s.html" % l,
                  "  y la clase de muestra en %s" % l)
        c.close()

    c = nuevo(br); pg = pagina(c)
    pg.goto(B + "/bienvenida.html", wait_until="load"); pg.wait_for_timeout(400)
    pg.locator('.bv-idiomas button[data-l="en"]').click(); pg.wait_for_timeout(200)
    comprueba("Your Spanish" in pg.locator("h1").inner_text() and pg.evaluate("localStorage.getItem('jn_track')") == "en",
              "cambiar de idioma cambia la página y se recuerda")
    comprueba(pg.locator("#bv-video").get_attribute("src") == "bienvenida/recorrido-en.mp4", "y el vídeo")
    comprueba(pg.locator("html").get_attribute("lang") == "en", "y el idioma declarado")
    comprueba(pg.locator('a[href*="preply"]').count() == 1 and pg.locator('a[href="https://tidycal.com/josenogues"]').count() == 1,
              "reservar: en Preply y en TidyCal")
    comprueba(all(h == "index.html?entrar" for h in pg.locator('a[href^="index"]').evaluate_all("a => a.map(x => x.getAttribute('href'))")),
              "«Entrar» lleva a la puerta")
    for f in ["bienvenida/recorrido-%s%s.mp4" % (m, l) for m in ("", "movil-") for l in ("es", "it", "en")] + \
             ["bienvenida/portada-%s%s.jpg" % (m, l) for m in ("", "movil-") for l in ("es", "it", "en")]:
        r = pg.request.get(B + "/" + f)
        comprueba(r.ok, "existe %s" % f)
    pg.locator('a[data-pag="clase-si-tuviera"]').click(); pg.wait_for_load_state("load"); pg.wait_for_timeout(1200)
    comprueba("clase-si-tuviera-en" in pg.url and pg.locator('.riel-btn[data-sec="clases"]').inner_text().strip() == "My classes",
              "la clase de muestra se abre con el menú en el idioma elegido")
    pg.goto(B + "/bienvenida.html", wait_until="load"); pg.wait_for_timeout(300)
    pg.locator(".bv-riel-entrar").click(); pg.wait_for_load_state("load"); pg.wait_for_timeout(900)
    comprueba("bienvenida" not in pg.url and pg.locator(".access-gate-overlay").is_visible(),
              "pulsar «Entrar» abre la puerta, sin volver a la bienvenida")
    c.close()

    print("\n═══ en el móvil ═══")
    c = nuevo(br, ancho=390); pg = pagina(c)
    pg.goto(B + "/bienvenida.html", wait_until="load"); pg.wait_for_timeout(500)
    comprueba(pg.locator("#bv-video").get_attribute("src") == "bienvenida/recorrido-movil-it.mp4", "el vídeo de móvil")
    comprueba(pg.locator(".bv-video.es-movil").count() == 1, "dentro del teléfono")
    comprueba(pg.evaluate("document.documentElement.scrollWidth") <= 390, "nada se sale por los lados")
    c.close()

    print("\n═══ la clase de muestra, sin entrar ═══")
    for url, qué in (("/clase-si-tuviera-it.html", "la clase"), ("/clase-si-tuviera-en", "la clase sin «.html»"),
                     ("/lectura-it.html?clase=si-tuviera", "la lectura")):
        c = nuevo(br); pg = pagina(c)
        # Cloudflare sirve las páginas sin «.html»; el servidor local no, así que se imita
        raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        c.route(B + "/clase-si-tuviera-en", lambda r: r.fulfill(path=os.path.join(raiz, "clase-si-tuviera-en.html")))
        pg.goto(B + url, wait_until="load"); pg.wait_for_timeout(1500)
        comprueba(pg.locator(".access-gate-overlay").count() == 0, "%s se ve sin la puerta" % qué)
        comprueba(pg.locator(".muestra-franja").is_visible(), "  con la franja de muestra")
        comprueba(pg.locator('.muestra-franja a[href="bienvenida.html#reservar"]').count() == 1, "  que lleva a reservar")
        if "lectura" in url:
            comprueba(pg.locator(".lec-pal").count() > 0 and pg.locator(".exercise-block").count() >= 6,
                      "  la lectura entera, con sus palabras y sus preguntas")
            pg.locator(".exercise-block").first.locator(".option-btn", has_text="No, nunca").click(); pg.wait_for_timeout(300)
            comprueba(pg.locator(".exercise-block").first.locator(".exercise-feedback").inner_text().strip() != "",
                      "  y las preguntas se corrigen")
        else:
            blk = pg.locator('.exercise-block[data-exid="si3"]')
            blk.locator('.option-btn[data-value="fuera"]').click(); pg.wait_for_timeout(300)
            comprueba(blk.locator(".exercise-feedback").inner_text().strip() != "", "  y los ejercicios se corrigen")
        c.close()

    c = nuevo(br); pg = pagina(c)
    pg.goto(B + "/lectura-it.html?clase=otra", wait_until="load"); pg.wait_for_timeout(900)
    comprueba(pg.locator(".access-gate-overlay").is_visible(), "otra lectura sigue cerrada")
    pg.goto(B + "/clase-motor-it.html", wait_until="load"); pg.wait_for_timeout(900)
    comprueba(pg.locator(".access-gate-overlay").is_visible(), "otra clase sigue cerrada")
    comprueba(pg.locator('.access-gate-nuevo a[href="bienvenida.html"]').is_visible(), "y su puerta enlaza con la bienvenida")
    comprueba("Non sei ancora studente" in pg.locator(".access-gate-nuevo").inner_text(), "  en el idioma del visitante")
    c.close()

    c = nuevo(br, init=ALUMNA); pg = pagina(c)
    pg.goto(B + "/clase-si-tuviera-it.html", wait_until="load"); pg.wait_for_timeout(1500)
    comprueba(pg.locator(".muestra-franja").count() == 0 and pg.locator(".access-gate-overlay").count() == 0,
              "a la alumna, la clase le sale como siempre, sin franja")
    c.close()

    br.close()

print("\n%s" % ("TODO BIEN" if not err else "FALLOS:\n  " + "\n  ".join(err)))
sys.exit(1 if err else 0)
