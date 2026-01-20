// =============================================
// SISTEMA DE NOTIFICACIONES LABORIA
// =============================================

class LaboriaNotificationSystem {
    constructor() {
        this.notifications = [];
        this.settings = {
            enabled: true,
            sound: true,
            desktop: true,
            duration: 5000,
            maxVisible: 5
        };
        this.audioContext = null;
        this.userInteracted = false;
        this.loadSettings();
        this.setupUserInteractionDetection();
    }

    // Configurar detección de interacción del usuario
    setupUserInteractionDetection() {
        const events = ['click', 'keydown', 'touchstart'];
        const enableAudio = () => {
            this.userInteracted = true;
            console.log('👆 Interacción del usuario detectada - Audio habilitado');
            // Remover listeners después de la primera interacción
            events.forEach(event => {
                document.removeEventListener(event, enableAudio);
            });
        };
        
        events.forEach(event => {
            document.addEventListener(event, enableAudio, { once: true });
        });
    }

    // Cargar configuración desde localStorage
    loadSettings() {
        const saved = localStorage.getItem('laboria-notification-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    // Guardar configuración en localStorage
    saveSettings() {
        localStorage.setItem('laboria-notification-settings', JSON.stringify(this.settings));
    }

    // Solicitar permisos para notificaciones de escritorio
    async requestDesktopPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    // Mostrar notificación
    async showNotification(message, type = 'info', options = {}) {
        if (!this.settings.enabled) return;

        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date(),
            read: false,
            ...options
        };

        // Agregar a la lista
        this.notifications.unshift(notification);
        this.limitNotifications();

        // Mostrar notificación en la UI
        this.showUINotification(notification);

        // Notificación de escritorio
        if (this.settings.desktop) {
            await this.showDesktopNotification(notification);
        }

        // Sonido
        if (this.settings.sound) {
            this.playNotificationSound(type);
        }
    }

    // Limitar número de notificaciones visibles
    limitNotifications() {
        if (this.notifications.length > this.settings.maxVisible) {
            this.notifications = this.notifications.slice(0, this.settings.maxVisible);
        }
    }

    // Mostrar notificación en la UI
    showUINotification(notification) {
        const container = this.getOrCreateContainer();
        
        const element = document.createElement('div');
        element.className = `laboria-notification ${notification.type}`;
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-${this.getIcon(notification.type)}"></i>
                </div>
                <div class="notification-text">
                    <div class="notification-title">${this.getTitle(notification.type)}</div>
                    <div class="notification-message">${notification.message}</div>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-progress"></div>
        `;

        // Estilos
        element.style.cssText = `
            background: var(--theme-${notification.type});
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            position: relative;
            overflow: hidden;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        `;

        container.appendChild(element);

        // Auto-remover
        setTimeout(() => {
            if (element.parentNode) {
                element.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    element.remove();
                }, 300);
            }
        }, this.settings.duration);

        // Click para cerrar
        element.addEventListener('click', () => {
            element.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                element.remove();
            }, 300);
        });
    }

    // Mostrar notificación de escritorio
    async showDesktopNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const desktopNotification = new Notification(this.getTitle(notification.type), {
                body: notification.message,
                icon: this.getIconPath(notification.type),
                tag: `laboria-${notification.type}`,
                requireInteraction: false
            });

            desktopNotification.onclick = () => {
                window.focus();
                desktopNotification.close();
            };

            setTimeout(() => {
                desktopNotification.close();
            }, this.settings.duration);
        }
    }

    // Reproducir sonido de notificación
    playNotificationSound(type = 'default') {
        try {
            // Solo reproducir sonido si hay interacción del usuario
            if (!this.userInteracted) {
                console.log('🔇 Esperando interacción del usuario para reproducir sonido...');
                return;
            }
            
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Reanudar AudioContext si está suspendido
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    this._playSound(type);
                }).catch(error => {
                    console.warn('⚠️ No se pudo reanudar AudioContext:', error);
                });
            } else {
                this._playSound(type);
            }
        } catch (error) {
            console.warn('⚠️ Error al reproducir sonido:', error);
        }
    }
    
    _playSound(type) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Configurar sonido según tipo
            const frequencies = {
                'success': 800,
                'error': 300,
                'warning': 600,
                'info': 500,
                'default': 500
            };
            
            oscillator.frequency.value = frequencies[type] || frequencies['default'];
            oscillator.type = 'sine';
            
            // Configurar volumen
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            // Reproducir
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        } catch (error) {
            console.warn('⚠️ Error al generar sonido:', error);
        }
    }

    // Obtener o crear contenedor de notificaciones
    getOrCreateContainer() {
        let container = document.getElementById('laboria-notifications');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'laboria-notifications';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            
            // Estilos CSS para animaciones
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                
                .laboria-notification {
                    pointer-events: auto;
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .notification-icon {
                    font-size: 1.2rem;
                    min-width: 24px;
                }
                
                .notification-text {
                    flex: 1;
                }
                
                .notification-title {
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                }
                
                .notification-message {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
                .notification-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: rgba(255, 255, 255, 0.3);
                    width: 100%;
                    animation: progress ${this.settings.duration}ms linear;
                }
                
                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(container);
        }
        
        return container;
    }

    // Obtener icono según tipo
    getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Obtener título según tipo
    getTitle(type) {
        const titles = {
            success: '✅ Éxito',
            error: '❌ Error',
            warning: '⚠️ Advertencia',
            info: 'ℹ️ Información'
        };
        return titles[type] || 'ℹ️ Notificación';
    }

    // Obtener ruta del icono
    getIconPath(type) {
        // En producción, podrías tener iconos reales
        return `/assets/icons/${type}.png`;
    }

    // Marcar notificación como leída
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }

    // Obtener notificaciones no leídas
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    // Limpiar todas las notificaciones
    clearAll() {
        this.notifications = [];
        const container = document.getElementById('laboria-notifications');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Actualizar configuración
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }

    // Inicializar sistema
    async init() {
        // Solicitar permisos de escritorio
        await this.requestDesktopPermission();
        
        // Reemplazar sistema de notificaciones global
        if (window.LaboriaAPI) {
            const originalShowNotification = window.LaboriaAPI.showNotification;
            window.LaboriaAPI.showNotification = (message, type, options) => {
                this.showNotification(message, type, options);
                // También llamar al método original para compatibilidad
                if (originalShowNotification) {
                    originalShowNotification.call(window.LaboriaAPI, message, type);
                }
            };
        }
        
        console.log('🔔 Sistema de notificaciones Laboria inicializado');
    }
}

// Instancia global
window.LaboriaNotifications = new LaboriaNotificationSystem();

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.LaboriaNotifications.init();
    }, 100);
});
