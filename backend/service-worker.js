// =============================================
// SERVICE WORKER - LABIA PWA
// =============================================

const CACHE_NAME = 'laboria-pwa-v1';
const STATIC_CACHE_NAME = 'laboria-static-v1';
const API_CACHE_NAME = 'laboria-api-v1';

// Archivos estáticos que siempre se cachearán
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/icon-192x192.png',
    '/assets/icon-512x512.png',
    '/styles/styles.css',
    '/styles/accessibility-ux.css',
    '/js/api-client.js',
    '/shared/constants-production.js',
    '/shared/ui-system.js',
    '/shared/notification-system.js',
    '/shared/navigation-system.js'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('📦 Cacheando archivos estáticos...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker instalado correctamente');
                return self.skipWaiting();
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker: Activando...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('🗑️ Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker activado');
            return self.clients.claim();
        })
    );
});

// Interceptar peticiones de red
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Estrategia de caché
    if (request.method === 'GET') {
        
        // 1. Para archivos estáticos: Cache First
        if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/styles/') || 
            url.pathname.startsWith('/js/') || url.pathname.startsWith('/shared/')) {
            event.respondWith(
                caches.match(request)
                    .then(response => {
                        if (response) {
                            console.log('📦 Sirviendo desde cache:', request.url);
                            return response;
                        }
                        
                        // Si no está en cache, fetchear y cachear
                        console.log('🌐 Fetch y cache:', request.url);
                        return fetch(request)
                            .then(response => {
                                if (response.ok) {
                                    const responseClone = response.clone();
                                    caches.open(STATIC_CACHE_NAME)
                                        .then(cache => cache.put(request, responseClone));
                                    return response;
                                }
                                throw new Error('Network response was not ok');
                            })
                            .catch(() => {
                                // Fallback para offline
                                return new Response('Offline', {
                                    status: 503,
                                    statusText: 'Service Unavailable'
                                });
                            });
                    })
            );
            return;
        }
        
        // 2. Para API: Network First con fallback a cache
        if (url.pathname.startsWith('/api/')) {
            event.respondWith(
                fetch(request)
                    .then(response => {
                        if (response.ok) {
                            // Cachear respuestas exitosas (solo GET)
                            if (request.method === 'GET') {
                                const responseClone = response.clone();
                                caches.open(API_CACHE_NAME)
                                    .then(cache => cache.put(request, responseClone));
                            }
                            return response;
                        }
                        throw new Error('Network response was not ok');
                    })
                    .catch(() => {
                        // Fallback a cache si la red falla
                        console.log('🔄 Fallback a cache para API:', request.url);
                        return caches.match(request)
                            .then(cachedResponse => {
                                if (cachedResponse) {
                                    return cachedResponse;
                                }
                                // Si no hay cache, responder con error
                                return new Response(JSON.stringify({
                                    success: false,
                                    message: 'Offline - No hay conexión a internet',
                                    offline: true
                                }), {
                                    status: 503,
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            });
                    })
            );
            return;
        }
        
        // 3. Para otros recursos: Network First
        event.respondWith(
            fetch(request)
                .catch(() => {
                    // Fallback offline para otras páginas
                    if (request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                })
        );
    } else {
        // Para peticiones no-GET (POST, PUT, DELETE): Network only
        event.respondWith(
            fetch(request)
                .catch(() => {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Offline - Operación no disponible sin conexión',
                        offline: true
                    }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
    }
});

// Background Sync para sincronización cuando vuelve online
self.addEventListener('sync', event => {
    console.log('🔄 Background Sync:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Aquí podrías implementar lógica para sincronizar datos
            // cuando la conexión se restablece
            Promise.resolve('Background sync completed')
        );
    }
});

// Push notifications
self.addEventListener('push', event => {
    console.log('📱 Push notification recibida:', event);
    
    const options = {
        body: event.data.text(),
        icon: '/assets/icon-192x192.png',
        badge: '/assets/icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Explorar Laboria',
                icon: '/assets/icon-96x96.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/assets/icon-96x96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Laboria', options)
    );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', event => {
    console.log('🔔 Notification click:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openAll()
                .then(clients => {
                    const client = clients.find(client => 'focus' in client);
                    if (client) {
                        client.navigate('/');
                    } else {
                        clients[0].navigate('/');
                    }
                })
        );
    }
});

// Periodic Background Sync (opcional)
self.addEventListener('periodicsync', event => {
    console.log('⏰ Periodic Background Sync:', event.tag);
    
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Aquí podrías implementar sincronización periódica de datos
            Promise.resolve('Periodic sync completed')
        );
    }
});

console.log('🔧 Service Worker Laboria PWA cargado');
