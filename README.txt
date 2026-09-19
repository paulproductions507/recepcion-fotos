FERIA FOTO → PRODUCTO V3.0

Corrección principal:
- Cámara y galería usan controles nativos <label for> en lugar de intentar abrir un input display:none mediante JavaScript. Esto evita el fallo de interacción en iPhone/iPad y navegadores móviles.
- La aplicación es interactiva inmediatamente; la IA NO se carga al iniciar.
- La IA se carga solamente al procesar una foto.
- El procesamiento usa el pipeline de background-removal de Transformers.js con BiRefNet Lite 512 y, si falla, usa un recorte local de respaldo.
- IndexedDB guarda la sesión localmente.
- ZIP se genera sin librerías externas.

Publicación recomendada: GitHub Pages / HTTPS.
Archivo de entrada: index.html
