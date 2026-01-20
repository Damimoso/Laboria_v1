// =============================================
// RUTAS DE AUTENTICACIÓN - LABORIA
// =============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const router = express.Router();

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
        
        // Verificar si el usuario ya existe
        const [existingUsers] = await pool.execute(
            'SELECT id FROM usuarios WHERE email = ? OR username = ?',
            [email, username]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email o nombre de usuario ya está registrado'
            });
        }
        
        // Hash de contraseña
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Insertar nuevo usuario
        const [result] = await pool.execute(
            'INSERT INTO usuarios (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, 'user', 'active']
        );
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: result.insertId,
                email: email,
                role: 'user'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token: token,
            user: {
                id: result.insertId,
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
        
        // Buscar usuario por email
        const [users] = await pool.execute(
            'SELECT id, username, email, password, role, status FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        const user = users[0];
        
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
        
        // Actualizar último login
        await pool.execute(
            'UPDATE usuarios SET last_login = NOW() WHERE id = ?',
            [user.id]
        );
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
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
        
        // Buscar usuario con rol admin
        const [users] = await pool.execute(
            'SELECT id, username, email, password, role, status FROM usuarios WHERE email = ? AND role = ?',
            [email, 'admin']
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales de administrador inválidas'
            });
        }
        
        const user = users[0];
        
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
                message: 'Credenciales de administrador inválidas'
            });
        }
        
        // Actualizar último login
        await pool.execute(
            'UPDATE usuarios SET last_login = NOW() WHERE id = ?',
            [user.id]
        );
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login de administrador exitoso',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
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
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el usuario aún existe y está activo
        const [users] = await pool.execute(
            'SELECT id, username, email, role, status FROM usuarios WHERE id = ?',
            [decoded.userId]
        );
        
        if (users.length === 0 || users[0].status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o usuario inactivo'
            });
        }
        
        res.json({
            success: true,
            message: 'Token válido',
            user: {
                id: users[0].id,
                username: users[0].username,
                email: users[0].email,
                role: users[0].role
            }
        });
        
    } catch (error) {
        console.error('Error en verificación:', error);
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
});

// Logout (client-side mainly, but we can track if needed)
router.post('/logout', async (req, res) => {
    try {
        // Aquí podríamos implementar blacklist de tokens si fuera necesario
        res.json({
            success: true,
            message: 'Logout exitoso'
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
