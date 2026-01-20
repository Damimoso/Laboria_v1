// =============================================
// CONFIGURACIÓN DE PRODUCCIÓN - LABORIA
// =============================================

const path = require('path');
const fs = require('fs');

// Cargar variables de entorno de producción
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

class ProductionConfig {
    constructor() {
        this.validateEnvironment();
        this.setupProduction();
    }

    validateEnvironment() {
        const requiredVars = [
            'NODE_ENV',
            'DB_HOST',
            'DB_USER',
            'DB_PASSWORD',
            'DB_NAME',
            'JWT_SECRET',
            'SESSION_SECRET'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            throw new Error(`Variables de entorno requeridas faltantes: ${missingVars.join(', ')}`);
        }

        console.log('✅ Variables de entorno validadas');
    }

    setupProduction() {
        // Configurar modo producción
        process.env.NODE_ENV = 'production';

        // Configurar logging
        this.setupLogging();

        // Configurar seguridad
        this.setupSecurity();

        // Configurar performance
        this.setupPerformance();

        // Configurar errores
        this.setupErrorHandling();

        // Configurar clustering
        this.setupClustering();

        console.log('✅ Configuración de producción aplicada');
    }

    setupLogging() {
        // Configurar Winston para producción
        const winston = require('winston');
        const DailyRotateFile = require('winston-daily-rotate-file');

        // Crear directorio de logs si no existe
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Configuración de Winston
        const logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'laboria-api' },
            transports: [
                // Logs de errores
                new DailyRotateFile({
                    filename: path.join(logDir, 'error-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'error',
                    handleExceptions: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    zippedArchive: true
                }),

                // Logs combinados
                new DailyRotateFile({
                    filename: path.join(logDir, 'combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '14d',
                    zippedArchive: true
                }),

                // Logs de acceso
                new DailyRotateFile({
                    filename: path.join(logDir, 'access-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'http',
                    maxSize: '20m',
                    maxFiles: '7d',
                    zippedArchive: true
                })
            ]
        });

        // En producción, también enviar a servicios externos
        if (process.env.SENTRY_DSN) {
            const Sentry = require('@sentry/node');
            Sentry.init({
                dsn: process.env.SENTRY_DSN,
                environment: 'production',
                tracesSampleRate: 0.1
            });
        }

        // Reemplazar console.log con logger
        console.log = (...args) => logger.info(args);
        console.error = (...args) => logger.error(args);
        console.warn = (...args) => logger.warn(args);

        global.logger = logger;
    }

    setupSecurity() {
        // Configurar helmet para producción
        const helmet = require('helmet');
        
        this.helmetConfig = {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https:", process.env.AWS_S3_URL],
                    scriptSrc: ["'self'"],
                    connectSrc: ["'self'", "wss:", "https:"],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    manifestSrc: ["'self'"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        };

        // Configurar CORS para producción
        this.corsConfig = {
            origin: process.env.CORS_ORIGIN?.split(',') || ['https://laboria.com'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            exposedHeaders: ['X-Total-Count'],
            maxAge: 86400 // 24 horas
        };

        // Configurar rate limiting más estricto
        this.rateLimitConfig = {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            message: {
                success: false,
                message: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: false
        };

        // Configurar trust proxy para balanceadores de carga
        this.trustProxy = true;

        console.log('✅ Configuración de seguridad aplicada');
    }

    setupPerformance() {
        // Configurar compresión
        this.compressionConfig = {
            level: 6,
            threshold: 1024,
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            }
        };

        // Configurar cache para respuestas estáticas
        this.staticCacheConfig = {
            maxAge: '1y',
            etag: true,
            lastModified: true,
            setHeaders: (res, path) => {
                if (path.endsWith('.html')) {
                    res.setHeader('Cache-Control', 'no-cache');
                }
            }
        };

        // Configurar cluster para múltiples CPUs
        this.clusterConfig = {
            workers: require('os').cpus().length,
            maxMemory: '1G',
            autoRestart: true,
            watch: false,
            ignorePermissions: false,
            key: process.env.SSL_KEY_PATH,
            cert: process.env.SSL_CERT_PATH
        };

        console.log('✅ Configuración de performance aplicada');
    }

    setupErrorHandling() {
        // Configuración de manejo de errores en producción
        this.errorHandlingConfig = {
            // No enviar stack traces en producción
            sendStackTraces: false,
            // Logging de errores
            logErrors: true,
            // Página de error personalizada
            errorPage: '/error',
            // Reportar errores a servicios externos
            reportErrors: !!process.env.SENTRY_DSN
        };

        // Configurar graceful shutdown
        this.gracefulShutdownConfig = {
            timeout: 30000, // 30 segundos
            forceTimeout: 60000 // 1 minuto forzado
        };

        console.log('✅ Configuración de manejo de errores aplicada');
    }

    setupClustering() {
        const cluster = require('cluster');
        const os = require('os');

        if (cluster.isMaster) {
            console.log(`🚀 Master ${process.pid} is running`);

            // Fork workers
            const numWorkers = os.cpus().length;
            
            for (let i = 0; i < numWorkers; i++) {
                cluster.fork();
            }

            // Manejar eventos de workers
            cluster.on('exit', (worker, code, signal) => {
                console.log(`Worker ${worker.process.pid} died. Restarting...`);
                cluster.fork();
            });

            // Manejar shutdown graceful
            process.on('SIGTERM', () => {
                console.log('SIGTERM received. Shutting down gracefully...');
                
                // Detener nuevos workers
                cluster.disconnect(() => {
                    console.log('All workers disconnected. Exiting...');
                    process.exit(0);
                });
            });

        } else {
            console.log(`Worker ${process.pid} started`);
            
            // El worker ejecutará la aplicación principal
            require('../server');
        }
    }

    // Configuración de base de datos para producción
    getDatabaseConfig() {
        return {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            charset: process.env.DB_CHARSET || 'utf8mb4',
            timezone: process.env.DB_TIMEZONE || '+00:00',
            connectionLimit: 20,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true,
            // Configuración de pool para producción
            pool: {
                min: 5,
                max: 20,
                acquireTimeoutMillis: 60000,
                createTimeoutMillis: 30000,
                destroyTimeoutMillis: 5000,
                idleTimeoutMillis: 300000,
                reapIntervalMillis: 1000,
                createRetryIntervalMillis: 200
            }
        };
    }

    // Configuración de Redis para producción
    getRedisConfig() {
        return {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB) || 0,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
            family: 4,
            keyPrefix: 'laboria:',
            // Configuración de cluster Redis
            cluster: [
                {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT) || 6379
                }
            ]
        };
    }

    // Configuración de AWS S3 para producción
    getAWSConfig() {
        return {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1',
            s3: {
                bucket: process.env.AWS_S3_BUCKET,
                url: process.env.AWS_S3_URL,
                region: process.env.AWS_REGION,
                signatureVersion: 'v4',
                s3ForcePathStyle: true,
                params: {
                    Bucket: process.env.AWS_S3_BUCKET,
                    ACL: 'public-read'
                }
            }
        };
    }

    // Configuración de Stripe para producción
    getStripeConfig() {
        return {
            secretKey: process.env.STRIPE_SECRET_KEY,
            publicKey: process.env.STRIPE_PUBLIC_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            apiVersion: '2023-10-16'
        };
    }

    // Configuración de email para producción
    getEmailConfig() {
        return {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            from: {
                name: process.env.EMAIL_FROM_NAME || 'Laboria',
                address: process.env.EMAIL_FROM
            },
            // Configuración de templates
            templates: {
                welcome: 'welcome-template',
                resetPassword: 'reset-password-template',
                jobApplication: 'job-application-template',
                courseEnrollment: 'course-enrollment-template'
            }
        };
    }

    // Configuración de monitoring
    getMonitoringConfig() {
        return {
            sentry: {
                dsn: process.env.SENTRY_DSN,
                environment: 'production',
                tracesSampleRate: 0.1,
                debug: false
            },
            analytics: {
                googleAnalytics: process.env.GOOGLE_ANALYTICS_ID,
                mixpanel: process.env.MIXPANEL_TOKEN
            },
            healthCheck: {
                enabled: true,
                interval: 30000, // 30 segundos
                timeout: 5000
            }
        };
    }

    // Configuración de backup
    getBackupConfig() {
        return {
            schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
            retention: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
            s3Bucket: process.env.BACKUP_S3_BUCKET,
            databases: ['laboria_prod'],
            compression: true,
            encryption: true
        };
    }

    // Obtener configuración completa
    getConfig() {
        return {
            nodeEnv: process.env.NODE_ENV,
            database: this.getDatabaseConfig(),
            redis: this.getRedisConfig(),
            aws: this.getAWSConfig(),
            stripe: this.getStripeConfig(),
            email: this.getEmailConfig(),
            monitoring: this.getMonitoringConfig(),
            backup: this.getBackupConfig(),
            security: {
                helmet: this.helmetConfig,
                cors: this.corsConfig,
                rateLimit: this.rateLimitConfig,
                trustProxy: this.trustProxy
            },
            performance: {
                compression: this.compressionConfig,
                staticCache: this.staticCacheConfig,
                cluster: this.clusterConfig
            },
            errorHandling: this.errorHandlingConfig,
            gracefulShutdown: this.gracefulShutdownConfig
        };
    }
}

// Exportar configuración de producción
module.exports = new ProductionConfig();
