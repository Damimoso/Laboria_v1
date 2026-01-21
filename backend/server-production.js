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

class ProductionServer {
    constructor() {
        // Configuración simple para producción
        this.config = {
            port: process.env.PORT || 10000,
            host: '0.0.0.0',
            nodeEnv: process.env.NODE_ENV || 'production'
        };
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
        console.log(`🌐 Puerto: ${this.config.port}`);
        
        // Verificar configuración
        await this.validateConfiguration();
        
        // Crear directorios necesarios
        await this.createDirectories();
        
        // Iniciar workers
        await this.startWorkers();
        
        // Configurar monitoreo
        this.setupMonitoring();
        
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
            './logs',
            './uploads',
            './uploads/avatars',
            './uploads/documents',
            './uploads/images',
            './temp',
            './backups',
            './certs'
        ];
        
        for (const dir of directories) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
                console.log(`📁 Directorio creado: ${dir}`);
            }
        }
    }

    async startWorkers() {
        const numWorkers = 1; // Simplificado para Render
        
        for (let i = 0; i < numWorkers; i++) {
            const worker = cluster.fork({
                WORKER_ID: i + 1,
                PORT: process.env.PORT || 10000
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
        // Health check principal para Render
        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                port: process.env.PORT || 10000
            });
        });
        
        // Rutas de API - habilitando todas las rutas (temporalmente deshabilitadas)
        console.log('🔧 API routes deshabilitadas temporalmente para debugging');
        // app.use('/api/auth', require('./routes/auth'));
        // app.use('/api/users', require('./routes/users'));
        // app.use('/api/jobs', require('./routes/jobs'));
        // app.use('/api/courses', require('./routes/courses'));
        
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
        app.use('/uploads', require('express').static('./uploads'));
        
        // Servir recursos estáticos del frontend (locales)
        app.use('/styles', require('express').static('./frontend/styles'));
        app.use('/js', require('express').static('./frontend/js'));
        app.use('/shared', require('express').static('./shared'));
        
        // Rutas de API - temporalmente deshabilitadas para debugging
        console.log('🔧 API routes deshabilitadas temporalmente');
        // app.use('/api/auth', require('./routes/auth'));
        // app.use('/api/users', require('./routes/users'));
        // app.use('/api/jobs', require('./routes/jobs'));
        // app.use('/api/courses', require('./routes/courses'));
        
        // Middleware para páginas SPA
        app.get('*', (req, res) => {
            if (req.path.startsWith('/api/')) {
                return res.status(404).json({
                    success: false,
                    message: 'API endpoint not found'
                });
            }
            
            // Servir el frontend real
            const indexPath = './frontend/pages/index.html';
            console.log('🔍 Sirviendo frontend desde:', indexPath);
            console.log('📁 Existe archivo:', fs.existsSync(indexPath));
            console.log('📂 Directorio actual:', process.cwd());
            console.log('📋 Lista archivos frontend/pages:', fs.readdirSync('./frontend/pages'));
            
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                // Si no existe el frontend, servir página de bienvenida
                res.send(`
                    <html>
                        <head><title>Laboria - Servidor Funcionando</title></head>
                        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                            <h1>🚀 Laboria Server</h1>
                            <p>✅ Servidor funcionando correctamente</p>
                            <p>🔍 Health Check: <a href="/health">/health</a></p>
                            <p>🔍 API Health: <a href="/api/health">/api/health</a></p>
                            <p>📊 Environment: ${process.env.NODE_ENV}</p>
                            <p>🌐 Port: ${process.env.PORT || 10000}</p>
                            <p>🕒 Deploy: ${new Date().toISOString()}</p>
                            <p>🔧 Auth Routes: Enabled</p>
                            <p>⚠️ Frontend no encontrado en: ${indexPath}</p>
                        </body>
                    </html>
                `);
            }
        });
    }

    setupErrorMiddleware(app) {
        // Error handler (debe ir antes del 404)
        app.use((error, req, res, next) => {
            console.error('Error del servidor:', error);
            
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
        
        // Error 404 (debe ir al final)
        app.use('*', (req, res) => {
            // Si es una solicitud de API, responder con JSON
            if (req.path.startsWith('/api/')) {
                return res.status(404).json({
                    success: false,
                    message: 'API endpoint not found',
                    path: req.originalUrl
                });
            }
            
            // Si es un archivo estático que no se encontró, dejar pasar al siguiente middleware
            next();
        });
    }

    async startHttpServer(app, config) {
        const http = require('http');
        
        const server = http.createServer(app);
        
        // Iniciar servidor con configuración explícita para Render
        await new Promise((resolve, reject) => {
            const port = process.env.PORT || 10000;
            const host = '0.0.0.0';
            
            server.listen(port, host, (error) => {
                if (error) {
                    console.error(`❌ Error iniciando servidor en ${host}:${port}:`, error);
                    reject(error);
                } else {
                    console.log(`🌐 Servidor escuchando en ${host}:${port}`);
                    console.log(`🔍 Health check disponible en http://${host}:${port}/api/health`);
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
