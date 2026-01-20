// =============================================
// RUTAS DE EMPLEOS - LABORIA
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
    validateJobCreate, 
    validateId,
    validatePagination,
    validateSearch
} = require('../middleware/validation');
const router = express.Router();

// Obtener instancia del servidor WebSocket (se inyectará desde server.js)
let socketServer = null;

// Función para inyectar el servidor WebSocket
const setSocketServer = (io) => {
    socketServer = io;
};

module.exports = { router, setSocketServer };

// =============================================
// OBTENER LISTA DE EMPLEOS (PÚBLICO)
// =============================================

router.get('/',
    validateSearch,
    logAction('GET_JOBS_LIST'),
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                q = '',
                category = '',
                type = '',
                contract = '',
                experience = '',
                salary_min = '',
                salary_max = '',
                sort_by = 'created_at',
                order = 'DESC'
            } = req.query;

            const offset = (page - 1) * limit;
            
            // Construir consulta base
            let whereConditions = ['e.status = ?', 'e.fecha_limite > CURDATE()'];
            let queryParams = ['activo'];

            // Búsqueda por texto
            if (q) {
                whereConditions.push('(e.titulo LIKE ? OR e.descripcion LIKE ? OR e.empresa LIKE ?)');
                queryParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
            }

            // Filtros específicos
            if (category) {
                whereConditions.push('e.categoria = ?');
                queryParams.push(category);
            }

            if (type) {
                whereConditions.push('e.modalidad = ?');
                queryParams.push(type);
            }

            if (contract) {
                whereConditions.push('e.tipo_contrato = ?');
                queryParams.push(contract);
            }

            if (experience) {
                whereConditions.push('e.experiencia_requerida = ?');
                queryParams.push(experience);
            }

            if (salary_min) {
                whereConditions.push('e.salario_minimo >= ?');
                queryParams.push(parseFloat(salary_min));
            }

            if (salary_max) {
                whereConditions.push('e.salario_maximo <= ?');
                queryParams.push(parseFloat(salary_max));
            }

            const whereClause = whereConditions.join(' AND ');

            // Validar ordenamiento
            const validSortFields = ['created_at', 'titulo', 'empresa', 'salario_minimo', 'fecha_limite'];
            const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
            const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // Consulta principal
            const query = `
                SELECT 
                    e.id, e.titulo, e.descripcion, e.empresa, e.ubicacion,
                    e.salario_minimo, e.salario_maximo, e.tipo_contrato, e.modalidad,
                    e.categoria, e.requisitos, e.beneficios, e.habilidades_requeridas,
                    e.experiencia_requerida, e.nivel_educativo, e.fecha_limite,
                    e.status, e.vistas, e.postulaciones_count, e.created_at,
                    u.username as publicado_por_username,
                    p.nombre as publicado_por_nombre,
                    p.foto_perfil as publicado_por_avatar
                FROM empleos e
                LEFT JOIN usuarios u ON e.publicado_por = u.id
                LEFT JOIN perfiles p ON u.id = p.usuario_id
                WHERE ${whereClause}
                ORDER BY e.${sortField} ${sortOrder}
                LIMIT ? OFFSET ?
            `;

            const [jobs] = await pool.execute(query, [...queryParams, parseInt(limit), parseInt(offset)]);

            // Consulta para obtener total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM empleos e
                WHERE ${whereClause}
            `;

            const [countResult] = await pool.execute(countQuery, queryParams);
            const total = countResult[0].total;

            // Formatear resultados
            const formattedJobs = jobs.map(job => ({
                ...job,
                salario_formateado: job.salario_minimo && job.salario_maximo 
                    ? `$${job.salario_minimo.toLocaleString()} - $${job.salario_maximo.toLocaleString()}`
                    : job.salario_minimo 
                        ? `Desde $${job.salario_minimo.toLocaleString()}`
                        : 'No especificado',
                publicado_por: {
                    username: job.publicado_por_username,
                    nombre: job.publicado_por_nombre,
                    avatar: job.publicado_por_avatar
                }
            }));

            helpers.sendSuccess(res, {
                jobs: formattedJobs,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / limit),
                    total_items: total,
                    items_per_page: parseInt(limit)
                },
                filters: {
                    q, category, type, contract, experience, salary_min, salary_max
                }
            }, 'Empleos obtenidos exitosamente');
        } catch (error) {
            console.error('Error al obtener empleos:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// OBTENER DETALLES DE UN EMPLEO
// =============================================

router.get('/:id',
    validateId,
    logAction('GET_JOB_DETAILS'),
    async (req, res) => {
        try {
            const jobId = req.params.id;
            
            // Obtener detalles del empleo
            const [jobs] = await pool.execute(
                `SELECT 
                    e.id, e.titulo, e.descripcion, e.empresa, e.ubicacion,
                    e.salario_minimo, e.salario_maximo, e.tipo_contrato, e.modalidad,
                    e.categoria, e.requisitos, e.beneficios, e.habilidades_requeridas,
                    e.experiencia_requerida, e.nivel_educativo, e.fecha_limite,
                    e.status, e.vistas, e.postulaciones_count, e.created_at,
                    u.username as publicado_por_username,
                    u.email as publicado_por_email,
                    p.nombre as publicado_por_nombre,
                    p.apellido as publicado_por_apellido,
                    p.foto_perfil as publicado_por_avatar,
                    p.bio as publicado_por_bio
                 FROM empleos e
                 LEFT JOIN usuarios u ON e.publicado_por = u.id
                 LEFT JOIN perfiles p ON u.id = p.usuario_id
                 WHERE e.id = ? AND e.status = 'active'`,
                [jobId]
            );

            if (jobs.length === 0) {
                return helpers.sendError(res, new Error('Empleo no encontrado'), 404);
            }

            const job = jobs[0];

            // Incrementar contador de vistas
            await pool.execute(
                'UPDATE empleos SET vistas = vistas + 1 WHERE id = ?',
                [jobId]
            );

            // Verificar si el usuario actual ya ha postulado
            let yaPostulado = false;
            if (req.user) {
                const [postulaciones] = await pool.execute(
                    'SELECT id FROM postulaciones WHERE empleo_id = ? AND usuario_id = ?',
                    [jobId, req.user.id]
                );
                yaPostulado = postulaciones.length > 0;
            }

            // Formatear respuesta
            const jobDetails = {
                ...job,
                salario_formateado: job.salario_minimo && job.salario_maximo 
                    ? `$${job.salario_minimo.toLocaleString()} - $${job.salario_maximo.toLocaleString()}`
                    : job.salario_minimo 
                        ? `Desde $${job.salario_minimo.toLocaleString()}`
                        : 'No especificado',
                publicado_por: {
                    username: job.publicado_por_username,
                    email: job.publicado_por_email,
                    nombre: job.publicado_por_nombre,
                    apellido: job.publicado_por_apellido,
                    avatar: job.publicado_por_avatar,
                    bio: job.publicado_por_bio
                },
                ya_postulado: yaPostulado
            };

            helpers.sendSuccess(res, jobDetails, 'Detalles del empleo obtenidos exitosamente');
        } catch (error) {
            console.error('Error al obtener detalles del empleo:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// CREAR NUEVO EMPLEO
// =============================================

router.post('/',
    authenticateToken,
    requireActiveAccount,
    validateJobCreate,
    logAction('CREATE_JOB'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const jobData = req.body;

            // Insertar nuevo empleo
            const [result] = await pool.execute(
                `INSERT INTO empleos (
                    titulo, descripcion, empresa, ubicacion, salario_minimo, salario_maximo,
                    tipo_contrato, modalidad, categoria, requisitos, beneficios, habilidades_requeridas,
                    experiencia_requerida, nivel_educativo, fecha_limite, publicado_por, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
                [
                    jobData.titulo,
                    jobData.descripcion,
                    jobData.empresa,
                    jobData.ubicacion || null,
                    jobData.salario_minimo || null,
                    jobData.salario_maximo || null,
                    jobData.tipo_contrato,
                    jobData.modalidad,
                    jobData.categoria,
                    jobData.requisitos || null,
                    jobData.beneficios || null,
                    jobData.habilidades_requeridas || null,
                    jobData.experiencia_requerida,
                    jobData.nivel_educativo,
                    jobData.fecha_limite || null,
                    userId
                ]
            );

            const newJobId = result.insertId;

            // Obtener el empleo creado
            const [newJob] = await pool.execute(
                'SELECT * FROM empleos WHERE id = ?',
                [newJobId]
            );

            helpers.sendSuccess(res, newJob[0], 'Empleo creado exitosamente');
        } catch (error) {
            console.error('Error al crear empleo:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// ACTUALIZAR EMPLEO
// =============================================

router.put('/:id',
    authenticateToken,
    requireActiveAccount,
    validateId,
    requireOwnership('job'),
    validateJobCreate,
    logAction('UPDATE_JOB'),
    async (req, res) => {
        try {
            const jobId = req.params.id;
            const jobData = req.body;

            // Actualizar empleo
            await pool.execute(
                `UPDATE empleos SET 
                    titulo = ?, descripcion = ?, empresa = ?, ubicacion = ?,
                    salario_minimo = ?, salario_maximo = ?, tipo_contrato = ?,
                    modalidad = ?, categoria = ?, requisitos = ?, beneficios = ?,
                    habilidades_requeridas = ?, experiencia_requerida = ?,
                    nivel_educativo = ?, fecha_limite = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    jobData.titulo,
                    jobData.descripcion,
                    jobData.empresa,
                    jobData.ubicacion || null,
                    jobData.salario_minimo || null,
                    jobData.salario_maximo || null,
                    jobData.tipo_contrato,
                    jobData.modalidad,
                    jobData.categoria,
                    jobData.requisitos || null,
                    jobData.beneficios || null,
                    jobData.habilidades_requeridas || null,
                    jobData.experiencia_requerida,
                    jobData.nivel_educativo,
                    jobData.fecha_limite || null,
                    jobId
                ]
            );

            // Obtener empleo actualizado
            const [updatedJob] = await pool.execute(
                'SELECT * FROM empleos WHERE id = ?',
                [jobId]
            );

            helpers.sendSuccess(res, updatedJob[0], 'Empleo actualizado exitosamente');
        } catch (error) {
            console.error('Error al actualizar empleo:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// ELIMINAR EMPLEO
// =============================================

router.delete('/:id',
    authenticateToken,
    requireActiveAccount,
    validateId,
    requireOwnership('job'),
    logAction('DELETE_JOB'),
    async (req, res) => {
        try {
            const jobId = req.params.id;

            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // Eliminar postulaciones asociadas
                await connection.execute(
                    'DELETE FROM postulaciones WHERE empleo_id = ?',
                    [jobId]
                );

                // Eliminar empleo
                await connection.execute(
                    'DELETE FROM empleos WHERE id = ?',
                    [jobId]
                );

                await connection.commit();
                helpers.sendSuccess(res, null, 'Empleo eliminado exitosamente');
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error al eliminar empleo:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// POSTULARSE A UN EMPLEO
// =============================================

router.post('/:id/apply',
    authenticateToken,
    requireActiveAccount,
    validateId,
    rateLimitByUser(10, 60 * 60 * 1000), // 10 postulaciones por hora
    logAction('APPLY_JOB'),
    async (req, res) => {
        try {
            const jobId = req.params.id;
            const userId = req.user.id;
            const { mensaje, cv_url, portafolio_url } = req.body;

            // Verificar que el empleo exista y esté activo
            const [jobs] = await pool.execute(
                'SELECT id, titulo, empresa, fecha_limite FROM empleos WHERE id = ? AND status = "active"',
                [jobId]
            );

            if (jobs.length === 0) {
                return helpers.sendError(res, new Error('Empleo no encontrado o no está activo'), 404);
            }

            const job = jobs[0];

            // Verificar que la fecha límite no haya pasado
            if (job.fecha_limite && new Date(job.fecha_limite) < new Date()) {
                return helpers.sendError(res, new Error('La fecha límite para postular ha expirado'), 400);
            }

            // Verificar que el usuario no haya postulado anteriormente
            const [existingPostulaciones] = await pool.execute(
                'SELECT id FROM postulaciones WHERE empleo_id = ? AND usuario_id = ?',
                [jobId, userId]
            );

            if (existingPostulaciones.length > 0) {
                return helpers.sendError(res, new Error('Ya has postulado a este empleo'), 400);
            }

            // Crear postulación
            const [result] = await pool.execute(
                `INSERT INTO postulaciones (
                    empleo_id, usuario_id, mensaje, cv_url, portafolio_url, status
                ) VALUES (?, ?, ?, ?, ?, 'pending')`,
                [
                    jobId,
                    userId,
                    mensaje || '',
                    cv_url || null,
                    portafolio_url || null
                ]
            );

            // Actualizar contador de postulaciones del empleo
            await pool.execute(
                'UPDATE empleos SET postulaciones_count = postulaciones_count + 1 WHERE id = ?',
                [jobId]
            );

            // Crear notificación para el publicador del empleo
            const [publisher] = await pool.execute(
                'SELECT publicado_por FROM empleos WHERE id = ?',
                [jobId]
            );

            if (publisher.length > 0 && publisher[0].publicado_por !== userId) {
                await pool.execute(
                    `INSERT INTO notificaciones (
                        usuario_id, titulo, mensaje, tipo, relacion_id, relacion_tipo
                    ) VALUES (?, ?, ?, 'info', ?, 'job_application')`,
                    [
                        publisher[0].publicado_por,
                        'Nueva postulación',
                        `Alguien ha postulado a tu empleo "${job.titulo}" en ${job.empresa}`,
                        result.insertId
                    ]
                );

                // Enviar notificación en tiempo real via WebSocket
                if (socketServer) {
                    socketServer.sendJobApplicationNotification(publisher[0].publicado_por, {
                        id: result.insertId,
                        empleo: {
                            id: job.id,
                            titulo: job.titulo,
                            empresa: job.empresa
                        },
                        postulante: {
                            id: userId,
                            username: req.user.username
                        }
                    });
                }
            }

            helpers.sendSuccess(res, {
                postulacion_id: result.insertId,
                empleo: {
                    id: job.id,
                    titulo: job.titulo,
                    empresa: job.empresa
                }
            }, 'Postulación realizada exitosamente');
        } catch (error) {
            console.error('Error al postular al empleo:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// OBTENER POSTULACIONES DE UN EMPLEO (SOLO PUBLICADOR)
// =============================================

router.get('/:id/applications',
    authenticateToken,
    requireActiveAccount,
    validateId,
    requireOwnership('job'),
    validatePagination,
    logAction('GET_JOB_APPLICATIONS'),
    async (req, res) => {
        try {
            const jobId = req.params.id;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            // Obtener postulaciones con detalles del usuario
            const query = `
                SELECT 
                    p.id, p.mensaje, p.cv_url, p.portafolio_url, p.status, p.created_at,
                    u.username, u.email, u.created_at as usuario_creado,
                    up.nombre, up.apellido, up.telefono, up.bio, up.foto_perfil,
                    up.habilidades, up.experiencia, up.disponibilidad, up.modalidad_trabajo
                FROM postulaciones p
                JOIN usuarios u ON p.usuario_id = u.id
                LEFT JOIN perfiles up ON u.id = up.usuario_id
                WHERE p.empleo_id = ?
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [postulaciones] = await pool.execute(query, [jobId, parseInt(limit), parseInt(offset)]);

            // Obtener total
            const [countResult] = await pool.execute(
                'SELECT COUNT(*) as total FROM postulaciones WHERE empleo_id = ?',
                [jobId]
            );

            const total = countResult[0].total;

            helpers.sendSuccess(res, {
                postulaciones,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / limit),
                    total_items: total,
                    items_per_page: parseInt(limit)
                }
            }, 'Postulaciones obtenidas exitosamente');
        } catch (error) {
            console.error('Error al obtener postulaciones:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// ACTUALIZAR ESTADO DE POSTULACIÓN
// =============================================

router.put('/:id/applications/:applicationId',
    authenticateToken,
    requireActiveAccount,
    validateId,
    requireOwnership('job'),
    logAction('UPDATE_APPLICATION_STATUS'),
    async (req, res) => {
        try {
            const { applicationId } = req.params;
            const { status } = req.body;

            // Validar status
            const validStatuses = ['pending', 'reviewing', 'accepted', 'rejected'];
            if (!validStatuses.includes(status)) {
                return helpers.sendError(res, new Error('Estado inválido'), 400);
            }

            // Actualizar estado de postulación
            const [result] = await pool.execute(
                'UPDATE postulaciones SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, applicationId]
            );

            if (result.affectedRows === 0) {
                return helpers.sendError(res, new Error('Postulación no encontrada'), 404);
            }

            // Obtener detalles para notificación
            const [postulacion] = await pool.execute(
                `SELECT p.usuario_id, e.titulo, e.empresa 
                 FROM postulaciones p
                 JOIN empleos e ON p.empleo_id = e.id
                 WHERE p.id = ?`,
                [applicationId]
            );

            if (postulacion.length > 0) {
                const { usuario_id, titulo, empresa } = postulacion[0];
                
                // Crear notificación para el postulante
                const statusMessages = {
                    reviewing: 'Tu postulación está siendo revisada',
                    accepted: '¡Felicidades! Tu postulación ha sido aceptada',
                    rejected: 'Tu postulación no ha sido seleccionada'
                };

                await pool.execute(
                    `INSERT INTO notificaciones (
                        usuario_id, titulo, mensaje, tipo, relacion_id, relacion_tipo
                    ) VALUES (?, ?, ?, 'info', ?, 'application_status')`,
                    [
                        usuario_id,
                        'Actualización de postulación',
                        `${statusMessages[status]} para "${titulo}" en ${empresa}`,
                        applicationId
                    ]
                );
            }

            helpers.sendSuccess(res, null, 'Estado de postulación actualizado exitosamente');
        } catch (error) {
            console.error('Error al actualizar estado de postulación:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// MIS POSTULACIONES (USUARIO AUTENTICADO)
// =============================================

router.get('/my/applications',
    authenticateToken,
    requireActiveAccount,
    validatePagination,
    logAction('GET_MY_APPLICATIONS'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, status = '' } = req.query;
            const offset = (page - 1) * limit;

            let whereConditions = ['p.usuario_id = ?'];
            let queryParams = [userId];

            if (status) {
                whereConditions.push('p.status = ?');
                queryParams.push(status);
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT 
                    p.id, p.status, p.mensaje, p.created_at,
                    e.id as empleo_id, e.titulo, e.empresa, e.ubicacion,
                    e.tipo_contrato, e.modalidad, e.salario_minimo, e.salario_maximo,
                    e.fecha_limite, e.status as empleo_status
                FROM postulaciones p
                JOIN empleos e ON p.empleo_id = e.id
                WHERE ${whereClause}
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [postulaciones] = await pool.execute(query, [...queryParams, parseInt(limit), parseInt(offset)]);

            // Obtener total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM postulaciones p
                WHERE ${whereClause}
            `;

            const [countResult] = await pool.execute(countQuery, queryParams);
            const total = countResult[0].total;

            helpers.sendSuccess(res, {
                postulaciones,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / limit),
                    total_items: total,
                    items_per_page: parseInt(limit)
                }
            }, 'Mis postulaciones obtenidas exitosamente');
        } catch (error) {
            console.error('Error al obtener mis postulaciones:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// MIS EMPLEOS PUBLICADOS
// =============================================

router.get('/my/published',
    authenticateToken,
    requireActiveAccount,
    validatePagination,
    logAction('GET_MY_PUBLISHED_JOBS'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, status = '' } = req.query;
            const offset = (page - 1) * limit;

            let whereConditions = ['e.publicado_por = ?'];
            let queryParams = [userId];

            if (status) {
                whereConditions.push('e.status = ?');
                queryParams.push(status);
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT 
                    e.id, e.titulo, e.descripcion, e.empresa, e.ubicacion,
                    e.tipo_contrato, e.modalidad, e.salario_minimo, e.salario_maximo,
                    e.categoria, e.fecha_limite, e.status, e.vistas, e.postulaciones_count,
                    e.created_at, e.updated_at
                FROM empleos e
                WHERE ${whereClause}
                ORDER BY e.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [jobs] = await pool.execute(query, [...queryParams, parseInt(limit), parseInt(offset)]);

            // Obtener total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM empleos e
                WHERE ${whereClause}
            `;

            const [countResult] = await pool.execute(countQuery, queryParams);
            const total = countResult[0].total;

            helpers.sendSuccess(res, {
                jobs,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / limit),
                    total_items: total,
                    items_per_page: parseInt(limit)
                }
            }, 'Mis empleos publicados obtenidos exitosamente');
        } catch (error) {
            console.error('Error al obtener mis empleos publicados:', error);
            helpers.sendError(res, error);
        }
    }
);

module.exports = router;
