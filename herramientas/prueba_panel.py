# -*- coding: utf-8 -*-
"""El panel del profesor, de punta a punta, sin tocar los datos de verdad.

Se usa con el sitio servido en el 8947:
    python3 -m http.server 8947 --directory .   (en otra terminal)
    python3 herramientas/prueba_panel.py

Comprueba lo que el panel hace de verdad: que la agenda de arriba diga lo que
viene y a quién hay que mover, que el botón de cada fila abra a ESE alumno,
que al ponerle una clase se guarde en su ficha y la agenda se entere, que los
títulos de sus clases lleven a la página en SU idioma, y que lo que paga se
guarde tal y como se escribe, sin que nadie multiplique nada.
"""
import json
import sys

sys.path.insert(0, '/home/user/profesorespanol/herramientas')
from firebase_falso import monta, hora
from playwright.sync_api import sync_playwright

B = "http://127.0.0.1:8947"
PROF = "ncjosemaria@gmail.com"
HOY = __import__('datetime').date.today().isoformat()


def mas(dias):
    d = __import__('datetime').date.today() + __import__('datetime').timedelta(days=dias)
    return d.isoformat()


def al(email, nombre, idioma, nivel, dias, clases, **extra):
    d = {"email": email, "nombre": nombre, "idioma": idioma, "nivel": nivel,
         "activo": True, "updatedAt": hora(-dias), "clases": clases,
         "exerciseCount": extra.pop("ej", 0)}
    d.update(extra)
    return d


DB = {s["email"]: s for s in [
  # Anna es italiana y tiene una clase del catálogo trilingüe, una solo en
  # inglés y una rápida: los tres casos de enlace en la misma ficha
  al("anna@x.com", "Anna", "it", "B1", 1, [
      {"id": "motor", "fecha": mas(-7), "nota": ""},
      {"id": "gustar", "fecha": mas(-2), "nota": ""},
      {"rapida": {"titulo": "Por y para, de una vez", "temas": ["por-para"]},
       "fecha": mas(4), "nota": ""}],
     ej=140, clasesDadas=16, pagado=400, pagadoAt=mas(-16),
     apuntes={"motor": {"t": "me lío con el pluscuamperfecto"}}),
  al("brandon@x.com", "Brandon", "en", "A1", 0,
     [{"id": "saludos", "fecha": mas(1), "nota": ""}], ej=24),
  # sin ninguna clase futura: tiene que salir en «sin próxima clase»
  al("nora@x.com", "Nora", "en", "B1", 20, [], ej=0),
  al("viejo@x.com", "Un antiguo", "es", "B2", 120, [], ej=5, activo=False),
  # su propia ficha: está para mirar la web como la ve un alumno, no es cliente
  # con una clase puesta: es lo que hace José para ver la web por dentro
  al(PROF, "Yo", "es", "C1", 0, [{"id": "motor", "fecha": "2026-10-20", "nota": ""}],
     ej=3, clasesDadas=0, pagado=0),
  # recibe clases pero las paga otra: un cero que no es una tarifa de cero
  al("sabrina@x.com", "Sabrina", "it", "A2", 2, [], ej=18,
     clasesDadas=8, pagado=0, sinCobro=True),
]}

err = []


def comprueba(cond, texto):
    if not cond:
        err.append(texto)
    print("   %s %s" % ("ok " if cond else "MAL", texto))


def ficha_de(pg):
    return pg.locator("#ficha-quien").inner_text().strip()


with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    c = br.new_context(viewport={"width": 1400, "height": 1000})
    monta(c, json.loads(json.dumps(DB)), profesor=PROF)
    c.add_init_script("localStorage.setItem('__falso_usuario','%s');" % PROF)
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    pg.goto(B + "/panel-profesor.html", wait_until="domcontentloaded")
    pg.wait_for_timeout(2600)

    print("\n═══ la tabla y sus filtros ═══")
    comprueba(pg.locator(".al-fila").count() == 5, "de salida salen los 5 de alta y no el de baja")
    pg.locator('.al-fbtn[data-f="estado"][data-v="baja"]').click(); pg.wait_for_timeout(350)
    comprueba([r.locator(".al-quien b").inner_text() for r in pg.locator(".al-fila").all()] == ["Un antiguo"],
              "el filtro de bajas enseña solo al de baja")
    pg.locator('.al-fbtn[data-f="estado"][data-v=""]').click(); pg.wait_for_timeout(350)
    comprueba(pg.locator(".al-fila").count() == 6, "y «todos» los enseña a los seis")
    pg.locator('.al-fbtn[data-f="estado"][data-v="alta"]').click(); pg.wait_for_timeout(350)

    fila = pg.locator('tr[data-ficha="anna@x.com"]')
    comprueba("ayer" in fila.inner_text(), "la última actividad se dice en días, no en fecha y hora")
    comprueba("gustan" in fila.inner_text() and "Por y para" in fila.inner_text(),
              "su fila dice cuál fue la última clase y cuál es la próxima")
    comprueba("€" not in pg.locator("#tab-clases").inner_text(),
              "en «Clases» no sale ni un euro")
    comprueba(not pg.locator("#tab-eco").is_visible() and not pg.locator("#panel-kpis").is_visible(),
              "y la economía no se ve al abrir: está en su pestaña")
    nombres = [r.locator(".al-quien b").inner_text() for r in pg.locator(".al-fila").all()]
    comprueba(nombres[:2] == ["Brandon", "Anna"],
              "de salida van primero los que tienen la clase más cercana (%s)" % nombres[:3])

    print("\n═══ ordenar pulsando la cabecera ═══")
    pg.locator('th[data-col="ultima"]').click(); pg.wait_for_timeout(350)
    comprueba(pg.locator(".al-fila .al-quien b").first.inner_text() == "Anna",
              "por última clase, la más reciente primero")
    pg.locator('table[data-t="clases"] th[data-col="nombre"]').click(); pg.wait_for_timeout(350)
    nombres = [r.locator(".al-quien b").inner_text() for r in pg.locator(".al-fila").all()]
    comprueba(nombres == sorted(nombres, key=str.lower),
              "los nombres empiezan por la A, no por lo más alto (%s)" % nombres[:3])
    comprueba(pg.evaluate("document.querySelector('table[data-t=clases] th.al-orden.on').dataset.col") == "nombre",
              "la flecha se queda en la columna por la que ordena")

    print("\n═══ llegar a sus clases ═══")
    pg.locator('tr[data-ficha="anna@x.com"] .al-vercl').click(); pg.wait_for_timeout(700)
    comprueba(ficha_de(pg) == "Anna", "el botón de la fila abre la ficha de ESE alumno")
    enlaces = {a.inner_text().strip(): a.get_attribute("href")
               for a in pg.locator("#ficha-lista .fi-tit a").all()}
    comprueba(len(enlaces) == 2, "las dos del catálogo llevan enlace y la rápida no (%d)" % len(enlaces))
    comprueba(any(v == "clase-motor-it.html" for v in enlaces.values()),
              "una clase trilingüe se abre en italiano, que es su idioma")
    comprueba(any(v == "clase-gustar-en.html" for v in enlaces.values()),
              "una clase que solo existe en inglés se abre en inglés")
    comprueba("CLASE RÁPIDA" in pg.locator("#ficha-lista").inner_text().upper(),
              "la clase rápida se marca como tal")

    print("\n═══ ponerle una clase ═══")
    antes = pg.evaluate("window.__DB['anna@x.com'].clases.length")
    pg.fill("#ficha-busca", "350")
    comprueba(pg.locator("#ficha-cat .fc-row").count() == 1, "se busca en el catálogo de la ficha por número")
    pg.fill("#ficha-busca", "")
    pg.fill("#ficha-fecha", mas(3))
    pg.locator('[data-anade="sobre-ti"]').click(); pg.wait_for_timeout(900)
    guardadas = pg.evaluate("window.__DB['anna@x.com'].clases.map(c => c.id || 'rapida')")
    comprueba(len(guardadas) == antes + 1 and "sobre-ti" in guardadas,
              "la clase se guarda en su ficha de verdad (%s)" % guardadas)
    comprueba("Ver sus 4 clases" in pg.locator('tr[data-ficha="anna@x.com"]').inner_text(),
              "y el botón de su fila ya dice 4")

    # quitarla otra vez
    pg.locator("#ficha-lista .fi-row").filter(has=pg.locator('.fi-fecha[value="%s"]' % mas(3))) \
        .locator("[data-quitar]").click(); pg.wait_for_timeout(900)
    comprueba(pg.evaluate("window.__DB['anna@x.com'].clases.length") == antes,
              "y se puede quitar")
    comprueba(pg.locator("[data-deshacer]").count() == 1, "al quitarla sale «Deshacer»")
    pg.locator("[data-deshacer]").click(); pg.wait_for_timeout(900)
    comprueba(pg.evaluate("window.__DB['anna@x.com'].clases.length") == antes + 1 and
              pg.locator('#ficha-lista .fi-fecha[value="%s"]' % mas(3)).count() == 1,
              "y deshacer la devuelve, con su fecha")
    pg.locator("#ficha-lista .fi-row").filter(has=pg.locator('.fi-fecha[value="%s"]' % mas(3))) \
        .locator("[data-quitar]").click(); pg.wait_for_timeout(900)

    print("\n═══ la pestaña de economía ═══")
    pg.locator('.pn-tab[data-tab="eco"]').click(); pg.wait_for_timeout(300)
    comprueba(pg.locator("#tab-eco").is_visible() and not pg.locator("#tab-clases").is_visible(),
              "pulsarla enseña la economía y esconde lo demás")
    kpis = pg.locator("#panel-kpis").inner_text()
    comprueba("Alumnos de alta" in kpis and "5" in kpis, "cuántos hay de alta")
    comprueba("400 €" in kpis and "Cobrado en total" in kpis, "lo cobrado")
    comprueba("Tarifa media ahora" in kpis and "Tarifa media histórica" in kpis,
              "las dos tarifas medias, cada una en su tarjeta")
    comprueba("Clases dadas en total" in kpis and "24" in kpis,
              "y el total de clases dadas, también las que no se cobran")
    comprueba(pg.locator("#panel-kpis .kpi").count() == 0 and pg.locator("#panel-kpis").bounding_box()["height"] < 50,
              "y todo va en una sola línea de texto, sin tarjetas")
    fe = pg.locator('tr[data-eco="anna@x.com"]')
    comprueba(fe.locator('[data-campo="clasesDadas"]').input_value() == "16" and
              fe.locator('[data-campo="pagado"]').input_value() == "400",
              "los números de cada alumno salen en su fila, listos para editar")
    comprueba("25 €" in fe.locator(".eco-tarifa").inner_text(), "la tarifa media sale calculada (400 ÷ 16)")

    def col(campo):
        return [i.input_value() for i in pg.locator('.eco-fila [data-campo="%s"]' % campo).all()]
    pg.locator('th[data-col="dadas"]').click(); pg.wait_for_timeout(350)
    abajo = [int(x) for x in col("clasesDadas") if x != ""]
    comprueba(abajo == sorted(abajo, reverse=True), "un clic ordena de más a menos (%s)" % abajo)
    pg.locator('th[data-col="dadas"]').click(); pg.wait_for_timeout(350)
    arriba = [int(x) for x in col("clasesDadas") if x != ""]
    comprueba(arriba == sorted(arriba), "y el segundo, de menos a más (%s)" % arriba)

    fe = pg.locator('tr[data-eco="anna@x.com"]')
    fe.locator('[data-campo="clasesDadas"]').fill("10")
    fe.locator('[data-campo="pagado"]').fill("505")
    fe.locator('[data-eco-hoy]').click(); pg.wait_for_timeout(900)
    d = pg.evaluate("({t: window.__DB['anna@x.com'].clasesDadas, p: window.__DB['anna@x.com'].pagado,"
                    " f: window.__DB['anna@x.com'].pagadoAt})")
    comprueba(d["t"] == 10 and d["p"] == 505, "se guarda tal cual se escribe (%s)" % d)
    comprueba(d["f"] == HOY, "«Hoy» deja la fecha de hoy y nada más (%s)" % d["f"])
    comprueba("50,50 €" in fe.locator(".eco-tarifa").inner_text(),
              "la tarifa se recalcula sola, con la coma decimal española (505 ÷ 10)")
    comprueba("505 €" in pg.locator("#panel-kpis").inner_text(), "y los números de arriba se enteran")
    # vaciarlo tiene que borrarlo, no dejar un 0
    fe.locator('[data-campo="clasesDadas"]').fill("")
    fe.locator('[data-campo="pagado"]').click(); pg.wait_for_timeout(900)
    comprueba(pg.evaluate("window.__DB['anna@x.com'].clasesDadas") is None,
              "vaciar las clases dadas las deja vacía, no en cero")

    print("\n═══ quién cuenta para el dinero ═══")
    # Sabrina da 8 clases y paga 0 porque paga otra: si contara, la media se
    # hundiría. Y la ficha del propio profesor tampoco es un cliente.
    comprueba("no cuenta" in pg.locator('tr[data-eco="sabrina@x.com"] .eco-tarifa').inner_text(),
              "la que paga otra persona sale marcada «no cuenta»")
    comprueba("no cuenta" in pg.locator('tr[data-eco="%s"] .eco-tarifa' % PROF).inner_text(),
              "y la ficha del propio profesor, también, sin tocar nada")
    kpis_con = pg.locator("#panel-kpis").inner_text()
    caja = pg.locator('tr[data-eco="sabrina@x.com"] [data-campo="sinCobro"]')
    comprueba(caja.is_checked(), "su casilla sale marcada")
    caja.uncheck(); pg.wait_for_timeout(900)
    comprueba(pg.evaluate("window.__DB['sabrina@x.com'].sinCobro") is False, "desmarcarla se guarda")
    comprueba(pg.locator("#panel-kpis").inner_text() != kpis_con,
              "y entonces sí entra en la media, que cambia")
    caja.check(); pg.wait_for_timeout(900)
    comprueba(pg.locator("#panel-kpis").inner_text() == kpis_con,
              "y volver a marcarla lo deja como estaba")
    pg.locator('.pn-tab[data-tab="clases"]').click(); pg.wait_for_timeout(300)

    print("\n═══ de baja pero entrando, y de alta sin entrar ═══")
    # Dar de baja y quitar el acceso son dos cosas distintas: hay quien se da
    # de baja y sigue viendo la web un tiempo, y eso lo decide él.
    pg.locator('tr[data-ficha="anna@x.com"] .al-vercl').click(); pg.wait_for_timeout(700)
    comprueba(pg.locator("#fi-activo").input_value() == "si" and
              pg.locator("#fi-acceso").input_value() == "si",
              "una ficha sin «acceso» puesto sigue a su estado, como antes")
    pg.select_option("#fi-activo", "no"); pg.wait_for_timeout(900)
    d = pg.evaluate("({a: window.__DB['anna@x.com'].activo, ac: window.__DB['anna@x.com'].acceso})")
    comprueba(d["a"] is False and d["ac"] is True,
              "darla de baja no le quita el acceso: son dos campos (%s)" % d)
    comprueba("sigue entrando" in pg.locator("#fi-aviso-acceso").inner_text(),
              "y la ficha lo avisa en una línea")
    pg.locator('.al-fbtn[data-f="estado"][data-v="baja"]').click(); pg.wait_for_timeout(400)
    comprueba("Sigue entrando" in pg.locator('tr[data-ficha="anna@x.com"]').inner_text(),
              "la tabla la marca como baja que todavía entra")
    pg.select_option("#fi-acceso", "no"); pg.wait_for_timeout(900)
    comprueba(pg.evaluate("window.__DB['anna@x.com'].acceso") is False, "quitarle el acceso se guarda")
    comprueba("No entra" in pg.locator('tr[data-ficha="anna@x.com"]').inner_text(),
              "y la marca cambia a «No entra»")
    comprueba(pg.locator('.al-mas[open]').count() == 0, "«¿Ve la web?» está plegado en «Más filtros»")
    pg.locator(".al-mas summary").click()
    pg.locator('.al-fbtn[data-f="acceso"][data-v="no"]').click(); pg.wait_for_timeout(400)
    comprueba(any("Anna" in r.inner_text() for r in pg.locator(".al-fila").all()),
              "y el filtro «no entra» la encuentra")
    # devolverla a como estaba
    pg.select_option("#fi-activo", "si"); pg.wait_for_timeout(600)
    pg.select_option("#fi-acceso", "si"); pg.wait_for_timeout(900)
    pg.locator("#ficha-cerrar").click()
    pg.locator('.al-fbtn[data-f="acceso"][data-v=""]').click()
    pg.locator('.al-fbtn[data-f="estado"][data-v="alta"]').click(); pg.wait_for_timeout(400)

    print("\n═══ los apuntes del alumno ═══")
    pg.locator('tr[data-ficha="anna@x.com"] .al-vercl').click(); pg.wait_for_timeout(700)
    comprueba(pg.locator("#ficha .fi-apu").count() == 0,
              "lo que escribe el alumno ya no se enseña en el panel")
    comprueba(pg.evaluate("window.__DB['anna@x.com'].apuntes !== undefined"),
              "pero sus apuntes siguen guardados: solo se ha quitado de la vista")
    print("\n═══ el orden de la ficha ═══")
    bloques = [h.inner_text().strip().split("\n")[0].upper()
               for h in pg.locator("#ficha .fi-bh, #ficha .ficha-h3").all()]
    comprueba(bloques[0].startswith("PARA LA PRÓXIMA") and bloques[1].startswith("LO QUE HEMOS DADO") and
              bloques[2].startswith("PONERLE") and bloques[3].startswith("SUS DATOS"),
              "primero lo que harás, luego lo dado, luego ponerle una y al final sus datos (%s)" % bloques)
    comprueba("PAGA" not in " ".join(bloques) and "€" not in pg.locator("#ficha").inner_text(),
              "y en la ficha no hay nada de dinero")

    print("\n═══ la ficha, sobria y a un lado ═══")
    est = pg.evaluate("""() => {
        const q = s => document.querySelector(s);
        const r = e => { const c = getComputedStyle(e); return { izq: c.borderLeftWidth, rad: c.borderRadius, pos: c.position }; };
        return { ficha: r(q('#ficha')), fila: r(q('#ficha .fi-row')), poner: r(q('#ficha .fi-poner')),
                 box: q('#ficha').getBoundingClientRect().toJSON(), ancho: innerWidth };
    }""")
    comprueba(all(est[k]["izq"] in ("0px", "1px") for k in ("ficha", "fila", "poner")),
              "ni la ficha ni sus filas llevan raya de color a la izquierda (%s)" %
              [est[k]["izq"] for k in ("ficha", "fila", "poner")])
    comprueba(est["fila"]["rad"] == "6px" and est["poner"]["rad"] in ("0px", "6px"),
              "las esquinas son de 6 px (%s)" % est["fila"]["rad"])
    comprueba(est["ficha"]["pos"] == "fixed" and est["box"]["right"] >= est["ancho"] - 1 and est["box"]["left"] > 300,
              "la ficha se abre como panel a la derecha, con la lista a la vista")
    comprueba(pg.locator('tr[data-ficha="brandon@x.com"] .al-vercl').is_visible(),
              "y se puede pulsar otro alumno de la lista sin cerrarla")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    comprueba(not pg.locator("#ficha").is_visible(), "Esc la cierra")
    pg.locator('tr[data-ficha="anna@x.com"] .al-vercl').click(); pg.wait_for_timeout(700)

    print("\n═══ para la próxima clase ═══")
    ms0 = pg.evaluate("window.__DB['anna@x.com'].updatedAt.__ms")
    pg.fill("#fi-proxima", "Repasar el pluscuamperfecto\ny empezar el motor")
    pg.locator("#ficha-quien").click(); pg.wait_for_timeout(900)
    comprueba(pg.evaluate("window.__DB['anna@x.com'].paraProxima") ==
              "Repasar el pluscuamperfecto\ny empezar el motor", "al salir del cuadro se guarda en su ficha")
    comprueba("pluscuamperfecto" in pg.locator('tr[data-ficha="anna@x.com"] .al-prox-txt').inner_text(),
              "y sale en su fila de la lista")
    pg.locator("#fi-proxima").press_sequentially(" Y pedirle sus frases.")
    pg.wait_for_timeout(1900)
    comprueba(pg.evaluate("window.__DB['anna@x.com'].paraProxima").endswith("sus frases."),
              "también se guarda sola mientras escribes, sin salir del cuadro")
    comprueba(pg.evaluate("window.__DB['anna@x.com'].updatedAt.__ms") == ms0,
              "sin mover su «última actividad», que es del alumno")

    print("\n═══ lo que hemos dado: por fecha o por número ═══")
    def fechas():
        return [i.input_value() for i in pg.locator("#ficha-lista .fi-fecha").all()]
    comprueba(fechas() == [mas(4), mas(-2), mas(-7)], "de salida, por fecha y la última primero (%s)" % fechas())
    pg.select_option("#ficha-orden", "fecha-asc"); pg.wait_for_timeout(300)
    comprueba(fechas() == [mas(-7), mas(-2), mas(4)], "por fecha, la primera primero (%s)" % fechas())
    pg.select_option("#ficha-orden", "num"); pg.wait_for_timeout(300)
    numeros = [t.inner_text().strip() for t in pg.locator("#ficha-lista .fi-tit .cat-num").all()]
    comprueba(numeros == sorted(numeros) and len(numeros) == 2,
              "por número del catálogo (%s)" % numeros)
    comprueba("RÁPIDA" in pg.locator("#ficha-lista .fi-row").last.inner_text().upper(),
              "y la clase rápida, que no tiene número, va detrás")
    pg.select_option("#ficha-orden", "fecha-desc"); pg.wait_for_timeout(300)

    print("\n═══ elegir clase: lo que ya tiene va con ✓ ═══")
    con = pg.locator("#ficha-cat .fc-row.ya").count()
    comprueba(con == 2, "las dos del catálogo que ya tiene llevan ✓ (%d)" % con)
    comprueba(pg.locator('[data-anade="sobre-ti"]').count() == 1 and
              pg.locator("#ficha-cat .fc-row.ya [data-anade]").count() == 0,
              "y las que no tiene llevan su botón «Añadir», las que sí no")
    comprueba(all("✓" in n.inner_text() for n in pg.locator("#ficha-cat .fc-row.ya .cat-num").all()),
              "el ✓ va delante del número de las que ya tiene, donde se ve al recorrer la lista")
    pg.select_option("#ficha-cat-orden", "reciente"); pg.wait_for_timeout(300)
    comprueba(pg.locator("#ficha-cat .cat-num").first.inner_text().replace("✓", "").strip() == "#180",
              "el catálogo de la ficha también se ordena por fecha")
    pg.select_option("#ficha-cat-orden", "num"); pg.wait_for_timeout(300)
    pg.locator("#ficha-cerrar").click(); pg.wait_for_timeout(300)

    comprueba(pg.locator("details.deberes[open]").count() == 0 and not pg.locator("#link-url").is_visible(),
              "«Mandar deberes» está plegado hasta que lo abres")

    print("\n═══ buscar algo que no está ═══")
    pg.fill("#al-buscar", "zzzz"); pg.wait_for_timeout(500)
    comprueba(pg.locator(".al-fila").count() == 0, "no sale ninguna fila")
    comprueba("Ningún alumno" in pg.locator("#panel-loading").inner_text(), "y lo dice")
    pg.fill("#al-buscar", ""); pg.wait_for_timeout(500)
    comprueba(pg.locator(".al-fila").count() == 5, "y vuelven al borrar la búsqueda")

    print("\n═══ el catálogo ═══")
    pg.locator("#cat-toggle").click(); pg.wait_for_timeout(600)
    rotulos = [g.inner_text().split("\n")[0] for g in pg.locator(".cat-fgrupo").all()]
    comprueba(rotulos == ["NIVEL", "IDIOMA"] or rotulos == ["Nivel", "Idioma"],
              "quedan dos filtros, nivel e idioma: «para quién» fuera (%s)" % rotulos)
    comprueba(pg.locator('.cat-fbtn[data-valor=""]').count() == 0,
              "y ningún botón «todos»: sin nada pulsado están todas")
    todas = pg.locator(".cat-row").count()
    comprueba(all(t.inner_text().startswith("#") for t in pg.locator(".cat-tit").all()),
              "cada clase lleva su número delante")
    # los números no se repiten: son la referencia con la que se acuerda
    nums = pg.evaluate("(window.JN_CLASES||[]).map(c => c.num)")
    comprueba(len(nums) == len(set(nums)) and all(isinstance(n, int) and n > 0 for n in nums),
              "y no hay dos clases con el mismo (%d clases, %d números)" % (len(nums), len(set(nums))))
    pg.locator('.cat-fbtn[data-filtro="nivel"][data-valor="A1"]').click(); pg.wait_for_timeout(300)
    solo_a1 = pg.locator(".cat-row").count()
    pg.locator('.cat-fbtn[data-filtro="nivel"][data-valor="A2"]').click(); pg.wait_for_timeout(300)
    a1_y_a2 = pg.locator(".cat-row").count()
    comprueba(0 < solo_a1 < a1_y_a2 < todas,
              "A1 y A2 a la vez enseñan más que A1 sola (%d → %d de %d)" % (solo_a1, a1_y_a2, todas))
    pg.locator('.cat-fbtn[data-filtro="nivel"][data-valor="A1"]').click(); pg.wait_for_timeout(300)
    comprueba(pg.locator(".cat-row").count() == a1_y_a2 - solo_a1 + 0 or
              pg.locator(".cat-row").count() < a1_y_a2,
              "volver a pulsar A1 la quita del filtro")
    pg.locator("#cat-limpia").click(); pg.wait_for_timeout(300)
    comprueba(pg.locator(".cat-row").count() == todas, "«quitar filtros» las devuelve todas")
    pg.fill("#cat-buscar", "350"); pg.wait_for_timeout(400)
    comprueba(pg.locator(".cat-row").count() == 1 and
              pg.locator(".cat-tit").first.inner_text().startswith("#350"),
              "y se busca por número: escribes 350 y sale la 350")
    pg.fill("#cat-buscar", ""); pg.wait_for_timeout(300)
    # La centena es el nivel y la decena el sitio: así una clase nueva entra
    # en el hueco (115, 345…) sin mover ninguna otra.
    datos = pg.evaluate("(window.JN_CLASES||[]).map(c => ({n: c.num, niv: c.nivel}))")
    BANDA = {"A1": 1, "A1–A2": 2, "A2": 3, "A2–B1": 4, "B1–B2": 5, "B2": 6}
    malas = [d for d in datos if BANDA.get(d["niv"]) != d["n"] // 100]
    comprueba(not malas, "la centena de cada número es su nivel (%s)" % malas[:3])
    # La rejilla va de diez en diez, y un número que no acaba en 0 solo vale
    # si es una clase metida en un hueco: entre dos decenas que ya existen.
    # Así la #395 (la A2 tenía las nueve decenas ocupadas) es legítima y un
    # 347 puesto al azar, con la 340 libre, no lo es.
    decenas = sorted(d["n"] for d in datos if d["n"] % 10 == 0)
    metidas = [d["n"] for d in datos if d["n"] % 10]
    sueltas = [n for n in metidas
               if n % 5
               or (n // 10) * 10 not in decenas
               or ((n // 10) * 10 + 10 not in decenas
                   and ((n // 10) * 10 + 10) // 100 == n // 100)]
    comprueba(not sueltas,
              "la rejilla va de diez en diez y las metidas a mano caen en un hueco (%s)"
              % sueltas)
    nums = [d["n"] for d in datos]
    comprueba(nums == sorted(nums), "el catálogo sale ordenado por número")

    def txt_fila(num):
        return [r for r in pg.locator(".cat-row").all()
                if r.locator(".cat-num").inner_text().strip() == num][0].inner_text()
    comprueba("Última vez" in txt_fila("#510") and "Anna" in txt_fila("#510") and "2 alumnos" in txt_fila("#510"),
              "cada clase dice la última vez que se dio, a quién y a cuántos")
    comprueba("Puesta, aún sin dar" in txt_fila("#110") or "Sin dar todavía" in txt_fila("#110"),
              "y las que no se han dado lo dicen")
    pg.select_option("#cat-orden", "reciente"); pg.wait_for_timeout(300)
    primero = pg.locator(".cat-num").first.inner_text().strip()
    comprueba(primero == "#180", "por fecha, la última dada va arriba (%s)" % primero)
    pg.select_option("#cat-orden", "antigua"); pg.wait_for_timeout(300)
    filas = [r.inner_text() for r in pg.locator(".cat-row").all()]
    comprueba("Última vez" not in filas[0] and "Última vez" in filas[-1] and
              pg.locator(".cat-num").last.inner_text().strip() == "#180",
              "y al revés: las sin dar primero y la dada más recientemente al final")
    pg.select_option("#cat-orden", "num"); pg.wait_for_timeout(300)

    # y la prueba de fuego: meter una clase en el hueco no mueve a ninguna.
    # Se cuela una de mentira con el 115 y tiene que caer entre la 110 y la 120.
    pg.evaluate("""window.JN_CLASES.push({num:115, id:'__prueba', pagina:'clase-sonidos',
        nivel:'A1', perfil:'angloparlantes', pistas:['en'],
        titulo:{es:'De mentira', it:'Finta', en:'Fake'}, etiquetas:[]})""")
    pg.locator('.cat-fbtn[data-filtro="nivel"][data-valor="A1"]').click()
    pg.locator('.cat-fbtn[data-filtro="nivel"][data-valor="A1"]').click()
    pg.wait_for_timeout(400)
    orden = [t.locator(".cat-num").inner_text().strip() for t in pg.locator(".cat-tit").all()]
    comprueba(orden[:3] == ["#110", "#115", "#120"],
              "una clase nueva con el 115 entra entre la 110 y la 120, sin tocar las demás (%s)"
              % orden[:4])
    pg.evaluate("window.JN_CLASES = window.JN_CLASES.filter(c => c.id !== '__prueba')")

    # La misma materia a dos niveles no es una copia: es una base y su versión
    # a fondo. Sin decirlo, en el catálogo parecen dos clases repetidas.
    # con un número que no use nadie: era el 540 y chocó con la #540 de verdad
    pg.evaluate("""window.JN_CLASES.push({num:599, id:'__fondo', pagina:'clase-por-para',
        nivel:'B1–B2', perfil:'angloparlantes', pistas:['en'], profundiza:'por-para',
        titulo:{es:'Por y para a fondo', it:'A fondo', en:'Deep'}, etiquetas:[]})""")
    pg.locator('.cat-fbtn[data-filtro="nivel"][data-valor="A2"]').click()
    pg.locator('.cat-fbtn[data-filtro="nivel"][data-valor="A2"]').click()
    pg.wait_for_timeout(400)
    fila_base = [r for r in pg.locator(".cat-row").all()
                 if r.locator(".cat-num").inner_text().strip() == "#350"][0]
    fila_fondo = [r for r in pg.locator(".cat-row").all()
                  if r.locator(".cat-num").inner_text().strip() == "#599"][0]
    comprueba("A fondo sobre la #350" in fila_fondo.inner_text(),
              "la clase a fondo dice de cuál lo es")
    comprueba("Tiene versión a fondo: #599" in fila_base.inner_text(),
              "y la de base dice que la tiene, sin que haya que escribirlo dos veces")
    pg.evaluate("window.JN_CLASES = window.JN_CLASES.filter(c => c.id !== '__fondo')")

    # El otro lazo: «continúa», que no es lo mismo que «a fondo». La #510 no
    # es la versión profunda de la #450: es la siguiente, y sin la anterior no
    # se entiende.
    # los filtros de nivel son A1, A2, B1… no las bandas con guion, así que
    # aquí no se filtra: se buscan las dos filas entre todas
    pg.wait_for_timeout(300)
    def fila(num):
        return [r for r in pg.locator(".cat-row").all()
                if r.locator(".cat-num").inner_text().strip() == num][0]
    comprueba("Continúa la #450" in fila("#510").inner_text(),
              "la #510 dice que continúa la #450")
    comprueba("Continúa en la #510" in fila("#450").inner_text(),
              "y la #450 dice que continúa en la #510, deducido solo")
    comprueba("fondo" not in fila("#510").inner_text(),
              "y no la llama «versión a fondo», que es otra cosa")
    pg.fill("#cat-buscar", ""); pg.wait_for_timeout(300)
    pg.locator("#cat-toggle").click(); pg.wait_for_timeout(300)

    print("\n═══ el profesor no se cuela como alumno ═══")
    # Tiene ficha a propósito, para poder mirar la web como la ve un alumno.
    # Lo que no puede pasar es que la web le apunte visitas o ejercicios ahí.
    comprueba(pg.evaluate("window.__DB['%s'].visitCount === undefined" % PROF),
              "abrir el panel no le apunta ninguna visita en su ficha")

    # ── en el móvil ──
    print("\n═══ en el móvil ═══")
    c.close()
    c = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    monta(c, json.loads(json.dumps(DB)), profesor=PROF)
    c.add_init_script("localStorage.setItem('__falso_usuario','%s');" % PROF)
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    pg.goto(B + "/panel-profesor.html", wait_until="domcontentloaded")
    pg.wait_for_timeout(2600)
    ancho = lambda: pg.evaluate("document.documentElement.scrollWidth <= innerWidth")
    comprueba(ancho(), "la lista no se sale de la pantalla")
    pg.locator('tr[data-ficha="anna@x.com"] .al-vercl').click(); pg.wait_for_timeout(900)
    comprueba(ancho(), "ni la ficha abierta")
    mov = pg.evaluate("""() => {
        const h = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
        const f = s => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
        return { ficha: h('#ficha'), quitar: h('.fi-quitar'), fecha: f('.fi-fecha'), nota: f('.fi-nota'), prox: f('#fi-proxima'), ancho: innerWidth };
    }""")
    comprueba(mov["ficha"][0] == mov["ancho"], "la ficha ocupa toda la pantalla (%s)" % mov["ficha"])
    comprueba(mov["quitar"][1] >= 40, "la × de quitar una clase se puede pulsar con el dedo (%s)" % mov["quitar"])
    comprueba(min(mov["fecha"], mov["nota"], mov["prox"]) >= 16,
              "la letra de los campos es de 16 px, para que el móvil no haga zoom (%s)" % [mov["fecha"], mov["nota"], mov["prox"]])
    pg.locator("#ficha-cerrar").click(); pg.wait_for_timeout(300)
    pg.select_option("#al-orden-movil", "nombre:asc"); pg.wait_for_timeout(300)
    comprueba(pg.locator(".al-fila .al-quien b").first.inner_text() == "Anna",
              "y sin cabeceras se ordena con el desplegable")
    pg.locator('.pn-tab[data-tab="eco"]').click(); pg.wait_for_timeout(400)
    comprueba(ancho(), "ni la economía")
    c.close()

    # ── la puerta de una clase, para él ──
    # Desde la ficha abre la clase de un alumno: tiene que entrar aunque no
    # sea alumno, y sin quedar apuntado como tal.
    print("\n═══ él abre una clase ═══")
    c = br.new_context(viewport={"width": 1200, "height": 900})
    monta(c, json.loads(json.dumps(DB)), reglas=True, profesor=PROF)
    c.add_init_script("localStorage.setItem('__falso_usuario','%s');" % PROF)
    pg = c.new_page()
    pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    pg.goto(B + "/clase-motor-it.html", wait_until="domcontentloaded")
    pg.wait_for_timeout(2200)
    comprueba(pg.locator(".access-gate-modal").count() == 0,
              "la clase se le abre sin pedirle nada")
    comprueba(pg.locator("main .grammar-section").count() > 0, "y se ve el contenido")
    comprueba(pg.evaluate("localStorage.getItem('jn_student_email')") is None,
              "y no se le guarda como email de alumno")
    comprueba(pg.evaluate("window.__DB['%s'].visitCount === undefined" % PROF),
              "ni se le apunta la visita, aunque tenga ficha")

    # Y su propia página de clases. Como no se le guarda jn_student_email,
    # «Mis clases» se le quedaba vacía: se asignaba clases para probarlas y
    # le salía «entra con tu email». Ahora ve su ficha, pero sin que la
    # visita se apunte.
    pg.goto(B + "/mis-clases-es.html", wait_until="domcontentloaded")
    pg.wait_for_timeout(2200)
    comprueba(pg.locator(".cl-row").count() > 0,
              "y en «Mis clases» ve las clases que se ha puesto a sí mismo (%d)"
              % pg.locator(".cl-row").count())
    comprueba(pg.evaluate("localStorage.getItem('jn_student_email')") is None,
              "sin que eso le guarde el email de alumno")
    comprueba(pg.evaluate("window.__DB['%s'].visitCount === undefined" % PROF),
              "ni le apunte la visita")
    c.close()
    br.close()

print()
print("\n".join(err) if err else "SIN ERRORES")
sys.exit(1 if err else 0)
