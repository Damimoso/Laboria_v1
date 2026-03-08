// =============================================
// RUTAS DE AUTENTICACIÓN - LABORIA FASE 6 NEXT-GEN
// =============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Obtener la base de datos SQLite del servidor principal
let db;
const getDatabase = () => {
    if (!db) {
        // Intentar obtener la db del contexto global o del servidor
        if (global.db) {
            db = global.db;
        } else {
            throw new Error('Database not available');
        }
    }
    return db;
};

// Middleware para validación
const validateAuth = (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son obligatorios'
        });
    }
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Email inválido'
        });
    }
    
    next();
};

// Registro de usuario
router.post('/register/usuario', validateAuth, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const database = getDatabase();
        
        // Verificar si el usuario ya existe
        const existingUser = await database.get(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El email o nombre de usuario ya está registrado'
            });
        }
        
        // Hash de contraseña
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Insertar nuevo usuario
        const result = await database.run(
            'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, 'user', 'active']
        );
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: result.lastID,
                email: email,
                role: 'user'
            },
            process.env.JWT_SECRET || 'laboria_secret_key_fase6',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token: token,
            user: {
                id: result.lastID,
                username: username,
                email: email,
                role: 'user'
            }
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login de usuario
router.post('/login/usuario', validateAuth, async (req, res) => {
    try {
        const { email, password } = req.body;
        const database = getDatabase();
        
        // Buscar usuario por email
        const user = await database.get(
            'SELECT id, username, email, password, role, status FROM users WHERE email = ?',
            [email]
        );
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        // Verificar estado del usuario
        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Cuenta desactivada o suspendida'
            });
        }
        
        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'laboria_secret_key_fase6',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login exitoso',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login de administrador
router.post('/login/admin', validateAuth, async (req, res) => {
    try {
        const { email, password } = req.body;
        const database = getDatabase();
        
        // Buscar administrador por email
        const admin = await database.get(
            'SELECT id, username, email, password, role, status FROM users WHERE email = ? AND role = ?',
            [email, 'admin']
        );
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales de administrador inválidas'
            });
        }
        
        // Verificar estado del administrador
        if (admin.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Cuenta de administrador desactivada'
            });
        }
        
        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales de administrador inválidas'
            });
        }
        
        // Generar token JWT para administrador
        const token = jwt.sign(
            { 
                userId: admin.id,
                email: admin.email,
                role: admin.role
            },
            process.env.JWT_SECRET || 'laboria_secret_key_fase6',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login de administrador exitoso',
            token: token,
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
        
    } catch (error) {
        console.error('Error en login admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Verificar token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'laboria_secret_key_fase6');
        const database = getDatabase();
        
        // Verificar que el usuario aún existe y está activo
        const user = await database.get(
            'SELECT id, username, email, role, status FROM users WHERE id = ?',
            [decoded.userId]
        );
        
        if (!user || user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o usuario inactivo'
            });
        }
        
        res.json({
            success: true,
            message: 'Token válido',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Error en verificación de token:', error);
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        // Aquí podríamos implementar blacklist de tokens si fuera necesario
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
        
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
});

module.exports = router;
