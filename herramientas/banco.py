# -*- coding: utf-8 -*-
"""Leer y tocar el banco de ejercicios que vive dentro de ejercicios-*.html.

El banco es un JSON incrustado en la página, y su formato no es uniforme: hay
ejercicios escritos con espacio tras la coma y otros sin él, mezclados en el
mismo archivo. Si se vuelca entero con json.dumps cambian 1.300 ejercicios de
golpe y el diff deja de servir para ver qué se ha tocado de verdad.

Por eso aquí no se reescribe el banco: se mete y se cambia por dentro, tema a
tema, dejando intacto todo lo que no se toca.

    import banco
    banco.lee('it')                      # el banco entero, como diccionario
    banco.inserta('it', 'irregulares', [ {...}, {...} ])
    banco.en_tema('it', 'irregulares', lambda txt: txt.replace(...))
"""
import io, json, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PISTAS = ("es", "it", "en")


def ruta(lang):
    return os.path.join(RAIZ, "ejercicios-%s.html" % lang)


def _rango(s):
    """Dónde empieza y acaba el objeto `topics` dentro de la página."""
    i = s.index("topics: {")
    k = s.index("{", i)
    d = 0
    for n, ch in enumerate(s[k:], k):
        if ch == "{":
            d += 1
        elif ch == "}":
            d -= 1
            if d == 0:
                return k, n + 1
    raise ValueError("no encuentro el banco")


def lee(lang):
    s = io.open(ruta(lang), encoding="utf-8").read()
    a, b = _rango(s)
    return json.loads(s[a:b])


def _lista(s, tema):
    """El trozo de texto de dentro de los corchetes de ese tema."""
    m = re.search(r'"%s": \{"generator": (?:true|false),"items": \[' % re.escape(tema), s)
    if not m:
        raise KeyError("el tema «%s» no está en este banco" % tema)
    ini = m.end()
    d = 1
    for n, ch in enumerate(s[ini:], ini):
        if ch == "[":
            d += 1
        elif ch == "]":
            d -= 1
            if d == 0:
                return ini, n
    raise ValueError("corchete sin cerrar en «%s»" % tema)


def en_tema(lang, tema, func):
    """Cambia el texto de un tema con la función que se le pase. Devuelve
    cuántos caracteres ha movido, para poder comprobar que hizo algo."""
    s = io.open(ruta(lang), encoding="utf-8").read()
    a, b = _lista(s, tema)
    nuevo = func(s[a:b])
    if nuevo == s[a:b]:
        return 0
    io.open(ruta(lang), "w", encoding="utf-8").write(s[:a] + nuevo + s[b:])
    return len(nuevo) - (b - a)


def inserta(lang, tema, items):
    """Añade ejercicios al final de un tema, sin tocar los que ya estaban."""
    if not items:
        return 0
    txt = ",".join(json.dumps(it, ensure_ascii=False) for it in items)
    def mete(viejo):
        return (viejo + "," + txt) if viejo.strip() else txt
    en_tema(lang, tema, mete)
    return len(items)


def _objetos(txt):
    """Trocea la lista de un tema en los textos de cada ejercicio."""
    fuera, d, ini, dentro, esc = [], 0, None, False, False
    for n, ch in enumerate(txt):
        if dentro:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                dentro = False
            continue
        if ch == '"':
            dentro = True
        elif ch == "{":
            if d == 0:
                ini = n
            d += 1
        elif ch == "}":
            d -= 1
            if d == 0:
                fuera.append((ini, n + 1))
    return fuera


def por_item(lang, tema, func):
    """Pasa cada ejercicio por `func`. Si devuelve un diccionario distinto, se
    reescribe SOLO ese ejercicio, con el mismo estilo que tenía; los demás se
    quedan byte a byte como estaban. Si devuelve False, se borra."""
    cambiados = [0]

    def trabaja(txt):
        out, ult = [], 0
        for a, b in _objetos(txt):
            crudo = txt[a:b]
            it = json.loads(crudo)
            nuevo = func(dict(it))
            if nuevo is None or nuevo == it:
                continue
            if nuevo is False:
                # se lleva también la coma que lo separaba del anterior
                corte = a - 1 if a > 0 and txt[a - 1] == "," else a
                out.append(txt[ult:corte])
                ult = b if corte == a else b
                cambiados[0] += 1
                continue
            sep = (",", ": ") if '", "' not in crudo else (", ", ": ")
            out.append(txt[ult:a])
            out.append(json.dumps(nuevo, ensure_ascii=False, separators=sep))
            ult = b
            cambiados[0] += 1
        out.append(txt[ult:])
        return "".join(out)

    en_tema(lang, tema, trabaja)
    return cambiados[0]
