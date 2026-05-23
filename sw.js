// Service Worker para Mi Jardincito
// Estrategia: network-first para HTML/JSON, cache-first para assets estáticos
// El cache se versiona automáticamente con BUILD_TIMESTAMP

const BUILD_VERSION = '1778623625';
const CACHE_NAME = 'jardincito-' + BUILD_VERSION;

// Archivos a precachar
const STATIC_ASSETS = [
  'css/style.css',
  'js/data.js',
  'js/engine.js',
  'js/games.js',
  'js/ui.js',
  'js/achievements.js',
  'js/main.js',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'apple-touch-icon-167.png',
  'apple-touch-icon-152.png',
  'apple-touch-icon-120.png',
  'favicon-16.png',
  'favicon-32.png',
];

// Archivos que SIEMPRE deben buscarse en la red primero
const NETWORK_FIRST = [
  '/',
  './',
  'index.html',
  'manifest.json',
  'sw.js',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install', BUILD_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  // Forzar al SW nuevo a tomar control inmediato (no esperar a que se cierre la pestaña)
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate', BUILD_VERSION);
  event.waitUntil(
    Promise.all([
      // Borrar caches viejos (versiones anteriores del SW)
      caches.keys().then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME && k.startsWith('jardincito-'))
            .map(k => {
              console.log('[SW] Deleting old cache:', k);
              return caches.delete(k);
            })
      )),
      // Tomar control inmediato de las pestañas abiertas
      self.clients.claim(),
    ])
  );
  
  // Avisar a todas las pestañas abiertas que hay nueva versión
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NEW_VERSION', version: BUILD_VERSION });
    });
  });
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const path = url.pathname.split('/').pop() || '/';
  
  // Para HTML, manifest y sw.js: network-first
  // Esto garantiza que las actualizaciones se vean al instante
  const isNetworkFirst = NETWORK_FIRST.includes(path) ||
                         url.pathname === '/' ||
                         url.pathname.endsWith('/') ||
                         url.pathname.endsWith('.html') ||
                         url.pathname.endsWith('manifest.json');
  
  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Guardar copia en cache por si después no hay red
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Sin red: usar lo que tengamos en cache
          return caches.match(event.request).then(r => r || caches.match('./') || caches.match('index.html'));
        })
    );
    return;
  }
  
  // Para assets estáticos: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ============================================
// NOTIFICACIONES
// ============================================
let notifTimer = null;

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;
  
  if (data.type === 'SCHEDULE_NOTIF') {
    scheduleNotif(data.delay);
  } else if (data.type === 'CANCEL_NOTIF') {
    if (notifTimer) { clearTimeout(notifTimer); notifTimer = null; }
  } else if (data.type === 'TEST_NOTIF') {
    showJardincitoNotif('¡Las notificaciones funcionan! 🎉');
  } else if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'GET_VERSION') {
    event.source.postMessage({ type: 'VERSION', version: BUILD_VERSION });
  }
});

function scheduleNotif(delayMs) {
  if (notifTimer) clearTimeout(notifTimer);
  notifTimer = setTimeout(() => {
    showJardincitoNotif();
    const nextDelay = (2 + Math.random() * 4) * 60 * 60 * 1000;
    scheduleNotif(nextDelay);
  }, delayMs);
}

function randomMessage() {
  const msgs = [
    '¡Gatina y Maximo te están esperando! 🐈',
    '¡Tus mascotas tienen hambre! 🦴',
    '¡Meme quiere que la acaricies! 💕',
    'Pepa no para de mover la colita 🐕',
    'Uma se quedó dormida esperándote 💤',
    '¡Roedor encontró una galletita! 🧀',
    'Filippa y Hamilton están jugando 🎾',
    '¡Teo quiere salir a pasear! 🦮',
    'Tus amiguitos te extrañan 💛',
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function showJardincitoNotif(body) {
  return self.registration.showNotification('Mi Jardincito 🌷', {
    body: body || randomMessage(),
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'jardincito',
    renotify: true,
    vibrate: [200, 100, 200],
  });
}

self.addEventListener('push', (event) => {
  let body;
  if (event.data) { try { body = event.data.text(); } catch(e) {} }
  event.waitUntil(showJardincitoNotif(body));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) return w.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
