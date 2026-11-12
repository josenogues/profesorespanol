# Herramientas

Todo lo que hay aquí es para mantener la web, no forma parte de ella: nada de
esta carpeta lo descarga un alumno.

## Antes de publicar

```
python3 herramientas/versiones.py     # pone a cada archivo la huella con que se pide
python3 herramientas/revisar.py       # tiene que decir SIN HALLAZGOS
```

`revisar.py` no necesita navegador y tarda segundos. Mira enlaces rotos,
identificadores repetidos, que las clases y sus temas existan, que el índice
del buscador esté al día, que las versiones de caché cuadren, que no falte
ningún icono y que no se haya colado nada de un servidor de fuera.

## Qué hace cada una

| Herramienta | Para qué |
|---|---|
| `versiones.py` | El `?v=` de cada archivo es la huella de su contenido. Se pasa después de tocar cualquier `.js`, `.css` o fuente. |
| `indexar.py` | Regenera el índice del buscador (`search-index-*.js`). `revisar.py` ya lo llama. |
| `iconos.py` | Recorta la fuente de iconos a los que usa la web. Se pasa cuando `revisar.py` dice que falta uno. |
| `revisar.py` | La revisión general, sin navegador. |
| `revisa_banco.py` | Revisa el banco de ejercicios del hub, sin navegador: respuestas que no están entre las opciones, respuestas con tilde sin su versión sin tilde, ejercicios repetidos, grupos y niveles que no existen. |
| `banco.py` | Leer y añadir ejercicios al banco desde un script. |
| `transparentes.py` | Que ninguna tabla, nota o tarjeta se quede sin fondo (con navegador). |

## Pruebas con navegador

Usan Chromium y un Firebase de mentira (`firebase_falso.py`): no tocan el
proyecto real ni los datos de nadie. Necesitan el sitio servido en local:

```
python3 -m http.server 8947
```

| Prueba | Qué recorre |
|---|---|
| `prueba_entrada.py` | La puerta: pedir el enlace, entrar, quién pasa y quién no. |
| `prueba_panel.py` | El panel del profesor: tabla, ficha, asignar clases, catálogo. |
| `prueba_repaso.py` | Las clases de repaso, del panel al hub de ejercicios. |
| `prueba_ejercicios.py` | Los ejercicios de todas las páginas de clase, con respuestas buenas y malas. |
| `prueba_banco.py` | Una muestra del banco del hub pasada por el motor que corrige. |
| `prueba_menu.py` | El menú: plegado bajo una barra en el móvil, lateral en el ordenador. |
| `prueba_hoy.py` | «Cinco minutos de hoy»: el botón de «Mis clases» y la tanda del hub, de uno en uno y con final. |
| `prueba_hub.py` | El hub de ejercicios: arranca, corrige, cambia de modo; también con una página antigua en caché. |
| `prueba_examen.py` | El examen de nivel: acertar, fallar, salir a medias, continuar. |
| `prueba_buscador.py` | El buscador del menú, en las tres pistas y sin pista. |

## Cómo está montada la web

- **Sin compilar nada.** Lo que hay en el repo es lo que se publica (GitHub
  Pages, desde `main`).
- `script.js` va en todas las páginas: menú, idioma, la puerta, el motor que
  corrige ejercicios, el buscador. `ejercicios.js` es el hub de ejercicios y
  solo lo cargan las tres páginas `ejercicios-*.html`.
- Tipografías e iconos están en `fuentes/` (ver su `LEEME.md`). Ninguna
  página pide nada a un servidor de fuera salvo Firebase.
