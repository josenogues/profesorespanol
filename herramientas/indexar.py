# -*- coding: utf-8 -*-
"""Regenera search-index.js a partir de las páginas.

El buscador de la web no lee las páginas: lee este índice, que es un archivo
aparte. Si se edita una página y no se vuelve a generar el índice, el
buscador sigue encontrando el texto viejo. Por eso esto vive en el repo y no
en el portátil de nadie.

    python3 herramientas/indexar.py

Qué entra: todas las páginas menos las que llevan «noindex» (las clases y
«Mis clases», que son de cada alumno) y el panel del profesor.
"""
import glob
import hashlib
import html
import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# el panel es del profesor; la privacidad sí se busca, que para eso está
FUERA = {"panel-profesor.html"}

# el encabezado de la página —migas, botones de idioma, interruptor de tema—
# no es contenido: si entra, buscar «Italiano» devuelve las 173 páginas
BASURA = re.compile(r'<div class="page-header".*?</div>\s*</div>|'
                    r'<(script|style|svg|button|select)\b.*?</\1>|'
                    r'<aside\b.*?</aside>', re.S | re.I)


def limpia(trozo):
    trozo = BASURA.sub(" ", trozo)
    trozo = re.sub(r"<[^>]+>", " ", trozo)
    return re.sub(r"\s+", " ", html.unescape(trozo)).strip()


def titulo(s, cuerpo):
    for etiqueta in ("h2", "h1"):
        m = re.search(rf"<{etiqueta}[^>]*>(.*?)</{etiqueta}>", s, re.S)
        if m:
            t = limpia(m.group(1))
            if t:
                return t
    m = re.search(r"<title>(.*?)</title>", s, re.S)
    return limpia(m.group(1)).split(" | ")[0] if m else cuerpo[:40]


def entrada(ruta):
    s = open(ruta, encoding="utf-8").read()
    if re.search(r'<meta[^>]+name="robots"[^>]+noindex', s, re.I):
        return None
    m = re.search(r"<main\b[^>]*>(.*?)</main>", s, re.S | re.I)
    if not m:
        return None
    cuerpo = limpia(m.group(1))
    if len(cuerpo) < 40:
        return None
    return {"url": os.path.basename(ruta), "title": titulo(s, cuerpo), "text": cuerpo}


def main():
    entradas = []
    saltadas = []
    for ruta in sorted(glob.glob(os.path.join(RAIZ, "*.html"))):
        if os.path.basename(ruta) in FUERA:
            saltadas.append((os.path.basename(ruta), "excluida a mano"))
            continue
        e = entrada(ruta)
        if e:
            entradas.append(e)
        else:
            saltadas.append((os.path.basename(ruta), "noindex o sin contenido"))

    destino = os.path.join(RAIZ, "search-index.js")
    texto = ("window.SEARCH_INDEX = "
             + json.dumps(entradas, ensure_ascii=False) + ";\n")
    with open(destino, "w", encoding="utf-8") as f:
        f.write(texto)

    # El índice no se pide desde ninguna página: lo carga script.js a mano
    # cuando el alumno toca el buscador, con su propio ?v=. Esa versión se
    # quedó en 20260916 mientras el índice se regeneraba una y otra vez, así
    # que quien hubiera buscado algo antes seguía con el índice de entonces y
    # no encontraba nada de lo nuevo. Ahora la huella del contenido se escribe
    # aquí: cambia el índice, cambia la versión, y nadie se queda con el viejo.
    huella = hashlib.sha1(texto.encode("utf-8")).hexdigest()[:10]
    sj = os.path.join(RAIZ, "script.js")
    s = open(sj, encoding="utf-8").read()
    nuevo, n = re.subn(r"search-index\.js\?v=[0-9a-z]+",
                       "search-index.js?v=" + huella, s)
    if n != 1:
        print(f"OJO: en script.js hay {n} sitios donde se pide search-index.js, "
              "esperaba exactamente uno. Versión sin tocar.")
    elif nuevo != s:
        open(sj, "w", encoding="utf-8").write(nuevo)
        print(f"script.js ahora pide search-index.js?v={huella} "
              "— acuérdate de subirle la versión a script.js en las páginas.")

    print(f"{len(entradas)} páginas indexadas → search-index.js")
    print(f"{len(saltadas)} fuera del índice:")
    for n, por in saltadas:
        print(f"   {n:34} {por}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
