// =============================================
// MIDDLEWARE DE VALIDACIÓN - LABORIA
// =============================================

const { body, param, query, validationResult } = require('express-validator');
const { helpers } = require('../config/constants');

// Manejador de errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
        }));
        
        return helpers.sendError(res, new Error('Error de validación'), 400, {
            validationErrors: errorMessages
        });
    }
    
    next();
};

// Validaciones para autenticación
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail()
        .trim(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .trim(),
    handleValidationErrors
];

const validateRegister = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('El username debe tener entre 3 y 50 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El username solo puede contener letras, números y guiones bajos')
        .trim(),
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail()
        .trim(),
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
    handleValidationErrors
];

// Validaciones para perfiles de usuario
const validateProfileUpdate = [
    body('nombre')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios')
        .trim(),
    body('apellido')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('El apellido debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El apellido solo puede contener letras y espacios')
        .trim(),
    body('telefono')
        .optional()
        .matches(/^[\+]?[\d\s\-\(\)]+$/)
        .withMessage('Teléfono inválido')
        .trim(),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('La biografía no puede exceder 500 caracteres')
        .trim(),
    body('habilidades')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Las habilidades no pueden exceder 1000 caracteres')
        .trim(),
    body('experiencia')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('La experiencia no puede exceder 2000 caracteres')
        .trim(),
    body('linkedin')
        .optional()
        .isURL()
        .withMessage('URL de LinkedIn inválida')
        .trim(),
    body('github')
        .optional()
        .isURL()
        .withMessage('URL de GitHub inválida')
        .trim(),
    body('website')
        .optional()
        .isURL()
        .withMessage('URL del sitio web inválida')
        .trim(),
    handleValidationErrors
];

// Validaciones para empleos
const validateJobCreate = [
    body('titulo')
        .isLength({ min: 5, max: 200 })
        .withMessage('El título debe tener entre 5 y 200 caracteres')
        .trim(),
    body('descripcion')
        .isLength({ min: 20, max: 5000 })
        .withMessage('La descripción debe tener entre 20 y 5000 caracteres')
        .trim(),
    body('empresa')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre de la empresa debe tener entre 2 y 100 caracteres')
        .trim(),
    body('ubicacion')
        .optional()
        .isLength({ max: 100 })
        .withMessage('La ubicación no puede exceder 100 caracteres')
        .trim(),
    body('salario_minimo')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El salario mínimo debe ser un número positivo'),
    body('salario_maximo')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El salario máximo debe ser un número positivo'),
    body('tipo_contrato')
        .isIn(['tiempo_completo', 'medio_tiempo', 'freelance', 'practicas', 'temporal'])
        .withMessage('Tipo de contrato inválido'),
    body('modalidad')
        .isIn(['presencial', 'remoto', 'hibrido'])
        .withMessage('Modalidad de trabajo inválida'),
    body('categoria')
        .isLength({ min: 2, max: 50 })
        .withMessage('La categoría debe tener entre 2 y 50 caracteres')
        .trim(),
    body('requisitos')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Los requisitos no pueden exceder 2000 caracteres')
        .trim(),
    body('beneficios')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Los beneficios no pueden exceder 1000 caracteres')
        .trim(),
    body('habilidades_requeridas')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Las habilidades requeridas no pueden exceder 1000 caracteres')
        .trim(),
    body('experiencia_requerida')
        .isIn(['sin_experiencia', '1_anio', '2_anios', '3_anios', '5_anios', 'mas_5_anios'])
        .withMessage('Nivel de experiencia requerido inválido'),
    body('nivel_educativo')
        .isIn(['secundaria', 'bachiller', 'tecnico', 'universitario', 'posgrado'])
        .withMessage('Nivel educativo inválido'),
    body('fecha_limite')
        .optional()
        .isISO8601()
        .withMessage('Fecha límite inválida')
        .custom((value) => {
            const date = new Date(value);
            const now = new Date();
            return date > now;
        })
        .withMessage('La fecha límite debe ser futura'),
    handleValidationErrors
];

// Validaciones para cursos
const validateCourseCreate = [
    body('titulo')
        .isLength({ min: 5, max: 200 })
        .withMessage('El título debe tener entre 5 y 200 caracteres')
        .trim(),
    body('descripcion')
        .isLength({ min: 20, max: 5000 })
        .withMessage('La descripción debe tener entre 20 y 5000 caracteres')
        .trim(),
    body('instructor')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre del instructor debe tener entre 2 y 100 caracteres')
        .trim(),
    body('duracion')
        .optional()
        .isLength({ max: 50 })
        .withMessage('La duración no puede exceder 50 caracteres')
        .trim(),
    body('nivel')
        .isIn(['principiante', 'intermedio', 'avanzado'])
        .withMessage('Nivel del curso inválido'),
    body('categoria')
        .isLength({ min: 2, max: 50 })
        .withMessage('La categoría debe tener entre 2 y 50 caracteres')
        .trim(),
    body('precio')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio debe ser un número positivo'),
    body('precio_original')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio original debe ser un número positivo'),
    body('contenido')
        .optional()
        .isLength({ max: 10000 })
        .withMessage('El contenido no puede exceder 10000 caracteres')
        .trim(),
    body('objetivos')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Los objetivos no pueden exceder 2000 caracteres')
        .trim(),
    body('requisitos_curso')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Los requisitos del curso no pueden exceder 1000 caracteres')
        .trim(),
    handleValidationErrors
];

// Validaciones para parámetros URL
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido')
        .toInt(),
    handleValidationErrors
];

// Validaciones para query parameters
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página inválida')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Límite inválido (máximo 100)')
        .toInt(),
    handleValidationErrors
];

// Validaciones para búsqueda
const validateSearch = [
    query('q')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Término de búsqueda inválido')
        .trim(),
    query('category')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Categoría inválida')
        .trim(),
    query('type')
        .optional()
        .isIn(['presencial', 'remoto', 'hibrido'])
        .withMessage('Tipo de trabajo inválido'),
    query('contract')
        .optional()
        .isIn(['tiempo_completo', 'medio_tiempo', 'freelance', 'practicas', 'temporal'])
        .withMessage('Tipo de contrato inválido'),
    query('experience')
        .optional()
        .isIn(['sin_experiencia', '1_anio', '2_anios', '3_anios', '5_anios', 'mas_5_anios'])
        .withMessage('Nivel de experiencia inválido'),
    query('salary_min')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Salario mínimo inválido'),
    query('salary_max')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Salario máximo inválido'),
    ...validatePagination
];

// Validación para archivos
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) => {
    return (req, res, next) => {
        if (!req.file) {
            return next();
        }

        const file = req.file;
        
        // Validar tipo de archivo
        if (!allowedTypes.includes(file.mimetype)) {
            return helpers.sendError(res, new Error('Tipo de archivo no permitido'), 400);
        }

        // Validar tamaño
        if (file.size > maxSize) {
            return helpers.sendError(res, new Error('Archivo demasiado grande'), 400);
        }

        next();
    };
};

// Validación personalizada para email único
const validateUniqueEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        const { pool } = require('../config/database');
        
        const [existingUsers] = await pool.execute(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return helpers.sendError(res, new Error('El email ya está registrado'), 400);
        }

        next();
    } catch (error) {
        console.error('Error en validación de email único:', error);
        return helpers.sendError(res, error, 500);
    }
};

// Validación personalizada para username único
const validateUniqueUsername = async (req, res, next) => {
    try {
        const { username } = req.body;
        const { pool } = require('../config/database');
        
        const [existingUsers] = await pool.execute(
            'SELECT id FROM usuarios WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return helpers.sendError(res, new Error('El nombre de usuario ya está en uso'), 400);
        }

        next();
    } catch (error) {
        console.error('Error en validación de username único:', error);
        return helpers.sendError(res, error, 500);
    }
};

module.exports = {
    handleValidationErrors,
    validateLogin,
    validateRegister,
    validateProfileUpdate,
    validateJobCreate,
    validateCourseCreate,
    validateId,
    validatePagination,
    validateSearch,
    validateFileUpload,
    validateUniqueEmail,
    validateUniqueUsername
};
