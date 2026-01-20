// =============================================
// TESTS DE AUTENTICACIÓN - LABORIA
// =============================================

const request = require('supertest');
const { pool } = require('../config/database');
const { helpers } = require('../config/constants');

describe('Autenticación', () => {
    let server;
    let testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#'
    };

    beforeAll(async () => {
        // Iniciar servidor de prueba
        server = require('../server');
        
        // Limpiar tabla de usuarios de prueba
        await pool.execute('DELETE FROM usuarios WHERE email LIKE ?', ['%@example.com']);
    });

    afterAll(async () => {
        // Cerrar servidor
        if (server) {
            server.close();
        }
        
        // Limpiar datos de prueba
        await pool.execute('DELETE FROM usuarios WHERE email LIKE ?', ['%@example.com']);
        
        // Cerrar conexión a base de datos
        await pool.end();
    });

    describe('POST /api/auth/register/usuario', () => {
        it('debería registrar un nuevo usuario exitosamente', async () => {
            const response = await request(server)
                .post('/api/auth/register/usuario')
                .send(testUser)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Usuario registrado exitosamente');
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.user.username).toBe(testUser.username);
            expect(response.body.data.token).toBeDefined();
        });

        it('debería rechazar registro con email inválido', async () => {
            const response = await request(server)
                .post('/api/auth/register/usuario')
                .send({
                    ...testUser,
                    email: 'email-invalido'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('inválido');
        });

        it('debería rechazar registro con contraseña débil', async () => {
            const response = await request(server)
                .post('/api/auth/register/usuario')
                .send({
                    ...testUser,
                    email: 'test2@example.com',
                    password: '123'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('contraseña');
        });

        it('debería rechazar registro con email duplicado', async () => {
            const response = await request(server)
                .post('/api/auth/register/usuario')
                .send(testUser)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('ya está registrado');
        });
    });

    describe('POST /api/auth/login/usuario', () => {
        it('debería iniciar sesión exitosamente', async () => {
            const response = await request(server)
                .post('/api/auth/login/usuario')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login exitoso');
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.token).toBeDefined();
        });

        it('debería rechazar login con email no registrado', async () => {
            const response = await request(server)
                .post('/api/auth/login/usuario')
                .send({
                    email: 'noexiste@example.com',
                    password: testUser.password
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Credenciales inválidas');
        });

        it('debería rechazar login con contraseña incorrecta', async () => {
            const response = await request(server)
                .post('/api/auth/login/usuario')
                .send({
                    email: testUser.email,
                    password: 'contraseña-incorrecta'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Credenciales inválidas');
        });

        it('debería rechazar login sin email', async () => {
            const response = await request(server)
                .post('/api/auth/login/usuario')
                .send({
                    password: testUser.password
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('requerido');
        });

        it('debería rechazar login sin contraseña', async () => {
            const response = await request(server)
                .post('/api/auth/login/usuario')
                .send({
                    email: testUser.email
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('requerido');
        });
    });

    describe('GET /api/auth/verify', () => {
        let token;

        beforeAll(async () => {
            // Obtener token válido
            const loginResponse = await request(server)
                .post('/api/auth/login/usuario')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });
            
            token = loginResponse.body.data.token;
        });

        it('debería verificar token válido exitosamente', async () => {
            const response = await request(server)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(testUser.email);
        });

        it('debería rechazar verificación sin token', async () => {
            const response = await request(server)
                .get('/api/auth/verify')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Token requerido');
        });

        it('debería rechazar verificación con token inválido', async () => {
            const response = await request(server)
                .get('/api/auth/verify')
                .set('Authorization', 'Bearer token-invalido')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('inválido');
        });

        it('debería rechazar verificación con formato de token incorrecto', async () => {
            const response = await request(server)
                .get('/api/auth/verify')
                .set('Authorization', 'token-sin-bearer')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/logout', () => {
        let token;

        beforeAll(async () => {
            // Obtener token válido
            const loginResponse = await request(server)
                .post('/api/auth/login/usuario')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });
            
            token = loginResponse.body.data.token;
        });

        it('debería cerrar sesión exitosamente', async () => {
            const response = await request(server)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Sesión cerrada exitosamente');
        });

        it('debería rechazar logout sin token', async () => {
            const response = await request(server)
                .post('/api/auth/logout')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Token requerido');
        });
    });
});

describe('Middleware de Autenticación', () => {
    let server;
    let token;

    beforeAll(async () => {
        server = require('../server');
        
        // Crear usuario y obtener token
        await request(server)
            .post('/api/auth/register/usuario')
            .send({
                username: 'middlewaretest',
                email: 'middleware@example.com',
                password: 'Test123!@#'
            });

        const loginResponse = await request(server)
            .post('/api/auth/login/usuario')
            .send({
                email: 'middleware@example.com',
                password: 'Test123!@#'
            });

        token = loginResponse.body.data.token;
    });

    afterAll(async () => {
        if (server) {
            server.close();
        }
        
        await pool.execute('DELETE FROM usuarios WHERE email LIKE ?', ['%@example.com']);
        await pool.end();
    });

    describe('Protección de rutas', () => {
        it('debería permitir acceso a ruta protegida con token válido', async () => {
            const response = await request(server)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('debería rechazar acceso a ruta protegida sin token', async () => {
            const response = await request(server)
                .get('/api/users/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('debería rechazar acceso a ruta protegida con token inválido', async () => {
            const response = await request(server)
                .get('/api/users/profile')
                .set('Authorization', 'Bearer token-invalido')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});

describe('Validación de Inputs', () => {
    let server;

    beforeAll(() => {
        server = require('../server');
    });

    afterAll(() => {
        if (server) {
            server.close();
        }
    });

    describe('Validación de email', () => {
        const invalidEmails = [
            'sin-arroba',
            '@dominio.com',
            'usuario@',
            'usuario@.com',
            'usuario@dominio.',
            'usuario espacio@dominio.com'
        ];

        invalidEmails.forEach(email => {
            it(`debería rechazar email inválido: ${email}`, async () => {
                const response = await request(server)
                    .post('/api/auth/register/usuario')
                    .send({
                        username: 'test',
                        email: email,
                        password: 'Test123!@#'
                    })
                    .expect(400);

                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('Validación de contraseña', () => {
        const invalidPasswords = [
            '123', // muy corta
            'abcdefgh', // sin mayúsculas, números o caracteres especiales
            'ABCDEFGH', // sin minúsculas, números o caracteres especiales
            '12345678', // sin mayúsculas, minúsculas o caracteres especiales
            'Abcdefgh', // sin números o caracteres especiales
            'Abcdef12', // sin caracteres especiales
            '12345678!@#', // sin mayúsculas o minúsculas
            'ABCDEFGH!@#', // sin minúsculas o números
            'abcdefgh!@#' // sin mayúsculas o números
        ];

        invalidPasswords.forEach(password => {
            it(`debería rechazar contraseña inválida: ${password}`, async () => {
                const response = await request(server)
                    .post('/api/auth/register/usuario')
                    .send({
                        username: 'test',
                        email: `test-${Math.random()}@example.com`,
                        password: password
                    })
                    .expect(400);

                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('Validación de username', () => {
        const invalidUsernames = [
            'ab', // muy corto
            'a'.repeat(51), // muy largo
            'user name', // contiene espacios
            'user@name', // contiene caracteres especiales no permitidos
            'user-name', // contiene guiones (depende de la validación)
            '123', // solo números (depende de la validación)
            '' // vacío
        ];

        invalidUsernames.forEach(username => {
            it(`debería rechazar username inválido: ${username}`, async () => {
                const response = await request(server)
                    .post('/api/auth/register/usuario')
                    .send({
                        username: username,
                        email: `test-${Math.random()}@example.com`,
                        password: 'Test123!@#'
                    })
                    .expect(400);

                expect(response.body.success).toBe(false);
            });
        });
    });
});
