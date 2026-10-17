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
     ej=140, clasesDadas=16, pagado=400, pagadoAt=mas(-16)),
  al("brandon@x.com", "Brandon", "en", "A1", 0,
     [{"id": "saludos", "fecha": mas(1), "nota": ""}], ej=24),
  # sin ninguna clase futura: tiene que salir en «sin próxima clase»
  al("nora@x.com", "Nora", "en", "B1", 20, [], ej=0),
  al("viejo@x.com", "Un antiguo", "es", "B2", 120, [], ej=5, activo=False),
  # su propia ficha: está para mirar la web como la ve un alumno, no es cliente
  al(PROF, "Yo", "es", "C1", 0, [], ej=3, clasesDadas=0, pagado=0),
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

    print("\n═══ la tabla ═══")
    comprueba(pg.locator(".al-fila").count() == 5, "salen los 5 de alta y no el de baja")
    pg.locator("#al-bajas").check(); pg.wait_for_timeout(300)
    comprueba(pg.locator(".al-fila").count() == 6, "marcando «ver las bajas» sale el sexto")
    pg.locator("#al-bajas").uncheck(); pg.wait_for_timeout(300)
    cuenta = pg.locator("#al-cuenta").inner_text()
    comprueba("5 alumnos" in cuenta and "1 de baja" in cuenta,
              "el contador del final dice «5 alumnos · 1 de baja» (%s)" % cuenta[:46])
    fila = pg.locator('tr[data-ficha="anna@x.com"]')
    comprueba("25 €" in fila.inner_text(), "la tarifa media sale calculada (400 ÷ 16)")
    pie = pg.locator("#panel-table-foot").inner_text()
    comprueba(pie.count("25 €") == 2, "el pie da la tarifa media de todos y de los activos (%s)" % pie.replace("\n", " "))
    comprueba("400 €" in pie, "y lo cobrado en total")
    comprueba("Clases dadas en total" in pie and "24" in pie,
              "y el total de clases dadas, sumando también las que no se cobran (%s)" % pie.replace("\n", " ")[:70])
    comprueba("sale de 1 alumno" in pie,
              "y dice en una frase de cuántos sale, no «1 de 4» (%s)" % pie.replace("\n", " ")[:80])
    comprueba("2 no cuentan" in pie,
              "y cuántos se quedan fuera a propósito: él mismo y la que paga otra")
    # las ocho columnas: una fila de pie coja descuadra la tabla entera
    celdas = pg.evaluate("""[...document.querySelectorAll('#panel-table-foot tr')]
        .map(tr => [...tr.children].reduce((n, td) => n + (+td.colSpan || 1), 0))""")
    cols = pg.evaluate("document.querySelectorAll('thead th').length")
    comprueba(all(x == cols for x in celdas),
              "cada fila del pie suma las %d columnas de la tabla (%s)" % (cols, celdas))
    comprueba("400 €" in fila.inner_text(), "lo pagado sale en su fila")
    comprueba("ayer" in fila.inner_text(), "la última actividad se dice en días, no en fecha y hora")

    print("\n═══ a quién hace tiempo que no ves ═══")
    # de lo que viene se encarga Google Calendar: aquí no se habla de clases
    # futuras en ninguna parte
    comprueba(pg.locator(".ag-dia").count() == 0, "no queda agenda de próximas clases")
    comprueba("róxima clase" not in pg.locator("#panel-content").inner_text(),
              "y la palabra «próxima clase» no sale en todo el panel")
    chips = [b.inner_text() for b in pg.locator(".ag-chip").all()]
    comprueba(any("Nora" in t for t in chips), "Nora, que lleva 20 días sin entrar, sí sale")
    comprueba(not any("Brandon" in t for t in chips), "Brandon no, que entró hoy")
    comprueba(not any("antiguo" in t for t in chips), "el de baja tampoco sale")
    comprueba(chips and "Nora" in chips[0], "y el primero es el que lleva más tiempo")

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
    pg.select_option("#ficha-clase", "sobre-ti")
    pg.fill("#ficha-fecha", mas(3))
    pg.locator("#ficha-add").click(); pg.wait_for_timeout(900)
    guardadas = pg.evaluate("window.__DB['anna@x.com'].clases.map(c => c.id || 'rapida')")
    comprueba(len(guardadas) == antes + 1 and "sobre-ti" in guardadas,
              "la clase se guarda en su ficha de verdad (%s)" % guardadas)
    # la caja de arriba NO se mueve por esto: habla de cuándo entró él, no de
    # lo que yo le ponga. Si un día vuelve a depender de las clases, salta.
    comprueba("Anna" not in pg.locator("#panel-agenda").inner_text(),
              "ponerle una clase no la mete ni la saca de «hace tiempo que no entran»")
    comprueba("Ver sus 4 clases" in pg.locator('tr[data-ficha="anna@x.com"]').inner_text(),
              "y el botón de su fila ya dice 4")

    # quitarla otra vez
    pg.locator("#ficha-lista [data-quitar]").first.click(); pg.wait_for_timeout(900)
    comprueba(pg.evaluate("window.__DB['anna@x.com'].clases.length") == antes,
              "y se puede quitar")

    print("\n═══ lo que paga ═══")
    pg.fill("#fi-clases-dadas", "10")
    pg.fill("#fi-pagado", "505")
    pg.locator("#fi-cobro-hoy").click(); pg.wait_for_timeout(900)
    d = pg.evaluate("({t: window.__DB['anna@x.com'].clasesDadas, p: window.__DB['anna@x.com'].pagado,"
                    " f: window.__DB['anna@x.com'].pagadoAt})")
    comprueba(d["t"] == 10 and d["p"] == 505, "se guarda tal cual se escribe (%s)" % d)
    comprueba(d["f"] == HOY, "«Actualizar a hoy» deja la fecha de hoy y nada más (%s)" % d["f"])
    comprueba("505 €" in pg.locator('tr[data-ficha="anna@x.com"]').inner_text(),
              "y la tabla lo enseña al momento")
    comprueba("50,50 €" in pg.locator('tr[data-ficha="anna@x.com"]').inner_text(),
              "y la tarifa se recalcula sola, con la coma decimal española (505 ÷ 10)")
    # vaciarlo tiene que borrarlo, no dejar un 0
    pg.fill("#fi-clases-dadas", "")
    pg.locator("#fi-pagado").click(); pg.wait_for_timeout(900)
    comprueba(pg.evaluate("window.__DB['anna@x.com'].clasesDadas") is None,
              "vaciar las clases dadas las deja vacía, no en cero")

    print("\n═══ quién cuenta para el dinero ═══")
    # Sabrina da 8 clases y paga 0 porque paga otra: si contara, la media se
    # hundiría. Y la ficha del propio profesor tampoco es un cliente.
    fila_sab = pg.locator('tr[data-ficha="sabrina@x.com"]').inner_text()
    comprueba("no cuenta" in fila_sab, "la que paga otra persona sale marcada «no cuenta»")
    comprueba("no cuenta" in pg.locator('tr[data-ficha="%s"]' % PROF).inner_text(),
              "y la ficha del propio profesor, también, sin tocar nada")
    media_con = pg.locator("#panel-table-foot").inner_text()
    pg.locator('tr[data-ficha="sabrina@x.com"] .al-vercl').click(); pg.wait_for_timeout(700)
    comprueba(pg.locator("#fi-sincobro").is_checked(), "su casilla sale marcada en la ficha")
    pg.locator("#fi-sincobro").uncheck(); pg.wait_for_timeout(900)
    comprueba(pg.evaluate("window.__DB['sabrina@x.com'].sinCobro") is False,
              "desmarcarla se guarda")
    comprueba(pg.locator("#panel-table-foot").inner_text() != media_con,
              "y entonces sí entra en la media, que cambia")
    comprueba("1 no cuenta" in pg.locator("#panel-table-foot").inner_text(),
              "y ya solo queda uno fuera")
    pg.locator("#fi-sincobro").check(); pg.wait_for_timeout(900)
    comprueba(pg.locator("#panel-table-foot").inner_text() == media_con,
              "y volver a marcarla la deja como estaba")
    pg.locator("#ficha-cerrar").click(); pg.wait_for_timeout(300)

    print("\n═══ buscar algo que no está ═══")
    pg.fill("#al-buscar", "zzzz"); pg.wait_for_timeout(500)
    comprueba(pg.locator(".al-fila").count() == 0, "no sale ninguna fila")
    comprueba(pg.locator("#panel-table-foot").inner_text().strip() == "",
              "y el pie se queda vacío: unos totales debajo de una tabla sin filas no se entienden")
    pg.fill("#al-buscar", ""); pg.wait_for_timeout(500)
    comprueba("€" in pg.locator("#panel-table-foot").inner_text(), "y vuelven al borrar la búsqueda")

    print("\n═══ el profesor no se cuela como alumno ═══")
    # Tiene ficha a propósito, para poder mirar la web como la ve un alumno.
    # Lo que no puede pasar es que la web le apunte visitas o ejercicios ahí.
    comprueba(pg.evaluate("window.__DB['%s'].visitCount === undefined" % PROF),
              "abrir el panel no le apunta ninguna visita en su ficha")

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
    c.close()
    br.close()

print()
print("\n".join(err) if err else "SIN ERRORES")
sys.exit(1 if err else 0)
