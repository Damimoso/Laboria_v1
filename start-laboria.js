// =============================================
// INICIO RÁPIDO LABORIA - SISTEMA COMPLETO
// =============================================

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class LaboriaStarter {
    constructor() {
        this.backendProcess = null;
        this.frontendProcess = null;
        this.isShuttingDown = false;
    }

    // Mostrar banner
    showBanner() {
        console.log('');
        console.log('🚀 ===============================================');
        console.log('🚀     LABORIA - SISTEMA DE EMPLEO Y CURSOS');
        console.log('🚀 ===============================================');
        console.log('');
        console.log('📋 ADMINISTRADOR MASTER CONFIGURADO:');
        console.log('📧 Email: CurranteDigital@gmail.com');
        console.log('🔑 Password: A.123456-a');
        console.log('👤 Username: AdminMaster');
        console.log('🎯 Rol: Administrador Master');
        console.log('');
        console.log('🌐 URLs DE ACCESO:');
        console.log('🏠 Frontend: http://localhost:5500/pages/index.html');
        console.log('📊 Dashboard: http://localhost:5500/pages/dashboard.html');
        console.log('🔌 Backend: http://localhost:3000/api');
        console.log('💚 Health: http://localhost:3000/api/health');
        console.log('📚 Docs: http://localhost:3000/api-docs');
        console.log('');
        console.log('🔧 CARACTERÍSTICAS:');
        console.log('• 👤 Gestión completa de usuarios');
        console.log('• 💼 Sistema de empleos con postulaciones');
        console.log('• 🎓 Plataforma de cursos con inscripciones');
        console.log('• 🔔 Notificaciones en tiempo real');
        console.log('• 📊 Dashboard con estadísticas');
        console.log('• 🔐 Seguridad avanzada con JWT');
        console.log('• 📱 Interfaz responsive y moderna');
        console.log('');
    }

    // Verificar prerequisitos
    async checkPrerequisites() {
        console.log('🔍 Verificando prerequisitos...');
        
        // Verificar Node.js
        try {
            const nodeVersion = spawn('node', ['--version'], { stdio: 'pipe' });
            await new Promise((resolve, reject) => {
                nodeVersion.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error('Node.js no está instalado'));
                });
            });
            console.log('✅ Node.js disponible');
        } catch (error) {
            console.error('❌ Node.js no está instalado');
            process.exit(1);
        }

        // Verificar archivos necesarios
        const requiredFiles = [
            'backend/package.json',
            'backend/server.js',
            'frontend/pages/index.html',
            'frontend/js/api-client.js'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                console.error(`❌ Archivo requerido no encontrado: ${file}`);
                process.exit(1);
            }
        }
        
        console.log('✅ Archivos necesarios encontrados');
    }

    // Iniciar backend
    async startBackend() {
        console.log('🔧 Iniciando backend...');
        
        return new Promise((resolve, reject) => {
            this.backendProcess = spawn('node', ['server.js'], {
                cwd: path.join(__dirname, 'backend'),
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let started = false;

            this.backendProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('🔧 Backend:', output.trim());
                
                if (output.includes('Servidor Laboria iniciado correctamente') && !started) {
                    started = true;
                    resolve();
                }
            });

            this.backendProcess.stderr.on('data', (data) => {
                const output = data.toString();
                console.error('🔧 Backend Error:', output.trim());
            });

            this.backendProcess.on('close', (code) => {
                if (code !== 0 && !this.isShuttingDown) {
                    console.error(`❌ Backend process exited with code ${code}`);
                    reject(new Error('Backend failed to start'));
                }
            });

            this.backendProcess.on('error', (error) => {
                console.error('❌ Backend error:', error.message);
                reject(error);
            });

            // Timeout por si el backend no inicia
            setTimeout(() => {
                if (!started) {
                    console.log('⚠️ Backend timeout, pero continuando...');
                    resolve();
                }
            }, 10000);
        });
    }

    // Iniciar frontend (Live Server)
    async startFrontend() {
        console.log('🌐 Iniciando frontend...');
        
        return new Promise((resolve, reject) => {
            // Usar VS Code Live Server si está disponible
            const liveServerPath = path.join(
                process.env.LOCALAPPDATA || process.env.HOME,
                'Program Files/Microsoft VS Code/bin/code.cmd'
            );

            if (fs.existsSync(liveServerPath)) {
                console.log('🌐 Usando VS Code Live Server...');
                console.log('📂 Abre el proyecto en VS Code y usa Live Server');
                console.log('🌐 O visita: http://localhost:5500/pages/index.html');
                resolve();
                return;
            }

            // Alternativa: servidor simple con Node.js
            const http = require('http');
            const url = require('url');
            const fs = require('fs');
            const path = require('path');

            const server = http.createServer((req, res) => {
                const parsedUrl = url.parse(req.url, true);
                let filePath = path.join(__dirname, 'frontend', parsedUrl.pathname);

                // Servir index.html por defecto
                if (filePath.endsWith('/')) {
                    filePath = path.join(filePath, 'index.html');
                }

                // Manejar archivos estáticos
                const extname = path.extname(filePath);
                let contentType = 'text/html';

                switch (extname) {
                    case '.js':
                        contentType = 'text/javascript';
                        break;
                    case '.css':
                        contentType = 'text/css';
                        break;
                    case '.json':
                        contentType = 'application/json';
                        break;
                    case '.png':
                        contentType = 'image/png';
                        break;
                    case '.jpg':
                        contentType = 'image/jpg';
                        break;
                    case '.ico':
                        contentType = 'image/x-icon';
                        break;
                }

                fs.readFile(filePath, (error, content) => {
                    if (error) {
                        if (error.code === 'ENOENT') {
                            // 404 - servir index.html para SPA
                            fs.readFile(path.join(__dirname, 'frontend/pages/index.html'), (err, content) => {
                                if (err) {
                                    res.writeHead(500);
                                    res.end('Server Error');
                                    return;
                                }
                                res.writeHead(200, { 'Content-Type': 'text/html' });
                                res.end(content, 'utf-8');
                            });
                        } else {
                            res.writeHead(500);
                            res.end('Server Error');
                        }
                    } else {
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(content, 'utf-8');
                    }
                });
            });

            server.listen(5500, () => {
                console.log('✅ Frontend server iniciado en http://localhost:5500');
                resolve();
            });

            server.on('error', (error) => {
                console.error('❌ Frontend server error:', error);
                reject(error);
            });

            this.frontendProcess = server;
        });
    }

    // Verificar que todo esté funcionando
    async verifySystem() {
        console.log('🔍 Verificando sistema...');
        
        // Esperar un momento a que todo inicie
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verificar health check
        try {
            const http = require('http');
            
            const checkHealth = () => {
                return new Promise((resolve) => {
                    const req = http.get('http://localhost:3000/api/health', (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => {
                            try {
                                const response = JSON.parse(data);
                                if (response.success) {
                                    console.log('✅ Backend health check OK');
                                    resolve(true);
                                } else {
                                    console.log('⚠️ Backend health check failed');
                                    resolve(false);
                                }
                            } catch (error) {
                                console.log('⚠️ Backend health check error');
                                resolve(false);
                            }
                        });
                    });
                    
                    req.on('error', () => {
                        console.log('⚠️ Backend no responde');
                        resolve(false);
                    });
                    
                    req.setTimeout(5000, () => {
                        req.destroy();
                        resolve(false);
                    });
                });
            };

            const healthOk = await checkHealth();
            
            if (healthOk) {
                console.log('✅ Sistema verificado y funcionando');
            } else {
                console.log('⚠️ Sistema iniciado pero con advertencias');
            }

        } catch (error) {
            console.log('⚠️ No se pudo verificar el sistema:', error.message);
        }
    }

    // Manejar cierre graceful
    setupGracefulShutdown() {
        const shutdown = (signal) => {
            if (this.isShuttingDown) return;
            this.isShuttingDown = true;
            
            console.log(`\n🛑 Recibida señal ${signal}, cerrando sistema...`);
            
            if (this.backendProcess) {
                this.backendProcess.kill('SIGTERM');
            }
            
            if (this.frontendProcess && this.frontendProcess.close) {
                this.frontendProcess.close();
            }
            
            setTimeout(() => {
                console.log('✅ Sistema cerrado');
                process.exit(0);
            }, 3000);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }

    // Iniciar sistema completo
    async start() {
        try {
            this.showBanner();
            await this.checkPrerequisites();
            await this.startBackend();
            await this.startFrontend();
            await this.verifySystem();
            
            console.log('');
            console.log('🎉 ===============================================');
            console.log('🎉     SISTEMA LABIA INICIADO COMPLETAMENTE');
            console.log('🎉 ===============================================');
            console.log('');
            console.log('🌐 Accede al sistema en:');
            console.log('📱 http://localhost:5500/pages/index.html');
            console.log('');
            console.log('👤 Inicia sesión como administrador:');
            console.log('📧 CurranteDigital@gmail.com');
            console.log('🔑 A.123456-a');
            console.log('');
            console.log('📊 Explora todas las funcionalidades:');
            console.log('• Dashboard con estadísticas');
            console.log('• Gestión de usuarios y perfiles');
            console.log('• Sistema de empleos y postulaciones');
            console.log('• Plataforma de cursos e inscripciones');
            console.log('• Notificaciones en tiempo real');
            console.log('');
            console.log('🔧 Presiona Ctrl+C para detener el sistema');
            console.log('');
            
            this.setupGracefulShutdown();
            
        } catch (error) {
            console.error('❌ Error iniciando sistema:', error.message);
            process.exit(1);
        }
    }
}

// Iniciar si se ejecuta directamente
if (require.main === module) {
    const starter = new LaboriaStarter();
    starter.start();
}

module.exports = LaboriaStarter;
