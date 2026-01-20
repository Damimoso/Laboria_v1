#!/usr/bin/env node

// =============================================
// SERVIDOR DE PRODUCCIÓN LABORIA
// =============================================

const cluster = require('cluster');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Cargar configuración de producción
const productionConfig = require('./config/production');

// Cargar variables de entorno para producción
require('dotenv').config({ path: '.env.production' });

class ProductionServer {
    constructor() {
        this.config = productionConfig.getConfig();
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
            const { pool } = require('./config/database');
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
            console.log('✅ Conexión a base de datos validada');
        } catch (error) {
            console.error('❌ Error validando conexión a base de datos:', error);
            throw error;
        }
    }

    async validateRedisConnection() {
        try {
            const Redis = require('ioredis');
            const redisConfig = this.config.redis;
            const redis = new Redis(redisConfig);
            
            await redis.ping();
            await redis.quit();
            console.log('✅ Conexión a Redis validada');
        } catch (error) {
            console.error('❌ Error validando conexión a Redis:', error);
            throw error;
        }
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
        const numWorkers = this.config.performance.cluster.workers || os.cpus().length;
        
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
        const compression = require('compression');
        const rateLimit = require('express-rate-limit');
        const morgan = require('morgan');
        
        const app = express();
        
        // Middleware de seguridad
        app.use(helmet(config.security.helmet));
        
        // Configuración de CORS
        app.use(cors(config.security.cors));
        
        // Compresión
        app.use(compression(config.performance.compression));
        
        // Rate limiting
        const limiter = rateLimit(config.security.rateLimit);
        app.use('/api/', limiter);
        
        // Logging
        if (config.performance.compression.filter) {
            app.use(morgan('combined', {
                stream: {
                    write: (message) => {
                        global.logger?.info(message.trim());
                    }
                }
            }));
        }
        
        // Body parser
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Trust proxy
        app.set('trust proxy', config.security.trustProxy);
        
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
        app.use('/uploads', express.static(path.join(__dirname, 'uploads'), config.performance.staticCache));
        
        // Middleware para páginas SPA
        app.get('*', (req, res) => {
            if (req.path.startsWith('/api/')) {
                return res.status(404).json({
                    success: false,
                    message: 'API endpoint not found'
                });
            }
            
            // Servir index.html para rutas de frontend
            res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
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
        const https = require('https');
        
        let server;
        
        // Configurar SSL si está disponible
        if (config.security.sslCertPath && config.security.sslKeyPath) {
            try {
                const sslOptions = {
                    key: fs.readFileSync(config.security.sslKeyPath),
                    cert: fs.readFileSync(config.security.sslCertPath)
                };
                
                server = https.createServer(sslOptions, app);
                console.log('🔒 Servidor HTTPS iniciado');
            } catch (error) {
                console.warn('⚠️ Error cargando certificados SSL, usando HTTP:', error.message);
                server = http.createServer(app);
            }
        } else {
            server = http.createServer(app);
        }
        
        // Iniciar servidor
        await new Promise((resolve, reject) => {
            server.listen(config.port, config.host || '0.0.0.0', (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
        
        console.log(`🌐 Servidor escuchando en ${config.host || '0.0.0.0'}:${config.port}`);
        
        return server;
    }

    setupWorkerShutdown(server) {
        const shutdown = (signal) => {
            console.log(`Worker ${cluster.worker.id} recibiendo ${signal}`);
            
            server.close(() => {
                console.log(`Worker ${cluster.worker.id} cerrado`);
                process.exit(0);
            });
            
            // Forzar cierre después del timeout
            setTimeout(() => {
                console.log(`Worker ${cluster.worker.id} forzado a cerrar`);
                process.exit(1);
            }, this.config.errorHandling.gracefulShutdown.forceTimeout);
        };
        
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    setupMonitoring() {
        // Configurar monitoreo de memoria
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            global.logger?.info('System Metrics', {
                memory: memUsage,
                cpu: cpuUsage,
                uptime: process.uptime(),
                workerId: 'master',
                activeWorkers: this.workers.length
            });
            
            // Alertar si el uso de memoria es alto
            const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
            if (memoryUsagePercent > 80) {
                console.warn(`⚠️ Alto uso de memoria: ${memoryUsagePercent.toFixed(2)}%`);
            }
        }, 60000); // Cada minuto
        
        // Configurar monitoreo de workers
        cluster.on('fork', (worker) => {
            console.log(`Worker ${worker.process.pid} iniciado`);
        });
        
        cluster.on('online', (worker) => {
            console.log(`Worker ${worker.process.pid} online`);
        });
        
        cluster.on('listening', (worker, address) => {
            console.log(`Worker ${worker.process.pid} escuchando en ${address.address}:${address.port}`);
        });
        
        cluster.on('disconnect', (worker) => {
            console.log(`Worker ${worker.process.pid} desconectado`);
        });
    }

    setupBackup() {
        const cron = require('node-cron');
        const backupConfig = this.config.backup;
        
        // Programar backup diario
        cron.schedule(backupConfig.schedule, async () => {
            try {
                console.log('🔄 Iniciando backup automático...');
                
                const backupPath = await this.createBackup();
                await this.uploadBackupToS3(backupPath);
                await this.cleanupOldBackups();
                
                console.log('✅ Backup completado exitosamente');
            } catch (error) {
                console.error('❌ Error en backup automático:', error);
            }
        });
        
        console.log(`📅 Backup programado: ${backupConfig.schedule}`);
    }

    async createBackup() {
        const { execSync } = require('child_process');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, 'backups', `laboria-backup-${timestamp}.sql`);
        
        // Crear backup de MySQL
        const dbConfig = this.config.database;
        const command = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} > ${backupPath}`;
        
        execSync(command, { stdio: 'inherit' });
        
        // Comprimir backup
        const gzip = require('zlib');
        const fs = require('fs');
        
        const compressed = await new Promise((resolve, reject) => {
            fs.readFile(backupPath, (err, data) => {
                if (err) reject(err);
                else gzip.gzip(data, { level: 9 }, (err, compressed) => {
                    if (err) reject(err);
                    else resolve(compressed);
                });
            });
        });
        
        const compressedPath = `${backupPath}.gz`;
        fs.writeFileSync(compressedPath, compressed);
        fs.unlinkSync(backupPath); // Eliminar archivo sin comprimir
        
        return compressedPath;
    }

    async uploadBackupToS3(backupPath) {
        const AWS = require('aws-sdk');
        const fs = require('fs');
        
        const s3 = new AWS.S3(this.config.aws.s3);
        
        const fileContent = fs.readFileSync(backupPath);
        const fileName = path.basename(backupPath);
        
        await s3.upload({
            Bucket: this.config.backup.s3Bucket,
            Key: `backups/${fileName}`,
            Body: fileContent,
            ServerSideEncryption: 'AES256'
        }).promise();
        
        // Eliminar archivo local
        fs.unlinkSync(backupPath);
    }

    async cleanupOldBackups() {
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3(this.config.aws.s3);
        
        const retentionDays = this.config.backup.retention;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        const params = {
            Bucket: this.config.backup.s3Bucket,
            Prefix: 'backups/'
        };
        
        const objects = await s3.listObjectsV2(params).promise();
        
        for (const object of objects.Contents) {
            if (new Date(object.LastModified) < cutoffDate) {
                await s3.deleteObject({
                    Bucket: this.config.backup.s3Bucket,
                    Key: object.Key
                }).promise();
                
                console.log(`🗑️ Backup antiguo eliminado: ${object.Key}`);
            }
        }
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
        const shutdownTimeout = this.config.errorHandling.gracefulShutdown.timeout;
        
        setTimeout(() => {
            console.log('Forzando shutdown de workers restantes...');
            for (const worker of this.workers) {
                worker.kill('SIGKILL');
            }
            
            process.exit(0);
        }, shutdownTimeout);
    }

    async gracefulRestart(signal) {
        console.log(`🔄 Iniciando graceful restart (${signal})...`);
        
        // Reiniciar workers uno por uno
        for (const worker of this.workers) {
            const oldWorker = worker;
            const newWorker = cluster.fork({
                WORKER_ID: oldWorker.id
            });
            
            // Esperar a que el nuevo worker esté listo
            await new Promise((resolve) => {
                newWorker.on('listening', resolve);
            });
            
            // Cerrar el worker antiguo
            oldWorker.kill('SIGTERM');
            
            // Reemplazar en la lista
            const index = this.workers.indexOf(oldWorker);
            this.workers[index] = newWorker;
            
            console.log(`Worker ${oldWorker.process.pid} reiniciado`);
        }
        
        console.log('✅ Graceful restart completado');
    }

    logError(error) {
        if (global.logger) {
            global.logger.error('Production Error', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
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
