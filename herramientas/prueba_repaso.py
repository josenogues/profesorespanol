# -*- coding: utf-8 -*-
"""El repaso de una clase, de punta a punta.

Se usa con el sitio servido en el 8947:
    python3 -m http.server 8947 --directory .   (en otra terminal)
    python3 herramientas/prueba_repaso.py

José pulsa «Repaso» en una clase de la ficha del alumno, eso le pone otra
clase fechada, y el alumno la abre y hace una tanda de ejercicios sacada de
los temas de esa clase. Aquí se comprueban los tres tramos y, sobre todo,
que el repaso se acabe cuando el alumno toca otro modo del hub: si no, la
tanda seguiría saliendo del repaso y parecería que los botones no hacen nada.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from firebase_falso import monta, hora
from playwright.sync_api import sync_playwright
PROFE='ncjosemaria@gmail.com'
DB={"anna@x.com":{"email":"anna@x.com","nombre":"Anna","idioma":"it","activo":True,
     "updatedAt":hora(-1),
     "clases":[{"id":"presente","fecha":"2026-10-01","nota":""},
               {"id":"to-be","fecha":"2026-10-08","nota":""},
               # el repaso ya guardado: el Firestore falso no comparte memoria
               # entre pestañas, así que la parte de la alumna se siembra aquí
               {"rapida":{"rid":"r-prueba","titulo":"Repaso: El presente, y los que lo rompen",
                          "repasoDe":"presente","temas":[],"extra":[],"deberes":""},
                "fecha":"2026-11-02","nota":""}]}}
fallos=[]
def ok(c,t):
    print(('   ok  ' if c else '  FALLO ')+t)
    if not c: fallos.append(t)

with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    ctx=b.new_context(viewport={'width':1400,'height':1000}); monta(ctx, DB)
    ctx.add_init_script("localStorage.setItem('__falso_usuario','%s');"
      "localStorage.setItem('jn_profe','true');" % PROFE)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    print('═══ el panel ═══')
    pg.goto('http://localhost:8947/panel-profesor.html'); pg.wait_for_timeout(2500)
    pg.locator('tr', has_text='anna@x.com').first.click(); pg.wait_for_timeout(900)
    filas=pg.locator('.fi-row')
    ok(filas.count()==3, 'la ficha enseña sus clases y el repaso ya puesto')
    ok(pg.locator('.fi-repaso').count()==2, 'cada clase del catálogo trae su botón de Repaso, y el repaso no')
    # repaso de «El presente»
    fila=pg.locator('.fi-row:has(.fi-repaso)', has_text='El presente').first
    fila.locator('.fi-repaso').click(); pg.wait_for_timeout(1200)
    ok(pg.locator('.fi-row').count()==4, 'al pulsar Repaso aparece una clase más')
    nueva=pg.locator('.fi-row', has_text='Repaso:').last
    ok(nueva.count()>0, 'y se llama «Repaso: ...»')
    print('   fila:', nueva.inner_text().replace('\n',' | ')[:150])
    f=nueva.locator('.fi-fecha').input_value()
    ok(bool(f), 'con fecha puesta: '+repr(f))
    ok(nueva.locator('.fi-repaso').count()==0, 'de un repaso no se hace repaso')
    ok(not errs, 'sin errores de JS en el panel: %s' % errs)
    pg.close()

    print('\n═══ lo que ve la alumna ═══')
    pg2=ctx.new_page(); errs2=[]; pg2.on('pageerror', lambda e: errs2.append(str(e)))
    pg2.add_init_script("localStorage.setItem('__falso_usuario','anna@x.com');"
      "localStorage.setItem('jn_access_granted','true');"
      "localStorage.setItem('jn_student_email','anna@x.com');"
      "localStorage.setItem('jn_track','it');")
    pg2.goto('http://localhost:8947/mis-clases-it.html'); pg2.wait_for_timeout(2500)
    fila=pg2.locator('.cl-row', has_text='Ripasso')
    ok(fila.count()==1, 'el repaso le sale como una clase más, y en su idioma')
    ok('Ripasso: Il presente' in fila.first.inner_text(),
       'con el título de la clase traducido: ' + fila.first.inner_text().split('\n')[1][:60])
    fila.first.click(); pg2.wait_for_timeout(500)
    det=fila.first.locator('.cl-repaso')
    print('   dentro:', det.inner_text().replace('\n',' | ')[:200])
    ok('Teoria' not in det.inner_text() and 'Teoría' not in det.inner_text(),
       'dentro no hay bloques de teoría')
    href=det.locator('.cl-rep-boton').get_attribute('href')
    ok(href=='ejercicios-it.html?repaso=presente', 'el botón abre el repaso: '+str(href))
    ok(not errs2, 'sin errores de JS: %s' % errs2)

    print('\n═══ la tanda ═══')
    pg3=ctx.new_page(); errs3=[]; pg3.on('pageerror', lambda e: errs3.append(str(e)))
    pg3.add_init_script("localStorage.setItem('jn_track','it');")
    pg3.goto('http://localhost:8947/ejercicios-it.html?repaso=presente'); pg3.wait_for_timeout(2500)
    n=pg3.locator('#ex-hub-container .exercise-block').count()
    ok(n>0, 'salen ejercicios: %d' % n)
    cab=pg3.locator('#ex-repaso')
    ok(cab.count()==1, 'con su cabecera')
    print('   cabecera:', cab.inner_text().replace('\n',' | ')[:160])
    ok(pg3.locator('#ex-mode-panel-tema .ex-category-grid').first.is_visible()==False,
       'sin el selector de materias')
    ok(pg3.locator('#ex-step2').is_visible()==False, 'y sin el de temas')
    # otra tanda: tiene que seguir siendo del repaso
    pg3.locator('#ex-hub-generate').click(); pg3.wait_for_timeout(800)
    ok(pg3.locator('#ex-hub-container .exercise-block').count()>0,
       '«generar otra tanda» sigue dando ejercicios del repaso')
    # si cambia de modo, el repaso se acaba de verdad
    pg3.locator('#ex-mode-back-tema').click(); pg3.wait_for_timeout(500)
    ok(pg3.locator('#ex-repaso').count()==0, 'al cambiar de modo desaparece la cabecera del repaso')
    pg3.locator('.ex-mode-card[data-mode="tema"]').click(); pg3.wait_for_timeout(400)
    ok(pg3.locator('#ex-mode-panel-tema .ex-category-grid').first.is_visible(),
       'y vuelven los selectores de materia')
    # un id que no existe no debe romper nada
    pg4=ctx.new_page(); e4=[]; pg4.on('pageerror', lambda e: e4.append(str(e)))
    pg4.goto('http://localhost:8947/ejercicios-it.html?repaso=noexiste'); pg4.wait_for_timeout(1500)
    ok(pg4.locator('#ex-repaso').count()==0 and not e4,
       'un repaso de una clase que no existe se ignora sin romper nada')
    ok(not errs3, 'sin errores de JS: %s' % errs3)
    b.close()
print('\n'+('SIN ERRORES' if not fallos else 'FALLOS: %d' % len(fallos)))
sys.exit(1 if fallos else 0)
