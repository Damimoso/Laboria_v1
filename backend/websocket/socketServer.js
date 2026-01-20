// =============================================
// SERVIDOR WEBSOCKET - LABORIA
// =============================================

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { helpers } = require('../config/constants');

class SocketServer {
    constructor(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5500'],
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.connectedUsers = new Map(); // userId -> socketId
        this.userSockets = new Map();   // socketId -> userId
        this.setupMiddleware();
        this.setupEventHandlers();
    }

    // =============================================
    // MIDDLEWARE DE AUTENTICACIÓN WEBSOCKET
    // =============================================

    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                
                if (!token) {
                    return next(new Error('Token de autenticación requerido'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'laboria_jwt_secret_2026');
                socket.userId = decoded.id;
                socket.userRole = decoded.role;
                socket.username = decoded.username;
                
                next();
            } catch (error) {
                console.error('Error en autenticación WebSocket:', error);
                next(new Error('Token inválido o expirado'));
            }
        });
    }

    // =============================================
    // MANEJADORES DE EVENTOS
    // =============================================

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Usuario conectado: ${socket.username} (${socket.userId})`);
            
            // Registrar usuario conectado
            this.connectedUsers.set(socket.userId, socket.id);
            this.userSockets.set(socket.id, socket.userId);

            // Unir al usuario a su sala personal
            socket.join(`user_${socket.userId}`);
            
            // Unir a sala de rol
            socket.join(`role_${socket.userRole}`);

            // Enviar notificación de conexión
            socket.emit('connected', {
                message: 'Conectado exitosamente',
                userId: socket.userId,
                timestamp: new Date().toISOString()
            });

            // Notificar a otros usuarios (si es admin)
            if (socket.userRole === 'admin') {
                socket.to('role_admin').emit('admin_connected', {
                    adminId: socket.userId,
                    username: socket.username,
                    timestamp: new Date().toISOString()
                });
            }

            // =============================================
            // EVENTOS DE USUARIO
            // =============================================

            // Unirse a sala de empleo
            socket.on('join_job_room', (jobId) => {
                socket.join(`job_${jobId}`);
                socket.emit('joined_job_room', { jobId });
            });

            // Salir de sala de empleo
            socket.on('leave_job_room', (jobId) => {
                socket.leave(`job_${jobId}`);
                socket.emit('left_job_room', { jobId });
            });

            // Unirse a sala de curso
            socket.on('join_course_room', (courseId) => {
                socket.join(`course_${courseId}`);
                socket.emit('joined_course_room', { courseId });
            });

            // Salir de sala de curso
            socket.on('leave_course_room', (courseId) => {
                socket.leave(`course_${courseId}`);
                socket.emit('left_course_room', { courseId });
            });

            // Actualizar estado de escritura
            socket.on('typing', (data) => {
                const { roomId, type } = data;
                socket.to(roomId).emit('user_typing', {
                    userId: socket.userId,
                    username: socket.username,
                    type
                });
            });

            // Dejar de escribir
            socket.on('stop_typing', (data) => {
                const { roomId } = data;
                socket.to(roomId).emit('user_stop_typing', {
                    userId: socket.userId
                });
            });

            // =============================================
            // EVENTOS DE CHAT (FUTURO)
            // =============================================

            socket.on('send_message', (data) => {
                const { roomId, message, type = 'text' } = data;
                
                const messageData = {
                    id: Date.now(),
                    userId: socket.userId,
                    username: socket.username,
                    message,
                    type,
                    timestamp: new Date().toISOString()
                };

                // Enviar a todos en la sala
                this.io.to(roomId).emit('new_message', messageData);
            });

            // =============================================
            // EVENTOS DE NOTIFICACIONES
            // =============================================

            // Marcar notificación como leída
            socket.on('mark_notification_read', (notificationId) => {
                // Aquí podrías actualizar la base de datos
                socket.emit('notification_marked_read', { notificationId });
            });

            // Obtener notificaciones no leídas
            socket.on('get_unread_notifications', async () => {
                try {
                    const { pool } = require('../config/database');
                    const [notifications] = await pool.execute(
                        'SELECT * FROM notificaciones WHERE usuario_id = ? AND leida = false ORDER BY created_at DESC LIMIT 10',
                        [socket.userId]
                    );
                    
                    socket.emit('unread_notifications', notifications);
                } catch (error) {
                    console.error('Error obteniendo notificaciones:', error);
                    socket.emit('error', { message: 'Error al obtener notificaciones' });
                }
            });

            // =============================================
            // EVENTOS DE ESTADO EN LÍNEA
            // =============================================

            // Actualizar estado
            socket.on('update_status', (status) => {
                socket.userStatus = status;
                socket.to('role_admin').emit('user_status_updated', {
                    userId: socket.userId,
                    username: socket.username,
                    status,
                    timestamp: new Date().toISOString()
                });
            });

            // Obtener usuarios en línea
            socket.on('get_online_users', () => {
                const onlineUsers = Array.from(this.connectedUsers.entries()).map(([userId, socketId]) => ({
                    userId,
                    socketId,
                    status: this.io.sockets.sockets.get(socketId)?.userStatus || 'online'
                }));
                
                socket.emit('online_users', onlineUsers);
            });

            // =============================================
            // DESCONEXIÓN
            // =============================================

            socket.on('disconnect', (reason) => {
                console.log(`🔌 Usuario desconectado: ${socket.username} (${socket.userId}) - Razón: ${reason}`);
                
                // Limpiar registros
                this.connectedUsers.delete(socket.userId);
                this.userSockets.delete(socket.id);

                // Notificar a otros admins
                if (socket.userRole === 'admin') {
                    socket.to('role_admin').emit('admin_disconnected', {
                        adminId: socket.userId,
                        username: socket.username,
                        timestamp: new Date().toISOString()
                    });
                }

                // Notificar estado de desconexión
                socket.to('role_admin').emit('user_disconnected', {
                    userId: socket.userId,
                    username: socket.username,
                    timestamp: new Date().toISOString()
                });
            });

            // Manejar errores
            socket.on('error', (error) => {
                console.error(`❌ Error en socket ${socket.id}:`, error);
            });
        });
    }

    // =============================================
    // MÉTODOS PÚBLICOS PARA ENVIAR NOTIFICACIONES
    // =============================================

    // Enviar notificación a usuario específico
    sendToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
            return true;
        }
        return false;
    }

    // Enviar notificación a todos los usuarios de un rol
    sendToRole(role, event, data) {
        this.io.to(`role_${role}`).emit(event, data);
    }

    // Enviar notificación a sala de empleo
    sendToJobRoom(jobId, event, data) {
        this.io.to(`job_${jobId}`).emit(event, data);
    }

    // Enviar notificación a sala de curso
    sendToCourseRoom(courseId, event, data) {
        this.io.to(`course_${courseId}`).emit(event, data);
    }

    // Enviar notificación a todos los usuarios conectados
    sendToAll(event, data) {
        this.io.emit(event, data);
    }

    // Enviar notificación de nueva notificación
    sendNotification(userId, notification) {
        this.sendToUser(userId, 'new_notification', {
            ...notification,
            timestamp: new Date().toISOString()
        });
    }

    // Enviar notificación de nueva postulación
    sendJobApplicationNotification(publisherId, applicationData) {
        this.sendToUser(publisherId, 'new_job_application', {
            ...applicationData,
            timestamp: new Date().toISOString()
        });
    }

    // Enviar notificación de nueva inscripción
    sendCourseEnrollmentNotification(instructorId, enrollmentData) {
        this.sendToUser(instructorId, 'new_course_enrollment', {
            ...enrollmentData,
            timestamp: new Date().toISOString()
        });
    }

    // Enviar notificación de actualización de estado
    sendStatusUpdateNotification(userId, updateData) {
        this.sendToUser(userId, 'status_update', {
            ...updateData,
            timestamp: new Date().toISOString()
        });
    }

    // =============================================
    // ESTADÍSTICAS Y MONITOREO
    // =============================================

    getStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            totalSockets: this.io.sockets.sockets.size,
            rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
            timestamp: new Date().toISOString()
        };
    }

    // Obtener usuarios conectados por rol
    getConnectedUsersByRole() {
        const roleStats = {};
        
        this.io.sockets.sockets.forEach(socket => {
            const role = socket.userRole;
            if (!roleStats[role]) {
                roleStats[role] = 0;
            }
            roleStats[role]++;
        });

        return roleStats;
    }

    // =============================================
    // LIMPIEZA Y MANTENIMIENTO
    // =============================================

    // Limpiar sockets desconectados
    cleanupDisconnectedSockets() {
        const connectedSocketIds = new Set(this.io.sockets.sockets.keys());
        
        // Limpiar userSockets
        for (const [socketId, userId] of this.userSockets.entries()) {
            if (!connectedSocketIds.has(socketId)) {
                this.userSockets.delete(socketId);
                this.connectedUsers.delete(userId);
            }
        }
    }

    // Enviar heartbeat para mantener conexiones vivas
    startHeartbeat() {
        setInterval(() => {
            this.cleanupDisconnectedSockets();
            this.io.emit('heartbeat', { timestamp: new Date().toISOString() });
        }, 30000); // Cada 30 segundos
    }
}

module.exports = SocketServer;
