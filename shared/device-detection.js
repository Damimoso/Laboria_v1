/**
 * Sistema de Detección de Dispositivos y Optimización
 * Detecta el tipo de dispositivo, orientación y capacidades
 */

class DeviceDetectionSystem {
    constructor() {
        this.deviceInfo = this.detectDevice();
        this.breakpoints = this.initializeBreakpoints();
        this.capabilities = this.detectCapabilities();
        this.init();
    }

    /**
     * Inicializar el sistema de detección
     */
    init() {
        console.log('📱 Inicializando Sistema de Detección de Dispositivos...');
        
        // Agregar clases al body según dispositivo
        this.addDeviceClasses();
        
        // Configurar listeners de orientación
        this.setupOrientationListeners();
        
        // Configurar listeners de resize
        this.setupResizeListeners();
        
        // Optimizar según dispositivo
        this.optimizeForDevice();
        
        console.log('✅ Sistema de Detección inicializado:', this.deviceInfo);
    }

    /**
     * Detectar información del dispositivo
     */
    detectDevice() {
        const ua = navigator.userAgent;
        const platform = navigator.platform || navigator.userAgentData?.platform || 'unknown';
        
        return {
            // Tipo de dispositivo
            type: this.getDeviceType(ua, platform),
            
            // Sistema operativo
            os: this.getOperatingSystem(ua, platform),
            
            // Navegador
            browser: this.getBrowser(ua),
            
            // Orientación actual
            orientation: this.getCurrentOrientation(),
            
            // Tamaño de pantalla
            screenSize: this.getScreenSize(),
            
            // Densidad de píxeles
            pixelRatio: window.devicePixelRatio || 1,
            
            // Touch capabilities
            isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            
            // Mobile detection
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
            
            // Tablet detection
            isTablet: /iPad|Android(?!.*Mobile)|Tablet/i.test(ua),
            
            // Desktop detection
            isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
            
            // Preferencia de modo reducido
            prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            
            // Preferencia de color
            prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
            
            // Preferencia de contraste
            prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
            
            // Conexión
            connection: this.getConnectionInfo(),
            
            // Memory
            memory: this.getMemoryInfo(),
            
            // CPU cores
            cores: navigator.hardwareConcurrency || 4
        };
    }

    /**
     * Obtener tipo de dispositivo
     */
    getDeviceType(ua, platform) {
        // Mobile phones
        if (/iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
            return 'mobile';
        }
        
        // Tablets
        if (/iPad|Android(?!.*Mobile)|Tablet|Kindle|Silk/i.test(ua)) {
            return 'tablet';
        }
        
        // Desktop
        if (/Windows|Mac|Linux|X11/i.test(platform)) {
            return 'desktop';
        }
        
        return 'unknown';
    }

    /**
     * Obtener sistema operativo
     */
    getOperatingSystem(ua, platform) {
        if (/Windows/i.test(platform)) return 'Windows';
        if (/Mac/i.test(platform)) return 'macOS';
        if (/Linux/i.test(platform)) return 'Linux';
        if (/Android/i.test(ua)) return 'Android';
        if (/iOS|iPhone|iPad|iPod/i.test(ua)) return 'iOS';
        if (/CrOS/i.test(ua)) return 'ChromeOS';
        
        return 'unknown';
    }

    /**
     * Obtener navegador
     */
    getBrowser(ua) {
        if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) return 'Chrome';
        if (/Firefox/i.test(ua)) return 'Firefox';
        if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
        if (/Edge|Edg/i.test(ua)) return 'Edge';
        if (/Opera|OPR/i.test(ua)) return 'Opera';
        if (/MSIE|Trident/i.test(ua)) return 'Internet Explorer';
        
        return 'unknown';
    }

    /**
     * Obtener orientación actual
     */
    getCurrentOrientation() {
        if (screen.orientation) {
            return screen.orientation.angle === 90 || screen.orientation.angle === 270 ? 'landscape' : 'portrait';
        }
        
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    /**
     * Obtener tamaño de pantalla
     */
    getScreenSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth
        };
    }

    /**
     * Detectar capacidades del dispositivo
     */
    detectCapabilities() {
        return {
            // Touch capabilities
            touchPoints: navigator.maxTouchPoints || 0,
            touchSupport: 'ontouchstart' in window,
            
            // Pointer capabilities
            pointerSupport: 'PointerEvent' in window,
            coarsePointer: window.matchMedia('(pointer: coarse)').matches,
            finePointer: window.matchMedia('(pointer: fine)').matches,
            
            // Input capabilities
            mouseSupport: 'onmousedown' in window,
            keyboardSupport: 'onkeydown' in window,
            
            // Media capabilities
            camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            geolocation: 'geolocation' in navigator,
            
            // Storage capabilities
            localStorage: this.testLocalStorage(),
            sessionStorage: this.testSessionStorage(),
            indexedDB: 'indexedDB' in window,
            
            // Network capabilities
            online: navigator.onLine,
            serviceWorker: 'serviceWorker' in navigator,
            webWorker: 'Worker' in window,
            
            // Performance capabilities
            webGL: this.testWebGL(),
            webGL2: this.testWebGL2(),
            webAssembly: 'WebAssembly' in window,
            
            // Security capabilities
            https: location.protocol === 'https:',
            secureContext: window.isSecureContext,
            
            // Display capabilities
            hdr: window.matchMedia('(dynamic-range: high)').matches,
            wideGamut: window.testMedia('(color-gamut: p3)'),
            highRefresh: window.matchMedia('(update-frequency: high)').matches
        };
    }

    /**
     * Inicializar breakpoints
     */
    initializeBreakpoints() {
        return {
            xs: 320,   // Small mobile
            sm: 480,   // Mobile
            md: 768,   // Tablet
            lg: 1024,  // Desktop
            xl: 1280,  // Large desktop
            xxl: 1440  // Extra large desktop
        };
    }

    /**
     * Agregar clases de dispositivo al body
     */
    addDeviceClasses() {
        const body = document.body;
        const classes = [];
        
        // Tipo de dispositivo
        classes.push(`device-${this.deviceInfo.type}`);
        classes.push(`os-${this.deviceInfo.os.toLowerCase()}`);
        classes.push(`browser-${this.deviceInfo.browser.toLowerCase()}`);
        
        // Orientación
        classes.push(`orientation-${this.deviceInfo.orientation}`);
        
        // Touch capabilities
        classes.push(this.deviceInfo.isTouch ? 'touch-enabled' : 'touch-disabled');
        classes.push(this.deviceInfo.capabilities.coarsePointer ? 'coarse-pointer' : 'fine-pointer');
        
        // Modo reducido
        if (this.deviceInfo.prefersReducedMotion) {
            classes.push('reduced-motion');
        }
        
        // Modo oscuro
        if (this.deviceInfo.prefersDarkMode) {
            classes.push('dark-mode');
        }
        
        // Alto contraste
        if (this.deviceInfo.prefersHighContrast) {
            classes.push('high-contrast');
        }
        
        // Densidad de píxeles
        if (this.deviceInfo.pixelRatio > 1) {
            classes.push('high-dpi');
            classes.push(`ratio-${Math.round(this.deviceInfo.pixelRatio * 100)}`);
        }
        
        // Conexión
        if (this.deviceInfo.connection) {
            classes.push(`connection-${this.deviceInfo.connection.effectiveType || 'unknown'}`);
        }
        
        // Agregar clases
        body.className = body.className.split(' ').filter(c => c).concat(classes).join(' ');
        
        // Agregar meta tags para mobile
        this.addMobileMetaTags();
    }

    /**
     * Agregar meta tags para mobile
     */
    addMobileMetaTags() {
        if (this.deviceInfo.isMobile) {
            // Viewport meta tag
            let viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport) {
                viewport = document.createElement('meta');
                viewport.name = 'viewport';
                document.head.appendChild(viewport);
            }
            
            viewport.content = this.getViewportContent();
            
            // Theme color meta tag
            let themeColor = document.querySelector('meta[name="theme-color"]');
            if (!themeColor) {
                themeColor = document.createElement('meta');
                themeColor.name = 'theme-color';
                document.head.appendChild(themeColor);
            }
            
            themeColor.content = this.deviceInfo.prefersDarkMode ? '#1a1a1a' : '#ffffff';
            
            // Mobile web app capable
            let webAppCapable = document.querySelector('meta[name="mobile-web-app-capable"]');
            if (!webAppCapable) {
                webAppCapable = document.createElement('meta');
                webAppCapable.name = 'mobile-web-app-capable';
                document.head.appendChild(webAppCapable);
            }
            
            webAppCapable.content = 'yes';
            
            // Apple touch icon
            if (this.deviceInfo.os === 'iOS') {
                this.addAppleMetaTags();
            }
        }
    }

    /**
     * Obtener contenido del viewport
     */
    getViewportContent() {
        let content = 'width=device-width, initial-scale=1.0';
        
        if (this.deviceInfo.isMobile) {
            content += ', maximum-scale=1.0, user-scalable=no';
        }
        
        if (this.deviceInfo.pixelRatio > 1) {
            content += ', target-densitydpi=device-dpi';
        }
        
        return content;
    }

    /**
     * Agregar meta tags de Apple
     */
    addAppleMetaTags() {
        const appleTags = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
            { name: 'apple-mobile-web-app-title', content: 'Laboria' },
            { name: 'format-detection', content: 'telephone=no' }
        ];
        
        appleTags.forEach(tag => {
            let meta = document.querySelector(`meta[name="${tag.name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = tag.name;
                document.head.appendChild(meta);
            }
            meta.content = tag.content;
        });
    }

    /**
     * Configurar listeners de orientación
     */
    setupOrientationListeners() {
        // Listener de cambio de orientación
        const handleOrientationChange = () => {
            const newOrientation = this.getCurrentOrientation();
            
            if (newOrientation !== this.deviceInfo.orientation) {
                this.deviceInfo.orientation = newOrientation;
                
                // Actualizar clases
                document.body.classList.remove('orientation-portrait', 'orientation-landscape');
                document.body.classList.add(`orientation-${newOrientation}`);
                
                // Disparar evento personalizado
                this.dispatchDeviceEvent('orientationchange', {
                    orientation: newOrientation,
                    screenSize: this.getScreenSize()
                });
                
                console.log(`📱 Orientación cambiada a: ${newOrientation}`);
            }
        };
        
        // Múltiples métodos para compatibilidad
        if (screen.orientation) {
            screen.orientation.addEventListener('change', handleOrientationChange);
        } else {
            window.addEventListener('orientationchange', handleOrientationChange);
        }
        
        window.addEventListener('resize', this.debounce(handleOrientationChange, 100));
    }

    /**
     * Configurar listeners de resize
     */
    setupResizeListeners() {
        const handleResize = () => {
            const newScreenSize = this.getScreenSize();
            const currentBreakpoint = this.getCurrentBreakpoint();
            
            this.deviceInfo.screenSize = newScreenSize;
            
            // Actualizar clases de breakpoint
            this.updateBreakpointClasses(currentBreakpoint);
            
            // Disparar evento personalizado
            this.dispatchDeviceEvent('resize', {
                screenSize: newScreenSize,
                breakpoint: currentBreakpoint
            });
        };
        
        window.addEventListener('resize', this.debounce(handleResize, 250));
    }

    /**
     * Obtener breakpoint actual
     */
    getCurrentBreakpoint() {
        const width = this.deviceInfo.screenSize.width;
        
        for (const [name, value] of Object.entries(this.breakpoints).reverse()) {
            if (width >= value) {
                return name;
            }
        }
        
        return 'xs';
    }

    /**
     * Actualizar clases de breakpoint
     */
    updateBreakpointClasses(breakpoint) {
        // Remover clases anteriores
        Object.keys(this.breakpoints).forEach(bp => {
            document.body.classList.remove(`breakpoint-${bp}`);
        });
        
        // Agregar clase actual
        document.body.classList.add(`breakpoint-${breakpoint}`);
    }

    /**
     * Optimizar según dispositivo
     */
    optimizeForDevice() {
        // Optimizaciones para móviles
        if (this.deviceInfo.isMobile) {
            this.optimizeForMobile();
        }
        
        // Optimizaciones para tablets
        if (this.deviceInfo.isTablet) {
            this.optimizeForTablet();
        }
        
        // Optimizaciones para desktop
        if (this.deviceInfo.isDesktop) {
            this.optimizeForDesktop();
        }
        
        // Optimizaciones para touch
        if (this.deviceInfo.isTouch) {
            this.optimizeForTouch();
        }
        
        // Optimizaciones para modo reducido
        if (this.deviceInfo.prefersReducedMotion) {
            this.optimizeForReducedMotion();
        }
    }

    /**
     * Optimizaciones para móviles
     */
    optimizeForMobile() {
        // Prevenir zoom en inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.style.fontSize = '16px';
        });
        
        // Optimizar scroll
        document.body.style.touchAction = 'manipulation';
        
        // Deshabilitar hover effects
        this.disableHoverEffects();
        
        // Optimizar imágenes
        this.optimizeImages();
    }

    /**
     * Optimizaciones para tablets
     */
    optimizeForTablet() {
        // Optimizar para tablets
        document.body.classList.add('tablet-optimized');
        
        // Ajustar tamaños de fuente
        this.adjustFontSizes();
    }

    /**
     * Optimizaciones para desktop
     */
    optimizeForDesktop() {
        // Habilitar hover effects
        this.enableHoverEffects();
        
        // Optimizar para desktop
        document.body.classList.add('desktop-optimized');
        
        // Ajustar anchos máximos
        this.adjustMaxWidths();
    }

    /**
     * Optimizaciones para touch
     */
    optimizeForTouch() {
        // Aumentar tamaños de touch targets
        const touchTargets = document.querySelectorAll('button, a, input, select, textarea');
        touchTargets.forEach(element => {
            const computed = window.getComputedStyle(element);
            const minSize = 44; // Mínimo recomendado
            
            if (parseInt(computed.height) < minSize || parseInt(computed.width) < minSize) {
                element.style.minHeight = `${minSize}px`;
                element.style.minWidth = `${minSize}px`;
            }
        });
    }

    /**
     * Optimizaciones para modo reducido
     */
    optimizeForReducedMotion() {
        // Deshabilitar animaciones
        const style = document.createElement('style');
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Deshabilitar hover effects
     */
    disableHoverEffects() {
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: hover) {
                .btn:hover, .nav-link:hover, .card:hover {
                    transform: none !important;
                    transition: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Habilitar hover effects
     */
    enableHoverEffects() {
        // Los hover effects se habilitan por defecto en desktop
    }

    /**
     * Optimizar imágenes
     */
    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Lazy loading nativo
            img.loading = 'lazy';
            
            // Optimizar para high DPI
            if (this.deviceInfo.pixelRatio > 1) {
                img.style.imageRendering = 'crisp-edges';
            }
        });
    }

    /**
     * Ajustar tamaños de fuente
     */
    adjustFontSizes() {
        const root = document.documentElement;
        const baseSize = this.deviceInfo.isTablet ? '15px' : '16px';
        root.style.fontSize = baseSize;
    }

    /**
     * Ajustar anchos máximos
     */
    adjustMaxWidths() {
        const containers = document.querySelectorAll('.centered-container, .login-card, .profile-container');
        containers.forEach(container => {
            if (!container.style.maxWidth) {
                container.style.maxWidth = '1200px';
            }
        });
    }

    /**
     * Obtener información de conexión
     */
    getConnectionInfo() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                downlinkMax: navigator.connection.downlinkMax,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        return null;
    }

    /**
     * Obtener información de memoria
     */
    getMemoryInfo() {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    /**
     * Test localStorage
     */
    testLocalStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Test sessionStorage
     */
    testSessionStorage() {
        try {
            sessionStorage.setItem('test', 'test');
            sessionStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Test WebGL
     */
    testWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    /**
     * Test WebGL2
     */
    testWebGL2() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl2'));
        } catch (e) {
            return false;
        }
    }

    /**
     * Test media query
     */
    testMedia(query) {
        return window.matchMedia(query).matches;
    }

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Disparar evento personalizado
     */
    dispatchDeviceEvent(type, detail) {
        const event = new CustomEvent(`device:${type}`, {
            detail: detail,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Obtener información completa del dispositivo
     */
    getDeviceInfo() {
        return {
            ...this.deviceInfo,
            capabilities: this.capabilities,
            breakpoints: this.breakpoints,
            currentBreakpoint: this.getCurrentBreakpoint()
        };
    }

    /**
     * Verificar si es un dispositivo específico
     */
    isDevice(type) {
        return this.deviceInfo.type === type;
    }

    /**
     * Verificar si está en un breakpoint específico
     */
    isBreakpoint(breakpoint) {
        return this.getCurrentBreakpoint() === breakpoint;
    }

    /**
     * Verificar si es móvil o tablet
     */
    isMobileOrTablet() {
        return this.deviceInfo.isMobile || this.deviceInfo.isTablet;
    }

    /**
     * Obtener recomendaciones de optimización
     */
    getOptimizationRecommendations() {
        const recommendations = [];
        
        // Recomendaciones de rendimiento
        if (this.deviceInfo.memory && this.deviceInfo.memory.usedJSHeapSize > this.deviceInfo.memory.jsHeapSizeLimit * 0.8) {
            recommendations.push({
                type: 'performance',
                message: 'Alto uso de memoria detectado',
                action: 'Considera optimizar el uso de memoria'
            });
        }
        
        // Recomendaciones de conexión
        if (this.deviceInfo.connection && this.deviceInfo.connection.effectiveType === 'slow-2g') {
            recommendations.push({
                type: 'network',
                message: 'Conexión lenta detectada',
                action: 'Optimizando para conexión lenta'
            });
        }
        
        // Recomendaciones de navegador
        if (this.deviceInfo.browser === 'Internet Explorer') {
            recommendations.push({
                type: 'browser',
                message: 'Navegador no soportado',
                action: 'Por favor usa un navegador moderno'
            });
        }
        
        return recommendations;
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

window.LaboriaDeviceDetection = new DeviceDetectionSystem();

console.log('📱 Sistema de Detección de Dispositivos inicializado:', {
    device: window.LaboriaDeviceDetection.deviceInfo,
    capabilities: window.LaboriaDeviceDetection.capabilities,
    breakpoint: window.LaboriaDeviceDetection.getCurrentBreakpoint()
});

// Event listeners globales para otros componentes
window.addEventListener('device:orientationchange', (event) => {
    console.log('📱 Cambio de orientación:', event.detail);
});

window.addEventListener('device:resize', (event) => {
    console.log('📱 Cambio de tamaño:', event.detail);
});
