// =============================================
// API CLIENTE LABORIA - USANDO CONSTANTES UNIFICADAS
// =============================================

class LaboriaAPIClient {
    constructor() {
        // Cargar constantes
        if (typeof window.LaboriaConstants === 'undefined') {
            console.error('❌ Constants no cargadas. Asegúrate de incluir shared/constants.js');
            // Usar configuración por defecto si constants no está disponible
            this.config = {
                BASE_URL: 'http://localhost:5500/api',
                TIMEOUT: 10000,
                RETRY_ATTEMPTS: 3,
                ENDPOINTS: {
                    AUTH: {
                        LOGIN_USER: '/auth/login/usuario',
                        LOGIN_ADMIN: '/auth/login/admin',
                        REGISTER_USER: '/auth/register/usuario',
                        LOGOUT: '/auth/logout',
                        VERIFY: '/auth/verify'
                    },
                    USERS: {
                        PROFILE: '/users/profile',
                        UPDATE_PROFILE: '/users/profile',
                        UPLOAD_AVATAR: '/users/upload-avatar'
                    },
                    JOBS: {
                        LIST: '/jobs',
                        DETAIL: '/jobs/:id',
                        CREATE: '/jobs',
                        UPDATE: '/jobs/:id',
                        DELETE: '/jobs/:id',
                        SEARCH: '/jobs/search',
                        APPLY: '/jobs/:id/apply',
                        MY_APPLICATIONS: '/jobs/my/applications'
                    },
                    COURSES: {
                        LIST: '/courses',
                        DETAIL: '/courses/:id',
                        CREATE: '/courses',
                        UPDATE: '/courses/:id',
                        DELETE: '/courses/:id',
                        ENROLL: '/courses/:id/enroll',
                        MY_COURSES: '/courses/my/enrolled',
                        PROGRESS: '/courses/:id/progress',
                        RATE: '/courses/:id/rate'
                    }
                }
            };
            this.errorMessages = {
                NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
                INVALID_CREDENTIALS: 'Credenciales inválidas',
                USER_NOT_FOUND: 'Usuario no encontrado',
                EMAIL_ALREADY_EXISTS: 'El email ya está registrado',
                USERNAME_ALREADY_EXISTS: 'El nombre de usuario ya está en uso',
                INVALID_EMAIL: 'Email inválido',
                INVALID_PASSWORD: 'Contraseña inválida',
                PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
                REQUIRED_FIELD: 'Este campo es obligatorio',
                SERVER_ERROR: 'Error interno del servidor'
            };
            this.successMessages = {
                LOGIN_SUCCESS: 'Inicio de sesión exitoso',
                REGISTER_SUCCESS: 'Registro exitoso',
                PROFILE_UPDATED: 'Perfil actualizado correctamente'
            };
            this.uiConfig = {
                TOAST_DURATION: 5000
            };
        } else {
            const { API_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES, UI_CONFIG } = window.LaboriaConstants;
            this.config = API_CONFIG;
            this.errorMessages = ERROR_MESSAGES;
            this.successMessages = SUCCESS_MESSAGES;
            this.uiConfig = UI_CONFIG;
        }
        
        // Cargar tokens desde localStorage si existen
        this.loadTokensFromStorage();
        
        // Estado del cliente
        this.tokenSesion = null;
        this.tokenJWT = null;
        this.usuarioActual = null;
        this.requestQueue = new Map();
        this.cache = new Map();
        
        // Configurar interceptores
        this.setupInterceptors();
    }

    // =============================================
    // CONFIGURACIÓN DE HEADERS
    // =============================================

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        if (this.tokenJWT) {
            headers['Authorization'] = `Bearer ${this.tokenJWT}`;
        }

        if (this.tokenSesion) {
            headers['x-session-token'] = this.tokenSesion;
        }

        return headers;
    }

    // =============================================
    // MÉTODOS HTTP GENERALES
    // =============================================

    async request(endpoint, options = {}) {
        try {
            // Verificar cache para GET requests
            if (options.method === 'GET' || !options.method) {
                const cached = this.getCachedData(endpoint);
                if (cached) {
                    return cached;
                }
            }

            const url = `${this.config.BASE_URL}${endpoint}`;
            const config = {
                headers: this.getHeaders(),
                timeout: this.config.TIMEOUT,
                ...options
            };

            // Agregar timestamp para evitar cache
            if (config.method === 'GET' || !config.method) {
                const separator = endpoint.includes('?') ? '&' : '?';
                config.url = `${url}${separator}_t=${Date.now()}`;
            } else {
                config.url = url;
            }

            // Manejo de request en cola
            const requestKey = `${config.method || 'GET'}-${endpoint}`;
            if (this.requestQueue.has(requestKey)) {
                return this.requestQueue.get(requestKey);
            }

            // Crear promesa y agregar a la cola
            const requestPromise = this.makeRequest(config);
            this.requestQueue.set(requestKey, requestPromise);

            try {
                const response = await requestPromise;
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || this.errorMessages.NETWORK_ERROR);
                }

                // Cache para GET requests exitosos
                if (config.method === 'GET' || !config.method) {
                    this.setCachedData(endpoint, data);
                }

                return data;
            } catch (error) {
                console.error('❌ Error en request:', error);
                throw this.handleError(error);
            } finally {
                // Remover de la cola
                this.requestQueue.delete(requestKey);
            }
        } catch (error) {
            console.error('❌ Error en request:', error);
            throw this.handleError(error);
        }
    }

    async makeRequest(config) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.TIMEOUT);

        try {
            const response = await fetch(config.url, {
                ...config,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Timeout de la petición');
            }
            throw error;
        }
    }

    // =============================================
    // MÉTODOS HTTP CONVENIENTES
    // =============================================

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // =============================================
    // MÉTODOS DE AUTENTICACIÓN
    // =============================================

    async loginUsuario(email, password) {
        try {
            // Mostrar loading
            this.showLoading();
            
            const response = await this.post(this.config.ENDPOINTS.AUTH.LOGIN_USER, {
                email,
                password
            });

            if (response.success) {
                // Guardar tokens y usuario
                console.log('📦 LoginUsuario - Guardando tokens y usuario:', response.data);
                this.setAuthTokens(response.data.token, response.data.user);
                console.log('✅ LoginUsuario - Tokens guardados. Usuario actual:', this.usuarioActual);
                this.showNotification(this.successMessages.LOGIN_SUCCESS, 'success');
                return response;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async loginAdministrador(email, password) {
        try {
            // Mostrar loading
            this.showLoading();
            
            const response = await this.post(this.config.ENDPOINTS.AUTH.LOGIN_ADMIN, {
                email,
                password
            });

            if (response.success) {
                // Guardar tokens y usuario
                console.log('📦 LoginAdministrador - Guardando tokens y usuario:', response.data);
                this.setAuthTokens(response.data.token, response.data.user);
                console.log('✅ LoginAdministrador - Tokens guardados. Usuario actual:', this.usuarioActual);
                this.showNotification(this.successMessages.LOGIN_SUCCESS, 'success');
                return response;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Métodos de loading
    showLoading() {
        const buttons = document.querySelectorAll('button[type="submit"], .btn-primary');
        buttons.forEach(button => {
            button.classList.add('loading');
            button.disabled = true;
            
            // Agregar spinner si no existe
            if (!button.querySelector('.spinner')) {
                const spinner = document.createElement('span');
                spinner.className = 'spinner';
                button.insertBefore(spinner, button.firstChild);
            }
        });
    }

    hideLoading() {
        const buttons = document.querySelectorAll('button.loading');
        buttons.forEach(button => {
            button.classList.remove('loading');
            button.disabled = false;
            
            // Remover spinner
            const spinner = button.querySelector('.spinner');
            if (spinner) {
                spinner.remove();
            }
        });
    }

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
                window.location.href = '../pages/index.html';
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error en logout:', error);
            // Forzar limpieza y redirección en caso de error
            this.clearAuthTokens();
            localStorage.clear();
            window.location.href = '../pages/index.html';
        }
    }

    async verifyToken() {
        try {
            const response = await this.get(this.config.ENDPOINTS.AUTH.VERIFY);
            return response.success ? response.user : null;
        } catch (error) {
            this.clearAuthTokens();
            return null;
        }
    }

    // =============================================
    // MÉTODOS DE USUARIO
    // =============================================

    async getProfile() {
        return this.get(this.config.ENDPOINTS.USERS.PROFILE);
    }

    async updateProfile(profileData) {
        try {
            const response = await this.put(this.config.ENDPOINTS.USERS.UPDATE_PROFILE, profileData);
            if (response.success) {
                this.showNotification(this.successMessages.PROFILE_UPDATED, 'success');
                // Actualizar datos del usuario actual
                if (this.usuarioActual) {
                    this.usuarioActual = { ...this.usuarioActual, ...profileData };
                    localStorage.setItem('usuarioActual', JSON.stringify(this.usuarioActual));
                }
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch(`${this.config.BASE_URL}${this.config.ENDPOINTS.USERS.UPLOAD_AVATAR}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.tokenJWT}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                this.showNotification(this.successMessages.FILE_UPLOADED, 'success');
                // Actualizar foto en el usuario actual
                if (this.usuarioActual) {
                    this.usuarioActual.foto_perfil = data.data.avatarUrl;
                    localStorage.setItem('usuarioActual', JSON.stringify(this.usuarioActual));
                }
            }
            return data;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async getPublicProfile(userId) {
        return this.get(`/users/${userId}`);
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.put('/users/change-password', {
                currentPassword,
                newPassword
            });
            if (response.success) {
                this.showNotification(this.successMessages.PASSWORD_CHANGED, 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async deleteAccount(password) {
        try {
            const response = await this.delete('/users/account', {
                password
            });
            if (response.success) {
                this.showNotification('Cuenta eliminada exitosamente', 'success');
                this.clearAuthTokens();
                setTimeout(() => {
                    window.location.href = '/pages/index.html';
                }, 2000);
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async getUserStats() {
        return this.get('/users/stats');
    }

    // =============================================
    // MÉTODOS DE EMPLEOS
    // =============================================

    async getJobs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/jobs?${queryString}` : '/jobs';
        return this.get(url);
    }

    async getJobDetails(jobId) {
        return this.get(`/jobs/${jobId}`);
    }

    async createJob(jobData) {
        try {
            const response = await this.post('/jobs', jobData);
            if (response.success) {
                this.showNotification('Empleo creado exitosamente', 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async updateJob(jobId, jobData) {
        try {
            const response = await this.put(`/jobs/${jobId}`, jobData);
            if (response.success) {
                this.showNotification('Empleo actualizado exitosamente', 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async deleteJob(jobId) {
        try {
            const response = await this.delete(`/jobs/${jobId}`);
            if (response.success) {
                this.showNotification('Empleo eliminado exitosamente', 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async applyToJob(jobId, applicationData) {
        try {
            const response = await this.post(`/jobs/${jobId}/apply`, applicationData);
            if (response.success) {
                this.showNotification('Postulación realizada exitosamente', 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async getJobApplications(jobId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/jobs/${jobId}/applications?${queryString}` : `/jobs/${jobId}/applications`;
        return this.get(url);
    }

    async updateApplicationStatus(jobId, applicationId, status) {
        try {
            const response = await this.put(`/jobs/${jobId}/applications/${applicationId}`, { status });
            if (response.success) {
                this.showNotification('Estado de postulación actualizado', 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async getMyApplications(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/jobs/my/applications?${queryString}` : '/jobs/my/applications';
        return this.get(url);
    }

    async getMyPublishedJobs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/jobs/my/published?${queryString}` : '/jobs/my/published';
        return this.get(url);
    }

    // =============================================
    // MÉTODOS DE CURSOS
    // =============================================

    async getCourses(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/courses?${queryString}` : '/courses';
        return this.get(url);
    }

    async getCourseDetails(courseId) {
        return this.get(`/courses/${courseId}`);
    }

    async createCourse(courseData) {
        try {
            const response = await this.post('/courses', courseData);
            if (response.success) {
                this.showNotification('Curso creado exitosamente', 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async updateCourse(courseId, courseData) {
        try {
            const response = await this.put(`/courses/${courseId}`, courseData);
            if (response.success) {
                this.showNotification('Curso actualizado exitosamente', 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async deleteCourse(courseId) {
        try {
            const response = await this.delete(`/courses/${courseId}`);
            if (response.success) {
                this.showNotification('Curso eliminado exitosamente', 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async enrollInCourse(courseId) {
        try {
            const response = await this.post(`/courses/${courseId}/enroll`);
            if (response.success) {
                this.showNotification('Inscripción realizada exitosamente', 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async updateCourseProgress(courseId, progress) {
        try {
            const response = await this.put(`/courses/${courseId}/progress`, { progreso: progress });
            if (response.success && response.data.completed) {
                this.showNotification('¡Felicidades! Curso completado', 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async rateCourse(courseId, rating, comment = '') {
        try {
            const response = await this.post(`/courses/${courseId}/rate`, {
                calificacion: rating,
                comentario: comment
            });
            if (response.success) {
                this.showNotification('Reseña creada exitosamente', 'success');
            }
            return response;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async getMyEnrolledCourses(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/courses/my/enrolled?${queryString}` : '/courses/my/enrolled';
        return this.get(url);
    }

    async getMyCreatedCourses(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/courses/my/created?${queryString}` : '/courses/my/created';
        return this.get(url);
    }

    // =============================================
    // UTILIDADES
    // =============================================

    loadTokensFromStorage() {
        try {
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');
            
            if (token && userData) {
                this.tokenJWT = token;
                this.usuarioActual = JSON.parse(userData);
                console.log('📦 Tokens cargados desde localStorage');
            }
        } catch (error) {
            console.error('❌ Error cargando tokens desde localStorage:', error);
            this.clearAuthTokens();
        }
    }

    setAuthTokens(token, user) {
        console.log('🔐 setAuthTokens llamado con:', { token, user });
        this.tokenJWT = token;
        this.usuarioActual = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        console.log('✅ Tokens guardados en localStorage y variables del cliente');
        console.log('📊 Estado después de guardar:', {
            tokenJWT: this.tokenJWT,
            usuarioActual: this.usuarioActual,
            localStorageToken: localStorage.getItem('authToken'),
            localStorageUser: localStorage.getItem('userData')
        });
    }

    clearAuthTokens() {
        console.log('🧹 Limpiando tokens de autenticación...');
        
        // Limpiar variables del cliente
        this.tokenJWT = null;
        this.usuarioActual = null;
        this.tokenSesion = null;
        
        // Limpiar localStorage completamente
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('tokenSesion');
        localStorage.removeItem('tokenJWT');
        
        console.log('✅ Tokens limpiados correctamente');
    }

    isAuthenticated() {
        return !!this.tokenJWT && !!this.usuarioActual;
    }

    isAdmin() {
        return this.usuarioActual?.rol === 'admin_master' || this.usuarioActual?.rol === 'admin_invitado';
    }

    isUser() {
        return this.usuarioActual?.rol === 'user';
    }

    getPaginaRedireccion() {
        if (!this.usuarioActual) {
            console.log('❌ No hay usuario actual, redirigiendo al login');
            return '../pages/index.html';
        }
        
        console.log('🔍 Redirigiendo según rol:', this.usuarioActual.rol);
        
        switch (this.usuarioActual.rol) {
            case 'admin_master':
                console.log('👑 Redirigiendo a Admin Master');
                return '../pages/admin-master/InicioAdmin.html';
            case 'admin_invitado':
                console.log('👤 Redirigiendo a Admin Invitado');
                return '../pages/admin-invitado/Inicio-Invi-Admin.html';
            case 'user':
                console.log('👤 Redirigiendo a Perfil de Usuario');
                return '../usuario/perfil.html';
            default:
                console.log('❌ Rol no reconocido, redirigiendo al login');
                return '../pages/index.html';
        }
    }

    // =============================================
    // MÉTODOS DE FILE UPLOAD
    // =============================================

    async uploadFile(file, type = 'avatar') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            
            const response = await this.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return response;
        } catch (error) {
            this.handleError(error, 'Error subiendo archivo');
            throw error;
        }
    }

    // =============================================
    // MÉTODOS DE DASHBOARD
    // =============================================

    async getDashboardStats() {
        try {
            const response = await this.get('/api/dashboard/stats');
            return response;
        } catch (error) {
            this.handleError(error, 'Error obteniendo estadísticas del dashboard');
            throw error;
        }
    }

    async getDashboardActivity() {
        try {
            const response = await this.get('/api/dashboard/activity');
            return response;
        } catch (error) {
            this.handleError(error, 'Error obteniendo actividad del dashboard');
            throw error;
        }
    }

    getCachedData(endpoint) {
        const cached = this.cache.get(endpoint);
        if (cached && Date.now() - cached.timestamp < this.uiConfig.CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }

    setCachedData(endpoint, data) {
        this.cache.set(endpoint, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    // =============================================
    // MANEJO DE ERRORES
    // =============================================

    handleError(error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            this.clearAuthTokens();
            this.showNotification(this.errorMessages.SESSION_EXPIRED, 'warning');
            setTimeout(() => {
                window.location.href = '../pages/index.html';
            }, 2000);
        } else if (error.message.includes('403')) {
            this.showNotification(this.errorMessages.ACCESS_DENIED, 'error');
        } else if (error.message.includes('404')) {
            this.showNotification(this.errorMessages.NOT_FOUND, 'error');
        } else if (error.message.includes('500')) {
            this.showNotification(this.errorMessages.SERVER_ERROR, 'error');
        } else {
            this.showNotification(error.message || this.errorMessages.NETWORK_ERROR, 'error');
        }
        return error;
    }

    // =============================================
    // INTERCEPTORES
    // =============================================

    setupInterceptors() {
        // Interceptor para mostrar loading
        this.showLoading = () => {
            const loader = document.getElementById('globalLoader');
            if (loader) loader.style.display = 'flex';
        };

        this.hideLoading = () => {
            const loader = document.getElementById('globalLoader');
            if (loader) loader.style.display = 'none';
        };

        // Interceptor para manejar errores de red
        window.addEventListener('online', () => {
            this.showNotification('Conexión restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Conexión perdida', 'warning');
        });
    }

    // =============================================
    // NOTIFICACIONES
    // =============================================

    showNotification(message, type = 'info') {
        // Usar sistema de notificaciones global si está disponible
        if (window.UIGlobalFunctions?.showNotification) {
            window.UIGlobalFunctions.showNotification(message, type);
        } else if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback a console
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Crear notificación simple
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-weight: 500;
                z-index: 9999;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                ${type === 'success' ? 'background: #10b981;' : ''}
                ${type === 'error' ? 'background: #ef4444;' : ''}
                ${type === 'warning' ? 'background: #f59e0b;' : ''}
                ${type === 'info' ? 'background: #3b82f6;' : ''}
            `;

            document.body.appendChild(notification);

            // Animar entrada
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);

            // Remover después del tiempo definido
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, this.uiConfig.TOAST_DURATION);
        }
    }
}

// =============================================
// INSTANCIA GLOBAL
// =============================================

// Crear instancia global del API client
window.LaboriaAPI = new LaboriaAPIClient();

// Inicializar estado desde localStorage
window.LaboriaAPI.tokenJWT = localStorage.getItem('tokenJWT');
window.LaboriaAPI.usuarioActual = localStorage.getItem('usuarioActual') ? JSON.parse(localStorage.getItem('usuarioActual')) : null;
window.LaboriaAPI.tokenSesion = localStorage.getItem('tokenSesion');

console.log('🔐 API Client inicializado:', {
    tokenJWT: !!window.LaboriaAPI.tokenJWT,
    usuarioActual: !!window.LaboriaAPI.usuarioActual,
    isAuthenticated: window.LaboriaAPI.isAuthenticated()
});

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaboriaAPIClient;
}
