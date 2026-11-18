# Dibujos propios de las píldoras (SVG), con el trazo de las portadas de los cursos:
# línea azul oscura redondeada, rellenos claros y un toque de amarillo.
# Cada función devuelve un <svg>; las partes que se animan llevan clase propia.

L = '#3A4570'      # línea
V = '#5B4FB8'      # violeta del logo
R = '#E04F96'      # rosa del logo
A = '#F2AB27'      # amarillo
G = '#c9cbe0'      # gris azulado (el burro)
C = '#eef0fb'      # claro
TR = f'stroke="{L}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"'


def burro(clase="burro"):
    """Burro de perfil mirando a la derecha. Patas traseras en .patas-tras (para la coz)."""
    return f'''<svg class="{clase}" viewBox="0 0 220 180" overflow="visible">
  <g class="cola"><path d="M46 92 C 28 96, 22 112, 26 128" fill="none" {TR}/>
    <path d="M26 124 C 18 130, 20 142, 28 140 C 34 142, 36 132, 30 126 Z" fill="{L}"/></g>
  <g class="patas-tras" style="transform-origin:62px 112px">
    <rect x="52" y="104" width="15" height="52" rx="7" fill="{G}" {TR}/>
    <rect x="70" y="106" width="15" height="50" rx="7" fill="{G}" {TR}/>
    <rect x="50" y="148" width="19" height="10" rx="4" fill="{L}"/><rect x="68" y="148" width="19" height="10" rx="4" fill="{L}"/></g>
  <rect x="120" y="106" width="15" height="50" rx="7" fill="{G}" {TR}/>
  <rect x="138" y="104" width="15" height="52" rx="7" fill="{G}" {TR}/>
  <rect x="118" y="148" width="19" height="10" rx="4" fill="{L}"/><rect x="136" y="148" width="19" height="10" rx="4" fill="{L}"/>
    <path d="M124 84 C 132 62, 148 44, 170 40 L 184 74 C 172 78, 166 90, 164 104 Z" fill="{G}" {TR}/>
    <path d="M128 76 l 3 -10 l 6 5 l 4 -11 l 6 5 l 5 -10 l 7 4" fill="none" {TR}/>
  <ellipse cx="100" cy="96" rx="60" ry="34" fill="{G}" {TR}/>
  <path d="M150 74 C 158 84, 160 96, 158 106" fill="none" stroke="{G}" stroke-width="8"/>
  <path d="M78 116 C 92 124, 116 124, 130 116" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>
  <g class="cabeza" style="transform-origin:150px 80px">
    <g class="orejas" style="transform-origin:176px 40px">
      <ellipse cx="168" cy="20" rx="8" ry="22" transform="rotate(-18 168 20)" fill="{G}" {TR}/>
      <ellipse cx="168" cy="22" rx="3.5" ry="14" transform="rotate(-18 168 22)" fill="{R}" opacity=".55"/>
      <ellipse cx="185" cy="20" rx="8" ry="22" transform="rotate(14 185 20)" fill="{G}" {TR}/>
      <ellipse cx="185" cy="22" rx="3.5" ry="14" transform="rotate(14 185 22)" fill="{R}" opacity=".55"/></g>
    <path d="M166 42 C 182 30, 200 38, 206 50 C 214 56, 220 68, 212 78 C 204 87, 186 85, 178 79 C 166 72, 158 58, 166 42 Z" fill="{G}" {TR}/>
    <path d="M200 55 C 211 57, 219 68, 212 77 C 206 83, 193 81, 189 74 C 187 66, 191 57, 200 55 Z" fill="#dcdcec"/>
    <ellipse cx="207" cy="64" rx="2" ry="3" fill="{L}"/>
    <circle class="ojo" cx="183" cy="52" r="3.8" fill="{L}"/><circle cx="184.3" cy="50.6" r="1.2" fill="#fff"/>
    <path d="M196 76 C 201 79, 206 78, 209 74" fill="none" {TR}/>
    <ellipse cx="178" cy="64" rx="5" ry="3" fill="{R}" opacity=".35"/></g>
</svg>'''


def tostada(con_mantequilla=True):
    pat = (f'<g class="pat"><rect x="44" y="40" width="44" height="28" rx="6" fill="#ffe07a" {TR}/>'
           f'<path d="M50 46 L 80 46" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/></g>') if con_mantequilla else ''
    return f'''<svg class="tostada" viewBox="0 0 130 120" overflow="visible">
  <path d="M18 44 C 8 20, 40 6, 64 14 C 88 6, 122 20, 112 44 L 108 108 Q 108 114, 102 114 L 28 114 Q 22 114, 22 108 Z" fill="#d9a35a" {TR}/>
  <path d="M30 48 C 24 30, 46 22, 64 28 C 82 22, 106 30, 100 48 L 98 102 L 32 102 Z" fill="#f6d79b"/>
  <circle cx="48" cy="80" r="2.5" fill="#d9a35a"/><circle cx="76" cy="90" r="2.5" fill="#d9a35a"/><circle cx="84" cy="66" r="2.5" fill="#d9a35a"/>
  {pat}
</svg>'''


def cuchillo():
    return f'''<svg class="cuchillo" viewBox="0 0 150 40" overflow="visible">
  <path d="M8 20 C 8 10, 20 8, 70 12 L 82 14 L 82 26 L 70 28 C 20 32, 8 30, 8 20 Z" fill="#e8eaf3" {TR}/>
  <path d="M20 16 C 30 14, 50 14, 66 16" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  <path d="M14 22 C 18 26, 30 26, 44 25" stroke="#ffe07a" stroke-width="5" stroke-linecap="round"/>
  <rect x="80" y="11" width="64" height="18" rx="9" fill="{V}" {TR}/>
  <circle cx="96" cy="20" r="2.2" fill="#fff"/><circle cx="128" cy="20" r="2.2" fill="#fff"/>
</svg>'''


def burrito():
    return f'''<svg class="burrito" viewBox="0 0 170 110" overflow="visible">
  <g transform="rotate(-14 85 55)">
    <path d="M22 30 L 140 30 Q 156 55, 140 80 L 22 80 Q 10 55, 22 30 Z" fill="#f3d9a4" {TR}/>
    <path d="M60 30 C 56 46, 56 64, 60 80 M 100 30 C 96 46, 96 64, 100 80" fill="none" stroke="#d9b06e" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="141" cy="55" rx="13" ry="25" fill="#fff7e4" {TR}/>
    <circle cx="138" cy="44" r="5" fill="#5aa469"/><circle cx="145" cy="56" r="5" fill="#d4574e"/>
    <circle cx="136" cy="62" r="4.5" fill="#8a5a3b"/><circle cx="143" cy="70" r="4" fill="#ffe07a"/>
    <circle cx="146" cy="44" r="3.5" fill="#ffe07a"/></g>
</svg>'''


def burrito_bebe():
    """Burrito animal: el burro, más pequeño y con cara de bebé (para la cara de la moneda)."""
    return burro("burro bebe")


def moneda(cara_a, cara_b):
    return f'''<div class="moneda"><div class="cara a">{cara_a}</div><div class="cara b">{cara_b}</div></div>'''


def bar():
    """Mostrador con cliente (izquierda) y camarero (derecha, ceja levantada)."""
    return f'''<svg class="bar" viewBox="0 0 480 300" overflow="visible">
  <rect x="0" y="210" width="480" height="90" rx="10" fill="{V}" {TR}/>
  <rect x="0" y="200" width="480" height="22" rx="8" fill="#7d71d3" {TR}/>
  <g class="cliente">
    <path d="M40 210 C 40 160, 70 140, 100 140 C 130 140, 160 160, 160 210 Z" fill="{A}" {TR}/>
    <circle cx="100" cy="108" r="36" fill="#ffe1c4" {TR}/>
    <path d="M66 98 C 70 70, 130 66, 136 96 C 120 84, 90 84, 66 98 Z" fill="{L}"/>
    <circle cx="112" cy="110" r="3.5" fill="{L}"/><path d="M110 126 C 116 130, 124 128, 128 122" fill="none" {TR}/>
  </g>
  <g class="camarero">
    <path d="M320 210 C 320 156, 350 136, 384 136 C 418 136, 448 156, 448 210 Z" fill="#fff" {TR}/>
    <path d="M372 140 L 384 160 L 396 140" fill="none" {TR}/>
    <rect x="352" y="168" width="64" height="42" rx="6" fill="{C}" {TR}/>
    <circle cx="384" cy="102" r="38" fill="#ffd9b8" {TR}/>
    <path d="M348 92 C 352 64, 416 62, 420 90 C 404 78, 364 78, 348 92 Z" fill="{L}"/>
    <circle cx="370" cy="104" r="3.5" fill="{L}"/><circle cx="398" cy="104" r="3.5" fill="{L}"/>
    <path class="ceja" d="M392 90 C 398 84, 406 84, 410 88" fill="none" {TR}/>
    <path d="M362 92 C 368 90, 374 90, 378 92" fill="none" {TR}/>
    <path d="M368 120 C 376 116, 392 116, 400 120 C 392 126, 376 126, 368 120 Z" fill="{L}"/>
    <path d="M378 130 L 392 130" {TR}/>
  </g>
  <g transform="translate(200 150)"><rect x="0" y="0" width="34" height="50" rx="5" fill="#fff" {TR}/>
    <rect x="4" y="14" width="26" height="32" rx="3" fill="#8a5a3b"/></g>
</svg>'''


def pizarra(lineas_html):
    return f'''<div class="pizarra"><div class="piz-titulo">MENÚ DEL DÍA</div>{lineas_html}</div>'''


def barranco():
    return f'''<svg class="barranco" viewBox="0 0 540 330" preserveAspectRatio="none" overflow="visible">
  <path class="roca-izq" d="M0 60 L 200 60 L 214 90 L 196 130 L 222 180 L 204 230 L 226 330 L 0 330 Z" fill="#b9bbd6" {TR}/>
  <path class="roca-der" d="M540 60 L 330 60 L 318 96 L 340 140 L 314 190 L 336 240 L 312 330 L 540 330 Z" fill="#b9bbd6" {TR}/>
  <path d="M0 60 L 200 60 M 540 60 L 330 60" stroke="#7fb37a" stroke-width="10" stroke-linecap="round"/>
  <path d="M60 120 L 100 130 M 140 200 L 170 190 M 420 130 L 460 140 M 380 220 L 410 214" {TR} fill="none" opacity=".5"/>
</svg>'''


def globos_logo():
    """Los dos globos del logo, separados para animarlos (violeta con ñ, rosa detrás)."""
    globo = "M18 4H46Q60 4 60 18V34Q60 48 46 48H28L15 59L17 48Q4 47 4 34V18Q4 4 18 4Z"
    enie = ("M29.24 23.97V38.68Q29.24 39.33 29.38 39.61Q29.52 39.89 29.84 40.02L30.46 40.24Q31.05 40.51 31.05 41.07Q31.05 42 29.89 42H21.5Q20.91 42 20.64 41.76Q20.37 41.53 20.37 41.12Q20.37 40.82 20.54 40.59Q20.7 40.37 21.08 40.23L21.74 40.02Q22.07 39.9 22.21 39.62Q22.35 39.33 22.35 38.69V27.64Q22.35 27.13 22.2 26.91Q22.05 26.69 21.74 26.62L20.94 26.53Q20.59 26.44 20.44 26.24Q20.28 26.05 20.28 25.75Q20.28 25.4 20.48 25.19Q20.69 24.98 21.23 24.77L25.71 23.18Q26.49 22.89 26.97 22.76Q27.44 22.62 27.88 22.62Q28.55 22.62 28.89 23Q29.24 23.38 29.24 23.97ZM28.6 28.57 27.67 27.59 28.37 26.95Q30.94 24.61 32.78 23.6Q34.630 22.59 36.23 22.59Q38.65 22.59 40.01 24.2Q41.36 25.82 41.64 28.54L42.71 38.65Q42.78 39.31 42.9 39.61Q43.01 39.91 43.35 40.03L43.96 40.23Q44.34 40.37 44.51 40.59Q44.67 40.82 44.67 41.12Q44.67 41.53 44.4 41.76Q44.14 42 43.54 42H35.05Q33.9 42 33.9 41.07Q33.9 40.52 34.48 40.24L35.11 40.02Q35.45 39.89 35.62 39.6Q35.8 39.31 35.73 38.65L34.79 29.49Q34.63 28.01 34.06 27.28Q33.49 26.55 32.35 26.55Q31.64 26.55 30.87 26.9Q30.11 27.25 29.35 27.91Z")
    return f'''<div class="globos">
  <svg class="g-rosa" viewBox="0 0 64 64" overflow="visible"><g transform="translate(64 0) scale(-1 1)">
    <path d="{globo}" fill="{R}"/></g>
    <g class="cara-rosa"><circle cx="26" cy="24" r="3" fill="#fff"/><circle cx="40" cy="24" r="3" fill="#fff"/>
    <ellipse class="boca" cx="33" cy="34" rx="6" ry="4" fill="#fff"/>
    <ellipse class="rubor" cx="18" cy="31" rx="5" ry="3" fill="#ff2d6f" opacity="0"/><ellipse class="rubor" cx="48" cy="31" rx="5" ry="3" fill="#ff2d6f" opacity="0"/></g></svg>
  <svg class="g-violeta" viewBox="0 0 64 64" overflow="visible"><path d="{globo}" fill="{V}"/>
    <path d="{enie}" fill="#fff"/><path d="M19.5 18 Q25.5 9 32 15.5 T45 12" fill="none" stroke="#FF86BE" stroke-width="5" stroke-linecap="round"/></svg>
  <svg class="destellos" viewBox="-10 -10 100 80" overflow="visible"><g fill="none" stroke="{A}" stroke-width="2.6" stroke-linecap="round">
    <path d="M1.6 12.6 L-1.8 9.4"/><path d="M8.6 9.6 L8 5"/><path d="M-0.8 19.6 L-5.4 19.9"/>
    <path d="M77.82 8.58 L81.42 5.98"/><path d="M72.42 3.98 L73.82 -0.22"/><path d="M79.02 15.18 L83.62 15.18"/></g></svg>
</div>'''


def redes():
    """Iconos provisionales de TikTok, Instagram y YouTube (cambiar por los oficiales de cada marca)."""
    return f'''<div class="redes">
  <svg viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#111"/>
    <path d="M27 11 V 30 A 6 6 0 1 1 21 24" fill="none" stroke="#25F4EE" stroke-width="4" stroke-linecap="round" transform="translate(-1.5 -1.5)"/>
    <path d="M27 11 V 30 A 6 6 0 1 1 21 24" fill="none" stroke="#FE2C55" stroke-width="4" stroke-linecap="round" transform="translate(1.5 1.5)"/>
    <path d="M27 11 V 30 A 6 6 0 1 1 21 24 M 27 11 C 28 16, 32 19, 36 19" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>
  <svg viewBox="0 0 48 48"><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FEDA75"/><stop offset=".35" stop-color="#FA7E1E"/><stop offset=".6" stop-color="#D62976"/><stop offset="1" stop-color="#4F5BD5"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#ig)"/><rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" stroke-width="3.5"/>
    <circle cx="24" cy="24" r="6.5" fill="none" stroke="#fff" stroke-width="3.5"/><circle cx="32.5" cy="15.5" r="2" fill="#fff"/></svg>
  <svg viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#FF0000"/><path d="M19 15 L 34 24 L 19 33 Z" fill="#fff"/></svg>
</div>'''
