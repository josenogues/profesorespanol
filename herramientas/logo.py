# -*- coding: utf-8 -*-
"""Dibuja el logo de la web y su icono a partir de las letras de fuentes/.

    python3 herramientas/logo.py

Saca cuatro archivos en la raíz:
  · logo.svg           el logo a lo ancho: el menú y la barra del móvil
  · logo-apilado.svg   el dibujo encima y el nombre debajo: la puerta de entrada
  · icono.png          el icono de la pestaña del navegador (sin destellos)
  · icono-movil.png    el icono que sale al guardar la web en el móvil

El logo lo eligió José en noviembre de 2026, probando opciones en un taller:
dos globos de conversación (el violeta con la ñ, que es él, y uno rosa más
pequeño detrás, el alumno), destellos amarillos finos en la esquina de cada
uno, «Aprende español» en la Nunito de la web y «con José» a mano (Caveat),
en blanco y marcado con un subrayador del mismo amarillo de los destellos.
El amarillo es el del logo viejo.
No poner juntos rojo, amarillo y morado: recuerda a la bandera republicana
y José no quiere líos.

Las letras van convertidas en trazos, así el logo se ve igual en todos los
ordenadores y no depende de que la fuente haya cargado. La «n» de la ñ es
de Fraunces (licencia OFL), que la web no usa en ningún otro sitio: por eso
solo se guarda esa letra, en herramientas/fraunces-n.woff2, y no se publica.

Necesita fontTools, uharfbuzz (pip install --break-system-packages uharfbuzz)
y Playwright con el Chromium de /opt/pw-browsers para los PNG.
"""
import io
import os

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VIOLETA, ROSA, TILDE, ORO, BLANCO = "#5B4FB8", "#E04F96", "#FF86BE", "#F2AB27", "#FFFFFF"

# El globo, en una caja de 64×64. Los dos globos son este mismo dibujo:
# el rosa, girado como en un espejo y más pequeño.
GLOBO = "M18 4H46Q60 4 60 18V34Q60 48 46 48H28L15 59L17 48Q4 47 4 34V18Q4 4 18 4Z"
EN_VIOLETA = "translate(0 9) scale(.86) rotate(-6 32 32)"
EN_ROSA = "translate(78 3.6) scale(-.66 .66) rotate(-6 32 32)"
TILDE_A_MANO = "M19.5 18 Q25.5 9 32 15.5 T45 12"
DESTELLOS = ["M1.6 12.6 L-1.8 9.4", "M8.6 9.6 L8 5", "M-0.8 19.6 L-5.4 19.9",            # esquina del violeta
             "M77.82 8.58 L81.42 5.98", "M72.42 3.98 L73.82 -0.22", "M79.02 15.18 L83.62 15.18"]  # y del rosa


def fuente(ruta, ejes=None):
    f = TTFont(ruta)
    if ejes:
        f = instancer.instantiateVariableFont(f, ejes)
    datos = io.BytesIO()
    f.flavor = None
    f.save(datos)
    return f, datos.getvalue()


def texto(ruta, cadena, tam, x, base, ejes=None):
    """Devuelve (trazo SVG, caja) de una línea de texto ya convertida en trazos."""
    tt, datos = fuente(ruta, ejes)
    upm = tt["head"].unitsPerEm
    cara = hb.Face(datos)
    hbf = hb.Font(cara)
    buf = hb.Buffer()
    buf.add_str(cadena)
    buf.guess_segment_properties()
    hb.shape(hbf, buf, {"kern": True, "liga": True})
    glifos = tt.getGlyphSet()
    orden = tt.getGlyphOrder()
    pen = SVGPathPen(glifos, lambda v: ("%.2f" % v).rstrip("0").rstrip("."))
    caja = BoundsPen(glifos)
    k = tam / upm
    cx = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        nombre = orden[info.codepoint]
        m = (k, 0, 0, -k, x + (cx + pos.x_offset) * k, base - pos.y_offset * k)
        glifos[nombre].draw(TransformPen(pen, m))
        glifos[nombre].draw(TransformPen(caja, m))
        cx += pos.x_advance
    return pen.getCommands(), caja.bounds


FRAUNCES = os.path.join(RAIZ, "herramientas", "fraunces-n.woff2")


def n_de_fraunces():
    """La n de la ñ, centrada en x=32 con la base en y=42, como en el taller."""
    tt, _ = fuente(FRAUNCES, {"opsz": 40, "wght": 700})
    ancho = tt["hmtx"]["n"][0] * 40 / tt["head"].unitsPerEm
    d, _ = texto(FRAUNCES, "n", 40, 32 - ancho / 2, 42, {"opsz": 40, "wght": 700})
    return d


def icono(destellos=True):
    """El dibujo de los dos globos, en las coordenadas de siempre (0..78 × 0..64)."""
    n = n_de_fraunces()
    partes = [
        '<defs><mask id="hueco" maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="110">'
        '<rect x="-20" y="-20" width="140" height="110" fill="#fff"/>'
        '<path d="%s" transform="%s" fill="#000" stroke="#000" stroke-width="3.2" stroke-linejoin="round"/></mask></defs>' % (GLOBO, EN_VIOLETA),
        # la máscara va en un grupo sin giro: si fuera en el propio globo, giraría con él
        '<g mask="url(#hueco)"><path d="%s" transform="%s" fill="%s"/></g>' % (GLOBO, EN_ROSA, ROSA),
        '<g transform="%s"><path d="%s" fill="%s"/><path d="%s" fill="%s"/>'
        '<path d="%s" fill="none" stroke="%s" stroke-width="5" stroke-linecap="round"/></g>' % (EN_VIOLETA, GLOBO, VIOLETA, n, BLANCO, TILDE_A_MANO, TILDE),
    ]
    if destellos:
        partes.append('<g fill="none" stroke="%s" stroke-width="2.3" stroke-linecap="round">%s</g>'
                      % (ORO, "".join('<path d="%s"/>' % d for d in DESTELLOS)))
    return "".join(partes)


# Medidas del logo tal como José lo vio en el taller: el dibujo mide 76 de
# alto (de -8 a 68) y la letra grande, 76/2.9.
K = 76 / 2.9
NUNITO = os.path.join(RAIZ, "fuentes", "nunito-latin.woff2")
CAVEAT = os.path.join(RAIZ, "fuentes", "caveat-latin.woff2")


def base_de_linea(ruta, tam, arriba):
    """Dónde cae la línea de base en una caja de alto = tam (line-height:1), como en CSS."""
    tt = TTFont(ruta)
    upm = tt["head"].unitsPerEm
    asc, desc = tt["hhea"].ascent / upm * tam, -tt["hhea"].descent / upm * tam
    return arriba + (tam - (asc + desc)) / 2 + asc


def subrayador(c, base, tam):
    """Trazo de subrayador detrás de «con José»: punta en bisel, bordes algo
    irregulares y un poco torcido, como hecho a mano. Devuelve (svg, caja)."""
    x0, x1 = c[0] - 5, c[2] + 4
    y0, y1 = base - tam * .52, base + tam * .16
    d = ('M%.1f %.1f L%.1f %.1f Q%.1f %.1f %.1f %.1f L%.1f %.1f L%.1f %.1f Q%.1f %.1f %.1f %.1f Z' % (
        x0 + 3, y0 + 1, (x0 + x1) / 2, y0 - .6, x1 - 8, y0 + .4, x1, y0 - .2,
        x1 - 3, y1 - .6, (x0 + x1) / 2, y1 + .5, x0 + 10, y1 - .2, x0, y1 + .4))
    svg = '<path d="%s" fill="%s" transform="rotate(-2.5 %.1f %.1f)"/>' % (d, ORO, (x0 + x1) / 2, (y0 + y1) / 2)
    return svg, (x0 - 1, y0 - 2, x1 + 1, y1 + 2)


def nombre(x, arriba, centrado_en=None):
    """«Aprende español» y, debajo, «con José». Devuelve (svg, caja)."""
    t1, t2 = K, K * 1.12
    b1 = base_de_linea(NUNITO, t1, arriba)
    b2 = base_de_linea(CAVEAT, t2, arriba + t1 + K * .14)
    d1, c1 = texto(NUNITO, "Aprende español", t1, 0, b1, {"wght": 800})
    d2, c2 = texto(CAVEAT, "con José", t2, 0, b2)
    if centrado_en is None:
        dx1 = dx2 = x
    else:
        dx1 = centrado_en - (c1[0] + c1[2]) / 2
        dx2 = centrado_en - (c2[0] + c2[2]) / 2
    marca, cm = subrayador(c2, b2, t2)
    svg = ('<path transform="translate(%.2f 0)" d="%s" fill="%s"/>' % (dx1, d1, BLANCO) +
           '<g transform="translate(%.2f 0)">%s<path d="%s" fill="%s"/></g>' % (dx2, marca, d2, BLANCO))
    caja = (min(c1[0] + dx1, cm[0] + dx2), min(c1[1], c2[1]), max(c1[2] + dx1, cm[2] + dx2), max(c1[3], c2[3], cm[3]))
    return svg, caja


def guarda(nombre_archivo, cuerpo, caja, titulo):
    x0, y0, x1, y1 = caja
    m = 2
    w, h = x1 - x0 + 2 * m, y1 - y0 + 2 * m
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.1f %.1f %.1f %.1f" width="%d" height="%d" role="img">'
           '<title>%s</title>%s</svg>\n' % (x0 - m, y0 - m, w, h, round(w * 2), round(h * 2), titulo, cuerpo))
    with open(os.path.join(RAIZ, nombre_archivo), "w", encoding="utf-8") as f:
        f.write(svg)
    return w, h


def png(nombre_archivo, svg, lado, fondo=None):
    from playwright.sync_api import sync_playwright
    html = ('<html><body style="margin:0;background:%s">'
            '<div style="width:%dpx;height:%dpx;display:flex;align-items:center;justify-content:center">%s</div></body></html>'
            % (fondo or "transparent", lado, lado, svg))
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = br.new_page(viewport={"width": lado, "height": lado})
        pg.set_content(html)
        pg.screenshot(path=os.path.join(RAIZ, nombre_archivo), omit_background=fondo is None)
        br.close()


if __name__ == "__main__":
    dibujo = icono()
    # a lo ancho: el dibujo ocupa de -14 a 94, y el nombre empieza un poco más allá
    arriba = -8 + (76 - K * 2.26) / 2
    txt, ct = nombre(94 + K * .3, arriba)
    caja = (-6, -1, ct[2], max(64, ct[3]))
    w, h = guarda("logo.svg", dibujo + txt, caja, "Aprende español con José")
    print("logo.svg          %.0f × %.0f" % (w, h))

    # apilado: el dibujo arriba, centrado sobre el nombre
    centro_dibujo = (-5.4 + 83.62) / 2
    txt2, ct2 = nombre(0, 68 + K * .25, centrado_en=centro_dibujo)
    caja2 = (min(-6, ct2[0]), -1, max(84.5, ct2[2]), ct2[3])
    w, h = guarda("logo-apilado.svg", dibujo + txt2, caja2, "Aprende español con José")
    print("logo-apilado.svg  %.0f × %.0f" % (w, h))

    # pestaña: solo los globos, sin destellos (tan pequeño no se verían)
    solo = icono(destellos=False)
    svg_icono = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 80 66" width="%d" height="%d">%s</svg>'
    png("icono.png", svg_icono % (124, 102, solo), 128)
    # móvil: como el logo del menú (fondo azul y destellos), con los globos
    # ocupando casi todo el ancho. Lo eligió José.
    svg_movil = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6.5 -1.5 91 62.5" width="%d" height="%d">%s</svg>'
    png("icono-movil.png", svg_movil % (155, 106, dibujo), 180, "#232C4F")
    print("icono.png, icono-movil.png")
