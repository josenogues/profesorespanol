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
 'clase-marcadores-en.html': {"mk1":"hace tres días","mk2":"anteayer","mk3":"anoche",
   "mk4":"de vez en cuando","mk5":"Currently","mk6":"era","mk7":"pasado",
   "mk8":"dentro de tres días","mk9":"hace tres días","mk10":"viene","mk11":"algun",
   "mk12":"voy manana","mk13":"pero","mk14":"así que","mk15":"Como","mk16":"embargo",
   "mk17":"luego","mk18":"resumen"},
 'clase-presente-en.html': {"pr1":"hablo","pr2":"comemos","pr3":"vivimos","pr4":"trabajan",
   "pr5":"bebes","pr6":"escribe","pr7":"hago","pr8":"salgo","pr9":"puedo","pr10":"queremos",
   "pr11":"tengo","pr12":"salgo los viernes"},
 'clase-costumbre-en.html': {"co1":"suelo","co2":"Solemos","co3":"comer","co4":"vamos",
   "co5":"suelen","co6":"Voy a comiendo","co7":"tengo","co8":"tienes","co9":"Hay",
   "co10":"hayo que","co11":"Mañana voy a trabajar","co12":"suelo trabajar desde casa"},
 'clase-motor-es.html': {"mo1":"estaba","mo2":"habia","mo3":"iba","mo4":"gerundio","mo5":"estuve","mo6":"estare","mo7":"habia","mo8":"participio","mo9":"infinitivo","mo10":"iba","mo11":"estaria","mo12":"habia comido"},
 'clase-motor-it.html': {"mo1":"estaba","mo2":"habia","mo3":"iba","mo4":"gerundio","mo5":"estuve","mo6":"estare","mo7":"habia","mo8":"participio","mo9":"infinitivo","mo10":"iba","mo11":"estaria","mo12":"habia comido"},
 'clase-motor-en.html': {"mo1":"estaba","mo2":"habia","mo3":"iba","mo4":"gerundio","mo5":"estuve","mo6":"estare","mo7":"habia","mo8":"participio","mo9":"infinitivo","mo10":"iba","mo11":"estaria","mo12":"habia comido"},
 'clase-llamada-es.html': {"ll1":"Logística, dígame.","ll2":"parte","ll3":"por","ll4":"Ahora mismo le paso.","ll5":"cuelgue","ll6":"encuentra","ll7":"recado","ll8":"repetir","ll9":"deletrea","ll10":"disculpe","ll11":"quedamos","ll12":"de parte de quien"},
 'clase-llamada-it.html': {"ll1":"Logística, dígame.","ll2":"parte","ll3":"por","ll4":"Ahora mismo le paso.","ll5":"cuelgue","ll6":"encuentra","ll7":"recado","ll8":"repetir","ll9":"deletrea","ll10":"disculpe","ll11":"quedamos","ll12":"de parte de quien"},
 'clase-llamada-en.html': {"ll1":"Logística, dígame.","ll2":"parte","ll3":"por","ll4":"Ahora mismo le paso.","ll5":"cuelgue","ll6":"encuentra","ll7":"recado","ll8":"repetir","ll9":"deletrea","ll10":"disculpe","ll11":"quedamos","ll12":"de parte de quien"},
 'clase-suavizar-es.html': {"su1":"¿Podría mandarme el albarán?","su2":"podria","su3":"quería","su4":"seria","su5":"venia","su6":"subjuntivo","su7":"mandara","su8":"acuerdo","su9":"Eso está mal.","su10":"sea","su11":"perdone","su12":"podria ayudarme"},
 'clase-suavizar-it.html': {"su1":"¿Podría mandarme el albarán?","su2":"podria","su3":"quería","su4":"seria","su5":"venia","su6":"subjuntivo","su7":"mandara","su8":"acuerdo","su9":"Eso está mal.","su10":"sea","su11":"perdone","su12":"podria ayudarme"},
 'clase-suavizar-en.html': {"su1":"¿Podría mandarme el albarán?","su2":"podria","su3":"quería","su4":"seria","su5":"venia","su6":"subjuntivo","su7":"mandara","su8":"acuerdo","su9":"Eso está mal.","su10":"sea","su11":"perdone","su12":"podria ayudarme"},
 'clase-reunion-es.html': {"re1":"parece","re2":"puntos","re3":"interrumpa","re4":"subjuntivo","re5":"pasamos","re6":"Puedo","re7":"vista","re8":"veo","re9":"en","re10":"haces","re11":"quedamos","re12":"perdona que te interrumpa"},
 'clase-reunion-it.html': {"re1":"parece","re2":"puntos","re3":"interrumpa","re4":"subjuntivo","re5":"pasamos","re6":"Puedo","re7":"vista","re8":"veo","re9":"en","re10":"haces","re11":"quedamos","re12":"perdona que te interrumpa"},
 'clase-reunion-en.html': {"re1":"parece","re2":"puntos","re3":"interrumpa","re4":"subjuntivo","re5":"pasamos","re6":"Puedo","re7":"vista","re8":"veo","re9":"en","re10":"haces","re11":"quedamos","re12":"perdona que te interrumpa"},
 'clase-italiano-trabajo-it.html': {"it1":"¿Diga?","it2":"¿De parte de quién?","it3":"No cuelgue.","it4":"No le oigo.","it5":"Le vuelvo a llamar.","it6":"recado","it7":"Tienes el micro silenciado.","it8":"Comparto pantalla.","it9":"Ya hablamos.","it10":"Se ha cortado.","it11":"oyes","it12":"pasa"},
 'clase-saludos-en.html': {"sa1":"Buenos días","sa2":"Buenas tardes","sa3":"estás",
   "sa4":"está","sa5":"te","sa6":"tu","sa7":"me","sa8":"de","sa9":"Encantado",
   "sa10":"Encantada","sa11":"Hasta luego","sa12":"encantado"},
 'clase-sobre-ti-en.html': {"tm1":"me","tm2":"de","tm3":"vivo","tm4":"Soy ingeniero",
   "tm5":"Tengo treinta años","tm6":"en","tm7":"Estoy","tm8":"tengo","tm9":"No tengo",
   "tm10":"Por","tm11":"de","tm12":"Vivo en Madrid"},
 'clase-sonidos-en.html': {"fo1":"one short o, no slide","fo2":"is silent","fo3":"sounds",
   "fo4":"h","fo5":"exactly the same","fo6":"the th in «think»",
   "fo7":"the j in «jamón»","fo8":"u","fo9":"perro","fo10":"the strong rolled r",
   "fo11":"three different words","fo12":"caro"},
 'clase-futuro-en.html': {"fu1":"hablaré","fu2":"comeremos","fu3":"vivirán",
   "fu4":"hablaremos","fu5":"comer","fu6":"Hablaré","fu7":"Te llamaré mañana, te lo prometo",
   "fu8":"tendré","fu9":"haré","fu10":"the stem — the endings stay",
   "fu11":"It must be about three","fu12":"llamaré"},
 'clase-por-para-en.html': {"pp1":"para","pp2":"por","pp3":"para","pp4":"por","pp5":"para",
   "pp6":"por","pp7":"por","pp8":"para","pp9":"por","pp10":"para","pp11":"para ti","pp12":"por"},
 'clase-la-a-en.html': {"pa1":"a","pa2":"—","pa3":"a","pa4":"lo tengo","pa5":"la","pa6":"las",
   "pa7":"le","pa8":"les","pa9":"se lo","pa10":"se lo doy","pa11":"cómpralas","pa12":"a"},
 'clase-would-en.html': {"wc1":"hablaría","wc2":"comeríamos","wc3":"tendría","wc4":"comer",
   "wc5":"Podría","wc6":"podía","wc7":"deberías","wc8":"gustaría","wc9":"iba","wc10":"iría",
   "wc11":"Quería un café","wc12":"podrías"},
 'clase-falsos-amigos-it.html': {"fi1":"mantequilla","fi2":"Aceite","fi3":"pierna",
   "fi4":"Subo","fi5":"todavía","fi6":"equipaje","fi7":"Mira","fi8":"espero",
   "fi9":"sufrido","fi10":"quita","fi11":"La","fi12":"el"},
 'clase-essere-it.html': {"se1":"Estoy","se2":"Soy","se3":"está","se4":"Estoy",
   "se5":"estás","se6":"está","se7":"es","se8":"Estoy","se9":"está","se10":"es",
   "se11":"son","se12":"soy"},
 'clase-avere-it.html': {"av1":"Tengo","av2":"He","av3":"He","av4":"he","av5":"hay",
   "av6":"hemos","av7":"Hay","av8":"Tengo","av9":"tengo","av10":"tengo","av11":"ha",
   "av12":"he"},
 'clase-suoni-it.html': {"so1":"la jota","so2":"è muta","so3":"si sente",
   "so4":"il th inglese","so5":"cuatro","so6":"j","so7":"profesor","so8":"atención",
   "so9":"ciudad","so10":"libertad","so11":"acción","so12":"teléfono"},
 'clase-piccole-it.html': {"pi1":"Muy","pi2":"Mucho","pi3":"mucho","pi4":"en","pi5":"a",
   "pi6":"desde","pi7":"también","pi8":"tampoco","pi9":"Todavía","pi10":"Ya","pi11":"en",
   "pi12":"con","pi13":"para","pi14":"por"},
 'clase-verbi-it.html': {"ve1":"Pido","ve2":"Pregunto","ve3":"preguntó","ve4":"traes",
   "ve5":"llevo","ve6":"llevo","ve7":"Tomo","ve8":"Coge","ve9":"puso","ve10":"hizo",
   "ve11":"volvió","ve12":"pidió"},
 'clase-desinenze-it.html': {"de1":"hablamos","de2":"coméis","de3":"vivimos",
   "de4":"hablan","de5":"hablaba","de6":"vivíamos","de7":"hablé","de8":"comió",
   "de9":"fui","de10":"hablaré","de11":"viviríamos","de12":"comerían"},
 'clase-rompe-it.html': {"ro1":"puedo","ro2":"podemos","ro3":"pienso","ro4":"pensamos",
   "ro5":"duermen","ro6":"juego","ro7":"debo","ro8":"pido","ro9":"repite",
   "ro10":"queréis","ro11":"empieza","ro12":"durmiendo"},
 'clase-yo-it.html': {"yo1":"hago","yo2":"sale","yo3":"pongo","yo4":"conozco",
   "yo5":"conduzco","yo6":"sé","yo7":"tendré","yo8":"saldremos","yo9":"haría",
   "yo10":"diría","yo11":"pondría","yo12":"ponga"},
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
       'clase-formas-pasado-en.html': ("fp7", "abrido"),
       'clase-marcadores-en.html': ("mk1", "tres días hace"),
       'clase-presente-en.html': ("pr9", "podo"),
       'clase-costumbre-en.html': ("co2", "Suelemos"),
       'clase-motor-es.html': ("mo1", "estuve"),
       'clase-motor-it.html': ("mo1", "estuve"),
       'clase-motor-en.html': ("mo1", "estuve"),
       'clase-llamada-es.html': ("ll8", "colgar"),
       'clase-llamada-it.html': ("ll8", "colgar"),
       'clase-llamada-en.html': ("ll8", "colgar"),
       'clase-suavizar-es.html': ("su3", "quiero"),
       'clase-suavizar-it.html': ("su3", "quiero"),
       'clase-suavizar-en.html': ("su3", "quiero"),
       'clase-reunion-es.html': ("re3", "interrumpo"),
       'clase-reunion-it.html': ("re3", "interrumpo"),
       'clase-reunion-en.html': ("re3", "interrumpo"),
       'clase-italiano-trabajo-it.html': ("it2", "¿Quién habla?"),
       'clase-saludos-en.html': ("sa11", "Adiós"),
       'clase-sobre-ti-en.html': ("tm4", "Soy un ingeniero"),
       'clase-sonidos-en.html': ("fo9", "pero"),
       'clase-futuro-en.html': ("fu7", "Mañana como con mi madre"),
       'clase-por-para-en.html': ("pp1", "por"),
       'clase-la-a-en.html': ("pa2", "a"),
       'clase-would-en.html': ("wc6", "podría"),
       'clase-falsos-amigos-it.html': ("fi1", "burro"),
       'clase-essere-it.html': ("se1", "Soy"),
       'clase-avere-it.html': ("av2", "Tengo"),
       'clase-suoni-it.html': ("so2", "si sente"),
       'clase-piccole-it.html': ("pi2", "Muy"),
       'clase-verbi-it.html': ("ve2", "Pido"),
       'clase-desinenze-it.html': ("de10", "hableré"),
       'clase-rompe-it.html': ("ro4", "piensamos"),
       'clase-yo-it.html': ("yo5", "conduco")}

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

        print("%-28s %2d ejercicios · contador %2d · botón → %s %s"
              % (pag.replace('clase-', '').replace('-en.html', ''), n, cuenta, destino,
                 '' if not fallos else '  ✗ ' + ', '.join(fallos)))
        esperados = len(respuestas)
        if n != esperados:
            err.append("%s: %d ejercicios en la página y %d respuestas apuntadas"
                       % (pag, n, esperados))
        if fallos: err.append("%s: respuestas buenas dadas por malas: %s" % (pag, fallos))
        if cuenta != esperados:
            err.append("%s: el contador marca %s y debería marcar %d" % (pag, cuenta, esperados))
        # el botón lleva al hub del idioma de la página, no siempre al inglés
        if destino != 'ejercicios-%s.html' % pista:
            err.append("%s: el botón va a %s y debería ir al hub en %s" % (pag, destino, pista))

        # repetir un acierto NO suma: el contador cuenta ejercicios hechos, no
        # clics. Antes subía en cada acierto, así que bastaba con darle cuatro
        # veces a «Comprobar» sobre una respuesta ya buena para inflarlo.
        exid0, resp0 = list(respuestas.items())[0]
        responde(pg, exid0, resp0)
        responde(pg, exid0, resp0)
        if pg.evaluate("window.jnGetExerciseCount()") != esperados:
            err.append("%s: repetir %s sube el contador a %s, y debería quedarse en %d"
                       % (pag, exid0, pg.evaluate("window.jnGetExerciseCount()"), esperados))

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
