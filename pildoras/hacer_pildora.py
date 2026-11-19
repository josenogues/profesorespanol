"""Píldora vertical: guion_<nombre>.py -> voz (Azure) -> fotogramas -> mp4.
Uso: python3 hacer_pildora.py burro it            (vídeo con subtítulos en italiano)
     python3 hacer_pildora.py burro it 3,10,20    (solo capturas en esos segundos)
La voz se genera una vez por trozo en audio/<nombre>/<id>.mp3 y sirve para las tres versiones.
Sin AZURE_REGION (o sin clave) sale sin voz, con la duración estimada."""
import importlib, json, os, ssl, subprocess, sys, pathlib, urllib.request
from xml.sax.saxutils import escape
from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).parent
REPO = AQUI.parent
FPS = 25
ARGS = [a for a in sys.argv[1:] if a != "--web"]
WEB = "--web" in sys.argv
NOMBRE, SUBS = ARGS[0], ARGS[1]
CAPTURAS = ARGS[2] if len(ARGS) > 2 else None
G = importlib.import_module(f"guion_{NOMBRE}")
ESCENAS = G.escenas(SUBS, web=WEB)
AUDIO = AQUI / "audio" / NOMBRE
AUDIO.mkdir(parents=True, exist_ok=True)
SALIDA = AQUI / "videos" / f"pildora-{NOMBRE}-{SUBS}{'-web' if WEB else ''}.mp4"
BANDERA = {"it": "it", "es": "es", "en": "gb"}

# Voces de Azure: (código, voz, velocidad)
VOCES = {"it": ("it-IT", "it-IT-DiegoNeural", "0%"),
         "es": ("es-ES", "es-ES-AlvaroNeural", "-10%"),
         "en": ("en-GB", "en-GB-RyanNeural", "+4%")}

def voz_azure(tr, destino):
    region = os.environ.get("AZURE_REGION")
    if not region:
        return False
    loc, voz, vel = VOCES[tr["lang"]]
    ssml = (f'<speak version="1.0" xml:lang="{loc}"><voice name="{voz}">'
            f'<prosody rate="{vel}">{escape(tr["text"])}</prosody></voice></speak>')
    req = urllib.request.Request(
        f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1", data=ssml.encode(),
        headers={"Content-Type": "application/ssml+xml",
                 "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
                 "Ocp-Apim-Subscription-Key": "la-pone-el-proxy", "User-Agent": "pildoras"})
    ctx = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
    with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
        destino.write_bytes(r.read())
    return True

def duracion_audio(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout
    return float(out.strip())

def estimar(tr):
    if tr["lang"] == "pausa":
        return tr["dur"]
    return len(tr["text"]) / (11.5 if tr["lang"] == "es" else 16) + 0.15

# 1. voz y línea de tiempo
t = 0.0
escenas, trozos, cues, dur, pistas = [], [], {}, {}, []
for i, e in enumerate(ESCENAS):
    ini = t
    t += 0.15 if i else 0.0
    for tr in e["trozos"]:
        mp3 = AUDIO / f"{tr['id']}.mp3"
        if tr["lang"] != "pausa" and not mp3.exists() and not CAPTURAS:
            voz_azure(tr, mp3)
        d = duracion_audio(mp3) if mp3.exists() else estimar(tr)
        cues[tr["id"]] = t
        dur[tr["id"]] = d
        trozos.append({"id": tr["id"], "lang": tr["lang"], "text": tr.get("text", ""),
                       "sub": tr.get("sub", {}).get(SUBS, tr.get("text", "")), "ini": t, "fin": t + d})
        if mp3.exists():
            pistas.append((t, mp3))
        # tras lo que se aprende, un respiro para leerlo e interiorizarlo
        t += d + tr.get("pausa", 0.5 if tr["lang"] == "es" else 0.08)
    t += e.get("respiro", 0.35)
    escenas.append({"id": e["id"], "ini": ini, "fin": t})
    t -= 0.06
total = t + 0.06
tl = {"escenas": escenas, "trozos": trozos, "cues": cues, "dur": dur, "total": total,
      "banderas": {k: f"file://{REPO}/banderas/{v}.svg" for k, v in BANDERA.items()}}

# 2. página
html = (AQUI / "pildora.html").read_text()
bloques = "\n".join(
    f'<section class="escena {e.get("fondo","")}" id="e-{e["id"]}">{e["html"]}</section>' for e in ESCENAS)
html = (html.replace("ESCENAS", bloques).replace("TIMELINE", json.dumps(tl))
        .replace("REPO/", f"file://{REPO}/"))
pagina = AQUI / "tmp" / f"pagina-{NOMBRE}-{SUBS}.html"
pagina.parent.mkdir(exist_ok=True)
pagina.write_text(html)
print([(e["id"], round(e["ini"], 1), round(e["fin"], 1)) for e in escenas])
print(f"duración: {total:.1f} s, {len(pistas)} audios")

# 3. fotogramas -> ffmpeg
with sync_playwright() as p:
    nav = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--no-sandbox"])
    pg = nav.new_page(viewport={"width": 540, "height": 960}, device_scale_factor=2)
    pg.goto(f"file://{pagina}")
    pg.evaluate("document.fonts.ready")
    if CAPTURAS:
        for s in CAPTURAS.split(","):
            pg.evaluate(f"render({s})")
            pg.screenshot(path=str(AQUI / "tmp" / f"v-{SUBS}-{s}.png"))
        sys.exit()
    sfx = pg.evaluate("sfxList()")
    mudo = AQUI / "tmp" / "mudo.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS),
                           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "23",
                           "-pix_fmt", "yuv420p", str(mudo)], stdin=subprocess.PIPE)
    n = int(total * FPS)
    for i in range(n):
        pg.evaluate(f"render({i / FPS})")
        ff.stdin.write(pg.screenshot(type="jpeg", quality=92))
    nav.close()
    ff.stdin.close(); ff.wait()

# 4. audio: voz + efectos de sonido (sonidos/*.wav, fabricados con sonidos.py)
VOL = {"rebuzno": 0.55, "tiza": 0.35, "whoosh": 0.45, "caida": 0.5}
for x in sfx:
    if 0 <= x["t"] < total:
        pistas.append((x["t"], AQUI / "sonidos" / f"{x['n']}.wav", VOL.get(x["n"], 0.6)))
if pistas:
    entradas, filtros = [], []
    for k, pista in enumerate(pistas):
        ini, archivo = pista[0], pista[1]
        vol = pista[2] if len(pista) > 2 else 1.0
        entradas += ["-i", str(archivo)]
        ms = int(ini * 1000)
        filtros.append(f"[{k+1}:a]aformat=sample_rates=44100:channel_layouts=mono,volume={vol},adelay={ms}|{ms}[a{k}]")
    mezcla = "".join(f"[a{k}]" for k in range(len(pistas)))
    filtro = ";".join(filtros) + f";{mezcla}amix=inputs={len(pistas)}:normalize=0,alimiter=limit=0.9,apad[voz]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mudo), *entradas,
                    "-filter_complex", filtro, "-map", "0:v", "-map", "[voz]",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", str(SALIDA)], check=True)
else:
    mudo.replace(SALIDA)
print("listo:", SALIDA)
