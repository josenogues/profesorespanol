# -*- coding: utf-8 -*-
"""Revisión general del sitio, sin navegador: lo que se puede comprobar leyendo.

    python3 herramientas/revisar.py


Busca enlaces rotos, identificadores repetidos, versiones de caché que no
cuadran, temas de ejercicios que no existen, páginas huérfanas y el idioma
declarado de cada página. Las pruebas de siempre miran que las cosas
funcionen; esto mira que nada se haya quedado colgando.
"""
import glob, hashlib, os, re, subprocess, sys
from collections import Counter, defaultdict

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PISTAS = ("es", "it", "en")
hallazgos = defaultdict(list)


def apunta(categoria, texto):
    hallazgos[categoria].append(texto)


PAGINAS = sorted(os.path.basename(p) for p in glob.glob(REPO + "/*.html"))
EXISTE = set(PAGINAS)
CUERPO = {p: open(os.path.join(REPO, p), encoding="utf-8").read() for p in PAGINAS}


# ── A. enlaces locales que no llevan a ningún sitio ──────────────────────
for pag, s in CUERPO.items():
    for href in set(re.findall(r'href="([^"#?][^"]*)"', s)):
        if href.startswith(("http", "mailto:", "//", "data:")):
            continue
        destino = href.split("?")[0].split("#")[0]
        if destino and destino not in EXISTE and not os.path.exists(os.path.join(REPO, destino)):
            apunta("enlaces rotos", f"{pag} → {href}")

# ── B. data-base: la página tiene que existir en las pistas que toca ─────
for pag, s in CUERPO.items():
    for m in re.finditer(r'<a[^>]*data-base="([a-z0-9-]+)"[^>]*>', s):
        base, etiqueta = m.group(1), m.group(0)
        if 'track-only' in etiqueta:
            pistas = re.findall(r'data-track-show="([a-z]{2})"', etiqueta)
        elif 'hide-on-es' in etiqueta:
            pistas = ["it", "en"]
        else:
            pistas = list(PISTAS)
        for L in pistas:
            if f"{base}-{L}.html" not in EXISTE:
                apunta("menú a páginas inexistentes", f"{pag}: {base}-{L}.html")

# ── C. identificadores repetidos dentro de una misma página ──────────────
for pag, s in CUERPO.items():
    ids = re.findall(r'\sid="([^"]+)"', s)
    for ident, n in Counter(ids).items():
        if n > 1:
            apunta("ids repetidos", f"{pag}: id=«{ident}» {n} veces")

# ── D. ?tema= tiene que ser un tema de verdad del hub de ejercicios ──────
TEMAS_HUB = {}
for L in PISTAS:
    h = CUERPO.get(f"ejercicios-{L}.html", "")
    TEMAS_HUB[L] = set(re.findall(r'"([a-z0-9-]+)"', " ".join(re.findall(r'"topics": \[([^\]]*)\]', h))))
for pag, s in CUERPO.items():
    for m in re.finditer(r'href="ejercicios-([a-z]{2})\.html\?tema=([a-z0-9-]+)"', s):
        L, tema = m.group(1), m.group(2)
        if tema not in TEMAS_HUB.get(L, set()):
            apunta("?tema= que el hub no conoce", f"{pag} → {tema} ({L})")

# ── E. ?curso= y &paso= ──────────────────────────────────────────────────
CURSOS = {}
for L in PISTAS:
    h = CUERPO.get(f"ejercicios-{L}.html", "")
    CURSOS[L] = set(re.findall(r'"key":\s*"([a-z0-9-]+)"', h))
for pag, s in CUERPO.items():
    for m in re.finditer(r'ejercicios-([a-z]{2})\.html\?curso=([a-z0-9-]+)', s):
        if m.group(2) not in CURSOS.get(m.group(1), set()):
            apunta("?curso= inexistente", f"{pag} → {m.group(2)}")

# ── F. temas.js y clases.js apuntan a páginas que existen ────────────────
temas = open(os.path.join(REPO, "temas.js"), encoding="utf-8").read()
for bloque in temas.split("{ id:")[1:]:
    tid = re.match(r"'([a-z0-9-]+)'", bloque.strip()).group(1)
    pag = re.search(r"pagina:'([a-z0-9-]+)'", bloque)
    if not pag:
        continue
    pistas = re.search(r"pistas:\['([a-z]{2})'(?:,\s*'([a-z]{2})')*\]", bloque)
    ls = re.findall(r"'([a-z]{2})'", pistas.group(0)) if pistas else list(PISTAS)
    for L in ls:
        if f"{pag.group(1)}-{L}.html" not in EXISTE:
            apunta("temas.js roto", f"{tid} → {pag.group(1)}-{L}.html")
    ej = re.search(r"ejercicios:'([a-z0-9-]+)'", bloque)
    destino = ej.group(1) if ej else tid
    if destino not in TEMAS_HUB["es"] and destino not in TEMAS_HUB["en"]:
        apunta("temas.js: ejercicios que no existen", f"{tid} → {destino}")

# todos los ids de temas.js, para validar el `temas` de cada clase
TEMAS_ID = set(re.findall(r"\{ id:'([a-z0-9-]+)'", temas))

clases = open(os.path.join(REPO, "clases.js"), encoding="utf-8").read()
ids_clase, nums_clase = set(), {}
# los dos lazos entre clases: la de abajo apunta a la de arriba
LAZOS = {"profundiza": "es la versión a fondo de", "continua": "continúa"}
lazos = {k: {} for k in LAZOS}
for bloque in clases.split("  {")[1:]:
    cid = re.search(r"id: '([a-z0-9-]+)'", bloque)
    pag = re.search(r"pagina: '([a-z0-9-]+)'", bloque)
    if not (cid and pag):
        continue
    ids_clase.add(cid.group(1))
    num = re.search(r"num: (\d+)", bloque)
    if num:
        nums_clase[cid.group(1)] = int(num.group(1))
    for campo in LAZOS:
        m = re.search(campo + r": '([a-z0-9-]+)'", bloque)
        if m:
            lazos[campo][cid.group(1)] = m.group(1)
    # `temas` es de dónde saca sus ejercicios el repaso de esta clase. Un id
    # mal escrito no da error en ningún sitio: el repaso sale vacío y ni el
    # alumno ni José se enteran de por qué.
    mt = re.search(r"temas: \[([^\]]*)\]", bloque)
    if not mt:
        apunta("clases.js: clase sin temas", f"{cid.group(1)} (no se le puede hacer repaso)")
    else:
        for t in re.findall(r"'([a-z0-9-]+)'", mt.group(1)):
            if t not in TEMAS_ID:
                apunta("clases.js: tema de repaso que no existe", f"{cid.group(1)} → {t}")
    pistas = re.search(r"pistas: \[([^\]]*)\]", bloque)
    ls = re.findall(r"'([a-z]{2})'", pistas.group(1)) if pistas else list(PISTAS)
    for L in ls:
        pagina = f"{pag.group(1)}-{L}.html"
        if pagina not in EXISTE:
            apunta("clases.js roto", f"{cid.group(1)} → {pagina}")
            continue
        # El data-clase del <body> es la caja de apuntes del alumno: lo que
        # escriba en esta página se guarda con esa clave. Si la página se copió
        # de otra y no se cambió, dos clases comparten caja y el alumno ve en
        # una lo que escribió en otra. Pasó en 19 páginas de 50.
        m = re.search(r'data-clase="([^"]*)"', CUERPO[pagina])
        if not m:
            apunta("página de clase sin data-clase", f"{pagina} (los apuntes no se guardan)")
        elif m.group(1) != cid.group(1):
            apunta("los apuntes de dos clases van a la misma caja",
                   f"{pagina}: data-clase=«{m.group(1)}» y la clase es «{cid.group(1)}»")

# Los lazos entre clases. Si apuntan a una clase que no existe, el catálogo se
# calla y la clase parece suelta —que es justo lo que esos campos evitan—, así
# que un id mal escrito tiene que saltar aquí y no pasar desapercibido.
for campo, verbo in LAZOS.items():
    for hija, base in lazos[campo].items():
        if base not in ids_clase:
            apunta(f"clases.js: {campo} apunta a una clase que no existe", f"{hija} → {base}")
        elif base == hija:
            apunta(f"clases.js: una clase {verbo} a sí misma", hija)
        elif base in nums_clase and hija in nums_clase and nums_clase[hija] <= nums_clase[base]:
            apunta(f"clases.js: la que {verbo} otra va antes que ella",
                   f"{hija} (#{nums_clase[hija]}) → {base} (#{nums_clase[base]})")
    # y que no haya dos clases colgando de la misma: el catálogo solo puede
    # enseñar una, y la segunda se quedaría muda sin que nadie lo notara
    vistas = {}
    for hija, base in lazos[campo].items():
        if base in vistas:
            apunta(f"clases.js: dos clases con el mismo {campo}",
                   f"{vistas[base]} y {hija} → {base}")
        vistas[base] = hija

# los números: la centena es el nivel y todas acaban en 0, para poder meter
# una clase en el hueco sin mover las demás
BANDA = {"A1": 1, "A1–A2": 2, "A2": 3, "A2–B1": 4, "B1–B2": 5, "B2": 6}
vistos = {}
for bloque in clases.split("  {")[1:]:
    cid = re.search(r"id: '([a-z0-9-]+)'", bloque)
    num = re.search(r"num: (\d+)", bloque)
    niv = re.search(r"nivel: '([^']+)'", bloque)
    if not (cid and num and niv):
        continue
    n, nivel = int(num.group(1)), niv.group(1)
    if n in vistos:
        apunta("clases.js: dos clases con el mismo número", f"#{n}: {vistos[n]} y {cid.group(1)}")
    vistos[n] = cid.group(1)
    if nivel in BANDA and n // 100 != BANDA[nivel]:
        apunta("clases.js: el número no cuadra con el nivel",
               f"{cid.group(1)} es {nivel} y lleva el #{n}")

# ── G. iconos: todos los que se usan están en la fuente recortada ────────
# La fuente de iconos es propia y solo lleva los que la web usa. Un icono
# nuevo que no esté dentro no da ningún error: sale un hueco y ya.
sys.path.insert(0, os.path.join(REPO, "herramientas"))
import iconos as _iconos
import versiones as _versiones

for problema in _iconos.comprueba():
    apunta("iconos", problema)

# ── H. nada de fuera que frene la página ────────────────────────────────
# Tipografías e iconos se sirven desde aquí. Si vuelve a colarse una hoja de
# estilos o un script de otro servidor, cada página espera por él antes de
# pintarse, y además le cuenta a ese servidor quién la está abriendo. Firebase
# es la excepción: sin él no hay acceso ni progreso.
PERMITIDOS = ("https://www.gstatic.com/firebasejs/",)
for pag, s in CUERPO.items():
    for m in re.finditer(r'<(?:link|script)\b[^>]*?(?:href|src)="(https?://[^"]+)"[^>]*>', s):
        etiqueta, url = m.group(0), m.group(1)
        if 'rel="preconnect"' in etiqueta or url.startswith(PERMITIDOS):
            continue
        apunta("recursos de terceros en una página", f"{pag} → {url[:70]}")
for hoja in glob.glob(REPO + "/*.css"):
    if re.search(r"@import|url\(\s*[\"']?https?://", open(hoja, encoding="utf-8").read()):
        apunta("recursos de terceros en una página", f"{os.path.basename(hoja)} importa algo de fuera")

# ── I. el índice del buscador, al día ───────────────────────────────────
# Se regenera y se mira si ha cambiado algo: si cambia, es que alguna página
# se tocó sin volver a indexar y el buscador seguía con el texto viejo. El
# ?v= con que script.js pide cada parte lo comprueba el apartado siguiente.
import indexar as _indexar


def _indices():
    return {parte: (open(_indexar.ruta_parte(parte), encoding="utf-8").read()
                    if os.path.exists(_indexar.ruta_parte(parte)) else None)
            for parte in _indexar.PARTES}


antes = _indices()
subprocess.run([sys.executable, os.path.join(REPO, "herramientas", "indexar.py")],
               capture_output=True, text=True)
ahora = _indices()
for parte in _indexar.PARTES:
    if antes[parte] != ahora[parte]:
        apunta("índice del buscador",
               f"search-index-{parte}.js estaba desfasado respecto a las páginas "
               "(ya regenerado; pasa herramientas/versiones.py)")
script_js = open(os.path.join(REPO, "script.js"), encoding="utf-8").read()
for parte in _indexar.PARTES:
    if f"search-index-{parte}.js?v=" not in script_js:
        apunta("índice del buscador", f"script.js ya no pide search-index-{parte}.js con ?v=")
if os.path.exists(os.path.join(REPO, "search-index.js")):
    apunta("índice del buscador", "queda el search-index.js antiguo, que ya no usa nadie")

# ── I2. las versiones de caché son la huella de cada archivo ─────────────
# Antes se comprobaba que todas las páginas pidieran la misma ?v= y, con git,
# que nadie hubiera tocado un archivo sin subírsela. Ahora el ?v= es la
# huella del contenido y la pone herramientas/versiones.py: aquí basta con
# mirar que la que se pide es la del archivo que hay. Va después del índice
# porque regenerarlo cambia script.js.
for problema in _versiones.comprueba():
    apunta("versiones de caché", problema)

# ── J. páginas a las que no llega nadie ──────────────────────────────────
enlazadas = set()
for s in CUERPO.values():
    enlazadas |= {h.split("?")[0].split("#")[0] for h in re.findall(r'href="([^"]+\.html)[^"]*"', s)}
    for base in re.findall(r'data-base="([a-z0-9-]+)"', s):
        enlazadas |= {f"{base}-{L}.html" for L in PISTAS}
SUELTAS_OK = {"index.html", "panel-profesor.html"}
# a las clases se llega desde «Mis clases», que las pinta con JavaScript
SUELTAS_OK |= {p for p in PAGINAS if p.startswith("clase-")}
for pag in PAGINAS:
    if pag not in enlazadas and pag not in SUELTAS_OK:
        apunta("páginas huérfanas", pag)

# ── K. el idioma declarado y el sufijo del archivo ──────────────────────
for pag, s in CUERPO.items():
    m = re.search(r'<html lang="([a-z-]+)"', s)
    sufijo = pag[-7:-5] if re.search(r"-(es|it|en)\.html$", pag) else "es"
    if not m:
        apunta("sin <html lang>", pag)
    elif m.group(1) != sufijo:
        apunta("idioma declarado que no cuadra", f"{pag}: lang={m.group(1)}, esperaba {sufijo}")
    if "<title>" not in s:
        apunta("sin título", pag)

# ── L2. la miga de pan dice en qué página estás ─────────────────────────
# Las clases se escriben copiando otra y cambiando el texto. Si se cambia el
# título pero no el último trozo de la miga, la página se presenta con el
# nombre de la clase de la que se copió. Pasó con siete clases italianas de
# golpe, y desde fuera no se nota: hay que mirar arriba del todo.
# No vale comparar la miga con el título a secas: en las páginas de teoría el
# título lleva el idioma detrás —«Casa (español)»— y en la pista inglesa está
# traducido. Lo que sí es siempre un fallo es que la miga sea el título de OTRA
# página de la misma pista: eso solo pasa copiando y olvidándose de la miga.
import html as _html


def _limpia(x):
    x = _html.unescape(re.sub(r"<[^>]+>", "", x))
    x = re.sub(r"\s*\((español|italiano|English)\)\s*$", "", x.strip())
    return x.lower().replace("’", "'").replace("«", "").replace("»", "").strip()


def _pista(p):
    return p[-7:-5] if re.search(r"-(es|it|en)\.html$", p) else "es"


TITULO = {}
for pag, s in CUERPO.items():
    t = re.search(r"<title>(.*?)</title>", s, re.S)
    if t:
        TITULO[pag] = _limpia(t.group(1).split(" | ")[0])
for pag, s in CUERPO.items():
    m = re.search(r'<div class="breadcrumb">(.*?)</div>', s, re.S)
    if not m or pag not in TITULO:
        continue
    miga = _limpia(m.group(1).split("/")[-1])
    if not miga or miga == TITULO[pag]:
        continue
    otras = [o for o, t in TITULO.items()
             if t == miga and o != pag and _pista(o) == _pista(pag)]
    if otras:
        apunta("la miga de pan es la de otra página",
               f"{pag}: dice «{miga}», que es el título de {otras[0]}")

# ── L. restos de páginas retiradas ──────────────────────────────────────
for muerta in ("verbos-regulares", "verbos-irregulares"):
    for pag, s in CUERPO.items():
        if muerta in s:
            apunta("restos de páginas retiradas", f"{pag} menciona {muerta}")

print(f"{len(PAGINAS)} páginas revisadas\n")
if not hallazgos:
    print("SIN HALLAZGOS")
else:
    for cat in sorted(hallazgos):
        items = hallazgos[cat]
        print(f"█ {cat} ({len(items)})")
        for x in items[:12]:
            print("   ", x)
        if len(items) > 12:
            print(f"    ... y {len(items) - 12} más")
        print()
sys.exit(1 if hallazgos else 0)
