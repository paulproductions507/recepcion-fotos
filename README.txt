FERIA FOTO → PRODUCTO
Versión 1.0

Objetivo
- Tomar fotos de productos desde el teléfono.
- Asignar el número de producto inmediatamente.
- Procesar la foto localmente: aislar el producto, centrarlo y poner fondo blanco u oscuro.
- Limitar el lado mayor a 3,000 px por defecto.
- Elegir JPG o JPEG.
- Guardar las fotos en el dispositivo y exportarlas en un ZIP.

Uso
1. Abra index.html.
2. La app prepara la IA en segundo plano.
3. Pulse "Tomar foto" o "Elegir de galería".
4. Escriba el número de producto.
5. La foto entra a la lista y se procesa automáticamente.
6. Revise la lista; puede re-procesar una foto con ↻.
7. Marque las fotos que quiere exportar o use "Seleccionar todas".
8. Pulse "ZIP seleccionado".
9. El ZIP contiene archivos con el nombre del número de producto, por ejemplo:
   123456.jpg

Datos y privacidad
- Las fotos se almacenan en IndexedDB del navegador del dispositivo.
- La app no tiene servidor propio y no envía las fotos a un servidor de la empresa.
- La primera vez que se usa la IA, el navegador necesita conexión a Internet para descargar el motor/modelo. El navegador intenta conservarlos en caché para usos posteriores.
- Si la IA no puede cargarse, la app tiene un modo local rápido de recorte por contraste/borde.

Compatibilidad
- Diseñada para navegadores modernos de iPhone/iPad, Android y computadora.
- Para abrir como aplicación instalada, lo ideal es servir la carpeta como sitio HTTPS/PWA. La versión 1.0 está pensada como HTML descargable y de operación local.
