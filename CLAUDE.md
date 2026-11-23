# Habla Español con José

(Hasta noviembre de 2026 se llamó «Aprende español con José». El proyecto de
Firebase sigue llamándose `aprendeespanol`: es interno y no se cambia.)

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
  blancas con el color solo en el icono, **esquinas poco redondeadas (6px)** y
  **nada de rayas de color a la izquierda** de cajas ni filas («parece hecho
  por una IA»). Mejor menos cajas: «Mis clases» es una agenda de filas, no
  tarjetas. **Excepción querida por José:** el saludo de la portada y «Cinco
  minutos de hoy» llevan el degradado violeta, el «¡Hola!» escrito a mano
  (Caveat) y los globos «¿Qué tal? / ¡Vamos! / Poco a poco». También son de
  José y no se quitan: el **título escrito a mano** (Caveat, en el color de su
  sección) arriba de cada página y la **puerta de entrada** con el degradado y
  su foto.
- **Tres colores, uno por sección**, los del logo: violeta para «Mis clases»
  (`--c-clases`), dorado para los ejercicios (`--c-ejer`) y rosa para **toda**
  la teoría (`--c-teoria`), sin colores distintos por materia.
- **El menú (noviembre 2026), estilo Canva:** una columna estrecha azul con el
  logo y **tres botones** con icono y nombre: «Mis clases» (pizarra con
  profesor, va directo), «Práctica» (lápiz) y «Teoría» (cerebro). Los iconos
  van en blanco; el de la sección en la que estás, en su color. Práctica y
  Teoría abren un **panel flotante**; en Teoría las materias se despliegan
  (la de la página abierta, ya desplegada); Práctica no se despliega (sus
  tres modos ya llevan a una página donde se elige). La **chincheta** del
  panel (en el color de su sección cuando está puesta) lo deja **fijo** y la
  página se aparta; se recuerda al cambiar de página. José prefirió la
  chincheta a una flecha de plegar. En el móvil: barra abajo con los tres
  botones, el panel sube como hoja, y arriba logo, lupa y un botón para
  idioma y modo oscuro.
- El nombre de la sección sale **una sola vez**: el título a mano (que lleva a
  la portada de la sección). Sin etiqueta de color encima del título de la
  página y, en el ordenador, sin ruta «Inicio / …» (en el móvil sí, porque ahí
  no se ve el título a mano).
- El buscador es una **lupa**: abajo en la columna del menú en el ordenador
  (se estira al pulsarla) y arriba en la barra del móvil. Cada
  resultado lleva la etiqueta de su sección.
- Banderas: siempre las de `banderas/*.svg`, nunca emoji (en Windows salen
  como letras).

**Descartado o aparcado: no volver a proponerlo salvo que José lo saque**
- Descartado: «Mis fallos», aviso en «Mira tu correo», botón «Entrar con
  Google», LinkedIn, QR, las pestañas de cuaderno junto al menú, la frase
  («Poco a poco se llega lejos»…) al pie del menú, un color por materia, la
  foto de José en «Mis clases».
- Aparcado para más adelante: portada pública, test de nivel, Google, app.
- El dominio propio ya no está aparcado: José compró `hablaconjose.com`
  (Cloudflare, 20 nov 2026) y la mudanza de la web está a medias. La lleva
  la conversación «Web».

## Cómo se reparte el trabajo (noviembre 2026)
José llegó a tener 9 conversaciones abiertas a la vez y se pisaban. Ahora son
tres. **No abrir conversaciones nuevas para un tema que ya tiene dueña**: si
José pide algo de otro frente, decírselo y mandarlo a la que toca.
- **Web**: la única que cambia este repositorio (la web de los alumnos, el
  panel del profesor y la mudanza al dominio).
- **Redes y vídeo**: los vídeos (repositorio `estudio-profesorespanol`), las
  cuentas @hablaconjose (YouTube, TikTok; Instagram pendiente) y el plan de
  marketing. No toca este repositorio.
- **PM · gestión del proyecto**: lleva el orden y las prioridades y hace los
  resúmenes. No cambia la web; como mucho, este CLAUDE.md.

**Una conversación activa por frente, y una nueva por cada tarea grande.**
Las conversaciones largas gastan más: cada mensaje carga toda la historia.
Cuando se termina una tarea grande (por ejemplo, la mudanza al dominio), se
publica, se archiva esa conversación y lo siguiente va en una nueva del mismo
frente. La memoria está en este CLAUDE.md, no en el chat; lo pendiente que no
esté aquí se lo pasa la de gestión a la nueva. Nunca dos conversaciones
tocando la web a la vez.

## Impeccable (diseño)
José tiene instalado el plugin impeccable (una skill y cinco agentes), sin
revisiones automáticas.
- **Solo cuando José lo pida**: la skill solo arranca si él escribe
  `/impeccable`; los agentes `impeccable-*`, solo si él los nombra.
- **Nada automático**: no activar `/impeccable hooks` ni el instalador, no
  crear `PRODUCT.md` ni `DESIGN.md`, ni lanzar `/impeccable doctor` sin
  preguntarle antes.
- **Las decisiones de José mandan**: lo que ya dice este CLAUDE.md (colores,
  letras, estilo) es su sistema de diseño. Impeccable solo revisa y propone;
  nunca rediseña ni cambia nada sin su visto bueno. Si una regla de
  impeccable choca con algo que José decidió, gana José: comentárselo y que
  él decida.

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
