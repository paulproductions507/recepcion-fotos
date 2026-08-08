# Recibos & Catálogo Pro

Aplicación web para registrar recibos, capturar fotos de productos, quitar fondos en el navegador, elegir fondo blanco/negro, comprimir las imágenes finales a menos de 3 MB y generar un ZIP con todos los JPG/JPEG sueltos.

## Requisitos

- Node.js 20+ recomendado.
- Navegador moderno en Android, iPhone o escritorio.
- Para la eliminación de fondo, el sitio debe publicarse con aislamiento de origen cruzado. Ya están incluidos:
  - `vercel.json` para Vercel.
  - `public/_headers` para Cloudflare Pages.

## Instalar

```bash
npm install
npm run dev
```

## Publicar

```bash
npm run build
```

La carpeta de salida es `dist/`.

## Flujo

1. Crear recibo y proveedor.
2. Agregar ítem.
3. Descripción, referencia y código del sistema.
4. Tomar/cargar foto original.
5. Elegir fondo blanco o negro.
6. El original se conserva en IndexedDB del dispositivo.
7. La transformación entra en una cola y el usuario puede seguir agregando ítems.
8. Al finalizar, cada imagen procesada se exporta como JPEG.
9. El compresor busca automáticamente la mejor calidad que quede por debajo de 2.98 MB.
10. Se genera:
   `RECIBO_<numero>_<proveedor>.zip`
   con todos los JPG/JPEG directamente dentro de la carpeta, sin ZIP por artículo.

## Importante sobre almacenamiento

No se usa `localStorage` para las fotos. Los originales son demasiado grandes para ese mecanismo. Se usa IndexedDB, que es el almacenamiento local apropiado para blobs grandes.

## IA

Se utiliza `@imgly/background-removal` en el navegador. La primera ejecución descarga el modelo y WASM; después el navegador puede reutilizar su caché. El procesamiento de la imagen se hace localmente.

## Próximo paso recomendado

Esta es una base funcional de la aplicación. Antes de usarla con 48 artículos reales, probar:
- 1 zapato oscuro con fondo blanco.
- 1 zapato blanco con fondo negro.
- 5 artículos seguidos.
- 48 artículos.
- ZIP final y compatibilidad con el sistema que recibe las imágenes.
