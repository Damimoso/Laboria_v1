// =============================================
// SERVIDOR SIMPLE LABORIA - MODO DEMO
// =============================================

const http = require('http');
const url = require('url');
const path = require('path');

// =============================================
// UTILIDADES DE VALIDACIÓN
// =============================================

class Validator {
    static sanitizeEmail(email) {
        if (!email || typeof email !== 'string') return '';
        return email.toLowerCase().trim().replace(/[<>]/g, '');
    }
    
    static sanitizeString(str) {
        if (!str || typeof str !== 'string') return '';
        return str.trim().replace(/[<>]/g, '');
    }
    
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static validatePassword(password) {
        if (!password || typeof password !== 'string') return false;
        return password.length >= 6;
    }
    
    static validateName(name) {
        if (!name || typeof name !== 'string') return false;
        return name.length >= 2 && name.length <= 50;
    }
    
    static validateRole(role) {
        const validRoles = ['administrador_master', 'administrador', 'usuario'];
        return validRoles.includes(role);
    }
}

// =============================================
// RATE LIMITING SIMPLE
// =============================================

class RateLimiter {
    constructor() {
        this.requests = new Map();
        this.maxRequests = 10; // Máximo 10 peticiones
        this.windowMs = 60000; // Por minuto
    }
    
    isAllowed(ip) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        if (!this.requests.has(ip)) {
            this.requests.set(ip, []);
        }
        
        const requests = this.requests.get(ip);
        
        // Limpiar peticiones antiguas
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        this.requests.set(ip, validRequests);
        
        // Verificar límite
        if (validRequests.length >= this.maxRequests) {
            return false;
        }
        
        // Agregar petición actual
        validRequests.push(now);
        return true;
    }
}

const rateLimiter = new RateLimiter();

// Usuarios de ejemplo
const usuarios = [
    {
        id: 1,
        nombre: 'Admin Master',
        email: 'CurranteDigital@gmail.com',
        password: 'A.123456-a', // Sin hash para desarrollo
        rol: 'admin_master',
        status: 'active',
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        nombre: 'Usuario Demo',
        email: 'damimoso@gmail.com',
        password: 'A.123456-a', // Sin hash para desarrollo
        rol: 'user',
        status: 'active',
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        nombre: 'Admin Invitado',
        email: 'admin@invitado.com',
        password: 'A.123456-a', // Sin hash para desarrollo
        rol: 'admin_invitado',
        status: 'active',
        created_at: new Date().toISOString()
    }
];

const jobs = [
    {
        id: 1,
        titulo: 'Desarrollador Full Stack',
        empresa: 'Tech Company',
        descripcion: 'Buscamos desarrollador con experiencia en React y Node.js',
        ubicacion: 'Remoto',
        tipo_contrato: 'tiempo_completo',
        modalidad: 'remoto',
        categoria: 'Tecnología',
        salario_minimo: 50000,
        salario_maximo: 80000,
        status: 'active',
        vistas: 150,
        postulaciones_count: 25,
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        titulo: 'Diseñador UX/UI',
        empresa: 'Design Studio',
        descripcion: 'Buscamos diseñador creativo con experiencia en productos digitales',
        ubicacion: 'Madrid',
        tipo_contrato: 'tiempo_completo',
        modalidad: 'presencial',
        categoria: 'Diseño',
        salario_minimo: 35000,
        salario_maximo: 45000,
        status: 'active',
        vistas: 89,
        postulaciones_count: 12,
        created_at: new Date().toISOString()
    }
];

const courses = [
    {
        id: 1,
        titulo: 'Curso de React Avanzado',
        descripcion: 'Aprende React a nivel avanzado con hooks y optimización',
        instructor: 'Juan Pérez',
        duracion: '40 horas',
        nivel: 'avanzado',
        categoria: 'Programación',
        precio: 99.99,
        rating: 4.5,
        inscripciones_count: 150,
        status: 'active',
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        titulo: 'Diseño UX/UI Fundamental',
        descripcion: 'Aprende los fundamentos del diseño de experiencia de usuario',
        instructor: 'María García',
        duracion: '25 horas',
        nivel: 'principiante',
        categoria: 'Diseño',
        precio: 49.99,
        rating: 4.8,
        inscripciones_count: 280,
        status: 'active',
        created_at: new Date().toISOString()
    }
];

// Crear servidor
const server = http.createServer((req, res) => {
    // Obtener IP del cliente
    const clientIP = req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Rate limiting
    if (!rateLimiter.isAllowed(clientIP)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            message: 'Too many requests. Please try again later.',
            error: 'RATE_LIMIT_EXCEEDED'
        }));
        return;
    }
    
    // Configurar CORS para permitir cualquier origen en desarrollo
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // Health check endpoint
    if (path === '/api/health' && method === 'GET') {
        const healthCheck = {
            success: true,
            message: 'Servidor Laboria funcionando correctamente',
            data: {
                status: 'healthy',
                version: '1.1.0',
                environment: 'development',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                features: {
                    authentication: true,
                    rateLimiting: true,
                    validation: true,
                    cors: true
                },
                endpoints: {
                    auth: '/api/auth/login/usuario',
                    health: '/api/health',
                    users: usuarios.length,
                    jobs: jobs.length,
                    courses: courses.length
                }
            }
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(healthCheck, null, 2));
        return;
    }

    // Auth endpoints
    if (path === '/api/auth/login/usuario' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { email, password } = JSON.parse(body);
                
                // Validación de entrada
                if (!email || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Email y contraseña son requeridos',
                        error: 'MISSING_FIELDS'
                    }));
                    return;
                }
                
                // Sanitizar y validar
                const sanitizedEmail = Validator.sanitizeEmail(email);
                const sanitizedPassword = Validator.sanitizeString(password);
                
                if (!Validator.validateEmail(sanitizedEmail)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Email inválido',
                        error: 'INVALID_EMAIL'
                    }));
                    return;
                }
                
                if (!Validator.validatePassword(sanitizedPassword)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'La contraseña debe tener al menos 6 caracteres',
                        error: 'INVALID_PASSWORD'
                    }));
                    return;
                }
                
                // Buscar usuario en el array
                const usuario = usuarios.find(u => u.email === sanitizedEmail && u.password === sanitizedPassword);
                
                if (usuario) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Login exitoso',
                        data: {
                            user: usuario,
                            token: `mock-jwt-token-${usuario.rol}`
                        }
                    }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Credenciales inválidas'
                    }));
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Error en el formato de la solicitud'
                }));
            }
        });
        return;
    }

    // Admin login endpoint
    if (path === '/api/auth/login/admin' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { email, password } = JSON.parse(body);
                
                // Validación de entrada
                if (!email || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Email y contraseña son requeridos',
                        error: 'MISSING_FIELDS'
                    }));
                    return;
                }
                
                // Sanitizar y validar
                const sanitizedEmail = Validator.sanitizeEmail(email);
                const sanitizedPassword = Validator.sanitizeString(password);
                
                if (!Validator.validateEmail(sanitizedEmail)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Email inválido',
                        error: 'INVALID_EMAIL'
                    }));
                    return;
                }
                
                if (!Validator.validatePassword(sanitizedPassword)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'La contraseña debe tener al menos 6 caracteres',
                        error: 'INVALID_PASSWORD'
                    }));
                    return;
                }
                
                // Buscar administrador en el array (solo roles admin)
                const admin = usuarios.find(u => 
                    u.email === sanitizedEmail && 
                    u.password === sanitizedPassword &&
                    (u.rol === 'admin_master' || u.rol === 'admin_invitado')
                );
                
                if (admin) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Login de administrador exitoso',
                        data: {
                            user: admin,
                            token: `mock-jwt-token-${admin.rol}`
                        }
                    }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Credenciales de administrador inválidas'
                    }));
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Error en el formato de la solicitud'
                }));
            }
        });
        return;
    }

    // Logout endpoint
    if (path === '/api/auth/logout' && method === 'POST') {
        console.log('🚪 Procesando logout...');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Sesión cerrada correctamente'
        }));
        return;
    }

    // Verify token endpoint
    if (path === '/api/auth/verify' && method === 'GET') {
        console.log('🔍 Verificando token...');
        
        try {
            // Obtener token del header Authorization
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
            
            if (!token) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Token no proporcionado'
                }));
                return;
            }
            
            // Simulación de verificación de token
            // En producción, aquí se verificaría el JWT real
            if (token === 'mock-jwt-token-admin_master' || token === 'mock-jwt-token-user' || token === 'mock-jwt-token-admin_invitado') {
                let user;
                if (token === 'mock-jwt-token-admin_master') {
                    user = {
                        id: 1,
                        username: 'AdminMaster',
                        email: 'CurranteDigital@gmail.com',
                        rol: 'admin_master',
                        nombre: 'Administrador Master'
                    };
                } else if (token === 'mock-jwt-token-user') {
                    user = {
                        id: 2,
                        username: 'usuario',
                        email: 'Damimoso@gmail.com',
                        rol: 'user',
                        nombre: 'Usuario Regular'
                    };
                } else {
                    user = {
                        id: 3,
                        username: 'admin_invitado',
                        email: 'admin@invitado.com',
                        rol: 'admin_invitado',
                        nombre: 'Administrador Invitado'
                    };
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    user: user
                }));
                return;
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Token inválido'
                }));
                return;
            }
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: 'Error verificando token'
            }));
            return;
        }
    }

    if (path === '/api/auth/register/usuario' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const userData = JSON.parse(body);
                const newUser = {
                    id: usuarios.length + 1,
                    ...userData,
                    rol: 'usuario',
                    status: 'active',
                    created_at: new Date().toISOString()
                };
                usuarios.push(newUser);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Usuario registrado exitosamente',
                    data: {
                        user: newUser,
                        token: 'mock-jwt-token-new-user'
                    }
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Error en el registro'
                }));
            }
        });
        return;
    }

    // Jobs endpoints
    if (path === '/api/jobs' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Empleos obtenidos exitosamente',
            data: {
                jobs: jobs,
                pagination: {
                    current_page: 1,
                    total_pages: 1,
                    total_items: jobs.length,
                    items_per_page: 10
                }
            }
        }));
        return;
    }

    if (path.startsWith('/api/jobs/') && method === 'GET') {
        const jobId = parseInt(path.split('/')[3]);
        const job = jobs.find(j => j.id === jobId);
        
        if (job) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Empleo obtenido exitosamente',
                data: job
            }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: 'Empleo no encontrado'
            }));
        }
        return;
    }

    // Courses endpoints
    if (path === '/api/courses' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Cursos obtenidos exitosamente',
            data: {
                courses: courses,
                pagination: {
                    current_page: 1,
                    total_pages: 1,
                    total_items: courses.length,
                    items_per_page: 10
                }
            }
        }));
        return;
    }

    if (path.startsWith('/api/courses/') && method === 'GET') {
        const courseId = parseInt(path.split('/')[3]);
        const course = courses.find(c => c.id === courseId);
        
        if (course) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Curso obtenido exitosamente',
                data: course
            }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: 'Curso no encontrado'
            }));
        }
        return;
    }

    // Users endpoints
    if (path === '/api/users/profile' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Perfil obtenido exitosamente',
            data: {
                ...users[0],
                profile: {
                    nombre: 'Administrador',
                    apellido: 'Master',
                    bio: 'Administrador principal del sistema Laboria',
                    foto_perfil: null,
                    habilidades: 'Gestión de sistemas, administración, desarrollo',
                    experiencia: '10+ años en gestión de plataformas tecnológicas',
                    disponibilidad: 'inmediata',
                    telefono: '+1234567890'
                }
            }
        }));
        return;
    }

    if (path === '/api/users/stats' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Estadísticas obtenidas exitosamente',
            data: {
                postulaciones: 25,
                inscripciones: 8,
                empleos_publicados: 15,
                cursos_creados: 5,
                perfil_completado: true,
                ultima_actividad: new Date().toISOString()
            }
        }));
        return;
    }

    // Serve frontend files
    if (path === '/' || path === '/index.html') {
        const fs = require('fs');
        const filePath = path.join(__dirname, '../frontend/pages/index.html');
        
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>Frontend no encontrado</h1>');
        }
        return;
    }

    if (path === '/dashboard.html') {
        const fs = require('fs');
        const filePath = path.join(__dirname, '../frontend/pages/dashboard.html');
        
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>Dashboard no encontrado</h1>');
        }
        return;
    }

    // Static files
    if (path.startsWith('/styles/') || path.startsWith('/js/') || path.startsWith('/shared/')) {
        const fs = require('fs');
        const filePath = path.join(__dirname, '../frontend' + path);
        
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath);
            const ext = path.split('.').pop();
            const contentType = {
                'css': 'text/css',
                'js': 'application/javascript',
                'html': 'text/html'
            }[ext] || 'text/plain';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } else {
            res.writeHead(404);
            res.end('File not found');
        }
        return;
    }

    // Dashboard data endpoint
    if (path === '/api/dashboard/stats' && method === 'GET') {
        console.log('📊 Sirviendo estadísticas del dashboard...');
        
        // Verificar autenticación (en producción real)
        const stats = {
            success: true,
            data: {
                usuarios: {
                    total: usuarios.length,
                    activos: usuarios.filter(u => u.status === 'active').length,
                    nuevos: usuarios.filter(u => {
                        const createdAt = new Date(u.created_at);
                        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        return createdAt > weekAgo;
                    }).length
                },
                empleos: {
                    total: jobs.length,
                    activos: jobs.filter(j => j.status === 'active').length,
                    nuevos: jobs.filter(j => {
                        const createdAt = new Date(j.created_at);
                        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        return createdAt > weekAgo;
                    }).length
                },
                cursos: {
                    total: courses.length,
                    activos: courses.filter(c => c.status === 'active').length,
                    nuevos: courses.filter(c => {
                        const createdAt = new Date(c.created_at);
                        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        return createdAt > weekAgo;
                    }).length
                },
                aplicaciones: {
                    total: 156,
                    esta_semana: 23,
                    tasa_exito: 0.67
                },
                actividad: {
                    usuarios_activos_hoy: 89,
                    sesiones_hoy: 234,
                    tiempo_promedio_sesion: 15.5 // minutos
                }
            }
        };
        
        console.log('✅ Estadísticas enviadas:', stats);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats, null, 2));
        return;
    }
    
    // Dashboard activity endpoint
    if (path === '/api/dashboard/activity' && method === 'GET') {
        console.log('📈 Sirviendo actividad del dashboard...');
        
        const activity = [
            {
                tipo: 'usuario_registro',
                descripcion: 'Nuevo usuario registrado',
                usuario: 'María González',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                icon: 'user-plus'
            },
            {
                tipo: 'empleo_publicado',
                descripcion: 'Nuevo empleo publicado',
                detalles: 'Desarrollador Full Stack en TechCorp',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                icon: 'briefcase'
            },
            {
                tipo: 'curso_completado',
                descripcion: 'Curso completado',
                detalles: 'React.js Avanzado por 25 usuarios',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                icon: 'graduation-cap'
            },
            {
                tipo: 'aplicacion_enviada',
                descripcion: 'Nueva aplicación enviada',
                detalles: 'Juan Pérez aplicó a "Diseñador UX"',
                timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                icon: 'file-alt'
            },
            {
                tipo: 'sistema_actualizado',
                descripcion: 'Sistema actualizado',
                detalles: 'Versión 2.1.0 desplegada',
                timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                icon: 'cog'
            }
        ];
        
        const response = {
            success: true,
            data: activity
        };
        
        console.log('✅ Actividad enviada:', response);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        return;
    }

    // File upload endpoint
    if (path === '/upload' && method === 'POST') {
        const contentType = req.headers['content-type'];
        
        if (!contentType || !contentType.includes('multipart/form-data')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: 'Content-Type debe ser multipart/form-data',
                error: 'INVALID_CONTENT_TYPE'
            }));
            return;
        }

        // Simular procesamiento de archivo
        const uploadResponse = {
            success: true,
            message: 'Archivo subido correctamente',
            data: {
                filename: `archivo_${Date.now()}.jpg`,
                originalName: 'cv_usuario.jpg',
                size: 1024000, // 1MB
                type: 'image/jpeg',
                url: `/uploads/cv_usuario_${Date.now()}.jpg`,
                uploadedAt: new Date().toISOString()
            }
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(uploadResponse, null, 2));
        return;
    }

    // Default response
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        success: false,
        message: 'Endpoint no encontrado',
        path: path,
        method: method
    }));
});

// Iniciar servidor
const PORT = 3000;
server.listen(PORT, () => {
    console.log('');
    console.log('🚀 ===============================================');
    console.log('🚀     LABORIA - SISTEMA DE EMPLEO Y CURSOS');
    console.log('🚀 ===============================================');
    console.log('');
    console.log('🌐 Servidor iniciado en http://localhost:' + PORT);
    console.log('📋 Administrador Master configurado:');
    console.log('📧 Email: CurranteDigital@gmail.com');
    console.log('🔑 Password: A.123456-a');
    console.log('👤 Username: AdminMaster');
    console.log('🎯 Rol: Administrador Master');
    console.log('');
    console.log('📱 URLs de acceso:');
    console.log('🏠 Login: http://localhost:' + PORT + '/');
    console.log('📊 Dashboard: http://localhost:' + PORT + '/dashboard.html');
    console.log('💚 Health: http://localhost:' + PORT + '/api/health');
    console.log('📚 API: http://localhost:' + PORT + '/api');
    console.log('');
    console.log('🔧 Características disponibles:');
    console.log('• 👤 Login y registro de usuarios');
    console.log('• 💼 Listado y detalles de empleos');
    console.log('• 🎓 Listado y detalles de cursos');
    console.log('• 📊 Dashboard con estadísticas');
    console.log('• 🔐 Sistema de autenticación');
    console.log('• 📱 Interfaz responsive');
    console.log('');
    console.log('🎉 Sistema listo para usar!');
    console.log('🔧 Presiona Ctrl+C para detener el servidor');
    console.log('');
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
    });
});
