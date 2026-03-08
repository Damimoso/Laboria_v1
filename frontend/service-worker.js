// =============================================
// SERVICE WORKER LABORIA - FASE 6 NEXT-GEN
// =============================================

const CACHE_NAME = 'laboria-fase6-v1.0.0';
const API_CACHE_NAME = 'laboria-api-v1.0.0';
const STATIC_CACHE_NAME = 'laboria-static-v1.0.0';

// Archivos estáticos críticos para cache
const STATIC_ASSETS = [
    '/',
    '/pages/index.html',
    '/shared/constants-production.js',
    '/js/api-client.js',
    '/shared/ui-system.js',
    '/shared/notification-system.js',
    '/shared/navigation-system.js',
    '/styles/styles.css',
    '/styles/accessibility-ux.css',
    '/styles/theme-switcher.js',
    '/styles/landing-page-optimized.js',
    '/assets/logo-blanco-vertical.png',
    '/assets/favicon.ico',
    '/icons/icon-192x192.png'
];

// URLs de API para cache
const API_ENDPOINTS = [
    '/api/health',
    '/api/auth/login/usuario',
    '/api/auth/login/admin',
    '/api/users/profile',
    '/api/jobs',
    '/api/courses',
    '/api/notifications'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('🚀 Laboria Fase 6 SW: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Laboria Fase 6 SW: Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Laboria Fase 6 SW: Installation complete');
                // Forzar activación inmediata
                self.skipWaiting();
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('🔄 Laboria Fase 6 SW: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => 
                            cacheName !== CACHE_NAME && 
                            cacheName !== API_CACHE_NAME && 
                            cacheName !== STATIC_CACHE_NAME
                        )
                        .map((cacheName) => {
                            console.log('🗑️ Laboria Fase 6 SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('✅ Laboria Fase 6 SW: Activation complete');
                // Tomar control de todas las páginas abiertas
                return self.clients.claim();
            })
    );
});

// Estrategia de cache inteligente
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Solo para requests del mismo dominio
    if (url.origin !== self.location.origin) {
        return;
    }
    
    // Estrategia para diferentes tipos de contenido
    if (request.method === 'GET') {
        if (isStaticAsset(request.url)) {
            event.respondWith(cacheFirst(request));
        } else if (isAPIRequest(request.url)) {
            event.respondWith(networkFirst(request));
        } else {
            event.respondWith(staleWhileRevalidate(request));
        }
    } else if (request.method === 'POST' && isAPIRequest(request.url)) {
        event.respondWith(networkOnly(request));
    }
});

// Determinar si es un asset estático
function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.includes(asset)) ||
           url.includes('/assets/') ||
           url.includes('/icons/') ||
           url.includes('/styles/') ||
           url.includes('/js/') ||
           url.endsWith('.css') ||
           url.endsWith('.js') ||
           url.endsWith('.png') ||
           url.endsWith('.jpg') ||
           url.endsWith('.jpeg') ||
           url.endsWith('.gif') ||
           url.endsWith('.svg') ||
           url.endsWith('.ico');
}

// Determinar si es un request de API
function isAPIRequest(url) {
    return url.includes('/api/') || API_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

// Estrategia: Cache First (para assets estáticos)
function cacheFirst(request) {
    return caches.match(request)
        .then((response) => {
            if (response) {
                console.log('📦 Laboria Fase 6 SW: Cache hit:', request.url);
                return response;
            }
            
            console.log('🌐 Laboria Fase 6 SW: Network request:', request.url);
            return fetch(request)
                .then((response) => {
                    // Cachear respuesta exitosa
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(STATIC_CACHE_NAME)
                            .then((cache) => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch((error) => {
                    console.error('❌ Laboria Fase 6 SW: Network error:', error);
                    return new Response('Network error', { status: 500 });
                });
        });
}

// Estrategia: Network First (para API)
function networkFirst(request) {
    return fetch(request)
        .then((response) => {
            console.log('🌐 Laboria Fase 6 SW: Network success:', request.url);
            
            // Cachear respuesta exitosa de API
            if (response.ok) {
                const responseClone = response.clone();
                caches.open(API_CACHE_NAME)
                    .then((cache) => cache.put(request, responseClone));
            }
            return response;
        })
        .catch(() => {
            console.log('📦 Laboria Fase 6 SW: Network failed, trying cache:', request.url);
            return caches.match(request)
                .then((response) => {
                    return response || new Response('Offline', { status: 503 });
                });
        });
}

// Estrategia: Stale While Revalidate (para contenido dinámico)
function staleWhileRevalidate(request) {
    return caches.open(CACHE_NAME)
        .then((cache) => {
            return cache.match(request)
                .then((response) => {
                    const fetchPromise = fetch(request)
                        .then((networkResponse) => {
                            if (networkResponse.ok) {
                                cache.put(request, networkResponse.clone());
                            }
                            return networkResponse;
                        })
                        .catch(() => response);
                    
                    // Devolver respuesta cacheada inmediatamente
                    return response || fetchPromise;
                });
        });
}

// Estrategia: Network Only (para requests POST)
function networkOnly(request) {
    console.log('🌐 Laboria Fase 6 SW: Network only:', request.url);
    return fetch(request)
        .catch((error) => {
            console.error('❌ Laboria Fase 6 SW: Network error:', error);
            return new Response('Network error', { status: 500 });
        });
}

// Sincronización en background
self.addEventListener('sync', (event) => {
    console.log('🔄 Laboria Fase 6 SW: Background sync:', event.tag);
    
    if (event.tag === 'sync-notifications') {
        event.waitUntil(
            fetch('/api/notifications/sync')
                .then((response) => response.json())
                .then((data) => {
                    // Enviar notificaciones a clientes activos
                    self.clients.matchAll()
                        .then((clients) => {
                            clients.forEach((client) => {
                                client.postMessage({
                                    type: 'NOTIFICATIONS_SYNC',
                                    data: data
                                });
                            });
                        });
                })
                .catch((error) => {
                    console.error('❌ Laboria Fase 6 SW: Sync error:', error);
                })
        );
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    console.log('📬 Laboria Fase 6 SW: Push notification received');
    
    const options = {
        body: event.data.text(),
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [200, 100, 200],
        data: event.data.json(),
        actions: [
            {
                action: 'view',
                title: 'Ver',
                icon: '/icons/icon-96x96.png'
            },
            {
                action: 'dismiss',
                title: 'Cerrar',
                icon: '/icons/icon-96x96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Laboria', options)
    );
});

// Manejo de notificaciones clickeadas
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Laboria Fase 6 SW: Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// Manejo de mensajes desde el cliente
self.addEventListener('message', (event) => {
    console.log('📨 Laboria Fase 6 SW: Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        event.waitUntil(
            caches.delete(CACHE_NAME)
                .then(() => {
                    return caches.open(CACHE_NAME)
                        .then((cache) => cache.addAll(STATIC_ASSETS));
                })
        );
    }
});

// Limpieza periódica de cache
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_CLEANUP') {
        console.log('🧹 Laboria Fase 6 SW: Cache cleanup requested');
        
        event.waitUntil(
            caches.keys()
                .then((cacheNames) => {
                    return Promise.all(
                        cacheNames.map((cacheName) => {
                            if (cacheName.includes('laboria-')) {
                                return caches.delete(cacheName);
                            }
                        })
                    );
                })
        );
    }
});

console.log('🚀 Laboria Fase 6 Next-Gen Service Worker Loaded');
