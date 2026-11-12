# Fuentes de la web

Todo lo que hay aquí se sirve desde la propia web: ninguna página pide
tipografías ni iconos a un servidor de fuera.

| Archivo | Qué es | Origen | Licencia |
|---|---|---|---|
| `nunito-latin.woff2`, `nunito-latin-ext.woff2` | Nunito, el texto | Google Fonts (v32) | [SIL Open Font License 1.1](https://openfontlicense.org) — © The Nunito Project Authors |
| `fredoka-latin.woff2`, `fredoka-latin-ext.woff2` | Fredoka, títulos y botones | Google Fonts (v17) | SIL Open Font License 1.1 — © The Fredoka Project Authors |
| `caveat-latin.woff2`, `caveat-latin-ext.woff2` | Caveat, el rótulo escrito a mano | Google Fonts (v23) | SIL Open Font License 1.1 — © The Caveat Project Authors |
| `iconos.woff2` | Los iconos que usa la web, recortados de Tabler Icons | `@tabler/icons-webfont` | [MIT](https://github.com/tabler/tabler-icons/blob/main/LICENSE) — © Paweł Kuna |

- Las tres tipografías son los mismos archivos que servía Google, sin tocar.
  «latin» cubre el español, el italiano y el inglés; «latin-ext» solo se
  descarga si alguna página usa una letra de fuera de ese juego.
- `iconos.woff2` **no se edita a mano**: lo genera `herramientas/iconos.py`
  con los iconos que encuentra en las páginas. Si se usa uno nuevo,
  `herramientas/revisar.py` avisa y basta con volver a pasar `iconos.py`.
- Las reglas `@font-face` están arriba del todo en `styles.css`.
