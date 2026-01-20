// =============================================
// CONSTANTES UNIFICADAS LABORIA - BACKEND Y FRONTEND
// =============================================

// Configuración de la API
const API_CONFIG = {
    BASE_URL: (typeof window !== 'undefined' && window.location?.hostname === 'localhost') 
        ? 'http://localhost:3000/api'
        : (typeof process !== 'undefined' && process.env.NODE_ENV === 'production' 
            ? (process.env.API_BASE_URL || 'https://api.laboria.com')
            : 'http://localhost:3000/api'),
    TIMEOUT: (typeof process !== 'undefined' ? parseInt(process.env.API_TIMEOUT) : 10000) || 10000,
    RETRY_ATTEMPTS: (typeof process !== 'undefined' ? parseInt(process.env.API_RETRY_ATTEMPTS) : 3) || 3,
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
        },
        MESSAGES: {
            LIST: '/messages',
            CONVERSATION: '/messages/:id',
            SEND: '/messages',
            MARK_READ: '/messages/:id/read',
            DELETE: '/messages/:id'
        }
    }
};

// Roles de usuario
const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    EMPRESA: 'empresa'
};

// Estados de usuario
const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
};

// Estados de empleo
const JOB_STATUS = {
    ACTIVE: 'activo',
    INACTIVE: 'inactivo',
    CLOSED: 'cerrado',
    PAUSED: 'pausado'
};

// Tipos de contrato
const CONTRACT_TYPES = {
    FULL_TIME: 'tiempo_completo',
    PART_TIME: 'medio_tiempo',
    FREELANCE: 'freelance',
    INTERNSHIP: 'practicas',
    TEMPORAL: 'temporal'
};

// Modalidades de trabajo
const WORK_MODALITIES = {
    ONSITE: 'presencial',
    REMOTE: 'remoto',
    HYBRID: 'hibrido'
};

// Niveles de experiencia
const EXPERIENCE_LEVELS = {
    NONE: 'sin_experiencia',
    ONE_YEAR: '1_anio',
    TWO_YEARS: '2_anios',
    THREE_YEARS: '3_anios',
    FIVE_YEARS: '5_anios',
    PLUS_FIVE: 'mas_5_anios'
};

// Niveles educativos
const EDUCATION_LEVELS = {
    HIGH_SCHOOL: 'secundaria',
    BACHELOR: 'bachiller',
    TECHNICAL: 'tecnico',
    UNIVERSITY: 'universitario',
    POSTGRADUATE: 'posgrado'
};

// Niveles de curso
const COURSE_LEVELS = {
    BEGINNER: 'principiante',
    INTERMEDIATE: 'intermedio',
    ADVANCED: 'avanzado'
};

// Tipos de notificación
const NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
};

// Estados de postulación
const APPLICATION_STATUS = {
    PENDING: 'pendiente',
    REVIEWING: 'revisando',
    ACCEPTED: 'aceptada',
    REJECTED: 'rechazada'
};

// Estados de inscripción
const ENROLLMENT_STATUS = {
    ACTIVE: 'activa',
    COMPLETED: 'completada',
    ABANDONED: 'abandonada'
};

// Expresiones regulares para validación
const VALIDATION_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[+]?[\d\s\-\(\)]+$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
    URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
    NAME: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/,
    DESCRIPTION: /^[\s\S]{10,500}$/,
    SALARY: /^\d+(\.\d{1,2})?$/
};

// Límites y restricciones
const LIMITS = {
    MAX_FILE_SIZE: (typeof process !== 'undefined' ? parseInt(process.env.MAX_FILE_SIZE) : 5 * 1024 * 1024) || 5 * 1024 * 1024, // 5MB
    MAX_USERNAME_LENGTH: 50,
    MIN_USERNAME_LENGTH: 3,
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    MAX_BIO_LENGTH: 500,
    MAX_SKILLS_LENGTH: 1000,
    MAX_EXPERIENCE_LENGTH: 2000,
    MAX_TITLE_LENGTH: 200,
    MAX_DESCRIPTION_LENGTH: 2000,
    MAX_MESSAGES_LENGTH: 1000,
    MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutos
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 horas
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
    FILE_TOO_LARGE: 'El archivo es demasiado grande',
    INVALID_FILE_TYPE: 'Tipo de archivo no permitido',
    ACCOUNT_LOCKED: 'Cuenta bloqueada. Intenta más tarde.',
    SESSION_EXPIRED: 'Sesión expirada. Inicia sesión nuevamente.',
    ACCESS_DENIED: 'Acceso denegado',
    NOT_FOUND: 'Recurso no encontrado',
    SERVER_ERROR: 'Error interno del servidor',
    VALIDATION_ERROR: 'Error de validación',
    DUPLICATE_ENTRY: 'Registro duplicado',
    FOREIGN_KEY_VIOLATION: 'Violación de clave foránea'
};

// Mensajes de éxito
const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    REGISTER_SUCCESS: 'Registro exitoso',
    PROFILE_UPDATED: 'Perfil actualizado correctamente',
    PASSWORD_CHANGED: 'Contraseña cambiada correctamente',
    FILE_UPLOADED: 'Archivo subido correctamente',
    APPLICATION_SENT: 'Postulación enviada correctamente',
    COURSE_ENROLLED: 'Inscripción al curso exitosa',
    MESSAGE_SENT: 'Mensaje enviado correctamente',
    NOTIFICATION_READ: 'Notificación marcada como leída',
    COURSE_COMPLETED: 'Curso completado exitosamente',
    CERTIFICATE_GENERATED: 'Certificado generado correctamente'
};

// Colores del tema
const THEME_COLORS = {
    PRIMARY: '#2563eb',
    SECONDARY: '#64748b',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    DANGER: '#ef4444',
    DARK: '#1f2937',
    LIGHT: '#f8fafc',
    INFO: '#3b82f6',
    PURPLE: '#8b5cf6',
    PINK: '#ec4899'
};

// Configuración de UI
const UI_CONFIG = {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 5000,
    MODAL_BACKDROP: true,
    CONFIRM_DIALOG: true,
    AUTO_SAVE_INTERVAL: 30000, // 30 segundos
    INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutos
    PAGINATION_SIZE: 10,
    SEARCH_DEBOUNCE: 500
};

// Configuración de caché
const CACHE_CONFIG = {
    USER_PROFILE: 5 * 60 * 1000, // 5 minutos
    JOB_LISTINGS: 10 * 60 * 1000, // 10 minutos
    COURSE_LISTINGS: 15 * 60 * 1000, // 15 minutos
    NOTIFICATIONS: 30 * 1000, // 30 segundos
    STATIC_ASSETS: 24 * 60 * 60 * 1000 // 24 horas
};

// Configuración de seguridad
const SECURITY_CONFIG = {
    JWT_EXPIRES_IN: (typeof process !== 'undefined' ? process.env.JWT_EXPIRES_IN : '7d') || '7d',
    REFRESH_TOKEN_EXPIRES_IN: '30d',
    BCRYPT_ROUNDS: 12,
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutos
    RATE_LIMIT_MAX: 100,
    CORS_ORIGINS: (typeof process !== 'undefined' && process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5500']),
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Configuración de base de datos
const DB_CONFIG = {
    HOST: (typeof process !== 'undefined' ? process.env.DB_HOST : 'localhost'),
    PORT: (typeof process !== 'undefined' ? parseInt(process.env.DB_PORT) : 3306),
    USER: (typeof process !== 'undefined' ? process.env.DB_USER : 'root'),
    PASSWORD: (typeof process !== 'undefined' ? process.env.DB_PASSWORD : ''),
    DATABASE: (typeof process !== 'undefined' ? process.env.DB_NAME : 'laboria_db'),
    CHARSET: 'utf8mb4',
    TIMEZONE: '+00:00',
    CONNECTION_LIMIT: 10,
    ACQUIRE_TIMEOUT: 60000,
    TIMEOUT: 60000
};

// Exportar para Node.js (backend)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        USER_ROLES,
        USER_STATUS,
        JOB_STATUS,
        CONTRACT_TYPES,
        WORK_MODALITIES,
        EXPERIENCE_LEVELS,
        EDUCATION_LEVELS,
        COURSE_LEVELS,
        NOTIFICATION_TYPES,
        APPLICATION_STATUS,
        ENROLLMENT_STATUS,
        VALIDATION_PATTERNS,
        LIMITS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        THEME_COLORS,
        UI_CONFIG,
        CACHE_CONFIG,
        SECURITY_CONFIG,
        DB_CONFIG
    };
} else {
    // Para uso en navegador (frontend)
    window.LaboriaConstants = {
        API_CONFIG,
        USER_ROLES,
        USER_STATUS,
        JOB_STATUS,
        CONTRACT_TYPES,
        WORK_MODALITIES,
        EXPERIENCE_LEVELS,
        EDUCATION_LEVELS,
        COURSE_LEVELS,
        NOTIFICATION_TYPES,
        APPLICATION_STATUS,
        ENROLLMENT_STATUS,
        VALIDATION_PATTERNS,
        LIMITS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        THEME_COLORS,
        UI_CONFIG,
        CACHE_CONFIG
    };
}
