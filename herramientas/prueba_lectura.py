# -*- coding: utf-8 -*-
"""La lectura de una clase, de punta a punta.

Se usa con el sitio servido en el 8947:
    python3 -m http.server 8947 --directory .   (en otra terminal)
    python3 herramientas/prueba_lectura.py

José pulsa «Lectura» en una clase de la ficha del alumno; el alumno la ve
como un botón dentro de esa clase en «Mis clases», la abre, lee el texto
(las palabras difíciles se tocan y sale su traducción), contesta las
preguntas (cada una con su traducción escondida) y escribe al final. Lo que
escribe se guarda como los apuntes y José lo lee en el panel, plegado
dentro de esa clase.
"""
import sys
import os
import re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from firebase_falso import monta, hora
from playwright.sync_api import sync_playwright

PROFE = 'ncjosemaria@gmail.com'
URL = 'http://localhost:8947/'
LEC = {"rapida": {"rid": "l-prueba", "titulo": "Lectura: Si tuviera dinero…", "lecturaDe": "si-tuviera",
                  "temas": [], "extra": [], "deberes": ""}, "fecha": "2026-11-21", "nota": ""}
DB = {
    # Anna ya tiene la lectura puesta y ha escrito algo
    "anna@x.com": {"email": "anna@x.com", "nombre": "Anna", "idioma": "it", "activo": True,
                   "updatedAt": hora(-1),
                   "apuntes": {"lectura-si-tuviera": {"t": "Si me tocara el Gordo, me compraría una casa.",
                                                      "at": "2026-11-22T10:00:00Z"}},
                   "clases": [{"id": "si-tuviera", "fecha": "2026-11-19", "nota": ""}, LEC]},
    # Marco tiene la clase, pero todavía no la lectura
    "marco@x.com": {"email": "marco@x.com", "nombre": "Marco", "idioma": "en", "activo": True,
                    "updatedAt": hora(-2),
                    "clases": [{"id": "si-tuviera", "fecha": "2026-11-19", "nota": ""},
                               {"id": "tres-pasados", "fecha": "2026-11-12", "nota": ""}]},
}
fallos = []


def ok(c, t):
    print(('   ok  ' if c else '  FALLO ') + t)
    if not c:
        fallos.append(t)


def alumna(ctx, email, track):
    ctx.add_init_script(
        "localStorage.setItem('__falso_usuario','%s');localStorage.setItem('jn_access_granted','true');"
        "localStorage.setItem('jn_student_email','%s');localStorage.setItem('jn_track','%s');"
        % (email, email, track))


with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')

    print('═══ el panel ═══')
    ctx = b.new_context(viewport={'width': 1400, 'height': 1000}); monta(ctx, DB)
    ctx.add_init_script("localStorage.setItem('__falso_usuario','%s');localStorage.setItem('jn_profe','true');" % PROFE)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL + 'panel-profesor.html'); pg.wait_for_timeout(2500)
    pg.locator('tr', has_text='marco@x.com').first.click(); pg.wait_for_timeout(900)
    fila540 = pg.locator('#ficha .fi-row', has_text='#540')
    fila440 = pg.locator('#ficha .fi-row', has_text='#440')
    ok(fila540.locator('.fi-lectura').count() == 1, 'la clase 540 trae su botón «Lectura»')
    ok(fila440.locator('.fi-lectura').count() == 0, 'una clase sin lectura escrita no lo trae')
    fila540.locator('.fi-lectura').click(); pg.wait_for_timeout(1200)
    nueva = pg.locator('#ficha .fi-row', has_text='Lectura: Si tuviera')
    ok(nueva.count() == 1, 'al pulsarlo aparece «Lectura: Si tuviera dinero…»')
    ok(nueva.locator('.fi-fecha').input_value() != '', 'con fecha puesta')
    href = nueva.locator('.fi-tit a').first.get_attribute('href')
    ok(href == 'lectura-en.html?clase=si-tuviera', 'su título abre la lectura como la ve él: %s' % href)
    ok(pg.locator('#ficha .fi-row', has_text='#540').locator('.fi-lectura').is_disabled(),
       'y el botón se apaga: una lectura por clase')
    ok(nueva.locator('.fi-escrito.vacio').count() == 1, 'si no ha escrito nada, lo dice sin desplegable')
    pg.goto(URL + 'panel-profesor.html'); pg.wait_for_timeout(2500)
    pg.locator('tr', has_text='anna@x.com').first.click(); pg.wait_for_timeout(900)
    esc = pg.locator('#ficha .fi-escrito').first
    ok(esc.evaluate('e => e.tagName') == 'DETAILS' and not esc.evaluate('e => e.open'),
       'lo que ha escrito Anna sale plegado')
    esc.locator('summary').click(); pg.wait_for_timeout(200)
    ok('me compraría una casa' in esc.inner_text() and '(9 palabras)' in esc.inner_text(),
       'y al abrirlo se lee, con las palabras contadas: ' + esc.inner_text().replace('\n', ' | ')[:90])
    ok(not errs, 'sin errores de JS en el panel: %s' % errs)
    ctx.close()

    print('\n═══ «Mis clases» ═══')
    ctx = b.new_context(viewport={'width': 1400, 'height': 900}); monta(ctx, DB)
    alumna(ctx, 'anna@x.com', 'it')
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL + 'mis-clases-it.html'); pg.wait_for_timeout(2500)
    boton = pg.locator('.cl-row', has_text='Si tuviera').locator('.cl-hija')
    ok(boton.count() == 1 and 'Lettura' in boton.inner_text(), 'la lectura es un botón dentro de su clase, en italiano')
    ok(boton.get_attribute('href') == 'lectura-it.html?clase=si-tuviera', 'que lleva a la lectura')
    ok(pg.locator('.cl-row').count() == 1, 'y no ocupa una fila propia')
    ok(not errs, 'sin errores de JS: %s' % errs)
    ctx.close()

    print('\n═══ la lectura ═══')
    ctx = b.new_context(viewport={'width': 1400, 'height': 900}); monta(ctx, DB)
    alumna(ctx, 'marco@x.com', 'it')
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL + 'lectura-it.html?clase=si-tuviera'); pg.wait_for_timeout(2500)
    ok(pg.locator('.lec-h').inner_text() == 'El décimo', 'sale el título del texto')
    ok(pg.locator('.lec-texto p').count() >= 8, 'el texto entero, en párrafos')
    ok(pg.locator('.lec-de a').get_attribute('href') == 'clase-si-tuviera-it.html', 'con el enlace a su clase')
    # glosario
    pal = pg.locator('.lec-pal', has_text='tejado')
    pal.click(); pg.wait_for_timeout(150)
    ok(pg.locator('.lec-burbuja').is_visible() and 'tetto' in pg.locator('.lec-burbuja').inner_text(),
       'tocar «tejado» enseña «il tetto»')
    pg.mouse.click(5, 5); pg.wait_for_timeout(150)
    ok(not pg.locator('.lec-burbuja').is_visible(), 'y se cierra al tocar fuera')
    # traducción escondida
    tr = pg.locator('.lec-trad').first
    ok(not tr.is_visible(), 'la traducción de la pregunta está escondida')
    pg.locator('.lec-trad-btn').first.click(); pg.wait_for_timeout(100)
    ok(tr.is_visible() and 'nonno' in tr.inner_text(), 'y sale al pulsar «Traduzione»')
    bloques = pg.locator('.exercise-block')
    ok(bloques.count() == 8, 'ocho preguntas: %d' % bloques.count())
    # una mal y luego bien
    b1 = bloques.nth(0)
    b1.locator('.option-btn', has_text='El texto no lo dice').click(); pg.wait_for_timeout(150)
    ok('incorrect' in b1.locator('.exercise-feedback').get_attribute('class'), 'una respuesta mala se marca como mala')
    b1.locator('.option-btn', has_text='No, nunca').click(); pg.wait_for_timeout(150)
    ok('is-done' in b1.get_attribute('class'), 'y la buena la da por hecha')
    # la trampa: copiar a Irene
    b6 = bloques.nth(5)
    b6.locator('.exercise-input').fill('tendría'); b6.locator('.exercise-check').click(); pg.wait_for_timeout(150)
    ok('is-done' not in b6.get_attribute('class'), '«tendría» en la 6 no vale')
    b6.locator('.exercise-input').fill('tuviera'); b6.locator('.exercise-check').click(); pg.wait_for_timeout(150)
    ok('is-done' in b6.get_attribute('class'), '«tuviera» sí')
    b3 = bloques.nth(2)
    b3.locator('.exercise-input').fill('cambiaria'); b3.locator('.exercise-check').click(); pg.wait_for_timeout(150)
    ok('is-done' in b3.get_attribute('class'), '«cambiaria» sin tilde también vale')
    ok(pg.locator('.ex-uno-fin, .lec-nota-final').count() == 0, 'sin nota final')
    # escribir
    area = pg.locator('.lec-escribe textarea')
    area.fill('Si tuviera dinero, viajaría.'); area.blur(); pg.wait_for_timeout(1500)
    nube = pg.evaluate("window.jnCloudGetStudentDoc('marco@x.com').then(d => d.apuntes && d.apuntes['lectura-si-tuviera'] && d.apuntes['lectura-si-tuviera'].t)")
    ok(nube == 'Si tuviera dinero, viajaría.', 'lo escrito se guarda solo en su ficha: %r' % nube)
    pg.reload(); pg.wait_for_timeout(2500)
    ok(pg.locator('.lec-escribe textarea').input_value() == 'Si tuviera dinero, viajaría.', 'y sigue ahí al volver')
    # cambiar de idioma no pierde la lectura
    pg.locator('.lang-track-btn[data-track="en"]').click(); pg.wait_for_timeout(2500)
    ok('lectura-en.html?clase=si-tuviera' in pg.url and pg.locator('.lec-h').count() == 1,
       'al pasar a English sigue en la misma lectura: ' + pg.url)
    ok('Translation' in pg.locator('.lec-trad-btn').first.inner_text(), 'con los botones en inglés')
    ok(not errs, 'sin errores de JS: %s' % errs)
    # en la pista en español no hay nada que traducir
    pg.goto(URL + 'lectura-es.html?clase=si-tuviera'); pg.wait_for_timeout(2000)
    ok(pg.locator('.lec-trad-btn').count() == 0, 'en la pista en español no hay botones de traducción')
    pg.locator('.lec-pal').first.click(); pg.wait_for_timeout(150)
    ok('billete' in pg.locator('.lec-burbuja').inner_text(), 'y el glosario se explica en español')
    # una lectura que no existe
    pg.goto(URL + 'lectura-it.html?clase=tres-pasados'); pg.wait_for_timeout(1500)
    ok('non esiste' in pg.locator('#lec-cont').inner_text(), 'una clase sin lectura lo dice sin romper nada')
    # en el móvil cabe sin desbordar
    ctx.close()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True); monta(ctx, DB)
    alumna(ctx, 'marco@x.com', 'it')
    pg = ctx.new_page(); pg.goto(URL + 'lectura-it.html?clase=si-tuviera'); pg.wait_for_timeout(2500)
    ancho = pg.evaluate('document.documentElement.scrollWidth')
    ok(ancho <= 390, 'en el móvil no se sale de la pantalla (%d px)' % ancho)
    ctx.close()

    print('\n═══ como lo sirve Cloudflare: sin «.html» ═══')
    # hablaconjose.com sirve lectura-es en vez de lectura-es.html. La web
    # leía el idioma del «-es.html» del final, y ahí el botón de idioma se
    # marcaba pero no cambiaba de página (lo vio José el 23 nov 2026).
    ctx = b.new_context(viewport={'width': 1300, 'height': 900}); monta(ctx, DB)
    alumna(ctx, 'marco@x.com', 'es')
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def sin_html(route):
        ruta = route.request.url.split('?')[0].rsplit('/', 1)[1]
        route.fulfill(path=os.path.join(raiz, ruta + '.html'), content_type='text/html; charset=utf-8')
    ctx.route(re.compile(r'/lectura-(es|it|en)(\?.*)?$'), sin_html)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL + 'lectura-es?clase=si-tuviera'); pg.wait_for_timeout(2500)
    ok(pg.locator('.lec-preg h4').inner_text().strip() == 'Preguntas', 'lectura-es (sin .html) sale en español')
    pg.locator('.lang-track-btn[data-track="en"]').click(); pg.wait_for_timeout(2500)
    ok(pg.url.endswith('lectura-en?clase=si-tuviera') and pg.locator('.lec-preg h4').inner_text().strip() == 'Questions',
       'el botón English lleva a lectura-en, la misma lectura y en inglés: ' + pg.url)
    ok(pg.locator('.lec-trad-btn').count() > 0, 'y ahí están los botones de traducción')
    ok(not errs, 'sin errores de JS: %s' % errs)
    ctx.close()
    b.close()

print('\n' + ('SIN ERRORES' if not fallos else 'FALLOS: %d' % len(fallos)))
sys.exit(1 if fallos else 0)
