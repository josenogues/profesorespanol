# -*- coding: utf-8 -*-
"""Busca objetos que se hayan quedado sin fondo al quitar la caja grande.

Se usa con el sitio servido en el 8947:
    python3 -m http.server 8947 --directory .   (en otra terminal)
    python3 herramientas/transparentes.py

La regla de José: solo desaparece el recuadro del fondo. Una tabla, una nota
o una tarjeta son objetos y no pueden ser transparentes — antes heredaban el
blanco de la tarjeta que los envolvía y ahora dejan ver el papel rayado.

En vez de ir a ojo página por página, se le pregunta al navegador: dime todo
lo que tiene pinta de objeto (borde visible o esquinas redondeadas) y no
tiene fondo propio.
"""
import sys, os, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from firebase_falso import monta, hora
from playwright.sync_api import sync_playwright

B = "http://localhost:8947"
DB = {"anna@x.com": {"email": "anna@x.com", "activo": True, "updatedAt": hora(-1),
                     "clases": [{"id": "motor", "fecha": "2026-10-20", "nota": ""}]}}

# una de cada tipo de página, no solo teoría
PAGINAS = ["ser-estar-es.html", "subjuntivo-es.html", "conjugaciones-es.html",
           "vocabulario-es.html", "casa-es.html", "comidas-bebidas-es.html",
           "expresiones-comunes-es.html", "especial-atencion-verbos-es.html",
           "profesional-email-es.html", "fonetica-es.html", "la-hora-es.html",
           "clase-motor-es.html", "clase-to-be-en.html", "mis-clases-es.html",
           "ejercicios-es.html", "tiempos-verbales-es.html", "perifrasis-es.html",
           "modismos-it.html", "pronombres-es.html", "imperativo-es.html"]

BUSCA = """() => {
  const fuera = new Set(['MAIN','BODY','HTML','ASIDE','FOOTER','SECTION']);
  const out = [];
  for(const e of document.querySelectorAll('main *')){
    if(fuera.has(e.tagName)) continue;
    const c = getComputedStyle(e);
    if(e.offsetParent === null && c.position !== 'fixed') continue;
    const sinFondo = c.backgroundColor === 'rgba(0, 0, 0, 0)' && c.backgroundImage === 'none';
    if(!sinFondo) continue;
    const radio = parseFloat(c.borderRadius) || 0;
    const borde = ['Top','Right','Bottom','Left'].filter(l =>
      parseFloat(c['border'+l+'Width']) > 0 &&
      c['border'+l+'Style'] !== 'none' &&
      c['border'+l+'Color'] !== 'rgba(0, 0, 0, 0)').length;
    // un objeto: caja cerrada por los cuatro lados, o esquinas redondeadas
    const sombra = c.boxShadow && c.boxShadow !== 'none';
    if(!(radio >= 8 || borde === 4 || sombra)) continue;
    // si un antepasado ya pinta un fondo, no se ve el papel: no es problema
    let a = e.parentElement, tapado = false;
    while(a && a.tagName !== 'MAIN'){
      const ca = getComputedStyle(a);
      if(ca.backgroundColor !== 'rgba(0, 0, 0, 0)' || ca.backgroundImage !== 'none'){ tapado = true; break; }
      a = a.parentElement;
    }
    if(tapado) continue;
    // los <section class="grammar-section"> son justamente la caja que se ha
    // quitado a propósito
    if(e.classList.contains('grammar-section')) continue;
    out.push((e.tagName.toLowerCase()) + '.' + (e.className || '(sin clase)'));
  }
  return out;
}"""

cuenta = collections.Counter()
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    for pag in PAGINAS:
        c = br.new_context(viewport={"width": 1280, "height": 900})
        monta(c, DB)
        c.add_init_script("localStorage.setItem('jn_access_granted','true');"
                          "localStorage.setItem('jn_student_email','anna@x.com');"
                          "localStorage.setItem('jn_track','es');")
        pg = c.new_page()
        pg.goto(B + "/" + pag, wait_until="domcontentloaded")
        pg.wait_for_timeout(1300)
        for sel in pg.evaluate(BUSCA):
            cuenta[sel] += 1
        c.close()
    br.close()

if not cuenta:
    print("SIN OBJETOS TRANSPARENTES")
else:
    print("Objetos sin fondo propio (nº de páginas donde salen):\n")
    for sel, n in cuenta.most_common():
        print("  %-62s %2d" % (sel[:62], n))
sys.exit(1 if cuenta else 0)
