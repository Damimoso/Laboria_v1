/**
 * Sistema de Analíticas Avanzado
 * Proporciona tracking, métricas en tiempo real y análisis de comportamiento
 */

class AnalyticsSystem {
    constructor() {
        this.config = this.initializeConfig();
        this.metrics = this.initializeMetrics();
        this.events = [];
        this.session = this.initializeSession();
        this.userProfile = null;
        this.trackingEnabled = true;
        this.init();
    }

    /**
     * Inicializar el sistema de analíticas
     */
    init() {
        console.log('📊 Inicializando Sistema de Analíticas Avanzado...');
        
        // Verificar consentimiento del usuario
        this.checkConsent();
        
        // Configurar tracking automático
        this.setupAutomaticTracking();
        
        // Configurar tracking de eventos personalizados
        this.setupCustomEventTracking();
        
        // Configurar tracking de rendimiento
        this.setupPerformanceTracking();
        
        // Configurar tracking de usuario
        this.setupUserTracking();
        
        // Configurar envío de datos
        this.setupDataTransmission();
        
        console.log('✅ Sistema de Analíticas inicializado');
    }

    /**
     * Inicializar configuración
     */
    initializeConfig() {
        return {
            // Endpoint de analíticas
            endpoint: '/api/analytics/events',
            
            // Configuración de tracking
            tracking: {
                pageViews: true,
                clicks: true,
                scrolls: true,
                formSubmissions: true,
                errors: true,
                performance: true,
                userBehavior: true
            },
            
            // Configuración de sesión
            session: {
                timeout: 30 * 60 * 1000, // 30 minutos
                maxEvents: 1000,
                batchSize: 50
            },
            
            // Configuración de privacidad
            privacy: {
                anonymizeIP: true,
                respectDoNotTrack: true,
                excludeSensitiveData: true,
                cookieConsent: true
            },
            
            // Configuración de muestreo
            sampling: {
                enabled: false,
                rate: 1.0 // 100% de los usuarios
            }
        };
    }

    /**
     * Inicializar métricas
     */
    initializeMetrics() {
        return {
            // Métricas de página
            pageViews: 0,
            uniquePageViews: new Set(),
            timeOnPage: 0,
            bounceRate: 0,
            
            // Métricas de usuario
            sessions: 0,
            newUsers: 0,
            returningUsers: 0,
            userEngagement: 0,
            
            // Métricas de comportamiento
            clicks: 0,
            scrolls: 0,
            formInteractions: 0,
            searchQueries: 0,
            
            // Métricas de contenido
            popularPages: new Map(),
            exitPages: new Set(),
            conversionEvents: 0,
            
            // Métricas técnicas
            errors: 0,
            performanceScore: 0,
            loadTime: 0,
            deviceBreakdown: new Map(),
            browserBreakdown: new Map(),
            
            // Métricas de negocio
            applications: 0,
            registrations: 0,
            jobPostViews: 0,
            successfulPlacements: 0
        };
    }

    /**
     * Inicializar sesión
     */
    initializeSession() {
        return {
            id: this.generateSessionId(),
            startTime: Date.now(),
            lastActivity: Date.now(),
            pageViews: 0,
            events: [],
            referrer: document.referrer || 'direct',
            utm: this.getUTMParameters(),
            device: this.getDeviceInfo(),
            location: this.getUserLocation()
        };
    }

    /**
     * Verificar consentimiento del usuario
     */
    checkConsent() {
        // Verificar si ya hay consentimiento
        const consent = localStorage.getItem('analytics_consent');
        
        if (consent === 'accepted') {
            this.trackingEnabled = true;
            return;
        }
        
        if (consent === 'rejected') {
            this.trackingEnabled = false;
            return;
        }
        
        // Verificar preferencia Do Not Track
        if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') {
            this.trackingEnabled = false;
            localStorage.setItem('analytics_consent', 'rejected');
            return;
        }
        
        // Mostrar banner de consentimiento
        this.showConsentBanner();
    }

    /**
     * Mostrar banner de consentimiento
     */
    showConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'analytics-consent-banner';
        banner.innerHTML = `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: rgba(0, 0, 0, 0.9); 
                        color: white; padding: 1rem; z-index: 10000; display: flex; 
                        align-items: center; justify-content: space-between; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 300px; margin-right: 1rem;">
                    <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                        📊 Usamos cookies para analizar el tráfico y mejorar tu experiencia. 
                        Puedes aceptar o rechazar el uso de analíticas.
                    </p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="acceptAnalytics()" style="background: #3b82f6; color: white; border: none; 
                           padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer; font-weight: 500;">
                        Aceptar
                    </button>
                    <button onclick="rejectAnalytics()" style="background: transparent; color: white; border: 1px solid white; 
                           padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;">
                        Rechazar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Funciones globales para el banner
        window.acceptAnalytics = () => {
            localStorage.setItem('analytics_consent', 'accepted');
            this.trackingEnabled = true;
            banner.remove();
            this.startTracking();
        };
        
        window.rejectAnalytics = () => {
            localStorage.setItem('analytics_consent', 'rejected');
            this.trackingEnabled = false;
            banner.remove();
        };
    }

    /**
     * Configurar tracking automático
     */
    setupAutomaticTracking() {
        if (!this.trackingEnabled) return;
        
        // Tracking de page views
        this.trackPageView();
        
        // Tracking de scroll
        this.setupScrollTracking();
        
        // Tracking de clicks
        this.setupClickTracking();
        
        // Tracking de tiempo en página
        this.setupTimeOnPageTracking();
        
        // Tracking de salida
        this.setupExitTracking();
    }

    /**
     * Configurar tracking de eventos personalizados
     */
    setupCustomEventTracking() {
        if (!this.trackingEnabled) return;
        
        // Sobreescribir console.log para capturar eventos personalizados
        const originalLog = console.log;
        console.log = (...args) => {
            originalLog.apply(console, args);
            
            // Detectar eventos de analíticas
            const message = args.join(' ');
            if (message.includes('ANALYTICS:')) {
                const eventData = this.parseAnalyticsMessage(message);
                if (eventData) {
                    this.trackCustomEvent(eventData.type, eventData.data);
                }
            }
        };
    }

    /**
     * Configurar tracking de rendimiento
     */
    setupPerformanceTracking() {
        if (!this.trackingEnabled) return;
        
        // Observer para métricas de rendimiento
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.trackPerformance(entry);
                });
            });
            
            observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
        }
    }

    /**
     * Configurar tracking de usuario
     */
    setupUserTracking() {
        if (!this.trackingEnabled) return;
        
        // Identificar usuario
        this.identifyUser();
        
        // Tracking de comportamiento
        this.setupBehaviorTracking();
        
        // Tracking de conversiones
        this.setupConversionTracking();
    }

    /**
     * Configurar envío de datos
     */
    setupDataTransmission() {
        if (!this.trackingEnabled) return;
        
        // Enviar datos periódicamente
        setInterval(() => {
            this.sendBatchEvents();
        }, this.config.session.batchSize * 1000);
        
        // Enviar al cerrar página
        window.addEventListener('beforeunload', () => {
            this.sendBatchEvents(true);
        });
        
        // Enviar cuando la página se oculta
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.sendBatchEvents();
            }
        });
    }

    /**
     * Iniciar tracking
     */
    startTracking() {
        this.setupAutomaticTracking();
        this.setupCustomEventTracking();
        this.setupPerformanceTracking();
        this.setupUserTracking();
        this.setupDataTransmission();
    }

    /**
     * Trackear page view
     */
    trackPageView() {
        if (!this.trackingEnabled) return;
        
        const pageView = {
            type: 'page_view',
            timestamp: Date.now(),
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            sessionId: this.session.id
        };
        
        this.events.push(pageView);
        this.metrics.pageViews++;
        this.metrics.uniquePageViews.add(window.location.href);
        this.session.pageViews++;
        
        console.log('📊 Page view tracked:', pageView);
    }

    /**
     * Configurar tracking de scroll
     */
    setupScrollTracking() {
        let scrollThreshold = 0;
        let maxScroll = 0;
        
        const handleScroll = () => {
            const scrollTop = window.pageYOffset;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercentage = Math.round((scrollTop / documentHeight) * 100);
            
            // Trackear milestones de scroll (25%, 50%, 75%, 90%)
            if (scrollPercentage >= 25 && scrollThreshold < 25) {
                this.trackEvent('scroll_milestone', { percentage: 25 });
                scrollThreshold = 25;
            }
            
            if (scrollPercentage >= 50 && scrollThreshold < 50) {
                this.trackEvent('scroll_milestone', { percentage: 50 });
                scrollThreshold = 50;
            }
            
            if (scrollPercentage >= 75 && scrollThreshold < 75) {
                this.trackEvent('scroll_milestone', { percentage: 75 });
                scrollThreshold = 75;
            }
            
            if (scrollPercentage >= 90 && scrollThreshold < 90) {
                this.trackEvent('scroll_milestone', { percentage: 90 });
                scrollThreshold = 90;
            }
            
            maxScroll = Math.max(maxScroll, scrollPercentage);
        };
        
        window.addEventListener('scroll', this.debounce(handleScroll, 100));
    }

    /**
     * Configurar tracking de clicks
     */
    setupClickTracking() {
        document.addEventListener('click', (event) => {
            if (!this.trackingEnabled) return;
            
            const target = event.target;
            const clickData = {
                type: 'click',
                timestamp: Date.now(),
                elementType: target.tagName.toLowerCase(),
                elementClass: target.className,
                elementId: target.id,
                elementText: target.textContent?.substring(0, 100) || '',
                elementUrl: target.href || '',
                coordinates: {
                    x: event.clientX,
                    y: event.clientY
                },
                pageUrl: window.location.href,
                sessionId: this.session.id
            };
            
            this.events.push(clickData);
            this.metrics.clicks++;
            
            console.log('📊 Click tracked:', clickData);
        });
    }

    /**
     * Configurar tracking de tiempo en página
     */
    setupTimeOnPageTracking() {
        const startTime = Date.now();
        
        const updateTimeOnPage = () => {
            this.metrics.timeOnPage = Date.now() - startTime;
            this.session.lastActivity = Date.now();
        };
        
        // Actualizar cada segundo
        setInterval(updateTimeOnPage, 1000);
        
        // Actualizar al interactuar
        ['click', 'scroll', 'keydown'].forEach(eventType => {
            document.addEventListener(eventType, updateTimeOnPage);
        });
    }

    /**
     * Configurar tracking de salida
     */
    setupExitTracking() {
        let exitTracked = false;
        
        const trackExit = () => {
            if (exitTracked) return;
            
            exitTracked = true;
            this.trackEvent('page_exit', {
                timeOnPage: this.metrics.timeOnPage,
                scrollDepth: this.getMaxScrollDepth(),
                sessionId: this.session.id
            });
            
            this.metrics.exitPages.add(window.location.href);
        };
        
        window.addEventListener('beforeunload', trackExit);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                trackExit();
            }
        });
    }

    /**
     * Trackear evento personalizado
     */
    trackCustomEvent(type, data = {}) {
        if (!this.trackingEnabled) return;
        
        const event = {
            type: 'custom_event',
            customType: type,
            timestamp: Date.now(),
            data: this.sanitizeData(data),
            pageUrl: window.location.href,
            sessionId: this.session.id
        };
        
        this.events.push(event);
        
        console.log('📊 Custom event tracked:', event);
    }

    /**
     * Trackear rendimiento
     */
    trackPerformance(entry) {
        if (!this.trackingEnabled) return;
        
        const performanceEvent = {
            type: 'performance',
            metric: entry.entryType,
            timestamp: Date.now(),
            data: {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
                size: entry.transferSize || 0
            },
            sessionId: this.session.id
        };
        
        this.events.push(performanceEvent);
        
        // Actualizar métricas de rendimiento
        if (entry.entryType === 'navigation') {
            this.metrics.loadTime = entry.loadEventEnd - entry.fetchStart;
        }
        
        console.log('📊 Performance tracked:', performanceEvent);
    }

    /**
     * Identificar usuario
     */
    identifyUser() {
        // Obtener información del usuario del API client
        if (window.LaboriaAPI?.usuarioActual) {
            this.userProfile = {
                id: window.LaboriaAPI.usuarioActual.id,
                email: window.LaboriaAPI.usuarioActual.email,
                role: window.LaboriaAPI.usuarioActual.rol,
                registrationDate: window.LaboriaAPI.usuarioActual.fechaRegistro,
                lastLogin: new Date().toISOString()
            };
            
            this.trackEvent('user_identified', {
                userId: this.userProfile.id,
                role: this.userProfile.role
            });
        }
    }

    /**
     * Configurar tracking de comportamiento
     */
    setupBehaviorTracking() {
        // Tracking de movimiento del mouse
        this.setupMouseTracking();
        
        // Tracking de uso de teclado
        this.setupKeyboardTracking();
        
        // Tracking de interacción con formularios
        this.setupFormTracking();
        
        // Tracking de búsqueda
        this.setupSearchTracking();
    }

    /**
     * Configurar tracking de mouse
     */
    setupMouseTracking() {
        let mouseMovements = 0;
        let lastMoveTime = Date.now();
        
        document.addEventListener('mousemove', this.debounce(() => {
            mouseMovements++;
            lastMoveTime = Date.now();
        }, 100));
        
        // Trackear inactividad
        setInterval(() => {
            const timeSinceLastMove = Date.now() - lastMoveTime;
            if (timeSinceLastMove > 30000) { // 30 segundos
                this.trackEvent('user_inactive', {
                    duration: timeSinceLastMove,
                    mouseMovements
                });
            }
        }, 10000);
    }

    /**
     * Configurar tracking de teclado
     */
    setupKeyboardTracking() {
        let keyPresses = 0;
        
        document.addEventListener('keydown', () => {
            keyPresses++;
        });
        
        // Trackear patrones de teclado
        setInterval(() => {
            if (keyPresses > 0) {
                this.trackEvent('keyboard_activity', {
                    keyPresses
                });
                keyPresses = 0;
            }
        }, 30000);
    }

    /**
     * Configurar tracking de formularios
     */
    setupFormTracking() {
        document.addEventListener('submit', (event) => {
            const form = event.target;
            
            this.trackEvent('form_submission', {
                formId: form.id,
                formClass: form.className,
                formAction: form.action,
                formData: this.getFormData(form)
            });
            
            this.metrics.formInteractions++;
        });
        
        // Tracking de interacción con campos
        document.addEventListener('focus', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                this.trackEvent('form_field_focus', {
                    fieldType: event.target.type,
                    fieldName: event.target.name
                });
            }
        }, true);
    }

    /**
     * Configurar tracking de búsqueda
     */
    setupSearchTracking() {
        const searchInputs = document.querySelectorAll('input[type="search"], input[name*="search"]');
        
        searchInputs.forEach(input => {
            input.addEventListener('input', this.debounce((event) => {
                const query = event.target.value.trim();
                
                if (query.length > 2) {
                    this.trackEvent('search_query', {
                        query: this.sanitizeData(query),
                        searchLocation: window.location.href
                    });
                    
                    this.metrics.searchQueries++;
                }
            }, 500));
        });
    }

    /**
     * Configurar tracking de conversiones
     */
    setupConversionTracking() {
        // Tracking de registro
        this.trackConversion('user_registration', () => {
            return window.LaboriaAPI?.usuarioActual;
        });
        
        // Tracking de aplicación a ofertas
        this.trackConversion('job_application', () => {
            // Detectar cuando un usuario aplica a una oferta
            const applyButtons = document.querySelectorAll('[data-apply-job]');
            return Array.from(applyButtons).map(btn => btn.dataset.applyJob);
        });
        
        // Tracking de login
        this.trackConversion('user_login', () => {
            return this.session.id;
        });
    }

    /**
     * Trackear conversión
     */
    trackConversion(type, getValue) {
        if (!this.trackingEnabled) return;
        
        const checkConversion = () => {
            const value = getValue();
            if (value) {
                this.trackEvent('conversion', {
                    type: type,
                    value: this.sanitizeData(value),
                    timestamp: Date.now()
                });
                
                this.metrics.conversionEvents++;
                return true;
            }
            return false;
        };
        
        // Verificar inmediatamente y luego periódicamente
        if (!checkConversion()) {
            const interval = setInterval(() => {
                if (checkConversion()) {
                    clearInterval(interval);
                }
            }, 1000);
            
            // Limpiar después de 30 segundos
            setTimeout(() => clearInterval(interval), 30000);
        }
    }

    /**
     * Enviar eventos batch
     */
    async sendBatchEvents(isUrgent = false) {
        if (this.events.length === 0) return;
        
        const batchSize = isUrgent ? this.events.length : this.config.session.batchSize;
        const batch = this.events.splice(0, batchSize);
        
        try {
            await this.sendToServer(batch);
            console.log(`📊 Enviados ${batch.length} eventos al servidor`);
        } catch (error) {
            console.error('❌ Error enviando eventos:', error);
            // Reintegrar eventos si falla el envío
            this.events.unshift(...batch);
        }
    }

    /**
     * Enviar datos al servidor
     */
    async sendToServer(events) {
        const payload = {
            events: events,
            session: this.session,
            userProfile: this.userProfile,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        };
        
        const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }

    /**
     * Obtener métricas actuales
     */
    getMetrics() {
        return {
            ...this.metrics,
            session: this.session,
            events: this.events.length,
            userProfile: this.userProfile,
            realTime: {
                timeOnPage: this.metrics.timeOnPage,
                activeUsers: this.getActiveUsers(),
                currentUrl: window.location.href,
                deviceType: this.getDeviceType()
            }
        };
    }

    /**
     * Generar reporte de analíticas
     */
    generateReport(period = '24h') {
        const now = Date.now();
        const periodMs = this.getPeriodMs(period);
        const filteredEvents = this.events.filter(event => 
            now - event.timestamp <= periodMs
        );
        
        return {
            period,
            generatedAt: new Date(),
            totalEvents: filteredEvents.length,
            metrics: this.calculateMetrics(filteredEvents),
            insights: this.generateInsights(filteredEvents),
            recommendations: this.generateRecommendations(filteredEvents)
        };
    }

    /**
     * Calcular métricas
     */
    calculateMetrics(events) {
        const pageViews = events.filter(e => e.type === 'page_view').length;
        const uniquePages = new Set(events.filter(e => e.type === 'page_view').map(e => e.url));
        const clicks = events.filter(e => e.type === 'click').length;
        const forms = events.filter(e => e.type === 'form_submission').length;
        const conversions = events.filter(e => e.type === 'conversion').length;
        
        return {
            pageViews,
            uniquePageViews: uniquePages.size,
            clicks,
            formSubmissions: forms,
            conversions,
            conversionRate: pageViews > 0 ? (conversions / pageViews * 100).toFixed(2) : 0,
            engagementScore: this.calculateEngagementScore(events)
        };
    }

    /**
     * Calcular score de engagement
     */
    calculateEngagementScore(events) {
        let score = 0;
        
        events.forEach(event => {
            switch (event.type) {
                case 'click':
                    score += 1;
                    break;
                case 'scroll_milestone':
                    score += event.data.percentage / 25;
                    break;
                case 'form_submission':
                    score += 5;
                    break;
                case 'custom_event':
                    score += 2;
                    break;
                case 'conversion':
                    score += 10;
                    break;
            }
        });
        
        return Math.min(100, score);
    }

    /**
     * Generar insights
     */
    generateInsights(events) {
        const insights = [];
        
        // Insight de páginas populares
        const pageViews = events.filter(e => e.type === 'page_view');
        const pageCounts = {};
        pageViews.forEach(event => {
            pageCounts[event.url] = (pageCounts[event.url] || 0) + 1;
        });
        
        const popularPages = Object.entries(pageCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([url, count]) => ({ url, count }));
        
        if (popularPages.length > 0) {
            insights.push({
                type: 'popular_pages',
                title: 'Páginas Más Populares',
                data: popularPages
            });
        }
        
        // Insight de dispositivos
        const devices = {};
        events.forEach(event => {
            const device = this.getDeviceType(event.userAgent);
            devices[device] = (devices[device] || 0) + 1;
        });
        
        const deviceBreakdown = Object.entries(devices)
            .sort(([,a], [,b]) => b - a);
        
        if (deviceBreakdown.length > 0) {
            insights.push({
                type: 'device_breakdown',
                title: 'Dispositivos Utilizados',
                data: deviceBreakdown
            });
        }
        
        return insights;
    }

    /**
     * Generar recomendaciones
     */
    generateRecommendations(events) {
        const recommendations = [];
        const metrics = this.calculateMetrics(events);
        
        // Recomendación de bounce rate
        if (metrics.pageViews > 0 && metrics.conversionRate < 2) {
            recommendations.push({
                type: 'conversion_optimization',
                title: 'Optimizar Tasa de Conversión',
                description: 'La tasa de conversión es baja. Considera mejorar los CTAs.',
                priority: 'high'
            });
        }
        
        // Recomendación de engagement
        if (metrics.engagementScore < 30) {
            recommendations.push({
                type: 'engagement_improvement',
                title: 'Mejorar Engagement',
                description: 'El engagement es bajo. Considera contenido más interactivo.',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }

    /**
     * Utilidades
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getUTMParameters() {
        const params = new URLSearchParams(window.location.search);
        return {
            source: params.get('utm_source') || '',
            medium: params.get('utm_medium') || '',
            campaign: params.get('utm_campaign') || '',
            term: params.get('utm_term') || '',
            content: params.get('utm_content') || ''
        };
    }
    
    getDeviceInfo() {
        return {
            type: this.getDeviceType(),
            browser: this.getBrowser(),
            os: this.getOS(),
            screen: {
                width: screen.width,
                height: screen.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }
    
    getUserLocation() {
        // En una implementación real, esto usaría geolocalización
        return {
            country: 'unknown',
            city: 'unknown',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }
    
    getDeviceType() {
        const ua = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad/.test(ua)) return 'mobile';
        if (/Tablet/.test(ua)) return 'tablet';
        return 'desktop';
    }
    
    getBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'chrome';
        if (ua.includes('Firefox')) return 'firefox';
        if (ua.includes('Safari')) return 'safari';
        if (ua.includes('Edge')) return 'edge';
        return 'unknown';
    }
    
    getOS() {
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) return 'windows';
        if (ua.includes('Mac')) return 'macos';
        if (ua.includes('Linux')) return 'linux';
        if (ua.includes('Android')) return 'android';
        if (ua.includes('iOS')) return 'ios';
        return 'unknown';
    }
    
    getPeriodMs(period) {
        const periods = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        return periods[period] || periods['24h'];
    }
    
    getActiveUsers() {
        // Simular usuarios activos (en producción vendría del servidor)
        return Math.floor(Math.random() * 100) + 50;
    }
    
    getMaxScrollDepth() {
        return Math.round((window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    }
    
    sanitizeData(data) {
        if (typeof data === 'string') {
            return data.replace(/<script[^>]*>.*?<\/script>/gi, '');
        }
        return data;
    }
    
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            if (this.config.privacy.excludeSensitiveData) {
                // Excluir campos sensibles
                if (key.toLowerCase().includes('password') || 
                    key.toLowerCase().includes('card') ||
                    key.toLowerCase().includes('ssn')) {
                    data[key] = '[REDACTED]';
                } else {
                    data[key] = value;
                }
            } else {
                data[key] = value;
            }
        }
        return data;
    }
    
    parseAnalyticsMessage(message) {
        const match = message.match(/ANALYTICS:\s*(\w+)\s*(.+)/);
        if (match) {
            return {
                type: match[1],
                data: match[2]
            };
        }
        return null;
    }
    
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
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

window.LaboriaAnalytics = new AnalyticsSystem();

console.log('📊 Sistema de Analíticas Avanzado inicializado:', {
    features: [
        'Real-time event tracking',
        'User behavior analysis',
        'Performance monitoring',
        'Conversion tracking',
        'Privacy-compliant analytics',
        'Custom event support'
    ]
});

// Funciones helper globales
window.trackEvent = function(type, data) {
    return window.LaboriaAnalytics.trackCustomEvent(type, data);
};

window.getAnalyticsMetrics = function() {
    return window.LaboriaAnalytics.getMetrics();
};

window.generateAnalyticsReport = function(period) {
    return window.LaboriaAnalytics.generateReport(period);
};
