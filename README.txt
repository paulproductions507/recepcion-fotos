FERIA FOTO -> PRODUCTO V5.3

Esta version corrige el fallo de V5.2: el SDK de MediaPipe estaba fijado a 0.10.35 mientras se cargaba el modelo Interactive Segmenter v2 actual, provocando INVALID_ARGUMENT / model is not a valid Flatbuffer buffer.

V5.3 usa @mediapipe/tasks-vision 1.0.1 y el modelo Interactive Segmenter v2 Magic Touch int8/latest, siguiendo la configuracion actual documentada por Google.

Uso: sustituir el index.html anterior en GitHub Pages.
