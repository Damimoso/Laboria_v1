/**
 * Sistema de Chat y Mensajería en Tiempo Real
 * Proporciona comunicación instantánea con WebSockets, persistencia y enterprise features
 */

class ChatSystem {
    constructor() {
        this.config = this.initializeConfig();
        this.socket = null;
        this.state = {
            isConnected: false,
            currentConversation: null,
            conversations: [],
            messages: [],
            typingUsers: new Set(),
            onlineUsers: new Set()
        };
        this.eventListeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.init();
    }

    /**
     * Inicializar el sistema de chat
     */
    init() {
        console.log('💬 Inicializando Sistema de Chat...');
        
        // Verificar autenticación
        if (!window.LaboriaAPI?.isAuthenticated()) {
            console.warn('⚠️ Usuario no autenticado');
            return;
        }
        
        // Configurar estado inicial
        this.setupInitialState();
        
        // Conectar a WebSocket
        this.connectWebSocket();
        
        // Configurar listeners de eventos
        this.setupEventListeners();
        
        // Configurar sincronización
        this.setupSynchronization();
        
        console.log('✅ Sistema de Chat inicializado');
    }

    /**
     * Inicializar configuración
     */
    initializeConfig() {
        return {
            // Configuración de WebSocket
            websocket: {
                protocol: window.location.protocol === 'https:' ? 'wss:' : 'ws:',
                host: window.location.hostname === 'localhost' 
                    ? 'localhost:3000' 
                    : 'laboria-api.onrender.com',
                path: '/ws/chat',
                heartbeatInterval: 30000,
                reconnectTimeout: 5000
            },
            
            // Configuración de mensajes
            messages: {
                maxMessageLength: 4000,
                maxFileSize: 10 * 1024 * 1024, // 10MB
                allowedFileTypes: [
                    'image/jpeg', 'image/png', 'image/gif',
                    'application/pdf', 'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain', 'text/csv'
                ],
                messageRetention: 90 * 24 * 60 * 60 * 1000, // 90 días
                typingTimeout: 3000
            },
            
            // Configuración de UI
            ui: {
                autoScroll: true,
                showTimestamps: true,
                showReadReceipts: true,
                showTypingIndicators: true,
                soundNotifications: true,
                desktopNotifications: true
            },
            
            // Configuración de sincronización
            sync: {
                enabled: true,
                interval: 30000, // 30 segundos
                batchSize: 50
            }
        };
    }

    /**
     * Configurar estado inicial
     */
    setupInitialState() {
        this.state.userId = window.LaboriaAPI.usuarioActual.id;
        this.state.userName = window.LaboriaAPI.usuarioActual.nombre || 
                               window.LaboriaAPI.usuarioActual.username;
        this.state.userAvatar = window.LaboriaAPI.usuarioActual.avatar || 
                                 this.state.userName.charAt(0).toUpperCase();
    }

    /**
     * Conectar a WebSocket
     */
    connectWebSocket() {
        try {
            const wsUrl = this.getWebSocketUrl();
            console.log('🔌 Conectando a WebSocket:', wsUrl);
            
            this.socket = new WebSocket(wsUrl);
            
            // Configurar handlers del WebSocket
            this.setupWebSocketHandlers();
            
            // Iniciar heartbeat
            this.startHeartbeat();
            
        } catch (error) {
            console.error('❌ Error conectando a WebSocket:', error);
            this.handleConnectionError(error);
        }
    }

    /**
     * Obtener URL de WebSocket
     */
    getWebSocketUrl() {
        const { protocol, host, path } = this.config.websocket;
        return `${protocol}//${host}${path}/${this.state.userId}`;
    }

    /**
     * Configurar handlers de WebSocket
     */
    setupWebSocketHandlers() {
        this.socket.onopen = () => {
            console.log('🔌 Conectado a WebSocket');
            this.state.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Enviar mensaje de presencia
            this.sendPresenceMessage('online');
            
            // Sincronizar estado
            this.synchronizeState();
            
            // Disparar evento de conexión
            this.emit('connected');
        };
        
        this.socket.onmessage = (event) => {
            this.handleWebSocketMessage(event);
        };
        
        this.socket.onclose = (event) => {
            console.log('🔌 WebSocket cerrado:', event.code, event.reason);
            this.state.isConnected = false;
            
            // Disparar evento de desconexión
            this.emit('disconnected', { code: event.code, reason: event.reason });
            
            // Intentar reconectar
            this.attemptReconnect();
        };
        
        this.socket.onerror = (error) => {
            console.error('❌ Error en WebSocket:', error);
            this.state.isConnected = false;
            this.handleConnectionError(error);
        };
    }

    /**
     * Manejar mensajes de WebSocket
     */
    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'message':
                    this.handleNewMessage(data.message);
                    break;
                    
                case 'typing':
                    this.handleTypingIndicator(data);
                    break;
                    
                case 'presence':
                    this.handlePresenceUpdate(data);
                    break;
                    
                case 'conversation_update':
                    this.handleConversationUpdate(data);
                    break;
                    
                case 'user_status':
                    this.handleUserStatusChange(data);
                    break;
                    
                case 'heartbeat':
                    // Responder al heartbeat
                    this.sendHeartbeatResponse();
                    break;
                    
                case 'error':
                    this.handleChatError(data);
                    break;
                    
                default:
                    console.log('💬 Mensaje no manejado:', data);
            }
        } catch (error) {
            console.error('❌ Error procesando mensaje WebSocket:', error);
        }
    }

    /**
     * Manejar nuevo mensaje
     */
    handleNewMessage(message) {
        // Agregar a la lista de mensajes
        this.state.messages.push(message);
        
        // Actualizar conversación
        this.updateConversationWithMessage(message);
        
        // Disparar evento
        this.emit('newMessage', message);
        
        // Notificar si no está activa la conversación
        if (this.state.currentConversation?.id !== message.conversationId) {
            this.notifyNewMessage(message);
        }
        
        // Marcar como leído si está activa
        if (this.state.currentConversation?.id === message.conversationId && 
            document.visibilityState === 'visible') {
            this.markMessageAsRead(message.id);
        }
        
        // Actualizar UI
        this.updateMessagesUI();
    }

    /**
     * Manejar indicador de escritura
     */
    handleTypingIndicator(data) {
        if (data.conversationId === this.state.currentConversation?.id) {
            if (data.isTyping) {
                this.state.typingUsers.add(data.userId);
            } else {
                this.state.typingUsers.delete(data.userId);
            }
            
            // Disparar evento
            this.emit('typingChange', {
                conversationId: data.conversationId,
                typingUsers: Array.from(this.state.typingUsers)
            });
            
            // Actualizar UI
            this.updateTypingIndicator();
        }
    }

    /**
     * Manejar actualización de presencia
     */
    handlePresenceUpdate(data) {
        if (data.status === 'online') {
            this.state.onlineUsers.add(data.userId);
        } else {
            this.state.onlineUsers.delete(data.userId);
        }
        
        // Disparar evento
        this.emit('presenceChange', {
            userId: data.userId,
            status: data.status
        });
        
        // Actualizar UI
        this.updateOnlineStatus();
    }

    /**
     * Manejar actualización de conversación
     */
    handleConversationUpdate(data) {
        const conversation = this.state.conversations.find(c => c.id === data.conversationId);
        if (conversation) {
            Object.assign(conversation, data);
            
            // Disparar evento
            this.emit('conversationUpdate', conversation);
            
            // Actualizar UI
            this.updateConversationsList();
        }
    }

    /**
     * Manejar cambio de estado de usuario
     */
    handleUserStatusChange(data) {
        // Disparar evento
        this.emit('userStatusChange', data);
        
        // Actualizar UI
        this.updateUserStatus(data.userId, data.status);
    }

    /**
     * Manejar error de chat
     */
    handleChatError(data) {
        console.error('❌ Error de chat:', data);
        
        // Disparar evento
        this.emit('error', data);
        
        // Mostrar notificación
        if (window.LaboriaNotifications) {
            window.LaboriaNotifications.showNotification(
                data.message || 'Error en el chat',
                'error'
            );
        }
    }

    /**
     * Enviar mensaje
     */
    async sendMessage(content, options = {}) {
        if (!this.state.isConnected) {
            throw new Error('No conectado al servidor de chat');
        }
        
        if (!this.state.currentConversation) {
            throw new Error('No hay conversación activa');
        }
        
        // Validar contenido
        if (!content || content.trim().length === 0) {
            throw new Error('El mensaje no puede estar vacío');
        }
        
        if (content.length > this.config.messages.maxMessageLength) {
            throw new Error(`El mensaje no puede exceder ${this.config.messages.maxMessageLength} caracteres`);
        }
        
        const message = {
            id: this.generateMessageId(),
            conversationId: this.state.currentConversation.id,
            senderId: this.state.userId,
            content: content.trim(),
            timestamp: Date.now(),
            status: 'sending',
            attachments: options.attachments || [],
            replyTo: options.replyTo || null,
            priority: options.priority || 'normal'
        };
        
        try {
            // Enviar a través de WebSocket
            this.socket.send(JSON.stringify({
                type: 'message',
                message: message
            }));
            
            // Agregar a la lista localmente
            this.state.messages.push(message);
            
            // Disparar evento
            this.emit('messageSent', message);
            
            // Actualizar UI
            this.updateMessagesUI();
            
            return message;
            
        } catch (error) {
            console.error('❌ Error enviando mensaje:', error);
            message.status = 'error';
            this.emit('messageError', { message, error });
            throw error;
        }
    }

    /**
     * Enviar indicador de escritura
     */
    sendTypingIndicator(isTyping) {
        if (!this.state.isConnected || !this.state.currentConversation) {
            return;
        }
        
        this.socket.send(JSON.stringify({
            type: 'typing',
            conversationId: this.state.currentConversation.id,
            userId: this.state.userId,
            isTyping: isTyping
        }));
    }

    /**
     * Enviar mensaje de presencia
     */
    sendPresenceMessage(status) {
        if (!this.state.isConnected) {
            return;
        }
        
        this.socket.send(JSON.stringify({
            type: 'presence',
            userId: this.state.userId,
            status: status,
            timestamp: Date.now()
        }));
    }

    /**
     * Enviar heartbeat
     */
    sendHeartbeat() {
        if (this.state.isConnected && this.socket) {
            this.socket.send(JSON.stringify({
                type: 'heartbeat',
                timestamp: Date.now()
            }));
        }
    }

    /**
     * Enviar respuesta de heartbeat
     */
    sendHeartbeatResponse() {
        if (this.state.isConnected && this.socket) {
            this.socket.send(JSON.stringify({
                type: 'heartbeat_response',
                timestamp: Date.now()
            }));
        }
    }

    /**
     * Iniciar heartbeat
     */
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, this.config.websocket.heartbeatInterval);
    }

    /**
     * Detener heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Intentar reconexión
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Máximo de intentos de reconexión alcanzado');
            this.emit('reconnectFailed');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`🔄 Intentando reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts} en ${delay}ms`);
        
        setTimeout(() => {
            this.connectWebSocket();
        }, delay);
    }

    /**
     * Manejar error de conexión
     */
    handleConnectionError(error) {
        this.emit('connectionError', error);
        
        // Mostrar notificación
        if (window.LaboriaNotifications) {
            window.LaboriaNotifications.showNotification(
                'Error de conexión: ' + error.message,
                'error'
            );
        }
    }

    /**
     * Sincronizar estado
     */
    async synchronizeState() {
        if (!this.config.sync.enabled) {
            return;
        }
        
        try {
            // Cargar conversaciones
            await this.loadConversations();
            
            // Cargar mensajes de conversación activa
            if (this.state.currentConversation) {
                await this.loadConversationMessages(this.state.currentConversation.id);
            }
            
            // Cargar usuarios en línea
            await this.loadOnlineUsers();
            
        } catch (error) {
            console.error('❌ Error sincronizando estado:', error);
        }
    }

    /**
     * Cargar conversaciones
     */
    async loadConversations() {
        try {
            const response = await fetch(`/api/chat/conversations/${this.state.userId}`);
            const data = await response.json();
            
            if (data.success) {
                this.state.conversations = data.conversations;
                this.emit('conversationsLoaded', this.state.conversations);
                this.updateConversationsList();
            }
        } catch (error) {
            console.error('❌ Error cargando conversaciones:', error);
        }
    }

    /**
     * Cargar mensajes de conversación
     */
    async loadConversationMessages(conversationId) {
        try {
            const response = await fetch(`/api/chat/messages/${conversationId}`);
            const data = await response.json();
            
            if (data.success) {
                this.state.messages = data.messages;
                this.emit('messagesLoaded', this.state.messages);
                this.updateMessagesUI();
            }
        } catch (error) {
            console.error('❌ Error cargando mensajes:', error);
        }
    }

    /**
     * Cargar usuarios en línea
     */
    async loadOnlineUsers() {
        try {
            const response = await fetch('/api/chat/online-users');
            const data = await response.json();
            
            if (data.success) {
                this.state.onlineUsers = new Set(data.users);
                this.emit('onlineUsersLoaded', Array.from(this.state.onlineUsers));
                this.updateOnlineStatus();
            }
        } catch (error) {
            console.error('❌ Error cargando usuarios en línea:', error);
        }
    }

    /**
     * Crear nueva conversación
     */
    async createConversation(participantId, initialMessage = null) {
        try {
            const response = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    participantId: participantId,
                    initialMessage: initialMessage,
                    creatorId: this.state.userId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const conversation = data.conversation;
                this.state.conversations.unshift(conversation);
                this.state.currentConversation = conversation;
                
                this.emit('conversationCreated', conversation);
                this.updateConversationsList();
                this.selectConversation(conversation);
                
                return conversation;
            } else {
                throw new Error(data.message || 'Error creando conversación');
            }
        } catch (error) {
            console.error('❌ Error creando conversación:', error);
            throw error;
        }
    }

    /**
     * Seleccionar conversación
     */
    async selectConversation(conversation) {
        try {
            // Actualizar estado
            this.state.currentConversation = conversation;
            
            // Cargar mensajes
            await this.loadConversationMessages(conversation.id);
            
            // Marcar como leída
            await this.markConversationAsRead(conversation.id);
            
            // Disparar evento
            this.emit('conversationSelected', conversation);
            
            // Actualizar UI
            this.updateConversationUI();
            
        } catch (error) {
            console.error('❌ Error seleccionando conversación:', error);
        }
    }

    /**
     * Marcar mensaje como leído
     */
    async markMessageAsRead(messageId) {
        try {
            const response = await fetch('/api/chat/read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messageId: messageId,
                    userId: this.state.userId
                })
            });
            
            if (response.ok) {
                // Actualizar estado local
                const message = this.state.messages.find(m => m.id === messageId);
                if (message) {
                    message.status = 'read';
                    this.emit('messageRead', message);
                    this.updateMessageStatus(messageId, 'read');
                }
            }
        } catch (error) {
            console.error('❌ Error marcando mensaje como leído:', error);
        }
    }

    /**
     * Marcar conversación como leída
     */
    async markConversationAsRead(conversationId) {
        try {
            const response = await fetch('/api/chat/conversation/read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversationId: conversationId,
                    userId: this.state.userId
                })
            });
            
            if (response.ok) {
                // Actualizar estado local
                const conversation = this.state.conversations.find(c => c.id === conversationId);
                if (conversation) {
                    conversation.unreadCount = 0;
                    this.emit('conversationRead', conversation);
                    this.updateConversationsList();
                }
            }
        } catch (error) {
            console.error('❌ Error marcando conversación como leída:', error);
        }
    }

    /**
     * Actualizar conversación con mensaje
     */
    updateConversationWithMessage(message) {
        const conversation = this.state.conversations.find(c => c.id === message.conversationId);
        if (conversation) {
            conversation.lastMessage = message.content;
            conversation.lastMessageTime = message.timestamp;
            conversation.lastMessageSender = message.senderId === this.state.userId ? 'Tú' : message.senderName;
            
            if (message.senderId !== this.state.userId && 
                this.state.currentConversation?.id !== message.conversationId) {
                conversation.unreadCount = (conversation.unreadCount || 0) + 1;
            }
            
            this.updateConversationsList();
        }
    }

    /**
     * Configurar listeners de eventos
     */
    setupEventListeners() {
        // Listener de visibilidad
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Marcar mensajes como leídos al volver
                if (this.state.currentConversation) {
                    this.markConversationAsRead(this.state.currentConversation.id);
                }
            }
        });
        
        // Listener de beforeunload
        window.addEventListener('beforeunload', () => {
            // Enviar presencia offline
            this.sendPresenceMessage('offline');
            
            // Detener heartbeat
            this.stopHeartbeat();
        });
        
        // Listener de foco en input
        document.addEventListener('DOMContentLoaded', () => {
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.addEventListener('focus', () => {
                    this.sendTypingIndicator(true);
                });
                
                messageInput.addEventListener('blur', () => {
                    this.sendTypingIndicator(false);
                });
            }
        });
    }

    /**
     * Configurar sincronización
     */
    setupSynchronization() {
        if (!this.config.sync.enabled) {
            return;
        }
        
        // Sincronización periódica
        setInterval(() => {
            if (this.state.isConnected) {
                this.synchronizeState();
            }
        }, this.config.sync.interval);
    }

    /**
     * Notificar nuevo mensaje
     */
    notifyNewMessage(message) {
        // Notificación push
        if (window.LaboriaPushNotifications) {
            window.LaboriaPushNotifications.sendPushNotification('new_message', {
                sender: message.senderName || 'Usuario',
                conversationId: message.conversationId
            });
        }
        
        // Notificación local
        if (this.config.ui.desktopNotifications && Notification.permission === 'granted') {
            const notification = new Notification('Nuevo mensaje de ' + (message.senderName || 'Laboria'), {
                body: message.content,
                icon: '/assets/icons/message-icon.png',
                badge: '/assets/badge.png',
                tag: `chat_${message.conversationId}`
            });
            
            notification.onclick = () => {
                window.focus();
                this.selectConversation({ id: message.conversationId });
                notification.close();
            };
            
            setTimeout(() => notification.close(), 5000);
        }
    }

    /**
     * Actualizar UI
     */
    updateConversationsList() {
        this.emit('updateConversationsList', this.state.conversations);
    }
    
    updateMessagesUI() {
        this.emit('updateMessages', this.state.messages);
    }
    
    updateTypingIndicator() {
        this.emit('updateTypingIndicator', Array.from(this.state.typingUsers));
    }
    
    updateOnlineStatus() {
        this.emit('updateOnlineStatus', Array.from(this.state.onlineUsers));
    }
    
    updateConversationUI() {
        this.emit('updateConversationUI', this.state.currentConversation);
    }
    
    updateMessageStatus(messageId, status) {
        this.emit('updateMessageStatus', { messageId, status });
    }

    /**
     * Sistema de eventos
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('❌ Error en listener de evento:', error);
                }
            });
        }
    }

    /**
     * Utilidades
     */
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateConversationId() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Si es hoy, mostrar hora
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        // Si es esta semana, mostrar día y hora
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            return date.toLocaleDateString('es-ES', { 
                weekday: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        // Si es más antiguo, mostrar fecha completa
        return date.toLocaleDateString('es-ES');
    }
    
    sanitizeMessage(content) {
        // Remover HTML peligroso
        return content
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
    }
    
    validateFileType(file) {
        return this.config.messages.allowedFileTypes.includes(file.type);
    }
    
    validateFileSize(file) {
        return file.size <= this.config.messages.maxFileSize;
    }
    
    /**
     * Obtener estado actual
     */
    getState() {
        return {
            ...this.state,
            isConnected: this.state.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            config: this.config
        };
    }
    
    /**
     * Obtener estadísticas
     */
    getStats() {
        return {
            totalConversations: this.state.conversations.length,
            totalMessages: this.state.messages.length,
            unreadMessages: this.state.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0),
            onlineUsers: this.state.onlineUsers.size,
            activeTyping: this.state.typingUsers.size,
            connectionStatus: this.state.isConnected ? 'connected' : 'disconnected',
            uptime: this.state.isConnected ? Date.now() - (this.connectionTime || Date.now()) : 0
        };
    }
    
    /**
     * Limpiar sistema
     */
    cleanup() {
        // Detener heartbeat
        this.stopHeartbeat();
        
        // Cerrar WebSocket
        if (this.socket) {
            this.socket.close();
        }
        
        // Limpiar listeners
        this.eventListeners.clear();
        
        // Limpiar estado
        this.state = {
            isConnected: false,
            currentConversation: null,
            conversations: [],
            messages: [],
            typingUsers: new Set(),
            onlineUsers: new Set()
        };
        
        console.log('🧹 Sistema de chat limpiado');
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

window.LaboriaChat = new ChatSystem();

console.log('💬 Sistema de Chat y Mensajería inicializado:', {
    features: [
        'Real-time WebSocket communication',
        'Message persistence and synchronization',
        'Typing indicators and presence',
        'File attachments support',
        'Read receipts and delivery status',
        'Conversation management',
        'Offline fallback and reconnection'
    ]
});

// Funciones helper globales
window.sendMessage = function(content, options) {
    return window.LaboriaChat.sendMessage(content, options);
};

window.createConversation = function(participantId, initialMessage) {
    return window.LaboriaChat.createConversation(participantId, initialMessage);
};

window.selectConversation = function(conversation) {
    return window.LaboriaChat.selectConversation(conversation);
};

window.getChatStats = function() {
    return window.LaboriaChat.getStats();
};
