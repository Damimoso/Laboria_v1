/**
 * Service Worker - Caching Inteligente y Offline Support
 * Proporciona caching avanzado, prefetching y soporte offline
 */

const CACHE_NAME = 'laboria-v1.0.0';
const STATIC_CACHE = 'laboria-static-v1.0.0';
const DYNAMIC_CACHE = 'laboria-dynamic-v1.0.0';
const RUNTIME_CACHE = 'laboria-runtime-v1.0.0';

// URLs que siempre se sirven desde la red
const NETWORK_ONLY = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/user/profile',
    '/api/user/settings'
];

// URLs que siempre se sirven desde caché
const CACHE_ONLY = [
    '/offline.html',
    '/manifest.json'
];

// URLs que se cachean por primera vez
const CACHE_FIRST = [
    '/shared/',
    '/styles/',
    '/assets/',
    '/js/'
];

// URLs que usan estrategia network-first
const NETWORK_FIRST = [
    '/api/',
    '/pages/',
    '/usuario/'
];

// URLs que se prefetchen
const PREFETCH_URLS = [
    '/pages/index.html',
    '/pages/forgot-password.html',
    '/pages/404.html',
    '/shared/constants.js',
    '/shared/device-detection.js',
    '/shared/loading-system.js',
    '/shared/error-handling.js',
    '/shared/form-validation.js',
    '/shared/ui-system.js',
    '/shared/notification-system.js',
    '/shared/navigation-system-clean.js',
    '/shared/performance-optimizer.js'
];

// Evento de instalación
self.addEventListener('install', (event) => {
    console.log('📦 Service Worker instalando...');
    
    event.waitUntil(
        (async () => {
            // Crear caches
            const staticCache = await caches.open(STATIC_CACHE);
            const dynamicCache = await caches.open(DYNAMIC_CACHE);
            
            // Prefetch recursos críticos
            console.log('⚡ Prefetching recursos críticos...');
            await prefetchCriticalResources(staticCache);
            
            // Forzar activación inmediata
            self.skipWaiting();
            
            console.log('✅ Service Worker instalado');
        })()
    );
});

// Evento de activación
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker activando...');
    
    event.waitUntil(
        (async () => {
            // Limpiar caches antiguos
            const cacheNames = await caches.keys();
            const oldCaches = cacheNames.filter(name => 
                name !== CACHE_NAME && 
                name !== STATIC_CACHE && 
                name !== DYNAMIC_CACHE && 
                name !== RUNTIME_CACHE
            );
            
            await Promise.all(
                oldCaches.map(name => {
                    console.log('🗑️ Eliminando cache antiguo:', name);
                    return caches.delete(name);
                })
            );
            
            // Tomar control de todas las páginas
            await clients.claim();
            
            console.log('✅ Service Worker activado');
        })()
    );
});

// Evento principal de fetch
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Solo manejar requests HTTP/HTTPS
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Estrategia de caché según el tipo de URL
    if (shouldUseNetworkOnly(url)) {
        return event.respondWith(networkOnly(request));
    }
    
    if (shouldUseCacheOnly(url)) {
        return event.respondWith(cacheOnly(request));
    }
    
    if (shouldUseCacheFirst(url)) {
        return event.respondWith(cacheFirst(request));
    }
    
    if (shouldUseNetworkFirst(url)) {
        return event.respondWith(networkFirst(request));
    }
    
    // Estrategia por defecto: stale-while-revalidate
    return event.respondWith(staleWhileRevalidate(request));
});

// Evento de mensaje
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            cacheUrls(data.urls);
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches();
            break;
            
        case 'GET_CACHE_STATS':
            getCacheStats().then(stats => {
                event.ports[0].postMessage({ type: 'CACHE_STATS', data: stats });
            });
            break;
            
        default:
            console.log('📨 Mensaje no manejado:', type, data);
    }
});

// Evento de sincronización en background
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(syncOfflineData());
    }
});

// Evento de push notification
self.addEventListener('push', (event) => {
    console.log('📢 Push notification recibida');
    
    const options = {
        body: 'Tienes una nueva notificación de Laboria',
        icon: '/assets/logo-blanco-vertical.png',
        badge: '/assets/favicon.ico',
        vibrate: [200, 100, 200],
        data: {
            url: '/pages/index.html'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('Laboria', options)
    );
});

// Evento de click en notificación
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notificación clickeada');
    
    event.notification.close();
    
    // Abrir la aplicación
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/pages/index.html')
    );
});

// Estrategia: Network Only
async function networkOnly(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch (error) {
        console.error('❌ Error en networkOnly:', error);
        return new Response('Error de conexión', { status: 503 });
    }
}

// Estrategia: Cache Only
async function cacheOnly(request) {
    try {
        const response = await caches.match(request);
        return response || new Response('Recurso no encontrado', { status: 404 });
    } catch (error) {
        console.error('❌ Error en cacheOnly:', error);
        return new Response('Error de caché', { status: 500 });
    }
}

// Estrategia: Cache First
async function cacheFirst(request) {
    try {
        // Intentar obtener de caché
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('📦 Sirviendo desde caché:', request.url);
            
            // Actualizar en background
            updateCacheInBackground(request);
            
            return cachedResponse;
        }
        
        // Si no está en caché, obtener de red
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            console.log('🌐 Cacheando respuesta:', request.url);
            const cache = await caches.open(getCacheName(request.url));
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Error en cacheFirst:', error);
        
        // Fallback a caché si hay error de red
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response('Error de conexión', { status: 503 });
    }
}

// Estrategia: Network First
async function networkFirst(request) {
    try {
        // Intentar obtener de red
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            console.log('🌐 Sirviendo desde red:', request.url);
            
            // Cachear respuesta para uso futuro
            const cache = await caches.open(getCacheName(request.url));
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Error en networkFirst, usando caché:', error);
        
        // Fallback a caché
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response('Recurso no disponible', { status: 503 });
    }
}

// Estrategia: Stale While Revalidate
async function staleWhileRevalidate(request) {
    try {
        const cache = await caches.open(RUNTIME_CACHE);
        const cachedResponse = await cache.match(request);
        
        // Crear request para red
        const networkRequest = request.clone();
        const fetchPromise = fetch(networkRequest);
        
        // Si hay respuesta en caché, devolverla inmediatamente
        if (cachedResponse) {
            console.log('📦 Sirviendo stale:', request.url);
            
            // Actualizar en background
            fetchPromise.then(networkResponse => {
                if (networkResponse.ok) {
                    cache.put(request, networkResponse);
                }
            }).catch(error => {
                console.error('❌ Error actualizando caché:', error);
            });
            
            return cachedResponse;
        }
        
        // Si no hay caché, esperar respuesta de red
        const networkResponse = await fetchPromise;
        
        if (networkResponse.ok) {
            console.log('🌐 Sirviendo desde red y cacheando:', request.url);
            cache.put(request, networkResponse);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Error en staleWhileRevalidate:', error);
        
        // Último intento: caché
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response('Error de conexión', { status: 503 });
    }
}

// Determinar si usar Network Only
function shouldUseNetworkOnly(url) {
    return NETWORK_ONLY.some(pattern => url.pathname.includes(pattern));
}

// Determinar si usar Cache Only
function shouldUseCacheOnly(url) {
    return CACHE_ONLY.some(pattern => url.pathname.includes(pattern));
}

// Determinar si usar Cache First
function shouldUseCacheFirst(url) {
    return CACHE_FIRST.some(pattern => url.pathname.includes(pattern));
}

// Determinar si usar Network First
function shouldUseNetworkFirst(url) {
    return NETWORK_FIRST.some(pattern => url.pathname.includes(pattern));
}

// Obtener nombre de caché según URL
function getCacheName(url) {
    if (shouldUseCacheFirst(url)) {
        return STATIC_CACHE;
    }
    
    if (shouldUseNetworkFirst(url)) {
        return DYNAMIC_CACHE;
    }
    
    return RUNTIME_CACHE;
}

// Prefetch de recursos críticos
async function prefetchCriticalResources(cache) {
    try {
        const prefetchPromises = PREFETCH_URLS.map(async url => {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                    console.log('⚡ Prefetched:', url);
                }
            } catch (error) {
                console.warn('⚠️ Error prefetching:', url, error);
            }
        });
        
        await Promise.all(prefetchPromises);
        console.log('✅ Prefetch completado');
    } catch (error) {
        console.error('❌ Error en prefetch:', error);
    }
}

// Actualizar caché en background
async function updateCacheInBackground(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(getCacheName(request.url));
            await cache.put(request, response);
        }
    } catch (error) {
        console.warn('⚠️ Error actualizando caché en background:', error);
    }
}

// Cachear URLs específicas
async function cacheUrls(urls) {
    try {
        const cache = await caches.open(RUNTIME_CACHE);
        const cachePromises = urls.map(async url => {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                    console.log('📦 Cached:', url);
                }
            } catch (error) {
                console.warn('⚠️ Error cacheando:', url, error);
            }
        });
        
        await Promise.all(cachePromises);
        console.log('✅ URLs cacheadas');
    } catch (error) {
        console.error('❌ Error cacheando URLs:', error);
    }
}

// Limpiar todos los caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(name => caches.delete(name))
        );
        console.log('🗑️ Todos los caches eliminados');
    } catch (error) {
        console.error('❌ Error limpiando caches:', error);
    }
}

// Obtener estadísticas de caché
async function getCacheStats() {
    try {
        const stats = {};
        const cacheNames = await caches.keys();
        
        for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            const sizes = await Promise.all(
                keys.map(async request => {
                    const response = await cache.match(request);
                    return response ? response.headers.get('content-length') || 0 : 0;
                })
            );
            
            stats[name] = {
                entries: keys.length,
                totalSize: sizes.reduce((sum, size) => sum + parseInt(size), 0)
            };
        }
        
        return stats;
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        return {};
    }
}

// Sincronizar datos offline
async function syncOfflineData() {
    try {
        // Obtener datos pendientes de IndexedDB
        const pendingData = await getPendingOfflineData();
        
        if (pendingData.length > 0) {
            console.log(`🔄 Sincronizando ${pendingData.length} elementos offline`);
            
            for (const data of pendingData) {
                try {
                    await fetch(data.url, {
                        method: data.method,
                        headers: data.headers,
                        body: data.body
                    });
                    
                    // Eliminar dato sincronizado
                    await removeOfflineData(data.id);
                } catch (error) {
                    console.error('❌ Error sincronizando dato:', data, error);
                }
            }
            
            console.log('✅ Sincronización completada');
        }
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
    }
}

// Obtener datos pendientes offline
async function getPendingOfflineData() {
    // Implementar obtención desde IndexedDB
    return []; // Placeholder
}

// Eliminar dato offline sincronizado
async function removeOfflineData(id) {
    // Implementar eliminación desde IndexedDB
    console.log('🗑️ Dato offline eliminado:', id);
}

// Manejar errores no controlados
self.addEventListener('error', (event) => {
    console.error('❌ Error no controlado en Service Worker:', event.error);
});

// Manejo de errores en eventos asíncronos
self.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rechazada en Service Worker:', event.reason);
});

console.log('🚀 Service Worker de Laboria inicializado');
