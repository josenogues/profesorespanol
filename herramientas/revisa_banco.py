# -*- coding: utf-8 -*-
"""Revisa el banco de ejercicios de las tres pistas, sin navegador.

    python3 herramientas/revisa_banco.py

Un ejercicio mal escrito no da error en ningún sitio: sale en la tanda, el
alumno lo contesta bien y la página se lo da por malo. Esto busca justo eso.

  · que la respuesta de una de elegir esté entre las opciones
  · que no haya etiquetas HTML dentro de una respuesta escrita
  · que una respuesta con tilde admita también la versión sin tilde, porque
    el motor no quita tildes y media clase escribe desde el móvil
  · que el mismo ejercicio no esté dos veces en el mismo tema
  · que los grupos (g) existan en temas.js, o el tema fino sale vacío
  · que el nivel sea uno de los que entiende el filtro
"""
import collections, io, json, os, re, sys, unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import banco

RAIZ = banco.RAIZ
NIVELES = {"A1", "A2", "B1", "B2", "C1"}
TECLEADOS = ("fill", "translate", "correct", "transform")
hallazgos = collections.defaultdict(list)


def apunta(cat, txt):
    hallazgos[cat].append(txt)


def sin_tildes(s):
    s = s.replace("ñ", "\x00").replace("Ñ", "\x01")
    s = "".join(c for c in unicodedata.normalize("NFD", s)
                if unicodedata.category(c) != "Mn")
    return s.replace("\x00", "ñ").replace("\x01", "Ñ")


def limpio(s):
    return re.sub(r"<[^>]+>", "", s or "").strip().lower()


# Los temas finos de temas.js («por y para», «gustar»…) no son un tema del
# banco: son un grupo dentro de otro. Si ese grupo no tiene ni un ejercicio,
# el alumno pulsa «practicar» y se encuentra la página vacía, sin que nada
# avise. Pasó con tres de ellos.
temas = io.open(os.path.join(RAIZ, "temas.js"), encoding="utf-8").read()
FINOS = {}
for m in re.finditer(r"\{ id:'([a-z0-9-]+)'([^}]*?)nombre:", temas, re.S):
    ej = re.search(r"ejercicios:'([a-z0-9-]+)'", m.group(2))
    g = re.search(r"g:'([a-z0-9-]+)'", m.group(2))
    if ej and g:
        FINOS[m.group(1)] = (ej.group(1), g.group(1))

for L in banco.PISTAS:
    b = banco.lee(L)
    for tema, v in b.items():
        items = v.get("items", [])
        if not items and not v.get("generator"):
            apunta("temas vacíos", f"{L}: {tema}")
        visto = collections.Counter()
        for it in items:
            quien = f"{L}/{tema}: «{limpio(it.get('prompt'))[:50]}»"
            tipo = it.get("type")
            if it.get("level") not in NIVELES:
                apunta("nivel raro", f"{quien} → {it.get('level')}")
            if not (it.get("prompt") or "").strip():
                apunta("sin enunciado", quien)

            if tipo == "choice":
                ops = it.get("options") or []
                if len(ops) < 2:
                    apunta("de elegir con menos de dos opciones", quien)
                if len(set(ops)) != len(ops):
                    apunta("opciones repetidas", quien)
                if it.get("answer") not in ops:
                    apunta("la respuesta no está entre las opciones",
                           f"{quien} → {it.get('answer')}")
            elif tipo == "match":
                if len(it.get("pairs") or []) < 2:
                    apunta("emparejar con menos de dos parejas", quien)
            elif tipo == "order":
                palabras = sorted(it.get("words") or [])
                # la respuesta puede traer variantes con y sin tilde
                if not any(sorted(alt.split()) == palabras
                           for alt in (it.get("answer") or "").split("|")):
                    apunta("ordenar: las palabras no dan la respuesta",
                           f"{quien} → {it.get('answer')}")
            elif tipo in TECLEADOS:
                r = it.get("answer") or ""
                if not r.strip():
                    apunta("sin respuesta", quien)
                if "<" in r:
                    apunta("respuesta con HTML dentro", f"{quien} → {r}")
                if tema != "fonetica" and "|" not in r and sin_tildes(r) != r:
                    apunta("respuesta con tilde y sin alternativa sin tilde",
                           f"{quien} → {r}")
            else:
                apunta("tipo desconocido", f"{quien} → {tipo}")
            if it.get("answer") is not None:
                visto[(limpio(it.get("prompt")), it.get("answer"))] += 1
        for k, n in visto.items():
            if n > 1:
                apunta("el mismo ejercicio dos veces en un tema",
                       f"{L}/{tema}: «{k[0][:50]}» ×{n}")

for L in banco.PISTAS:
    b = banco.lee(L)
    for tid, (tema, g) in FINOS.items():
        n = len([i for i in b.get(tema, {}).get("items", []) if i.get("g") == g])
        if n == 0:
            apunta("tema fino sin un solo ejercicio", f"{L}: {tid} (g={g} en {tema})")

total = sum(len(banco.lee(L)[t].get("items", []))
            for L in banco.PISTAS for t in banco.lee(L))
print(f"{total} ejercicios revisados en las tres pistas\n")
if not hallazgos:
    print("SIN HALLAZGOS")
    sys.exit(0)
for cat, xs in hallazgos.items():
    print(f"█ {cat} ({len(xs)})")
    for x in xs[:12]:
        print("   ", x)
    if len(xs) > 12:
        print(f"    ... y {len(xs) - 12} más")
    print()
sys.exit(1)
