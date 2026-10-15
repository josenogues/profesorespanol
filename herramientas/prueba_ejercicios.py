# -*- coding: utf-8 -*-
"""Que los ejercicios de las clases funcionen: uno por uno.

Se usa con el sitio servido en el 8947:
    python3 -m http.server 8947 --directory .   (en otra terminal)
    python3 herramientas/prueba_ejercicios.py

Al añadir ejercicios a una clase nueva, se apuntan aquí sus respuestas
buenas (BIEN) y una mala (MAL). Las respuestas se escriben a mano a
propósito: si se leyeran de la página, la prueba no comprobaría nada.

Para cada clase: se responde bien a los doce y se comprueba que los doce se
dan por buenos, que el contador sube de cero a doce en directo, que el botón
lleva al hub del idioma que toca, y que una respuesta mala avisa en vez de
pasar por alto.
"""
import sys
sys.path.insert(0, '/home/user/profesorespanol/herramientas')
from firebase_falso import monta, hora
from playwright.sync_api import sync_playwright

B = "http://localhost:8947"
err = []
DB = {"anna@x.com": {"email": "anna@x.com", "activo": True, "updatedAt": hora(-1)}}

# la respuesta correcta de cada ejercicio, escrita aquí aparte a propósito:
# si se copiara de la página, la prueba no comprobaría nada
BIEN = {
 'clase-gustar-en.html': {"g1":"Me","g2":"gustan","g3":"gusta","g4":"le","g5":"apetece",
   "g6":"duele","g7":"duelen","g8":"faltan","g9":"también","g10":"tampoco","g11":"sí",
   "g12":"Me encanta Madrid"},
 'clase-to-be-en.html': {"tb1":"Soy","tb2":"Estoy","tb3":"es","tb4":"estoy","tb5":"es",
   "tb6":"son","tb7":"Hay","tb8":"está","tb9":"está","tb10":"Hay","tb11":"está",
   "tb12":"hay dos libros"},
 'clase-frio-en.html': {"fr1":"Tengo","fr2":"hace","fr3":"está","fr4":"tengo","fr5":"está",
   "fr6":"Hace","fr7":"sed","fr8":"mucho","fr9":"calor","fr10":"tienes",
   "fr11":"tengo treinta años","fr12":"hace frío hoy"},
 'clase-sin-do-en.html': {"sd1":"¿Hablas español?","sd2":"no","sd3":"Dónde","sd4":"qué",
   "sd5":"¿no?","sd6":"tienes un coche","sd7":"nada","sd8":"nada","sd9":"Nadie",
   "sd10":"nunca","sd11":"digo","sd12":"no quiero nada"},
 'clase-bando-en.html': {"ba1":"la","ba2":"el","ba3":"el","ba4":"la","ba5":"el","ba6":"la",
   "ba7":"blanca","ba8":"alta","ba9":"rojos","ba10":"los","ba11":"ciudades",
   "ba12":"los coches rojos"},
 'clase-menos-piezas-en.html': {"mp1":"Trabajo en Madrid","mp2":"Vive aquí","mp3":"tienes",
   "mp4":"trabajamos","mp5":"hablan","mp6":"Ella vive aquí","mp7":"Yo voy, tú te quedas",
   "mp8":"yo","mp9":"el","mp10":"Vivo en Madrid","mp11":"Como con Ana el viernes",
   "mp12":"vivo en Madrid"},
 'clase-dos-sentidos-en.html': {"ds1":"Es","ds2":"Está","ds3":"Es","ds4":"Está","ds5":"Está",
   "ds6":"Es","ds7":"Está","ds8":"Está","ds9":"Está","ds10":"Es","ds11":"Está",
   "ds12":"la sopa esta rica"},
 'clase-dos-verbos-en.html': {"dv1":"Sé","dv2":"conozco","dv3":"Pregunté","dv4":"Pedí",
   "dv5":"Llevo","dv6":"¡Voy!","dv7":"hora","dv8":"tiempo","dv9":"vez","dv10":"Juego",
   "dv11":"funciona","dv12":"deje las llaves en casa"},
 'clase-falsos-amigos-en.html': {"fa1":"avergonzada","fa2":"pregnant","fa3":"constipado",
   "fa4":"emocionado","fa5":"molestarte","fa6":"estoy embarazada","fa7":"success",
   "fa8":"salida","fa9":"currently","fa10":"sensible","fa11":"sensato","fa12":"soporto"},
 'clase-seis-formas-es.html': {"sf1":"hemos hablado","sf2":"hablando","sf3":"hablar","sf4":"comido","sf5":"comiendo","sf6":"han","sf7":"Vivo en Madrid","sf8":"hablare","sf9":"vamos","sf10":"participio","sf11":"hable","sf12":"estamos comiendo"},
 'clase-seis-formas-it.html': {"sf1":"hemos hablado","sf2":"hablando","sf3":"hablar","sf4":"comido","sf5":"comiendo","sf6":"han","sf7":"Vivo en Madrid","sf8":"hablare","sf9":"vamos","sf10":"participio","sf11":"hable","sf12":"estamos comiendo"},
 'clase-seis-formas-en.html': {"sf1":"hemos hablado","sf2":"hablando","sf3":"hablar","sf4":"comido","sf5":"comiendo","sf6":"han","sf7":"Vivo en Madrid","sf8":"hablare","sf9":"vamos","sf10":"participio","sf11":"hable","sf12":"estamos comiendo"},
 'clase-tres-pasados-es.html': {"tp1":"llovía","tp2":"Sonó","tp3":"comía","tp4":"comí","tp5":"vivia","tp6":"hablaba","tp7":"he comido","tp8":"Has estado","tp9":"he visto","tp10":"comi","tp11":"he vivido","tp12":"anoche llovia"},
 'clase-tres-pasados-it.html': {"tp1":"llovía","tp2":"Sonó","tp3":"comía","tp4":"comí","tp5":"vivia","tp6":"hablaba","tp7":"he comido","tp8":"Has estado","tp9":"he visto","tp10":"comi","tp11":"he vivido","tp12":"anoche llovia"},
 'clase-tres-pasados-en.html': {"tp1":"llovía","tp2":"Sonó","tp3":"comía","tp4":"comí","tp5":"vivia","tp6":"hablaba","tp7":"he comido","tp8":"Has estado","tp9":"he visto","tp10":"comi","tp11":"he vivido","tp12":"anoche llovia"},
 'clase-formas-pasado-es.html': {"fp1":"hable","fp2":"comio","fp3":"vivieron","fp4":"hablaste","fp5":"vivido","fp6":"habeis","fp7":"abierto","fp8":"hecho","fp9":"puesto","fp10":"escrito","fp11":"vuelto","fp12":"he roto el vaso"},
 'clase-formas-pasado-it.html': {"fp1":"hable","fp2":"comio","fp3":"vivieron","fp4":"hablaste","fp5":"vivido","fp6":"habeis","fp7":"abierto","fp8":"hecho","fp9":"puesto","fp10":"escrito","fp11":"vuelto","fp12":"he roto el vaso"},
 'clase-formas-pasado-en.html': {"fp1":"hable","fp2":"comio","fp3":"vivieron","fp4":"hablaste","fp5":"vivido","fp6":"habeis","fp7":"abierto","fp8":"hecho","fp9":"puesto","fp10":"escrito","fp11":"vuelto","fp12":"he roto el vaso"},
}

# una respuesta mala por clase, para comprobar que no cuela
MAL = {'clase-gustar-en.html': ("g2", "gusta"),
       'clase-to-be-en.html': ("tb1", "Estoy"),
       'clase-frio-en.html': ("fr1", "Soy"),
       'clase-sin-do-en.html': ("sd3", "Qué"),
       'clase-bando-en.html': ("ba2", "la"),
       'clase-menos-piezas-en.html': ("mp1", "Yo trabajo en Madrid"),
       'clase-dos-sentidos-en.html': ("ds2", "Es"),
       'clase-dos-verbos-en.html': ("dv6", "¡Vengo!"),
       'clase-falsos-amigos-en.html': ("fa1", "embarazada"),
       'clase-seis-formas-es.html': ("sf3", "hablando"),
       'clase-seis-formas-it.html': ("sf3", "hablando"),
       'clase-seis-formas-en.html': ("sf3", "hablando"),
       'clase-tres-pasados-es.html': ("tp2", "Sonaba"),
       'clase-tres-pasados-it.html': ("tp2", "Sonaba"),
       'clase-tres-pasados-en.html': ("tp2", "Sonaba"),
       'clase-formas-pasado-es.html': ("fp7", "abrido"),
       'clase-formas-pasado-it.html': ("fp7", "abrido"),
       'clase-formas-pasado-en.html': ("fp7", "abrido")}

SIEMBRA = ("localStorage.setItem('__falso_usuario','anna@x.com');"
           "localStorage.setItem('jn_access_granted','true');"
           "localStorage.setItem('jn_student_email','anna@x.com');"
           "localStorage.setItem('jn_track','en');")


def responde(pg, exid, resp):
    b = pg.locator('[data-exid="%s"]' % exid)
    if not b.count():
        return None
    if b.locator(".option-btn").count():
        bot = b.locator('.option-btn[data-value="%s"]' % resp)
        if not bot.count():
            return 'no existe esa opción'
        bot.click()
    else:
        b.locator(".exercise-input").fill(resp)
        b.locator(".exercise-check").click()
    pg.wait_for_timeout(120)
    # OJO: «incorrect» contiene «correct», así que buscar la subcadena daba
    # por bueno todo, se acertara o se fallara. Hay que mirar la clase
    # entera, no un trozo de ella.
    clases = (b.locator(".exercise-feedback").get_attribute("class") or "").split()
    if "correct" in clases:
        return True
    if "incorrect" in clases:
        return False
    return "el motor no ha contestado"


with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    for pag, respuestas in BIEN.items():
        c = br.new_context(viewport={"width": 1280, "height": 900})
        monta(c, DB)
        pista = pag[-7:-5] if pag[-7:-5] in ('es', 'it', 'en') else 'en'
        c.add_init_script(SIEMBRA.replace("'jn_track','en'", "'jn_track','" + pista + "'"))
        pg = c.new_page()
        pg.on("pageerror", lambda e, q=pag: err.append("[%s] JS: %s" % (q, e)))
        pg.goto(B + "/" + pag, wait_until="domcontentloaded")
        pg.wait_for_timeout(1500)

        n = pg.locator(".exercise-block").count()
        fallos = []
        for exid, resp in respuestas.items():
            r = responde(pg, exid, resp)
            if r is None:
                fallos.append(exid + ' (no está)')
            elif r is not True:
                fallos.append('%s=%s%s' % (exid, resp, '' if r is False else ' · ' + r))

        cuenta = pg.evaluate("window.jnGetExerciseCount()")
        racha = pg.locator(".jn-racha")
        boton = racha.locator("a.button")
        destino = boton.get_attribute("href") if boton.count() else '(sin botón)'

        print("%-26s %2d ejercicios · contador %2d · botón → %s %s"
              % (pag.replace('clase-', '').replace('-en.html', ''), n, cuenta, destino,
                 '' if not fallos else '  ✗ ' + ', '.join(fallos)))
        if n != 12: err.append("%s: %d ejercicios, esperaba 12" % (pag, n))
        if fallos: err.append("%s: respuestas buenas dadas por malas: %s" % (pag, fallos))
        if cuenta != 12: err.append("%s: el contador marca %s" % (pag, cuenta))
        # el botón lleva al hub del idioma de la página, no siempre al inglés
        if destino != 'ejercicios-%s.html' % pista:
            err.append("%s: el botón va a %s y debería ir al hub en %s" % (pag, destino, pista))

        # y que una mala no cuele
        pg.reload(); pg.wait_for_timeout(1300)
        exid, mala = MAL[pag]
        r = responde(pg, exid, mala)
        if r is not False:
            err.append("%s: %s=%s se da por buena y no lo es" % (pag, exid, mala))
        c.close()
    br.close()

print()
print("\n".join(err) if err else "SIN ERRORES — %d respuestas buenas aceptadas, %d malas rechazadas"
      % (sum(len(v) for v in BIEN.values()), len(MAL)))
sys.exit(1 if err else 0)
