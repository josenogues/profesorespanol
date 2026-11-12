# -*- coding: utf-8 -*-
"""El buscador del menú: encuentra, respeta la pista, escapa y habla el idioma."""
import json, sys
sys.path.insert(0, "/home/user/profesorespanol/herramientas")
from firebase_falso import monta
from playwright.sync_api import sync_playwright
B = "http://127.0.0.1:8947"
err = []
def comprueba(c, t):
    if not c: err.append(t)
    print("   %s %s" % ("ok " if c else "MAL", t))
DB = {"anna@x.com": {"email": "anna@x.com", "nombre": "Anna", "activo": True, "clases": []}}
with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    for pista, ph, nada in (("es", "Buscar...", "Sin resultados para"), ("it", "Cerca...", "Nessun risultato per"),
                            ("en", "Search...", "No results for"), (None, "Buscar...", "Sin resultados para")):
        c = br.new_context(viewport={"width": 1200, "height": 900})
        monta(c, json.loads(json.dumps(DB)))
        ini = ("localStorage.setItem('__falso_usuario','anna@x.com');localStorage.setItem('jn_access_granted','true');"
               "localStorage.setItem('jn_student_email','anna@x.com');")
        if pista: ini += "localStorage.setItem('jn_track','%s');" % pista
        c.add_init_script(ini)
        pg = c.new_page()
        pg.on("pageerror", lambda e: err.append("JS: %s" % e))
        pedidos = []
        pg.on("request", lambda r: pedidos.append(r.url) if "search-index" in r.url or "firebase-init" in r.url else None)
        pg.goto(B + "/index.html", wait_until="load"); pg.wait_for_timeout(600)
        print("\n═══ pista: %s ═══" % pista)
        comprueba(pg.locator("#site-search").get_attribute("placeholder") == ph, "el rótulo del buscador está en su idioma (%s)" % ph)
        comprueba(not [u for u in pedidos if "search-index" in u], "el índice no se pide hasta tocar el buscador")
        comprueba(len([u for u in pedidos if "firebase-init" in u]) == 1,
                  "firebase-init.js se pide una sola vez (%d)" % len([u for u in pedidos if "firebase-init" in u]))
        pg.locator("#site-search").click(); pg.keyboard.type("subjuntivo", delay=20); pg.wait_for_timeout(900)
        enlaces = pg.locator("#search-results a").all()
        hrefs = [a.get_attribute("href") for a in enlaces]
        comprueba(len(hrefs) > 0 and len(hrefs) <= 10, "«subjuntivo» da resultados (%d)" % len(hrefs))
        if pista:
            comprueba(all(("-%s.html" % pista) in h or not any(h.endswith("-%s.html" % x) for x in ("es", "it", "en")) for h in hrefs),
                      "y solo de su pista")
            comprueba("🇪🇸" not in pg.locator("#search-results").inner_text(), "sin banderas cuando ya hay pista")
        else:
            comprueba(len({h[-7:-5] for h in hrefs if h[-8] == "-"}) >= 1 and "🇪🇸" in pg.locator("#search-results").inner_text() or "🇮🇹" in pg.locator("#search-results").inner_text(),
                      "sin pista salen de todas, con bandera")
        partes = sorted(u.split("search-index-")[1].split(".js")[0] for u in pedidos if "search-index" in u)
        espero = sorted(["comun", pista]) if pista else ["comun", "en", "es", "it"]
        comprueba(partes == espero, "se baja solo el índice que toca, y una vez (%s)" % ", ".join(partes))
        # tildes y mayúsculas dan igual
        pg.locator("#site-search").fill("PERIFRASIS"); pg.wait_for_timeout(300)
        comprueba(pg.locator("#search-results a").count() > 0, "«PERIFRASIS» sin tilde y en mayúsculas encuentra")
        # lo que se teclea no se interpreta como HTML
        pg.locator("#site-search").fill('<img src=x onerror="window.__xss=1">zzz'); pg.wait_for_timeout(400)
        vacio = pg.locator("#search-results .search-empty")
        comprueba(vacio.count() == 1 and nada in vacio.inner_text(), "sin resultados lo dice en su idioma («%s»)" % nada)
        comprueba(pg.locator("#search-results img").count() == 0 and not pg.evaluate("window.__xss"),
                  "y lo tecleado sale como texto, no como etiqueta")
        comprueba("<img" in vacio.inner_text(), "tal cual se escribió")
        # se cierra al pinchar fuera
        pg.evaluate("document.querySelector('main').dispatchEvent(new MouseEvent('click', {bubbles: true}))"); pg.wait_for_timeout(150)
        comprueba(not pg.locator("#search-results").evaluate("e => e.classList.contains('active')"), "se cierra al pinchar fuera")
        # y un resultado lleva a su página
        pg.locator("#site-search").fill("ser y estar"); pg.wait_for_timeout(300)
        if pg.locator("#search-results a").count():
            h = pg.locator("#search-results a").first.get_attribute("href")
            pg.locator("#search-results a").first.click(); pg.wait_for_load_state("load")
            comprueba(pg.url.endswith(h), "pinchar un resultado lleva a %s" % h)
        else:
            comprueba(False, "«ser y estar» debería dar algo")
        c.close()
    # cambiar de idioma sin recargar cambia el rótulo
    c = br.new_context(viewport={"width": 1200, "height": 900}); monta(c, json.loads(json.dumps(DB)))
    c.add_init_script("localStorage.setItem('__falso_usuario','anna@x.com');localStorage.setItem('jn_access_granted','true');localStorage.setItem('jn_student_email','anna@x.com');")
    pg = c.new_page(); pg.goto(B + "/index.html", wait_until="load"); pg.wait_for_timeout(500)
    pg.locator('.lang-track-btn[data-track="en"]').click(); pg.wait_for_timeout(300)
    print("\n═══ cambio de idioma ═══")
    comprueba(pg.locator("#site-search").get_attribute("placeholder") == "Search...", "al pasar a inglés el buscador dice «Search...»")
    pedidos = []
    pg.on("request", lambda r: pedidos.append(r.url) if "search-index" in r.url else None)
    pg.locator("#site-search").click(); pg.keyboard.type("weather", delay=20); pg.wait_for_timeout(900)
    hrefs = [a.get_attribute("href") for a in pg.locator("#search-results a").all()]
    comprueba(len(hrefs) > 0 and all(not h.endswith(("-es.html", "-it.html")) for h in hrefs),
              "y busca ya en las páginas en inglés (%d resultados)" % len(hrefs))
    comprueba(sorted(u.split("search-index-")[1].split(".js")[0] for u in pedidos) == ["comun", "en"],
              "bajándose el índice inglés, no los otros")
    pg.locator('.lang-track-btn[data-track="it"]').click(); pg.wait_for_timeout(400)
    pg.locator("#site-search").fill("congiuntivo"); pg.wait_for_timeout(900)
    hrefs = [a.get_attribute("href") for a in pg.locator("#search-results a").all()]
    comprueba(len(hrefs) > 0 and all(not h.endswith(("-es.html", "-en.html")) for h in hrefs),
              "al cambiar a italiano sin recargar, busca en las italianas (%d)" % len(hrefs))
    br.close()
print("\n" + ("SIN ERRORES" if not err else "ERRORES:\n  " + "\n  ".join(err)))
sys.exit(1 if err else 0)
