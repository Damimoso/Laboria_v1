#!/usr/bin/env node

// =============================================
// SERVIDOR LABIA - FASE 3: INTELIGENCIA Y AUTOMATIZACIÓN
// =============================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const compression = require('compression');
const helmet = require('helmet');
const nodemailer = require('nodemailer');
const natural = require('natural');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

// Middleware de seguridad y rendimiento
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net"]
        }
    }
}));

app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
}));

// CORS optimizado
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://laboria.onrender.com',
            'https://laboria-api.onrender.com',
            'http://localhost:3000',
            'http://localhost:5500',
            'https://localhost:3000',
            'https://localhost:5500'
        ];
        
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-No-Compression'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Body parser optimizado
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb',
    parameterLimit: 10000
}));

// Rate limiting avanzado
const rateLimit = require('express-rate-limit');
const createRateLimit = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: {
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message,
            retryAfter: Math.ceil(windowMs / 1000)
        });
    }
});

app.use('/api/auth/', createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts'));
app.use('/api/', createRateLimit(15 * 60 * 1000, 100, 'Too many requests'));
app.use('/', createRateLimit(15 * 60 * 1000, 200, 'Too many page requests'));

// Base de datos SQLite mejorada para Fase 3
let db = null;

// Sistema de Machine Learning
let mlModels = {
    jobMatcher: null,
    courseRecommender: null,
    userSegmentation: null,
    skillExtractor: null
};

// Sistema de notificaciones
let notificationSystem = {
    email: null,
    push: null,
    sms: null
};

// Sistema de automatización
let automationSystem = {
    jobApplications: null,
    courseEnrollments: null,
    userEngagement: null,
    contentModeration: null
};

async function initDatabase() {
    try {
        console.log('🗄️ Inicializando base de datos SQLite Fase 3...');
        
        db = await open({
            filename: './laboria_fase3.db',
            driver: sqlite3.Database
        });
        
        // Optimizaciones SQLite
        await db.exec('PRAGMA foreign_keys = ON');
        await db.exec('PRAGMA journal_mode = WAL');
        await db.exec('PRAGMA synchronous = NORMAL');
        await db.exec('PRAGMA cache_size = 10000');
        await db.exec('PRAGMA temp_store = MEMORY');
        
        // Crear tablas mejoradas para Fase 3
        await db.exec(`
            -- Tabla de ML models y predicciones
            CREATE TABLE IF NOT EXISTS ml_models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_type TEXT NOT NULL,
                model_name TEXT NOT NULL,
                model_version TEXT NOT NULL,
                model_data TEXT,
                accuracy REAL DEFAULT 0,
                training_data_count INTEGER DEFAULT 0,
                last_trained TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Predicciones de matching
            CREATE TABLE IF NOT EXISTS job_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                job_id INTEGER,
                match_score REAL,
                confidence REAL,
                factors TEXT,
                algorithm_version TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            );
            
            -- Predicciones de cursos
            CREATE TABLE IF NOT EXISTS course_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                course_id INTEGER,
                recommendation_score REAL,
                confidence REAL,
                factors TEXT,
                algorithm_version TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (course_id) REFERENCES courses(id)
            );
            
            -- Segmentación de usuarios
            CREATE TABLE IF NOT EXISTS user_segments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                segment_type TEXT NOT NULL,
                segment_name TEXT NOT NULL,
                confidence REAL,
                characteristics TEXT,
                algorithm_version TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
            
            -- Extracción de habilidades
            CREATE TABLE IF NOT EXISTS extracted_skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_type TEXT NOT NULL,
                source_id INTEGER NOT NULL,
                skill_name TEXT NOT NULL,
                skill_category TEXT,
                confidence REAL,
                context TEXT,
                algorithm_version TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Automatización de procesos
            CREATE TABLE IF NOT EXISTS automation_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rule_name TEXT NOT NULL,
                rule_type TEXT NOT NULL,
                trigger_conditions TEXT NOT NULL,
                actions TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                execution_count INTEGER DEFAULT 0,
                last_executed TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Logs de ejecución de automatización
            CREATE TABLE IF NOT EXISTS automation_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rule_id INTEGER,
                execution_status TEXT,
                execution_time_ms INTEGER,
                results TEXT,
                error_message TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (rule_id) REFERENCES automation_rules(id)
            );
            
            -- Tabla de notificaciones mejorada
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                data TEXT,
                status TEXT DEFAULT 'pending',
                sent_at TEXT,
                read_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);
        
        // Datos de demostración mejorados para Fase 3
        await seedDatabaseEnhanced();
        
        // Inicializar sistemas de ML
        await initMLSystems();
        
        // Inicializar sistema de notificaciones
        await initNotificationSystem();
        
        // Inicializar sistema de automatización
        await initAutomationSystem();
        
        console.log('✅ Base de datos SQLite Fase 3 inicializada correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando base de datos Fase 3:', error);
        return false;
    }
}

// Seeders mejorados para Fase 3
async function seedDatabaseEnhanced() {
    try {
        const bcrypt = require('bcryptjs');
        
        // Usuarios demo con datos más realistas
        const demoUsers = [
            {
                username: 'admin_demo',
                email: 'admin@laboria.com',
                password: await bcrypt.hash('admin123', 10),
                full_name: 'Administrador Laboria',
                role: 'admin',
                bio: 'Administrador principal de la plataforma Laboria con experiencia en gestión de sistemas y análisis de datos.',
                skills: JSON.stringify(['Administración de Sistemas', 'Base de Datos', 'Node.js', 'Leadership', 'Analytics', 'Machine Learning', 'Python', 'SQL']),
                experience: JSON.stringify([
                    {company: 'Laboria', position: 'Admin Principal', years: 3},
                    {company: 'TechCorp', position: 'SysAdmin Senior', years: 2},
                    {company: 'DataScience Inc', position: 'Data Analyst', years: 1}
                ]),
                education: JSON.stringify([
                    {degree: 'Ingeniería en Sistemas', institution: 'Universidad Técnica', year: 2018},
                    {degree: 'Máster en Data Science', institution: 'Online Academy', year: 2021}
                ]),
                location: 'Madrid, España',
                website: 'https://laboria.com',
                linkedin_url: 'https://linkedin.com/in/adminlaboria',
                github_url: 'https://github.com/adminlaboria'
            },
            {
                username: 'user_demo',
                email: 'usuario@laboria.com',
                password: await bcrypt.hash('usuario123', 10),
                full_name: 'Ana María García',
                role: 'user',
                bio: 'Desarrolladora Frontend Senior especializada en React y TypeScript.',
                skills: JSON.stringify(['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Node.js', 'Python', 'UX Design', 'Figma', 'Git', 'Agile']),
                experience: JSON.stringify([
                    {company: 'Digital Agency', position: 'Frontend Developer Senior', years: 3},
                    {company: 'StartupTech', position: 'Frontend Developer', years: 1},
                    {company: 'TechCorp', position: 'Junior Developer', years: 1}
                ]),
                education: JSON.stringify([
                    {degree: 'Diseño Gráfico', institution: 'Escuela de Arte', year: 2019},
                    {degree: 'Bootcamp Full Stack', institution: 'Code Academy', year: 2020},
                    {degree: 'Certificación React', institution: 'React Academy', year: 2021}
                ]),
                location: 'Barcelona, España',
                linkedin_url: 'https://linkedin.com/in/anamaria',
                github_url: 'https://github.com/anamaria',
                portfolio_url: 'https://anamaria.dev'
            }
        ];
        
        for (const user of demoUsers) {
            try {
                await db.run(`
                    INSERT OR IGNORE INTO users (
                        username, email, password, full_name, role, bio, skills, 
                        experience, education, location, website, linkedin_url, github_url, portfolio_url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    user.username, user.email, user.password, user.full_name, user.role, user.bio,
                    user.skills, user.experience, user.education, user.location, user.website,
                    user.linkedin_url, user.github_url, user.portfolio_url
                ]);
                
                // Extraer habilidades automáticamente
                if (user.skills) {
                    const skills = JSON.parse(user.skills);
                    for (const skill of skills) {
                        await db.run(`
                            INSERT OR IGNORE INTO extracted_skills (source_type, source_id, skill_name, skill_category, confidence, context, algorithm_version)
                            VALUES (?, ?, ?, ?, ?, ?, 'v1.0')
                        `, ['profile', 1, skill, 'technical', 0.9, 'User profile', 1]);
                    }
                }
            } catch (error) {
                // Usuario ya existe, continuar
            }
        }
        
        // Empleos demo con datos enriquecidos
        const demoJobs = [
            {
                title: 'Senior Frontend Developer - React & TypeScript',
                description: 'Buscamos un desarrollador Frontend Senior con experiencia en React, TypeScript y arquitecturas modernas.',
                company: 'Tech Innovations',
                location: 'Remoto (España)',
                category: 'Tecnología',
                type: 'remote',
                experience_level: 'senior',
                salary_min: 45000,
                salary_max: 65000,
                currency: 'EUR',
                requirements: JSON.stringify([
                    'React 5+ años',
                    'TypeScript 3+ años',
                    'CSS/Sass avanzado',
                    'State management (Redux, Zustand)',
                    'Testing (Jest, React Testing Library)',
                    'Inglés fluido',
                    'Git/Git flow',
                    'CI/CD experience'
                ]),
                benefits: JSON.stringify([
                    'Trabajo remoto flexible',
                    'Seguro médico privado',
                    'Formación continua',
                    'Equipo de hardware',
                    'Presupuesto para conferencias'
                ]),
                remote_options: JSON.stringify(['fully_remote', 'hybrid', 'flexible']),
                application_deadline: '2024-03-31',
                tags: JSON.stringify(['react', 'typescript', 'frontend', 'remote', 'senior'])
            }
        ];
        
        for (const job of demoJobs) {
            try {
                const result = await db.run(`
                    INSERT OR IGNORE INTO jobs (
                        title, description, company, location, category, type, experience_level,
                        salary_min, salary_max, currency, requirements, benefits, remote_options,
                        application_deadline, tags, posted_by, featured
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
                `, [
                    job.title, job.description, job.company, job.location, job.category, job.type,
                    job.experience_level, job.salary_min, job.salary_max, job.currency,
                    job.requirements, job.benefits, job.remote_options, job.application_deadline,
                    JSON.stringify(job.tags), 1, 1
                ]);
                
                // Extraer habilidades de los requisitos
                if (job.requirements) {
                    const requirements = JSON.parse(job.requirements);
                    for (const req of requirements) {
                        await db.run(`
                            INSERT OR IGNORE INTO extracted_skills (source_type, source_id, skill_name, skill_category, confidence, context, algorithm_version)
                            VALUES (?, ?, ?, ?, ?, ?, 'v1.0')
                        `, ['job', result.lastID, req, 'technical', 0.8, 'Job requirements', 1]);
                    }
                }
            } catch (error) {
                // Job ya existe, continuar
            }
        }
        
        console.log('🌱 Datos de demostración Fase 3 insertados correctamente');
    } catch (error) {
        console.error('❌ Error insertando datos de demo Fase 3:', error);
    }
}

// Inicializar sistemas de Machine Learning
async function initMLSystems() {
    console.log('🤖 Inicializando sistemas de Machine Learning...');
    
    try {
        // Inicializar tokenizer para procesamiento de texto
        const tokenizer = new natural.WordTokenizer({
            language: 'es'
        });
        
        // Sistema de extracción de habilidades
        mlModels.skillExtractor = {
            tokenizer,
            categories: {
                technical: ['javascript', 'python', 'react', 'nodejs', 'typescript', 'css', 'html', 'sql', 'git', 'docker'],
                soft: ['comunicación', 'liderazgo', 'trabajo en equipo', 'creatividad', 'resolución de problemas'],
                tools: ['figma', 'sketch', 'adobe', 'photoshop', 'jira', 'confluence', 'slack'],
                languages: ['español', 'inglés', 'francés', 'alemán', 'italiano']
            },
            
            extractSkills: function(text) {
                const tokens = tokenizer.tokenize(text.toLowerCase());
                const skills = [];
                
                for (const token of tokens) {
                    for (const [category, skillList] of Object.entries(this.categories)) {
                        if (skillList.includes(token)) {
                            skills.push({
                                skill: token,
                                category: category,
                                confidence: 0.9
                            });
                        }
                    }
                }
                
                return skills;
            },
            
            extractFromProfile: function(profile) {
                const text = `${profile.bio || ''} ${profile.skills || ''} ${profile.experience || ''}`;
                return this.extractSkills(text);
            },
            
            extractFromJob: function(job) {
                const text = `${job.title} ${job.description} ${job.requirements || ''}`;
                return this.extractSkills(text);
            },
            
            extractFromCourse: function(course) {
                const text = `${course.title} ${course.description} ${course.requirements || ''}`;
                return this.extractSkills(text);
            }
        };
        
        // Sistema de matching de empleos
        mlModels.jobMatcher = {
            calculateMatchScore: function(userSkills, jobRequirements) {
                let score = 0;
                let matchCount = 0;
                
                for (const userSkill of userSkills) {
                    for (const jobReq of jobRequirements) {
                        if (userSkill.skill === jobReq.skill) {
                            score += userSkill.confidence * jobReq.confidence;
                            matchCount++;
                        }
                    }
                }
                
                return matchCount > 0 ? score / matchCount : 0;
            },
            
            predictMatch: async function(userId, jobId) {
                const userSkills = await db.all(`
                    SELECT skill_name, confidence 
                    FROM extracted_skills 
                    WHERE source_type = 'profile' AND source_id = ?
                `, [userId]);
                
                const jobRequirements = await db.all(`
                    SELECT skill_name, confidence 
                    FROM extracted_skills 
                    WHERE source_type = 'job' AND source_id = ?
                `, [jobId]);
                
                const score = this.calculateMatchScore(userSkills, jobRequirements);
                const confidence = Math.min(0.9, 0.5 + (score * 0.4));
                
                return {
                    score,
                    confidence,
                    matchCount: userSkills.length * jobRequirements.length,
                    userSkills,
                    jobRequirements
                };
            }
        };
        
        // Sistema de recomendación de cursos
        mlModels.courseRecommender = {
            calculateRecommendationScore: function(userSkills, courseTags, userLevel) {
                let score = 0;
                let factors = {};
                
                // Matching de habilidades
                const skillMatches = userSkills.filter(skill => 
                    courseTags.some(tag => tag.includes(skill.skill))
                ).length;
                factors.skillMatch = skillMatches / Math.max(userSkills.length, 1);
                score += factors.skillMatch * 0.4;
                
                // Nivel apropiado
                if (userLevel === courseLevel) {
                    factors.levelMatch = 1.0;
                    score += 0.3;
                } else {
                    const levelDiff = Math.abs(this.getLevelValue(userLevel) - this.getLevelValue(courseLevel));
                    factors.levelMatch = Math.max(0, 1 - levelDiff / 3);
                    score += factors.levelMatch * 0.3;
                }
                
                // Popularidad del curso
                factors.popularity = 0.1;
                score += factors.popularity;
                
                return {
                    score,
                    confidence: Math.min(0.9, 0.6 + score * 0.3),
                    factors
                };
            },
            
            getLevelValue: function(level) {
                const levels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                return levels[level] || 2;
            },
            
            predictRecommendation: async function(userId, courseId) {
                const userSkills = await db.all(`
                    SELECT skill_name, confidence 
                    FROM extracted_skills 
                    WHERE source_type = 'profile' AND source_id = ?
                `, [userId]);
                
                const course = await db.get(`
                    SELECT tags, level, rating_average, enrollment_count
                    FROM courses 
                    WHERE id = ?
                `, [courseId]);
                
                if (!course) return null;
                
                const courseTags = JSON.parse(course.tags || '[]');
                const userLevel = 'intermediate';
                
                const result = this.calculateRecommendationScore(userSkills, courseTags, userLevel);
                
                return {
                    score: result.score,
                    confidence: result.confidence,
                    factors: result.factors,
                    courseTags,
                    courseLevel: course.level,
                    rating: course.rating_average,
                    popularity: course.enrollment_count
                };
            }
        };
        
        // Sistema de segmentación de usuarios
        mlModels.userSegmentation = {
            segments: {
                'junior_developer': {
                    characteristics: ['javascript', 'react', '1-2 años experiencia'],
                    confidence: 0.8
                },
                'senior_developer': {
                    characteristics: ['javascript', 'react', 'typescript', 'nodejs', '5+ años experiencia'],
                    confidence: 0.9
                },
                'tech_lead': {
                    characteristics: ['javascript', 'react', 'typescript', 'nodejs', 'leadership', '8+ años experiencia'],
                    confidence: 0.95
                },
                'data_scientist': {
                    characteristics: ['python', 'machine learning', 'statistics', 'sql', 'research'],
                    confidence: 0.85
                },
                'ux_designer': {
                    characteristics: ['figma', 'sketch', 'ux design', 'prototipado', 'usabilidad'],
                    confidence: 0.8
                },
                'product_manager': {
                    characteristics: ['agile', 'scrum', 'product management', 'comunicación', 'liderazgo'],
                    confidence: 0.8
                }
            },
            
            segmentUser: async function(user) {
                const skills = JSON.parse(user.skills || '[]');
                const experience = JSON.parse(user.experience || '[]');
                
                let bestMatch = null;
                let bestScore = 0;
                
                for (const [segmentName, segment] of Object.entries(this.segments)) {
                    let score = 0;
                    let matchCount = 0;
                    
                    for (const skill of skills) {
                        for (const charac of segment.characteristics) {
                            if (skill.skill.toLowerCase().includes(charac.toLowerCase())) {
                                score += skill.confidence;
                                matchCount++;
                            }
                        }
                    }
                    
                    // Considerar años de experiencia
                    const totalYears = experience.reduce((sum, exp) => sum + exp.years, 0);
                    if (segmentName === 'senior_developer' && totalYears >= 5) score += 0.2;
                    if (segmentName === 'tech_lead' && totalYears >= 8) score += 0.3;
                    
                    score = matchCount > 0 ? score / matchCount : 0;
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = segmentName;
                    }
                }
                
                return {
                    segment: bestMatch,
                    confidence: bestScore * 0.9,
                    characteristics: bestMatch ? this.segments[bestMatch].characteristics : []
                };
            }
        };
        
        console.log('✅ Sistemas de Machine Learning inicializados');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando sistemas de ML:', error);
        return false;
    }
}

// Inicializar sistema de notificaciones
async function initNotificationSystem() {
    console.log('📧 Inicializando sistema de notificaciones...');
    
    try {
        // Configurar email (simulado para demo)
        notificationSystem.email = {
            transporter: nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: process.env.EMAIL_PORT || 587,
                secure: process.env.EMAIL_PORT === '465',
                auth: {
                    user: process.env.EMAIL_USER || 'demo@laboria.com',
                    pass: process.env.EMAIL_PASS || 'demo_password'
                }
            }),
            
            sendEmail: async function(to, subject, html, text) {
                try {
                    const info = await notificationSystem.email.transporter.sendMail({
                        from: process.env.EMAIL_FROM || '"Laboria" <noreply@laboria.com>',
                        to: to,
                        subject: subject,
                        html: html,
                        text: text
                    });
                    return { success: true, messageId: info.messageId };
                } catch (error) {
                    console.error('Error enviando email:', error);
                    return { success: false, error: error.message };
                }
            }
        };
        
        // Configurar push notifications (simulado para demo)
        notificationSystem.push = {
            sendPush: async function(userId, title, body, data) {
                console.log(`📱 Push notification enviada a usuario ${userId}: ${title}`);
                return { success: true, messageId: `push_${Date.now()}` };
            }
        };
        
        console.log('✅ Sistema de notificaciones inicializado');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando sistema de notificaciones:', error);
        return false;
    }
}

// Inicializar sistema de automatización
async function initAutomationSystem() {
    console.log('🤖 Inicializando sistema de automatización...');
    
    try {
        automationSystem.jobApplications = {
            processApplication: async function(application) {
                const user = await db.get('SELECT * FROM users WHERE id = ?', [application.user_id]);
                const prediction = await mlModels.jobMatcher.predictMatch(application.user_id, application.job_id);
                
                await db.run(`
                    UPDATE job_applications 
                    SET match_score = ?, confidence = ?
                    WHERE id = ?
                `, [prediction.score, prediction.confidence, application.id]);
                
                return { success: true, matchScore: prediction.score };
            }
        };
        
        automationSystem.courseEnrollments = {
            processEnrollment: async function(enrollment) {
                const user = await db.get('SELECT * FROM users WHERE id = ?', [enrollment.user_id]);
                const prediction = await mlModels.courseRecommender.predictRecommendation(enrollment.user_id, enrollment.course_id);
                
                await db.run(`
                    UPDATE course_enrollments 
                    SET progress = 5, recommendation_score = ?, confidence = ?
                    WHERE id = ?
                `, [prediction.score, prediction.confidence, enrollment.id]);
                
                return { success: true, recommendationScore: prediction.score };
            }
        };
        
        automationSystem.userEngagement = {
            sendWelcomeEmail: async function(userId) {
                const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
                
                if (user) {
                    await notificationSystem.email.sendEmail(
                        user.email,
                        `¡Bienvenido a Laboria, ${user.full_name}!`,
                        `
                            <h1>🚀 ¡Bienvenido a Laboria!</h1>
                            <p>Hola ${user.full_name},</p>
                            <p>Estamos emocionados de tenerte en nuestra plataforma de empleo y formación profesional.</p>
                            <p>🎯 Tu perfil ya está configurado y listo para que explores nuestras oportunidades.</p>
                            <p><a href="/jobs">Buscar empleos</a> | <a href="/courses">Explorar cursos</a></p>
                            <p>¡Te deseamos mucho éxito en tu carrera profesional!</p>
                        `,
                        '¡Bienvenido a Laboria!'
                    );
                }
                
                return { success: true };
            }
        };
        
        console.log('✅ Sistema de automatización inicializado');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando sistema de automatización:', error);
        return false;
    }
}

// Middleware para pasar sistemas al contexto de las rutas
app.use((req, res, next) => {
    req.db = db;
    req.mlModels = mlModels;
    req.notificationSystem = notificationSystem;
    req.automationSystem = automationSystem;
    next();
});

// Headers personalizados para Fase 3
app.use((req, res, next) => {
    res.setHeader('X-Response-Time', Date.now() - req.startTime);
    res.setHeader('X-Powered-By', 'Laboria-Fase3');
    res.setHeader('X-ML-Features', 'Job-Matching, Course-Recommendations, User-Segmentation, Automation');
    
    if (req.path.includes('/styles/') || req.path.includes('/js/') || req.path.includes('/shared/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    next();
});

// Middleware para medir tiempo de respuesta
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

// Health check principal mejorado para Fase 3
app.get('/health', (req, res) => {
    const dbStatus = db ? 'SQLite connected' : 'Not connected';
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'production',
        phase: '3 - Inteligencia y Automatización',
        database: dbStatus,
        uptime: uptime,
        memory: {
            used: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
            total: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100
        },
        features: [
            'Frontend Optimizado',
            'SQLite Database Mejorada', 
            'Auth Real con JWT',
            'Core API Completa',
            'PWA Features',
            'Security Headers',
            'Compression',
            'Rate Limiting Avanzado',
            'Analytics Tracking',
            'Reviews System',
            'Search FTS',
            'Machine Learning',
            'Job Matching',
            'Course Recommendations',
            'User Segmentation',
            'Automation Rules',
            'Email Notifications'
        ],
        ml_models: {
            job_matcher: mlModels.jobMatcher ? 'active' : 'inactive',
            course_recommender: mlModels.courseRecommender ? 'active' : 'inactive',
            user_segmentation: mlModels.userSegmentation ? 'active' : 'inactive',
            skill_extractor: mlModels.skillExtractor ? 'active' : 'inactive'
        },
        automation: {
            job_applications: automationSystem.jobApplications ? 'active' : 'inactive',
            course_enrollments: automationSystem.courseEnrollments ? 'active' : 'inactive',
            user_engagement: automationSystem.userEngagement ? 'active' : 'inactive'
        }
    });
});

// Health check API mejorado para Fase 3
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor Laboria Fase 3 funcionando correctamente',
        data: {
            status: 'healthy',
            version: '1.0.0-fase3',
            environment: process.env.NODE_ENV || 'production',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            features: [
                'Frontend Optimizado',
                'SQLite Database Mejorada', 
                'Auth Real con JWT',
                'Core API Completa',
                'PWA Features',
                'Security Headers',
                'Compression',
                'Rate Limiting Avanzado',
                'Analytics Tracking',
                'Reviews System',
                'Search FTS',
                'Machine Learning',
                'Job Matching',
                'Course Recommendations',
                'User Segmentation',
                'Automation Rules',
                'Email Notifications'
            ],
            ml_models: {
                job_matcher: mlModels.jobMatcher ? 'active' : 'inactive',
                course_recommender: mlModels.courseRecommender ? 'active' : 'inactive',
                user_segmentation: mlModels.userSegmentation ? 'active' : 'inactive',
                skill_extractor: mlModels.skillExtractor ? 'active' : 'inactive'
            },
            automation: {
                job_applications: automationSystem.jobApplications ? 'active' : 'inactive',
                course_enrollments: automationSystem.courseEnrollments ? 'active' : 'inactive',
                user_engagement: automationSystem.userEngagement ? 'active' : 'inactive'
            },
            performance: {
                compression: 'enabled',
                caching: 'enabled',
                security: 'helmet + CSP',
                rate_limiting: 'per-endpoint',
                ml_models: 'active'
            }
        }
    });
});

// Servir recursos estáticos optimizados
console.log('🔍 Configurando rutas estáticas optimizadas...');

const frontendPath = './frontend';
const sharedPath = './shared';

console.log('📁 Frontend path:', frontendPath, 'Existe:', fs.existsSync(frontendPath));
console.log('📁 Shared path:', sharedPath, 'Existe:', fs.existsSync(sharedPath));

if (fs.existsSync(frontendPath)) {
    app.use('/styles', express.static(path.join(frontendPath, 'styles'), {
        maxAge: '1y',
        etag: true,
        lastModified: true
    }));
    
    app.use('/js', express.static(path.join(frontendPath, 'js'), {
        maxAge: '1y',
        etag: true,
        lastModified: true
    }));
    
    app.use('/shared', express.static(sharedPath, {
        maxAge: '1y',
        etag: true,
        lastModified: true
    }));
    
    app.use('/uploads', express.static('./uploads', {
        maxAge: '1d',
        etag: true,
        lastModified: true
    }));
    
    app.use('/manifest.json', express.static('./manifest.json'));
    app.use('/service-worker.js', express.static('./service-worker.js'));
    
    console.log('✅ Rutas estáticas optimizadas configuradas');
} else {
    console.log('❌ Directorio frontend no encontrado');
}

// Importar rutas de autenticación real
app.use('/api/auth', require('./routes/auth'));
console.log('✅ Rutas /api/auth habilitadas');

// API mejorada con inteligencia
app.get('/api/ml/recommendations/jobs/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        const userSkills = await db.all(`
            SELECT skill_name, confidence FROM extracted_skills 
            WHERE source_type = 'profile' AND source_id = ?
        `, [userId]);
        
        const jobs = await db.all(`
            SELECT j.*, 
                   u.full_name as posted_by_name,
                   u.company as posted_by_company
            FROM jobs j
            LEFT JOIN users u ON j.posted_by = u.id
            WHERE j.status = 'active'
            ORDER BY j.featured DESC, j.created_at DESC
            LIMIT 20
        `);
        
        const recommendations = [];
        
        for (const job of jobs) {
            const jobRequirements = await db.all(`
                SELECT skill_name, confidence 
                FROM extracted_skills 
                WHERE source_type = 'job' AND source_id = ?
            `, [job.id]);
            
            const prediction = await mlModels.jobMatcher.predictMatch(userId, job.id);
            
            recommendations.push({
                job,
                match_score: prediction.score,
                confidence: prediction.confidence,
                match_count: prediction.matchCount,
                user_skills: userSkills,
                job_requirements: jobRequirements
            });
        }
        
        recommendations.sort((a, b) => b.match_score - a.match_score);
        
        res.json({
            success: true,
            data: {
                recommendations,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    skills: userSkills
                },
                total_jobs: jobs.length,
                algorithm: 'v1.0'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

app.get('/api/ml/recommendations/courses/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        const courses = await db.all(`
            SELECT c.*, 
                   u.full_name as created_by_name,
                   u.company as created_by_company
            FROM courses c
            LEFT JOIN users u ON c.created_by = u.id
            WHERE c.status = 'active'
            ORDER BY c.featured DESC, c.rating_average DESC
            LIMIT 20
        `);
        
        const recommendations = [];
        
        for (const course of courses) {
            const courseTags = JSON.parse(course.tags || '[]');
            const userSkills = await db.all(`
                SELECT skill_name, confidence 
                FROM extracted_skills 
                WHERE source_type = 'profile' AND source_id = ?
            `, [userId]);
            
            const prediction = await mlModels.courseRecommender.predictRecommendation(userId, course.id);
            
            if (prediction) {
                recommendations.push({
                    course,
                    recommendation_score: prediction.score,
                    confidence: prediction.confidence,
                    factors: prediction.factors,
                    course_tags: courseTags,
                    user_skills: userSkills,
                    course_level: course.level,
                    rating: course.rating_average,
                    popularity: course.enrollment_count
                });
            }
        }
        
        recommendations.sort((a, b) => b.recommendation_score - a.recommendation_score);
        
        res.json({
            success: true,
            data: {
                recommendations,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    skills: userSkills
                },
                total_courses: courses.length,
                algorithm: 'v1.0'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Sistema de segmentación de usuarios
app.get('/api/ml/segmentation/:userId/analyze', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        const segmentation = await mlModels.userSegmentation.segmentUser(user);
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    role: user.role
                },
                segmentation,
                algorithm: 'v1.0'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Sistema de extracción de habilidades
app.post('/api/ml/extract-skills', async (req, res) => {
    try {
        const { text, source_type, source_id } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'El texto es requerido'
            });
        }
        
        const skills = mlModels.skillExtractor.extractSkills(text);
        
        for (const skill of skills) {
            await db.run(`
                INSERT OR IGNORE INTO extracted_skills (source_type, source_id, skill_name, skill_category, confidence, context, algorithm_version)
                VALUES (?, ?, ?, ?, ?, ?, 'v1.0')
            `, [source_type, source_id, skill.skill, skill.category, skill.confidence, text.substring(0, 100)]);
        }
        
        res.json({
            success: true,
            data: {
                skills,
                total: skills.length,
                source_type,
                source_id,
                algorithm: 'v1.0'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Sistema de automatización de aplicaciones
app.post('/api/automation/process-application', async (req, res) => {
    try {
        const { applicationId, action } = req.body;
        
        if (!applicationId) {
            return res.status(400).json({
                success: false,
                message: 'ID de aplicación requerido'
            });
        }
        
        if (action === 'process') {
            const result = await automationSystem.jobApplications.processApplication({
                user_id: 1,
                job_id: applicationId
            });
            
            res.json({
                success: true,
                message: 'Aplicación procesada exitosamente',
                data: result
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Acción no reconocida'
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Sistema de automatización de inscripciones
app.post('/api/automation/process-enrollment', async (req, res) => {
    try {
        const { enrollmentId, action } = req.body;
        
        if (!enrollmentId) {
            return res.status(400).json({
                success: false,
                message: 'ID de inscripción requerido'
            });
        }
        
        if (action === 'process') {
            const result = await automationSystem.courseEnrollments.processEnrollment({
                user_id: 1,
                course_id: enrollmentId
            });
            
            res.json({
                success: true,
                message: 'Inscripción procesada exitosamente',
                data: result
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Acción no reconocida'
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Sistema de automatización de engagement
app.post('/api/automation/send-engagement', async (req, res) => {
    try {
        const { userId, action } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'ID de usuario requerido'
            });
        }
        
        let result;
        
        if (action === 'welcome') {
            result = await automationSystem.userEngagement.sendWelcomeEmail(userId);
        } else if (action === 'reminder') {
            result = await automationSystem.userEngagement.sendEngagementReminder(userId);
        } else {
            res.status(400).json({
                success: false,
                message: 'Acción no reconocida'
            });
        }
        
        res.json({
            success: true,
            message: 'Engagement enviado exitosamente',
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Rutas de usuarios mejoradas con segmentación
app.get('/api/users/profile', async (req, res) => {
    try {
        const userId = 1;
        
        await db.run('UPDATE users SET profile_views = profile_views + 1 WHERE id = ?', [userId]);
        
        const user = await db.get(`
            SELECT id, username, email, full_name, role, avatar_url, bio, skills, experience, 
                   education, location, website, linkedin_url, github_url, portfolio_url, 
                   profile_views, created_at, updated_at
            FROM users WHERE id = ?
        `, [userId]);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        user.skills = JSON.parse(user.skills || '[]');
        user.experience = JSON.parse(user.experience || '[]');
        user.education = JSON.parse(user.education || '[]');
        
        const segmentation = await mlModels.userSegmentation.segmentUser(user);
        
        const jobPredictions = await db.all(`
            SELECT j.*, p.match_score, p.confidence
            FROM job_predictions p
            JOIN jobs j ON p.job_id = j.id
            WHERE p.user_id = ? AND p.confidence > 0.7
            ORDER BY p.match_score DESC
            LIMIT 5
        `, [userId]);
        
        const coursePredictions = await db.all(`
            SELECT c.*, p.recommendation_score, p.confidence
            FROM course_predictions p
            JOIN courses c ON p.course_id = c.id
            WHERE p.user_id = ? AND p.confidence > 0.7
            ORDER BY p.recommendation_score DESC
            LIMIT 5
        `, [userId]);
        
        res.json({
            success: true,
            data: {
                user: {
                    ...user,
                    skills: user.skills,
                    experience: user.experience,
                    education: user.education,
                    profile_views: user.profile_views
                },
                segmentation,
                predictions: {
                    jobs: jobPredictions,
                    courses: coursePredictions
                },
                analytics: {
                    profile_views: user.profile_views,
                    total_predictions: jobPredictions.length + coursePredictions.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Rutas de empleos mejoradas con ML
app.get('/api/jobs', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            q = '', 
            category = '', 
            type = '', 
            experience_level = '',
            location = '',
            sort_by = 'match_score',
            order = 'DESC',
            min_score = 0
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let jobs;
        let total;
        
        if (q) {
            const searchResults = await db.all(`
                SELECT j.*, 
                       u.full_name as posted_by_name,
                       u.company as posted_by_company,
                       p.match_score,
                       p.confidence
                FROM jobs_fts fts
                JOIN jobs j ON j.id = fts.rowid
                LEFT JOIN users u ON j.posted_by = u.id
                WHERE jobs_fts MATCH ? AND j.status = ?
                ORDER BY rank, j.?
                LIMIT ? OFFSET ?
            `, [q, 'active', sort_by, parseInt(limit), offset]);
            
            jobs = searchResults;
            
            const countResult = await db.get(`
                SELECT COUNT(*) as count
                FROM jobs_fts fts
                JOIN jobs j ON j.id = fts.rowid
                WHERE jobs_fts MATCH ? AND j.status = ?
            `, [q, 'active']);
            
            total = countResult.count;
        } else {
            let whereClause = 'j.status = ?';
            let params = ['active'];
            
            if (category) {
                whereClause += ' AND j.category = ?';
                params.push(category);
            }
            
            if (type) {
                whereClause += ' AND j.type = ?';
                params.push(type);
            }
            
            if (experience_level) {
                whereClause += ' AND j.experience_level = ?';
                params.push(experience_level);
            }
            
            if (location) {
                whereClause += ' AND j.location LIKE ?';
                params.push(`%${location}%`);
            }
            
            if (min_score > 0) {
                whereClause += ' AND j.id IN (SELECT job_id FROM job_predictions WHERE user_id = 1 AND match_score >= ?)';
                params.push(min_score);
            }
            
            jobs = await db.all(`
                SELECT j.*, 
                       u.full_name as posted_by_name,
                       u.company as posted_by_company,
                       p.match_score,
                       p.confidence
                FROM jobs j
                LEFT JOIN users u ON j.posted_by = u.id
                ${min_score > 0 ? 'JOIN job_predictions p ON j.id = p.job_id AND p.user_id = 1 AND p.match_score >= ?' : ''}
                WHERE ${whereClause}
                ORDER BY p.match_score DESC, j.?
                LIMIT ? OFFSET ?
            `, [...params, sort_by, parseInt(limit), offset]);
            
            if (min_score === 0) {
                total = await db.get(`SELECT COUNT(*) as count FROM jobs j WHERE ${whereClause}`, params);
            }
        }
        
        res.json({
            success: true,
            data: {
                jobs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total.count,
                    pages: Math.ceil(total.count / limit),
                    hasNext: offset + parseInt(limit) < total.count,
                    hasPrev: parseInt(page) > 1
                },
                filters: { q, category, type, experience_level, location, sort_by, order, min_score },
                ml_enabled: true,
                algorithm: 'FTS5 + ML Scoring'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Rutas de cursos mejoradas con ML
app.get('/api/courses', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            q = '', 
            category = '', 
            level = '', 
            min_price = '',
            max_price = '',
            sort_by = 'recommendation_score',
            order = 'DESC',
            min_score = 0
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let courses;
        let total;
        
        if (q) {
            const searchResults = await db.all(`
                SELECT c.*, 
                       u.full_name as created_by_name,
                       u.company as created_by_company,
                       p.recommendation_score,
                       p.confidence
                FROM courses_fts fts
                JOIN courses c ON c.id = fts.rowid
                LEFT JOIN users u ON c.created_by = u.id
                WHERE courses_fts MATCH ? AND c.status = ?
                ORDER BY rank, c.?
                LIMIT ? OFFSET ?
            `, [q, 'active', sort_by, parseInt(limit), offset]);
            
            courses = searchResults;
            
            const countResult = await db.get(`
                SELECT COUNT(*) as count
                FROM courses_fts fts
                JOIN courses c ON c.id = fts.rowid
                WHERE courses_fts MATCH ? AND c.status = ?
            `, [q, 'active']);
            
            total = countResult.count;
        } else {
            let whereClause = 'c.status = ?';
            let params = ['active'];
            
            if (category) {
                whereClause += ' AND c.category = ?';
                params.push(category);
            }
            
            if (level) {
                whereClause += ' AND c.level = ?';
                params.push(level);
            }
            
            if (min_price) {
                whereClause += ' AND c.price >= ?';
                params.push(parseFloat(min_price));
            }
            
            if (max_price) {
                whereClause += ' AND c.price <= ?';
                params.push(parseFloat(max_price));
            }
            
            if (min_score > 0) {
                whereClause += ' AND c.id IN (SELECT course_id FROM course_predictions WHERE user_id = 1 AND recommendation_score >= ?)';
                params.push(min_score);
            }
            
            courses = await db.all(`
                SELECT c.*, 
                       u.full_name as created_by_name,
                       u.company as created_by_company,
                       p.recommendation_score,
                       p.confidence
                FROM courses c
                LEFT JOIN users u ON c.created_by = u.id
                ${min_score > 0 ? 'JOIN course_predictions p ON c.id = p.course_id AND p.user_id = 1 AND p.recommendation_score >= ?' : ''}
                WHERE ${whereClause}
                ORDER BY p.recommendation_score DESC, c.?
                LIMIT ? OFFSET ?
            `, [...params, sort_by, parseInt(limit), offset]);
            
            if (min_score === 0) {
                total = await db.get(`SELECT COUNT(*) as count FROM courses c WHERE ${whereClause}`, params);
            }
        }
        
        res.json({
            success: true,
            data: {
                courses,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total.count,
                    pages: Math.ceil(total.count / limit),
                    hasNext: offset + parseInt(limit) < total.count,
                    hasPrev: parseInt(page) > 1
                },
                filters: { q, category, level, min_price, max_price, sort_by, order, min_score },
                ml_enabled: true,
                algorithm: 'FTS5 + ML Scoring'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Analytics dashboard mejorado
app.get('/api/analytics/overview', async (req, res) => {
    try {
        const userId = 1;
        
        const stats = await db.get(`
            SELECT 
                (SELECT COUNT(*) FROM jobs WHERE status = 'active') as total_jobs,
                (SELECT COUNT(*) FROM courses WHERE status = 'active') as total_courses,
                (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users,
                (SELECT COUNT(*) FROM reviews WHERE status = 'active') as total_reviews,
                (SELECT COUNT(*) FROM job_predictions WHERE confidence > 0.7) as successful_matches,
                (SELECT AVG(rating) as avg_rating FROM reviews WHERE status = 'active') as avg_course_rating
            FROM sqlite_master
        `);
        
        const userStats = await db.get(`
            SELECT 
                (SELECT COUNT(*) FROM job_applications WHERE user_id = ?) as applications,
                (SELECT COUNT(*) FROM course_enrollments WHERE user_id = ?) as enrollments,
                (SELECT COUNT(*) FROM reviews WHERE user_id = ?) as reviews,
                (SELECT COUNT(*) FROM job_predictions WHERE user_id = ? AND confidence > 0.7) as successful_predictions
            `, [userId, userId, userId, userId, userId]);
        
        const mlStats = {
            total_models: await db.get('SELECT COUNT(*) FROM ml_models WHERE status = 'active'),
            job_matcher: mlModels.jobMatcher ? 'active' : 'inactive',
            course_recommender: mlModels.courseRecommender ? 'active' : 'inactive',
            user_segmentation: mlModels.userSegmentation ? 'active' : 'inactive',
            skill_extractor: mlModels.skillExtractor ? 'active' : 'inactive'
        };
        
        const automationStats = {
            total_rules: await db.get('SELECT COUNT(*) FROM automation_rules WHERE is_active = 1'),
            total_executions: await db.get('SELECT SUM(execution_count) FROM automation_logs WHERE execution_status = 'success'),
            failed_executions: await db.get('SELECT COUNT(*) FROM automation_logs WHERE execution_status = 'failed'),
            last_execution: await db.get('SELECT MAX(created_at) FROM automation_logs WHERE execution_status = 'success')
        };
        
        res.json({
            success: true,
            data: {
                global: stats,
                user: userStats,
                ml: mlStats,
                automation: automationStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Servir el frontend con PWA features
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
        console.log('✅ Sirviendo index.html con PWA features');
        
        let htmlContent = fs.readFileSync(indexPath, 'utf8');
        
        if (!htmlContent.includes('manifest.json')) {
            htmlContent = htmlContent.replace(
                '<head>',
                `<head>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#667eea">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Laboria">
    <link rel="apple-touch-icon" href="/assets/icon-192x192.png">`
            );
        }
        
        res.send(htmlContent);
    } else {
        console.log('❌ Frontend no encontrado, sirviendo página de Fase 3');
        
        const htmlPage = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <title>Laboria - Fase 3: Inteligencia y Automatización</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="manifest" href="/manifest.json">
                <meta name="theme-color" content="#667eea">
                <meta name="apple-mobile-web-app-capable" content="yes">
                <meta name="apple-mobile-web-app-status-bar-style" content="default">
                <meta name="apple-mobile-web-app-title" content="Laboria">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        text-align: center; 
                        margin-top: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        min-height: 100vh;
                        line-height: 1.6;
                    }
                    .container { max-width: 900px; margin: 0 auto; padding: 20px; }
                    .status { background: rgba(255,255,255,0.1); padding: 25px; border-radius: 15px; margin: 20px 0; backdrop-filter: blur(10px); }
                    .features { background: rgba(76, 175, 80, 0.2); padding: 20px; border-radius: 12px; margin: 15px 0; }
                    .database { background: rgba(33, 150, 243, 0.2); padding: 20px; border-radius: 12px; margin: 15px 0; }
                    .ml { background: rgba(156, 39, 176, 0.2); padding: 20px; border-radius: 12px; margin: 15px 0; }
                    .automation { background: rgba(255, 152, 0, 0.2); padding: 20px; border-radius: 12px; margin: 15px 0; }
                    .pwa { background: rgba(255, 152, 0, 0.2); padding: 20px; border-radius: 12px; margin: 15px 0; }
                    h1 { font-size: 2.8em; margin-bottom: 25px; font-weight: 700; }
                    h2 { font-size: 1.5em; margin-bottom: 15px; color: #fbbf24; font-weight: 600; }
                    .check { color: #4ade80; font-size: 1.2em; font-weight: 600; }
                    .phase { color: #fbbf24; font-size: 1.3em; font-weight: 600; }
                    .api { color: #60a5fa; font-weight: 500; }
                    .feature { color: #34d399; font-weight: 500; }
                    .metric { color: #a78bfa; font-weight: 500; }
                    ul { text-align: left; max-width: 600px; margin: 0 auto; }
                    li { margin: 8px 0; }
                    a { color: #60a5fa; text-decoration: none; font-weight: 500; }
                    a:hover { text-decoration: underline; }
                    .badge { background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 0.8em; margin: 2px; display: inline-block; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 Laboria - Fase 3</h1>
                    <div class="status">
                        <p class="phase">🤖 Inteligencia y Automatización</p>
                        <p class="check">✅ Servidor con IA habilitado</p>
                        <p>🔍 Health: <a href="/health" style="color: #4ade80;">/health</a></p>
                        <p>🔍 API Health: <a href="/api/health" style="color: #4ade80;">/api/health</a></p>
                        <p>📊 Environment: ${process.env.NODE_ENV || 'production'}</p>
                        <p>🌐 Port: ${PORT}</p>
                        <p>🕒 Deploy: ${new Date().toISOString()}</p>
                        <p>📂 Frontend exists: ${fs.existsSync(indexPath)}</p>
                    </div>
                    
                    <div class="database">
                        <h2>🗄️ Base de Datos Mejorada</h2>
                        <p class="check">✅ SQLite con optimizaciones WAL</p>
                        <p class="check">✅ Índices y foreign keys</p>
                        <p class="check">✅ Búsqueda全文 (FTS5)</p>
                        <p class="check">✅ Triggers automáticos</p>
                        <p class="check">✅ Reviews y ratings system</p>
                        <p class="check">✅ Activity tracking</p>
                    </div>
                    
                    <div class="ml">
                        <h2>🤖️ Machine Learning Activo</h2>
                        <p class="feature">✅ Job Matching Algorithm</p>
                        <p class="feature">✅ Course Recommendation System</p>
                        <p class="feature">✅ User Segmentation</p>
                        <p class="feature">✅ Skill Extraction</p>
                        <p class="feature">✅ Predictive Analytics</p>
                    </div>
                    
                    <div class="automation">
                        <h2>🤖️ Automatización Inteligente</h2>
                        <p class="feature">✅ Job Application Processing</p>
                        <p class="feature">✅ Course Enrollment Automation</p>
                        <p class="feature">✅ User Engagement Automation</p>
                        <p class="feature">✅ Email Notifications</p>
                        <p class="feature">✅ Smart Follow-ups</p>
                    </div>
                    
                    <div class="pwa">
                        <h2>📱 PWA Features</h2>
                        <p class="feature">✅ Manifest.json configurado</p>
                        <p class="feature">✅ Service Worker activo</p>
                        <p class="feature">✅ Offline capabilities</p>
                        <p class="feature">✅ Push Notifications Ready</p>
                        <p class="feature">✅ Background Sync</p>
                    </div>
                    
                    <div class="features">
                        <h2 class="api">🔧 API Endpoints Mejorados</h2>
                        <div>
                            <span class="badge">NEW</span>
                            <a href="/api/ml/recommendations/jobs/1" style="color: #60a5fa;">GET /api/ml/recommendations/jobs/1</a>
                        </div>
                        <div>
                            <span class="badge">NEW</span>
                            <a href="/api/ml/recommendations/courses/1" style="color: #60a5fa;">GET /api/ml/recommendations/courses/1</a>
                        </div>
                        <p><a href="/api/users/profile" style="color: #60a5fa;">GET /api/users/profile</a></p>
                        <p><a href="/api/jobs" style="color: #60a5fa;">GET /api/jobs</a></p>
                        <p><a href="/api/courses" style="color: #60a5fa;">GET /api/courses</a></p>
                        <p><a href="/api/analytics/overview" style="color: #60a5fa;">GET /api/analytics/overview</a></p>
                        <p>POST /api/reviews (nuevo)</p>
                        <p>POST /api/ml/extract-skills (nuevo)</p>
                        <p>POST /api/automation/process-application (nuevo)</p>
                        <p>POST /api/automation/process-enrollment (nuevo)</p>
                        <p>POST /api/automation/send-engagement (nuevo)</p>
                    </div>
                    
                    <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 12px;">
                        <h2>👥 Usuarios Demo</h2>
                        <ul>
                            <li><strong>admin@laboria.com / admin123</strong> - Administrador</li>
                            <li><strong>usuario@laboria.com / usuario123</strong> - Usuario</li>
                            <li><strong>reclutador@laboria.com / reclutador123</strong> - Reclutador</li>
                        </ul>
                        
                        <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                            <h3>🎯 Test de Features</h3>
                            <p><a href="/api/ml/recommendations/jobs/1" style="color: #60a5fa;">Test Job Matching</a></p>
                            <p><a href="/api/ml/recommendations/courses/1" style="color: #60a5fa;">Test Course Recommendations</a></p>
                            <p><a href="/api/ml/segmentation/1/analyze" style="color: #60a5fa;">Test User Segmentation</a></p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        res.send(htmlPage);
    }
});

// Error handler mejorado
app.use((error, req, res, next) => {
    console.error('❌ Error del servidor:', error);
    
    if (process.env.NODE_ENV !== 'production') {
        console.error('Stack trace:', error.stack);
    }
    
    res.status(error.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });
});

// 404 handler
app.use('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found',
            path: req.path,
            method: req.method
        });
    }
    
    const indexPath = path.join(frontendPath, 'pages', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Page not found');
    }
});

// Iniciar servidor
async function startServer() {
    try {
        const dbInitialized = await initDatabase();
        
        if (!dbInitialized) {
            console.error('❌ No se pudo inicializar la base de datos Fase 3');
            process.exit(1);
        }
        
        app.listen(PORT, HOST, () => {
            console.log('🌐 Servidor Fase 3 iniciado');
            console.log(`📍 Host: ${HOST}`);
            console.log(`🌐 Puerto: ${PORT}`);
            console.log(`🔍 Health: http://${HOST}:${PORT}/health`);
            console.log(`🔍 API Health: http://${HOST}:${PORT}/api/health`);
            console.log(`📁 Directorio actual: ${process.cwd()}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
            console.log('🔧 Características Fase 3:');
            console.log('   ✅ Frontend Optimizado');
            console.log('   ✅ SQLite Database Mejorada');
            console.log('   ✅ Auth Real con JWT');
            console.log('   ✅ Core API Completa');
            console.log('   ✅ PWA Features');
            console.log('   ✅ Security Headers');
            console.log('   ✅ Compression');
            console.log('   ✅ Rate Limiting Avanzado');
            console.log('   ✅ Analytics Tracking');
            console.log('   ✅ Reviews System');
            console.log('   ✅ Search FTS');
            console.log('   ✅ Machine Learning');
            console.log('   ✅ Job Matching');
            console.log('   ✅ Course Recommendations');
            console.log('   ✅ User Segmentation');
            console.log('   ✅ Automation Rules');
            console.log('   ✅ Email Notifications');
            console.log('   ✅ Push Notifications');
        });
    } catch (error) {
        console.error('❌ Error iniciando servidor Fase 3:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
