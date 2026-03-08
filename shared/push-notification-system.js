/**
 * Sistema de Notificaciones Push
 * Proporciona notificaciones push completas con Service Worker, suscripciones y gestión inteligente
 */

class PushNotificationSystem {
    constructor() {
        this.config = this.initializeConfig();
        this.subscription = null;
        this.isSupported = this.checkSupport();
        this.permissionStatus = 'default';
        this.templates = this.initializeTemplates();
        this.analytics = null;
        this.init();
    }

    /**
     * Inicializar el sistema de notificaciones push
     */
    init() {
        console.log('🔔 Inicializando Sistema de Notificaciones Push...');
        
        // Verificar soporte
        if (!this.isSupported) {
            console.warn('⚠️ Push notifications no soportadas en este navegador');
            return;
        }
        
        // Conectar con sistema de analíticas
        this.analytics = window.LaboriaAnalytics;
        
        // Configurar Service Worker
        this.setupServiceWorker();
        
        // Configurar manejo de permisos
        this.setupPermissionHandling();
        
        // Configurar UI de gestión
        this.setupUI();
        
        // Recuperar suscripción existente
        this.recoverExistingSubscription();
        
        console.log('✅ Sistema de Notificaciones Push inicializado');
    }

    /**
     * Inicializar configuración
     */
    initializeConfig() {
        return {
            // Configuración de Service Worker
            serviceWorker: {
                url: '/sw.js',
                scope: '/'
            },
            
            // Configuración de VAPID (Voluntary Application Server Identification)
            vapid: {
                publicKey: 'BLjWp1GvR_8r_-pQJ9xqH7gHrLh8r_-pQJ9xqH7gHrLh8r_-pQJ9xqH7gHrLh8r_-pQJ9xqH7gHrLh8r_-pQJ9xqH7gHrL', // En producción usar clave real
                subject: 'mailto:admin@laboria.com'
            },
            
            // Configuración de notificaciones
            notifications: {
                maxRetries: 3,
                retryDelay: 1000,
                ttl: 24 * 60 * 60, // 24 horas
                batchSize: 100,
                quietHours: [22, 23, 0, 1, 2, 3, 4, 5, 6] // 10 PM a 6 AM
            },
            
            // Configuración de UI
            ui: {
                enableButton: '#enable-push-notifications',
                disableButton: '#disable-push-notifications',
                statusIndicator: '#push-status-indicator',
                settingsModal: '#push-settings-modal'
            },
            
            // Configuración de segmentación
            segmentation: {
                enabled: true,
                userGroups: ['job_seekers', 'employers', 'admins'],
                topics: ['jobs', 'applications', 'messages', 'system']
            }
        };
    }

    /**
     * Inicializar templates de notificaciones
     */
    initializeTemplates() {
        return {
            // Nueva oferta laboral
            new_job_offer: {
                title: '💼 Nueva Oferta Laboral',
                body: 'Se ha publicado una nueva oferta que coincide con tu perfil',
                icon: '/assets/icons/job-icon.png',
                badge: '/assets/badge.png',
                tag: 'new_job',
                actions: [
                    {
                        action: 'view',
                        title: 'Ver Oferta',
                        url: '/pages/job-offers.html?id={jobId}'
                    }
                ],
                data: {
                    type: 'job_offer',
                    priority: 'high'
                }
            },
            
            // Actualización de aplicación
            application_update: {
                title: '📄 Actualización de Aplicación',
                body: 'Tu aplicación ha sido actualizada: {status}',
                icon: '/assets/icons/application-icon.png',
                badge: '/assets/badge.png',
                tag: 'application_update',
                actions: [
                    {
                        action: 'view',
                        title: 'Ver Detalles',
                        url: '/usuario/aplicaciones.html'
                    }
                ],
                data: {
                    type: 'application_update',
                    priority: 'normal'
                }
            },
            
            // Nuevo mensaje
            new_message: {
                title: '💬 Nuevo Mensaje',
                body: 'Tienes un nuevo mensaje de {sender}',
                icon: '/assets/icons/message-icon.png',
                badge: '/assets/badge.png',
                tag: 'new_message',
                actions: [
                    {
                        action: 'reply',
                        title: 'Responder',
                        url: '/pages/messages.html?conversation={conversationId}'
                    },
                    {
                        action: 'view',
                        title: 'Ver Mensaje',
                        url: '/pages/messages.html?conversation={conversationId}'
                    }
                ],
                data: {
                    type: 'message',
                    priority: 'high'
                }
            },
            
            // Recordatorio de entrevista
            interview_reminder: {
                title: '🗓️ Recordatorio de Entrevista',
                body: 'Tienes una entrevista programada para {time} con {company}',
                icon: '/assets/icons/interview-icon.png',
                badge: '/assets/badge.png',
                tag: 'interview_reminder',
                actions: [
                    {
                        action: 'view',
                        title: 'Ver Detalles',
                        url: '/usuario/interviews.html?id={interviewId}'
                    },
                    {
                        action: 'calendar',
                        title: 'Agregar al Calendario',
                        url: '/calendar/add?interview={interviewId}'
                    }
                ],
                data: {
                    type: 'interview',
                    priority: 'high'
                }
            },
            
            // Actualización del sistema
            system_update: {
                title: '🔧 Actualización del Sistema',
                body: 'Laboria ha sido actualizado con nuevas funcionalidades',
                icon: '/assets/icons/system-icon.png',
                badge: '/assets/badge.png',
                tag: 'system_update',
                actions: [
                    {
                        action: 'view',
                        title: 'Ver Novedades',
                        url: '/pages/whats-new.html'
                    }
                ],
                data: {
                    type: 'system',
                    priority: 'normal'
                }
            },
            
            // Oferta destacada
            featured_job: {
                title: '⭐ Oferta Destacada',
                body: 'No te pierdas esta oferta destacada: {position}',
                icon: '/assets/icons/featured-icon.png',
                badge: '/assets/badge.png',
                tag: 'featured_job',
                actions: [
                    {
                        action: 'view',
                        title: 'Ver Oferta',
                        url: '/pages/job-offers.html?id={jobId}'
                    }
                ],
                data: {
                    type: 'featured_job',
                    priority: 'high'
                }
            }
        };
    }

    /**
     * Verificar soporte de notificaciones push
     */
    checkSupport() {
        return 'serviceWorker' in navigator && 
               'PushManager' in window && 
               'Notification' in window &&
               'showNotification' in Notification.prototype;
    }

    /**
     * Configurar Service Worker
     */
    async setupServiceWorker() {
        try {
            // Registrar Service Worker
            const registration = await navigator.serviceWorker.register(
                this.config.serviceWorker.url,
                this.config.serviceWorker.scope
            );
            
            console.log('📦 Service Worker registrado:', registration);
            
            // Esperar a que el Service Worker esté activo
            await navigator.serviceWorker.ready;
            
            // Suscribir a notificaciones push
            await this.subscribeToPush(registration);
            
            return registration;
        } catch (error) {
            console.error('❌ Error configurando Service Worker:', error);
            throw error;
        }
    }

    /**
     * Configurar manejo de permisos
     */
    setupPermissionHandling() {
        // Verificar estado actual de permisos
        this.updatePermissionStatus();
        
        // Escuchar cambios en permisos
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'notifications' }).then(result => {
                result.addEventListener('change', () => {
                    this.updatePermissionStatus();
                });
            });
        }
    }

    /**
     * Configurar UI de gestión
     */
    setupUI() {
        // Crear indicador de estado
        this.createStatusIndicator();
        
        // Crear botones de gestión
        this.createManagementButtons();
        
        // Crear modal de configuración
        this.createSettingsModal();
        
        // Actualizar UI según estado actual
        this.updateUI();
    }

    /**
     * Suscribir a notificaciones push
     */
    async subscribeToPush(registration) {
        try {
            // Verificar si ya existe una suscripción
            const existingSubscription = await registration.pushManager.getSubscription();
            
            if (existingSubscription) {
                this.subscription = existingSubscription;
                console.log('🔔 Usando suscripción existente');
                return existingSubscription;
            }
            
            // Solicitar permiso
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                console.warn('⚠️ Permiso de notificaciones denegado:', permission);
                this.permissionStatus = permission;
                this.updateUI();
                return null;
            }
            
            // Crear suscripción
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.config.vapid.publicKey
            });
            
            this.subscription = subscription;
            this.permissionStatus = 'granted';
            
            // Enviar suscripción al servidor
            await this.sendSubscriptionToServer(subscription);
            
            // Actualizar UI
            this.updateUI();
            
            console.log('✅ Suscripción a push exitosa:', subscription);
            
            // Trackear evento
            if (this.analytics) {
                this.analytics.trackCustomEvent('push_subscription_success', {
                    endpoint: subscription.endpoint
                });
            }
            
            return subscription;
            
        } catch (error) {
            console.error('❌ Error suscribiendo a push:', error);
            
            if (this.analytics) {
                this.analytics.trackCustomEvent('push_subscription_error', {
                    error: error.message
                });
            }
            
            throw error;
        }
    }

    /**
     * Recuperar suscripción existente
     */
    async recoverExistingSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                this.subscription = subscription;
                console.log('🔔 Suscripción existente recuperada');
                
                // Verificar si sigue siendo válida
                await this.validateSubscription(subscription);
            }
        } catch (error) {
            console.warn('⚠️ Error recuperando suscripción:', error);
        }
    }

    /**
     * Validar suscripción
     */
    async validateSubscription(subscription) {
        try {
            // Enviar suscripción al servidor para validación
            const response = await fetch('/api/push/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: subscription,
                    userAgent: navigator.userAgent
                })
            });
            
            if (!response.ok) {
                console.warn('⚠️ Suscripción inválida, renovando...');
                await this.renewSubscription();
            }
            
        } catch (error) {
            console.error('❌ Error validando suscripción:', error);
        }
    }

    /**
     * Renovar suscripción
     */
    async renewSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Eliminar suscripción actual
            if (this.subscription) {
                await this.subscription.unsubscribe();
            }
            
            // Crear nueva suscripción
            await this.subscribeToPush(registration);
            
        } catch (error) {
            console.error('❌ Error renovando suscripción:', error);
        }
    }

    /**
     * Enviar suscripción al servidor
     */
    async sendSubscriptionToServer(subscription) {
        try {
            const payload = {
                subscription: subscription,
                userAgent: navigator.userAgent,
                userId: this.getCurrentUserId(),
                preferences: this.getUserPreferences(),
                timestamp: Date.now()
            };
            
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ Suscripción enviada al servidor:', result);
            
            return result;
            
        } catch (error) {
            console.error('❌ Error enviando suscripción:', error);
            throw error;
        }
    }

    /**
     * Enviar notificación push
     */
    async sendPushNotification(templateKey, data, options = {}) {
        try {
            // Verificar si el template existe
            const template = this.templates[templateKey];
            if (!template) {
                throw new Error(`Template no encontrado: ${templateKey}`);
            }
            
            // Personalizar template con datos
            const notification = this personalizeTemplate(template, data);
            
            // Agregar opciones adicionales
            const finalNotification = {
                ...notification,
                ...options
            };
            
            // Determinar destinatarios
            const targets = this.determineTargets(notification.data);
            
            // Enviar a través del servidor
            const response = await fetch('/api/push/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notification: finalNotification,
                    targets,
                    options: {
                        ttl: this.config.notifications.ttl,
                        priority: notification.data.priority || 'normal',
                        quietHours: this.config.notifications.quietHours
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ Notificación push enviada:', result);
            
            // Trackear envío
            if (this.analytics) {
                this.analytics.trackCustomEvent('push_notification_sent', {
                    template: templateKey,
                    targets: targets.length,
                    priority: notification.data.priority
                });
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Error enviando notificación push:', error);
            
            if (this.analytics) {
                this.analytics.trackCustomEvent('push_notification_error', {
                    template: templateKey,
                    error: error.message
                });
            }
            
            throw error;
        }
    }

    /**
     * Personalizar template con datos
     */
    personalizeTemplate(template, data) {
        let notification = JSON.parse(JSON.stringify(template));
        
        // Reemplazar placeholders en título y body
        notification.title = this.replacePlaceholders(notification.title, data);
        notification.body = this.replacePlaceholders(notification.body, data);
        
        // Personalizar acciones
        if (notification.actions) {
            notification.actions = notification.actions.map(action => ({
                ...action,
                url: this.replacePlaceholders(action.url, data)
            }));
        }
        
        return notification;
    }

    /**
     * Reemplazar placeholders en texto
     */
    replacePlaceholders(text, data) {
        if (!text || !data) return text;
        
        let result = text;
        
        // Reemplazar placeholders como {jobId}, {sender}, etc.
        Object.keys(data).forEach(key => {
            const placeholder = `{${key}}`;
            result = result.replace(new RegExp(placeholder, 'g'), data[key]);
        });
        
        return result;
    }

    /**
     * Determinar destinatarios
     */
    determineTargets(data) {
        const targets = [];
        
        // Si se especifica un usuario específico
        if (data.userId) {
            targets.push({
                type: 'user',
                id: data.userId
            });
            return targets;
        }
        
        // Si se especifica un grupo de usuarios
        if (data.userGroup) {
            targets.push({
                type: 'group',
                name: data.userGroup
            });
        }
        
        // Si se especifica un topic
        if (data.topic) {
            targets.push({
                type: 'topic',
                name: data.topic
            });
        }
        
        // Si no se especifica nada, enviar a todos
        if (targets.length === 0) {
            targets.push({
                type: 'all'
            });
        }
        
        return targets;
    }

    /**
     * Crear indicador de estado
     */
    createStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = this.config.ui.statusIndicator.replace('#', '');
        indicator.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 1000; 
                        background: rgba(0, 0, 0, 0.8); color: white; padding: 0.5rem 1rem; 
                        border-radius: 0.25rem; font-size: 0.9rem; display: none;">
                <i class="fas fa-bell"></i>
                <span id="push-status-text">Notificaciones desactivadas</span>
            </div>
        `;
        document.body.appendChild(indicator);
    }

    /**
     * Crear botones de gestión
     */
    createManagementButtons() {
        // Botón de activar
        const enableBtn = document.createElement('button');
        enableBtn.id = this.config.ui.enableButton.replace('#', '');
        enableBtn.innerHTML = '<i class="fas fa-bell"></i> Activar Notificaciones';
        enableBtn.className = 'btn-primary';
        enableBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000;';
        enableBtn.onclick = () => this.enableNotifications();
        
        // Botón de desactivar
        const disableBtn = document.createElement('button');
        disableBtn.id = this.config.ui.disableButton.replace('#', '');
        disableBtn.innerHTML = '<i class="fas fa-bell-slash"></i> Desactivar';
        disableBtn.className = 'btn-secondary';
        disableBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000; display: none;';
        disableBtn.onclick = () => this.disableNotifications();
        
        document.body.appendChild(enableBtn);
        document.body.appendChild(disableBtn);
    }

    /**
     * Crear modal de configuración
     */
    createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = this.config.ui.settingsModal.replace('#', '');
        modal.innerHTML = `
            <div id="push-settings-content" style="display: none; position: fixed; top: 0; left: 0; 
                        right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); z-index: 10000; 
                        padding: 2rem; overflow-y: auto;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 0.5rem; 
                            padding: 2rem; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
                    <h2 style="margin-bottom: 1.5rem; color: #333;">
                        <i class="fas fa-cog"></i> Configuración de Notificaciones
                    </h2>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="margin-bottom: 1rem; color: #666;">Tipos de Notificaciones</h3>
                        <div id="notification-preferences">
                            ${this.createNotificationPreferences()}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="margin-bottom: 1rem; color: #666;">Horarios Silenciosos</h3>
                        <div>
                            <label>
                                <input type="checkbox" id="quiet-hours-enabled">
                                Habilitar modo silencioso
                            </label>
                            <div id="quiet-hours-config" style="margin-top: 1rem; display: none;">
                                <p>No enviar notificaciones de:</p>
                                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; margin-top: 0.5rem;">
                                    ${this.createQuietHoursCheckboxes()}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                        <button onclick="closePushSettings()" style="padding: 0.5rem 1rem; border: 1px solid #ccc; 
                                background: white; border-radius: 0.25rem; cursor: pointer;">
                            Cancelar
                        </button>
                        <button onclick="savePushSettings()" style="padding: 0.5rem 1rem; border: none; 
                                background: #3b82f6; color: white; border-radius: 0.25rem; cursor: pointer;">
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Funciones globales para el modal
        window.closePushSettings = () => {
            document.getElementById('push-settings-content').style.display = 'none';
        };
        
        window.savePushSettings = () => {
            this.saveUserPreferences();
            closePushSettings();
        };
        
        // Configurar checkboxes de quiet hours
        document.getElementById('quiet-hours-enabled').addEventListener('change', (e) => {
            document.getElementById('quiet-hours-config').style.display = 
                e.target.checked ? 'block' : 'none';
        });
    }

    /**
     * Crear preferencias de notificaciones
     */
    createNotificationPreferences() {
        const preferences = this.getUserPreferences();
        
        return Object.keys(this.templates).map(key => {
            const template = this.templates[key];
            const isEnabled = preferences.types && preferences.types.includes(key);
            
            return `
                <label style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <input type="checkbox" 
                           value="${key}" 
                           ${isEnabled ? 'checked' : ''}
                           style="margin-right: 0.5rem;">
                    <div>
                        <div style="font-weight: 600;">${template.title}</div>
                        <div style="font-size: 0.9rem; color: #666;">${template.body}</div>
                    </div>
                </label>
            `;
        }).join('');
    }

    /**
     * Crear checkboxes de quiet hours
     */
    createQuietHoursCheckboxes() {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const quietHours = this.getUserPreferences().quietHours || [];
        
        return days.map((day, index) => {
            const isQuiet = quietHours.includes(index);
            return `
                <label style="display: flex; align-items: center; font-size: 0.9rem;">
                    <input type="checkbox" 
                           value="${index}" 
                           ${isQuiet ? 'checked' : ''}
                           style="margin-right: 0.5rem;">
                    ${day}
                </label>
            `;
        }).join('');
    }

    /**
     * Habilitar notificaciones
     */
    async enableNotifications() {
        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.permissionStatus = 'granted';
                
                // Suscribir si no hay suscripción activa
                if (!this.subscription) {
                    const registration = await navigator.serviceWorker.ready;
                    await this.subscribeToPush(registration);
                }
                
                this.updateUI();
                
                if (this.analytics) {
                    this.analytics.trackCustomEvent('push_notifications_enabled');
                }
            }
        } catch (error) {
            console.error('❌ Error habilitando notificaciones:', error);
        }
    }

    /**
     * Deshabilitar notificaciones
     */
    async disableNotifications() {
        try {
            // Cancelar suscripción
            if (this.subscription) {
                await this.subscription.unsubscribe();
                this.subscription = null;
            }
            
            // Enviar al servidor
            await this.sendUnsubscriptionToServer();
            
            this.permissionStatus = 'denied';
            this.updateUI();
            
            if (this.analytics) {
                this.analytics.trackCustomEvent('push_notifications_disabled');
            }
            
        } catch (error) {
            console.error('❌ Error deshabilitando notificaciones:', error);
        }
    }

    /**
     * Enviar cancelación de suscripción al servidor
     */
    async sendUnsubscriptionToServer() {
        try {
            const response = await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.getCurrentUserId(),
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            console.log('✅ Cancelación de suscripción enviada');
            
        } catch (error) {
            console.error('❌ Error enviando cancelación:', error);
        }
    }

    /**
     * Actualizar estado de permisos
     */
    updatePermissionStatus() {
        this.permissionStatus = Notification.permission;
    }

    /**
     * Actualizar UI según estado
     */
    updateUI() {
        const indicator = document.getElementById(this.config.ui.statusIndicator.replace('#', ''));
        const enableBtn = document.getElementById(this.config.ui.enableButton.replace('#', ''));
        const disableBtn = document.getElementById(this.config.ui.disableButton.replace('#', ''));
        
        if (indicator) {
            const statusText = document.getElementById('push-status-text');
            const icon = indicator.querySelector('i');
            
            if (this.permissionStatus === 'granted') {
                statusText.textContent = 'Notificaciones activadas';
                icon.className = 'fas fa-bell';
                indicator.style.background = 'rgba(16, 185, 129, 0.9)';
            } else if (this.permissionStatus === 'denied') {
                statusText.textContent = 'Notificaciones bloqueadas';
                icon.className = 'fas fa-bell-slash';
                indicator.style.background = 'rgba(239, 68, 68, 0.9)';
            } else {
                statusText.textContent = 'Notificaciones no configuradas';
                icon.className = 'fas fa-bell';
                indicator.style.background = 'rgba(251, 146, 60, 0.9)';
            }
            
            indicator.style.display = 'block';
        }
        
        if (enableBtn && disableBtn) {
            if (this.permissionStatus === 'granted') {
                enableBtn.style.display = 'none';
                disableBtn.style.display = 'block';
            } else {
                enableBtn.style.display = 'block';
                disableBtn.style.display = 'none';
            }
        }
    }

    /**
     * Mostrar configuración
     */
    showSettings() {
        const modal = document.getElementById('push-settings-content');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    /**
     * Obtener preferencias del usuario
     */
    getUserPreferences() {
        const saved = localStorage.getItem('push_preferences');
        return saved ? JSON.parse(saved) : {
            types: Object.keys(this.templates), // Todas activadas por defecto
            quietHours: [22, 23, 0, 1, 2, 3, 4, 5, 6], // 10 PM a 6 AM
            quietHoursEnabled: false
        };
    }

    /**
     * Guardar preferencias del usuario
     */
    saveUserPreferences() {
        const checkboxes = document.querySelectorAll('#notification-preferences input[type="checkbox"]:checked');
        const types = Array.from(checkboxes).map(cb => cb.value);
        
        const quietHoursCheckbox = document.getElementById('quiet-hours-enabled');
        const quietHoursCheckboxes = document.querySelectorAll('#quiet-hours-config input[type="checkbox"]:checked');
        const quietHours = Array.from(quietHoursCheckboxes).map(cb => parseInt(cb.value));
        
        const preferences = {
            types,
            quietHours,
            quietHoursEnabled: quietHoursCheckbox.checked
        };
        
        localStorage.setItem('push_preferences', JSON.stringify(preferences));
        
        // Enviar al servidor
        this.sendPreferencesToServer(preferences);
        
        if (this.analytics) {
            this.analytics.trackCustomEvent('push_preferences_updated', preferences);
        }
    }

    /**
     * Enviar preferencias al servidor
     */
    async sendPreferencesToServer(preferences) {
        try {
            const response = await fetch('/api/push/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.getCurrentUserId(),
                    preferences,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            console.log('✅ Preferencias enviadas al servidor');
            
        } catch (error) {
            console.error('❌ Error enviando preferencias:', error);
        }
    }

    /**
     * Obtener ID del usuario actual
     */
    getCurrentUserId() {
        return window.LaboriaAPI?.usuarioActual?.id || 'anonymous';
    }

    /**
     * Enviar notificación local (para testing)
     */
    sendLocalNotification(title, body, options = {}) {
        if (this.permissionStatus !== 'granted') {
            console.warn('⚠️ Permiso de notificaciones no concedido');
            return;
        }
        
        const notification = new Notification(title, {
            body,
            icon: options.icon || '/assets/favicon.ico',
            badge: options.badge || '/assets/badge.png',
            tag: options.tag,
            requireInteraction: options.requireInteraction || false,
            actions: options.actions || [],
            data: options.data || {}
        });
        
        // Manejar clicks en notificación
        notification.onclick = () => {
            if (options.url) {
                window.open(options.url, '_blank');
            }
            notification.close();
        };
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        return notification;
    }

    /**
     * Enviar notificación de prueba
     */
    async sendTestNotification() {
        try {
            await this.sendPushNotification('new_message', {
                sender: 'Sistema Laboria',
                conversationId: 'test'
            });
            
            if (this.analytics) {
                this.analytics.trackCustomEvent('push_test_notification_sent');
            }
            
        } catch (error) {
            console.error('❌ Error enviando notificación de prueba:', error);
        }
    }

    /**
     * Obtener estadísticas de notificaciones
     */
    getNotificationStats() {
        return {
            isSupported: this.isSupported,
            permissionStatus: this.permissionStatus,
            isSubscribed: !!this.subscription,
            subscription: this.subscription ? {
                endpoint: this.subscription.endpoint,
                keys: this.subscription.toJSON().keys
            } : null,
            templates: Object.keys(this.templates),
            preferences: this.getUserPreferences()
        };
    }

    /**
     * Limpiar sistema
     */
    cleanup() {
        // Cancelar suscripción
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        
        // Limpiar UI
        const elements = [
            this.config.ui.statusIndicator,
            this.config.ui.enableButton,
            this.config.ui.disableButton,
            this.config.ui.settingsModal
        ].map(id => id.replace('#', ''));
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
        
        console.log('🧹 Sistema de notificaciones limpiado');
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

window.LaboriaPushNotifications = new PushNotificationSystem();

console.log('🔔 Sistema de Notificaciones Push inicializado:', {
    features: [
        'Push notification subscription',
        'Template-based notifications',
        'User preferences management',
        'Quiet hours configuration',
        'Segmentation support',
        'Real-time delivery'
    ]
});

// Funciones helper globales
window.sendPushNotification = function(template, data, options) {
    return window.LaboriaPushNotifications.sendPushNotification(template, data, options);
};

window.enablePushNotifications = function() {
    return window.LaboriaPushNotifications.enableNotifications();
};

window.disablePushNotifications = function() {
    return window.LaboriaPushNotifications.disableNotifications();
};

window.showPushSettings = function() {
    return window.LaboriaPushNotifications.showSettings();
};

window.getNotificationStats = function() {
    return window.LaboriaPushNotifications.getNotificationStats();
};
