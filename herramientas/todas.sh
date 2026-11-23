#!/bin/bash
# Pasa toda la batería y resume. Uso: bash herramientas/todas.sh [archivo.log]
# Necesita el sitio servido en local: python3 -m http.server 8947
# Tarda unos 15 minutos.
cd "$(dirname "$0")/.."
out=${1:-/tmp/bateria.log}
: > "$out"
# el python que tenga Playwright (en el entorno de Claude Code suele ser /usr/bin/python3)
PY=python3
$PY -c "import playwright" 2>/dev/null || PY=/usr/bin/python3
for t in revisar transparentes revisa_banco prueba_banco prueba_entrada prueba_panel prueba_repaso prueba_lectura prueba_buscador prueba_portada prueba_idioma prueba_menu prueba_hub prueba_hoy prueba_examen prueba_ejercicios prueba_resenas prueba_apuntes; do
  echo "=== $t" >> "$out"
  $PY herramientas/$t.py >> "$out" 2>&1
  echo "--- exit $? ($t)" >> "$out"
done
grep -E "^--- exit" "$out"
