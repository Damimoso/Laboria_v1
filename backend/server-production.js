#!/usr/bin/env node

// =============================================
// SERVIDOR DE PRODUCCIÓN LABORIA
// =============================================

const cluster = require('cluster');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno para producción
require('dotenv').config({ path: '.env.production' });

// Cargar configuración existente
const { LABORIA_CONFIG } = require('./config/constants');

class ProductionServer {
    constructor() {
        this.config = LABORIA_CONFIG.BACKEND_CONFIG;
        this.isMaster = cluster.isMaster;
        this.workers = [];
        this.shutdownInProgress = false;
        
        this.setupProcessHandlers();
    }

    setupProcessHandlers() {
        // Manejar señales del sistema
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
        process.on('SIGUSR2', () => this.gracefulRestart('SIGUSR2'));
        
        // Manejar excepciones no capturadas
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            this.logError(error);
            process.exit(1);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.logError(new Error(`Unhandled Rejection: ${reason}`));
            process.exit(1);
        });
    }

    async start() {
        if (this.isMaster) {
            await this.startMaster();
        } else {
            await this.startWorker();
        }
    }

    async startMaster() {
        console.log('🚀 Iniciando servidor Laboria en modo producción');
        console.log(`📊 CPUs detectadas: ${os.cpus().length}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
        
        // Verificar configuración
        await this.validateConfiguration();
        
        // Crear directorios necesarios
        await this.createDirectories();
        
        // Iniciar workers
        await this.startWorkers();
        
        // Configurar monitoreo
        this.setupMonitoring();
        
        // Configurar backup automático
        this.setupBackup();
        
        console.log('✅ Servidor de producción iniciado correctamente');
    }

    async startWorker() {
        try {
            // Cargar configuración específica del worker
            const workerConfig = {
                ...this.config,
                workerId: process.env.WORKER_ID || cluster.worker.id
            };
            
            // Iniciar aplicación Express
            const app = await this.createExpressApp(workerConfig);
            
            // Iniciar servidor HTTP/HTTPS
            const server = await this.startHttpServer(app, workerConfig);
            
            // Configurar graceful shutdown para worker
            this.setupWorkerShutdown(server);
            
            console.log(`✅ Worker ${cluster.worker.id} iniciado en puerto ${workerConfig.port}`);
            
        } catch (error) {
            console.error(`❌ Error iniciando worker ${cluster.worker.id}:`, error);
            process.exit(1);
        }
    }

    async validateConfiguration() {
        const requiredPaths = [
            path.join(__dirname, 'logs'),
            path.join(__dirname, 'uploads'),
            path.join(__dirname, 'temp')
        ];
        
        for (const dirPath of requiredPaths) {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`📁 Directorio creado: ${dirPath}`);
            }
        }
        
        // Validar conexión a base de datos
        await this.validateDatabaseConnection();
        
        // Validar conexión a Redis
        await this.validateRedisConnection();
        
        console.log('✅ Validación de configuración completada');
    }

    async validateDatabaseConnection() {
        try {
            const { testConnection } = require('./config/database');
            const connected = await testConnection();
            if (connected) {
                console.log('✅ Conexión a base de datos validada');
            } else {
                console.warn('⚠️ Usando SQLite fallback');
            }
        } catch (error) {
            console.error('❌ Error validando conexión a base de datos:', error);
            console.warn('⚠️ Continuando sin base de datos...');
        }
    }

    async validateRedisConnection() {
        console.log('⚠️ Redis no configurado, omitiendo validación');
    }

    async createDirectories() {
        const directories = [
            'logs',
            'uploads',
            'uploads/avatars',
            'uploads/documents',
            'uploads/images',
            'temp',
            'backups',
            'certs'
        ];
        
        for (const dir of directories) {
            const dirPath = path.join(__dirname, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`📁 Directorio creado: ${dir}`);
            }
        }
    }

    async startWorkers() {
        const numWorkers = 1; // Simplificado para Render
        
        for (let i = 0; i < numWorkers; i++) {
            const worker = cluster.fork({
                WORKER_ID: i + 1
            });
            
            this.workers.push(worker);
            
            worker.on('exit', (code, signal) => {
                console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
                this.restartWorker(worker);
            });
            
            worker.on('error', (error) => {
                console.error(`Worker ${worker.process.pid} error:`, error);
            });
            
            console.log(`👷 Worker ${worker.process.pid} iniciado (ID: ${i + 1})`);
        }
    }

    restartWorker(deadWorker) {
        if (this.shutdownInProgress) {
            return;
        }
        
        console.log('🔄 Reiniciando worker...');
        
        setTimeout(() => {
            const newWorker = cluster.fork({
                WORKER_ID: deadWorker.id
            });
            
            this.workers = this.workers.filter(w => w.id !== deadWorker.id);
            this.workers.push(newWorker);
            
            newWorker.on('exit', (code, signal) => {
                console.log(`Worker ${newWorker.process.pid} died with code ${code} and signal ${signal}`);
                this.restartWorker(newWorker);
            });
            
            console.log(`👷 Worker ${newWorker.process.pid} reiniciado`);
        }, 1000);
    }

    async createExpressApp(config) {
        const express = require('express');
        const cors = require('cors');
        const helmet = require('helmet');
        const morgan = require('morgan');
        
        const app = express();
        
        // Middleware de seguridad básico
        app.use(helmet());
        
        // Configuración de CORS
        app.use(cors({
            origin: process.env.CORS_ORIGIN?.split(',') || ['https://laboria.onrender.com'],
            credentials: true
        }));
        
        // Rate limiting simple
        const rateLimit = require('express-rate-limit');
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 100 // límite por IP
        });
        app.use('/api/', limiter);
        
        // Logging simple
        app.use(morgan('combined'));
        
        // Body parser
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Trust proxy para Render
        app.set('trust proxy', true);
        
        // Cargar rutas
        await this.loadRoutes(app);
        
        // Middleware de errores
        this.setupErrorMiddleware(app);
        
        return app;
    }

    async loadRoutes(app) {
        // Rutas de API
        app.use('/api/auth', require('./routes/auth'));
        app.use('/api/users', require('./routes/users'));
        app.use('/api/jobs', require('./routes/jobs'));
        app.use('/api/courses', require('./routes/courses'));
        
        // Rutas de health check
        app.get('/api/health', (req, res) => {
            res.json({
                success: true,
                message: 'Servidor Laboria funcionando correctamente',
                data: {
                    status: 'healthy',
                    version: '1.0.0',
                    environment: process.env.NODE_ENV,
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    workerId: process.env.WORKER_ID,
                    timestamp: new Date().toISOString()
                }
            });
        });
        
        // Rutas estáticas
        app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
        
        // Middleware para páginas SPA
        app.get('*', (req, res) => {
            if (req.path.startsWith('/api/')) {
                return res.status(404).json({
                    success: false,
                    message: 'API endpoint not found'
                });
            }
            
            // Servir index.html para rutas de frontend
            const indexPath = path.join(__dirname, '../frontend/pages/index.html');
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Frontend not found'
                });
            }
        });
    }

    setupErrorMiddleware(app) {
        // Error 404
        app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint not found',
                path: req.originalUrl
            });
        });
        
        // Error handler
        app.use((error, req, res, next) => {
            console.error('Error del servidor:', error);
            
            // Logging del error
            global.logger?.error('Server Error', {
                error: error.message,
                stack: error.stack,
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                workerId: process.env.WORKER_ID
            });
            
            // En producción no enviar stack traces
            const response = {
                success: false,
                message: process.env.NODE_ENV === 'production' 
                    ? 'Internal Server Error' 
                    : error.message
            };
            
            if (process.env.NODE_ENV !== 'production') {
                response.stack = error.stack;
            }
            
            res.status(error.status || 500).json(response);
        });
    }

    async startHttpServer(app, config) {
        const http = require('http');
        
        const server = http.createServer(app);
        
        // Iniciar servidor
        await new Promise((resolve, reject) => {
            const port = process.env.PORT || 10000;
            server.listen(port, '0.0.0.0', (error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`🌐 Servidor escuchando en 0.0.0.0:${port}`);
                    resolve();
                }
            });
        });
        
        return server;
    }

    setupWorkerShutdown(server) {
        const shutdown = (signal) => {
            console.log(`Worker recibiendo ${signal}`);
            
            server.close(() => {
                console.log(`Worker cerrado`);
                process.exit(0);
            });
            
            // Forzar cierre después del timeout
            setTimeout(() => {
                console.log(`Worker forzado a cerrar`);
                process.exit(1);
            }, 5000);
        };
        
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    setupMonitoring() {
        console.log('📊 Monitoreo simplificado activado');
    }

    
    async gracefulShutdown(signal) {
        if (this.shutdownInProgress) {
            console.log('Shutdown ya en progreso...');
            return;
        }
        
        this.shutdownInProgress = true;
        console.log(`🛑 Iniciando graceful shutdown (${signal})...`);
        
        // Desconectar workers
        for (const worker of this.workers) {
            worker.kill('SIGTERM');
        }
        
        // Esperar a que todos los workers terminen
        setTimeout(() => {
            console.log('Forzando shutdown de workers restantes...');
            for (const worker of this.workers) {
                worker.kill('SIGKILL');
            }
            
            process.exit(0);
        }, 5000);
    }

    logError(error) {
        console.error('Production Error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

// Iniciar servidor de producción
if (require.main === module) {
    const server = new ProductionServer();
    server.start().catch(error => {
        console.error('❌ Error iniciando servidor de producción:', error);
        process.exit(1);
    });
}

module.exports = ProductionServer;
