# Píldoras de español (vídeos cortos)

Vídeos verticales (1080×1920, formato Reels/TikTok/Shorts) con curiosidades
del español: falsos amigos, España vs. América, orígenes de expresiones…
No explican una clase: sirven de gancho en la web y de promoción en redes.

La web no usa esta carpeta todavía.

## Cómo es una píldora
- Voz en **un** idioma (el que tenga sentido para esa píldora); lo que se
  aprende en español lo dice una voz española.
- Tres versiones con subtítulos y rótulos en italiano, español e inglés.
- Estructura fija: gancho en el fotograma 0 → la trampa → ejemplo →
  ¿lo sabías? → extra → cierre con la próxima píldora y el logo. 25–30 s.

## Archivos
- `guion_<nombre>.py`: el guion (textos por idioma y qué aparece en pantalla).
- `pildora.html`: la plantilla visual (estilo, dibujos, animaciones).
- `hacer_pildora.py`: monta el vídeo.
- `audio/<nombre>/`: la voz ya generada (se reutiliza en las tres versiones).
- `videos/`: los vídeos terminados.

## Generar
```
python3 hacer_pildora.py burro it          # vídeo con subtítulos en italiano
python3 hacer_pildora.py burro it 0,5,10   # solo capturas (en tmp/)
```
La voz es de Azure (voces neuronales de Microsoft). Sin la variable
`AZURE_REGION` y su clave configurada, el vídeo sale sin voz y con la duración
estimada.
