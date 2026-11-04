# -*- coding: utf-8 -*-
"""Que el motor dé por buenas las respuestas del banco.

Se usa con el sitio servido en el 8947:
    python3 -m http.server 8947 --directory .   (en otra terminal)
    python3 herramientas/prueba_banco.py [tema ...]

revisa_banco.py mira la forma de cada ejercicio leyendo el archivo. Esto es
lo otro: abre el hub de verdad, coge la tanda que salga y contesta cada
ejercicio con la respuesta que dice el banco. Si el motor la rechaza, el
alumno habría visto «casi» con la respuesta correcta escrita.

Sin argumentos revisa los temas que más se usan en los repasos.
"""
import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import banco
from playwright.sync_api import sync_playwright

B = "http://localhost:8947"
POR_DEFECTO = ["irregulares", "indicativo", "formas-impersonales", "articulos",
               "pronombres", "fonetica", "clima", "temperatura", "atn-gramatica",
               "atn-verbos", "falsos-amigos", "profesional-telefono",
               "profesional-reuniones"]


def limpia(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip().lower()


def main(temas):
    fallos, probados = [], 0
    # varios ejercicios comparten enunciado («Ordina la frase:» sale quince
    # veces), así que el enunciado no basta para saber cuál es: se guardan
    # todos los que lo comparten y luego se desempata con lo que haya en
    # pantalla
    items = {}
    for it in [x for t in temas for x in banco.lee("it").get(t, {}).get("items", [])]:
        if it.get("answer"):
            items.setdefault(limpia(it["prompt"]), []).append(it)
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        ctx = nav.new_context(viewport={"width": 1280, "height": 1000})
        # el hub está detrás de la puerta: se entra como el profesor
        ctx.add_init_script("localStorage.setItem('jn_profe','true');"
                            "localStorage.setItem('jn_access_granted','true');"
                            "localStorage.setItem('jn_student_email','x@x.com');"
                            "localStorage.setItem('jn_track','it');")
        pg = ctx.new_page()
        for tema in temas:
            pg.goto("%s/ejercicios-it.html?tema=%s" % (B, tema))
            try:
                pg.wait_for_selector("#ex-hub-container .exercise-block", timeout=15000)
            except Exception:
                fallos.append("%s: no sale ni un ejercicio" % tema)
                continue
            # tres tandas por tema: en una sola salen doce ejercicios y los
            # temas tienen cuarenta, así que con una no se prueba casi nada
            vistos = 0
            for ronda in range(3):
                if ronda:
                    pg.locator("#ex-hub-generate").click()
                    pg.wait_for_timeout(250)
                vistos += ronda_de(pg, tema, items, fallos)
            probados += vistos
            print("%-26s %3d ejercicios probados" % (tema, vistos))
        nav.close()
    print("\n%d respuestas del banco probadas en el motor" % probados)
    if fallos:
        print("\nFALLOS (%d):" % len(fallos))
        for f in fallos[:20]:
            print("  ", f)
        sys.exit(1)
    print("SIN ERRORES")


def ronda_de(pg, tema, items, fallos):
            probados = 0
            bloques = pg.locator("#ex-hub-container .exercise-block")
            n = bloques.count()
            for i in range(n):
                b = bloques.nth(i)
                clave = limpia(b.locator(".exercise-prompt").inner_text())
                cands = [x for x in items.get(clave, [])
                         if x.get("type") not in ("match", "order")]
                if not cands:
                    continue
                it = cands[0]
                if it["type"] == "choice":
                    enPantalla = sorted(o.get_attribute("data-value")
                                        for o in b.locator(".option-btn").all())
                    mismos = [x for x in cands
                              if x.get("type") == "choice"
                              and sorted(x.get("options", [])) == enPantalla]
                    if not mismos:
                        continue     # ese ejercicio no es de los temas pedidos
                    it = mismos[0]
                buena = it["answer"].split("|")[0]
                if it["type"] == "choice":
                    boton = b.locator('.option-btn[data-value="%s"]' % buena.replace('"', '\\"'))
                    if not boton.count():
                        fallos.append("%s: «%s» no tiene botón para «%s»"
                                      % (tema, clave[:40], buena))
                        continue
                    boton.first.click()
                else:
                    b.locator(".exercise-input").fill(buena)
                    b.locator(".exercise-check").click()
                pg.wait_for_timeout(60)
                probados += 1
                fb = b.locator(".exercise-feedback")
                if "correct" not in (fb.get_attribute("class") or ""):
                    fallos.append("%s: «%s» con la respuesta «%s» sale como fallo (%s)"
                                  % (tema, clave[:45], buena, fb.inner_text()[:40]))
            return probados


if __name__ == "__main__":
    main(sys.argv[1:] or POR_DEFECTO)
