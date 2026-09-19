FERIA FOTO → PRODUCTO V3.2

CAMBIO PRINCIPAL
V3.2 cambia el flujo a AI-FIRST. La salida normal ya no es el recorte rápido aproximado de V3.1. Primero intenta aislar el producto con IMG.LY ISNet FP16, que conserva más información que el modelo cuantizado de 8 bits usado antes. Solo si la IA falla se usa el respaldo local.

MEJORAS
- Recorte de producto con ISNet FP16.
- GPU/WebGPU cuando el navegador/dispositivo lo soporta; CPU como respaldo.
- Sin límite artificial de 12 segundos.
- Sin preload masivo del modelo: se evita descargar cientos de recursos de golpe en móviles.
- Entrada de IA ampliada hasta 2,200 px de lado para conservar más detalle.
- Limpieza de alfa para reducir halos y restos débiles de fondo.
- La exportación sigue limitada únicamente por el máximo elegido (por defecto 3,000 px).
- No hay límite de cantidad de fotos impuesto por la aplicación; queda condicionado por el almacenamiento/memoria disponible en el dispositivo.
- JPG/JPEG, fondo blanco u oscuro y ZIP se mantienen.
- Las fotos se procesan en el navegador/dispositivo; no se suben como imágenes a un servidor propio de la app.

IMPORTANTE
La primera foto después de instalar/limpiar la caché puede tardar más porque el navegador necesita descargar el modelo. Después queda en caché y las siguientes fotos son mucho más rápidas. La calidad de ISNet FP16 es preferida sobre el modelo cuantizado de 8 bits para este flujo de productos.

iPHONE / iOS
La versión web usa las capacidades del navegador, incluida WebGPU si está disponible. iOS también dispone de APIs nativas de Vision para separar objetos, pero una página web normal no puede llamar directamente a esas APIs nativas. Para usar Vision directamente habría que convertir la solución en una app nativa/híbrida para iPhone.

LICENCIA
Revisar LICENCIAS.txt antes de usar esta solución como producto comercial o distribuirla fuera del entorno interno.
