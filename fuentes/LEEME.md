# Fuentes de la web

Todo lo que hay aquí se sirve desde la propia web: ninguna página pide
tipografías ni iconos a un servidor de fuera.

| Archivo | Qué es | Origen | Licencia |
|---|---|---|---|
| `nunito-latin.woff2`, `nunito-latin-ext.woff2` | Nunito, el texto y los títulos | Google Fonts (v32) | [SIL Open Font License 1.1](https://openfontlicense.org) — © The Nunito Project Authors |
| `caveat-latin.woff2`, `caveat-latin-ext.woff2` | Caveat, lo escrito a mano: el saludo de la portada, el pie de la foto y el título de cada sección | Google Fonts (v23) | SIL Open Font License 1.1 — © The Caveat Project Authors |
| `iconos.woff2` | Los iconos que usa la web, recortados de Tabler Icons | `@tabler/icons-webfont` | [MIT](https://github.com/tabler/tabler-icons/blob/main/LICENSE) — © Paweł Kuna |

- Las dos tipografías son los mismos archivos que servía Google, sin tocar.
  «latin» cubre el español, el italiano y el inglés; «latin-ext» solo se
  descarga si alguna página usa una letra de fuera de ese juego.
- `iconos.woff2` **no se edita a mano**: lo genera `herramientas/iconos.py`
  con los iconos que encuentra en las páginas. Si se usa uno nuevo,
  `herramientas/revisar.py` avisa y basta con volver a pasar `iconos.py`.
- Las reglas `@font-face` están arriba del todo en `styles.css`.
- Fredoka (los títulos redondeados) se quitó en noviembre de 2026 para dar
  a la web un aspecto más sobrio: los títulos van ahora en Nunito.
