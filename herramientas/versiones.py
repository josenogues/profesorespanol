# -*- coding: utf-8 -*-
"""Pone a cada archivo, allí donde se pide, la huella de su contenido.

    python3 herramientas/versiones.py              lo deja todo al día
    python3 herramientas/versiones.py --comprueba  solo dice qué no cuadra

Las páginas piden styles.css?v=…, script.js?v=… y demás. Ese ?v= es lo que
hace que el navegador de un alumno no se quede con el archivo viejo cuando se
cambia algo. Antes era una fecha puesta a mano, y había que acordarse de
subirla en las 213 páginas cada vez que se tocaba un archivo: si se olvidaba,
la página nueva se cargaba con el JavaScript de ayer.

Ahora el ?v= es la huella del contenido (los 10 primeros caracteres de su
SHA-1). Cambia el archivo, cambia la huella; no cambia, se queda igual, y el
navegador sigue usando el que ya tenía. No hay nada de lo que acordarse:
se pasa esto antes de publicar y revisar.py avisa si no se ha pasado.

Vale para todo lo que se pida con ?v=, esté donde esté:
  · en las páginas:      <script src="script.js?v=…">, <link href="styles.css?v=…">
  · dentro del CSS:      url("fuentes/nunito-latin.woff2?v=…")
  · dentro del JS:       'search-index-es.js?v=…', import … from "./firebase-init.js?v=…"
Como unos archivos piden a otros (la página pide styles.css, que pide las
fuentes), se repite hasta que ya no cambia nada.
"""
import glob
import hashlib
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ruta local + ?v= + lo que haya. Las comillas o el paréntesis de delante
# evitan casar a medias con una dirección de fuera (https://…/x.js?v=1).
PIDE = re.compile(r"""(?P<antes>["'(])(?P<ruta>(?:\./)?[A-Za-z0-9_][A-Za-z0-9_./-]*\.(?:js|css|woff2))\?v=(?P<v>[0-9A-Za-z]+)""")

# lo que una página pide sin ?v= y debería llevarlo
SIN_VERSION = re.compile(r"""(?:src|href)=["'](?P<ruta>[A-Za-z0-9_][A-Za-z0-9_./-]*\.(?:js|css|woff2))["']""")


def contenedores():
    """Los archivos que piden otros archivos."""
    # primero lo que piden los demás: así casi siempre basta una vuelta
    rutas = sorted(glob.glob(os.path.join(RAIZ, "*.css")))
    rutas += sorted(j for j in glob.glob(os.path.join(RAIZ, "*.js"))
                    if not os.path.basename(j).startswith("search-index"))
    rutas += sorted(glob.glob(os.path.join(RAIZ, "*.html")))
    return rutas


def huella(ruta):
    return hashlib.sha1(open(ruta, "rb").read()).hexdigest()[:10]


def local(ruta_pedida):
    r = ruta_pedida[2:] if ruta_pedida.startswith("./") else ruta_pedida
    completa = os.path.join(RAIZ, r)
    return completa if os.path.isfile(completa) else None


def pasada(escribe):
    """Una vuelta por todos los contenedores. Devuelve lo que no cuadraba."""
    descuadres = []
    cache = {}

    def h(ruta):
        if ruta not in cache:
            cache[ruta] = huella(ruta)
        return cache[ruta]

    for cont in contenedores():
        texto = open(cont, encoding="utf-8").read()

        def cambia(m):
            destino = local(m.group("ruta"))
            if not destino:
                descuadres.append((os.path.basename(cont), m.group("ruta"), m.group("v"), "NO EXISTE"))
                return m.group(0)
            buena = h(destino)
            if m.group("v") != buena:
                descuadres.append((os.path.basename(cont), m.group("ruta"), m.group("v"), buena))
            return "%s%s?v=%s" % (m.group("antes"), m.group("ruta"), buena)

        nuevo = PIDE.sub(cambia, texto)
        if escribe and nuevo != texto:
            open(cont, "w", encoding="utf-8").write(nuevo)
            cache.pop(cont, None)   # su propia huella acaba de cambiar
    return descuadres


def sin_version():
    faltan = []
    for pag in sorted(glob.glob(os.path.join(RAIZ, "*.html"))):
        for m in SIN_VERSION.finditer(open(pag, encoding="utf-8").read()):
            if local(m.group("ruta")):
                faltan.append((os.path.basename(pag), m.group("ruta")))
    return faltan


def comprueba():
    """Lista de problemas en texto, vacía si todo cuadra. No escribe nada."""
    problemas = []
    vistos = {}
    for cont, ruta, tiene, buena in pasada(escribe=False):
        vistos.setdefault((ruta, tiene, buena), []).append(cont)
    for (ruta, tiene, buena), conts in sorted(vistos.items()):
        donde = conts[0] if len(conts) == 1 else "%s y %d más" % (conts[0], len(conts) - 1)
        if buena == "NO EXISTE":
            problemas.append("%s pide %s, que no existe" % (donde, ruta))
        else:
            problemas.append("%s pide %s?v=%s y el archivo es %s" % (donde, ruta, tiene, buena))
    for pag, ruta in sin_version()[:20]:
        problemas.append("%s pide %s sin ?v=" % (pag, ruta))
    return problemas


def main():
    if "--comprueba" in sys.argv:
        problemas = comprueba()
        for p in problemas:
            print(p)
        print("versiones: %s" % ("todo al día" if not problemas
                                 else "%d sin cuadrar: pasa herramientas/versiones.py" % len(problemas)))
        return 1 if problemas else 0

    total = 0
    for vuelta in range(8):
        cambios = [d for d in pasada(escribe=True) if d[3] != "NO EXISTE"]
        if not cambios:
            break
        total += len(cambios)
    else:
        print("OJO: tras 8 vueltas sigue cambiando. ¿Dos archivos que se piden el uno al otro?")
        return 1
    rotos = [d for d in pasada(escribe=False) if d[3] == "NO EXISTE"]
    for cont, ruta, _, _ in rotos[:20]:
        print("OJO: %s pide %s, que no existe" % (cont, ruta))
    for pag, ruta in sin_version()[:20]:
        print("OJO: %s pide %s sin ?v= (añádele ?v=0 y vuelve a pasar esto)" % (pag, ruta))
    print("versiones: %s" % ("ya estaba todo al día" if not total
                             else "%d referencias puestas al día" % total))
    return 1 if rotos else 0


if __name__ == "__main__":
    sys.exit(main())
