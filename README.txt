FERIA FOTO → PRODUCTO V5

Esta versión abandona los recortes por color y usa MediaPipe Interactive Segmenter, un segmentador interactivo que corre en el navegador/dispositivo. La aplicación genera automáticamente varios puntos positivos alrededor del centro de la foto para identificar el producto principal, y usa la máscara resultante para reemplazar el entorno por blanco u oscuro.

Uso: subir index.html a GitHub Pages o cualquier hosting HTTPS y abrirlo desde Safari en iPhone.

Nota: el modelo se descarga la primera vez. Después queda en caché del navegador cuando es posible. Las fotos no se envían a un servidor para la segmentación; MediaPipe procesa la entrada en el dispositivo.

Licencia: MediaPipe Tasks está bajo Apache-2.0. Revisar las licencias de dependencias/CDN antes de distribución comercial.
