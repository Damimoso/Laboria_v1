// =============================================
// CONSTANTES UNIFICADAS LABORIA - PRODUCCIÓN
// =============================================

// Configuración de la API para producción
const API_CONFIG = {
    BASE_URL: (typeof window !== 'undefined' && window.location.hostname === 'laboria.onrender.com') 
        ? 'https://laboria-api.onrender.com/api'
        : 'http://127.0.0.1:3000/api',
    TIMEOUT: 15000,
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
            MY_APPLICATIONS: '/jobs/my-applications'
        },
        COURSES: {
            LIST: '/courses',
            DETAIL: '/courses/:id',
            CREATE: '/courses',
            UPDATE: '/courses/:id',
            DELETE: '/courses/:id',
            ENROLL: '/courses/:id/enroll',
            MY_COURSES: '/courses/my-courses',
            PROGRESS: '/courses/:id/progress',
            RATE: '/courses/:id/rate'
        },
        NOTIFICATIONS: {
            LIST: '/notifications',
            MARK_READ: '/notifications/:id/read',
            DELETE: '/notifications/:id',
            READ_ALL: '/notifications/read-all'
        }
    }
};

// Mensajes de error
const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    USER_NOT_FOUND: 'Usuario no encontrado',
    EMAIL_ALREADY_EXISTS: 'El email ya está registrado',
    USERNAME_ALREADY_EXISTS: 'El nombre de usuario ya está en uso',
    INVALID_EMAIL: 'Email inválido',
    INVALID_PASSWORD: 'Contraseña inválida',
    PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
    REQUIRED_FIELD: 'Este campo es obligatorio',
    SERVER_ERROR: 'Error interno del servidor',
    SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
    ACCESS_DENIED: 'No tienes permisos para realizar esta acción.'
};

// Mensajes de éxito
const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    REGISTER_SUCCESS: 'Registro exitoso',
    PROFILE_UPDATED: 'Perfil actualizado correctamente',
    PASSWORD_CHANGED: 'Contraseña cambiada correctamente',
    FILE_UPLOADED: 'Archivo subido correctamente',
    LOGOUT_SUCCESS: 'Sesión cerrada correctamente'
};

// Configuración de UI
const UI_CONFIG = {
    TOAST_DURATION: 5000,
    LOADING_DELAY: 300,
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500
};

// Configuración de seguridad
const SECURITY_CONFIG = {
    JWT_SECRET: 'laboria_jwt_secret_2026',
    JWT_EXPIRES_IN: '7d',
    CORS_ORIGINS: ['https://laboria.onrender.com', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Configuración de archivos
const FILE_CONFIG = {
    MAX_FILE_SIZE: 5242880, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    UPLOAD_URL: 'https://laboria-api.onrender.com/uploads'
};

// Configuración de la aplicación
const APP_CONFIG = {
    NAME: 'Laboria',
    VERSION: '1.0.0',
    DESCRIPTION: 'Plataforma integral de empleo y formación profesional',
    AUTHOR: 'Laboria Team',
    SUPPORT_EMAIL: 'support@laboria.com',
    SOCIAL_LINKS: {
        FACEBOOK: 'https://facebook.com/laboria',
        TWITTER: 'https://twitter.com/laboria',
        LINKEDIN: 'https://linkedin.com/company/laboria',
        INSTAGRAM: 'https://instagram.com/laboria'
    }
};

// Exportar todo como un objeto global
if (typeof window !== 'undefined') {
    window.LaboriaConstants = {
        API_CONFIG,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        UI_CONFIG,
        SECURITY_CONFIG,
        FILE_CONFIG,
        APP_CONFIG
    };
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        UI_CONFIG,
        SECURITY_CONFIG,
        FILE_CONFIG,
        APP_CONFIG
    };
}
