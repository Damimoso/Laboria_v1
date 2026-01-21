// =============================================
// RUTAS DE USUARIOS - LABORIA
// =============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { helpers } = require('../config/constants');
const { 
    authenticateToken, 
    requireActiveAccount, 
    requireOwnership,
    logAction,
    rateLimitByUser
} = require('../middleware/auth');
const { 
    validateProfileUpdate, 
    validateId,
    validatePagination,
    validateFileUpload
} = require('../middleware/validation');
const router = express.Router();

// =============================================
// OBTENER PERFIL DE USUARIO AUTENTICADO
// =============================================

router.get('/profile', 
    authenticateToken,
    requireActiveAccount,
    logAction('GET_PROFILE'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            
            // Obtener datos básicos del usuario
            const [users] = await pool.execute(
                `SELECT u.id, u.username, u.email, u.role, u.status, u.email_verified, u.last_login, u.created_at,
                        p.nombre, p.apellido, p.telefono, p.fecha_nacimiento, p.genero, p.pais, p.ciudad,
                        p.bio, p.habilidades, p.experiencia, p.portfolio, p.linkedin, p.github, p.website,
                        p.foto_perfil, p.disponibilidad, p.salario_minimo, p.salario_maximo, p.modalidad_trabajo
                 FROM usuarios u
                 LEFT JOIN perfiles p ON u.id = p.usuario_id
                 WHERE u.id = ?`,
                [userId]
            );

            if (users.length === 0) {
                return helpers.sendError(res, new Error('Usuario no encontrado'), 404);
            }

            const user = users[0];
            
            // Formatear respuesta
            const profileData = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
                email_verified: user.email_verified,
                last_login: user.last_login,
                created_at: user.created_at,
                profile: {
                    nombre: user.nombre,
                    apellido: user.apellido,
                    telefono: user.telefono,
                    fecha_nacimiento: user.fecha_nacimiento,
                    genero: user.genero,
                    pais: user.pais,
                    ciudad: user.ciudad,
                    bio: user.bio,
                    habilidades: user.habilidades,
                    experiencia: user.experiencia,
                    portfolio: user.portfolio,
                    linkedin: user.linkedin,
                    github: user.github,
                    website: user.website,
                    foto_perfil: user.foto_perfil,
                    disponibilidad: user.disponibilidad,
                    salario_minimo: user.salario_minimo,
                    salario_maximo: user.salario_maximo,
                    modalidad_trabajo: user.modalidad_trabajo
                }
            };

            helpers.sendSuccess(res, profileData, 'Perfil obtenido exitosamente');
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// ACTUALIZAR PERFIL DE USUARIO
// =============================================

router.put('/profile',
    authenticateToken,
    requireActiveAccount,
    validateProfileUpdate,
    logAction('UPDATE_PROFILE'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const profileData = req.body;

            // Verificar si ya existe un perfil
            const [existingProfile] = await pool.execute(
                'SELECT usuario_id FROM perfiles WHERE usuario_id = ?',
                [userId]
            );

            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();

                if (existingProfile.length > 0) {
                    // Actualizar perfil existente
                    await connection.execute(
                        `UPDATE perfiles SET 
                            nombre = ?, apellido = ?, telefono = ?, fecha_nacimiento = ?, genero = ?,
                            pais = ?, ciudad = ?, bio = ?, habilidades = ?, experiencia = ?,
                            portfolio = ?, linkedin = ?, github = ?, website = ?,
                            disponibilidad = ?, salario_minimo = ?, salario_maximo = ?, modalidad_trabajo = ?,
                            updated_at = CURRENT_TIMESTAMP
                         WHERE usuario_id = ?`,
                        [
                            profileData.nombre || null,
                            profileData.apellido || null,
                            profileData.telefono || null,
                            profileData.fecha_nacimiento || null,
                            profileData.genero || null,
                            profileData.pais || null,
                            profileData.ciudad || null,
                            profileData.bio || null,
                            profileData.habilidades || null,
                            profileData.experiencia || null,
                            profileData.portfolio || null,
                            profileData.linkedin || null,
                            profileData.github || null,
                            profileData.website || null,
                            profileData.disponibilidad || null,
                            profileData.salario_minimo || null,
                            profileData.salario_maximo || null,
                            profileData.modalidad_trabajo || null,
                            userId
                        ]
                    );
                } else {
                    // Crear nuevo perfil
                    await connection.execute(
                        `INSERT INTO perfiles (
                            usuario_id, nombre, apellido, telefono, fecha_nacimiento, genero,
                            pais, ciudad, bio, habilidades, experiencia,
                            portfolio, linkedin, github, website,
                            disponibilidad, salario_minimo, salario_maximo, modalidad_trabajo
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            userId,
                            profileData.nombre || null,
                            profileData.apellido || null,
                            profileData.telefono || null,
                            profileData.fecha_nacimiento || null,
                            profileData.genero || null,
                            profileData.pais || null,
                            profileData.ciudad || null,
                            profileData.bio || null,
                            profileData.habilidades || null,
                            profileData.experiencia || null,
                            profileData.portfolio || null,
                            profileData.linkedin || null,
                            profileData.github || null,
                            profileData.website || null,
                            profileData.disponibilidad || null,
                            profileData.salario_minimo || null,
                            profileData.salario_maximo || null,
                            profileData.modalidad_trabajo || null
                        ]
                    );
                }

                await connection.commit();
                helpers.sendSuccess(res, null, 'Perfil actualizado exitosamente');
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// SUBIR FOTO DE PERFIL
// =============================================

router.post('/upload-avatar',
    authenticateToken,
    requireActiveAccount,
    require('multer')({ 
        dest: './uploads',
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (req, file, cb) => {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            cb(null, allowedTypes.includes(file.mimetype));
        }
    }).single('avatar'),
    validateFileUpload(),
    logAction('UPLOAD_AVATAR'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            
            if (!req.file) {
                return helpers.sendError(res, new Error('No se proporcionó ningún archivo'), 400);
            }

            const filename = req.file.filename;
            const avatarUrl = `/uploads/${filename}`;

            // Actualizar base de datos
            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // Verificar si ya existe un perfil
                const [existingProfile] = await connection.execute(
                    'SELECT usuario_id FROM perfiles WHERE usuario_id = ?',
                    [userId]
                );

                if (existingProfile.length > 0) {
                    await connection.execute(
                        'UPDATE perfiles SET foto_perfil = ?, updated_at = CURRENT_TIMESTAMP WHERE usuario_id = ?',
                        [avatarUrl, userId]
                    );
                } else {
                    await connection.execute(
                        'INSERT INTO perfiles (usuario_id, foto_perfil) VALUES (?, ?)',
                        [userId, avatarUrl]
                    );
                }

                await connection.commit();
                
                helpers.sendSuccess(res, {
                    avatarUrl,
                    filename
                }, 'Foto de perfil actualizada exitosamente');
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error al subir avatar:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// OBTENER USUARIO POR ID (PÚBLICO)
// =============================================

router.get('/:id',
    validateId,
    logAction('GET_PUBLIC_USER'),
    async (req, res) => {
        try {
            const userId = req.params.id;
            
            // Obtener datos públicos del usuario
            const [users] = await pool.execute(
                `SELECT u.id, u.username, u.role, u.created_at,
                        p.nombre, p.apellido, p.bio, p.habilidades, p.experiencia,
                        p.portfolio, p.linkedin, p.github, p.website, p.foto_perfil,
                        p.disponibilidad, p.modalidad_trabajo
                 FROM usuarios u
                 LEFT JOIN perfiles p ON u.id = p.usuario_id
                 WHERE u.id = ? AND u.status = 'active'`,
                [userId]
            );

            if (users.length === 0) {
                return helpers.sendError(res, new Error('Usuario no encontrado'), 404);
            }

            const user = users[0];
            
            // Formatear respuesta (solo datos públicos)
            const publicProfile = {
                id: user.id,
                username: user.username,
                role: user.role,
                created_at: user.created_at,
                profile: {
                    nombre: user.nombre,
                    apellido: user.apellido,
                    bio: user.bio,
                    habilidades: user.habilidades,
                    experiencia: user.experiencia,
                    portfolio: user.portfolio,
                    linkedin: user.linkedin,
                    github: user.github,
                    website: user.website,
                    foto_perfil: user.foto_perfil,
                    disponibilidad: user.disponibilidad,
                    modalidad_trabajo: user.modalidad_trabajo
                }
            };

            helpers.sendSuccess(res, publicProfile, 'Perfil público obtenido exitosamente');
        } catch (error) {
            console.error('Error al obtener perfil público:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// CAMBIAR CONTRASEÑA
// =============================================

router.put('/change-password',
    authenticateToken,
    requireActiveAccount,
    rateLimitByUser(3, 15 * 60 * 1000), // 3 intentos cada 15 minutos
    logAction('CHANGE_PASSWORD'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return helpers.sendError(res, new Error('Contraseña actual y nueva son requeridas'), 400);
            }

            // Validar nueva contraseña
            if (newPassword.length < 8) {
                return helpers.sendError(res, new Error('La nueva contraseña debe tener al menos 8 caracteres'), 400);
            }

            // Obtener contraseña actual del usuario
            const [users] = await pool.execute(
                'SELECT password FROM usuarios WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return helpers.sendError(res, new Error('Usuario no encontrado'), 404);
            }

            // Verificar contraseña actual
            const isValidPassword = await helpers.comparePassword(currentPassword, users[0].password);
            if (!isValidPassword) {
                return helpers.sendError(res, new Error('Contraseña actual incorrecta'), 400);
            }

            // Hashear nueva contraseña
            const hashedPassword = await helpers.hashPassword(newPassword);

            // Actualizar contraseña
            await pool.execute(
                'UPDATE usuarios SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedPassword, userId]
            );

            helpers.sendSuccess(res, null, 'Contraseña cambiada exitosamente');
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// ELIMINAR CUENTA
// =============================================

router.delete('/account',
    authenticateToken,
    requireActiveAccount,
    logAction('DELETE_ACCOUNT'),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const { password } = req.body;

            if (!password) {
                return helpers.sendError(res, new Error('Contraseña requerida para eliminar cuenta'), 400);
            }

            // Obtener contraseña del usuario
            const [users] = await pool.execute(
                'SELECT password FROM usuarios WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return helpers.sendError(res, new Error('Usuario no encontrado'), 404);
            }

            // Verificar contraseña
            const isValidPassword = await helpers.comparePassword(password, users[0].password);
            if (!isValidPassword) {
                return helpers.sendError(res, new Error('Contraseña incorrecta'), 400);
            }

            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // Eliminar perfil
                await connection.execute(
                    'DELETE FROM perfiles WHERE usuario_id = ?',
                    [userId]
                );

                // Eliminar notificaciones
                await connection.execute(
                    'DELETE FROM notificaciones WHERE usuario_id = ?',
                    [userId]
                );

                // Eliminar mensajes
                await connection.execute(
                    'DELETE FROM mensajes WHERE remitente_id = ? OR destinatario_id = ?',
                    [userId, userId]
                );

                // Eliminar postulaciones
                await connection.execute(
                    'DELETE FROM postulaciones WHERE usuario_id = ?',
                    [userId]
                );

                // Eliminar inscripciones
                await connection.execute(
                    'DELETE FROM inscripciones WHERE usuario_id = ?',
                    [userId]
                );

                // Eliminar usuario
                await connection.execute(
                    'DELETE FROM usuarios WHERE id = ?',
                    [userId]
                );

                await connection.commit();
                helpers.sendSuccess(res, null, 'Cuenta eliminada exitosamente');
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error al eliminar cuenta:', error);
            helpers.sendError(res, error);
        }
    }
);

// =============================================
// ESTADÍSTICAS DEL USUARIO
// =============================================

router.get('/stats',
    authenticateToken,
    requireActiveAccount,
    logAction('GET_USER_STATS'),
    async (req, res) => {
        try {
            const userId = req.user.id;

            // Obtener estadísticas
            const [postulaciones] = await pool.execute(
                'SELECT COUNT(*) as total FROM postulaciones WHERE usuario_id = ?',
                [userId]
            );

            const [inscripciones] = await pool.execute(
                'SELECT COUNT(*) as total FROM inscripciones WHERE usuario_id = ?',
                [userId]
            );

            const [empleosPublicados] = await pool.execute(
                'SELECT COUNT(*) as total FROM empleos WHERE publicado_por = ?',
                [userId]
            );

            const [cursosCreados] = await pool.execute(
                'SELECT COUNT(*) as total FROM cursos WHERE creado_por = ?',
                [userId]
            );

            const stats = {
                postulaciones: postulaciones[0].total,
                inscripciones: inscripciones[0].total,
                empleos_publicados: empleosPublicados[0].total,
                cursos_creados: cursosCreados[0].total,
                miembro_desde: req.user.created_at,
                ultimo_login: req.user.last_login
            };

            helpers.sendSuccess(res, stats, 'Estadísticas obtenidas exitosamente');
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            helpers.sendError(res, error);
        }
    }
);

module.exports = router;
