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

    print("\n═══ la tabla y sus filtros ═══")
    comprueba(pg.locator(".al-fila").count() == 5, "de salida salen los 5 de alta y no el de baja")
    pg.locator('.al-fbtn[data-f="estado"][data-v="baja"]').click(); pg.wait_for_timeout(350)
    comprueba([r.locator(".al-quien b").inner_text() for r in pg.locator(".al-fila").all()] == ["Un antiguo"],
              "el filtro de bajas enseña solo al de baja")
    pg.locator('.al-fbtn[data-f="estado"][data-v=""]').click(); pg.wait_for_timeout(350)
    comprueba(pg.locator(".al-fila").count() == 6, "y «todos» los enseña a los seis")
    pg.locator('.al-fbtn[data-f="estado"][data-v="alta"]').click(); pg.wait_for_timeout(350)

    fila = pg.locator('tr[data-ficha="anna@x.com"]')
    comprueba("25 €" in fila.inner_text(), "la tarifa media sale calculada (400 ÷ 16)")
    comprueba("400 €" in fila.inner_text(), "lo pagado sale en su fila")
    comprueba("ayer" in fila.inner_text(), "la última actividad se dice en días, no en fecha y hora")

    print("\n═══ los números de arriba ═══")
    kpis = pg.locator("#panel-kpis").inner_text()
    comprueba("Alumnos de alta" in kpis and "5" in kpis, "cuántos hay de alta")
    comprueba("400 €" in kpis and "Cobrado en total" in kpis, "lo cobrado")
    comprueba("Tarifa media ahora" in kpis and "Tarifa media histórica" in kpis,
              "las dos tarifas medias, cada una en su tarjeta")
    comprueba("Clases dadas en total" in kpis and "24" in kpis,
              "y el total de clases dadas, también las que no se cobran")
    comprueba("El que más ha pagado" in kpis and "Anna" in kpis, "quién paga más")
    comprueba("El de más clases" in kpis, "y quién tiene más clases dadas")
    comprueba(pg.locator("#panel-table-foot").count() == 0,
              "y no queda pie de tabla: los números están arriba")

    print("\n═══ ordenar pulsando la cabecera ═══")
    def columna(n):
        return [td.inner_text().split("\n")[0] for td in pg.locator('.al-fila td:nth-child(%d)' % n).all()]
    pg.locator('th[data-col="dadas"]').click(); pg.wait_for_timeout(350)
    abajo = [x for x in columna(4) if x != "—"]
    comprueba(abajo == sorted(abajo, key=int, reverse=True),
              "un clic ordena de más a menos (%s)" % abajo)
    pg.locator('th[data-col="dadas"]').click(); pg.wait_for_timeout(350)
    arriba = [x for x in columna(4) if x != "—"]
    comprueba(arriba == sorted(arriba, key=int),
              "y el segundo, de menos a más (%s)" % arriba)
    comprueba(pg.evaluate("document.querySelector('th.al-orden.on').dataset.col") == "dadas",
              "la flecha se queda en la columna por la que ordena")
    pg.locator('th[data-col="nombre"]').click(); pg.wait_for_timeout(350)
    nombres = [r.locator(".al-quien b").inner_text() for r in pg.locator(".al-fila").all()]
    comprueba(nombres == sorted(nombres, key=str.lower),
              "los nombres empiezan por la A, no por lo más alto (%s)" % nombres[:3])

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
    comprueba("no cuenta" in pg.locator('tr[data-ficha="sabrina@x.com"]').inner_text(),
              "la que paga otra persona sale marcada «no cuenta»")
    comprueba("no cuenta" in pg.locator('tr[data-ficha="%s"]' % PROF).inner_text(),
              "y la ficha del propio profesor, también, sin tocar nada")
    kpis_con = pg.locator("#panel-kpis").inner_text()
    pg.locator('tr[data-ficha="sabrina@x.com"] .al-vercl').click(); pg.wait_for_timeout(700)
    comprueba(pg.locator("#fi-sincobro").is_checked(), "su casilla sale marcada en la ficha")
    pg.locator("#fi-sincobro").uncheck(); pg.wait_for_timeout(900)
    comprueba(pg.evaluate("window.__DB['sabrina@x.com'].sinCobro") is False, "desmarcarla se guarda")
    comprueba(pg.locator("#panel-kpis").inner_text() != kpis_con,
              "y entonces sí entra en la media, que cambia")
    pg.locator("#fi-sincobro").check(); pg.wait_for_timeout(900)
    comprueba(pg.locator("#panel-kpis").inner_text() == kpis_con,
              "y volver a marcarla lo deja como estaba")
    pg.locator("#ficha-cerrar").click(); pg.wait_for_timeout(300)

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
    bloques = [h.inner_text().strip().split("\n")[0]
               for h in pg.locator("#ficha .fi-bh, #ficha .ficha-h3").all()]
    comprueba(bloques[0].startswith("SUS DATOS") and "PAGA" in bloques[1] and "PONERLE" in bloques[2],
              "sus datos, lo que paga, y las clases al final (%s)" % bloques)
    pg.locator("#ficha-cerrar").click(); pg.wait_for_timeout(300)

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
    comprueba(all(d["n"] % 10 == 0 for d in datos),
              "y todas acaban en 0, dejando nueve huecos entre cada dos")
    nums = [d["n"] for d in datos]
    comprueba(nums == sorted(nums), "el catálogo sale ordenado por número")
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
    pg.evaluate("""window.JN_CLASES.push({num:540, id:'__fondo', pagina:'clase-por-para',
        nivel:'B1–B2', perfil:'angloparlantes', pistas:['en'], profundiza:'por-para',
        titulo:{es:'Por y para a fondo', it:'A fondo', en:'Deep'}, etiquetas:[]})""")
    pg.locator('.cat-fbtn[data-filtro="nivel"][data-valor="A2"]').click()
    pg.locator('.cat-fbtn[data-filtro="nivel"][data-valor="A2"]').click()
    pg.wait_for_timeout(400)
    fila_base = [r for r in pg.locator(".cat-row").all()
                 if r.locator(".cat-num").inner_text().strip() == "#350"][0]
    fila_fondo = [r for r in pg.locator(".cat-row").all()
                  if r.locator(".cat-num").inner_text().strip() == "#540"][0]
    comprueba("A fondo sobre la #350" in fila_fondo.inner_text(),
              "la clase a fondo dice de cuál lo es")
    comprueba("Tiene versión a fondo: #540" in fila_base.inner_text(),
              "y la de base dice que la tiene, sin que haya que escribirlo dos veces")
    pg.evaluate("window.JN_CLASES = window.JN_CLASES.filter(c => c.id !== '__fondo')")
    pg.fill("#cat-buscar", ""); pg.wait_for_timeout(300)
    pg.locator("#cat-toggle").click(); pg.wait_for_timeout(300)

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
