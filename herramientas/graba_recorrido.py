# -*- coding: utf-8 -*-
"""Graba el vídeo de la web por dentro que sale en la bienvenida.

    python3 herramientas/graba_recorrido.py            # los seis vídeos
    python3 herramientas/graba_recorrido.py it movil   # solo uno

Necesita el sitio servido en local (python3 -m http.server 8947) y ffmpeg.
Sale una alumna inventada (Sara) con un Firebase de mentira: ningún dato real.
Recorre portada → Mis clases → la clase 540 con dos ejercicios → su lectura →
«Cinco minutos» → la teoría, con un rótulo en cada paso. Se graba con capturas
del navegador y se quitan los momentos de carga entre páginas. Deja
bienvenida/recorrido-[movil-]XX.mp4 y su primera imagen, portada-[movil-]XX.jpg.
Si cambia el aspecto de la web, se vuelve a pasar.
"""
import subprocess
import sys, os, shutil, tempfile, datetime
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from firebase_falso import monta
from playwright.sync_api import sync_playwright


def mas(d): return (datetime.date.today() + datetime.timedelta(days=d)).isoformat()

def db(pista):
    em = "sara@demo.com"
    return {em: {"email": em, "nombre": "Sara", "idioma": pista, "activo": True, "clases": [
        {"id": "presente", "fecha": mas(-35), "nota": ""},
        {"id": "gustar", "fecha": mas(-28), "nota": ""},
        {"rapida": {"rid": "r1", "titulo": "Repaso: gustar", "repasoDe": "gustar", "temas": [], "extra": [], "deberes": ""}, "fecha": mas(-24), "nota": ""},
        {"id": "por-para", "fecha": mas(-21), "nota": ""},
        {"id": "formas-pasado", "fecha": mas(-14), "nota": ""},
        {"id": "si-tuviera", "fecha": mas(-7), "nota": ""},
        {"rapida": {"rid": "r2", "titulo": "Repaso: si tuviera", "repasoDe": "si-tuviera", "temas": [], "extra": [], "deberes": ""}, "fecha": mas(-5), "nota": ""},
        {"rapida": {"rid": "l1", "titulo": "Lectura: Si tuviera dinero…", "lecturaDe": "si-tuviera", "temas": [], "extra": [], "deberes": ""}, "fecha": mas(-4), "nota": ""},
        {"id": "cuando-llegues", "fecha": mas(2), "nota": ""},
    ]}}


if len(sys.argv) == 1:
    for modo in ("", "movil", "escenas", "movil-escenas", "fotos"):
        for l in ("it", "en", "es"):
            subprocess.run([sys.executable, __file__, l] + ([modo] if modo else []), check=True)
    sys.exit(0)

P = sys.argv[1] if len(sys.argv) > 1 else "it"
B = os.environ.get("BASE", "http://127.0.0.1:8947") + "/"
OUT = os.path.join(os.path.dirname(AQUI), "bienvenida")
MODO = sys.argv[2] if len(sys.argv) > 2 else ""
MOVIL = MODO in ("movil", "movil-escenas")
# «escenas»: el mismo recorrido en el ordenador, sin rótulos (el texto lo pone
# la página), cortado en un vídeo por capítulo: escena-<nombre>-XX.mp4
# «movil-escenas»: lo mismo en el móvil (escena-movil-<nombre>-XX.mp4).
# «fotos»: fotos fijas de la práctica libre por nivel, por tema y cursos
# (practica-<modo>-XX.jpg).
ESCENAS = MODO in ("escenas", "movil-escenas")
ORDENADOR = ESCENAS and not MOVIL
W, H = (390, 844) if MOVIL else (1280, 800)
DSF = 2 if MOVIL else 1
SUF = ("movil-" if MOVIL else "") + P

ROT = {
  "it": ["Il quaderno delle tue lezioni", "Ogni lezione che hai fatto, con la sua data",
         "La spiegazione, nella tua lingua", "Esercizi che si correggono da soli",
         "Una lettura scritta per quella lezione", "Cinque minuti per ripassare le tue lezioni",
         "E tutta la teoria, quando ti serve"],
  "en": ["The notebook of your lessons", "Every lesson you've had, with its date",
         "The explanation, in your language", "Exercises that mark themselves",
         "A reading written for that lesson", "Five minutes to review your lessons",
         "And all the theory, whenever you need it"],
  "es": ["El cuaderno de tus clases", "Cada clase que has dado, con su fecha",
         "La explicación de cada clase", "Ejercicios que se corrigen solos",
         "Una lectura escrita para esa clase", "Cinco minutos para repasar tus clases",
         "Y toda la teoría, cuando la necesites"],
}[P]

# Un ratón dibujado (Playwright no enseña el de verdad) y el rótulo de abajo.
# La posición del ratón pasa de una página a otra por sessionStorage.
INIT = r"""
(() => {
  localStorage.setItem('__falso_usuario','sara@demo.com');
  localStorage.setItem('jn_access_granted','true');
  localStorage.setItem('jn_student_email','sara@demo.com');
  localStorage.setItem('jn_nombre','Sara');
  localStorage.setItem('jn_track','%s');
  addEventListener('DOMContentLoaded', () => {
    const st = document.createElement('style');
    st.textContent = `
      #vx-cur{position:fixed;z-index:99999;left:0;top:0;width:26px;height:26px;pointer-events:none;
        transform:translate(var(--x),var(--y));filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
      #vx-clic{position:fixed;z-index:99998;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%%;
        background:rgba(242,171,39,.45);pointer-events:none;transform:scale(.2);opacity:0}
      #vx-clic.va{animation:vxc .45s ease-out}
      @keyframes vxc{0%%{transform:scale(.2);opacity:1}100%%{transform:scale(1.3);opacity:0}}
      #vx-rot{position:fixed;z-index:99997;left:50%%;bottom:30px;transform:translate(-50%%,10px);opacity:0;
        background:rgba(35,44,79,.94);color:#fff;font:700 21px Nunito,sans-serif;padding:12px 24px;border-radius:999px;
        box-shadow:0 8px 24px rgba(0,0,0,.25);transition:opacity .35s,transform .35s;white-space:nowrap}
      #vx-rot.si{opacity:1;transform:translate(-50%%,0)}
      .cita-boton,.apuntes-fab,#apuntes-fab{visibility:hidden!important}` + (innerWidth < 600 ? `
      #vx-rot{bottom:96px;font-size:16px;padding:10px 18px;white-space:normal;text-align:center;width:max-content;max-width:86%%}
      #vx-cur{width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%%;background:rgba(35,44,79,.28);border:2px solid #fff;filter:none}
      #vx-cur svg{display:none}
      .apu-boton{visibility:hidden!important}` : '');
    document.head.appendChild(st);
    const c = document.createElement('div'); c.id = 'vx-cur';
    c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.6 14 L17.5 14 Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    const k = document.createElement('div'); k.id = 'vx-clic';
    const r = document.createElement('div'); r.id = 'vx-rot';
    document.body.append(c, k, r);
    const pos = JSON.parse(sessionStorage.getItem('vx') || '[640,400]');
    const pon = (x, y) => { c.style.setProperty('--x', x + 'px'); c.style.setProperty('--y', y + 'px'); sessionStorage.setItem('vx', JSON.stringify([x, y])); };
    pon(pos[0], pos[1]);
    addEventListener('mousemove', e => pon(e.clientX, e.clientY), true);
    addEventListener('mousedown', e => { k.style.left = e.clientX + 'px'; k.style.top = e.clientY + 'px'; k.classList.remove('va'); void k.offsetWidth; k.classList.add('va'); }, true);
    window.vxRot = t => { if(!t){ r.classList.remove('si'); return; } r.textContent = t; r.classList.add('si'); };
  });
})();
""" % P

if MODO == "fotos":
    from PIL import Image
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        c = br.new_context(viewport={"width": 1280, "height": 800})
        monta(c, db(P))
        c.add_init_script("localStorage.setItem('__falso_usuario','sara@demo.com');localStorage.setItem('jn_access_granted','true');"
                          "localStorage.setItem('jn_student_email','sara@demo.com');localStorage.setItem('jn_nombre','Sara');"
                          "localStorage.setItem('jn_track','%s');" % P)
        pg = c.new_page()
        for modo in ("nivel", "tema", "curso"):
            pg.goto(B + "ejercicios-%s.html?modo=%s" % (P, modo)); pg.wait_for_timeout(1500)
            pg.add_style_tag(content=".apu-boton{visibility:hidden!important}")
            pg.evaluate("scrollTo(0, 150)"); pg.wait_for_timeout(300)
            tmp = os.path.join(OUT, "_foto.png"); pg.screenshot(path=tmp)
            Image.open(tmp).convert("RGB").save(os.path.join(OUT, "practica-%s-%s.jpg" % (modo, P)), quality=78, optimize=True)
            os.remove(tmp)
        br.close()
    print("ok fotos", P)
    sys.exit(0)

with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    tmp = tempfile.mkdtemp(prefix="recorrido-")
    c = br.new_context(viewport={"width": W, "height": H}, device_scale_factor=DSF, has_touch=False)
    monta(c, db(P))
    c.add_init_script(INIT)
    pg = c.new_page()
    pg.on("pageerror", lambda e: print("JS", e))
    import base64
    cdp = c.new_cdp_session(pg)
    fotos = []
    tramo = {"n": 0, "on": True}
    def foto(ev):
        if tramo["on"]: fotos.append((ev["metadata"]["timestamp"], ev["data"], tramo["n"]))
        try: cdp.send("Page.screencastFrameAck", {"sessionId": ev["sessionId"]})
        except Exception as e: print("ack", e)
    cdp.on("Page.screencastFrame", foto)
    def empieza():
        cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 92, "maxWidth": W * DSF, "maxHeight": H * DSF, "everyNthFrame": 1})
    m = pg.mouse
    estado = {"x": W / 2, "y": H / 2}

    def ve(sel_o_loc, pasos=28):
        loc = pg.locator(sel_o_loc) if isinstance(sel_o_loc, str) else sel_o_loc
        loc = loc.first
        loc.wait_for(state="visible")
        b = loc.bounding_box()
        fijo = loc.evaluate("e => !!e.closest('.menu, .panel-menu, aside')")
        if not fijo and (b["y"] < 90 or b["y"] + b["height"] > H - 150):
            baja(b["y"] + b["height"] / 2 - H * 0.45, 700); pg.wait_for_timeout(150)
            b = loc.bounding_box()
        x, y = b["x"] + min(b["width"] / 2, 60), b["y"] + b["height"] / 2
        m.move(x, y, steps=pasos); estado.update(x=x, y=y)
        return loc

    def clic(sel_o_loc, pasos=28, antes=250):
        loc = ve(sel_o_loc, pasos)
        pg.wait_for_timeout(antes)
        m.down(); m.up()
        return loc

    def rot(i):
        if ESCENAS: return
        pg.evaluate("t => window.vxRot && window.vxRot(t)", ROT[i] if i is not None else None)

    def baja(px, ms=900):
        pg.evaluate("([px,ms]) => new Promise(ok => { const y0 = scrollY, t0 = performance.now();"
                    " (function f(t){ const k = Math.min(1,(t-t0)/ms), e = k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;"
                    " scrollTo(0, y0 + px*e); k<1 ? requestAnimationFrame(f) : ok(); })(t0); })", [px, ms])

    def espera(ms): pg.wait_for_timeout(ms)

    import time
    fin_tramo = {}
    escenas = []  # [nombre, desde, hasta]
    def marca(nombre): escenas.append([nombre, time.time(), None])
    def cierra():
        if escenas and escenas[-1][2] is None: escenas[-1][2] = time.time()
    def corta(cerrar=True):
        if cerrar: cierra()
        tramo["on"] = False; fin_tramo[tramo["n"]] = time.time()
    def sigue(ms=650):
        pg.wait_for_load_state("load"); pg.wait_for_timeout(ms)
        tramo["n"] += 1; tramo["on"] = True

    # 1 · portada
    pg.goto(B + "index.html"); espera(1300)
    empieza(); espera(200); marca("portada")
    m.move(*((200, 420) if MOVIL else (700, 330))); espera(200); rot(0); espera(2200)
    if ORDENADOR:
        # la clase es por videollamada: el botón para entrar
        ve(".hola-btn-linea", 30); espera(1500)
    # 2 · Mis clases
    clic('.riel-btn[data-sec="clases"]'); corta(); sigue(); marca("reserva" if ORDENADOR else "clases")
    if ORDENADOR:
        # reservar: el botón de la agenda
        ve(".cita-barra", 30); espera(1900); cierra(); marca("clases")
    rot(1); espera(400)
    ve(pg.locator(".cl-enlace", has_text="Si tuviera"), 30); espera(1500)
    # 3 · la clase
    clic(pg.locator(".cl-enlace", has_text="Si tuviera"), 8, 200); corta(); sigue(); marca("clase")
    rot(2); espera(1500); baja(330, 1200); espera(1300)
    rot(3)
    blk = pg.locator('.exercise-block[data-exid="si1"]')
    top = blk.evaluate("e => e.getBoundingClientRect().top")
    baja(top - 250, 1300); espera(400)
    clic(blk.locator(".exercise-input"), 30, 150)
    pg.keyboard.type("hablara", delay=110); espera(300)
    clic(blk.locator(".exercise-check"), 18, 150); espera(1100)
    blk3 = pg.locator('.exercise-block[data-exid="si3"]')
    clic(blk3.locator('.option-btn[data-value="fuera"]'), 26, 200); espera(1500)
    if ORDENADOR:
        # los apuntes de la clase
        cierra(); marca("notas")
        clic(".apu-boton", 30, 250); espera(700)
        clic(pg.locator(".apu-panel textarea").first, 24, 200)
        pg.keyboard.type("Si tuviera tiempo, leería más.", delay=70); espera(1600)
    # 4 · la lectura (desde Mis clases)
    corta(); pg.go_back(); pg.wait_for_load_state("load"); pg.wait_for_timeout(450); pg.evaluate("scrollTo(0,0)"); sigue(); rot(None)
    if ORDENADOR:
        # los ejercicios de la clase, en el botón dorado de su fila
        clic(pg.locator('a.cl-hija[href*="repaso=si-tuviera"]'), 30, 300); corta(); sigue(900); marca("repaso")
        for _ in range(2):
            b = pg.locator("#ex-hub-container .exercise-block:visible").first
            r = (b.get_attribute("data-answer") or "").split("|")[0]
            if b.locator('.option-btn[data-value="%s"]' % r).count():
                clic(b.locator('.option-btn[data-value="%s"]' % r), 30, 300)
            elif b.locator(".exercise-input").count():
                clic(b.locator(".exercise-input"), 30, 200); pg.keyboard.type(r, delay=90); espera(200)
                clic(b.locator(".exercise-check"), 16, 150)
            espera(1500)
        corta(); pg.go_back(); pg.wait_for_load_state("load"); pg.wait_for_timeout(450); pg.evaluate("scrollTo(0,0)"); sigue(); rot(None)
    clic(pg.locator('a.cl-hija[href*="lectura"]'), 30, 300); corta(); sigue(); marca("lectura")
    rot(4); espera(900)
    clic(".lec-pal", 30, 250); espera(1600)
    q1 = pg.locator(".exercise-block").first
    clic(q1.locator(".option-btn", has_text="No, nunca"), 30, 300); espera(1600)
    # 5 · cinco minutos
    corta(); pg.go_back(); pg.wait_for_load_state("load"); pg.wait_for_timeout(450); pg.evaluate("scrollTo(0,0)"); sigue(); rot(None)
    clic("a.cl-hoy", 30, 300); corta(); sigue(1300); marca("cinco")
    rot(5); espera(800)
    b0 = pg.locator("#ex-hub-container .exercise-block:visible").first
    ans = (b0.get_attribute("data-answer") or "").split("|")[0]
    if b0.locator(".option-btn").count():
        clic(b0.locator('.option-btn[data-value="%s"]' % ans) if b0.locator('.option-btn[data-value="%s"]' % ans).count() else b0.locator(".option-btn").first, 30, 300)
    else:
        clic(b0.locator(".exercise-input"), 30, 200); pg.keyboard.type(ans, delay=100); espera(250)
        clic(b0.locator(".exercise-check"), 16, 150)
    espera(1800)
    if ORDENADOR:
        # práctica libre: cursos, por nivel, por tema
        cierra(); marca("practica")
        clic('.riel-btn[data-sec="ejer"]', 30, 250); espera(700)
        clic('#panel-ejer a[data-q="modo=curso"]', 20, 250); corta(False); sigue(900)
        baja(320, 1300); espera(1900)
    # 6 · la teoría
    rot(None); cierra(); marca("teoria")
    clic('.riel-btn[data-sec="teoria"]', 30, 250); espera(700)
    grupo = pg.locator("#panel-teoria .panel-grupo").first
    clic(grupo.locator("button.panel-mat"), 20, 250); espera(600)
    clic(grupo.locator('a[data-base="subjuntivo"]'), 20, 250); corta(False); sigue()
    rot(6); espera(1200); baja(420, 1600); espera(2200)
    rot(None); espera(500)
    fin_tramo[tramo["n"]] = time.time(); cierra()
    cdp.send("Page.stopScreencast")
    c.close(); br.close()
    # cada foto dura hasta la siguiente; ffmpeg las junta a 30 por segundo
    lista = []
    reloj, acum = [], 0.0  # en qué segundo del vídeo sale cada foto
    for i, (t, d, tr) in enumerate(fotos):
        n = os.path.join(tmp, "f%05d.jpg" % i)
        open(n, "wb").write(base64.b64decode(d))
        if i + 1 < len(fotos) and fotos[i + 1][2] == tr: dur = fotos[i + 1][0] - t
        else: dur = max(0.04, fin_tramo.get(tr, t + 0.5) - t)  # corte: la página nueva entra ya pintada
        if i == 0: open(os.path.join(tmp, "portada.jpg"), "wb").write(base64.b64decode(d))
        reloj.append(acum); acum += dur
        lista.append("file '%s'\nduration %.4f" % (n, dur))
    lista.append("file '%s'" % n)
    open(os.path.join(tmp, "lista.txt"), "w").write("\n".join(lista) + "\n")
    print(len(fotos), "fotos,", round(fotos[-1][0] - fotos[0][0], 1), "s")
    from PIL import Image
    if ESCENAS:
        # todo junto con buena calidad, y de ahí un vídeo por escena
        entero = os.path.join(tmp, "entero.mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", os.path.join(tmp, "lista.txt"),
                        "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "14", "-an", entero], check=True)
        def en_video(w):
            for i, (t, _, _) in enumerate(fotos):
                if t >= w: return reloj[i]
            return reloj[-1] + 0.5
        for nombre, desde, hasta in escenas:
            a, b = en_video(desde), en_video(hasta)
            sal = os.path.join(OUT, "escena-%s%s-%s.mp4" % ("movil-" if MOVIL else "", nombre, P))
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "%.3f" % a, "-i", entero, "-t", "%.3f" % (b - a),
                            "-vf", "format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "26",
                            "-movflags", "+faststart", "-an", sal], check=True)
            img = os.path.join(tmp, "e.png")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", sal, "-frames:v", "1", img], check=True)
            Image.open(img).convert("RGB").save(os.path.join(OUT, "escena-%s%s-%s.jpg" % ("movil-" if MOVIL else "", nombre, P)), quality=76, optimize=True)
            print("  %-8s %.1f s" % (nombre, b - a))
        shutil.rmtree(tmp, ignore_errors=True)
        print("ok escenas", P)
        sys.exit(0)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", os.path.join(tmp, "lista.txt"),
                    "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "27" if MOVIL else "26",
                    "-movflags", "+faststart", "-an", os.path.join(OUT, "recorrido-%s.mp4" % SUF)], check=True)
    Image.open(os.path.join(tmp, "portada.jpg")).save(os.path.join(OUT, "portada-%s.jpg" % SUF), quality=78, optimize=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print("ok", SUF)
