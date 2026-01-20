// =============================================
// TESTS DE EMPLEOS - LABORIA
// =============================================

const request = require('supertest');
const { pool } = require('../config/database');

describe('Empleos', () => {
    let server;
    let authToken;
    let testUser = {
        username: 'jobtest',
        email: 'jobtest@example.com',
        password: 'Test123!@#'
    };
    let testJob = {
        titulo: 'Desarrollador Full Stack',
        descripcion: 'Buscamos desarrollador con experiencia en React y Node.js',
        empresa: 'Tech Company',
        ubicacion: 'Remoto',
        tipo_contrato: 'tiempo_completo',
        modalidad: 'remoto',
        categoria: 'Tecnología',
        experiencia_requerida: '3_anios',
        nivel_educativo: 'universitario'
    };

    beforeAll(async () => {
        server = require('../server');
        
        // Registrar y autenticar usuario de prueba
        await request(server)
            .post('/api/auth/register/usuario')
            .send(testUser);

        const loginResponse = await request(server)
            .post('/api/auth/login/usuario')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        authToken = loginResponse.body.data.token;
    });

    afterAll(async () => {
        if (server) {
            server.close();
        }
        
        // Limpiar datos de prueba
        await pool.execute('DELETE FROM empleos WHERE titulo LIKE ?', ['%Test%']);
        await pool.execute('DELETE FROM usuarios WHERE email LIKE ?', ['%@example.com']);
        await pool.end();
    });

    describe('POST /api/jobs', () => {
        it('debería crear un nuevo empleo exitosamente', async () => {
            const response = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testJob)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Empleo creado exitosamente');
            expect(response.body.data.titulo).toBe(testJob.titulo);
            expect(response.body.data.empresa).toBe(testJob.empresa);
            expect(response.body.data.publicado_por).toBeDefined();
        });

        it('debería rechazar creación sin autenticación', async () => {
            const response = await request(server)
                .post('/api/jobs')
                .send(testJob)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('debería rechazar creación con título inválido', async () => {
            const response = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testJob,
                    titulo: 'ab' // muy corto
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('debería rechazar creación sin descripción', async () => {
            const response = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testJob,
                    descripcion: ''
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('debería rechazar creación con tipo de contrato inválido', async () => {
            const response = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testJob,
                    tipo_contrato: 'tipo_invalido'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/jobs', () => {
        let createdJobId;

        beforeAll(async () => {
            // Crear empleo de prueba
            const createResponse = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testJob,
                    titulo: 'Test Job for List'
                });
            
            createdJobId = createResponse.body.data.id;
        });

        it('debería obtener lista de empleos', async () => {
            const response = await request(server)
                .get('/api/jobs')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.jobs).toBeInstanceOf(Array);
            expect(response.body.data.pagination).toBeDefined();
            expect(response.body.data.jobs.length).toBeGreaterThan(0);
        });

        it('debería filtrar empleos por categoría', async () => {
            const response = await request(server)
                .get('/api/jobs?category=Tecnología')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.jobs.every(job => job.categoria === 'Tecnología')).toBe(true);
        });

        it('debería filtrar empleos por modalidad', async () => {
            const response = await request(server)
                .get('/api/jobs?type=remoto')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.jobs.every(job => job.modalidad === 'remoto')).toBe(true);
        });

        it('debería buscar empleos por texto', async () => {
            const response = await request(server)
                .get('/api/jobs?q=Desarrollador')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.jobs.some(job => 
                job.titulo.includes('Desarrollador') || 
                job.descripcion.includes('Desarrollador')
            )).toBe(true);
        });

        it('debería paginar resultados', async () => {
            const response = await request(server)
                .get('/api/jobs?page=1&limit=5')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.current_page).toBe(1);
            expect(response.body.data.pagination.items_per_page).toBe(5);
        });
    });

    describe('GET /api/jobs/:id', () => {
        let createdJobId;

        beforeAll(async () => {
            // Crear empleo de prueba
            const createResponse = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testJob,
                    titulo: 'Test Job for Details'
                });
            
            createdJobId = createResponse.body.data.id;
        });

        it('debería obtener detalles de un empleo', async () => {
            const response = await request(server)
                .get(`/api/jobs/${createdJobId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(createdJobId);
            expect(response.body.data.titulo).toBe('Test Job for Details');
            expect(response.body.data.publicado_por).toBeDefined();
        });

        it('debería rechazar detalles de empleo inexistente', async () => {
            const response = await request(server)
                .get('/api/jobs/99999')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('no encontrado');
        });

        it('debería incrementar contador de vistas', async () => {
            // Primera vista
            const response1 = await request(server)
                .get(`/api/jobs/${createdJobId}`)
                .expect(200);
            
            const vistas1 = response1.body.data.vistas;

            // Segunda vista
            const response2 = await request(server)
                .get(`/api/jobs/${createdJobId}`)
                .expect(200);
            
            const vistas2 = response2.body.data.vistas;

            expect(vistas2).toBe(vistas1 + 1);
        });
    });

    describe('PUT /api/jobs/:id', () => {
        let createdJobId;

        beforeAll(async () => {
            // Crear empleo de prueba
            const createResponse = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testJob);
            
            createdJobId = createResponse.body.data.id;
        });

        it('debería actualizar empleo exitosamente', async () => {
            const updateData = {
                titulo: 'Desarrollador Senior Full Stack',
                descripcion: 'Buscamos desarrollador senior con 5+ años de experiencia',
                salario_minimo: 50000,
                salario_maximo: 80000
            };

            const response = await request(server)
                .put(`/api/jobs/${createdJobId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.titulo).toBe(updateData.titulo);
            expect(response.body.data.salario_minimo).toBe(updateData.salario_minimo);
        });

        it('debería rechazar actualización sin autenticación', async () => {
            const response = await request(server)
                .put(`/api/jobs/${createdJobId}`)
                .send({ titulo: 'Nuevo título' })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('debería rechazar actualización de empleo de otro usuario', async () => {
            // Crear otro usuario
            await request(server)
                .post('/api/auth/register/usuario')
                .send({
                    username: 'otheruser',
                    email: 'other@example.com',
                    password: 'Test123!@#'
                });

            const otherLoginResponse = await request(server)
                .post('/api/auth/login/usuario')
                .send({
                    email: 'other@example.com',
                    password: 'Test123!@#'
                });

            const otherToken = otherLoginResponse.body.data.token;

            // Intentar actualizar empleo del primer usuario
            const response = await request(server)
                .put(`/api/jobs/${createdJobId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ titulo: 'Intento de actualización' })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('permisos');
        });
    });

    describe('DELETE /api/jobs/:id', () => {
        let createdJobId;

        beforeAll(async () => {
            // Crear empleo de prueba
            const createResponse = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testJob,
                    titulo: 'Test Job for Deletion'
                });
            
            createdJobId = createResponse.body.data.id;
        });

        it('debería eliminar empleo exitosamente', async () => {
            const response = await request(server)
                .delete(`/api/jobs/${createdJobId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Empleo eliminado exitosamente');

            // Verificar que el empleo ya no existe
            const verifyResponse = await request(server)
                .get(`/api/jobs/${createdJobId}`)
                .expect(404);

            expect(verifyResponse.body.success).toBe(false);
        });

        it('debería rechazar eliminación sin autenticación', async () => {
            // Crear otro empleo para eliminar
            const createResponse = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testJob,
                    titulo: 'Test Job for Delete Test'
                });

            const jobIdToDelete = createResponse.body.data.id;

            const response = await request(server)
                .delete(`/api/jobs/${jobIdToDelete}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/jobs/:id/apply', () => {
        let createdJobId;
        let applicantToken;
        let applicantUser = {
            username: 'applicant',
            email: 'applicant@example.com',
            password: 'Test123!@#'
        };

        beforeAll(async () => {
            // Crear empleo de prueba
            const createResponse = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testJob);
            
            createdJobId = createResponse.body.data.id;

            // Crear usuario postulante
            await request(server)
                .post('/api/auth/register/usuario')
                .send(applicantUser);

            const loginResponse = await request(server)
                .post('/api/auth/login/usuario')
                .send({
                    email: applicantUser.email,
                    password: applicantUser.password
                });

            applicantToken = loginResponse.body.data.token;
        });

        it('debería postularse a empleo exitosamente', async () => {
            const applicationData = {
                mensaje: 'Estoy muy interesado en esta posición',
                cv_url: 'https://example.com/cv.pdf',
                portafolio_url: 'https://example.com/portfolio'
            };

            const response = await request(server)
                .post(`/api/jobs/${createdJobId}/apply`)
                .set('Authorization', `Bearer ${applicantToken}`)
                .send(applicationData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Postulación realizada exitosamente');
            expect(response.body.data.postulacion_id).toBeDefined();
        });

        it('debería rechazar postulación duplicada', async () => {
            const response = await request(server)
                .post(`/api/jobs/${createdJobId}/apply`)
                .set('Authorization', `Bearer ${applicantToken}`)
                .send({ mensaje: 'Segunda postulación' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Ya has postulado');
        });

        it('debería rechazar postulación sin autenticación', async () => {
            const response = await request(server)
                .post(`/api/jobs/${createdJobId}/apply`)
                .send({ mensaje: 'Postulación sin auth' })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('debería rechazar postulación a empleo inexistente', async () => {
            const response = await request(server)
                .post('/api/jobs/99999/apply')
                .set('Authorization', `Bearer ${applicantToken}`)
                .send({ mensaje: 'Postulación a empleo inexistente' })
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/jobs/my/published', () => {
        let createdJobId;

        beforeAll(async () => {
            // Crear empleo de prueba
            const createResponse = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testJob,
                    titulo: 'My Published Test Job'
                });
            
            createdJobId = createResponse.body.data.id;
        });

        it('debería obtener empleos publicados por el usuario', async () => {
            const response = await request(server)
                .get('/api/jobs/my/published')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.jobs).toBeInstanceOf(Array);
            expect(response.body.data.jobs.some(job => job.id === createdJobId)).toBe(true);
        });

        it('debería rechazar acceso sin autenticación', async () => {
            const response = await request(server)
                .get('/api/jobs/my/published')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/jobs/my/applications', () => {
        let createdJobId;

        beforeAll(async () => {
            // Crear empleo de prueba
            const createResponse = await request(server)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testJob);
            
            createdJobId = createResponse.body.data.id;

            // Postularse al empleo
            await request(server)
                .post(`/api/jobs/${createdJobId}/apply`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ mensaje: 'Mi postulación' });
        });

        it('debería obtener postulaciones del usuario', async () => {
            const response = await request(server)
                .get('/api/jobs/my/applications')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.postulaciones).toBeInstanceOf(Array);
            expect(response.body.data.postulaciones.some(app => app.empleo_id === createdJobId)).toBe(true);
        });

        it('debería rechazar acceso sin autenticación', async () => {
            const response = await request(server)
                .get('/api/jobs/my/applications')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
