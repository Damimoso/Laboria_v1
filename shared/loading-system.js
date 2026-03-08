/**
 * Sistema de Loading States y Feedback Visual
 * Proporciona indicadores de carga consistentes y profesionales
 */

class LoadingSystem {
    constructor() {
        this.activeLoaders = new Map();
        this.loadingStates = this.initializeLoadingStates();
        this.spinnerTypes = this.initializeSpinnerTypes();
        this.progressBars = new Map();
        this.init();
    }

    /**
     * Inicializar el sistema de loading
     */
    init() {
        console.log('⏳ Inicializando Sistema de Loading States...');
        
        // Crear overlay global de loading
        this.createGlobalLoadingOverlay();
        
        // Configurar estilos CSS
        this.setupLoadingStyles();
        
        // Configurar listeners globales
        this.setupGlobalListeners();
        
        console.log('✅ Sistema de Loading States inicializado');
    }

    /**
     * Inicializar estados de loading
     */
    initializeLoadingStates() {
        return {
            IDLE: 'idle',
            LOADING: 'loading',
            SUCCESS: 'success',
            ERROR: 'error',
            WARNING: 'warning',
            PARTIAL: 'partial'
        };
    }

    /**
     * Inicializar tipos de spinners
     */
    initializeSpinnerTypes() {
        return {
            DEFAULT: 'default',
            DOTS: 'dots',
            PULSE: 'pulse',
            BOUNCE: 'bounce',
            WAVE: 'wave',
            HEARTBEAT: 'heartbeat',
            GEAR: 'gear',
            ATOM: 'atom'
        };
    }

    /**
     * Crear overlay global de loading
     */
    createGlobalLoadingOverlay() {
        let overlay = document.getElementById('global-loading-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'global-loading-overlay';
            overlay.className = 'global-loading-overlay';
            overlay.innerHTML = `
                <div class="global-loading-content">
                    <div class="global-loading-spinner"></div>
                    <div class="global-loading-text">Cargando...</div>
                    <div class="global-loading-progress">
                        <div class="global-loading-progress-bar"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        this.globalOverlay = overlay;
    }

    /**
     * Configurar estilos CSS para loading
     */
    setupLoadingStyles() {
        if (document.getElementById('loading-system-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'loading-system-styles';
        styles.textContent = `
            /* Global Loading Overlay */
            .global-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .global-loading-overlay.show {
                display: flex;
                opacity: 1;
            }
            
            .global-loading-content {
                text-align: center;
                color: white;
                padding: 2rem;
                background: rgba(0, 0, 0, 0.9);
                border-radius: 1rem;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                max-width: 300px;
                margin: 0 auto;
            }
            
            .global-loading-spinner {
                width: 50px;
                height: 50px;
                margin: 0 auto 1rem;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top: 3px solid #ffffff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .global-loading-text {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 1rem;
                font-family: 'Inter', sans-serif;
            }
            
            .global-loading-progress {
                width: 100%;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
                margin-top: 1rem;
            }
            
            .global-loading-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #10b981);
                border-radius: 2px;
                width: 0%;
                transition: width 0.3s ease;
                animation: shimmer 2s infinite;
            }
            
            /* Button Loading States */
            .btn {
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .btn.loading {
                pointer-events: none;
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            .btn.loading::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                animation: loading-shimmer 1.5s infinite;
            }
            
            .btn.loading .btn-text {
                opacity: 0;
            }
            
            .btn-loading-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .btn-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            /* Form Loading States */
            .form-group.loading {
                opacity: 0.6;
                pointer-events: none;
            }
            
            .form-input.loading {
                background: linear-gradient(90deg, #f8fafc 25%, #e2e8f0 50%, #f8fafc 75%);
                background-size: 200% 100%;
                animation: loading-shimmer 1.5s infinite;
            }
            
            .field-loading-indicator {
                display: block !important;
                position: absolute;
                right: 1rem;
                top: 50%;
                transform: translateY(-50%);
            }
            
            /* Card Loading States */
            .card.loading {
                opacity: 0.7;
                pointer-events: none;
            }
            
            .card-skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading-shimmer 1.5s infinite;
                border-radius: 0.5rem;
                margin-bottom: 1rem;
            }
            
            .skeleton-line {
                height: 1rem;
                margin: 0.5rem 0;
                border-radius: 0.25rem;
            }
            
            .skeleton-circle {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                margin: 0.5rem;
            }
            
            .skeleton-text {
                height: 0.875rem;
                margin: 0.25rem 0;
                width: 100%;
            }
            
            .skeleton-text.short {
                width: 60%;
            }
            
            .skeleton-text.medium {
                width: 80%;
            }
            
            /* Spinner Types */
            .spinner-dots {
                display: flex;
                gap: 0.25rem;
            }
            
            .spinner-dots span {
                width: 8px;
                height: 8px;
                background: currentColor;
                border-radius: 50%;
                animation: dot-bounce 1.4s infinite ease-in-out both;
            }
            
            .spinner-dots span:nth-child(1) { animation-delay: -0.32s; }
            .spinner-dots span:nth-child(2) { animation-delay: -0.16s; }
            .spinner-dots span:nth-child(3) { animation-delay: 0s; }
            
            .spinner-pulse {
                width: 40px;
                height: 40px;
                background: currentColor;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            .spinner-bounce {
                display: flex;
                gap: 0.25rem;
            }
            
            .spinner-bounce span {
                width: 8px;
                height: 8px;
                background: currentColor;
                border-radius: 50%;
                animation: bounce 1.4s infinite ease-in-out both;
            }
            
            .spinner-bounce span:nth-child(1) { animation-delay: -0.32s; }
            .spinner-bounce span:nth-child(2) { animation-delay: -0.16s; }
            .spinner-bounce span:nth-child(3) { animation-delay: 0s; }
            
            .spinner-gear {
                width: 40px;
                height: 40px;
                border: 3px solid currentColor;
                border-radius: 50%;
                border-top-color: transparent;
                border-right-color: transparent;
                animation: gear 2s linear infinite;
            }
            
            .spinner-heartbeat {
                width: 40px;
                height: 40px;
                position: relative;
            }
            
            .spinner-heartbeat::before,
            .spinner-heartbeat::after {
                content: '';
                position: absolute;
                width: 20px;
                height: 30px;
                background: currentColor;
                border-radius: 15px 15px 0 0;
                transform: rotate(-45deg);
                animation: heartbeat 1.3s infinite;
            }
            
            .spinner-heartbeat::after {
                left: 10px;
                transform: rotate(45deg);
                transform-origin: 0 100%;
                animation: heartbeat 1.3s infinite 0.7s;
            }
            
            /* Progress Bar */
            .progress-container {
                width: 100%;
                height: 8px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #10b981);
                border-radius: 4px;
                transition: width 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .progress-bar::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                animation: shimmer 2s infinite;
            }
            
            .progress-text {
                font-size: 0.875rem;
                color: var(--theme-text-secondary);
                margin-top: 0.5rem;
                text-align: center;
                font-weight: 500;
            }
            
            /* Toast Notifications */
            .toast-container {
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 10000;
                pointer-events: none;
            }
            
            .toast {
                background: white;
                border-radius: 0.5rem;
                padding: 1rem 1.5rem;
                margin-bottom: 0.5rem;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                border-left: 4px solid #3b82f6;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                min-width: 300px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                pointer-events: auto;
            }
            
            .toast.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .toast.success {
                border-left-color: #10b981;
            }
            
            .toast.error {
                border-left-color: #ef4444;
            }
            
            .toast.warning {
                border-left-color: #f59e0b;
            }
            
            .toast-icon {
                font-size: 1.25rem;
            }
            
            .toast-content {
                flex: 1;
            }
            
            .toast-title {
                font-weight: 600;
                margin-bottom: 0.25rem;
                color: var(--theme-text-primary);
            }
            
            .toast-message {
                color: var(--theme-text-secondary);
                font-size: 0.875rem;
                line-height: 1.4;
            }
            
            /* Animations */
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes loading-shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            @keyframes dot-bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            
            @keyframes bounce {
                0%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(0.8); }
            }
            
            @keyframes gear {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes heartbeat {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            /* Responsive Loading */
            @media (max-width: 768px) {
                .global-loading-content {
                    padding: 1.5rem;
                    max-width: 280px;
                }
                
                .global-loading-spinner {
                    width: 40px;
                    height: 40px;
                }
                
                .global-loading-text {
                    font-size: 1rem;
                }
                
                .toast {
                    min-width: 250px;
                    padding: 0.75rem 1rem;
                }
            }
            
            @media (max-width: 480px) {
                .global-loading-content {
                    padding: 1rem;
                    max-width: 250px;
                }
                
                .toast {
                    min-width: 200px;
                    padding: 0.5rem 0.75rem;
                }
            }
            
            /* Reduced Motion */
            @media (prefers-reduced-motion: reduce) {
                .global-loading-spinner,
                .btn-spinner,
                .progress-bar::after {
                    animation: none;
                }
                
                .btn.loading::before,
                .form-input.loading,
                .card-skeleton {
                    animation: none;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Configurar listeners globales
     */
    setupGlobalListeners() {
        // Listener para peticiones fetch
        this.interceptFetchRequests();
        
        // Listener para navegación
        this.interceptNavigation();
        
        // Listener para formularios
        this.interceptFormSubmissions();
    }

    /**
     * Interceptar peticiones fetch para mostrar loading
     */
    interceptFetchRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const url = args[0];
            
            // Solo mostrar loading para peticiones de API
            if (this.isApiRequest(url)) {
                this.showGlobalLoading('Procesando solicitud...');
            }
            
            try {
                const response = await originalFetch.apply(window, args);
                
                if (this.isApiRequest(url)) {
                    this.hideGlobalLoading();
                }
                
                return response;
            } catch (error) {
                if (this.isApiRequest(url)) {
                    this.hideGlobalLoading();
                }
                throw error;
            }
        };
    }

    /**
     * Interceptar navegación para mostrar loading
     */
    interceptNavigation() {
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && this.shouldShowLoadingForLink(link)) {
                this.showGlobalLoading('Cargando página...');
            }
        });
    }

    /**
     * Interceptar envío de formularios
     */
    interceptFormSubmissions() {
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (this.shouldShowLoadingForForm(form)) {
                this.showGlobalLoading('Enviando formulario...');
            }
        });
    }

    /**
     * Verificar si es una petición de API
     */
    isApiRequest(url) {
        if (typeof url === 'string') {
            return url.includes('/api/') || url.includes('laboria-api');
        }
        return false;
    }

    /**
     * Verificar si se debe mostrar loading para un link
     */
    shouldShowLoadingForLink(link) {
        const href = link.getAttribute('href');
        
        // No mostrar para links externos o anchors
        if (!href || href.startsWith('#') || href.startsWith('http')) {
            return false;
        }
        
        // No mostrar para links que no cambian de página
        if (href.includes('javascript:') || href.includes('mailto:') || href.includes('tel:')) {
            return false;
        }
        
        return true;
    }

    /**
     * Verificar si se debe mostrar loading para un formulario
     */
    shouldShowLoadingForForm(form) {
        // No mostrar para formularios de búsqueda
        if (form.classList.contains('search-form')) {
            return false;
        }
        
        return true;
    }

    /**
     * Mostrar loading global
     */
    showGlobalLoading(message = 'Cargando...', options = {}) {
        const overlay = this.globalOverlay;
        const textElement = overlay.querySelector('.global-loading-text');
        const progressElement = overlay.querySelector('.global-loading-progress');
        const progressBar = overlay.querySelector('.global-loading-progress-bar');
        
        // Actualizar mensaje
        if (textElement) {
            textElement.textContent = message;
        }
        
        // Mostrar/ocultar barra de progreso
        if (progressElement) {
            progressElement.style.display = options.showProgress ? 'block' : 'none';
        }
        
        // Actualizar progreso
        if (progressBar && options.progress !== undefined) {
            progressBar.style.width = `${Math.min(100, Math.max(0, options.progress))}%`;
        }
        
        // Mostrar overlay
        overlay.classList.add('show');
        
        // Prevenir scroll
        document.body.style.overflow = 'hidden';
        
        console.log('⏳ Loading global mostrado:', message);
    }

    /**
     * Ocultar loading global
     */
    hideGlobalLoading() {
        const overlay = this.globalOverlay;
        
        // Ocultar overlay
        overlay.classList.remove('show');
        
        // Restaurar scroll
        document.body.style.overflow = '';
        
        // Resetear progreso
        const progressBar = overlay.querySelector('.global-loading-progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        
        console.log('✅ Loading global ocultado');
    }

    /**
     * Mostrar loading en botón
     */
    showButtonLoading(button, options = {}) {
        const originalContent = button.innerHTML;
        const loadingContent = options.content || this.createButtonSpinner();
        
        // Guardar estado original
        this.activeLoaders.set(button, {
            originalContent,
            originalDisabled: button.disabled,
            originalClass: button.className
        });
        
        // Aplicar estado de loading
        button.classList.add('loading');
        button.disabled = true;
        button.innerHTML = loadingContent;
        
        // Agregar spinner si no se proporcionó contenido
        if (!options.content) {
            const spinner = button.querySelector('.btn-spinner');
            if (spinner) {
                spinner.style.color = 'currentColor';
            }
        }
        
        console.log('⏳ Button loading activado:', button);
    }

    /**
     * Ocultar loading en botón
     */
    hideButtonLoading(button, success = true) {
        const loader = this.activeLoaders.get(button);
        
        if (!loader) return;
        
        // Restaurar estado original
        button.classList.remove('loading');
        button.disabled = loader.originalDisabled;
        button.className = loader.originalClass;
        button.innerHTML = loader.originalContent;
        
        // Mostrar estado de éxito/error temporalmente
        if (success) {
            button.classList.add('success');
            setTimeout(() => button.classList.remove('success'), 2000);
        }
        
        // Limpiar loader
        this.activeLoaders.delete(button);
        
        console.log('✅ Button loading ocultado:', button);
    }

    /**
     * Crear spinner para botón
     */
    createButtonSpinner() {
        return `
            <div class="btn-loading-content">
                <div class="btn-spinner"></div>
                <span class="btn-text">Procesando...</span>
            </div>
        `;
    }

    /**
     * Mostrar loading en campo de formulario
     */
    showFieldLoading(field) {
        field.classList.add('loading');
        
        const indicator = field.parentNode.querySelector('.field-loading-indicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
        
        console.log('⏳ Field loading activado:', field);
    }

    /**
     * Ocultar loading en campo de formulario
     */
    hideFieldLoading(field) {
        field.classList.remove('loading');
        
        const indicator = field.parentNode.querySelector('.field-loading-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
        
        console.log('✅ Field loading ocultado:', field);
    }

    /**
     * Mostrar skeleton loading
     */
    showSkeletonLoading(container, options = {}) {
        const {
            lines = 3,
            circles = 0,
            height = '1rem',
            width = '100%'
        } = options;
        
        let skeletonHTML = '<div class="card-skeleton">';
        
        // Agregar líneas de texto
        for (let i = 0; i < lines; i++) {
            const lineClass = i === 0 ? 'short' : (i === lines - 1 ? 'medium' : '');
            skeletonHTML += `<div class="skeleton-text ${lineClass}"></div>`;
        }
        
        // Agregar círculos (avatares, imágenes)
        for (let i = 0; i < circles; i++) {
            skeletonHTML += '<div class="skeleton-circle"></div>';
        }
        
        skeletonHTML += '</div>';
        
        // Reemplazar contenido temporalmente
        container.originalContent = container.innerHTML;
        container.innerHTML = skeletonHTML;
        container.classList.add('skeleton-loading');
        
        console.log('⏳ Skeleton loading activado:', container);
    }

    /**
     * Ocultar skeleton loading
     */
    hideSkeletonLoading(container) {
        if (container.originalContent !== undefined) {
            container.innerHTML = container.originalContent;
            container.classList.remove('skeleton-loading');
            delete container.originalContent;
        }
        
        console.log('✅ Skeleton loading ocultado:', container);
    }

    /**
     * Mostrar barra de progreso
     */
    showProgress(container, options = {}) {
        const {
            progress = 0,
            text = 'Procesando...',
            showPercentage = true
        } = options;
        
        let progressHTML = `
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
        `;
        
        if (showPercentage) {
            progressHTML += `
                <div class="progress-text">${text} ${progress}%</div>
            `;
        }
        
        // Guardar estado original
        container.originalContent = container.innerHTML;
        container.innerHTML = progressHTML;
        container.classList.add('progress-loading');
        
        // Guardar referencia para actualizaciones
        this.progressBars.set(container, { container, options });
        
        console.log('⏳ Progress bar mostrada:', progress);
    }

    /**
     * Actualizar barra de progreso
     */
    updateProgress(container, progress, text) {
        const progressBar = container.querySelector('.progress-bar');
        const progressText = container.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
        
        if (progressText && text) {
            progressText.textContent = `${text} ${progress}%`;
        }
        
        console.log('📊 Progress actualizado:', progress);
    }

    /**
     * Ocultar barra de progreso
     */
    hideProgress(container) {
        if (container.originalContent !== undefined) {
            container.innerHTML = container.originalContent;
            container.classList.remove('progress-loading');
            delete container.originalContent;
        }
        
        this.progressBars.delete(container);
        
        console.log('✅ Progress bar ocultada:', container);
    }

    /**
     * Mostrar toast notification
     */
    showToast(message, type = 'info', options = {}) {
        const {
            title = '',
            duration = 5000,
            persistent = false
        } = options;
        
        // Crear contenedor de toasts si no existe
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Crear toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                ${this.getToastIcon(type)}
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        // Agregar al contenedor
        toastContainer.appendChild(toast);
        
        // Mostrar con animación
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto-ocultar si no es persistente
        if (!persistent) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        console.log('📢 Toast mostrado:', { message, type });
    }

    /**
     * Obtener icono para toast
     */
    getToastIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle" style="color: #10b981;"></i>',
            error: '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>',
            warning: '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>',
            info: '<i class="fas fa-info-circle" style="color: #3b82f6;"></i>'
        };
        
        return icons[type] || icons.info;
    }

    /**
     * Mostrar spinner personalizado
     */
    showSpinner(container, type = 'DEFAULT', options = {}) {
        const {
            size = '40px',
            color = '#3b82f6'
        } = options;
        
        const spinnerHTML = this.createSpinnerHTML(type, size, color);
        
        // Guardar contenido original
        container.originalContent = container.innerHTML;
        container.innerHTML = spinnerHTML;
        container.classList.add('spinner-loading');
        
        console.log('⏳ Spinner mostrado:', type);
    }

    /**
     * Ocultar spinner
     */
    hideSpinner(container) {
        if (container.originalContent !== undefined) {
            container.innerHTML = container.originalContent;
            container.classList.remove('spinner-loading');
            delete container.originalContent;
        }
        
        console.log('✅ Spinner ocultado:', container);
    }

    /**
     * Crear HTML para spinner
     */
    createSpinnerHTML(type, size, color) {
        const styles = `width: ${size}; height: ${size}; color: ${color};`;
        
        switch (type) {
            case 'DOTS':
                return `
                    <div class="spinner-dots" style="${styles}">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                `;
            case 'PULSE':
                return `<div class="spinner-pulse" style="${styles}"></div>`;
            case 'BOUNCE':
                return `
                    <div class="spinner-bounce" style="${styles}">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                `;
            case 'GEAR':
                return `<div class="spinner-gear" style="${styles}"></div>`;
            case 'HEARTBEAT':
                return `<div class="spinner-heartbeat" style="${styles}"></div>`;
            default:
                return `<div class="spinner-default" style="${styles}"></div>`;
        }
    }

    /**
     * Limpiar todos los loading states
     */
    clearAllLoading() {
        // Ocultar loading global
        this.hideGlobalLoading();
        
        // Limpiar botones
        this.activeLoaders.forEach((loader, button) => {
            this.hideButtonLoading(button);
        });
        
        // Limpiar skeletons
        document.querySelectorAll('.skeleton-loading').forEach(container => {
            this.hideSkeletonLoading(container);
        });
        
        // Limpiar progress bars
        this.progressBars.forEach((data, container) => {
            this.hideProgress(container);
        });
        
        // Limpiar spinners
        document.querySelectorAll('.spinner-loading').forEach(container => {
            this.hideSpinner(container);
        });
        
        console.log('🧹 Todos los loading states limpiados');
    }

    /**
     * Obtener estado actual del sistema
     */
    getSystemState() {
        return {
            activeLoaders: this.activeLoaders.size,
            progressBars: this.progressBars.size,
            globalLoading: this.globalOverlay.classList.contains('show'),
            toasts: document.querySelectorAll('.toast').length
        };
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

window.LaboriaLoading = new LoadingSystem();

console.log('⏳ Sistema de Loading States inicializado:', {
    features: [
        'Global loading overlay',
        'Button loading states',
        'Skeleton loading',
        'Progress bars',
        'Toast notifications',
        'Custom spinners',
        'Request interception'
    ]
});
