# Aprende Español con José

Web de José, profesor particular de español. Sus alumnos (sobre todo de Preply,
de muchos países) entran con su email y encuentran sus clases, los ejercicios y
la teoría. Es el complemento de las clases en vídeo, no un curso suelto.

Hablar con José **en español, corto y claro**, sin jerga técnica: él decide
sobre la web, no programa. Antes de algo grande, proponer y esperar su visto
bueno; lo pequeño y claro, hacerlo.

## Reglas de José (permanentes)

**Contenido**
- Tres pistas: `-es`, `-it`, `-en`. Las **explicaciones** de cada clase van en
  el idioma del alumno (italiano o inglés); **en español solo lo que se está
  aprendiendo**.
- Traducciones de ejemplos: **B1 se traduce; B2 y C1 se dejan en español.**
- Lo que rodea al contenido (menú, botones, avisos, fechas) va en el idioma
  del alumno: nada de restos en español en las pistas it/en.
- **Los deberes los pone José y son libres**: nada de seguimiento de deberes,
  ni marcar si se han hecho.
- **Nada de «niveles superados»** ni nada que meta presión.
- **No borrar** las clases ni la pista en español.

**Aspecto**
- Las tablas, notas y tarjetas **nunca son transparentes**: solo se quitó el
  recuadro de fondo de la página. `herramientas/transparentes.py` lo vigila.
- Estilo sobrio (noviembre 2026): títulos en Nunito, botones planos, tarjetas
  blancas con el color solo en el icono. **Excepción querida por José:** el
  saludo de la portada y «Cinco minutos de hoy» llevan el degradado violeta, el
  «¡Hola!» escrito a mano (Caveat) y los globos «¿Qué tal? / ¡Vamos! / Poco a
  poco».
- Los colores de las materias son de las materias (menú, iconos); no usarlos
  para otras cosas.
- Banderas: siempre las de `banderas/*.svg`, nunca emoji (en Windows salen
  como letras).

**Descartado o aparcado: no volver a proponerlo salvo que José lo saque**
- Descartado: «Mis fallos», aviso en «Mira tu correo», botón «Entrar con
  Google», LinkedIn, QR.
- Aparcado para más adelante: dominio propio, portada pública, test de nivel,
  Google, app.

## Privacidad y permisos
- El email de José y los de los alumnos son privados: no mandarlos a ningún
  servicio de fuera. Si hace falta el de José, leerlo de `const PROFESOR` en
  `script.js`.
- Firebase de producción: **no se puede escribir desde aquí** (403 a
  propósito). Las reglas (`firestore.rules`) las publica José a mano en la
  consola de Firebase.
- Las reseñas de «Sobre mí» son de Preply, copiadas tal cual; la bandera es la
  del país desde el que escribe el alumno.

## Cómo está montada
- Sitio estático, **sin compilar**: lo que hay en el repo es lo que se publica
  (GitHub Pages desde `main`).
- `script.js` va en todas las páginas (menú, idioma, puerta de entrada, motor
  que corrige ejercicios, buscador). `ejercicios.js` es el hub de ejercicios,
  solo en `ejercicios-*.html`.
- `clases.js`: catálogo de clases. La **centena es el nivel** (1xx A1 … 6xx B2)
  y se numera de **10 en 10**; para meter una entre dos, usar el 5 (115, 135…).
  `temas.js`: los temas que enlazan clases, teoría y ejercicios.
- Firebase (enlace por email): `firebase-init.js`, `firebase-sync.js`;
  el panel del profesor es `panel-profesor.html` + `firebase-panel.js`.
- Portada: `index.html` + `inicio.js`. Mis clases: `mis-clases-*.html` +
  `mis-clases.js`.
- Fuentes e iconos propios en `fuentes/`: ninguna página pide nada fuera
  salvo Firebase. Iconos: nombres siempre literales (`ti-algo`, nunca montados
  a trozos); si falta uno, `python3 herramientas/iconos.py`.
- Más detalle: `herramientas/LEEME.md` y `fuentes/LEEME.md`.

## Antes de publicar (siempre)
```
python3 herramientas/versiones.py   # huellas ?v= de cada archivo
python3 herramientas/revisar.py     # tiene que decir SIN HALLAZGOS
python3 herramientas/versiones.py   # otra vez si revisar regeneró el índice
```
Pruebas con navegador (Chromium ya instalado; Firebase falso, no toca datos
reales). Con el sitio servido en local (`python3 -m http.server 8947`), pasar
las de lo que se ha tocado, y para cambios grandes toda la batería:
`bash herramientas/todas.sh` (unos 15 minutos). Si una prueba falla, mirar si
es la web o la prueba la que está desfasada, y decírselo a José.

Si `python3` no tiene Playwright, usar `/usr/bin/python3`; si tampoco, `pip install --break-system-packages playwright pillow fonttools brotli` (el navegador ya está: no hace falta `playwright install`).

Mirar los cambios visuales con capturas en ordenador y móvil, claro y oscuro.

## Publicar
- Trabajar en la rama de la sesión; cuando todo pase, publicar en `main`
  (es lo que José ve en la web). Antes, `git fetch origin main` por si otra
  sesión publicó algo, y juntarlo.
- **Una sola sesión cambiando la web a la vez**: dos a la vez se pisan.
- Mensajes de commit en español, explicando el porqué.
- GitHub Pages tarda un minuto en servir lo nuevo.
