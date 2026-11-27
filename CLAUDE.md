# Habla Español con José

(Hasta noviembre de 2026 se llamó «Aprende español con José». El proyecto de
Firebase sigue llamándose `aprendeespanol`: es interno y no se cambia.)

Web de José, profesor particular de español. Sus alumnos (sobre todo de Preply,
de muchos países) entran con su email y encuentran sus clases, los ejercicios y
la teoría. Es el complemento de las clases en vídeo, no un curso suelto.

Hablar con José **en español, corto y claro**, sin jerga técnica: él decide
sobre la web, no programa. Es un proyecto de pasión y va a su ritmo: **nada
de plazos, fechas ni planes del día** que no pida él. Antes de algo grande, proponer y esperar su visto
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
  tarjetas. El repaso y la lectura de una clase **no van en fila propia**:
  son botones dorados (lápiz / libro, con su fecha) a la derecha de la fila
  de su clase; solo si esa clase no está en la lista van sueltos, con
  etiqueta. Sin filtro por tipo (José lo descartó al agruparlos).
  **Excepción querida por José:** el saludo de la portada y «Cinco minutos de
  tus clases» (antes «de hoy»: los alumnos no entendían que salen solo de sus
  clases) llevan el degradado violeta, el «¡Hola!» escrito a mano
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

**Lecturas (en la web desde el 23 nov 2026)**
- Cada clase de teoría puede tener dos hijas: el **repaso** (ejercicios del
  banco, ya existe) y la **lectura**. No se combinan clases en una lectura:
  para mezclar, José pone dos.
- La lectura: un texto en español escrito para esa clase, 6–8 preguntas
  **solo sobre el texto** (elegir o escribir una palabra, con trampas: «el
  texto no lo dice», tiempos casi iguales…), corregidas por el motor de
  siempre y sin nota final, y al final un **cuadro de escritura libre** que es
  el de los apuntes (se guarda solo, sin «hecho» ni «pendiente»; José lo
  corrige en la clase en vídeo).
- Todo en español. Cada pregunta y la consigna llevan la **traducción
  escondida** tras un botón, en todos los niveles (excepción aceptada a la
  regla B1/B2). El texto no se traduce: solo las palabras difíciles, al
  tocarlas.
- En el panel, lo escrito por el alumno sale en un desplegable dentro de esa
  clase. Hay cinco: «El décimo», de la 540 («Si tuviera dinero…»); «¿Qué tal el tiempo por ahí?», de la 160 («Hablar del tiempo», A1, con el glosario más amplio); y, del 27 nov 2026, «Mis martes» (140, el presente), «El tren de las diez» (145, desde hace, ¿te ayudo?, casi) y «Ya estoy en Granada» (150, ser, estar y hay).
- Cómo está hecha: los textos en `lecturas.js` (formato explicado arriba del
  archivo); `lectura-XX.html?clase=<id>` es una sola página por pista
  (`lectura.js`); el botón «Lectura» del panel sale solo en las clases que
  tienen una. Para una nueva: escribir texto y preguntas, **enseñárselos a
  José y esperar su visto bueno**, añadirla a `lecturas.js` y pasar
  `prueba_lectura.py`.

**Bienvenida (en la web desde el 24 nov 2026)**
- `bienvenida.html`: lo que ve quien llega a hablaconjose.com sin haber
  entrado nunca (la portada le manda ahí; con `?entrar`, con el enlace del
  correo o esperándolo, no). Es para captar alumnos: la idea que vende es que
  **la web sale de las clases** («tus clases no se quedan en la
  videollamada»), no «teoría y ejercicios como cualquier web».
- Tiene el **marco de la web** (columna azul con botones para el visitante:
  Cómo funciona, Pruébalo, Reservar y abajo Entrar; fondo de cuaderno). Orden
  (24–25 nov, ideas de José): el degradado con «¡Hola!» y la ventana con el
  **vídeo** entera dentro del violeta (los dos botones, del mismo tamaño).
- La **presentación**, en el ordenador con **fondo fijo**: la frase «Lo mejor
  de una plataforma online, con la conversación de un profesor nativo»
  (alineada a la izquierda, a todo lo ancho) y, al seguir bajando sin que
  la página se mueva, aparecen **en una línea** la plataforma (izquierda),
  el «+» (centro) y José (derecha: **polaroid «¡Hola, soy José! :)»**, grande y con proporciones de polaroid,
  globos y enlace a «Sobre mí», donde están las reseñas).
- **«¿Cómo funciona?»** es un **bloc de notas con la espiral arriba** que
  pasa una hoja por paso (idea de José: el scroll con la pantalla fija no le
  convencía). Va **sobre el degradado violeta** (el de «Cinco minutos», para
  que no sean hojas blancas sobre papel blanco): en el ordenador, solo como
  un **borde alrededor del bloc**, del ancho del saludo (una caja violeta de
  toda la pantalla era «exagerada»); en el móvil, de lado a lado con las
  flechas dentro. La **tapa** sigue azul (José probó dorada y rosa y se quedó
  con la azul), con «¿Cómo funciona?» a mano y Lucía de
  pegatina; un **separador de color** por tramo, con su lista de pasos y su
  **pestaña** asomando por abajo (lleva a ese tramo); y una **hoja por paso**:
  número y título, la descripción y su pantalla pegada con cinta. Al bajar, el
  bloc se queda quieto y las hojas se levantan por encima de la espiral (al
  subir, vuelven); también pasan pulsando en la hoja. **Solo se ve una hoja**
  y solo se mueve su pantalla. **Sin números en las pantallas** (solo junto
  al texto). **Zoom solo en 1, 2 y 4**, y va **dentro del vídeo** (hecho por
  la página «temblaba» y daba ansia): la pantalla empieza entera, se acerca
  al botón (reservar, entrar a clase, los apuntes), se ve el clic y se queda
  acercada (en el 4, mientras se escribe la nota); en los demás, la pantalla
  baja por la página. **Lo escrito a mano** (aprobado por José): notas en
  3 («¿Un día solo te apetece hablar? Conversación libre.»), 5 (no solo
  gramática: falsos amigos —solo en it/en—, español para el trabajo,
  vocabulario por temas) y 7 (el autobús o la cola del súper); pósits
  amarillos pegados a la pantalla en 1 (clases de 50 minutos), 2 (normalmente
  por Google Meet), 6 (tocar una palabra para traducirla), Ponte a prueba
  (del A1 al C1) y Teoría (en tu idioma, con los ejemplos en español); en la 4,
  nada (José no lee los apuntes). Cada separador, su frase: «Esto lo hacemos
  juntos» / «Esto, tú solo, a tu ritmo» / «Solo si te apetece». En la tapa,
  el logo sin texto, blanco y apagado, abajo a la derecha. Tramos: *La clase* (1 Reserva ·
  2 Entra en clase · 3 Damos la clase · 4 Toma notas) · *Al terminar la
  clase* (5 Practica · 6 Lee · 7 Repasa: «Cinco minutos», con el **teléfono
  solo**) · *Y además…* (+ Ponte a prueba, con tres botones que cambian la
  foto; + Repasa la teoría). **Con el dedo** (móvil y tableta) el bloc **no va
  con el scroll** (las hojas se pasaban de tres en tres y a José no le
  funcionaba): la página baja normal y las hojas se pasan tocando la hoja,
  deslizando a un lado o con las flechas de debajo («3 / 13»); en cada hoja,
  el texto arriba y la pantalla debajo. El **teléfono** del 7 va con el marco,
  las curvas y la isla en proporción a su tamaño, y sus botones al lado: en
  pequeño también tiene que parecer un teléfono. El **vídeo 1**, con calma
  (unos 10 s): la pantalla entera, el ratón pasa por la próxima clase, se
  acerca despacio y luego el clic. Sin JavaScript o en una pantalla muy
  baja, las hojas van una debajo de otra.
- **Reglas de José para los textos de los pasos**: títulos **breves**;
  descripción de **3 a 5 líneas**, con palabras clave en nuestro amarillo;
  y al leerlo todo tienen que quedar claras dos cosas: **clases online con
  el apoyo del profesor y adaptadas**, y **sin presión ni rachas, al ritmo
  del alumno**. Sin repetir (las rachas se nombran una sola vez).
- **«¡Pruébalo gratis!»** en el cuadro violeta con degradado y globos, a dos
  columnas (texto y botones a la izquierda, la pantalla a la derecha, sin
  aire de más): la 540 y su lectura, abiertas sin entrar.
- El cierre **«¿Empezamos?»**: estrecho, **sin fondo**, con el **precio**
  lo primero: **18 € por clase, y la primera desbloquea todo el contenido
  para siempre** («Desbloquea todo el contenido con tu primera clase, por
  18 €. La web queda abierta para siempre. ¿Más clases? 18 € cada una.»; José
  descartó los 25 € de entrada). Cómo se paga: reservas sin pagar, damos la clase y te abro tu sección, y
  al terminar me pagas (las siguientes, como se acuerde). Con **Lucía y Javi**
  contentos (los bocadillos con cara de los vídeos, sacados de
  `estudio-profesorespanol/src/personajes.tsx`: `bienvenida/lucia.svg` y
  `javi.svg`).
- **Reservar, solo en TidyCal** (su calendario). **Preply ya no es para
  reservar**: queda como perfil con las reseñas, en «Sobre mí». José quizá añada también su
  perfil de **Superprof** (él pasará el enlace).
- Los vídeos salen de una alumna inventada (Sara; nunca datos reales), en
  los tres idiomas (`bienvenida/`: recorrido de ordenador y de móvil, una
  escena por paso y fotos de la práctica libre).
- «Sobre mí» y «Privacidad» se ven sin entrar (la bienvenida enlaza con
  ellas).
- **Google** (25 nov 2026): José dio de alta hablaconjose.com en Search
  Console (propiedad de dominio) y envió `sitemap.xml` («Correcto»).
  `robots.txt` solo deja ver la bienvenida, «Sobre mí» y la privacidad (y lo
  que necesitan para pintarse); las tres llevan `rel="canonical"` a
  hablaconjose.com. **Si se hace pública otra página, añadirla a los dos.**
  AdSense, descartado (céntimos, y anuncios de la competencia).
- **Una bienvenida por idioma** (26 nov 2026, para que Google vea las tres):
  `bienvenida.html` (español), `bienvenida-it.html` y `bienvenida-en.html`.
  **Solo se toca `bienvenida.html`**: las otras dos las saca
  `herramientas/bienvenida_idiomas.py` (las rehace `revisar.py`; tocadas a
  mano, se pierde el cambio). Cada una viene ya escrita en su idioma, con su
  título, descripción y `hreflang`; la portada manda a la del idioma elegido
  o del navegador, las banderas llevan a la otra página y, si el visitante
  ya eligió otro idioma, va a la suya.
- **Páginas escaparate** (27 nov 2026): páginas abiertas para quien llega
  desde Google o los vídeos, con texto nuevo (no la teoría de dentro, que
  sigue cerrada), un ejercicio corto y al final «¿Te ha servido?» con la
  bienvenida y la clase de prueba. La primera: `falsi-amici-spagnolo-it.html`
  (15 falsos amigos para italianos; aprobada por José). Para una nueva:
  enseñársela a José antes, y añadirla a la lista de abiertas de `script.js`
  (junto a «Sobre mí»), a `robots.txt`, al `sitemap.xml`, a `SUELTAS_OK` de
  `revisar.py` y a `FUERA` de `indexar.py` (el alumno ya tiene la teoría).
  Idea: empezar por el italiano (menos competencia) y que cada una vaya con
  un vídeo (los temas, con «Redes y vídeo»).
- La puerta enlaza con la bienvenida («¿Todavía no eres alumno?»).
- Si cambia el aspecto de la web, los vídeos se vuelven a grabar con
  `herramientas/graba_recorrido.py` (sin nada: los recorridos y las escenas;
  con `SOLO=reserva,portada,notas … XX escenas`, solo esas escenas).
- Pendiente de decidir: un contacto («escríbeme»). El número de WhatsApp no se
  puede esconder.

**Descartado o aparcado: no volver a proponerlo salvo que José lo saque**
- Descartado: «Mis fallos», aviso en «Mira tu correo», botón «Entrar con
  Google», LinkedIn, QR, las pestañas de cuaderno junto al menú, la frase
  («Poco a poco se llega lejos»…) al pie del menú, un color por materia, la
  foto de José en «Mis clases».
- Aparcado para más adelante: test de nivel, Google, app, suscripción a la
  web (que la clase sea un extra que se contrata aparte).
- Dominio propio: `hablaconjose.com` (Cloudflare, comprado el 20 nov 2026).
  **Ya está activo** (23 nov): la web se sirve desde Cloudflare Pages
  (proyecto `profesorespanol`, repo conectado, rama `main`, sin build ni
  carpeta de salida; también `www.` y `profesorespanol.pages.dev`) y la
  entrada por enlace de email funciona en el dominio nuevo y en el viejo de
  GitHub Pages. Firebase tiene autorizados `hablaconjose.com` y
  `www.hablaconjose.com`; `pages.dev` NO (solo falla el envío del enlace ahí).
  No hizo falta tocar el código: las rutas son relativas y el enlace usa la
  dirección en la que esté el alumno. **Ojo:** Cloudflare sirve las páginas
  sin «.html» (`clase-motor-it`): todo lo que lea el idioma de la dirección
  tiene que aceptar las dos formas (se arregló el 23 nov: el botón de idioma
  no cambiaba de página). **Pendiente** (la lleva «Web», con
  calma y sin prisa): avisar a los alumnos por WhatsApp, pasar el repositorio
  a privado (ojo: Cloudflare publica todo lo que está en git, incluidos
  `CLAUDE.md` y `herramientas/`) y dejar la dirección vieja reenviando a la
  nueva; antes de privatizar hay que comprobar cómo quedaría ese reenvío.

## Cómo se reparte el trabajo (noviembre 2026)
José llegó a tener 9 conversaciones abiertas a la vez y se pisaban. Ahora son
tres. **No abrir conversaciones nuevas para un tema que ya tiene dueña**: si
José pide algo de otro frente, decírselo y mandarlo a la que toca.
- **Web**: la única que cambia este repositorio (la web de los alumnos, el
  panel del profesor y la mudanza al dominio).
- **Redes y vídeo**: los vídeos (repositorio `estudio-profesorespanol`), las
  cuentas @hablaconjose (YouTube, TikTok e Instagram) y el plan de
  marketing. No toca este repositorio.
- **PM · gestión del proyecto**: lleva el orden y las prioridades y hace los
  resúmenes. No cambia la web; como mucho, este CLAUDE.md. Lleva también la
  tabla de servicios, canales y costes (en el Drive de José, no aquí: este
  repositorio es público). Si cambia un servicio, un plan o un coste, decirle
  a José que se lo cuente a la de gestión.

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
  (GitHub Pages y Cloudflare Pages, los dos desde `main`).
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
