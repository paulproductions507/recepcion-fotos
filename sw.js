// Service worker mínimo — solo existe para que Android permita
// "Agregar a pantalla de inicio" como app instalable.
// No cachea nada: la app siempre carga la versión más reciente del servidor.
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());
self.addEventListener('fetch', (e) => {
  // deja pasar todas las peticiones normalmente (sin caché)
});
