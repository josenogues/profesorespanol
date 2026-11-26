#!/usr/bin/env python3
"""Saca bienvenida-it.html y bienvenida-en.html de bienvenida.html.

    python3 herramientas/bienvenida_idiomas.py            # las escribe
    python3 herramientas/bienvenida_idiomas.py --mira     # solo dice si están al día

Por qué: la bienvenida lleva los tres idiomas dentro (data-es, data-it,
data-en) y la página cambia el texto al abrirse. A una persona le da igual,
pero Google solo ve una dirección y un idioma (el español), y quien busca en
italiano o en inglés no la encuentra. Así cada idioma tiene su dirección, con
su título, su descripción y el texto ya escrito en su idioma.

La que se toca a mano es SIEMPRE bienvenida.html; las otras dos salen de ella
y revisar.py las rehace solo. No tocarlas a mano: se pierde el cambio.
"""
import html
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTE = os.path.join(REPO, "bienvenida.html")

CABECERA = {
    "it": ("Habla Español con José · Lezioni di spagnolo in videochiamata",
           "Lezioni private di spagnolo in videochiamata con un insegnante madrelingua, "
           "e poi un sito costruito sulle tue lezioni: esercizi, letture e tutta la teoria."),
    "en": ("Habla Español con José · Spanish lessons by video call",
           "One-to-one Spanish lessons by video call with a native teacher, and then a "
           "website built from your lessons: exercises, readings and all the theory."),
}

AVISO = ("<!-- Sale de bienvenida.html con herramientas/bienvenida_idiomas.py "
         "(revisar.py la rehace): NO TOCAR A MANO, se pierde el cambio. -->\n")

ABRE_I18N = re.compile(r'<([a-z0-9]+)\b[^>]*\bclass="[^"]*\bi18n\b[^"]*"[^>]*>')


def cierre(s, tag, desde):
    """Dónde acaba el elemento <tag> que empieza justo antes de `desde`."""
    nivel, pos = 1, desde
    patron = re.compile(r'<(/?)' + tag + r'\b[^>]*>')
    while True:
        m = patron.search(s, pos)
        if not m:
            raise SystemExit("bienvenida.html: un <%s class=i18n> sin cerrar" % tag)
        nivel += -1 if m.group(1) else 1
        if nivel == 0:
            return m.start(), m.end()
        pos = m.end()


def traduce(s, l):
    fuera, pos = [], 0
    for m in ABRE_I18N.finditer(s):
        if m.start() < pos:      # dentro de otro i18n (no pasa, pero por si acaso)
            continue
        etiqueta = m.group(0)
        dato = re.search(r'\sdata-' + l + r'="([^"]*)"', etiqueta)
        if not dato:
            continue
        ini, fin = cierre(s, m.group(1), m.end())
        texto = html.unescape(dato.group(1))
        if "data-html" not in etiqueta:
            texto = html.escape(texto, quote=False)
        fuera += [s[pos:m.end()], texto, s[ini:fin]]
        pos = fin
    fuera.append(s[pos:])
    return "".join(fuera)


def hace(l):
    s = open(FUENTE, encoding="utf-8").read()
    titulo, desc = CABECERA[l]

    def cambia(viejo, nuevo, cuantas=1):
        nonlocal s
        if s.count(viejo) != cuantas:
            raise SystemExit("bienvenida.html: esperaba %d vez «%s» y hay %d"
                             % (cuantas, viejo[:60], s.count(viejo)))
        s = s.replace(viejo, nuevo)

    cambia("<!DOCTYPE html>\n", "<!DOCTYPE html>\n" + AVISO)
    cambia('<html lang="es"', '<html lang="%s"' % l)
    s = re.sub(r"<title>[^<]*</title>", "<title>%s</title>" % html.escape(titulo), s, count=1)
    s = re.sub(r'<meta name="description" content="[^"]*">',
               '<meta name="description" content="%s">' % html.escape(desc), s, count=1)
    cambia('<link rel="canonical" href="https://hablaconjose.com/bienvenida">',
           '<link rel="canonical" href="https://hablaconjose.com/bienvenida-%s">' % l)
    # el logo vuelve a esta misma bienvenida
    s = s.replace('href="bienvenida.html"', 'href="bienvenida-%s.html"' % l)
    # la clase de muestra y su lectura, en este idioma
    s = re.sub(r'(<a\b[^>]*\bdata-pag="[^"]*"[^>]*\bhref="[a-z-]+)-es\.html',
               r'\1-%s.html' % l, s)
    # las fotos de las escenas, en este idioma
    s = re.sub(r'(src="bienvenida/[a-z-]+)-es\.(jpg|mp4)', r'\1-%s.\2' % l, s)
    return traduce(s, l)


def main():
    mira = "--mira" in sys.argv
    viejas = []
    for l in CABECERA:
        ruta = os.path.join(REPO, "bienvenida-%s.html" % l)
        nueva = hace(l)
        antes = open(ruta, encoding="utf-8").read() if os.path.exists(ruta) else None
        if antes == nueva:
            continue
        viejas.append(os.path.basename(ruta))
        if not mira:
            with open(ruta, "w", encoding="utf-8") as f:
                f.write(nueva)
    if mira:
        print("desfasadas: " + ", ".join(viejas) if viejas else "al día")
        sys.exit(1 if viejas else 0)
    print("rehechas: " + ", ".join(viejas) if viejas else "ya estaban al día")


if __name__ == "__main__":
    main()
