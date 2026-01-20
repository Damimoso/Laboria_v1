// =============================================
// SERVIDOR PRINCIPAL LABORIA
// =============================================

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar configuración
const { testConnection } = require('./config/database');
const { BACKEND_CONFIG, helpers } = require('./config/constants');
const authRoutes = require('./routes/auth-simulated'); // Usar auth simulada
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const courseRoutes = require('./routes/courses');
const SocketServer = require('./websocket/socketServer');

// Crear aplicación Express
const app = express();

// Crear servidor HTTP
const server = http.createServer(app);

// Inicializar servidor WebSocket
const socketServer = new SocketServer(server);

// Middleware de seguridad
app.use(helmet(BACKEND_CONFIG.SECURITY.HELMET));

// Configuración de CORS
app.use(cors({
    origin: BACKEND_CONFIG.SECURITY.CORS_ORIGINS,
    credentials: true,
    methods: BACKEND_CONFIG.SECURITY.ALLOWED_METHODS,
    allowedHeaders: BACKEND_CONFIG.SECURITY.ALLOWED_HEADERS
}));

// Middleware de logging
app.use(morgan(BACKEND_CONFIG.LOGGING.FORMAT));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit(BACKEND_CONFIG.SECURITY.RATE_LIMIT);
app.use('/api/', limiter);

// Servir archivos estáticos del frontend
if (BACKEND_CONFIG.STATIC.SERVE_FRONTEND) {
    app.use(express.static(BACKEND_CONFIG.STATIC.FRONTEND_PATH, {
        maxAge: BACKEND_CONFIG.STATIC.MAX_AGE
    }));
}

// =============================================
// RUTAS DE LA API
// =============================================

// Health check
app.get('/api/health', (req, res) => {
    helpers.sendSuccess(res, {
        status: 'healthy',
        version: '1.0.0',
        environment: BACKEND_CONFIG.SERVER.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    }, 'Servidor Laboria funcionando correctamente');
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de usuarios
app.use('/api/users', userRoutes);

// Rutas de empleos
app.use('/api/jobs', jobRoutes);

// Rutas de cursos
app.use('/api/courses', courseRoutes);

// =============================================
// MANEJO DE ERRORES
// =============================================

// Error 404
app.use('*', (req, res) => {
    helpers.sendError(res, new Error('Ruta no encontrada'), 404);
});

// Error general
app.use((error, req, res, next) => {
    console.error('❌ Error del servidor:', error);
    helpers.sendError(res, error, error.status || 500);
});

// =============================================
// INICIALIZACIÓN DEL SERVIDOR
// =============================================

async function startServer() {
    try {
        // Probar conexión a base de datos
        console.log('🔍 Verificando conexión a base de datos...');
        const dbConnected = await testConnection();
        
        if (dbConnected) {
            console.log('✅ Base de datos conectada correctamente');
        } else {
            console.log('⚠️ Error en conexión a base de datos, pero el servidor continuará funcionando');
        }
        
        // Iniciar servidor
        const serverInstance = server.listen(BACKEND_CONFIG.SERVER.PORT, BACKEND_CONFIG.SERVER.HOST, () => {
            console.log('🚀 Servidor Laboria iniciado correctamente');
            console.log(`📍 Servidor corriendo en: http://${BACKEND_CONFIG.SERVER.HOST}:${BACKEND_CONFIG.SERVER.PORT}/api`);
            console.log(`🌐 Frontend disponible en: http://${BACKEND_CONFIG.SERVER.HOST}:${BACKEND_CONFIG.SERVER.PORT}/pages/index.html`);
            console.log(`💚 Health check: http://${BACKEND_CONFIG.SERVER.HOST}:${BACKEND_CONFIG.SERVER.PORT}/api/health`);
            console.log(`🔌 WebSocket disponible en: ws://${BACKEND_CONFIG.SERVER.HOST}:${BACKEND_CONFIG.SERVER.PORT}`);
            console.log('');
            console.log('📋 Rutas disponibles:');
            console.log('   👤 Login Usuario: POST /api/auth/login/usuario');
            console.log('   👤 Login Admin: POST /api/auth/login/admin');
            console.log('   📝 Registro: POST /api/auth/register/usuario');
            console.log('   👤 Perfil: GET /api/users/profile');
            console.log('   📷 Upload Avatar: POST /api/users/upload-avatar');
            console.log('   💼 Empleos: GET /api/jobs');
            console.log('   📄 Crear Empleo: POST /api/jobs');
            console.log('   🎓 Cursos: GET /api/courses');
            console.log('   📚 Crear Curso: POST /api/courses');
            console.log('   💚 Health: GET /api/health');
            console.log('');
            console.log(`🌍 Ambiente: ${BACKEND_CONFIG.SERVER.NODE_ENV}`);
            console.log(`🔧 Modo desarrollo: ${helpers.isDevelopment()}`);
            console.log(`🔌 Usuarios conectados: ${socketServer.getStats().connectedUsers}`);
        });

        // Iniciar heartbeat de WebSocket
        socketServer.startHeartbeat();

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('🛑 SIGTERM recibido, cerrando servidor...');
            serverInstance.close(() => {
                console.log('✅ Servidor cerrado');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('🛑 SIGINT recibido, cerrando servidor...');
            serverInstance.close(() => {
                console.log('✅ Servidor cerrado');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
}

// Iniciar servidor
startServer();
