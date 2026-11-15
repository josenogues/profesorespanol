---
name: deploy-zip
description: Despliega un zip con una nueva versión del sitio (profesorespanol) a la rama main. Úsalo cuando el usuario adjunte un .zip con páginas/archivos del sitio y pida reemplazar, actualizar o desplegar el contenido del repositorio.
---

# Desplegar un zip del sitio a `main`

Este repo es un sitio estático (HTML/CSS/JS en la raíz) desplegado vía GitHub Pages
desde la rama `main`. Este skill reproduce el flujo ya validado para subir una
nueva versión del sitio a partir de un `.zip` que el usuario adjunta.

## 0. Antes de nada: confirmar acceso de escritura

El push a `main` puede fallar con **403** si la GitHub App "Claude" no tiene
permiso sobre este repo. Compruébalo pronto (no al final):

```
git push --dry-run origin main
```

- Si falla con 403 **antes** de negociar ninguna rama (error de autorización,
  no de red), el problema es de permisos, no del código. La corrección
  conocida (no adivines otras pantallas de ajustes):
  1. En claude.ai → avatar → **Settings → Connectors → GitHub Integration**.
     Si no hay gestión de repos ahí, entonces:
  2. En GitHub → avatar → **Settings → Integrations → Applications →
     Installed GitHub Apps** → busca la app de Claude/Anthropic → **Configure**
     → en "Repository access" añade `profesorespanol` (o selecciona
     "All repositories") → Save.
  - Nota: si el repo ya estaba en el scope de la sesión desde el inicio, el
    clon local puede ser de solo lectura. Usa la tool `add_repo` (owner
    `josenogues`, repo `profesorespanol`, `access: "push"`) y clona en la ruta
    que te indique (normalmente `/workspace/profesorespanol`) si el clon de
    trabajo no tiene push. No asumas que el directorio de trabajo por defecto
    tiene permisos de escritura.
  - No sigas reintentando el push en bucle si da 403 repetidamente: es un
    problema de autorización, no transitorio. Pide al usuario que arregle el
    permiso y explica exactamente los dos sitios de arriba.

## 1. Descomprimir el zip

Descomprime en el directorio scratchpad de la sesión (nunca directamente sobre
el repo):

```
unzip -o "<ruta_del_zip>" -d "<scratchpad>/deploy-zip-<nombre>"
```

## 2. Comparar contra el repo actual

El repo ya no es solo HTML/CSS/JS sueltos en la raíz: también hay subcarpetas
(`banderas/` SVGs, `herramientas/` scripts Python, `fuentes/`, etc.) y nuevas
familias de páginas (`clase-*.html`, `profesional-*.html`, etc.). No asumas
una lista fija de extensiones: compara recursivamente todo lo que traiga el
zip contra todo lo que hay en el repo (excluyendo `.git` y `.claude`).

Antes de copiar nada, calcula:
- Archivos que coinciden por ruta (se sobrescribirán).
- Archivos nuevos en el zip que no existen en el repo (páginas/temas/scripts
  nuevos).
- Archivos que están en el repo pero no en el zip (normalmente ninguno; si los
  hay, probablemente no se deben borrar sin confirmar).

```
cd <scratchpad>/deploy-zip-<nombre>
diff -rq . /home/user/profesorespanol --exclude=.git --exclude=.claude
# o, para listas de rutas:
find . -type f | sed 's|^\./||' | sort > /tmp/zip_files.txt
(cd /home/user/profesorespanol && git ls-files) | sort > /tmp/repo_files.txt
comm -23 /tmp/repo_files.txt /tmp/zip_files.txt   # solo en repo
comm -13 /tmp/repo_files.txt /tmp/zip_files.txt   # solo en zip (nuevos)
```

Si hay archivos nuevos (temas/páginas que no existían), **pregunta al usuario**
con `AskUserQuestion` si quiere añadirlos también o solo sobrescribir los que
coinciden por nombre — ha pasado antes que el zip trae contenido adicional
(p. ej. versiones `-es.html` o temas nuevos) que no estaba explícito en la
petición.

## 3. Revisar `script.js` antes de copiar: proteger la puerta de acceso

**Regla fija del proyecto: la puerta de acceso por email nunca se desactiva
para "hacer que algo funcione".** Antes de aplicar el `script.js` del zip:

```
grep -n "ACCESS_GATE_ENABLED" <scratchpad>/.../script.js
```

- Si el zip trae `ACCESS_GATE_ENABLED = false` y en el repo actual (o en
  `origin/main`) está en `true`, **no lo sobrescribas silenciosamente**:
  aplica el resto de cambios del `script.js` nuevo pero fuerza
  `ACCESS_GATE_ENABLED = true` con un Edit puntual, y dilo explícitamente en
  tu resumen al usuario. Si tienes dudas, pregunta con `AskUserQuestion` en
  vez de asumir.
- Comprueba también que `SHEET_CSV_URL` siga apuntando al Google Sheet
  correcto (no al placeholder `PEGA_AQUI_TU_URL_CSV_DE_GOOGLE_SHEETS`).

## 4. Copiar los archivos

Copia desde el directorio descomprimido a la raíz del repo preservando la
estructura de subcarpetas (`cp -r` o rsync si está disponible, si no `cp`
archivo por archivo incluyendo los de `banderas/`, `herramientas/`, etc.),
aplicando lo decidido en los pasos 2 y 3. No borres archivos del repo que no
estén en el zip salvo que el usuario lo pida explícitamente.

## 5. Verificar que no queden referencias rotas

```
for f in $(grep -ohE '(href|src)="[^"#h][^"]*\.html"' *.html | sed -E 's/^(href|src)="//; s/"$//' | sort -u); do
  [ -f "$f" ] || echo "FALTA: $f"
done
```

Sin salida = todo correcto. Si falta algo, repórtalo antes de hacer commit.

## 6. Commit y push a `main`

- Haz `git fetch origin main` primero y comprueba que tu base local no está
  desactualizada; si `origin/main` avanzó (p. ej. alguien subió algo por la
  web de GitHub directamente), reconcilia el contenido final (el zip manda
  como versión más completa, salvo que el usuario diga lo contrario) en vez
  de intentar un push que será rechazado.
- Mensaje de commit descriptivo (qué páginas/temas se añaden o cambian, y si
  se mantuvo la puerta de acceso activa). Incluye las líneas de atribución
  que indique el sistema para esta sesión.
- `git push origin main` (o `-u` la primera vez). Si fuera `/workspace/<repo>`
  el clon con permisos de escritura, haz el push desde ahí.

## 7. Confirmar el resultado

- Resume al usuario: cuántas páginas quedaron en total, qué se añadió, y si
  se preservó `ACCESS_GATE_ENABLED = true`.
- Recuerda que GitHub Pages puede tardar 30s–2min en servir la nueva versión,
  y que una recarga forzada (`Ctrl+Shift+R`) descarta la caché del navegador.
- No puedes verificar la URL pública (`https://josenogues.github.io/profesorespanol/`)
  con WebFetch/curl: el proxy de red de este entorno bloquea ese host. Dilo
  en vez de fingir que lo comprobaste, y pide al usuario que confirme desde
  su navegador.
