# -*- coding: utf-8 -*-
"""La fuente de iconos, recortada a los que la web usa de verdad.

    python3 herramientas/iconos.py              regenera la fuente y su CSS
    python3 herramientas/iconos.py --comprueba  solo mira si falta alguno

Antes cada página pedía a un CDN la hoja entera de Tabler Icons: 242 KB de
CSS con los 5.300 iconos, más los trozos de fuente que tocaran, y además con
«@latest», o sea, la versión que hubiera ese día: si Tabler renombraba un
icono, desaparecía de la web sin que nadie tocara nada. La web usa 75.

Ahora hay una fuente propia con esos 75 (unos 11 KB) en fuentes/iconos.woff2
y sus reglas van dentro de styles.css, entre dos marcas. Sin CDN, sin
petición aparte y con la versión de Tabler fijada aquí.

Cuando se use un icono nuevo —un «ti ti-loquesea» que no estaba—, revisar.py
avisa de que falta y basta con volver a pasar esto. Para regenerar hace falta
el paquete de Tabler: se baja solo con npm, o se le dice dónde está con
--tabler RUTA (la carpeta «dist» del paquete @tabler/icons-webfont).
"""
import glob
import hashlib
import os
import re
import subprocess
import sys
import tempfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION = "3.51.0"          # la de Tabler; subirla aquí es una decisión, no un accidente
FUENTE = os.path.join(RAIZ, "fuentes", "iconos.woff2")
ESTILOS = os.path.join(RAIZ, "styles.css")
INICIO = "/* ── iconos:inicio ──"
FIN = "/* ── iconos:fin ── */"

# un icono es «ti-» y minúsculas, cifras y guiones; el (?<!…) evita «multi-»
# y compañía, y los nombres de clase propios que acaban en -ti-algo
ICONO = re.compile(r"(?<![\w-])ti-[a-z0-9]+(?:-[a-z0-9]+)*")
A_TROZOS = re.compile(r"""ti-['"`]\s*\+|ti-\$\{""")


def usados():
    """Todos los ti-… que aparecen en las páginas, en el JavaScript y en el CSS
    propio (fuera del bloque generado, que si no se justificaría a sí mismo)."""
    salen = set()
    rutas = glob.glob(os.path.join(RAIZ, "*.html"))
    rutas += [j for j in glob.glob(os.path.join(RAIZ, "*.js"))
              if os.path.basename(j) != "search-index.js"]
    for ruta in rutas:
        salen |= set(ICONO.findall(open(ruta, encoding="utf-8").read()))
    salen |= set(ICONO.findall(sin_bloque(open(ESTILOS, encoding="utf-8").read())))
    return salen


def sin_bloque(css):
    a, b = css.find(INICIO), css.find(FIN)
    if a < 0 or b < 0:
        return css
    return css[:a] + css[b + len(FIN):]


def en_la_fuente():
    """Los iconos que tiene hoy el bloque generado de styles.css."""
    css = open(ESTILOS, encoding="utf-8").read()
    a, b = css.find(INICIO), css.find(FIN)
    if a < 0 or b < 0:
        return None
    return set(re.findall(r"\.(ti-[a-z0-9-]+):before", css[a:b]))


def comprueba():
    """Devuelve la lista de problemas, vacía si todo cuadra. No toca nada ni
    necesita red: es lo que llama revisar.py."""
    hay = en_la_fuente()
    if hay is None:
        return ["styles.css no tiene el bloque de iconos: pasa herramientas/iconos.py"]
    if not os.path.exists(FUENTE):
        return ["falta fuentes/iconos.woff2: pasa herramientas/iconos.py"]
    faltan = sorted(usados() - hay)
    problemas = ["%s se usa pero no está en la fuente de iconos: pasa herramientas/iconos.py" % f
                 for f in faltan]
    # Un nombre montado a trozos —'ti-' + algo— no se puede encontrar leyendo,
    # así que ese icono no entraría en el recorte y saldría un hueco.
    for ruta in glob.glob(os.path.join(RAIZ, "*.js")) + glob.glob(os.path.join(RAIZ, "*.html")):
        for m in A_TROZOS.finditer(open(ruta, encoding="utf-8").read()):
            problemas.append("%s monta el nombre de un icono a trozos (%s): escríbelo entero"
                             % (os.path.basename(ruta), m.group(0).strip()))
    return problemas


def busca_tabler(ruta):
    if ruta:
        return ruta
    tmp = tempfile.mkdtemp(prefix="tabler-")
    print("bajando @tabler/icons-webfont@%s con npm…" % VERSION)
    r = subprocess.run(["npm", "pack", "@tabler/icons-webfont@" + VERSION],
                       cwd=tmp, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("npm no ha podido bajar el paquete:\n" + r.stderr[-600:] +
                 "\nBájalo a mano y pasa su carpeta dist con --tabler RUTA.")
    tgz = [f for f in os.listdir(tmp) if f.endswith(".tgz")][0]
    subprocess.run(["tar", "xzf", tgz], cwd=tmp, check=True)
    return os.path.join(tmp, "package", "dist")


def genera(tabler):
    css_tabler = open(os.path.join(tabler, "tabler-icons.css"), encoding="utf-8").read()
    mapa = dict(re.findall(r'\.(ti-[a-z0-9-]+):before \{\s*content: "\\([0-9a-f]+)";', css_tabler))
    quiero = sorted(usados())
    no_existen = [q for q in quiero if q not in mapa]
    if no_existen:
        sys.exit("Estos iconos no existen en Tabler %s (¿mal escritos?): %s"
                 % (VERSION, ", ".join(no_existen)))

    os.makedirs(os.path.dirname(FUENTE), exist_ok=True)
    puntos = sorted({mapa[q] for q in quiero})
    r = subprocess.run(
        [sys.executable, "-m", "fontTools.subset", os.path.join(tabler, "fonts", "tabler-icons.ttf"),
         "--unicodes=" + ",".join("U+" + p for p in puntos),
         "--flavor=woff2", "--output-file=" + FUENTE,
         "--no-hinting", "--desubroutinize", "--layout-features=", "--glyph-names"],
        capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("No se ha podido recortar la fuente (hace falta: pip install fonttools brotli):\n"
                 + r.stderr[-600:])

    huella = hashlib.sha1(open(FUENTE, "rb").read()).hexdigest()[:10]
    # La regla .ti es la de Tabler tal cual. font-display:block: mientras llega
    # la fuente no se pinta nada, que es mejor que un cuadradito por icono.
    reglas = [
        INICIO + " generado por herramientas/iconos.py: no editar a mano ──",
        "   Tabler Icons %s (MIT, https://tabler.io/icons): solo los %d que usa la web. */"
        % (VERSION, len(quiero)),
        '@font-face{font-family:"tabler-icons";font-style:normal;font-weight:400;'
        'font-display:block;src:url("fuentes/iconos.woff2?v=%s") format("woff2")}' % huella,
        '.ti{font-family:"tabler-icons" !important;speak:none;font-style:normal;'
        "font-weight:normal;font-variant:normal;text-transform:none;line-height:1;"
        "-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}",
    ]
    reglas += ['.%s:before{content:"\\%s"}' % (q, mapa[q]) for q in quiero]
    reglas.append(FIN)
    bloque = "\n".join(reglas)

    css = open(ESTILOS, encoding="utf-8").read()
    a, b = css.find(INICIO), css.find(FIN)
    if a >= 0 and b >= 0:
        nuevo = css[:a] + bloque + css[b + len(FIN):]
    else:
        # la hoja de Tabler iba delante de styles.css en todas las páginas, así
        # que sus reglas van arriba del todo: lo propio sigue mandando sobre ellas
        nuevo = bloque + "\n\n" + css
    if nuevo != css:
        open(ESTILOS, "w", encoding="utf-8").write(nuevo)
    print("%d iconos → fuentes/iconos.woff2 (%d bytes), reglas en styles.css"
          % (len(quiero), os.path.getsize(FUENTE)))
    print("Ahora pasa herramientas/versiones.py para que las páginas pidan lo nuevo.")


def main():
    if "--comprueba" in sys.argv:
        problemas = comprueba()
        for p in problemas:
            print(p)
        print("iconos: %s" % ("todo en orden" if not problemas else "%d problemas" % len(problemas)))
        return 1 if problemas else 0
    ruta = None
    if "--tabler" in sys.argv:
        ruta = sys.argv[sys.argv.index("--tabler") + 1]
    genera(busca_tabler(ruta))
    return 0


if __name__ == "__main__":
    sys.exit(main())
