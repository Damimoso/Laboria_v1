// =============================================
// CONFIGURACIÓN DE BASE DE DATOS LABORIA
// =============================================

const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

// Configuración de la conexión MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'laboria_db',
    charset: 'utf8mb4',
    timezone: '+00:00',
    connectionLimit: 10,
    queueLimit: 0
};

// Crear pool de conexiones MySQL
const pool = mysql.createPool(dbConfig);

// Base de datos SQLite como fallback
let sqliteDb = null;

// Función para inicializar SQLite fallback
async function initSQLite() {
    try {
        sqliteDb = await open({
            filename: './laboria_fallback.db',
            driver: sqlite3.Database
        });
        
        // Crear tabla de usuarios básica
        await sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT,
                status TEXT DEFAULT 'active',
                email_verified INTEGER DEFAULT 0,
                last_login TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS perfiles_usuario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL UNIQUE,
                foto_perfil TEXT,
                bio TEXT,
                telefono TEXT,
                ubicacion TEXT,
                sitio_web TEXT,
                linkedin_url TEXT,
                github_url TEXT,
                disponibilidad TEXT DEFAULT 'disponible',
                preferencia_trabajo TEXT,
                salario_minimo REAL,
                salario_maximo REAL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Base de datos SQLite fallback inicializada');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando SQLite:', error.message);
        return false;
    }
}

// Función para probar conexión
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a MySQL:', error.message);
        console.log('🔄 Intentando inicializar SQLite fallback...');
        return await initSQLite();
    }
}

// Función para obtener conexión (MySQL o SQLite fallback)
async function getConnection() {
    try {
        // Intentar MySQL primero
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        // Usar SQLite fallback si MySQL falla
        if (sqliteDb) {
            return { sqlite: true, db: sqliteDb };
        }
        throw error;
    }
}

module.exports = {
    pool,
    testConnection,
    getConnection,
    sqliteDb
};
