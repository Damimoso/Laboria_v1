// =============================================
// API CLIENT LABORIA - VERSIÓN LIMPIA PARA PERFIL
// =============================================

class LaboriaAPIClient {
    constructor() {
        this.config = {
            BASE_URL: (typeof window !== 'undefined' && (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1')) 
                ? 'http://localhost:3000/api'
                : 'https://laboria-api.onrender.com/api',
            TIMEOUT: 10000,
            RETRY_ATTEMPTS: 3,
            ENDPOINTS: {
                AUTH: {
                    REGISTER_USER: '/auth/register/usuario',
                    LOGIN_USER: '/auth/login/usuario',
                    LOGIN_ADMIN: '/auth/login/admin',
                    VERIFY: '/auth/verify',
                    CURRENT_USER: '/auth/current-user'
                },
                USER: {
                    UPDATE_PROFILE: '/user/profile',
                    UPDATE_SETTINGS: '/user/settings',
                    UPLOAD_AVATAR: '/user/avatar',
                    GET_STATS: '/user/stats'
                }
            }
        };
        
        this.successMessages = {
            REGISTER_SUCCESS: '¡Usuario registrado exitosamente!',
            LOGIN_SUCCESS: '¡Inicio de sesión exitoso!',
            PROFILE_UPDATED: '¡Perfil actualizado exitosamente!',
            SETTINGS_UPDATED: '¡Configuración actualizada exitosamente!'
        };
        
        this.usuarioActual = null;
        this.tokenJWT = null;
        
        // Inicialización
        this.init();
    }
    
    init() {
        console.log('🔐 Inicializando API Client...');
        this.loadAuthTokens();
        this.setupRequestInterceptors();
    }
    
    loadAuthTokens() {
        try {
            const token = localStorage.getItem('tokenJWT');
            const usuario = localStorage.getItem('usuarioActual');
            
            if (token && usuario) {
                this.tokenJWT = token;
                this.usuarioActual = JSON.parse(usuario);
                console.log('📦 Tokens cargados desde localStorage');
            }
        } catch (error) {
            console.error('❌ Error cargando tokens:', error);
            this.clearAuthTokens();
        }
    }
    
    saveAuthTokens(token, usuario) {
        try {
            this.tokenJWT = token;
            this.usuarioActual = usuario;
            
            localStorage.setItem('tokenJWT', token);
            localStorage.setItem('usuarioActual', JSON.stringify(usuario));
            
            console.log('💾 Tokens guardados en localStorage');
        } catch (error) {
            console.error('❌ Error guardando tokens:', error);
        }
    }
    
    clearAuthTokens() {
        this.tokenJWT = null;
        this.usuarioActual = null;
        
        localStorage.removeItem('tokenJWT');
        localStorage.removeItem('usuarioActual');
        
        console.log('🗑️ Tokens eliminados de localStorage');
    }
    
    isAuthenticated() {
        return !!(this.tokenJWT && this.usuarioActual);
    }
    
    setupRequestInterceptors() {
        // Aquí se pueden agregar interceptores para logging, refresh token, etc.
    }
    
    async makeRequest(url, options = {}) {
        const fullUrl = url.startsWith('http') ? url : `${this.config.BASE_URL}${url}`;
        
        const requestOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (this.tokenJWT) {
            requestOptions.headers['Authorization'] = `Bearer ${this.tokenJWT}`;
        }
        
        console.log(`🌐 ${options.method || 'GET'} ${fullUrl}`);
        
        try {
            const response = await fetch(fullUrl, requestOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Respuesta de ${fullUrl}:`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ Error en ${fullUrl}:`, error);
            throw error;
        }
    }
    
    async request(method, url, data = null, options = {}) {
        const requestOptions = {
            method,
            body: data ? JSON.stringify(data) : null,
            ...options
        };
        
        return this.makeRequest(url, requestOptions);
    }
    
    async get(url, options = {}) {
        return this.request('GET', url, null, options);
    }
    
    async post(url, data, options = {}) {
        return this.request('POST', url, data, options);
    }
    
    async put(url, data, options = {}) {
        return this.request('PUT', url, data, options);
    }
    
    async delete(url, options = {}) {
        return this.request('DELETE', url, null, options);
    }
    
    // =============================================
    // MÉTODOS DE AUTENTICACIÓN
    // =============================================
    
    async registerUsuario(userData) {
        try {
            const response = await this.post(this.config.ENDPOINTS.AUTH.REGISTER_USER, userData);
            
            if (response.success) {
                this.showNotification(this.successMessages.REGISTER_SUCCESS, 'success');
                return response;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }
    
    async loginUsuario(email, password) {
        try {
            const response = await this.post(this.config.ENDPOINTS.AUTH.LOGIN_USER, { email, password });
            
            if (response.success) {
                this.saveAuthTokens(response.data.token, response.data.user);
                this.showNotification(this.successMessages.LOGIN_SUCCESS, 'success');
                return response;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }
    
    async loginAdmin(email, password) {
        try {
            const response = await this.post(this.config.ENDPOINTS.AUTH.LOGIN_ADMIN, { email, password });
            
            if (response.success) {
                this.saveAuthTokens(response.data.token, response.data.user);
                this.showNotification(this.successMessages.LOGIN_SUCCESS, 'success');
                return response;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }
    
    async logout() {
        try {
            console.log('🚪 Cerrando sesión desde API client...');
            
            // Forzar limpieza completa
            this.clearAuthTokens();
            localStorage.clear();
            
            // Mostrar notificación
            this.showNotification('Sesión cerrada correctamente', 'info');
            
            // Forzar redirección al login
            setTimeout(() => {
                window.location.href = '/pages/index.html';
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error en logout:', error);
            // Forzar limpieza y redirección en caso de error
            this.clearAuthTokens();
            localStorage.clear();
            window.location.href = '/pages/index.html';
        }
    }
    
    async verifyToken() {
        try {
            const response = await this.get(this.config.ENDPOINTS.AUTH.VERIFY);
            return response.success ? response.user : null;
        } catch (error) {
            console.error('❌ Error verificando token:', error);
            return null;
        }
    }
    
    async getCurrentUser() {
        try {
            const response = await this.get(this.config.ENDPOINTS.AUTH.CURRENT_USER);
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo usuario actual:', error);
            return { success: false, message: error.message };
        }
    }
    
    // =============================================
    // MÉTODOS DE USUARIO
    // =============================================
    
    async updateProfile(profileData) {
        try {
            const response = await this.put(this.config.ENDPOINTS.USER.UPDATE_PROFILE, profileData);
            
            if (response.success) {
                this.usuarioActual = { ...this.usuarioActual, ...profileData };
                localStorage.setItem('usuarioActual', JSON.stringify(this.usuarioActual));
                this.showNotification(this.successMessages.PROFILE_UPDATED, 'success');
            }
            
            return response;
        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            this.showNotification(error.message, 'error');
            return { success: false, message: error.message };
        }
    }
    
    async updateSettings(settings) {
        try {
            const response = await this.put(this.config.ENDPOINTS.USER.UPDATE_SETTINGS, settings);
            
            if (response.success) {
                this.usuarioActual = { ...this.usuarioActual, ...settings };
                localStorage.setItem('usuarioActual', JSON.stringify(this.usuarioActual));
                this.showNotification(this.successMessages.SETTINGS_UPDATED, 'success');
            }
            
            return response;
        } catch (error) {
            console.error('❌ Error actualizando configuración:', error);
            this.showNotification(error.message, 'error');
            return { success: false, message: error.message };
        }
    }
    
    async uploadAvatar(file) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            
            const response = await fetch(`${this.config.BASE_URL}${this.config.ENDPOINTS.USER.UPLOAD_AVATAR}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.tokenJWT}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Error subiendo avatar');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Error subiendo avatar:', error);
            this.showNotification(error.message, 'error');
            return { success: false, message: error.message };
        }
    }
    
    async getUserStats() {
        try {
            const response = await this.get(this.config.ENDPOINTS.USER.GET_STATS);
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return { success: false, message: error.message };
        }
    }
    
    // =============================================
    // UTILIDADES
    // =============================================
    
    showNotification(message, type = 'info') {
        if (window.LaboriaNotifications) {
            window.LaboriaNotifications.showNotification(message, type);
        } else {
            alert(message);
        }
    }
    
    showLoadingSpinner(element) {
        if (element) {
            element.disabled = true;
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        }
    }
    
    hideLoadingSpinner(element, originalText) {
        if (element) {
            element.disabled = false;
            element.innerHTML = originalText;
        }
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

window.LaboriaAPI = new LaboriaAPIClient();

console.log('🔐 API Client inicializado:', {
    tokenJWT: !!window.LaboriaAPI.tokenJWT,
    usuarioActual: !!window.LaboriaAPI.usuarioActual,
    isAuthenticated: window.LaboriaAPI.isAuthenticated()
});
