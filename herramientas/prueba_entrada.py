# -*- coding: utf-8 -*-
"""Entrar con enlace por correo, y que siga funcionando con las reglas cerradas.

Se usa con el sitio servido en el 8947:
    python3 -m http.server 8947 --directory .   (en otra terminal)
    python3 herramientas/prueba_entrada.py

Comprueba lo mismo dos veces: con los permisos de Firestore abiertos (como
están hoy) y cerrados (como quedarán al publicar firestore.rules). Lo segundo
es lo que importa: que cerrar los permisos no deja a nadie fuera."""
import sys, json
sys.path.insert(0, '/home/user/profesorespanol/herramientas')
from firebase_falso import monta, hora, ENLACE_FALSO
from playwright.sync_api import sync_playwright

B = "http://localhost:8947"
PROF = "ncjosemaria@gmail.com"
err = []

DB = {
  "anna@x.com": {"email": "anna@x.com", "nombre": "Anna", "activo": True,
                 "updatedAt": hora(-1), "exerciseCount": 12,
                 "clases": [{"id": "motor", "fecha": "2026-10-25", "nota": ""}]},
  "baja@x.com": {"email": "baja@x.com", "nombre": "Marta", "activo": False},
  PROF: {"email": PROF, "nombre": "Yo", "activo": True, "updatedAt": hora(0)}
}

PAG = "/ser-estar-es.html"


def nuevo(br, reglas, track="es", ancho=1200):
    c = br.new_context(viewport={"width": ancho, "height": 900})
    monta(c, json.loads(json.dumps(DB)), reglas=reglas, profesor=PROF)
    c.add_init_script("localStorage.setItem('jn_track','%s');" % track)
    return c


def entra(pg, email, pag=PAG):
    """Todo el camino: pedir el enlace y volver por él.

    El panel tiene su propia ventanita, con otros ids que la de los alumnos."""
    es_panel = "panel" in pag
    caja = "#panel-gate-box, .panel-gate-box" if es_panel else ".access-gate-modal"
    campo = "#panel-gate-input" if es_panel else ".access-gate-input"
    boton = "#panel-gate-btn" if es_panel else ".access-gate-btn"
    pg.goto(B + pag, wait_until="domcontentloaded")
    pg.wait_for_timeout(900)
    pg.fill(campo, email)
    pg.click(boton)
    pg.wait_for_timeout(700)
    aviso = pg.locator(caja).inner_text()
    enlaces = pg.evaluate("globalThis.__ENLACES || []")
    if not enlaces:
        err.append("no se ha mandado ningún enlace a " + email)
        return aviso
    # el enlace del correo: la misma página con el código pegado
    pg.goto(B + pag + ENLACE_FALSO, wait_until="domcontentloaded")
    pg.wait_for_timeout(1800)
    return aviso


with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")

    for reglas in (False, True):
        etiqueta = "reglas cerradas" if reglas else "reglas abiertas"
        print("\n═══ %s ═══" % etiqueta)

        # ── 1. un alumno entra ──
        c = nuevo(br, reglas)
        pg = c.new_page(); pg.on("pageerror", lambda e: err.append("JS: %s" % e))
        aviso = entra(pg, "Anna@X.com")
        dentro = not pg.locator(".access-gate-overlay").count()
        print("1 · alumno:", "entra" if dentro else "NO entra")
        print("   el aviso decía:", " / ".join(aviso.split("\n")[1:3]))
        if "Mira tu correo" not in aviso:
            err.append("%s: no avisa de que mire el correo" % etiqueta)
        if not dentro:
            err.append("%s: un alumno con ficha no entra" % etiqueta)
        # el código no se queda en la barra de direcciones
        if "oobCode" in pg.url:
            err.append("%s: el código del enlace se queda en la URL" % etiqueta)
        print("   url tras entrar:", pg.url.rsplit("/", 1)[1])
        # y sigue dentro al recargar
        pg.goto(B + "/mis-clases-es.html", wait_until="domcontentloaded"); pg.wait_for_timeout(1700)
        if pg.locator(".access-gate-overlay").count():
            err.append("%s: al cambiar de página le vuelve a salir la puerta" % etiqueta)
        print("   otra página:", "sigue dentro" if not pg.locator(".access-gate-overlay").count() else "LE ECHA")
        # y puede escribir su progreso
        pg.evaluate("window.jnCloudSetFields('anna@x.com',{exerciseCount:99})")
        pg.wait_for_timeout(900)
        n = pg.evaluate("globalThis.__DB['anna@x.com'].exerciseCount")
        print("   guarda su progreso:", n)
        if n != 99:
            err.append("%s: un alumno no puede guardar su propio progreso" % etiqueta)
        # pero NO la ficha de otro
        otro = pg.evaluate("""window.jnCloudSetFields('baja@x.com',{nombre:'hackeado'})
                              .then(()=> 'ESCRIBIÓ', e => 'denegado')""")
        print("   escribir en la ficha de otro:", otro)
        if reglas and otro != "denegado":
            err.append("con reglas cerradas, un alumno puede escribir en fichas ajenas")
        c.close()

        # ── 2. un email que no es de alumno ──
        c = nuevo(br, reglas)
        pg = c.new_page(); pg.on("pageerror", lambda e: err.append("JS: %s" % e))
        entra(pg, "cualquiera@x.com")
        msg = pg.locator(".access-gate-error").inner_text().strip() if pg.locator(".access-gate-overlay").count() else ""
        print("2 · sin ficha:", msg[:52] or "¡HA ENTRADO!")
        if not pg.locator(".access-gate-overlay").count():
            err.append("%s: ha entrado alguien sin ficha" % etiqueta)
        c.close()

        # ── 3. dado de baja ──
        c = nuevo(br, reglas)
        pg = c.new_page(); pg.on("pageerror", lambda e: err.append("JS: %s" % e))
        entra(pg, "baja@x.com")
        print("3 · dado de baja:", "fuera" if pg.locator(".access-gate-overlay").count() else "¡HA ENTRADO!")
        if not pg.locator(".access-gate-overlay").count():
            err.append("%s: entra alguien dado de baja" % etiqueta)
        c.close()

        # ── 4. el panel ──
        c = nuevo(br, reglas)
        pg = c.new_page(); pg.on("pageerror", lambda e: err.append("[panel] JS: %s" % e))
        entra(pg, PROF, "/panel-profesor.html")
        pg.wait_for_timeout(1500)
        abierto = pg.locator("#panel-content").is_visible()
        filas = pg.locator("tbody tr.al-fila").count()
        print("4 · panel con el email del profesor:", "abre" if abierto else "NO abre",
              "| alumnos en la tabla:", filas)
        if not abierto: err.append("%s: el panel no abre para el profesor" % etiqueta)
        if filas < 2: err.append("%s: el panel no lee los alumnos (%d filas)" % (etiqueta, filas))
        c.close()

        # ── 5. el panel con el email de un alumno ──
        c = nuevo(br, reglas)
        pg = c.new_page(); pg.on("pageerror", lambda e: err.append("[panel2] JS: %s" % e))
        entra(pg, "anna@x.com", "/panel-profesor.html")
        pg.wait_for_timeout(1200)
        abierto = pg.locator("#panel-content").is_visible()
        texto = pg.locator("#panel-gate-texto").inner_text().strip()
        print("5 · panel con email de alumna:", "¡ABRE!" if abierto else "no abre")
        print("   dice:", texto[:62])
        if abierto: err.append("%s: el panel abre con el email de una alumna" % etiqueta)
        c.close()

    # ── 6. sin Firebase: al que ya estaba dentro no se le echa ──
    print("\n═══ sin Firebase ═══")
    c = nuevo(br, True)
    pg = c.new_page(); pg.on("pageerror", lambda e: err.append("JS: %s" % e))
    entra(pg, "anna@x.com")
    c2 = br.new_context(viewport={"width": 1200, "height": 900})
    monta(c2, json.loads(json.dumps(DB)), reglas=True, profesor=PROF)
    c2.route("**gstatic.com/firebasejs/**", lambda x: x.abort())
    c2.add_init_script("localStorage.setItem('jn_access_granted','true');"
                       "localStorage.setItem('jn_student_email','anna@x.com');")
    pg2 = c2.new_page()
    pg2.goto(B + PAG, wait_until="domcontentloaded")
    pg2.wait_for_timeout(12000)
    sigue = not pg2.locator(".access-gate-overlay").count()
    print("6 · estaba dentro y Firebase cae:", "sigue dentro" if sigue else "LE ECHA")
    if not sigue: err.append("un fallo de Firebase echa a quien ya estaba dentro")
    c2.close(); c.close()

    # ── 7. sin Firebase y de nuevas: no se le deja pasar ──
    c = br.new_context(viewport={"width": 1200, "height": 900})
    monta(c, json.loads(json.dumps(DB)), reglas=True, profesor=PROF)
    c.route("**gstatic.com/firebasejs/**", lambda x: x.abort())
    pg = c.new_page()
    pg.goto(B + PAG, wait_until="domcontentloaded")
    pg.wait_for_timeout(12000)
    msg = pg.locator(".access-gate-error").inner_text().strip()
    print("7 · de nuevas y sin Firebase:", msg[:58] or "(sin aviso)")
    if not pg.locator(".access-gate-overlay").count():
        err.append("sin Firebase y de nuevas, ha entrado igual")
    c.close()

    # ── 8. la puerta en los tres idiomas ──
    print("\n═══ idiomas ═══")
    for track, trozo in (("es", "Escribe el email"), ("it", "Scrivi l’email"), ("en", "Enter the email")):
        c = nuevo(br, True, track=track)
        pg = c.new_page()
        pg.goto(B + PAG, wait_until="domcontentloaded"); pg.wait_for_timeout(900)
        txt = pg.locator(".access-gate-modal").inner_text()
        ok = trozo in txt
        print("   %s: %s" % (track, txt.split("\n")[1][:46]))
        if not ok: err.append("la puerta no sale en %s" % track)
        c.close()

    # ── 9. el enlace abierto en otro navegador ──
    # Es el caso normal: pides el enlace en el ordenador y abres el correo en
    # el móvil. Firebase exige el email otra vez (interceptar el enlace no
    # basta). Se simula borrando el email apuntado antes de abrir el enlace.
    print("\n═══ enlace abierto en otro navegador ═══")
    for email_confirma, espera in (("anna@x.com", "entra"), ("otro@x.com", "no entra")):
        c = nuevo(br, True)
        pg = c.new_page()
        ventanitas = []
        pg.on("dialog", lambda d: (ventanitas.append(d.message), d.dismiss()))
        pg.on("pageerror", lambda e: err.append("JS: %s" % e))
        pg.goto(B + PAG, wait_until="domcontentloaded"); pg.wait_for_timeout(900)
        pg.fill(".access-gate-input", "anna@x.com")
        pg.click(".access-gate-btn"); pg.wait_for_timeout(700)
        # «otro navegador»: ya no sabemos a quién se lo mandamos
        pg.evaluate("localStorage.removeItem('jn_email_pendiente')")
        pg.goto(B + PAG + ENLACE_FALSO, wait_until="domcontentloaded")
        pg.wait_for_timeout(1800)
        if ventanitas:
            err.append("sale una ventanita del navegador: %s" % ventanitas[0][:40])
        titulo = pg.locator(".access-gate-modal h3").inner_text().strip()
        print("   pantalla al volver:", titulo)
        if "onfirma" not in titulo:
            err.append("no pide confirmar el email: %r" % titulo)
        pg.fill(".access-gate-input", email_confirma)
        pg.click(".access-gate-btn"); pg.wait_for_timeout(1800)
        dentro = not pg.locator(".access-gate-overlay").count()
        print("   confirmando con %-12s -> %s" % (email_confirma, "entra" if dentro else "no entra"))
        if (dentro and espera != "entra") or (not dentro and espera == "entra"):
            err.append("confirmando con %s: esperaba %s" % (email_confirma, espera))
        if not dentro:
            print("   dice:", pg.locator(".access-gate-error").inner_text().strip()[:54])
        if ventanitas:
            err.append("ventanita del navegador en la confirmación")
        c.close()
    br.close()

print()
print("\n".join(err) if err else "SIN ERRORES")
sys.exit(1 if err else 0)
