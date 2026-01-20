#!/usr/bin/env node

// =============================================
// SCRIPT DE INICIO - PRODUCCIÓN LABORIA
// =============================================

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando Laboria en modo producción...\n');

// Verificar variables de entorno
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

// Determinar qué servidor usar
const useProductionServer = process.env.USE_PRODUCTION_SERVER === 'true';
const serverFile = useProductionServer ? 'server-production.js' : 'server.js';

console.log(`📋 Configuración:`);
console.log(`   - Modo: ${process.env.NODE_ENV}`);
console.log(`   - Servidor: ${serverFile}`);
console.log(`   - Puerto: ${process.env.PORT || 10000}`);
console.log(`   - Base de datos: ${process.env.DB_TYPE || 'mysql'}`);
console.log('');

// Verificar archivos críticos
const requiredFiles = [
    'package.json',
    'server.js',
    'config/database.js',
    '.env.production'
];

console.log('🔍 Verificando archivos críticos...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} - NO ENCONTRADO`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.error('\n❌ Faltan archivos críticos. Abortando inicio.');
    process.exit(1);
}

console.log('\n🔄 Iniciando servidor...');

// Iniciar el servidor
const serverProcess = spawn('node', [serverFile], {
    stdio: 'inherit',
    env: {
        ...process.env,
        NODE_ENV: 'production'
    },
    cwd: __dirname
});

// Manejar salida del proceso
serverProcess.on('close', (code) => {
    console.log(`\n📊 Servidor terminado con código: ${code}`);
    
    if (code !== 0) {
        console.error('❌ El servidor terminó con errores');
        process.exit(code);
    }
});

// Manejar señales de terminación
process.on('SIGINT', () => {
    console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
    serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
    serverProcess.kill('SIGTERM');
});

console.log(`📍 Servidor iniciado con PID: ${serverProcess.pid}`);
console.log('🌐 La aplicación estará disponible en breve...\n');
