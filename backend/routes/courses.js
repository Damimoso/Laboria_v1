// =============================================
// RUTAS DE CURSOS - LABORIA
// =============================================

const express = require('express');
const { pool } = require('../config/database');
const { helpers } = require('../config/constants');
const { 
    authenticateToken, 
    requireActiveAccount, 
    requireOwnership,
    logAction,
    rateLimitByUser,
    optionalAuth
} = require('../middleware/auth');
const { 
    validateCourseCreate, 
    validateId,
    validatePagination,
    validateSearch
} = require('../middleware/validation');
const router = express.Router();

// =============================================
// OBTENER LISTA DE CURSOS (PÚBLICO)
// =============================================

router.get('/',
    validateSearch,
    logAction('GET_COURSES_LIST'),
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                q = '',
                category = '',
                level = '',
                price_min = '',
                price_max = '',
                sort_by = 'created_at',
                order = 'DESC'
            } = req.query;

            const offset = (page - 1) * limit;
            
            // Construir consulta base
            let whereConditions = ['c.status = ?'];
            let queryParams = ['active'];

            // Búsqueda por texto
            if (q) {
                whereConditions.push('(c.titulo LIKE ? OR c.descripcion LIKE ? OR c.instructor LIKE ?)');
                queryParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
            }

            // Filtros específicos
            if (category) {
                whereConditions.push('c.categoria = ?');
                queryParams.push(category);
            }

            if (level) {
                whereConditions.push('c.nivel = ?');
                queryParams.push(level);
            }

            if (price_min) {
                whereConditions.push('c.precio >= ?');
                queryParams.push(parseFloat(price_min));
            }

            if (price_max) {
                whereConditions.push('c.precio <= ?');
                queryParams.push(parseFloat(price_max));
            }

            const whereClause = whereConditions.join(' AND ');

            // Validar ordenamiento
            const validSortFields = ['created_at', 'titulo', 'precio', 'rating', 'inscripciones_count'];
            const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
            const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // Consulta principal
            const query = `
                SELECT 
                    c.id, c.titulo, c.descripcion, c.instructor, c.duracion,
                    c.nivel, c.categoria, c.precio, c.precio_original, c.imagen,
                    c.contenido, c.objetivos, c.requisitos_curso, c.rating,
                    c.inscripciones_count, c.status, c.created_at,
                    u.username as creado_por_username,
                    p.nombre as creado_por_nombre,
                    p.foto_perfil as creado_por_avatar
                FROM cursos c
                LEFT JOIN usuarios u ON c.creado_por = u.id
                LEFT JOIN perfiles p ON u.id = p.usuario_id
                WHERE ${whereClause}
                ORDER BY c.${sortField} ${sortOrder}
                LIMIT ? OFFSET ?
            `;

            const [courses] = await pool.execute(query, [...queryParams, parseInt(limit), parseInt(offset)]);

            // Consulta para obtener total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM cursos c
                WHERE ${whereClause}
            `;

            const [countResult] = await pool.execute(countQuery, queryParams);
            const total = countResult[0].total;

            // Formatear resultados
            const formattedCourses = courses.map(course => ({
                ...course,
                precio_formateado: course.precio 
                    ? `$${course.precio.toLocaleString()}`
                    : 'Gratis',
                descuento: course.precio_original && course.precio 
                    ? Math.round((1 - course.precio / course.precio_original) * 100)
                    : 0,
                creado_por: {
                    username: course.creado_por_username,
                    nombre: course.creado_por_nombre,
                    avatar: course.creado_por_avatar
                }
            }));

            helpers.sendSuccess(res, {
                courses: formattedCourses,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / limit),
                    total_items: total,
                    items_per_page: parseInt(limit)
                },
                filters: {
                    q, category, level, price_min, price_max
                }
            }, 'Cursos obtenidos exitosamente');
        } catch (error) {
            console.error('Error al obtener cursos:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// OBTENER DETALLES DE UN CURSO
// =============================================

router.get('/:id',
    validateId,
    logAction('GET_COURSE_DETAILS'),
    async (req, res) => {
        try {
            const courseId = req.params.id;
            
            // Obtener detalles del curso
            const [courses] = await pool.execute(
                `SELECT 
                    c.id, c.titulo, c.descripcion, c.instructor, c.duracion,
                    c.nivel, c.categoria, c.precio, c.precio_original, c.imagen,
                    c.contenido, c.objetivos, c.requisitos_curso, c.rating,
                    c.inscripciones_count, c.status, c.created_at,
                    u.username as creado_por_username,
                    u.email as creado_por_email,
                    p.nombre as creado_por_nombre,
                    p.apellido as creado_por_apellido,
                    p.foto_perfil as creado_por_avatar,
                    p.bio as creado_por_bio
                 FROM cursos c
                 LEFT JOIN usuarios u ON c.creado_por = u.id
                 LEFT JOIN perfiles p ON u.id = p.usuario_id
                 WHERE c.id = ? AND c.status = 'active'`,
                [courseId]
            );

            if (courses.length === 0) {
                return helpers.sendError(res, new Error('Curso no encontrado'), 404);
            }

            const course = courses[0];

            // Verificar si el usuario actual ya está inscrito
            let yaInscrito = false;
            let progreso = null;
            if (req.user) {
                const [inscripciones] = await pool.execute(
                    'SELECT id, progreso, status FROM inscripciones WHERE curso_id = ? AND usuario_id = ?',
                    [courseId, req.user.id]
                );
                yaInscrito = inscripciones.length > 0;
                if (yaInscrito) {
                    progreso = inscripciones[0];
                }
            }

            // Obtener reseñas del curso
            const [resenas] = await pool.execute(
                `SELECT 
                    r.id, r.calificacion, r.comentario, r.created_at,
                    u.username, p.nombre, p.foto_perfil
                 FROM resenas r
                 JOIN usuarios u ON r.usuario_id = u.id
                 LEFT JOIN perfiles p ON u.id = p.usuario_id
                 WHERE r.curso_id = ?
                 ORDER BY r.created_at DESC
                 LIMIT 10`,
                [courseId]
            );

            // Formatear respuesta
            const courseDetails = {
                ...course,
                precio_formateado: course.precio 
                    ? `$${course.precio.toLocaleString()}`
                    : 'Gratis',
                descuento: course.precio_original && course.precio 
                    ? Math.round((1 - course.precio / course.precio_original) * 100)
                    : 0,
                creado_por: {
                    username: course.creado_por_username,
                    email: course.creado_por_email,
                    nombre: course.creado_por_nombre,
                    apellido: course.creado_por_apellido,
                    avatar: course.creado_por_avatar,
                    bio: course.creado_por_bio
                },
                ya_inscrito: yaInscrito,
                progreso: progreso,
                resenas: resenas
            };

            helpers.sendSuccess(res, courseDetails, 'Detalles del curso obtenidos exitosamente');
        } catch (error) {
            console.error('Error al obtener detalles del curso:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// CREAR NUEVO CURSO
// =============================================

router.post('/',
    authenticateToken,
    requireActiveAccount,
    validateCourseCreate,
    logAction('CREATE_COURSE'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const courseData = req.body;

            // Insertar nuevo curso
            const [result] = await pool.execute(
                `INSERT INTO cursos (
                    titulo, descripcion, instructor, duracion, nivel, categoria,
                    precio, precio_original, imagen, contenido, objetivos,
                    requisitos_curso, creado_por, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
                [
                    courseData.titulo,
                    courseData.descripcion,
                    courseData.instructor || null,
                    courseData.duracion || null,
                    courseData.nivel,
                    courseData.categoria,
                    courseData.precio || 0,
                    courseData.precio_original || null,
                    courseData.imagen || null,
                    courseData.contenido || null,
                    courseData.objetivos || null,
                    courseData.requisitos_curso || null,
                    userId
                ]
            );

            const newCourseId = result.insertId;

            // Obtener el curso creado
            const [newCourse] = await pool.execute(
                'SELECT * FROM cursos WHERE id = ?',
                [newCourseId]
            );

            helpers.sendSuccess(res, newCourse[0], 'Curso creado exitosamente');
        } catch (error) {
            console.error('Error al crear curso:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// ACTUALIZAR CURSO
// =============================================

router.put('/:id',
    authenticateToken,
    requireActiveAccount,
    validateId,
    requireOwnership('course'),
    validateCourseCreate,
    logAction('UPDATE_COURSE'),
    async (req, res) => {
        try {
            const courseId = req.params.id;
            const courseData = req.body;

            // Actualizar curso
            await pool.execute(
                `UPDATE cursos SET 
                    titulo = ?, descripcion = ?, instructor = ?, duracion = ?,
                    nivel = ?, categoria = ?, precio = ?, precio_original = ?,
                    imagen = ?, contenido = ?, objetivos = ?, requisitos_curso = ?,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    courseData.titulo,
                    courseData.descripcion,
                    courseData.instructor || null,
                    courseData.duracion || null,
                    courseData.nivel,
                    courseData.categoria,
                    courseData.precio || 0,
                    courseData.precio_original || null,
                    courseData.imagen || null,
                    courseData.contenido || null,
                    courseData.objetivos || null,
                    courseData.requisitos_curso || null,
                    courseId
                ]
            );

            // Obtener curso actualizado
            const [updatedCourse] = await pool.execute(
                'SELECT * FROM cursos WHERE id = ?',
                [courseId]
            );

            helpers.sendSuccess(res, updatedCourse[0], 'Curso actualizado exitosamente');
        } catch (error) {
            console.error('Error al actualizar curso:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// ELIMINAR CURSO
// =============================================

router.delete('/:id',
    authenticateToken,
    requireActiveAccount,
    validateId,
    requireOwnership('course'),
    logAction('DELETE_COURSE'),
    async (req, res) => {
        try {
            const courseId = req.params.id;

            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // Eliminar inscripciones asociadas
                await connection.execute(
                    'DELETE FROM inscripciones WHERE curso_id = ?',
                    [courseId]
                );

                // Eliminar reseñas asociadas
                await connection.execute(
                    'DELETE FROM resenas WHERE curso_id = ?',
                    [courseId]
                );

                // Eliminar curso
                await connection.execute(
                    'DELETE FROM cursos WHERE id = ?',
                    [courseId]
                );

                await connection.commit();
                helpers.sendSuccess(res, null, 'Curso eliminado exitosamente');
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error al eliminar curso:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// INSCRIBIRSE A UN CURSO
// =============================================

router.post('/:id/enroll',
    authenticateToken,
    requireActiveAccount,
    validateId,
    rateLimitByUser(5, 60 * 60 * 1000), // 5 inscripciones por hora
    logAction('ENROLL_COURSE'),
    async (req, res) => {
        try {
            const courseId = req.params.id;
            const userId = req.user.id;

            // Verificar que el curso exista y esté activo
            const [courses] = await pool.execute(
                'SELECT id, titulo, precio, creado_por FROM cursos WHERE id = ? AND status = "active"',
                [courseId]
            );

            if (courses.length === 0) {
                return helpers.sendError(res, new Error('Curso no encontrado o no está activo'), 404);
            }

            const course = courses[0];

            // Verificar que el usuario no sea el creador del curso
            if (course.creado_por === userId) {
                return helpers.sendError(res, new Error('No puedes inscribirte a tu propio curso'), 400);
            }

            // Verificar que el usuario no ya esté inscrito
            const [existingInscripciones] = await pool.execute(
                'SELECT id FROM inscripciones WHERE curso_id = ? AND usuario_id = ?',
                [courseId, userId]
            );

            if (existingInscripciones.length > 0) {
                return helpers.sendError(res, new Error('Ya estás inscrito en este curso'), 400);
            }

            // Crear inscripción
            const [result] = await pool.execute(
                `INSERT INTO inscripciones (
                    curso_id, usuario_id, status, progreso
                ) VALUES (?, ?, 'active', 0)`,
                [courseId, userId]
            );

            // Actualizar contador de inscripciones del curso
            await pool.execute(
                'UPDATE cursos SET inscripciones_count = inscripciones_count + 1 WHERE id = ?',
                [courseId]
            );

            // Crear notificación para el creador del curso
            if (course.creado_por !== userId) {
                await pool.execute(
                    `INSERT INTO notificaciones (
                        usuario_id, titulo, mensaje, tipo, relacion_id, relacion_tipo
                    ) VALUES (?, ?, ?, 'info', ?, 'course_enrollment')`,
                    [
                        course.creado_por,
                        'Nueva inscripción',
                        `Alguien se ha inscrito a tu curso "${course.titulo}"`,
                        result.insertId
                    ]
                );
            }

            helpers.sendSuccess(res, {
                inscripcion_id: result.insertId,
                curso: {
                    id: course.id,
                    titulo: course.titulo,
                    precio: course.precio
                }
            }, 'Inscripción realizada exitosamente');
        } catch (error) {
            console.error('Error al inscribirse al curso:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// ACTUALIZAR PROGRESO DEL CURSO
// =============================================

router.put('/:id/progress',
    authenticateToken,
    requireActiveAccount,
    validateId,
    logAction('UPDATE_COURSE_PROGRESS'),
    async (req, res) => {
        try {
            const courseId = req.params.id;
            const userId = req.user.id;
            const { progreso } = req.body;

            // Validar progreso
            if (typeof progreso !== 'number' || progreso < 0 || progreso > 100) {
                return helpers.sendError(res, new Error('El progreso debe ser un número entre 0 y 100'), 400);
            }

            // Verificar que el usuario esté inscrito
            const [inscripciones] = await pool.execute(
                'SELECT id, status FROM inscripciones WHERE curso_id = ? AND usuario_id = ?',
                [courseId, userId]
            );

            if (inscripciones.length === 0) {
                return helpers.sendError(res, new Error('No estás inscrito en este curso'), 400);
            }

            const inscripcion = inscripciones[0];

            // Actualizar progreso
            await pool.execute(
                'UPDATE inscripciones SET progreso = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [progreso, inscripcion.id]
            );

            // Si el progreso es 100%, marcar como completado
            if (progreso === 100 && inscripcion.status !== 'completed') {
                await pool.execute(
                    'UPDATE inscripciones SET status = "completed", completed_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [inscripcion.id]
                );

                // Crear notificación de completado
                await pool.execute(
                    `INSERT INTO notificaciones (
                        usuario_id, titulo, mensaje, tipo, relacion_id, relacion_tipo
                    ) VALUES (?, ?, ?, 'success', ?, 'course_completion')`,
                    [
                        userId,
                        '¡Curso completado!',
                        'Felicidades, has completado el curso con éxito',
                        inscripcion.id
                    ]
                );
            }

            helpers.sendSuccess(res, {
                progreso,
                completed: progreso === 100
            }, 'Progreso actualizado exitosamente');
        } catch (error) {
            console.error('Error al actualizar progreso:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// CALIFICAR CURSO (RESEÑA)
// =============================================

router.post('/:id/rate',
    authenticateToken,
    requireActiveAccount,
    validateId,
    rateLimitByUser(3, 60 * 60 * 1000), // 3 reseñas por hora
    logAction('RATE_COURSE'),
    async (req, res) => {
        try {
            const courseId = req.params.id;
            const userId = req.user.id;
            const { calificacion, comentario } = req.body;

            // Validar calificación
            if (typeof calificacion !== 'number' || calificacion < 1 || calificacion > 5) {
                return helpers.sendError(res, new Error('La calificación debe ser un número entre 1 y 5'), 400);
            }

            // Verificar que el usuario esté inscrito y haya completado el curso
            const [inscripciones] = await pool.execute(
                'SELECT id, status FROM inscripciones WHERE curso_id = ? AND usuario_id = ?',
                [courseId, userId]
            );

            if (inscripciones.length === 0) {
                return helpers.sendError(res, new Error('No estás inscrito en este curso'), 400);
            }

            if (inscripciones[0].status !== 'completed') {
                return helpers.sendError(res, new Error('Debes completar el curso para poder calificarlo'), 400);
            }

            // Verificar que el usuario no haya calificado el curso anteriormente
            const [existingResenas] = await pool.execute(
                'SELECT id FROM resenas WHERE curso_id = ? AND usuario_id = ?',
                [courseId, userId]
            );

            if (existingResenas.length > 0) {
                return helpers.sendError(res, new Error('Ya has calificado este curso'), 400);
            }

            // Crear reseña
            const [result] = await pool.execute(
                `INSERT INTO resenas (
                    curso_id, usuario_id, calificacion, comentario
                ) VALUES (?, ?, ?, ?)`,
                [courseId, userId, calificacion, comentario || '']
            );

            // Actualizar rating promedio del curso
            const [ratingResult] = await pool.execute(
                'SELECT AVG(calificacion) as avg_rating FROM resenas WHERE curso_id = ?',
                [courseId]
            );

            const avgRating = ratingResult[0].avg_rating;
            await pool.execute(
                'UPDATE cursos SET rating = ? WHERE id = ?',
                [avgRating, courseId]
            );

            helpers.sendSuccess(res, {
                resena_id: result.insertId,
                calificacion,
                comentario,
                nuevo_rating_curso: avgRating
            }, 'Reseña creada exitosamente');
        } catch (error) {
            console.error('Error al calificar curso:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// MIS CURSOS INSCRITOS
// =============================================

router.get('/my/enrolled',
    authenticateToken,
    requireActiveAccount,
    validatePagination,
    logAction('GET_MY_ENROLLED_COURSES'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, status = '' } = req.query;
            const offset = (page - 1) * limit;

            let whereConditions = ['i.usuario_id = ?'];
            let queryParams = [userId];

            if (status) {
                whereConditions.push('i.status = ?');
                queryParams.push(status);
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT 
                    i.id, i.status, i.progreso, i.created_at, i.completed_at,
                    c.id as curso_id, c.titulo, c.descripcion, c.instructor,
                    c.nivel, c.categoria, c.precio, c.imagen, c.rating
                FROM inscripciones i
                JOIN cursos c ON i.curso_id = c.id
                WHERE ${whereClause}
                ORDER BY i.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [inscripciones] = await pool.execute(query, [...queryParams, parseInt(limit), parseInt(offset)]);

            // Obtener total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM inscripciones i
                WHERE ${whereClause}
            `;

            const [countResult] = await pool.execute(countQuery, queryParams);
            const total = countResult[0].total;

            helpers.sendSuccess(res, {
                inscripciones,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / limit),
                    total_items: total,
                    items_per_page: parseInt(limit)
                }
            }, 'Mis cursos inscritos obtenidos exitosamente');
        } catch (error) {
            console.error('Error al obtener mis cursos inscritos:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// MIS CURSOS CREADOS
// =============================================

router.get('/my/created',
    authenticateToken,
    requireActiveAccount,
    validatePagination,
    logAction('GET_MY_CREATED_COURSES'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, status = '' } = req.query;
            const offset = (page - 1) * limit;

            let whereConditions = ['c.creado_por = ?'];
            let queryParams = [userId];

            if (status) {
                whereConditions.push('c.status = ?');
                queryParams.push(status);
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT 
                    c.id, c.titulo, c.descripcion, c.instructor, c.duracion,
                    c.nivel, c.categoria, c.precio, c.precio_original, c.imagen,
                    c.rating, c.inscripciones_count, c.status, c.created_at, c.updated_at
                FROM cursos c
                WHERE ${whereClause}
                ORDER BY c.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [courses] = await pool.execute(query, [...queryParams, parseInt(limit), parseInt(offset)]);

            // Obtener total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM cursos c
                WHERE ${whereClause}
            `;

            const [countResult] = await pool.execute(countQuery, queryParams);
            const total = countResult[0].total;

            helpers.sendSuccess(res, {
                courses,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / limit),
                    total_items: total,
                    items_per_page: parseInt(limit)
                }
            }, 'Mis cursos creados obtenidos exitosamente');
        } catch (error) {
            console.error('Error al obtener mis cursos creados:', error);
            helpers.sendError(res, error);
        }
    }
);

module.exports = router;
