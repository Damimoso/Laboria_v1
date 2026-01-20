// =============================================
// SIMULACIÓN DE AUTENTICACIÓN - LABORIA
// =============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Base de datos simulada
const users = [];
const sessions = new Map();

// Administrador master preconfigurado
const adminMaster = {
    id: 1,
    username: 'AdminMaster',
    email: 'CurranteDigital@gmail.com',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // A.123456-a hasheada
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString()
};

// Inicializar con el administrador master
users.push(adminMaster);

class AuthSimulation {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'laboria_jwt_secret_2026';
        this.jwtExpiresIn = '7d';
    }

    // Registrar nuevo usuario
    async register(userData) {
        try {
            const { username, email, password } = userData;

            // Verificar si el usuario ya existe
            const existingUser = users.find(u => u.email === email || u.username === username);
            if (existingUser) {
                throw new Error('El usuario o email ya está registrado');
            }

            // Hashear contraseña
            const hashedPassword = await bcrypt.hash(password, 12);

            // Crear nuevo usuario
            const newUser = {
                id: users.length + 1,
                username,
                email,
                password: hashedPassword,
                role: 'user',
                status: 'active',
                created_at: new Date().toISOString()
            };

            users.push(newUser);

            return {
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    user: this.sanitizeUser(newUser),
                    token: this.generateToken(newUser)
                }
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Login de usuario
    async login(email, password) {
        try {
            // Buscar usuario por email
            const user = users.find(u => u.email === email);
            if (!user) {
                throw new Error('Credenciales inválidas');
            }

            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw new Error('Credenciales inválidas');
            }

            // Verificar estado del usuario
            if (user.status !== 'active') {
                throw new Error('Cuenta inactiva');
            }

            // Generar token
            const token = this.generateToken(user);

            // Actualizar último login
            user.last_login = new Date().toISOString();

            return {
                success: true,
                message: 'Login exitoso',
                data: {
                    user: this.sanitizeUser(user),
                    token
                }
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Verificar token JWT
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            const user = users.find(u => u.id === decoded.id);
            
            if (!user || user.status !== 'active') {
                throw new Error('Usuario no encontrado o inactivo');
            }

            return this.sanitizeUser(user);

        } catch (error) {
            throw new Error('Token inválido o expirado');
        }
    }

    // Obtener perfil de usuario
    async getProfile(userId) {
        try {
            const user = users.find(u => u.id === parseInt(userId));
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            return {
                success: true,
                message: 'Perfil obtenido exitosamente',
                data: this.sanitizeUser(user)
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Actualizar perfil
    async updateProfile(userId, updateData) {
        try {
            const userIndex = users.findIndex(u => u.id === parseInt(userId));
            if (userIndex === -1) {
                throw new Error('Usuario no encontrado');
            }

            // Actualizar datos permitidos
            const allowedFields = ['username', 'email'];
            const updates = {};

            for (const field of allowedFields) {
                if (updateData[field]) {
                    // Verificar si el nuevo username/email ya existe
                    if (field === 'username' || field === 'email') {
                        const existingUser = users.find(u => u[field] === updateData[field] && u.id !== parseInt(userId));
                        if (existingUser) {
                            throw new Error(`El ${field} ya está en uso`);
                        }
                    }
                    updates[field] = updateData[field];
                }
            }

            // Actualizar usuario
            Object.assign(users[userIndex], updates, {
                updated_at: new Date().toISOString()
            });

            return {
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: this.sanitizeUser(users[userIndex])
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Cambiar contraseña
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = users.find(u => u.id === parseInt(userId));
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar contraseña actual
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                throw new Error('Contraseña actual incorrecta');
            }

            // Hashear nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 12);

            // Actualizar contraseña
            user.password = hashedPassword;
            user.updated_at = new Date().toISOString();

            return {
                success: true,
                message: 'Contraseña actualizada exitosamente'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Eliminar cuenta
    async deleteAccount(userId, password) {
        try {
            const userIndex = users.findIndex(u => u.id === parseInt(userId));
            if (userIndex === -1) {
                throw new Error('Usuario no encontrado');
            }

            const user = users[userIndex];

            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw new Error('Contraseña incorrecta');
            }

            // Eliminar usuario
            users.splice(userIndex, 1);

            return {
                success: true,
                message: 'Cuenta eliminada exitosamente'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Obtener estadísticas de usuario
    async getUserStats(userId) {
        try {
            const user = users.find(u => u.id === parseInt(userId));
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Estadísticas simuladas
            const stats = {
                postulaciones: Math.floor(Math.random() * 10),
                inscripciones: Math.floor(Math.random() * 5),
                empleos_publicados: user.role === 'admin' || user.role === 'empresa' ? Math.floor(Math.random() * 15) : 0,
                cursos_creados: user.role === 'admin' || user.role === 'empresa' ? Math.floor(Math.random() * 8) : 0,
                perfil_completado: Math.random() > 0.3,
                ultima_actividad: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            return {
                success: true,
                message: 'Estadísticas obtenidas exitosamente',
                data: stats
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Generar token JWT
    generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            this.jwtSecret,
            { expiresIn: this.jwtExpiresIn }
        );
    }

    // Sanitizar datos de usuario para respuesta
    sanitizeUser(user) {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    // Obtener todos los usuarios (solo admin)
    async getAllUsers() {
        return users.map(user => this.sanitizeUser(user));
    }

    // Obtener usuarios por rol
    async getUsersByRole(role) {
        return users
            .filter(user => user.role === role)
            .map(user => this.sanitizeUser(user));
    }

    // Crear usuario (solo admin)
    async createUser(userData) {
        return this.register(userData);
    }

    // Eliminar usuario (solo admin)
    async deleteUser(userId) {
        try {
            const userIndex = users.findIndex(u => u.id === parseInt(userId));
            if (userIndex === -1) {
                throw new Error('Usuario no encontrado');
            }

            users.splice(userIndex, 1);

            return {
                success: true,
                message: 'Usuario eliminado exitosamente'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Obtener información del sistema
    getSystemInfo() {
        return {
            total_users: users.length,
            active_users: users.filter(u => u.status === 'active').length,
            roles: {
                admin: users.filter(u => u.role === 'admin').length,
                empresa: users.filter(u => u.role === 'empresa').length,
                user: users.filter(u => u.role === 'user').length
            },
            system_status: 'operational',
            last_update: new Date().toISOString()
        };
    }
}

// Crear instancia global
const authSimulation = new AuthSimulation();

module.exports = authSimulation;
