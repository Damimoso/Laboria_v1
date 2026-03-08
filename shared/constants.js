// =============================================
// CONSTANTES UNIFICADAS LABORIA - BACKEND Y FRONTEND
// =============================================

// Configuración de la API
const API_CONFIG = {
    BASE_URL: (typeof window !== 'undefined' && window.location?.hostname === 'localhost') 
        ? 'http://localhost:3000/api'
        : (typeof process !== 'undefined' && process.env.NODE_ENV === 'production' 
            ? (process.env.API_BASE_URL || 'https://laboria-api.onrender.com/api')
            : 'https://laboria-api.onrender.com/api'),
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
        },
        AI: {
            CHAT: '/ai/chat',
            ANALYZE: '/ai/analyze',
            RECOMMEND: '/ai/recommend'
        },
        BLOCKCHAIN: {
            CREDENTIALS: {
                ISSUE: '/blockchain/credentials/issue',
                VERIFY: '/blockchain/credentials/:hash/verify'
            },
            SMART_CONTRACTS: {
                DEPLOY: '/blockchain/smart-contracts/deploy',
                EXECUTE: '/blockchain/smart-contracts/:address/execute'
            },
            DID: {
                CREATE: '/blockchain/did/create',
                RESOLVE: '/blockchain/did/:did/resolve'
            },
            TOKENS: {
                MINT: '/blockchain/tokens/mint',
                TRANSFER: '/blockchain/tokens/transfer',
                BALANCE: '/blockchain/tokens/:address/balance'
            }
        },
        REALTIME: {
            COLLABORATION: {
                CREATE_ROOM: '/realtime/collaboration/create-room'
            },
            VIDEO_INTERVIEWS: {
                CREATE: '/realtime/interview/create'
            },
            CAREER_FAIRS: {
                CREATE: '/realtime/career-fair/create'
            }
        }
    }
};

// Configuración de la aplicación
const APP_CONFIG = {
    NAME: 'Laboria',
    VERSION: '6.0.0-nextgen',
    DESCRIPTION: 'Plataforma integral de empleo y formación profesional',
    AUTHOR: 'Laboria Team',
    SUPPORT_EMAIL: 'support@laboria.com',
    WEBSITE: 'https://laboria.com'
};

// Configuración de UI
const UI_CONFIG = {
    THEME: {
        PRIMARY: '#667eea',
        SECONDARY: '#764ba2',
        ACCENT: '#f093fb',
        SUCCESS: '#48bb78',
        WARNING: '#ed8936',
        ERROR: '#f56565',
        INFO: '#4299e1'
    },
    ANIMATIONS: {
        DURATION: {
            FAST: 150,
            NORMAL: 300,
            SLOW: 500
        },
        EASING: {
            EASE: 'ease',
            EASE_IN: 'ease-in',
            EASE_OUT: 'ease-out',
            EASE_IN_OUT: 'ease-in-out'
        }
    },
    BREAKPOINTS: {
        MOBILE: 480,
        TABLET: 768,
        DESKTOP: 1024,
        LARGE: 1200
    }
};

// Configuración de validación
const VALIDATION_CONFIG = {
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBERS: true,
        REQUIRE_SYMBOLS: false
    },
    USERNAME: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 30,
        PATTERN: /^[a-zA-Z0-9_]+$/
    },
    EMAIL: {
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
};

// Configuración de almacenamiento
const STORAGE_CONFIG = {
    KEYS: {
        AUTH_TOKEN: 'laboria_auth_token',
        USER_DATA: 'laboria_user_data',
        THEME: 'laboria_theme',
        LANGUAGE: 'laboria_language',
        PREFERENCES: 'laboria_preferences'
    },
    EXPIRY: {
        AUTH_TOKEN: 24 * 60 * 60 * 1000, // 24 horas
        USER_DATA: 7 * 24 * 60 * 60 * 1000 // 7 días
    }
};

// Configuración de notificaciones
const NOTIFICATION_CONFIG = {
    TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    },
    DURATION: {
        SHORT: 3000,
        NORMAL: 5000,
        LONG: 10000
    },
    POSITION: {
        TOP_RIGHT: 'top-right',
        TOP_LEFT: 'top-left',
        BOTTOM_RIGHT: 'bottom-right',
        BOTTOM_LEFT: 'bottom-left'
    }
};

// Configuración de paginación
const PAGINATION_CONFIG = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    DEFAULT_PAGE: 1
};

// Configuración de archivos
const FILE_CONFIG = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    AVATAR: {
        MAX_SIZE: 2 * 1024 * 1024, // 2MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        DEFAULT: '/assets/default-avatar.png'
    }
};

// Configuración de caché
const CACHE_CONFIG = {
    DURATION: {
        SHORT: 5 * 60 * 1000, // 5 minutos
        NORMAL: 30 * 60 * 1000, // 30 minutos
        LONG: 2 * 60 * 60 * 1000 // 2 horas
    },
    KEYS: {
        USER_PROFILE: 'user_profile_',
        JOBS_LIST: 'jobs_list_',
        COURSES_LIST: 'courses_list_',
        SEARCH_RESULTS: 'search_results_'
    }
};

// Configuración de seguridad
const SECURITY_CONFIG = {
    JWT: {
        SECRET: process.env.JWT_SECRET || 'laboria_secret_key_fase6',
        EXPIRY: '24h',
        ALGORITHM: 'HS256'
    },
    BCRYPT: {
        ROUNDS: 12
    },
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutos
        MAX_REQUESTS: 100
    }
};

// Configuración de WebSocket
const WEBSOCKET_CONFIG = {
    URL: process.env.NODE_ENV === 'production' 
        ? 'wss://api.laboria.com' 
        : 'ws://localhost:3000',
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 1000,
    HEARTBEAT_INTERVAL: 30000
};

// Configuración de analytics
const ANALYTICS_CONFIG = {
    TRACKING_ID: process.env.GA_TRACKING_ID || null,
    EVENTS: {
        PAGE_VIEW: 'page_view',
        USER_LOGIN: 'user_login',
        USER_REGISTER: 'user_register',
        JOB_APPLICATION: 'job_application',
        COURSE_ENROLLMENT: 'course_enrollment'
    }
};

// Exportar configuraciones
if (typeof module !== 'undefined' && module.exports) {
    // Para Node.js (Backend)
    module.exports = {
        API_CONFIG,
        APP_CONFIG,
        UI_CONFIG,
        VALIDATION_CONFIG,
        STORAGE_CONFIG,
        NOTIFICATION_CONFIG,
        PAGINATION_CONFIG,
        FILE_CONFIG,
        CACHE_CONFIG,
        SECURITY_CONFIG,
        WEBSOCKET_CONFIG,
        ANALYTICS_CONFIG
    };
} else {
    // Para Browser (Frontend)
    window.LaboriaConstants = {
        API_CONFIG,
        APP_CONFIG,
        UI_CONFIG,
        VALIDATION_CONFIG,
        STORAGE_CONFIG,
        NOTIFICATION_CONFIG,
        PAGINATION_CONFIG,
        FILE_CONFIG,
        CACHE_CONFIG,
        SECURITY_CONFIG,
        WEBSOCKET_CONFIG,
        ANALYTICS_CONFIG
    };
}
