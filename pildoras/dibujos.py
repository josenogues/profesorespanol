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


import itertools
_n = itertools.count()
def _id(p): return f"{p}{next(_n)}"

# Paleta «pop suave» (ver ESTILO.md)
TINTA = '#3A4570'; VIO = '#5B4FB8'; VIO_C = '#7B70D6'; VIO_O = '#4A3FA0'
ROSA = '#E04F96'; ROSA_C = '#F59BC4'; AMA = '#F2AB27'; AMA_C = '#FFE27A'; AMA_O = '#E0951A'
PIEL = '#FFD9B8'; PIEL_O = '#F2BC92'; BLANCO = '#FFFFFF'; NUBE = '#ECE9F7'
BU = '#ADA9D8'; BU_O = '#918CC6'; BU_C = '#ECE8F8'   # el burro: gris lila

def _sombra_suelo(cx, cy, rx, ry=7):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{TINTA}" opacity=".13"/>'

def burro(clase="burro"):
    c = _id("bc"); h = _id("bh")
    crin = (f'<path d="M133 100 C 131 82, 138 66, 152 52 C 157 47, 165 50, 161 57 C 151 69, 146 83, 145 100 Z" fill="{TINTA}"/>'
            f'<path d="M140 84 C 142 74, 146 66, 152 60" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".25"/>')
    flequillo = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{TINTA}"/>' for x, y, r in
                        [(152, 36, 7), (161, 31, 8), (171, 32, 7), (179, 37, 5.5)])
    return f'''<svg class="{clase}" viewBox="0 0 220 180" overflow="visible">
  <defs><clipPath id="{c}"><ellipse cx="100" cy="104" rx="56" ry="36"/></clipPath>
        <clipPath id="{h}"><ellipse cx="165" cy="58" rx="32" ry="28"/></clipPath></defs>
  {_sombra_suelo(104, 166, 72)}
  <g class="cola"><path d="M48 98 C 36 104, 32 114, 33 122" fill="none" stroke="{BU_O}" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="32" cy="128" rx="7.5" ry="11" transform="rotate(15 32 128)" fill="{TINTA}"/></g>
  <g class="patas-tras" style="transform-origin:66px 118px">
    <rect x="52" y="112" width="17" height="44" rx="8.5" fill="{BU_O}"/><rect x="51" y="149" width="19" height="12" rx="5" fill="{TINTA}"/>
    <rect x="74" y="114" width="17" height="42" rx="8.5" fill="{BU}"/><rect x="73" y="149" width="19" height="12" rx="5" fill="{TINTA}"/></g>
  <rect x="122" y="112" width="17" height="44" rx="8.5" fill="{BU_O}"/><rect x="121" y="149" width="19" height="12" rx="5" fill="{TINTA}"/>
  <rect x="143" y="114" width="17" height="42" rx="8.5" fill="{BU}"/><rect x="142" y="149" width="19" height="12" rx="5" fill="{TINTA}"/>
  <ellipse cx="100" cy="104" rx="56" ry="36" fill="{BU}"/>
  <g clip-path="url(#{c})"><ellipse cx="104" cy="136" rx="72" ry="24" fill="{BU_O}"/>
    <ellipse cx="102" cy="121" rx="34" ry="8" fill="{BU_C}" opacity=".55"/></g>
  <ellipse cx="80" cy="84" rx="22" ry="6" transform="rotate(-10 80 84)" fill="#fff" opacity=".28"/>
  <g class="cabeza" style="transform-origin:150px 92px">
    <path d="M134 96 C 138 72, 150 58, 162 56 L 178 72 C 168 82, 162 98, 160 114 Z" fill="{BU}"/>
    {crin}
    <ellipse cx="150" cy="24" rx="9" ry="25" transform="rotate(-24 150 24)" fill="{BU_O}"/>
    <ellipse cx="174" cy="20" rx="10.5" ry="27" transform="rotate(12 174 20)" fill="{BU}"/>
    <ellipse cx="174.5" cy="22" rx="5" ry="18" transform="rotate(12 174.5 22)" fill="{ROSA_C}"/>
    <ellipse cx="165" cy="58" rx="32" ry="28" fill="{BU}"/>
    <g clip-path="url(#{h})"><ellipse cx="156" cy="86" rx="40" ry="14" fill="{BU_O}" opacity=".8"/></g>
    {flequillo}
    <ellipse cx="187" cy="72" rx="22" ry="17" fill="{BU_C}"/>
    <ellipse cx="187" cy="80" rx="18" ry="7" fill="#D9D4EE"/>
    <ellipse cx="186" cy="67" rx="2.6" ry="3.6" fill="{TINTA}" opacity=".75"/><ellipse cx="198" cy="68" rx="2.6" ry="3.6" fill="{TINTA}" opacity=".75"/>
    <path d="M181 82 Q 189 88 197 82" fill="none" stroke="{TINTA}" stroke-width="2.8" stroke-linecap="round"/>
    <ellipse class="ojo" cx="163" cy="53" rx="5" ry="6.2" fill="{TINTA}"/><circle cx="165" cy="50.6" r="1.9" fill="#fff"/>
    <ellipse cx="164" cy="68" rx="6.5" ry="3.8" fill="{ROSA_C}" opacity=".7"/>
    <ellipse cx="150" cy="46" rx="8" ry="4" transform="rotate(-30 150 46)" fill="#fff" opacity=".3"/>
  </g>
</svg>'''


def tostada(con_mantequilla=True):
    c = _id("tc")
    pat = f'''<g class="pat"><path d="M40 44 Q 40 36, 48 36 L 84 36 Q 92 36, 92 44 L 92 60 Q 92 68, 84 68 L 48 68 Q 40 68, 40 60 Z" fill="{AMA_C}"/>
      <path d="M40 56 L 92 56 L 92 60 Q 92 68, 84 68 L 48 68 Q 40 68, 40 60 Z" fill="#F5CF52"/>
      <path d="M58 68 Q 58 78, 62 78 Q 66 78, 66 68 Z" fill="#F5CF52"/>
      <rect x="47" y="41" width="22" height="5" rx="2.5" fill="#fff" opacity=".75"/></g>''' if con_mantequilla else ''
    return f'''<svg class="tostada" viewBox="0 0 130 120" overflow="visible">
  <defs><clipPath id="{c}"><path d="M16 46 C 6 18, 40 4, 65 13 C 90 4, 124 18, 114 46 L 110 106 Q 110 114, 102 114 L 28 114 Q 20 114, 20 106 Z"/></clipPath></defs>
  {_sombra_suelo(65, 116, 46, 5)}
  <path d="M16 46 C 6 18, 40 4, 65 13 C 90 4, 124 18, 114 46 L 110 106 Q 110 114, 102 114 L 28 114 Q 20 114, 20 106 Z" fill="#D98E45"/>
  <g clip-path="url(#{c})"><rect x="0" y="96" width="130" height="30" fill="#C47A35"/></g>
  <path d="M28 48 C 22 28, 46 20, 65 26 C 84 20, 108 28, 102 48 L 99 100 L 31 100 Z" fill="#F8DCA6"/>
  <path d="M31 86 L 99 86 L 99 100 L 31 100 Z" fill="#F1C987" opacity=".7"/>
  <ellipse cx="46" cy="82" rx="3" ry="2" fill="#E2B272"/><ellipse cx="80" cy="92" rx="3" ry="2" fill="#E2B272"/><ellipse cx="88" cy="74" rx="2.5" ry="1.8" fill="#E2B272"/>
  <path d="M30 34 C 40 22, 54 20, 62 22" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/>
  {pat}
</svg>'''


def cuchillo():
    return f'''<svg class="cuchillo" viewBox="0 0 150 40" overflow="visible">
  <path d="M6 21 C 6 11, 22 9, 72 12 L 84 14 L 84 27 L 72 29 C 22 32, 6 30, 6 21 Z" fill="#E6E8F3"/>
  <path d="M6 21 C 6 27, 22 31, 72 29 L 84 27 L 84 22 L 6 22 Z" fill="#C8CCE0"/>
  <path d="M10 22 C 16 28, 34 29, 50 27 C 46 24, 40 23, 10 22 Z" fill="{AMA_C}"/>
  <path d="M22 15 C 34 13, 52 13, 68 15" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
  <rect x="82" y="10" width="64" height="20" rx="10" fill="{VIO}"/>
  <rect x="82" y="20" width="64" height="10" rx="5" fill="{VIO_O}"/>
  <rect x="90" y="13" width="40" height="4" rx="2" fill="#fff" opacity=".35"/>
  <circle cx="99" cy="20" r="2.6" fill="{AMA}"/><circle cx="129" cy="20" r="2.6" fill="{AMA}"/>
</svg>'''


def burrito():
    c = _id("rc")
    return f'''<svg class="burrito" viewBox="0 0 170 110" overflow="visible">
  {_sombra_suelo(86, 100, 66, 6)}
  <g transform="rotate(-14 85 55)">
    <defs><clipPath id="{c}"><path d="M22 28 L 138 28 Q 154 55, 138 82 L 22 82 Q 8 55, 22 28 Z"/></clipPath></defs>
    <path d="M22 28 L 138 28 Q 154 55, 138 82 L 22 82 Q 8 55, 22 28 Z" fill="#F4D49E"/>
    <g clip-path="url(#{c})"><rect x="0" y="66" width="170" height="20" fill="#E5B873"/>
      <path d="M50 26 C 46 44, 46 66, 50 86 M 88 26 C 84 44, 84 66, 88 86" fill="none" stroke="#E2B06A" stroke-width="4" stroke-linecap="round"/>
      <g fill="#C98B47" opacity=".5"><ellipse cx="66" cy="44" rx="6" ry="2"/><ellipse cx="108" cy="50" rx="6" ry="2"/><ellipse cx="74" cy="62" rx="5" ry="2"/></g>
      <path d="M0 26 L 46 26 C 42 40, 42 70, 46 86 L 0 86 Z" fill="#DCDFEC"/>
      <path d="M0 70 L 46 70 L 46 86 L 0 86 Z" fill="#C3C7DB"/>
      <path d="M10 36 L 18 44 L 12 52 L 22 60 M 30 34 L 36 42 L 30 50" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></g>
    <ellipse cx="139" cy="55" rx="14" ry="27" fill="#FBEBC8"/>
    <ellipse cx="140" cy="55" rx="10" ry="22" fill="#FFF8EA"/>
    <circle cx="137" cy="42" r="5.5" fill="#6CBF73"/><circle cx="144" cy="50" r="5" fill="#E2574C"/>
    <circle cx="136" cy="56" r="4.6" fill="#7A4E36"/><circle cx="143" cy="64" r="4.6" fill="{AMA}"/>
    <circle cx="137" cy="70" r="4" fill="#6CBF73"/><circle cx="145" cy="40" r="3.4" fill="{AMA}"/>
    <path d="M30 34 C 60 31, 100 31, 126 33" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".4"/>
  </g>
</svg>'''


def bar():
    """Mostrador con cliente (izquierda) y camarero (derecha). La cara del camarero está en (384,102)."""
    cl = _id("cc"); ca = _id("ca"); rb = _id("rb")
    rayas = "".join(f'<rect x="40" y="{y}" width="130" height="8" fill="{TINTA}"/>' for y in range(156, 214, 16))
    azulejos = "".join(f'<rect x="{x}" y="241" width="13" height="13" rx="2" transform="rotate(45 {x+6.5} 247.5)" fill="#fff" opacity=".16"/>'
                       for x in range(18, 480, 32))
    return f'''<svg class="bar" viewBox="0 0 480 300" overflow="visible">
  <defs><clipPath id="{rb}"><path d="M44 214 C 44 168, 70 146, 100 146 C 130 146, 156 168, 156 214 Z"/></clipPath>
        <clipPath id="{cl}"><circle cx="100" cy="108" r="38"/></clipPath>
        <clipPath id="{ca}"><circle cx="384" cy="102" r="40"/></clipPath></defs>
  <g class="cliente">
    <path d="M44 214 C 44 168, 70 146, 100 146 C 130 146, 156 168, 156 214 Z" fill="#fff"/>
    <g clip-path="url(#{rb})">{rayas}<rect x="40" y="146" width="40" height="70" fill="{TINTA}" opacity=".12"/></g>
    <path d="M78 148 Q 100 166 122 148 L 116 172 Q 100 178 84 172 Z" fill="{ROSA}"/>
    <rect x="90" y="134" width="20" height="16" rx="6" fill="{PIEL_O}"/>
    <circle cx="100" cy="108" r="38" fill="{PIEL}"/>
    <g clip-path="url(#{cl})"><circle cx="78" cy="128" r="34" fill="{PIEL_O}" opacity=".55"/></g>
    <circle cx="62" cy="112" r="8" fill="{PIEL_O}"/>
    {"".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#6B4636"/>' for x,y,r in [(70,86,14),(86,74,15),(104,70,15),(121,76,14),(132,90,11),(64,100,10)])}
    <ellipse cx="96" cy="72" rx="10" ry="4" fill="#fff" opacity=".22"/>
    <ellipse cx="108" cy="108" rx="4" ry="5" fill="{TINTA}"/><circle cx="109.6" cy="106" r="1.5" fill="#fff"/>
    <ellipse cx="128" cy="108" rx="3.6" ry="4.6" fill="{TINTA}"/><circle cx="129.2" cy="106" r="1.3" fill="#fff"/>
    <path d="M110 122 Q 120 132 130 122 Z" fill="{TINTA}"/><path d="M114 125 Q 120 129 126 125" fill="{ROSA_C}"/>
    <ellipse cx="96" cy="122" rx="7" ry="4" fill="{ROSA_C}" opacity=".7"/>
  </g>
  <g class="camarero">
    <path d="M326 214 C 326 168, 350 146, 384 146 C 418 146, 442 168, 442 214 Z" fill="#fff"/>
    <path d="M326 214 C 326 172, 344 152, 366 148 L 376 214 Z" fill="{TINTA}"/>
    <path d="M442 214 C 442 172, 424 152, 402 148 L 392 214 Z" fill="{TINTA}"/>
    <circle cx="384" cy="180" r="3" fill="{AMA}"/><circle cx="384" cy="196" r="3" fill="{AMA}"/>
    <rect x="374" y="134" width="20" height="16" rx="6" fill="{PIEL_O}"/>
    <path d="M384 152 L 368 143 L 368 161 Z M 384 152 L 400 143 L 400 161 Z" fill="{ROSA}"/><circle cx="384" cy="152" r="5" fill="#C23A7D"/>
    <circle cx="344" cy="106" r="8.5" fill="{PIEL_O}"/><circle cx="424" cy="106" r="8.5" fill="{PIEL_O}"/>
    <circle cx="384" cy="102" r="40" fill="{PIEL}"/>
    <g clip-path="url(#{ca})"><circle cx="410" cy="124" r="36" fill="{PIEL_O}" opacity=".5"/></g>
    <path d="M342 104 C 334 48, 434 44, 427 100 C 418 82, 400 76, 382 79 C 366 82, 352 92, 342 104 Z" fill="{TINTA}"/>
    <path d="M360 70 C 374 60, 396 60, 410 68" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".28"/>
    <g class="ojos-normal"><ellipse cx="370" cy="104" rx="3.8" ry="4.8" fill="{TINTA}"/><ellipse cx="398" cy="104" rx="3.8" ry="4.8" fill="{TINTA}"/>
      <circle cx="371.4" cy="102.2" r="1.4" fill="#fff"/><circle cx="399.4" cy="102.2" r="1.4" fill="#fff"/></g>
    <g class="ojos-susto"><circle cx="369" cy="104" r="10" fill="#fff"/><circle cx="399" cy="104" r="10" fill="#fff"/>
      <circle cx="369" cy="105" r="3.6" fill="{TINTA}"/><circle cx="399" cy="105" r="3.6" fill="{TINTA}"/></g>
    <path class="ceja2" d="M360 90 C 364 86, 372 86, 377 89" fill="none" stroke="{TINTA}" stroke-width="3.6" stroke-linecap="round"/>
    <path class="ceja" d="M391 89 C 396 86, 404 86, 408 90" fill="none" stroke="{TINTA}" stroke-width="3.6" stroke-linecap="round"/>
    <ellipse cx="358" cy="118" rx="7" ry="4" fill="{ROSA_C}" opacity=".6"/><ellipse cx="410" cy="118" rx="7" ry="4" fill="{ROSA_C}" opacity=".6"/>
    <path d="M362 124 C 368 113, 380 114, 384 120 C 388 114, 400 113, 406 124 C 400 121, 392 124, 384 124 C 376 124, 368 121, 362 124 Z" fill="{TINTA}"/>
    <path class="boca-normal" d="M378 131 Q 384 135 390 131" fill="none" stroke="{TINTA}" stroke-width="3" stroke-linecap="round"/>
    <g class="boca-o"><ellipse cx="384" cy="135" rx="7" ry="9" fill="{TINTA}"/><ellipse cx="384" cy="140" rx="4.5" ry="3" fill="{ROSA_C}"/></g>
    <g class="sudor"><path d="M428 76 C 434 88, 436 96, 429 98 C 422 96, 422 88, 428 76 Z" fill="#8FD0F7"/><circle cx="427" cy="91" r="1.8" fill="#fff"/></g>
  </g>
  <rect x="0" y="196" width="480" height="104" rx="12" fill="{VIO}"/>
  <rect x="0" y="282" width="480" height="18" rx="9" fill="{VIO_O}"/>
  {azulejos}
  <rect x="-4" y="190" width="488" height="22" rx="11" fill="{VIO_C}"/>
  <rect x="14" y="194" width="300" height="4" rx="2" fill="#fff" opacity=".3"/>
  <g class="taza">
    <ellipse cx="217" cy="190" rx="26" ry="6" fill="{TINTA}" opacity=".15"/>
    <ellipse cx="217" cy="186" rx="26" ry="6" fill="#fff"/>
    <path d="M199 154 L 235 154 L 231 182 Q 230 186, 226 186 L 208 186 Q 204 186, 203 182 Z" fill="#fff"/>
    <path d="M200 164 L 234 164 L 233 170 L 201 170 Z" fill="{ROSA}"/>
    <path d="M235 160 C 247 160, 247 176, 233 176" fill="none" stroke="#fff" stroke-width="5"/>
    <ellipse cx="217" cy="155" rx="18" ry="4" fill="#7A4E36"/>
    <path d="M210 144 C 206 136, 214 132, 210 124 M 222 146 C 218 138, 226 134, 222 126" fill="none" stroke="#C9C2F0" stroke-width="3.4" stroke-linecap="round"/>
  </g>
</svg>'''


def barranco():
    a = _id("ba"); b = _id("bb")
    izq = "M0 64 L 196 64 L 210 96 L 194 136 L 220 182 L 202 232 L 224 330 L 0 330 Z"
    der = "M540 64 L 332 64 L 320 100 L 342 142 L 316 192 L 338 242 L 314 330 L 540 330 Z"
    def estratos(cid):
        return f'<g clip-path="url(#{cid})">' + "".join(
            f'<rect x="0" y="{y}" width="540" height="16" fill="#9C95CC" opacity=".55"/>' for y in (118, 186, 254)) + \
            '<rect x="0" y="300" width="540" height="40" fill="#8E87C2"/></g>'
    hierba = lambda x0, x1: f'<path d="M{x0} 70 L {x1} 70 L {x1} 58 Q {x1} 50, {x1-8} 50 L {x0+8} 50 Q {x0} 50, {x0} 58 Z" fill="#8FCB8E"/>' + \
        "".join(f'<circle cx="{x}" cy="70" r="7" fill="#74B77A"/>' for x in range(x0 + 8, x1 - 2, 18))
    return f'''<svg class="barranco" viewBox="0 0 540 330" preserveAspectRatio="none" overflow="visible">
  <defs><clipPath id="{a}"><path d="{izq}"/></clipPath><clipPath id="{b}"><path d="{der}"/></clipPath></defs>
  <path d="M190 330 Q 266 300, 330 330 Z" fill="#8FD3F4"/>
  <path d="M232 318 q 10 -6 20 0 t 20 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
  <path class="roca-izq" d="{izq}" fill="#B9B3DE"/>{estratos(a)}
  <path class="roca-der" d="{der}" fill="#B9B3DE"/>{estratos(b)}
  {hierba(0, 200)}{hierba(330, 540)}
  <g transform="translate(60 0)"><rect x="-5" y="22" width="10" height="34" rx="4" fill="#8A5A3B"/>
    <circle cx="0" cy="14" r="22" fill="#74B77A"/><circle cx="-8" cy="6" r="9" fill="#9AD69B"/></g>
  <g transform="translate(470 0)"><rect x="-4" y="30" width="8" height="26" rx="3" fill="#8A5A3B"/>
    <circle cx="0" cy="24" r="16" fill="#74B77A"/><circle cx="-6" cy="18" r="6" fill="#9AD69B"/></g>
  <ellipse cx="120" cy="150" rx="10" ry="6" fill="#A39CD0"/><ellipse cx="430" cy="210" rx="12" ry="7" fill="#A39CD0"/>
</svg>'''


def burrito_bebe():
    """Burrito animal: el burro, más pequeño y con cara de bebé (para la cara de la moneda)."""
    return burro("burro bebe")


def moneda(cara_a, cara_b):
    return f'''<div class="moneda"><div class="cara a">{cara_a}</div><div class="cara b">{cara_b}</div></div>'''


def pizarra(lineas_html):
    return f'''<div class="pizarra"><div class="piz-titulo">MENÚ DEL DÍA</div>{lineas_html}</div>'''


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
