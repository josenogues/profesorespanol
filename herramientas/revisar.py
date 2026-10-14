# -*- coding: utf-8 -*-
"""Revisión general del sitio, sin navegador: lo que se puede comprobar leyendo.

    python3 herramientas/revisar.py


Busca enlaces rotos, identificadores repetidos, versiones de caché que no
cuadran, temas de ejercicios que no existen, páginas huérfanas y el idioma
declarado de cada página. Las pruebas de siempre miran que las cosas
funcionen; esto mira que nada se haya quedado colgando.
"""
import glob, os, re, subprocess, sys
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
for bloque in clases.split("  {")[1:]:
    cid = re.search(r"id: '([a-z0-9-]+)'", bloque)
    pag = re.search(r"pagina: '([a-z0-9-]+)'", bloque)
    if not (cid and pag):
        continue
    pistas = re.search(r"pistas: \[([^\]]*)\]", bloque)
    ls = re.findall(r"'([a-z]{2})'", pistas.group(1)) if pistas else list(PISTAS)
    for L in ls:
        if f"{pag.group(1)}-{L}.html" not in EXISTE:
            apunta("clases.js roto", f"{cid.group(1)} → {pag.group(1)}-{L}.html")

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
idx = open(os.path.join(REPO, "search-index.js"), encoding="utf-8").read()
antes = idx
subprocess.run([sys.executable, os.path.join(REPO, "herramientas", "indexar.py")],
               capture_output=True, text=True)
ahora = open(os.path.join(REPO, "search-index.js"), encoding="utf-8").read()
if antes != ahora:
    apunta("índice del buscador", "estaba desfasado respecto a las páginas (ya regenerado)")

# ── J. páginas a las que no llega nadie ──────────────────────────────────
enlazadas = set()
for s in CUERPO.values():
    enlazadas |= {h.split("?")[0].split("#")[0] for h in re.findall(r'href="([^"]+\.html)[^"]*"', s)}
    for base in re.findall(r'data-base="([a-z0-9-]+)"', s):
        enlazadas |= {f"{base}-{L}.html" for L in PISTAS}
# Las dos muestras son propuestas de diseño a las que se llega por su URL
# a secas, para poder compararlas con la página de verdad. Si se aceptan, el
# diseño pasa a styles.css y estos apaños se borran; si no, se borran ellas.
SUELTAS_OK = {"index.html", "panel-profesor.html", "muestra-teoria.html"}
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
