// =============================================
// RUTAS DE AUTENTICACIÓN SIMULADAS - LABORIA
// =============================================

const express = require('express');
const authSimulation = require('../auth-simulation');
const { helpers } = require('../config/constants');

const router = express.Router();

// =============================================
// REGISTRO DE USUARIO
// =============================================

router.post('/register/usuario', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Validación básica
        if (!username || !email || !password || !confirmPassword) {
            return helpers.sendError(res, new Error('Todos los campos son obligatorios'), 400);
        }

        if (password !== confirmPassword) {
            return helpers.sendError(res, new Error('Las contraseñas no coinciden'), 400);
        }

        if (password.length < 8) {
            return helpers.sendError(res, new Error('La contraseña debe tener al menos 8 caracteres'), 400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return helpers.sendError(res, new Error('Email inválido'), 400);
        }

        // Registrar usuario
        const result = await authSimulation.register({ username, email, password });

        if (result.success) {
            return helpers.sendSuccess(res, result.data, result.message);
        } else {
            return helpers.sendError(res, new Error(result.message), 400);
        }

    } catch (error) {
        console.error('Error en registro:', error);
        helpers.sendError(res, error);
    }
});

// =============================================
// LOGIN DE USUARIO
// =============================================

router.post('/login/usuario', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validación básica
        if (!email || !password) {
            return helpers.sendError(res, new Error('Email y contraseña son obligatorios'), 400);
        }

        // Autenticar usuario
        const result = await authSimulation.login(email, password);

        if (result.success) {
            return helpers.sendSuccess(res, result.data, result.message);
        } else {
            return helpers.sendError(res, new Error(result.message), 401);
        }

    } catch (error) {
        console.error('Error en login:', error);
        helpers.sendError(res, error);
    }
});

// =============================================
// LOGIN DE ADMINISTRADOR
// =============================================

router.post('/login/admin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validación básica
        if (!email || !password) {
            return helpers.sendError(res, new Error('Email y contraseña son obligatorios'), 400);
        }

        // Autenticar usuario
        const result = await authSimulation.login(email, password);

        if (result.success) {
            // Verificar que sea administrador
            if (result.data.user.role !== 'admin') {
                return helpers.sendError(res, new Error('Acceso denegado. Se requieren credenciales de administrador'), 403);
            }

            return helpers.sendSuccess(res, result.data, 'Login de administrador exitoso');
        } else {
            return helpers.sendError(res, new Error(result.message), 401);
        }

    } catch (error) {
        console.error('Error en login admin:', error);
        helpers.sendError(res, error);
    }
});

// =============================================
// VERIFICAR TOKEN
// =============================================

router.get('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return helpers.sendError(res, new Error('Token requerido'), 401);
        }

        try {
            const user = authSimulation.verifyToken(token);
            return helpers.sendSuccess(res, { user }, 'Token válido');
        } catch (error) {
            return helpers.sendError(res, new Error('Token inválido o expirado'), 401);
        }

    } catch (error) {
        console.error('Error en verificación:', error);
        helpers.sendError(res, error);
    }
});

// =============================================
// LOGOUT
// =============================================

router.post('/logout', (req, res) => {
    try {
        // En una implementación real, aquí se invalidaría el token
        // Por ahora, simplemente retornamos éxito
        return helpers.sendSuccess(res, null, 'Sesión cerrada exitosamente');
    } catch (error) {
        console.error('Error en logout:', error);
        helpers.sendError(res, error);
    }
});

// =============================================
// REFRESH TOKEN
// =============================================

router.post('/refresh', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return helpers.sendError(res, new Error('Token requerido'), 401);
        }

        try {
            const user = authSimulation.verifyToken(token);
            const newToken = authSimulation.generateToken(user);
            
            return helpers.sendSuccess(res, { token: newToken }, 'Token renovado exitosamente');
        } catch (error) {
            return helpers.sendError(res, new Error('Token inválido o expirado'), 401);
        }

    } catch (error) {
        console.error('Error en refresh token:', error);
        helpers.sendError(res, error);
    }
});

// =============================================
// OBTENER INFORMACIÓN DEL SISTEMA (SOLO ADMIN)
// =============================================

router.get('/system/info', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return helpers.sendError(res, new Error('Token requerido'), 401);
        }

        try {
            const user = authSimulation.verifyToken(token);
            
            // Verificar que sea administrador
            if (user.role !== 'admin') {
                return helpers.sendError(res, new Error('Acceso denegado'), 403);
            }

            const systemInfo = authSimulation.getSystemInfo();
            return helpers.sendSuccess(res, systemInfo, 'Información del sistema obtenida');

        } catch (error) {
            return helpers.sendError(res, new Error('Token inválido o expirado'), 401);
        }

    } catch (error) {
        console.error('Error obteniendo información del sistema:', error);
        helpers.sendError(res, error);
    }
});

// =============================================
// LISTAR USUARIOS (SOLO ADMIN)
// =============================================

router.get('/users', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return helpers.sendError(res, new Error('Token requerido'), 401);
        }

        try {
            const user = authSimulation.verifyToken(token);
            
            // Verificar que sea administrador
            if (user.role !== 'admin') {
                return helpers.sendError(res, new Error('Acceso denegado'), 403);
            }

            const users = authSimulation.getAllUsers();
            return helpers.sendSuccess(res, { users }, 'Usuarios obtenidos exitosamente');

        } catch (error) {
            return helpers.sendError(res, new Error('Token inválido o expirado'), 401);
        }

    } catch (error) {
        console.error('Error listando usuarios:', error);
        helpers.sendError(res, error);
    }
});

// =============================================
// CREAR USUARIO (SOLO ADMIN)
// =============================================

router.post('/users', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return helpers.sendError(res, new Error('Token requerido'), 401);
        }

        try {
            const adminUser = authSimulation.verifyToken(token);
            
            // Verificar que sea administrador
            if (adminUser.role !== 'admin') {
                return helpers.sendError(res, new Error('Acceso denegado'), 403);
            }

            const { username, email, password, role = 'user' } = req.body;

            // Validación básica
            if (!username || !email || !password) {
                return helpers.sendError(res, new Error('Username, email y password son obligatorios'), 400);
            }

            // Crear usuario
            const result = await authSimulation.createUser({ username, email, password, role });

            if (result.success) {
                return helpers.sendSuccess(res, result.data, result.message);
            } else {
                return helpers.sendError(res, new Error(result.message), 400);
            }

        } catch (error) {
            return helpers.sendError(res, new Error('Token inválido o expirado'), 401);
        }

    } catch (error) {
        console.error('Error creando usuario:', error);
        helpers.sendError(res, error);
    }
});

// =============================================
// ELIMINAR USUARIO (SOLO ADMIN)
// =============================================

router.delete('/users/:id', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return helpers.sendError(res, new Error('Token requerido'), 401);
        }

        try {
            const adminUser = authSimulation.verifyToken(token);
            
            // Verificar que sea administrador
            if (adminUser.role !== 'admin') {
                return helpers.sendError(res, new Error('Acceso denegado'), 403);
            }

            const userId = req.params.id;

            // No permitir eliminarse a sí mismo
            if (parseInt(userId) === adminUser.id) {
                return helpers.sendError(res, new Error('No puedes eliminar tu propia cuenta'), 400);
            }

            // Eliminar usuario
            const result = authSimulation.deleteUser(userId);

            if (result.success) {
                return helpers.sendSuccess(res, null, result.message);
            } else {
                return helpers.sendError(res, new Error(result.message), 400);
            }

        } catch (error) {
            return helpers.sendError(res, new Error('Token inválido o expirado'), 401);
        }

    } catch (error) {
        console.error('Error eliminando usuario:', error);
        helpers.sendError(res, error);
    }
});

module.exports = router;
