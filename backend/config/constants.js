// =============================================
// CONSTANTES PARA BACKEND LABORIA
// =============================================

const path = require('path');

// Importar constantes compartidas
let sharedConstants;
try {
    sharedConstants = require('../../shared/constants');
} catch (error) {
    console.warn('⚠️ No se pudo cargar constants compartidas, usando valores por defecto');
    sharedConstants = {
        SECURITY_CONFIG: {
            JWT_SECRET: process.env.JWT_SECRET || 'laboria_jwt_secret_2026',
            JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
            CORS_ORIGINS: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:3000'],
            ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With']
        }
    };
}

// Configuración específica del backend
const BACKEND_CONFIG = {
    // Rutas de archivos
    PATHS: {
        ROOT: path.resolve(__dirname, '../..'),
        BACKEND: path.resolve(__dirname, '..'),
        FRONTEND: path.resolve(__dirname, '../../frontend'),
        SHARED: path.resolve(__dirname, '../../shared'),
        UPLOADS: path.resolve(__dirname, '../uploads'),
        LOGS: path.resolve(__dirname, '../logs'),
        TEMP: path.resolve(__dirname, '../temp')
    },
    
    // Configuración del servidor
    SERVER: {
        HOST: process.env.HOST || '127.0.0.1',
        PORT: parseInt(process.env.PORT) || 3000,
        NODE_ENV: process.env.NODE_ENV || 'development',
        TRUST_PROXY: process.env.TRUST_PROXY === 'true'
    },
    
    // Configuración de archivos estáticos
    STATIC: {
        SERVE_FRONTEND: true,
        FRONTEND_PATH: path.resolve(__dirname, '../../frontend'),
        UPLOAD_PATH: path.resolve(__dirname, '../uploads'),
        MAX_AGE: process.env.NODE_ENV === 'production' ? '1y' : '0'
    },
    
    // Configuración de sesión
    SESSION: {
        SECRET: process.env.SESSION_SECRET || 'laboria_session_secret_2026',
        RESAVE: false,
        SAVE_UNINITIALIZED: false,
        ROLLING: true,
        COOKIE: {
            SECURE: process.env.NODE_ENV === 'production',
            HTTP_ONLY: true,
            MAX_AGE: 24 * 60 * 60 * 1000 // 24 horas
        }
    },
    
    // Configuración de email
    EMAIL: {
        HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
        PORT: parseInt(process.env.EMAIL_PORT) || 587,
        SECURE: process.env.EMAIL_PORT === '465',
        USER: process.env.EMAIL_USER || '',
        PASS: process.env.EMAIL_PASS || '',
        FROM: process.env.EMAIL_FROM || '"Laboria" <noreply@laboria.com>'
    },
    
    // Configuración de archivos
    UPLOAD: {
        MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        DESTINATION: path.resolve(__dirname, '../uploads'),
        FILENAME: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    },
    
    // Configuración de logging
    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || 'info',
        FORMAT: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
        FILE: {
            ENABLE: process.env.NODE_ENV === 'production',
            PATH: path.resolve(__dirname, '../logs'),
            MAX_SIZE: '10m',
            MAX_FILES: 5,
            DATE_PATTERN: 'YYYY-MM-DD'
        }
    },
    
    // Configuración de seguridad adicional
    SECURITY: {
        HELMET: {
            CONTENT_SECURITY_POLICY: {
                DIRECTIVES: {
                    DEFAULT_SRC: ["'self'"],
                    STYLE_SRC: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    FONT_SRC: ["'self'", "https://fonts.gstatic.com"],
                    IMG_SRC: ["'self'", "data:", "https:"],
                    SCRIPT_SRC: ["'self'"],
                    CONNECT_SRC: ["'self'", "http://localhost:3000", "http://127.0.0.1:3000", "ws://localhost:3000", "ws://127.0.0.1:3000"]
                }
            },
            HSTS: process.env.NODE_ENV === 'production'
        },
        RATE_LIMIT: {
            WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
            MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            MESSAGE: {
                SUCCESS: false,
                MESSAGE: 'Demasiadas peticiones desde esta IP, por favor intente más tarde'
            },
            STANDARD_HEADERS: true,
            LEGACY_HEADERS: false
        }
    }
};

// Combinar constantes compartidas con configuración del backend
const LABORIA_CONFIG = {
    ...sharedConstants,
    BACKEND_CONFIG,
    
    // Métodos útiles
    helpers: {
        isDevelopment: () => process.env.NODE_ENV === 'development',
        isProduction: () => process.env.NODE_ENV === 'production',
        getPath: (relativePath) => path.resolve(BACKEND_CONFIG.PATHS.ROOT, relativePath),
        getUploadPath: (filename) => path.join(BACKEND_CONFIG.PATHS.UPLOADS, filename),
        getPublicUrl: (filename) => `/uploads/${filename}`,
        validateEmail: (email) => sharedConstants.VALIDATION_PATTERNS.EMAIL.test(email),
        validatePassword: (password) => sharedConstants.VALIDATION_PATTERNS.PASSWORD.test(password),
        hashPassword: async (password) => {
            const bcrypt = require('bcryptjs');
            return await bcrypt.hash(password, sharedConstants.SECURITY_CONFIG.BCRYPT_ROUNDS);
        },
        comparePassword: async (password, hash) => {
            const bcrypt = require('bcryptjs');
            return await bcrypt.compare(password, hash);
        },
        generateToken: (payload) => {
            const jwt = require('jsonwebtoken');
            return jwt.sign(payload, sharedConstants.SECURITY_CONFIG.JWT_SECRET, {
                expiresIn: sharedConstants.SECURITY_CONFIG.JWT_EXPIRES_IN
            });
        },
        verifyToken: (token) => {
            const jwt = require('jsonwebtoken');
            return jwt.verify(token, sharedConstants.SECURITY_CONFIG.JWT_SECRET);
        },
        formatError: (error) => {
            if (process.env.NODE_ENV === 'development') {
                return {
                    success: false,
                    message: error.message,
                    stack: error.stack,
                    details: error
                };
            }
            return {
                success: false,
                message: sharedConstants.ERROR_MESSAGES.SERVER_ERROR
            };
        },
        sendSuccess: (res, data, message = 'Operación exitosa') => {
            res.json({
                success: true,
                message,
                data,
                timestamp: new Date().toISOString()
            });
        },
        sendError: (res, error, statusCode = 500) => {
            const formattedError = LABORIA_CONFIG.helpers.formatError(error);
            res.status(statusCode).json(formattedError);
        }
    }
};

module.exports = LABORIA_CONFIG;
