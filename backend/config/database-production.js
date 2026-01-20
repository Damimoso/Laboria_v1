// =============================================
// CONFIGURACIÓN DE BASE DE DATOS - PRODUCCIÓN LABORIA
// =============================================

const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

// Determinar tipo de base de datos basado en variables de entorno
const dbType = process.env.DB_TYPE || 'mysql'; // 'mysql' o 'postgres'

let connection;

if (dbType === 'postgres') {
    // Configuración PostgreSQL (Render)
    const pgConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'laboria_prod',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    };
    
    connection = new Pool(pgConfig);
    
    // Función para probar conexión PostgreSQL
    async function testConnection() {
        try {
            const client = await connection.connect();
            await client.query('SELECT NOW()');
            client.release();
            console.log('✅ PostgreSQL conectado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error de conexión a PostgreSQL:', error.message);
            return false;
        }
    }
    
    module.exports = {
        pool: connection,
        testConnection,
        type: 'postgres'
    };
    
} else {
    // Configuración MySQL (producción)
    const mysqlConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'laboria_prod',
        charset: 'utf8mb4',
        timezone: '+00:00',
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        connectionLimit: 10,
        queueLimit: 0
    };
    
    const pool = mysql.createPool(mysqlConfig);
    
    // Función para probar conexión MySQL
    async function testConnection() {
        try {
            const conn = await pool.getConnection();
            await conn.ping();
            conn.release();
            console.log('✅ MySQL conectado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error de conexión a MySQL:', error.message);
            return false;
        }
    }
    
    module.exports = {
        pool,
        testConnection,
        type: 'mysql'
    };
}
