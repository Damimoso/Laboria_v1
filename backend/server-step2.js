#!/usr/bin/env node

// =============================================
// SERVIDOR LABORIA - PASO 2: HABILITAR API SIMPLES
// =============================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

// Middleware básico
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['https://laboria.onrender.com'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check principal
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'production',
        step: '2 - API Simple Habilitadas'
    });
});

// Health check API
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor Laboria funcionando correctamente',
        data: {
            status: 'healthy',
            version: '1.0.0-step2',
            environment: process.env.NODE_ENV || 'production',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            features: ['Frontend', 'Static Files', 'Simple API']
        }
    });
});

// Servir recursos estáticos del frontend
console.log('🔍 Configurando rutas estáticas...');

const frontendPath = './frontend';
const sharedPath = './shared';

console.log('📁 Frontend path:', frontendPath, 'Existe:', fs.existsSync(frontendPath));
console.log('📁 Shared path:', sharedPath, 'Existe:', fs.existsSync(sharedPath));

if (fs.existsSync(frontendPath)) {
    app.use('/styles', express.static(path.join(frontendPath, 'styles')));
    app.use('/js', express.static(path.join(frontendPath, 'js')));
    app.use('/shared', express.static(sharedPath));
    app.use('/uploads', express.static('./uploads'));
    
    console.log('✅ Rutas estáticas configuradas');
} else {
    console.log('❌ Directorio frontend no encontrado');
}

// Habilitar rutas API simples
console.log('🔧 Habilitando rutas API simples...');

try {
    // Rutas de autenticación simple
    app.use('/api/auth', require('./routes/auth-simple'));
    console.log('✅ Rutas /api/auth habilitadas');
} catch (error) {
    console.log('❌ Error cargando rutas /api/auth:', error.message);
}

// Rutas API adicionales (simuladas por ahora)
app.get('/api/users', (req, res) => {
    res.json({
        success: true,
        message: 'Users API (simulated)',
        data: []
    });
});

app.get('/api/jobs', (req, res) => {
    res.json({
        success: true,
        message: 'Jobs API (simulated)',
        data: []
    });
});

app.get('/api/courses', (req, res) => {
    res.json({
        success: true,
        message: 'Courses API (simulated)',
        data: []
    });
});

// Servir el frontend
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    
    const indexPath = path.join(frontendPath, 'pages', 'index.html');
    console.log('🔍 Buscando index en:', indexPath);
    console.log('📁 Existe:', fs.existsSync(indexPath));
    
    if (fs.existsSync(indexPath)) {
        console.log('✅ Sirviendo index.html');
        res.sendFile(indexPath);
    } else {
        console.log('❌ Frontend no encontrado, sirviendo página de prueba');
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laboria - Servidor Paso 2</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        margin-top: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        min-height: 100vh;
                    }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .status { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
                    .api-test { background: rgba(76, 175, 80, 0.2); padding: 15px; border-radius: 8px; margin: 10px 0; }
                    h1 { font-size: 2.5em; margin-bottom: 20px; }
                    .check { color: #4ade80; font-size: 1.2em; }
                    .api { color: #60a5fa; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 Laboria Server - Paso 2</h1>
                    <div class="status">
                        <p class="check">✅ Servidor funcionando correctamente</p>
                        <p>🔍 Health: <a href="/health" style="color: #4ade80;">/health</a></p>
                        <p>🔍 API Health: <a href="/api/health" style="color: #4ade80;">/api/health</a></p>
                        <p>📊 Environment: ${process.env.NODE_ENV || 'production'}</p>
                        <p>🌐 Port: ${PORT}</p>
                        <p>🕒 Deploy: ${new Date().toISOString()}</p>
                        <p>📂 Frontend path: ${indexPath}</p>
                        <p>📁 Frontend exists: ${fs.existsSync(indexPath)}</p>
                    </div>
                    
                    <div class="api-test">
                        <h3 class="api">🔧 API Endpoints Disponibles</h3>
                        <p><a href="/api/auth/health" style="color: #60a5fa;">GET /api/auth/health</a></p>
                        <p><a href="/api/users" style="color: #60a5fa;">GET /api/users</a></p>
                        <p><a href="/api/jobs" style="color: #60a5fa;">GET /api/jobs</a></p>
                        <p><a href="/api/courses" style="color: #60a5fa;">GET /api/courses</a></p>
                        <p>POST /api/auth/login (simulado)</p>
                        <p>POST /api/auth/register (simulado)</p>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
});

// Error handler
app.use((error, req, res, next) => {
    console.error('❌ Error del servidor:', error);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : error.message
    });
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
    console.log('🌐 Servidor Paso 2 iniciado');
    console.log(`📍 Host: ${HOST}`);
    console.log(`🌐 Puerto: ${PORT}`);
    console.log(`🔍 Health: http://${HOST}:${PORT}/health`);
    console.log(`🔍 API Health: http://${HOST}:${PORT}/api/health`);
    console.log(`📁 Directorio actual: ${process.cwd()}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log('🔧 Características: Frontend + Static Files + Simple API');
});

module.exports = app;
