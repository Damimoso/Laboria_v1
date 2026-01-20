// =============================================
// MIDDLEWARE DE AUTENTICACIÓN - LABORIA
// =============================================

const { helpers } = require('../config/constants');

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return helpers.sendError(res, new Error('Token de autenticación requerido'), 401);
        }

        const decoded = helpers.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return helpers.sendError(res, new Error('Token inválido o expirado'), 401);
    }
};

// Middleware para verificar rol de usuario
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return helpers.sendError(res, new Error('Autenticación requerida'), 401);
        }

        const userRole = req.user.role;
        const hasRequiredRole = Array.isArray(roles) 
            ? roles.includes(userRole) 
            : userRole === roles;

        if (!hasRequiredRole) {
            return helpers.sendError(res, new Error('Permisos insuficientes'), 403);
        }

        next();
    };
};

// Middleware para verificar si el usuario es admin
const requireAdmin = requireRole(['admin']);

// Middleware para verificar si el usuario es admin o empresa
const requireAdminOrEmpresa = requireRole(['admin', 'empresa']);

// Middleware para verificar si el usuario es dueño del recurso
const requireOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return helpers.sendError(res, new Error('Autenticación requerida'), 401);
            }

            const userId = req.user.id;
            const resourceId = req.params.id;
            const { pool } = require('../config/database');

            let query = '';
            let params = [];

            switch (resourceType) {
                case 'user':
                    query = 'SELECT id FROM usuarios WHERE id = ?';
                    params = [resourceId];
                    break;
                case 'job':
                    query = 'SELECT publicado_por FROM empleos WHERE id = ?';
                    params = [resourceId];
                    break;
                case 'course':
                    query = 'SELECT creado_por FROM cursos WHERE id = ?';
                    params = [resourceId];
                    break;
                default:
                    return helpers.sendError(res, new Error('Tipo de recurso no válido'), 400);
            }

            const [results] = await pool.execute(query, params);
            
            if (results.length === 0) {
                return helpers.sendError(res, new Error('Recurso no encontrado'), 404);
            }

            const resource = results[0];
            const resourceOwnerId = resource.publicado_por || resource.id;

            // Admin puede acceder a todo
            if (req.user.role === 'admin') {
                return next();
            }

            // Verificar ownership
            if (resourceOwnerId !== userId) {
                return helpers.sendError(res, new Error('No tienes permisos para este recurso'), 403);
            }

            next();
        } catch (error) {
            console.error('Error en middleware de ownership:', error);
            return helpers.sendError(res, error, 500);
        }
    };
};

// Middleware opcional (no lanza error si no hay token)
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = helpers.verifyToken(token);
            req.user = decoded;
        }
        
        next();
    } catch (error) {
        // Si el token es inválido, simplemente continuamos sin usuario
        next();
    }
};

// Middleware para limitar peticiones por usuario
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const userRequests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user.id;
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!userRequests.has(userId)) {
            userRequests.set(userId, []);
        }

        const requests = userRequests.get(userId);
        
        // Limpiar peticiones antiguas
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        userRequests.set(userId, validRequests);

        if (validRequests.length >= maxRequests) {
            return helpers.sendError(res, new Error('Límite de peticiones excedido'), 429);
        }

        // Agregar petición actual
        validRequests.push(now);

        next();
    };
};

// Middleware para validar estado de la cuenta
const requireActiveAccount = (req, res, next) => {
    if (!req.user) {
        return helpers.sendError(res, new Error('Autenticación requerida'), 401);
    }

    if (req.user.status !== 'active') {
        let message = 'Cuenta inactiva';
        if (req.user.status === 'suspended') {
            message = 'Cuenta suspendida';
        }
        return helpers.sendError(res, new Error(message), 403);
    }

    next();
};

// Middleware para logging de acciones
const logAction = (action) => {
    return (req, res, next) => {
        const timestamp = new Date().toISOString();
        const userId = req.user?.id || 'anonymous';
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'unknown';

        console.log(`[${timestamp}] ${action} - User: ${userId}, IP: ${ip}, UA: ${userAgent}`);
        
        next();
    };
};

// Middleware para validar email verificado
const requireVerifiedEmail = (req, res, next) => {
    if (!req.user) {
        return helpers.sendError(res, new Error('Autenticación requerida'), 401);
    }

    if (!req.user.email_verified) {
        return helpers.sendError(res, new Error('Email no verificado'), 403);
    }

    next();
};

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireAdminOrEmpresa,
    requireOwnership,
    optionalAuth,
    rateLimitByUser,
    requireActiveAccount,
    logAction,
    requireVerifiedEmail
};
