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
    pistas = re.search(r"pistas: \[([^\]]*)\]", bloque)
    ls = re.findall(r"'([a-z]{2})'", pistas.group(1)) if pistas else list(PISTAS)
    for L in ls:
        if f"{pag.group(1)}-{L}.html" not in EXISTE:
            apunta("clases.js roto", f"{cid.group(1)} → {pag.group(1)}-{L}.html")

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

# ── G. versiones de caché: mismo archivo, misma ?v= en todas las páginas ──
versiones = defaultdict(set)
for pag, s in CUERPO.items():
    for archivo, v in re.findall(r'(?:src|href)="([a-z-]+\.(?:js|css))\?v=([0-9a-z]+)"', s):
        versiones[archivo].add(v)
        if not os.path.exists(os.path.join(REPO, archivo)):
            apunta("archivos que no existen", f"{pag} → {archivo}")
for archivo, vs in versiones.items():
    if len(vs) > 1:
        apunta("versiones de caché descuadradas", f"{archivo}: {sorted(vs)}")

# ── H. ¿se tocó un archivo sin subirle la versión? ───────────────────────
for archivo in sorted(versiones):
    fecha = subprocess.run(["git", "-C", REPO, "log", "-1", "--format=%at", "--", archivo],
                           capture_output=True, text=True).stdout.strip()
    paginas_con = [p for p, s in CUERPO.items() if f'{archivo}?v=' in s]
    if not paginas_con or not fecha:
        continue
    # la versión más nueva que se usa de ese archivo
    v = sorted(versiones[archivo])[-1]
    cambios = subprocess.run(
        ["git", "-C", REPO, "log", "--format=%at", "-S", f"{archivo}?v={v}", "--", paginas_con[0]],
        capture_output=True, text=True).stdout.split()
    if cambios and int(fecha) > int(cambios[0]):
        apunta("versión de caché por detrás del archivo",
               f"{archivo}: se tocó después de poner ?v={v}")

# ── I. el índice del buscador, al día ───────────────────────────────────
# OJO con el orden: indexar.py no solo regenera el índice, también deja su
# huella en script.js. Así que hay que quedarse con el script.js de ANTES de
# llamarlo; si se mira el de después, el propio arreglo tapa el fallo y la
# comprobación no salta nunca.
antes = open(os.path.join(REPO, "search-index.js"), encoding="utf-8").read()
script_antes = open(os.path.join(REPO, "script.js"), encoding="utf-8").read()
subprocess.run([sys.executable, os.path.join(REPO, "herramientas", "indexar.py")],
               capture_output=True, text=True)
ahora = open(os.path.join(REPO, "search-index.js"), encoding="utf-8").read()
if antes != ahora:
    apunta("índice del buscador", "estaba desfasado respecto a las páginas (ya regenerado)")

# el índice no se pide desde ninguna página, sino desde dentro de script.js,
# así que la comprobación G no lo ve. Aquí se mira aparte: la huella del
# archivo tiene que ser la del ?v= con el que se pide.
huella = hashlib.sha1(ahora.encode("utf-8")).hexdigest()[:10]
pedido = re.search(r"search-index\.js\?v=([0-9a-z]+)", script_antes)
if not pedido:
    apunta("índice del buscador", "script.js ya no pide search-index.js con ?v=")
elif pedido.group(1) != huella:
    apunta("índice del buscador",
           f"script.js lo pedía con ?v={pedido.group(1)} y el archivo es {huella}: "
           "quien ya lo tuviera guardado se quedaba con el viejo (ya corregido en "
           "script.js, pero hay que subirle la versión en las páginas)")

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
