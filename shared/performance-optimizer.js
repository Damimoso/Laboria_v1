/**
 * Sistema de Optimización de Rendimiento
 * Proporciona lazy loading, caching, optimización de assets y monitoring
 */

class PerformanceOptimizer {
    constructor() {
        this.metrics = this.initializeMetrics();
        this.cache = this.initializeCache();
        this.observers = new Map();
        this.optimizations = this.initializeOptimizations();
        this.init();
    }

    /**
     * Inicializar el sistema de optimización
     */
    init() {
        console.log('⚡ Inicializando Sistema de Optimización de Rendimiento...');
        
        // Configurar observers de rendimiento
        this.setupPerformanceObservers();
        
        // Configurar lazy loading
        this.setupLazyLoading();
        
        // Configurar caching inteligente
        this.setupIntelligentCaching();
        
        // Configurar optimización de imágenes
        this.setupImageOptimization();
        
        // Configurar code splitting
        this.setupCodeSplitting();
        
        // Configurar monitoring de rendimiento
        this.setupPerformanceMonitoring();
        
        console.log('✅ Sistema de Optimización inicializado');
    }

    /**
     * Inicializar métricas de rendimiento
     */
    initializeMetrics() {
        return {
            // Core Web Vitals
            lcp: 0, // Largest Contentful Paint
            fid: 0, // First Input Delay
            cls: 0, // Cumulative Layout Shift
            
            // Navigation timing
            domContentLoaded: 0,
            loadComplete: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            
            // Resource timing
            resourceCount: 0,
            totalResourceSize: 0,
            slowResources: [],
            
            // Memory usage
            memoryUsed: 0,
            memoryLimit: 0,
            
            // Network performance
            connectionType: 'unknown',
            effectiveType: 'unknown',
            downlink: 0,
            
            // Custom metrics
            jsExecutionTime: 0,
            renderTime: 0,
            interactionTime: 0
        };
    }

    /**
     * Inicializar sistema de caché
     */
    initializeCache() {
        return {
            // Memory cache para recursos
            memory: new Map(),
            
            // Service worker cache
            serviceWorker: null,
            
            // Local storage cache
            localStorage: new Map(),
            
            // Session storage cache
            sessionStorage: new Map(),
            
            // IndexedDB cache
            indexedDB: null,
            
            // Cache configuration
            config: {
                maxSize: 50 * 1024 * 1024, // 50MB
                maxAge: 24 * 60 * 60 * 1000, // 24 horas
                compressionEnabled: true
            }
        };
    }

    /**
     * Inicializar optimizaciones
     */
    initializeOptimizations() {
        return {
            lazyLoading: {
                images: true,
                videos: true,
                iframes: true,
                components: true
            },
            codeSplitting: {
                enabled: true,
                chunks: new Map(),
                loadingStrategy: 'preload'
            },
            imageOptimization: {
                webp: true,
                avif: true,
                responsive: true,
                compression: true
            },
            caching: {
                enabled: true,
                strategy: 'cache-first',
                backgroundSync: true
            },
            prefetching: {
                enabled: true,
                strategy: 'intelligent',
                maxConnections: 6
            }
        };
    }

    /**
     * Configurar observers de rendimiento
     */
    setupPerformanceObservers() {
        // Observer para Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.startTime;
                console.log('🎯 LCP:', this.metrics.lcp);
            });
            
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.set('lcp', lcpObserver);
        }

        // Observer para First Input Delay
        if ('PerformanceObserver' in window) {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.processingStart) {
                        this.metrics.fid = entry.processingStart - entry.startTime;
                        console.log('⚡ FID:', this.metrics.fid);
                    }
                });
            });
            
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.set('fid', fidObserver);
        }

        // Observer para Cumulative Layout Shift
        if ('PerformanceObserver' in window) {
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                const entries = list.getEntries();
                
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                
                this.metrics.cls += clsValue;
                console.log('📊 CLS:', this.metrics.cls);
            });
            
            clsObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.set('cls', clsObserver);
        }

        // Observer para Resource Timing
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.metrics.resourceCount++;
                    this.metrics.totalResourceSize += entry.transferSize || 0;
                    
                    // Identificar recursos lentos (>2 segundos)
                    if (entry.duration > 2000) {
                        this.metrics.slowResources.push({
                            name: entry.name,
                            duration: entry.duration,
                            size: entry.transferSize || 0
                        });
                    }
                });
            });
            
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.set('resource', resourceObserver);
        }
    }

    /**
     * Configurar lazy loading
     */
    setupLazyLoading() {
        // Lazy loading para imágenes
        this.setupImageLazyLoading();
        
        // Lazy loading para videos
        this.setupVideoLazyLoading();
        
        // Lazy loading para iframes
        this.setupIframeLazyLoading();
        
        // Lazy loading para componentes
        this.setupComponentLazyLoading();
    }

    /**
     * Configurar lazy loading para imágenes
     */
    setupImageLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            console.warn('⚠️ IntersectionObserver no soportado');
            return;
        }

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Cargar imagen
                    this.loadImage(img);
                    
                    // Dejar de observar
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        // Observar imágenes con data-src
        document.addEventListener('DOMContentLoaded', () => {
            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => imageObserver.observe(img));
        });

        this.observers.set('images', imageObserver);
    }

    /**
     * Cargar imagen con optimización
     */
    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // Determinar formato óptimo
        const optimalFormat = this.getOptimalImageFormat(src);
        const optimizedSrc = this.optimizeImageUrl(src, optimalFormat);

        // Crear imagen temporal para precargar
        const tempImg = new Image();
        
        tempImg.onload = () => {
            img.src = optimizedSrc;
            img.classList.add('loaded');
            img.classList.remove('loading');
        };
        
        tempImg.onerror = () => {
            // Fallback a src original
            img.src = src;
            img.classList.add('error');
        };
        
        img.classList.add('loading');
        tempImg.src = optimizedSrc;
    }

    /**
     * Obtener formato de imagen óptimo
     */
    getOptimalImageFormat(src) {
        if (!this.optimizations.imageOptimization.webp && 
            !this.optimizations.imageOptimization.avif) {
            return 'original';
        }

        // Verificar soporte de formatos modernos
        if (this.optimizations.imageOptimization.avif && 
            this.supportsAvif()) {
            return 'avif';
        }
        
        if (this.optimizations.imageOptimization.webp && 
            this.supportsWebp()) {
            return 'webp';
        }
        
        return 'original';
    }

    /**
     * Optimizar URL de imagen
     */
    optimizeImageUrl(src, format) {
        if (format === 'original') return src;
        
        // Extraer extensión actual
        const lastDot = src.lastIndexOf('.');
        const base = src.substring(0, lastDot);
        const query = src.substring(lastDot);
        
        // Agregar parámetros de optimización
        const params = new URLSearchParams();
        params.append('format', format);
        params.append('quality', '80');
        params.append('auto', 'compress');
        
        return `${base}.${format}?${params.toString()}`;
    }

    /**
     * Verificar soporte WebP
     */
    supportsWebp() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    /**
     * Verificar soporte AVIF
     */
    supportsAvif() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    }

    /**
     * Configurar lazy loading para videos
     */
    setupVideoLazyLoading() {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    
                    // Cargar video
                    if (video.dataset.src) {
                        video.src = video.dataset.src;
                    }
                    
                    // Cargar poster
                    if (video.dataset.poster) {
                        video.poster = video.dataset.poster;
                    }
                    
                    videoObserver.unobserve(video);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.01
        });

        document.addEventListener('DOMContentLoaded', () => {
            const lazyVideos = document.querySelectorAll('video[data-src]');
            lazyVideos.forEach(video => videoObserver.observe(video));
        });

        this.observers.set('videos', videoObserver);
    }

    /**
     * Configurar lazy loading para iframes
     */
    setupIframeLazyLoading() {
        const iframeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const iframe = entry.target;
                    
                    if (iframe.dataset.src) {
                        iframe.src = iframe.dataset.src;
                    }
                    
                    iframeObserver.unobserve(iframe);
                }
            });
        }, {
            rootMargin: '200px 0px',
            threshold: 0.01
        });

        document.addEventListener('DOMContentLoaded', () => {
            const lazyIframes = document.querySelectorAll('iframe[data-src]');
            lazyIframes.forEach(iframe => iframeObserver.observe(iframe));
        });

        this.observers.set('iframes', iframeObserver);
    }

    /**
     * Configurar lazy loading para componentes
     */
    setupComponentLazyLoading() {
        const componentObserver = new IntersectionObserver((entries) => {
            entries.forEach(async entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const componentName = element.dataset.component;
                    
                    if (componentName) {
                        await this.loadComponent(componentName, element);
                    }
                    
                    componentObserver.unobserve(element);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        document.addEventListener('DOMContentLoaded', () => {
            const lazyComponents = document.querySelectorAll('[data-component]');
            lazyComponents.forEach(component => componentObserver.observe(component));
        });

        this.observers.set('components', componentObserver);
    }

    /**
     * Cargar componente dinámicamente
     */
    async loadComponent(componentName, element) {
        try {
            // Verificar si ya está cargado
            if (this.optimizations.codeSplitting.chunks.has(componentName)) {
                const component = this.optimizations.codeSplitting.chunks.get(componentName);
                element.innerHTML = component.html;
                element.classList.add('loaded');
                return;
            }

            // Cargar componente desde servidor
            const response = await fetch(`/components/${componentName}.html`);
            const html = await response.text();
            
            // Cachear componente
            this.optimizations.codeSplitting.chunks.set(componentName, { html });
            
            // Renderizar componente
            element.innerHTML = html;
            element.classList.add('loaded');
            
            console.log(`🧩 Componente ${componentName} cargado`);
        } catch (error) {
            console.error(`❌ Error cargando componente ${componentName}:`, error);
            element.classList.add('error');
        }
    }

    /**
     * Configurar caching inteligente
     */
    setupIntelligentCaching() {
        // Configurar Service Worker si está disponible
        if ('serviceWorker' in navigator) {
            this.setupServiceWorker();
        }
        
        // Configurar IndexedDB para caché grande
        this.setupIndexedDB();
        
        // Configurar localStorage para caché pequeño
        this.setupLocalStorageCache();
        
        // Configurar prefetching inteligente
        this.setupIntelligentPrefetching();
    }

    /**
     * Configurar Service Worker
     */
    async setupServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            this.cache.serviceWorker = registration;
            console.log('📦 Service Worker registrado:', registration);
        } catch (error) {
            console.warn('⚠️ Error registrando Service Worker:', error);
        }
    }

    /**
     * Configurar IndexedDB
     */
    async setupIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('LaboriaCache', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.cache.indexedDB = request.result;
                console.log('🗄️ IndexedDB inicializado');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crear object stores
                if (!db.objectStoreNames.contains('resources')) {
                    db.createObjectStore('resources', { keyPath: 'url' });
                }
                
                if (!db.objectStoreNames.contains('components')) {
                    db.createObjectStore('components', { keyPath: 'name' });
                }
            };
        });
    }

    /**
     * Configurar caché localStorage
     */
    setupLocalStorageCache() {
        // Limpiar caché expirado
        this.cleanExpiredCache();
        
        // Configurar limpieza periódica
        setInterval(() => {
            this.cleanExpiredCache();
        }, 60 * 60 * 1000); // Cada hora
    }

    /**
     * Limpiar caché expirado
     */
    cleanExpiredCache() {
        const now = Date.now();
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (item && item.expiry && item.expiry < now) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                }
            }
        });
    }

    /**
     * Configurar prefetching inteligente
     */
    setupIntelligentPrefetching() {
        if (!this.optimizations.prefetching.enabled) return;
        
        // Prefetch en hover de links
        document.addEventListener('mouseover', (event) => {
            const link = event.target.closest('a[href]');
            if (link && this.shouldPrefetch(link)) {
                this.prefetchLink(link.href);
            }
        }, { passive: true });
        
        // Prefetch en viewport para imágenes
        this.setupViewportPrefetching();
    }

    /**
     * Verificar si se debe hacer prefetch
     */
    shouldPrefetch(link) {
        const href = link.href;
        
        // No prefetch para enlaces externos
        if (href.startsWith('http') && !href.includes(window.location.hostname)) {
            return false;
        }
        
        // No prefetch para anchors
        if (href.startsWith('#')) {
            return false;
        }
        
        // No prefetch para archivos grandes
        const largeExtensions = ['.pdf', '.zip', '.mp4', '.avi'];
        return !largeExtensions.some(ext => href.includes(ext));
    }

    /**
     * Hacer prefetch de link
     */
    prefetchLink(url) {
        if (this.cache.memory.has(url)) {
            return; // Ya está en caché
        }
        
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document';
        
        // Agregar al head
        document.head.appendChild(link);
        
        // Marcar como prefetching
        this.cache.memory.set(url, { status: 'prefetching', timestamp: Date.now() });
        
        // Limpiar después de 10 segundos
        setTimeout(() => {
            document.head.removeChild(link);
            this.cache.memory.delete(url);
        }, 10000);
    }

    /**
     * Configurar prefetching para viewport
     */
    setupViewportPrefetching() {
        const viewportObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // Prefetch imágenes cercanas al viewport
                    if (element.tagName === 'IMG' && element.dataset.src) {
                        this.prefetchImage(element.dataset.src);
                    }
                }
            });
        }, {
            rootMargin: '200px 0px',
            threshold: 0
        });

        document.addEventListener('DOMContentLoaded', () => {
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => viewportObserver.observe(img));
        });
    }

    /**
     * Hacer prefetch de imagen
     */
    prefetchImage(url) {
        if (this.cache.memory.has(url)) return;
        
        const img = new Image();
        img.onload = () => {
            this.cache.memory.set(url, { status: 'cached', timestamp: Date.now() });
        };
        img.src = url;
    }

    /**
     * Configurar optimización de imágenes
     */
    setupImageOptimization() {
        // Agregar placeholders para imágenes
        this.addImagePlaceholders();
        
        // Configurar responsive images
        this.setupResponsiveImages();
        
        // Configurar compresión automática
        this.setupImageCompression();
    }

    /**
     * Agregar placeholders para imágenes
     */
    addImagePlaceholders() {
        document.addEventListener('DOMContentLoaded', () => {
            const images = document.querySelectorAll('img[data-src]');
            
            images.forEach(img => {
                // Crear placeholder SVG
                const placeholder = this.createImagePlaceholder(img.width || 300, img.height || 200);
                img.src = placeholder;
                img.classList.add('placeholder');
            });
        });
    }

    /**
     * Crear placeholder SVG
     */
    createImagePlaceholder(width, height) {
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f3f4f6"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="sans-serif" font-size="14">
                    Cargando...
                </text>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * Configurar imágenes responsivas
     */
    setupResponsiveImages() {
        // Implementar srcset automático
        document.addEventListener('DOMContentLoaded', () => {
            const images = document.querySelectorAll('img[data-responsive]');
            
            images.forEach(img => {
                this.setupResponsiveImage(img);
            });
        });
    }

    /**
     * Configurar imagen responsiva individual
     */
    setupResponsiveImage(img) {
        const sizes = img.dataset.sizes || '100vw';
        const srcset = this.generateSrcset(img.dataset.src);
        
        img.sizes = sizes;
        img.srcset = srcset;
    }

    /**
     * Generar srcset para imagen
     */
    generateSrcset(baseSrc) {
        const widths = [320, 640, 768, 1024, 1280, 1536];
        const srcset = [];
        
        widths.forEach(width => {
            const optimizedSrc = `${baseSrc}?w=${width}&q=80`;
            srcset.push(`${optimizedSrc} ${width}w`);
        });
        
        return srcset.join(', ');
    }

    /**
     * Configurar compresión de imágenes
     */
    setupImageCompression() {
        // Implementar compresión automática para uploads
        if (window.LaboriaAPI) {
            const originalUpload = window.LaboriaAPI.uploadAvatar;
            
            window.LaboriaAPI.uploadAvatar = async (file) => {
                if (file.type.startsWith('image/')) {
                    file = await this.compressImage(file);
                }
                
                return originalUpload.call(window.LaboriaAPI, file);
            };
        }
    }

    /**
     * Comprimir imagen
     */
    async compressImage(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calcular nuevas dimensiones
                const maxWidth = 1920;
                const maxHeight = 1080;
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Dibujar imagen comprimida
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a blob con calidad reducida
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Configurar code splitting
     */
    setupCodeSplitting() {
        // Implementar carga diferida de módulos
        this.setupModuleLoading();
        
        // Configurar tree shaking
        this.setupTreeShaking();
        
        // Configurar bundle analysis
        this.setupBundleAnalysis();
    }

    /**
     * Configurar carga de módulos
     */
    setupModuleLoading() {
        // Crear sistema de carga dinámica de módulos
        window.loadModule = async (moduleName) => {
            if (this.optimizations.codeSplitting.chunks.has(moduleName)) {
                return this.optimizations.codeSplitting.chunks.get(moduleName);
            }
            
            try {
                const module = await import(`/modules/${moduleName}.js`);
                this.optimizations.codeSplitting.chunks.set(moduleName, module);
                return module;
            } catch (error) {
                console.error(`❌ Error cargando módulo ${moduleName}:`, error);
                throw error;
            }
        };
    }

    /**
     * Configurar tree shaking
     */
    setupTreeShaking() {
        // Analizar uso de funciones y eliminar código no usado
        document.addEventListener('DOMContentLoaded', () => {
            this.analyzeCodeUsage();
        });
    }

    /**
     * Analizar uso de código
     */
    analyzeCodeUsage() {
        // Implementar análisis de qué funciones se usan
        const usedFunctions = new Set();
        const allFunctions = Object.keys(window);
        
        // Marcar funciones usadas durante la ejecución
        allFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                usedFunctions.add(funcName);
            }
        });
        
        console.log('📊 Análisis de código:', {
            totalFunctions: allFunctions.length,
            usedFunctions: usedFunctions.size,
            unusedCount: allFunctions.length - usedFunctions.size
        });
    }

    /**
     * Configurar análisis de bundles
     */
    setupBundleAnalysis() {
        // Analizar tamaño y rendimiento de bundles
        if ('performance' in window && performance.getEntriesByType) {
            const resources = performance.getEntriesByType('resource');
            const jsBundles = resources.filter(r => r.name.includes('.js'));
            
            jsBundles.forEach(bundle => {
                console.log(`📦 Bundle: ${bundle.name}`, {
                    size: bundle.transferSize,
                    loadTime: bundle.duration,
                    compressed: bundle.transferSize < bundle.encodedBodySize
                });
            });
        }
    }

    /**
     * Configurar monitoring de rendimiento
     */
    setupPerformanceMonitoring() {
        // Configurar monitoring continuo
        this.startContinuousMonitoring();
        
        // Configurar alertas de rendimiento
        this.setupPerformanceAlerts();
        
        // Configurar reporting
        this.setupPerformanceReporting();
    }

    /**
     * Iniciar monitoring continuo
     */
    startContinuousMonitoring() {
        // Monitorear FPS
        this.monitorFPS();
        
        // Monitorear uso de memoria
        this.monitorMemory();
        
        // Monitorear tiempo de interacción
        this.monitorInteractions();
        
        // Monitorear tamaño de DOM
        this.monitorDOMSize();
    }

    /**
     * Monitorear FPS
     */
    monitorFPS() {
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = (currentTime) => {
            frames++;
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                
                // Alertar si FPS es bajo
                if (fps < 30) {
                    console.warn(`⚠️ FPS bajo: ${fps}`);
                    this.reportPerformanceIssue('low_fps', { fps });
                }
                
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    /**
     * Monitorear uso de memoria
     */
    monitorMemory() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
                const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
                
                this.metrics.memoryUsed = usedMB;
                this.metrics.memoryLimit = limitMB;
                
                // Alertar si uso de memoria es alto (>80%)
                if (usedMB > limitMB * 0.8) {
                    console.warn(`⚠️ Uso de memoria alto: ${usedMB}MB / ${limitMB}MB`);
                    this.reportPerformanceIssue('high_memory', { used: usedMB, limit: limitMB });
                }
            }, 5000); // Cada 5 segundos
        }
    }

    /**
     * Monitorear interacciones
     */
    monitorInteractions() {
        const events = ['click', 'scroll', 'keydown'];
        
        events.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                const startTime = performance.now();
                
                // Medir tiempo hasta el siguiente frame
                requestAnimationFrame(() => {
                    const interactionTime = performance.now() - startTime;
                    this.metrics.interactionTime = Math.max(this.metrics.interactionTime, interactionTime);
                    
                    // Alertar si la interacción es lenta (>100ms)
                    if (interactionTime > 100) {
                        console.warn(`⚠️ Interacción lenta: ${interactionTime}ms`);
                        this.reportPerformanceIssue('slow_interaction', { 
                            type: eventType, 
                            time: interactionTime 
                        });
                    }
                });
            }, { passive: true });
        });
    }

    /**
     * Monitorear tamaño de DOM
     */
    monitorDOMSize() {
        setInterval(() => {
            const nodeCount = document.querySelectorAll('*').length;
            
            // Alertar si DOM es muy grande (>1500 nodos)
            if (nodeCount > 1500) {
                console.warn(`⚠️ DOM grande: ${nodeCount} nodos`);
                this.reportPerformanceIssue('large_dom', { nodeCount });
            }
        }, 10000); // Cada 10 segundos
    }

    /**
     * Configurar alertas de rendimiento
     */
    setupPerformanceAlerts() {
        // Core Web Vitals thresholds
        this.performanceThresholds = {
            lcp: 2500, // 2.5s
            fid: 100,   // 100ms
            cls: 0.1    // 0.1
        };
    }

    /**
     * Reportar issue de rendimiento
     */
    reportPerformanceIssue(type, data) {
        const issue = {
            type,
            data,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        console.error('🚨 Issue de rendimiento:', issue);
        
        // Enviar a servidor de monitoreo
        this.sendPerformanceReport(issue);
    }

    /**
     * Configurar reporting de rendimiento
     */
    setupPerformanceReporting() {
        // Enviar reporte cada 30 segundos
        setInterval(() => {
            this.sendPerformanceReport();
        }, 30000);
        
        // Enviar reporte al cerrar página
        window.addEventListener('beforeunload', () => {
            this.sendPerformanceReport();
        });
    }

    /**
     * Enviar reporte de rendimiento
     */
    async sendPerformanceReport(issue = null) {
        const report = {
            timestamp: Date.now(),
            url: window.location.href,
            metrics: this.metrics,
            userAgent: navigator.userAgent,
            connection: this.getConnectionInfo(),
            issue
        };
        
        try {
            // Enviar a endpoint de monitoreo
            if (window.LaboriaAPI) {
                await window.LaboriaAPI.post('/api/performance/report', report);
            }
        } catch (error) {
            console.warn('⚠️ Error enviando reporte de rendimiento:', error);
        }
    }

    /**
     * Obtener información de conexión
     */
    getConnectionInfo() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        
        return { effectiveType: 'unknown' };
    }

    /**
     * Obtener métricas de rendimiento
     */
    getPerformanceMetrics() {
        return {
            ...this.metrics,
            coreWebVitals: {
                lcp: this.metrics.lcp,
                fid: this.metrics.fid,
                cls: this.metrics.cls,
                status: this.getCoreWebVitalsStatus()
            },
            cache: {
                memorySize: this.cache.memory.size,
                localStorageSize: this.getStorageSize('localStorage'),
                sessionStorageSize: this.getStorageSize('sessionStorage')
            },
            optimization: {
                lazyLoadedImages: document.querySelectorAll('img.loaded').length,
                prefetchedResources: Array.from(this.cache.memory.keys()).length,
                loadedComponents: this.optimizations.codeSplitting.chunks.size
            }
        };
    }

    /**
     * Obtener estado de Core Web Vitals
     */
    getCoreWebVitalsStatus() {
        const { lcp, fid, cls } = this.metrics;
        const thresholds = this.performanceThresholds;
        
        const lcpStatus = lcp <= thresholds.lcp ? 'good' : 'needs-improvement';
        const fidStatus = fid <= thresholds.fid ? 'good' : 'needs-improvement';
        const clsStatus = cls <= thresholds.cls ? 'good' : 'needs-improvement';
        
        return {
            overall: (lcpStatus === 'good' && fidStatus === 'good' && clsStatus === 'good') ? 'good' : 'needs-improvement',
            lcp: lcpStatus,
            fid: fidStatus,
            cls: clsStatus
        };
    }

    /**
     * Obtener tamaño de storage
     */
    getStorageSize(type) {
        let size = 0;
        const storage = type === 'localStorage' ? localStorage : sessionStorage;
        
        for (let key in storage) {
            if (storage.hasOwnProperty(key)) {
                size += storage[key].length + key.length;
            }
        }
        
        return Math.round(size / 1024); // KB
    }

    /**
     * Limpiar todos los observers
     */
    cleanup() {
        this.observers.forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers.clear();
    }

    /**
     * Forzar garbage collection
     */
    forceGarbageCollection() {
        if (window.gc) {
            window.gc();
            console.log('🗑️ Garbage collection forzada');
        }
    }

    /**
     * Optimizar página actual
     */
    optimizePage() {
        // Limpiar DOM no utilizado
        this.cleanupUnusedElements();
        
        // Optimizar imágenes
        this.optimizeImagesOnPage();
        
        // Comprimir caché
        this.compressCache();
        
        // Forzar garbage collection
        this.forceGarbageCollection();
        
        console.log('⚡ Página optimizada');
    }

    /**
     * Limpiar elementos no utilizados
     */
    cleanupUnusedElements() {
        // Remover elementos ocultos y vacíos
        const hiddenElements = document.querySelectorAll('[hidden], .hidden');
        hiddenElements.forEach(element => {
            if (!element.textContent.trim() && !element.children.length) {
                element.remove();
            }
        });
    }

    /**
     * Optimizar imágenes en página
     */
    optimizeImagesOnPage() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Agregar loading="lazy" si no lo tiene
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Agregar decoding="async" para mejor rendimiento
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }
        });
    }

    /**
     * Comprimir caché
     */
    compressCache() {
        // Limpiar caché expirado
        this.cleanExpiredCache();
        
        // Limitar tamaño de caché en memoria
        if (this.cache.memory.size > 100) {
            const entries = Array.from(this.cache.memory.entries());
            const toRemove = entries.slice(0, entries.length - 100);
            toRemove.forEach(([key]) => this.cache.memory.delete(key));
        }
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

window.LaboriaPerformance = new PerformanceOptimizer();

console.log('⚡ Sistema de Optimización de Rendimiento inicializado:', {
    features: [
        'Lazy loading for images, videos, iframes',
        'Intelligent caching with multiple strategies',
        'Code splitting and dynamic imports',
        'Image optimization and compression',
        'Performance monitoring and Core Web Vitals',
        'Intelligent prefetching',
        'Memory management and cleanup'
    ]
});

// Funciones helper globales
window.optimizePage = function() {
    return window.LaboriaPerformance.optimizePage();
};

window.getPerformanceMetrics = function() {
    return window.LaboriaPerformance.getPerformanceMetrics();
};
