# -*- coding: utf-8 -*-
"""La bienvenida: lo que ve quien todavía no es alumno.

    python3 herramientas/prueba_bienvenida.py

Qué mira:
  · quien llega a la portada sin haber entrado nunca va a la bienvenida;
    el alumno que ya entró, el profesor, quien viene a entrar (?entrar), quien
    vuelve con el enlace del correo y quien lo está esperando, no;
  · la bienvenida sale en el idioma del navegador (o en el elegido), con su
    vídeo —el de móvil en el móvil— y la clase de muestra en ese idioma;
  · reservar lleva a TidyCal (Preply solo en «Sobre mí»), y «Entrar» a la puerta;
  · la clase de muestra y su lectura se ven sin entrar, con la franja de
    reservar; cualquier otra página sigue cerrada, y su puerta enlaza con la
    bienvenida;
  · al alumno, la clase de muestra le sale como siempre (sin franja);
  · «¿Cómo funciona?» es un bloc de notas: al bajar se pasan las hojas una a
    una (y vuelven al subir), solo se ve una cada vez y solo se mueve su
    pantalla; también se pasan pulsando, y las pestañas llevan a cada tramo;
  · nada se sale por los lados, tampoco en el móvil, donde todo cabe en su hoja.
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
    comprueba(pg.locator('a[href*="preply"]').count() == 0 and pg.locator('a[href="https://tidycal.com/josenogues"]').count() == 1,
              "reservar: solo en mi calendario (Preply queda en «Sobre mí», con las reseñas)")
    comprueba(pg.locator('#dos a[href="sobre-mi.html"]').count() == 1 and pg.locator("#dos .bv-polaroid img").count() == 1,
              "la presentación lleva mi foto y el enlace a «Sobre mí»")
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

    print("\n═══ cómo funciona: el bloc de notas, en el ordenador ═══")
    c = br.new_context(viewport={"width": 1440, "height": 900}, locale="it-IT"); pg = pagina(c)
    pg.goto(B + "/bienvenida.html", wait_until="load"); pg.wait_for_timeout(600)
    comprueba(pg.locator(".bv-hoja").count() == 13 and pg.locator(".bv-tapa").count() == 1
              and pg.locator(".bv-separa").count() == 3 and pg.locator(".bv-paso").count() == 9,
              "un bloc: la tapa, tres separadores (la clase, al terminar la clase y «y además») y nueve pasos")
    comprueba(pg.locator(".bv-paso .bv-hoja-media .bv-marco").count() == 9, "cada paso, con su pantalla en su hoja")
    comprueba(pg.evaluate("document.documentElement.classList.contains('bv-vivo')"), "con pantalla de sobra, el bloc pasa las hojas")
    comprueba(pg.locator('#reservar img[src$="lucia.svg"]').count() == 1 and pg.locator('#reservar img[src$="javi.svg"]').count() == 1,
              "el cierre lleva a Lucía y Javi")
    comprueba("18" in pg.locator("#reservar .bv-precio").inner_text() and "18" in pg.locator("#reservar .bv-precio-sub").inner_text()
              and "25" not in pg.locator("#reservar").inner_text() and pg.locator("#reservar .bv-pago li").count() == 3,
              "el cierre dice el precio (18 € la clase; la primera abre la web para siempre) y cómo se paga")
    comprueba(pg.locator(".bv-paso .bv-nota").count() == 3 and pg.locator(".bv-marco > .bv-posit").count() == 5
              and pg.locator(".bv-separa .bv-lema").count() == 3 and pg.locator(".bv-tapa .bv-tapa-logo").count() == 1,
              "lo escrito a mano: tres notas, cinco pósits pegados a su pantalla, una frase por separador y el logo en la tapa")
    comprueba(pg.locator(".bv-hoja-media").evaluate_all(
        "ms => ms.every(m => !/\\d/.test(m.querySelector('.bv-ventana, .bv-telefono').textContent + getComputedStyle(m.querySelector('.bv-marco'), '::before').content))"),
              "las pantallas no llevan número (solo el texto)")
    comprueba(pg.locator('.bv-paso[data-escena="cinco"] .bv-telefono video').count() == 1
              and pg.locator('.bv-paso[data-escena="cinco"] .bv-ventana').count() == 0,
              "cinco minutos: un teléfono solo, sin navegador alrededor")
    comprueba(pg.locator(".bv-paso h3").evaluate_all("h => h.every(x => x.textContent.trim().split(' ').length <= 4)"),
              "títulos de los pasos breves")
    lineas = pg.locator(".bv-paso p[data-html]").evaluate_all("ps => ps.map(p => Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight)))")
    comprueba(all(3 <= n <= 5 for n in lineas), "descripciones de 3 a 5 líneas: %s" % lineas)
    comprueba(pg.locator(".bv-paso mark.bv-m").count() >= 9, "palabras clave resaltadas en amarillo")
    comprueba(all(s.endswith("-it.mp4") for s in pg.locator(".bv-hoja-media video").evaluate_all("v => v.map(x => x.getAttribute('src'))")),
              "  vídeos en el idioma de la página")
    # dónde hay que estar para ver la hoja i (lo mismo que calcula la página)
    PARADA = """i => { const p=document.querySelector('.bv-bloc-pista'), e=document.querySelector('.bv-bloc-escena');
        const hs=[...document.querySelectorAll('.bv-hoja')], w=h=>h.classList.contains('bv-paso')?0.5:0.32;
        let t=0.08+0.3; hs.slice(0,-1).forEach(h=>t+=w(h));
        const u=(p.offsetHeight-e.offsetHeight)/t; let a=0.08; for(let k=0;k<i;k++) a+=w(hs[k]);
        return p.getBoundingClientRect().top+scrollY+a*u+u*0.1; }"""
    ESTADO = "() => [...document.querySelectorAll('.bv-hoja')].map(h => h.classList.contains('pasada') ? 'p' : h.classList.contains('actual') ? 'a' : '-').join('')"
    ARRIBA = """() => { const b=document.querySelector('.bv-bloc').getBoundingClientRect();
        const el=document.elementFromPoint(b.left+b.width*0.3, b.top+b.height*0.5); return [...document.querySelectorAll('.bv-hoja')].indexOf(el && el.closest('.bv-hoja')); }"""
    nombres = pg.locator(".bv-hoja").evaluate_all("hs => hs.map(h => h.dataset.escena || (h.classList.contains('bv-tapa') ? 'tapa' : 'separador'))")
    # al bajar, las hojas se pasan una a una: siempre una sola arriba
    for i, nombre in enumerate(nombres):
        pg.evaluate("y => scrollTo({top: y, behavior: 'instant'})", pg.evaluate(PARADA, i)); pg.wait_for_timeout(1300)
        estado, arriba = pg.evaluate(ESTADO), pg.evaluate(ARRIBA)
        comprueba(estado == "p" * i + "a" + "-" * (len(nombres) - i - 1) and arriba == i,
                  "hoja %d (%s): las de antes pasadas, esta arriba y a la vista" % (i, nombre))
        if pg.locator(".bv-hoja").nth(i).get_attribute("data-tipo") in ("video", "movil"):
            suenan = pg.evaluate("() => [...document.querySelectorAll('.bv-hoja-media video')].filter(v => !v.paused).map(v => v.dataset.escena)")
            comprueba(suenan == [nombre], "  y solo se mueve su pantalla (%s)" % suenan)
    # al subir, vuelven
    pg.evaluate("y => scrollTo({top: y, behavior: 'instant'})", pg.evaluate(PARADA, 3)); pg.wait_for_timeout(1500)
    comprueba(pg.evaluate(ESTADO) == "ppp" + "a" + "-" * 9 and pg.evaluate(ARRIBA) == 3, "al subir, las hojas vuelven")
    # a media vuelta, nada ensancha la página
    pg.evaluate("y => scrollTo({top: y, behavior: 'instant'})", pg.evaluate(PARADA, 4)); pg.wait_for_timeout(350)
    comprueba(pg.evaluate("document.documentElement.scrollWidth") <= 1440, "al pasar una hoja, nada se sale por los lados")
    pg.wait_for_timeout(1200)
    # pulsar en la hoja la pasa; las pestañas llevan a su tramo
    pg.locator(".bv-hoja.actual .bv-hoja-txt").click(); pg.wait_for_timeout(1800)
    comprueba(pg.evaluate(ARRIBA) == 5, "pulsar en la hoja pasa a la siguiente")
    pg.locator(".bv-pestana-3").click(); pg.wait_for_timeout(2200)
    comprueba(pg.evaluate(ARRIBA) == nombres.index("practica") - 1, "la pestaña «e in più» lleva a su separador")
    # dos mundos: con el fondo fijo, la plataforma, el «+» y el profesor salen uno detrás de otro
    dt = pg.evaluate("document.querySelector('.bv-dos-pista').getBoundingClientRect().top + scrollY")
    dh = pg.evaluate("document.querySelector('.bv-dos-pista').offsetHeight - innerHeight")
    vistos = []
    for f in (0.02, 0.25, 0.5, 0.8):
        pg.evaluate("y => scrollTo(0, y)", dt + f * dh); pg.wait_for_timeout(300)
        vistos.append(pg.locator(".bv-dos [data-desde].visto").count())
    comprueba(vistos == [0, 1, 2, 3], "presentación: la plataforma, luego el «+», luego José (%s)" % vistos)
    for f in ["bienvenida/escena-%s-%s.%s" % (n, l, e) for n in ("reserva", "portada", "clase", "notas", "repaso", "lectura", "movil-cinco", "teoria")
              for l in ("es", "it", "en") for e in ("mp4", "jpg")] + \
             ["bienvenida/escena-practica-%s.jpg" % l for l in ("es", "it", "en")] + \
             ["bienvenida/practica-%s-%s.jpg" % (m, l) for m in ("nivel", "tema", "curso") for l in ("es", "it", "en")]:
        if not pg.request.get(B + "/" + f).ok:
            comprueba(False, "falta %s" % f)
    comprueba(pg.evaluate("document.documentElement.scrollWidth") <= 1440, "nada se sale por los lados")
    # la práctica libre: los botones cambian la foto de la pantalla
    pg.evaluate("y => scrollTo({top: y, behavior: 'instant'})", pg.evaluate(PARADA, nombres.index("practica"))); pg.wait_for_timeout(1300)
    hoja = pg.locator('.bv-paso[data-escena="practica"]')
    hoja.locator('button[data-foto="tema"]').click(); pg.wait_for_timeout(300)
    vista = hoja.evaluate("h => h.querySelector('.bv-fotos img.vista').dataset.foto")
    comprueba(vista == "tema" and hoja.locator('button[data-foto="tema"]').get_attribute("aria-pressed") == "true"
              and pg.evaluate(ARRIBA) == nombres.index("practica"), "«per argomento» cambia la foto, sin pasar la hoja")
    comprueba(pg.locator("#muestra.bv-gratis").count() == 1, "«¡Pruébalo gratis!» va aparte, en violeta")
    comprueba(pg.locator('a[href^="https://tidycal.com"]').count() == 1 and "Preply" not in pg.locator("#reservar").inner_text(),
              "reservar: solo en mi calendario (Preply queda como perfil con reseñas)")
    anchos = pg.locator(".bv-hola .bv-btn").evaluate_all("b => b.map(x => Math.round(x.getBoundingClientRect().width))")
    comprueba(len(set(anchos)) == 1, "los dos botones de arriba miden lo mismo: %s" % anchos)
    c.close()

    print("\n═══ en el móvil ═══")
    c = nuevo(br, ancho=390); pg = pagina(c)
    pg.goto(B + "/bienvenida.html", wait_until="load"); pg.wait_for_timeout(500)
    comprueba(pg.locator("#bv-video").get_attribute("src") == "bienvenida/recorrido-movil-it.mp4", "el vídeo de móvil")
    comprueba(pg.locator(".bv-pantalla.es-movil").count() == 1, "dentro del teléfono")
    comprueba(pg.evaluate("document.documentElement.scrollWidth") <= 390, "nada se sale por los lados")
    for ancho, altura in ((390, 844), (375, 667)):
        c2 = br.new_context(viewport={"width": ancho, "height": altura}, locale="it-IT", is_mobile=True, has_touch=True)
        pg2 = pagina(c2); pg2.goto(B + "/bienvenida.html", wait_until="load"); pg2.wait_for_timeout(500)
        pg2.evaluate("document.querySelector('.bv-bloc-pista').scrollIntoView()"); pg2.wait_for_timeout(500)
        cabe = pg2.evaluate("""() => [...document.querySelectorAll('.bv-cara')].every(c => c.scrollWidth <= c.clientWidth + 1
            && [...c.children].every(x => x.classList.contains('bv-pestana') || x.getBoundingClientRect().bottom <= c.getBoundingClientRect().bottom + 1))""")
        comprueba(pg2.evaluate("document.documentElement.classList.contains('bv-vivo')") and cabe
                  and pg2.evaluate("document.documentElement.scrollWidth") <= ancho,
                  "móvil %d×%d: el bloc pasa las hojas y todo cabe en cada una" % (ancho, altura))
        c2.close()
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

    for pag in ("/sobre-mi.html", "/privacidad.html"):
        c = nuevo(br); pg = pagina(c)
        pg.goto(B + pag, wait_until="load"); pg.wait_for_timeout(900)
        comprueba(pg.locator(".access-gate-overlay").count() == 0, "%s se ve sin entrar" % pag.strip("/"))
        c.close()

    c = nuevo(br, init=ALUMNA); pg = pagina(c)
    pg.goto(B + "/clase-si-tuviera-it.html", wait_until="load"); pg.wait_for_timeout(1500)
    comprueba(pg.locator(".muestra-franja").count() == 0 and pg.locator(".access-gate-overlay").count() == 0,
              "a la alumna, la clase le sale como siempre, sin franja")
    c.close()

    br.close()

print("\n%s" % ("TODO BIEN" if not err else "FALLOS:\n  " + "\n  ".join(err)))
sys.exit(1 if err else 0)
