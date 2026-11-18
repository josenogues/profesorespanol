"""Fabrica los efectos de sonido de las píldoras (sintetizados, sin descargar nada).
python3 sonidos.py  ->  sonidos/*.wav"""
import pathlib, wave
import numpy as np

SR = 44100
DIR = pathlib.Path(__file__).parent / "sonidos"
DIR.mkdir(exist_ok=True)
rng = np.random.default_rng(7)


def env(n, a=0.005, r=0.1):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    return e * np.exp(-t / r)


def tono(f0, f1, dur, forma="sin"):
    n = int(dur * SR)
    f = np.geomspace(f0, f1, n)
    fase = 2 * np.pi * np.cumsum(f) / SR
    if forma == "saw":
        return 2 * ((fase / (2 * np.pi)) % 1) - 1
    if forma == "tri":
        return 2 * np.abs(2 * ((fase / (2 * np.pi)) % 1) - 1) - 1
    return np.sin(fase)


def ruido(dur):
    return rng.uniform(-1, 1, int(dur * SR))


def paso_bajo(x, k):
    y = np.convolve(x, np.ones(k) / k, mode="same")
    return y


def guarda(nombre, x, vol=0.8):
    x = x / (np.max(np.abs(x)) + 1e-9) * vol
    datos = (x * 32767).astype(np.int16)
    with wave.open(str(DIR / f"{nombre}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(datos.tobytes())


# pop: burbuja que sale (globos, textos que saltan)
d = 0.12
guarda("pop", tono(900, 320, d) * env(int(d * SR), 0.002, 0.03), 0.6)

# whoosh: la cámara se aleja / cambio de escena
d = 0.45
n = int(d * SR)
w = paso_bajo(ruido(d), 9) * np.sin(np.linspace(0, np.pi, n)) ** 2
guarda("whoosh", w, 0.5)

# golpe: algo cae (el burro sobre la barra), con un rebote
d = 0.5
g = tono(180, 45, d) * env(int(d * SR), 0.002, 0.12) + 0.3 * paso_bajo(ruido(d), 30) * env(int(d * SR), 0.001, 0.03)
guarda("golpe", g, 0.9)

# boing: rebote cómico
d = 0.45
b = tono(140, 420, d, "tri") * (1 + 0.5 * np.sin(2 * np.pi * 18 * np.arange(int(d * SR)) / SR)) * env(int(d * SR), 0.003, 0.18)
guarda("boing", b, 0.5)

# coz: golpe seco + silbido
d = 0.3
k = paso_bajo(ruido(d), 4) * env(int(d * SR), 0.001, 0.02) + 0.6 * tono(300, 90, d) * env(int(d * SR), 0.001, 0.05)
guarda("coz", k, 0.8)

# rebuzno: «hii-haa» del burro
partes = []
for f0, f1, dur in [(620, 760, 0.28), (230, 190, 0.34), (640, 780, 0.26), (240, 200, 0.38)]:
    n = int(dur * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.04 * np.sin(2 * np.pi * 9 * t)
    f = np.geomspace(f0, f1, n) * vib
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    x = np.sign(x) * np.abs(x) ** 0.4          # más áspero
    x = paso_bajo(x, 3) * np.sin(np.linspace(0, np.pi, n)) ** 0.5
    partes.append(x)
guarda("rebuzno", np.concatenate(partes), 0.45)

# sello: golpe de tampón (sellos y el lema)
d = 0.35
s = paso_bajo(ruido(d), 12) * env(int(d * SR), 0.001, 0.04) + 0.8 * tono(110, 60, d) * env(int(d * SR), 0.001, 0.08)
guarda("sello", s, 0.9)

# ding: acierto (✓)
d = 0.6
t = np.arange(int(d * SR)) / SR
dg = (np.sin(2 * np.pi * 1320 * t) + 0.5 * np.sin(2 * np.pi * 1980 * t)) * env(len(t), 0.002, 0.18)
guarda("ding", dg, 0.45)

# tiza: rasgueo corto en la pizarra
d = 0.5
n = int(d * SR)
tz = (ruido(d) - paso_bajo(ruido(d), 6)) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * np.arange(n) / SR)) * np.sin(np.linspace(0, np.pi, n))
guarda("tiza", tz, 0.25)

# caida: silbido que baja (letras al barranco)
d = 0.9
c = tono(1400, 180, d) * np.linspace(1, 0.2, int(d * SR)) * env(int(d * SR), 0.01, 0.6)
guarda("caida", c, 0.35)

print("sonidos en", DIR)
