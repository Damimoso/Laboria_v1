#!/usr/bin/env node

// =============================================
// SERVIDOR LABORIA - FASE 1: CORE API ESTABLE
// =============================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

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

// Base de datos SQLite para Fase 1
let db = null;

// Inicializar base de datos SQLite
async function initDatabase() {
    try {
        console.log('🗄️ Inicializando base de datos SQLite...');
        
        db = await open({
            filename: './laboria_fase1.db',
            driver: sqlite3.Database
        });
        
        // Crear tablas básicas
        await db.exec(`
            -- Usuarios
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'user',
                status TEXT DEFAULT 'active',
                email_verified INTEGER DEFAULT 0,
                avatar_url TEXT,
                bio TEXT,
                skills TEXT, -- JSON array
                experience TEXT, -- JSON array
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Empleos
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                category TEXT,
                type TEXT, -- full-time, part-time, remote, etc.
                experience_level TEXT,
                salary_min REAL,
                salary_max REAL,
                requirements TEXT, -- JSON array
                posted_by INTEGER,
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (posted_by) REFERENCES users(id)
            );
            
            -- Cursos
            CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                instructor TEXT,
                category TEXT,
                level TEXT, -- beginner, intermediate, advanced
                duration_hours INTEGER,
                price REAL,
                thumbnail_url TEXT,
                requirements TEXT, -- JSON array
                created_by INTEGER,
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );
            
            -- Aplicaciones a empleos
            CREATE TABLE IF NOT EXISTS job_applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                job_id INTEGER,
                cover_letter TEXT,
                resume_url TEXT,
                status TEXT DEFAULT 'pending',
                applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            );
            
            -- Inscripciones a cursos
            CREATE TABLE IF NOT EXISTS course_enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                course_id INTEGER,
                progress INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
                completed_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (course_id) REFERENCES courses(id)
            );
        `);
        
        // Crear datos de demostración
        await seedDatabase();
        
        console.log('✅ Base de datos SQLite inicializada correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error);
        return false;
    }
}

// Seeders básicos para demostración
async function seedDatabase() {
    try {
        // Insertar usuarios demo
        const bcrypt = require('bcryptjs');
        
        const demoUsers = [
            {
                username: 'admin_demo',
                email: 'admin@laboria.com',
                password: await bcrypt.hash('admin123', 10),
                full_name: 'Administrador Demo',
                role: 'admin'
            },
            {
                username: 'user_demo',
                email: 'usuario@laboria.com',
                password: await bcrypt.hash('usuario123', 10),
                full_name: 'Usuario Demo',
                role: 'user',
                skills: JSON.stringify(['JavaScript', 'Node.js', 'React']),
                experience: JSON.stringify([{company: 'Tech Corp', position: 'Developer', years: 2}])
            },
            {
                username: 'company_demo',
                email: 'empresa@laboria.com',
                password: await bcrypt.hash('empresa123', 10),
                full_name: 'Empresa Demo',
                role: 'company'
            }
        ];
        
        for (const user of demoUsers) {
            try {
                await db.run(`
                    INSERT OR IGNORE INTO users (username, email, password, full_name, role, skills, experience)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [user.username, user.email, user.password, user.full_name, user.role, user.skills, user.experience]);
            } catch (error) {
                // Usuario ya existe, continuar
            }
        }
        
        // Insertar empleos demo
        const demoJobs = [
            {
                title: 'Desarrollador Frontend Senior',
                description: 'Buscamos un desarrollador frontend con experiencia en React y TypeScript.',
                company: 'Tech Innovations',
                location: 'Remoto',
                category: 'Tecnología',
                type: 'remote',
                experience_level: 'senior',
                salary_min: 50000,
                salary_max: 80000,
                requirements: JSON.stringify(['React', 'TypeScript', 'CSS', '5+ años experiencia'])
            },
            {
                title: 'Diseñador UX/UI',
                description: 'Empresa en crecimiento busca diseñador creativo con experiencia en productos digitales.',
                company: 'Creative Studio',
                location: 'Madrid',
                category: 'Diseño',
                type: 'full-time',
                experience_level: 'intermediate',
                salary_min: 35000,
                salary_max: 45000,
                requirements: JSON.stringify(['Figma', 'Adobe XD', 'Prototipado', '3+ años experiencia'])
            }
        ];
        
        for (const job of demoJobs) {
            try {
                await db.run(`
                    INSERT OR IGNORE INTO jobs (title, description, company, location, category, type, experience_level, salary_min, salary_max, requirements, posted_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `, [job.title, job.description, job.company, job.location, job.category, job.type, job.experience_level, job.salary_min, job.salary_max, job.requirements]);
            } catch (error) {
                // Job ya existe, continuar
            }
        }
        
        // Insertar cursos demo
        const demoCourses = [
            {
                title: 'React Avanzado: De Junior a Senior',
                description: 'Curso completo que te llevará de nivel junior a senior en React.',
                instructor: 'Juan Pérez',
                category: 'Programación',
                level: 'intermediate',
                duration_hours: 40,
                price: 199.99,
                requirements: JSON.stringify(['JavaScript básico', 'HTML/CSS', 'React básico'])
            },
            {
                title: 'UX Design para Principiantes',
                description: 'Aprende los fundamentos del diseño de experiencia de usuario desde cero.',
                instructor: 'María García',
                category: 'Diseño',
                level: 'beginner',
                duration_hours: 25,
                price: 99.99,
                requirements: JSON.stringify(['No se requiere experiencia previa'])
            }
        ];
        
        for (const course of demoCourses) {
            try {
                await db.run(`
                    INSERT OR IGNORE INTO courses (title, description, instructor, category, level, duration_hours, price, requirements, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
                `, [course.title, course.description, course.instructor, course.category, course.level, course.duration_hours, course.price, course.requirements]);
            } catch (error) {
                // Course ya existe, continuar
            }
        }
        
        console.log('🌱 Datos de demostración insertados correctamente');
    } catch (error) {
        console.error('❌ Error insertando datos de demo:', error);
    }
}

// Middleware para pasar la base de datos a las rutas
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Health check principal
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'production',
        phase: '1 - Core API Estable',
        database: db ? 'SQLite connected' : 'Not connected'
    });
});

// Health check API
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor Laboria Fase 1 funcionando correctamente',
        data: {
            status: 'healthy',
            version: '1.0.0-fase1',
            environment: process.env.NODE_ENV || 'production',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            features: ['Frontend', 'Static Files', 'SQLite Database', 'Auth Real', 'Core API']
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

// Importar rutas de autenticación real
app.use('/api/auth', require('./routes/auth'));
console.log('✅ Rutas /api/auth habilitadas');

// Rutas de usuarios simplificadas
app.get('/api/users/profile', async (req, res) => {
    try {
        const userId = 1; // Demo user
        const user = await db.get('SELECT id, username, email, full_name, role, avatar_url, bio, skills, experience FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Rutas de empleos
app.get('/api/jobs', async (req, res) => {
    try {
        const { page = 1, limit = 10, q = '', category = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'status = ?';
        let params = ['active'];
        
        if (q) {
            whereClause += ' AND (title LIKE ? OR description LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }
        
        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }
        
        const jobs = await db.all(`
            SELECT id, title, description, company, location, category, type, experience_level, salary_min, salary_max, created_at
            FROM jobs 
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        
        const total = await db.get(`SELECT COUNT(*) as count FROM jobs WHERE ${whereClause}`, params);
        
        res.json({
            success: true,
            data: {
                jobs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total.count,
                    pages: Math.ceil(total.count / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Rutas de cursos
app.get('/api/courses', async (req, res) => {
    try {
        const { page = 1, limit = 10, q = '', category = '', level = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'status = ?';
        let params = ['active'];
        
        if (q) {
            whereClause += ' AND (title LIKE ? OR description LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }
        
        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }
        
        if (level) {
            whereClause += ' AND level = ?';
            params.push(level);
        }
        
        const courses = await db.all(`
            SELECT id, title, description, instructor, category, level, duration_hours, price, thumbnail_url, created_at
            FROM courses 
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        
        const total = await db.get(`SELECT COUNT(*) as count FROM courses WHERE ${whereClause}`, params);
        
        res.json({
            success: true,
            data: {
                courses,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total.count,
                    pages: Math.ceil(total.count / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
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
        console.log('❌ Frontend no encontrado, sirviendo página de Fase 1');
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laboria - Fase 1: Core API Estable</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        margin-top: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        min-height: 100vh;
                    }
                    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                    .status { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
                    .features { background: rgba(76, 175, 80, 0.2); padding: 15px; border-radius: 8px; margin: 10px 0; }
                    .database { background: rgba(33, 150, 243, 0.2); padding: 15px; border-radius: 8px; margin: 10px 0; }
                    h1 { font-size: 2.5em; margin-bottom: 20px; }
                    .check { color: #4ade80; font-size: 1.2em; }
                    .phase { color: #fbbf24; font-size: 1.1em; }
                    .api { color: #60a5fa; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 Laboria - Fase 1</h1>
                    <div class="status">
                        <p class="phase">📈 Core API Estable</p>
                        <p class="check">✅ Servidor funcionando correctamente</p>
                        <p>🔍 Health: <a href="/health" style="color: #4ade80;">/health</a></p>
                        <p>🔍 API Health: <a href="/api/health" style="color: #4ade80;">/api/health</a></p>
                        <p>📊 Environment: ${process.env.NODE_ENV || 'production'}</p>
                        <p>🌐 Port: ${PORT}</p>
                        <p>🕒 Deploy: ${new Date().toISOString()}</p>
                        <p>📂 Frontend path: ${indexPath}</p>
                        <p>📁 Frontend exists: ${fs.existsSync(indexPath)}</p>
                    </div>
                    
                    <div class="database">
                        <h3>🗄️ Base de Datos SQLite</h3>
                        <p>✅ Conectada y funcional</p>
                        <p>🌱 Datos de demostración insertados</p>
                        <p>👥 Usuarios demo: admin@laboria.com / admin123</p>
                        <p>👥 Usuarios demo: usuario@laboria.com / usuario123</p>
                    </div>
                    
                    <div class="features">
                        <h3 class="api">🔧 API Endpoints Disponibles</h3>
                        <p><a href="/api/auth/health" style="color: #60a5fa;">GET /api/auth/health</a></p>
                        <p><a href="/api/users/profile" style="color: #60a5fa;">GET /api/users/profile</a></p>
                        <p><a href="/api/jobs" style="color: #60a5fa;">GET /api/jobs</a></p>
                        <p><a href="/api/courses" style="color: #60a5fa;">GET /api/courses</a></p>
                        <p>POST /api/auth/login (real con SQLite)</p>
                        <p>POST /api/auth/register (real con SQLite)</p>
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
async function startServer() {
    try {
        // Inicializar base de datos primero
        const dbInitialized = await initDatabase();
        
        if (!dbInitialized) {
            console.error('❌ No se pudo inicializar la base de datos');
            process.exit(1);
        }
        
        app.listen(PORT, HOST, () => {
            console.log('🌐 Servidor Fase 1 iniciado');
            console.log(`📍 Host: ${HOST}`);
            console.log(`🌐 Puerto: ${PORT}`);
            console.log(`🔍 Health: http://${HOST}:${PORT}/health`);
            console.log(`🔍 API Health: http://${HOST}:${PORT}/api/health`);
            console.log(`📁 Directorio actual: ${process.cwd()}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
            console.log('🔧 Características: Frontend + SQLite Database + Real Auth + Core API');
        });
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
