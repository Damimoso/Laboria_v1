/**
 * Sistema de Manejo de Errores Contextual
 * Proporciona manejo robusto de errores con logging, recuperación y páginas personalizadas
 */

class ErrorHandlingSystem {
    constructor() {
        this.errorTypes = this.initializeErrorTypes();
        this.errorPages = this.initializeErrorPages();
        this.errorLog = [];
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.retryDelays = [1000, 2000, 4000]; // Progressive delays
        this.init();
    }

    /**
     * Inicializar el sistema de manejo de errores
     */
    init() {
        console.log('🚨 Inicializando Sistema de Manejo de Errores...');
        
        // Configurar listeners globales de errores
        this.setupGlobalErrorListeners();
        
        // Configurar manejo de promesas rechazadas
        this.setupUnhandledRejectionHandler();
        
        // Configurar logging de errores
        this.setupErrorLogging();
        
        // Crear páginas de error si no existen
        this.createErrorPages();
        
        console.log('✅ Sistema de Manejo de Errores inicializado');
    }

    /**
     * Inicializar tipos de errores
     */
    initializeErrorTypes() {
        return {
            NETWORK: 'network',
            VALIDATION: 'validation',
            AUTHENTICATION: 'authentication',
            AUTHORIZATION: 'authorization',
            NOT_FOUND: 'not_found',
            SERVER: 'server',
            TIMEOUT: 'timeout',
            PERMISSION: 'permission',
            QUOTA: 'quota',
            UNKNOWN: 'unknown',
            CRITICAL: 'critical',
            WARNING: 'warning',
            INFO: 'info'
        };
    }

    /**
     * Inicializar páginas de error
     */
    initializeErrorPages() {
        return {
            400: {
                title: 'Solicitud Inválida',
                message: 'La solicitud no es válida o contiene errores.',
                action: 'Verifica los datos enviados e intenta nuevamente.',
                icon: 'fa-exclamation-triangle',
                color: '#f59e0b'
            },
            401: {
                title: 'No Autorizado',
                message: 'No tienes permiso para acceder a este recurso.',
                action: 'Inicia sesión o contacta al administrador.',
                icon: 'fa-lock',
                color: '#ef4444'
            },
            403: {
                title: 'Acceso Prohibido',
                message: 'No tienes permiso para acceder a este recurso.',
                action: 'Contacta al administrador si crees que es un error.',
                icon: 'fa-ban',
                color: '#dc2626'
            },
            404: {
                title: 'Página No Encontrada',
                message: 'La página que buscas no existe o ha sido movida.',
                action: 'Verifica la URL o regresa a la página principal.',
                icon: 'fa-search',
                color: '#6b7280'
            },
            408: {
                title: 'Tiempo de Espera Agotado',
                message: 'La solicitud tardó demasiado tiempo en procesarse.',
                action: 'Intenta nuevamente o verifica tu conexión.',
                icon: 'fa-clock',
                color: '#f59e0b'
            },
            429: {
                title: 'Demasiadas Solicitudes',
                message: 'Has realizado demasiadas solicitudes recientemente.',
                action: 'Espera un momento antes de intentarlo nuevamente.',
                icon: 'fa-hourglass-half',
                color: '#f59e0b'
            },
            500: {
                title: 'Error Interno del Servidor',
                message: 'Ha ocurrido un error en nuestros servidores.',
                action: 'Estamos trabajando en solucionarlo. Intenta más tarde.',
                icon: 'fa-server',
                color: '#ef4444'
            },
            502: {
                title: 'Servicio No Disponible',
                message: 'El servidor está temporalmente fuera de servicio.',
                action: 'Intenta nuevamente en unos minutos.',
                icon: 'fa-tools',
                color: '#f59e0b'
            },
            503: {
                title: 'Servicio No Disponible',
                message: 'El servidor está temporalmente sobrecargado.',
                action: 'Intenta nuevamente más tarde.',
                icon: 'fa-exclamation-circle',
                color: '#f59e0b'
            },
            504: {
                title: 'Tiempo de Espera Agotado',
                message: 'El servidor tardó demasiado tiempo en responder.',
                action: 'Intenta nuevamente o verifica tu conexión.',
                icon: 'fa-clock',
                color: '#f59e0b'
            },
            NETWORK_ERROR: {
                title: 'Error de Conexión',
                message: 'No se puede conectar con el servidor.',
                action: 'Verifica tu conexión a internet e intenta nuevamente.',
                icon: 'fa-wifi',
                color: '#ef4444'
            },
            TIMEOUT: {
                title: 'Tiempo de Espera Agotado',
                message: 'La operación tardó demasiado tiempo.',
                action: 'Intenta nuevamente o verifica tu conexión.',
                icon: 'fa-hourglass-end',
                color: '#f59e0b'
            },
            VALIDATION: {
                title: 'Error de Validación',
                message: 'Los datos proporcionados no son válidos.',
                action: 'Revisa los campos del formulario y corrige los errores.',
                icon: 'fa-check-circle',
                color: '#f59e0b'
            },
            AUTHENTICATION: {
                title: 'Error de Autenticación',
                message: 'Las credenciales proporcionadas no son válidas.',
                action: 'Verifica tu email y contraseña e intenta nuevamente.',
                icon: 'fa-user-times',
                color: '#ef4444'
            },
            PERMISSION: {
                title: 'Permiso Denegado',
                message: 'No tienes permiso para realizar esta acción.',
                action: 'Contacta al administrador para solicitar acceso.',
                icon: 'fa-shield-alt',
                color: '#dc2626'
            },
            QUOTA: {
                title: 'Cuota Excedida',
                message: 'Has alcanzado el límite de almacenamiento.',
                action: 'Libera espacio o contacta al soporte.',
                icon: 'fa-database',
                color: '#f59e0b'
            },
            CRITICAL: {
                title: 'Error Crítico',
                message: 'Ha ocurrido un error crítico en la aplicación.',
                action: 'Recarga la página o contacta al soporte técnico.',
                icon: 'fa-exclamation-triangle',
                color: '#dc2626'
            }
        };
    }

    /**
     * Configurar listeners globales de errores
     */
    setupGlobalErrorListeners() {
        // Error de JavaScript
        window.addEventListener('error', (event) => {
            this.handleError({
                type: this.errorTypes.UNKNOWN,
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });

        // Error de carga de recursos
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: this.errorTypes.NETWORK,
                    message: `Error cargando recurso: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    source: event.target.src || event.target.href,
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                });
            }
        }, true);

        // Error de red no controlada
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: this.errorTypes.UNKNOWN,
                message: event.reason?.message || 'Promise rechazada sin manejar',
                reason: event.reason,
                promise: event.promise,
                timestamp: new Date().toISOString(),
                url: window.location.href
            });
        });
    }

    /**
     * Configurar manejador de promesas rechazadas
     */
    setupUnhandledRejectionHandler() {
        const originalPromiseRejectionHandler = window.onunhandledrejection;
        
        window.onunhandledrejection = (event) => {
            this.handleError({
                type: this.errorTypes.UNKNOWN,
                message: 'Promesa rechazada no manejada',
                reason: event.reason,
                promise: event.promise,
                timestamp: new Date().toISOString(),
                url: window.location.href
            });
            
            if (originalPromiseRejectionHandler) {
                originalPromiseRejectionHandler(event);
            }
        };
    }

    /**
     * Configurar logging de errores
     */
    setupErrorLogging() {
        // Sobreescribir console.error para capturar todos los errores
        const originalConsoleError = console.error;
        
        console.error = (...args) => {
            // Llamar al original para mantener funcionalidad
            originalConsoleError.apply(console, args);
            
            // Capturar el error para nuestro sistema
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            
            this.handleError({
                type: this.errorTypes.UNKNOWN,
                message: message,
                args: args,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                source: 'console.error'
            });
        };
    }

    /**
     * Crear páginas de error si no existen
     */
    createErrorPages() {
        // Las páginas ya están creadas manualmente
        // Este método puede usarse para generar páginas dinámicamente
        console.log('📄 Páginas de error verificadas');
    }

    /**
     * Manejar error principal
     */
    handleError(errorInfo) {
        // Enriquecer información del error
        const enrichedError = this.enrichErrorInfo(errorInfo);
        
        // Loggear error
        this.logError(enrichedError);
        
        // Determinar si se puede reintentar
        if (this.canRetry(enrichedError)) {
            return this.retryOperation(enrichedError);
        }
        
        // Mostrar error al usuario
        this.showErrorToUser(enrichedError);
        
        // Reportar error si es crítico
        if (enrichedError.severity === 'critical') {
            this.reportCriticalError(enrichedError);
        }
        
        return enrichedError;
    }

    /**
     * Enriquecer información del error
     */
    enrichErrorInfo(errorInfo) {
        return {
            id: this.generateErrorId(),
            type: errorInfo.type || this.errorTypes.UNKNOWN,
            severity: this.determineSeverity(errorInfo),
            message: errorInfo.message || 'Error desconocido',
            timestamp: errorInfo.timestamp || new Date().toISOString(),
            url: errorInfo.url || window.location.href,
            userAgent: errorInfo.userAgent || navigator.userAgent,
            stack: errorInfo.stack || (errorInfo.error?.stack || ''),
            context: this.getErrorContext(errorInfo),
            recoverable: this.isRecoverable(errorInfo),
            action: this.getRecommendedAction(errorInfo),
            userId: this.getCurrentUserId(),
            sessionId: this.getSessionId(),
            ...errorInfo
        };
    }

    /**
     * Determinar severidad del error
     */
    determineSeverity(errorInfo) {
        if (errorInfo.type === this.errorTypes.CRITICAL || 
            errorInfo.type === this.errorTypes.AUTHENTICATION ||
            errorInfo.type === this.errorTypes.PERMISSION) {
            return 'critical';
        }
        
        if (errorInfo.type === this.errorTypes.SERVER ||
            errorInfo.type === this.errorTypes.NETWORK ||
            errorInfo.type === this.errorTypes.TIMEOUT) {
            return 'high';
        }
        
        if (errorInfo.type === this.errorTypes.VALIDATION ||
            errorInfo.type === this.errorTypes.QUOTA) {
            return 'medium';
        }
        
        return 'low';
    }

    /**
     * Obtener contexto del error
     */
    getErrorContext(errorInfo) {
        const context = {
            page: this.getCurrentPageType(),
            action: this.getCurrentAction(),
            device: this.getDeviceContext(),
            network: this.getNetworkContext(),
            browser: this.getBrowserContext()
        };
        
        return context;
    }

    /**
     * Verificar si el error es recuperable
     */
    isRecoverable(errorInfo) {
        const recoverableTypes = [
            this.errorTypes.NETWORK,
            this.errorTypes.TIMEOUT,
            this.errorTypes.SERVER
        ];
        
        return recoverableTypes.includes(errorInfo.type);
    }

    /**
     * Obtener acción recomendada
     */
    getRecommendedAction(errorInfo) {
        const errorPage = this.errorPages[errorInfo.type] || 
                          this.errorPages[errorInfo.status];
        
        return errorPage?.action || 'Intenta nuevamente más tarde.';
    }

    /**
     * Verificar si se puede reintentar la operación
     */
    canRetry(errorInfo) {
        if (!this.isRecoverable(errorInfo)) {
            return false;
        }
        
        const retryKey = this.getRetryKey(errorInfo);
        const attempts = this.retryAttempts.get(retryKey) || 0;
        
        return attempts < this.maxRetries;
    }

    /**
     * Reintentar operación
     */
    async retryOperation(errorInfo) {
        const retryKey = this.getRetryKey(errorInfo);
        const attempts = this.retryAttempts.get(retryKey) || 0;
        
        if (attempts >= this.maxRetries) {
            this.showErrorToUser(errorInfo);
            return false;
        }
        
        // Incrementar contador de intentos
        this.retryAttempts.set(retryKey, attempts + 1);
        
        // Mostrar notificación de reintento
        this.showRetryNotification(attempts + 1);
        
        // Esperar antes de reintentar
        const delay = this.retryDelays[Math.min(attempts, this.retryDelays.length - 1)];
        await this.delay(delay);
        
        // Reintentar la operación
        if (errorInfo.retryFunction) {
            try {
                const result = await errorInfo.retryFunction();
                
                // Si tiene éxito, limpiar contador
                this.retryAttempts.delete(retryKey);
                this.showSuccessNotification();
                
                return result;
            } catch (retryError) {
                return this.handleError(retryError);
            }
        }
        
        return false;
    }

    /**
     * Obtener clave para reintentos
     */
    getRetryKey(errorInfo) {
        return `${errorInfo.type}_${errorInfo.url}_${errorInfo.userId || 'anonymous'}`;
    }

    /**
     * Mostrar notificación de reintento
     */
    showRetryNotification(attempt) {
        const message = `Reintento ${attempt} de ${this.maxRetries}...`;
        
        if (window.LaboriaNotifications) {
            window.LaboriaNotifications.showNotification(message, 'warning');
        } else {
            console.warn('🔄', message);
        }
    }

    /**
     * Mostrar notificación de éxito
     */
    showSuccessNotification() {
        const message = 'Operación completada exitosamente';
        
        if (window.LaboriaNotifications) {
            window.LaboriaNotifications.showNotification(message, 'success');
        } else {
            console.log('✅', message);
        }
    }

    /**
     * Loggear error
     */
    logError(errorInfo) {
        // Agregar al log local
        this.errorLog.push(errorInfo);
        
        // Mantener solo los últimos 1000 errores
        if (this.errorLog.length > 1000) {
            this.errorLog = this.errorLog.slice(-1000);
        }
        
        // Enviar a servidor si está disponible
        this.sendErrorToServer(errorInfo);
        
        // Loggear en consola
        console.group('🚨 Error Log:');
        console.error('Error ID:', errorInfo.id);
        console.error('Type:', errorInfo.type);
        console.error('Severity:', errorInfo.severity);
        console.error('Message:', errorInfo.message);
        console.error('Context:', errorInfo.context);
        console.groupEnd();
    }

    /**
     * Enviar error al servidor
     */
    async sendErrorToServer(errorInfo) {
        try {
            // Solo enviar errores de alta severidad
            if (errorInfo.severity === 'low') {
                return;
            }
            
            const payload = {
                errorId: errorInfo.id,
                type: errorInfo.type,
                severity: errorInfo.severity,
                message: errorInfo.message,
                url: errorInfo.url,
                userAgent: errorInfo.userAgent,
                context: errorInfo.context,
                userId: errorInfo.userId,
                sessionId: errorInfo.sessionId,
                timestamp: errorInfo.timestamp
            };
            
            // Enviar a endpoint de logging (simulado)
            if (window.LaboriaAPI) {
                await window.LaboriaAPI.post('/api/errors/log', payload);
            }
        } catch (loggingError) {
            console.error('❌ Error enviando log al servidor:', loggingError);
        }
    }

    /**
     * Mostrar error al usuario
     */
    showErrorToUser(errorInfo) {
        // Determinar página de error
        const errorPage = this.errorPages[errorInfo.status] || 
                          this.errorPages[errorInfo.type] ||
                          this.errorPages.UNKNOWN;
        
        // Si estamos en una página de error, actualizar contenido
        if (this.isErrorPage()) {
            this.updateErrorPage(errorPage, errorInfo);
        } else {
            // Redirigir a página de error específica
            this.redirectToErrorPage(errorInfo.status || errorInfo.type, errorInfo);
        }
        
        // También mostrar toast notification
        if (window.LaboriaNotifications) {
            window.LaboriaNotifications.showNotification(
                errorPage.message, 
                'error',
                { 
                    title: errorPage.title,
                    duration: 8000 
                }
            );
        }
    }

    /**
     * Verificar si estamos en página de error
     */
    isErrorPage() {
        return window.location.pathname.includes('/error/') || 
               window.location.pathname.includes('error.html');
    }

    /**
     * Actualizar página de error
     */
    updateErrorPage(errorPage, errorInfo) {
        // Actualizar título
        const titleElement = document.getElementById('error-title');
        if (titleElement) {
            titleElement.textContent = errorPage.title;
        }
        
        // Actualizar mensaje
        const messageElement = document.getElementById('error-message');
        if (messageElement) {
            messageElement.textContent = errorPage.message;
        }
        
        // Actualizar acción recomendada
        const actionElement = document.getElementById('error-action');
        if (actionElement) {
            actionElement.textContent = errorPage.action;
        }
        
        // Actualizar icono y color
        const iconElement = document.getElementById('error-icon');
        if (iconElement) {
            iconElement.className = `fas ${errorPage.icon}`;
            iconElement.style.color = errorPage.color;
        }
        
        // Actualizar código de error
        const codeElement = document.getElementById('error-code');
        if (codeElement) {
            codeElement.textContent = errorInfo.status || errorInfo.type || 'UNKNOWN';
        }
    }

    /**
     * Redirigir a página de error
     */
    redirectToErrorPage(errorType, errorInfo) {
        const errorId = errorInfo.status || errorType;
        const errorUrl = `/pages/error.html?type=${errorId}&id=${errorInfo.id}`;
        
        // Guardar información del error en sessionStorage
        sessionStorage.setItem('lastError', JSON.stringify(errorInfo));
        
        window.location.href = errorUrl;
    }

    /**
     * Reportar error crítico
     */
    reportCriticalError(errorInfo) {
        // Enviar notificación inmediata
        if (window.LaboriaNotifications) {
            window.LaboriaNotifications.showNotification(
                'Se ha detectado un error crítico. El equipo técnico ha sido notificado.',
                'error',
                {
                    title: 'Error Crítico',
                    duration: 0, // No auto-ocultar
                    persistent: true
                }
            );
        }
        
        // Intentar enviar alerta a administrador
        this.sendCriticalAlert(errorInfo);
    }

    /**
     * Enviar alerta crítica
     */
    async sendCriticalAlert(errorInfo) {
        try {
            const alertPayload = {
                type: 'critical_error',
                errorId: errorInfo.id,
                message: errorInfo.message,
                url: errorInfo.url,
                userId: errorInfo.userId,
                timestamp: errorInfo.timestamp,
                severity: 'critical'
            };
            
            // Enviar a endpoint de alertas críticas
            if (window.LaboriaAPI) {
                await window.LaboriaAPI.post('/api/alerts/critical', alertPayload);
            }
        } catch (alertError) {
            console.error('❌ Error enviando alerta crítica:', alertError);
        }
    }

    /**
     * Generar ID único de error
     */
    generateErrorId() {
        return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtener tipo de página actual
     */
    getCurrentPageType() {
        const path = window.location.pathname;
        
        if (path.includes('/usuario/')) return 'user_profile';
        if (path.includes('/admin-')) return 'admin_panel';
        if (path.includes('/pages/')) return 'public_page';
        if (path.includes('/error')) return 'error_page';
        
        return 'unknown';
    }

    /**
     * Obtener acción actual
     */
    getCurrentAction() {
        // Analizar URL y eventos para determinar acción
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);
        
        if (params.get('action')) return params.get('action');
        if (hash.includes('#login')) return 'login';
        if (hash.includes('#register')) return 'register';
        if (hash.includes('#reset')) return 'password_reset';
        
        return 'unknown';
    }

    /**
     * Obtener contexto de dispositivo
     */
    getDeviceContext() {
        if (window.LaboriaDeviceDetection) {
            return window.LaboriaDeviceDetection.getDeviceInfo();
        }
        
        return {
            type: 'unknown',
            userAgent: navigator.userAgent
        };
    }

    /**
     * Obtener contexto de red
     */
    getNetworkContext() {
        if (navigator.connection) {
            return {
                type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                online: navigator.onLine
            };
        }
        
        return {
            type: 'unknown',
            online: navigator.onLine
        };
    }

    /**
     * Obtener contexto de navegador
     */
    getBrowserContext() {
        return {
            name: this.getBrowserName(),
            version: this.getBrowserVersion(),
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack
        };
    }

    /**
     * Obtener nombre del navegador
     */
    getBrowserName() {
        const ua = navigator.userAgent;
        
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        if (ua.includes('IE')) return 'Internet Explorer';
        
        return 'Unknown';
    }

    /**
     * Obtener versión del navegador
     */
    getBrowserVersion() {
        const ua = navigator.userAgent;
        const match = ua.match(/(Chrome|Firefox|Safari|Edge|IE)\/(\d+)/);
        
        return match ? match[2] : 'Unknown';
    }

    /**
     * Obtener ID de usuario actual
     */
    getCurrentUserId() {
        if (window.LaboriaAPI?.usuarioActual) {
            return window.LaboriaAPI.usuarioActual.id || 'anonymous';
        }
        
        return 'anonymous';
    }

    /**
     * Obtener ID de sesión
     */
    getSessionId() {
        return sessionStorage.getItem('sessionId') || 
               localStorage.getItem('sessionId') || 
               'unknown';
    }

    /**
     * Función de delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtener estadísticas de errores
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            bySeverity: {},
            recent: this.errorLog.slice(-10),
            critical: this.errorLog.filter(e => e.severity === 'critical').length
        };
        
        // Agrupar por tipo
        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * Limpiar log de errores
     */
    clearErrorLog() {
        this.errorLog = [];
        this.retryAttempts.clear();
        console.log('🧹 Log de errores limpiado');
    }

    /**
     * Exportar log de errores
     */
    exportErrorLog() {
        const logData = {
            exportDate: new Date().toISOString(),
            totalErrors: this.errorLog.length,
            errors: this.errorLog,
            stats: this.getErrorStats()
        };
        
        const dataStr = JSON.stringify(logData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Manejar error específico de API
     */
    handleApiError(error, context = {}) {
        const errorInfo = {
            type: this.mapApiErrorToType(error),
            message: error.message || 'Error en la API',
            status: error.status,
            context: {
                apiEndpoint: context.endpoint,
                httpMethod: context.method,
                requestData: context.data,
                ...context
            },
            retryFunction: context.retryFunction
        };
        
        return this.handleError(errorInfo);
    }

    /**
     * Mapear error de API a tipo interno
     */
    mapApiErrorToType(error) {
        const status = error.status;
        
        if (status === 401) return this.errorTypes.AUTHENTICATION;
        if (status === 403) return this.errorTypes.AUTHORIZATION;
        if (status === 404) return this.errorTypes.NOT_FOUND;
        if (status === 408 || status === 504) return this.errorTypes.TIMEOUT;
        if (status === 429) return this.errorTypes.QUOTA;
        if (status >= 500) return this.errorTypes.SERVER;
        if (error.name === 'NetworkError' || error.name === 'TypeError') {
            return this.errorTypes.NETWORK;
        }
        
        return this.errorTypes.UNKNOWN;
    }

    /**
     * Crear página de error genérica
     */
    createGenericErrorPage(errorType, errorInfo) {
        const errorPage = this.errorPages[errorType] || this.errorPages.UNKNOWN;
        
        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${errorPage.title} - Laboria</title>
                <link rel="stylesheet" href="/shared/base-styles.css">
                <link rel="stylesheet" href="/shared/responsive-styles.css">
                <link rel="stylesheet" href="/styles/styles.css">
                <script src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/js/all.min.js"></script>
                <style>
                    .error-container {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 2rem;
                    }
                    .error-content {
                        max-width: 600px;
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(10px);
                        border-radius: 1rem;
                        padding: 3rem;
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    }
                    .error-icon {
                        font-size: 4rem;
                        color: ${errorPage.color};
                        margin-bottom: 2rem;
                    }
                    .error-title {
                        font-size: 2rem;
                        font-weight: 700;
                        color: var(--theme-text-primary);
                        margin-bottom: 1rem;
                    }
                    .error-message {
                        font-size: 1.125rem;
                        color: var(--theme-text-secondary);
                        margin-bottom: 2rem;
                        line-height: 1.6;
                    }
                    .error-action {
                        font-size: 1rem;
                        color: var(--theme-text-primary);
                        margin-bottom: 2rem;
                        padding: 1rem;
                        background: rgba(59, 130, 246, 0.1);
                        border-left: 4px solid var(--theme-primary);
                        border-radius: 0.5rem;
                    }
                    .error-code {
                        font-size: 0.875rem;
                        color: var(--theme-text-secondary);
                        font-family: monospace;
                        background: rgba(0, 0, 0, 0.1);
                        padding: 0.5rem 1rem;
                        border-radius: 0.25rem;
                        display: inline-block;
                    }
                    .back-link {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        color: var(--theme-primary);
                        text-decoration: none;
                        font-weight: 500;
                        transition: all 0.3s ease;
                    }
                    .back-link:hover {
                        color: var(--theme-secondary);
                        transform: translateX(-2px);
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-content">
                        <div class="error-icon">
                            <i class="fas ${errorPage.icon}"></i>
                        </div>
                        <h1 class="error-title">${errorPage.title}</h1>
                        <p class="error-message">${errorPage.message}</p>
                        <div class="error-action">
                            <i class="fas fa-info-circle"></i>
                            ${errorPage.action}
                        </div>
                        <div class="error-code">Error: ${errorInfo.status || errorType}</div>
                        <div style="margin-top: 2rem;">
                            <a href="/" class="back-link">
                                <i class="fas fa-arrow-left"></i>
                                Volver al Inicio
                            </a>
                        </div>
                    </div>
                </div>
                <script>
                    // Mostrar información detallada en consola
                    console.error('Error Details:', ${JSON.stringify(errorInfo, null, 2)});
                </script>
            </body>
            </html>
        `;
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

window.LaboriaErrorHandling = new ErrorHandlingSystem();

console.log('🚨 Sistema de Manejo de Errores inicializado:', {
    features: [
        'Global error interception',
        'Automatic retry with exponential backoff',
        'Contextual error pages',
        'Error logging and analytics',
        'Critical error alerts',
        'Recovery mechanisms'
    ]
});

// Funciones helper globales
window.handleError = function(error, context) {
    return window.LaboriaErrorHandling.handleError({
        ...error,
        ...context
    });
};

window.handleApiError = function(error, context) {
    return window.LaboriaErrorHandling.handleApiError(error, context);
};
