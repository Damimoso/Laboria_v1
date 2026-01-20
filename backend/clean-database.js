// =============================================
// LIMPIEZA COMPLETA DE BASE DE DATOS - LABORIA
// =============================================

const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function cleanDatabase() {
    try {
        console.log('🧹 Limpiando base de datos...');
        
        // Eliminar todos los datos en orden correcto (por dependencias)
        const tables = [
            'notificaciones',
            'inscripciones', 
            'postulaciones',
            'empleos',
            'cursos',
            'perfiles',
            'usuarios'
        ];
        
        for (const table of tables) {
            await pool.execute(`DELETE FROM ${table}`);
            console.log(`✅ Tabla ${table} limpiada`);
        }
        
        // Resetear auto-increment
        await pool.execute('ALTER TABLE usuarios AUTO_INCREMENT = 1');
        console.log('✅ Auto-increment reseteado');
        
        console.log('🎉 Base de datos limpiada completamente');
        
    } catch (error) {
        console.error('❌ Error limpiando base de datos:', error);
        throw error;
    }
}

async function createAdminMaster() {
    try {
        console.log('👨‍💼 Creando administrador master...');
        
        const email = 'CurranteDigital@gmail.com';
        const password = 'A.123456-a';
        const username = 'AdminMaster';
        
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Insertar administrador master
        const [result] = await pool.execute(
            `INSERT INTO usuarios (
                username, email, password, role, status, created_at
            ) VALUES (?, ?, ?, 'admin', 'active', NOW())`,
            [username, email, hashedPassword]
        );
        
        const adminId = result.insertId;
        
        // Crear perfil del administrador
        await pool.execute(
            `INSERT INTO perfiles (
                usuario_id, nombre, apellido, bio, created_at
            ) VALUES (?, 'Administrador', 'Master', 'Administrador principal del sistema', NOW())`,
            [adminId]
        );
        
        console.log('✅ Administrador master creado exitosamente');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`🆔 ID: ${adminId}`);
        
    } catch (error) {
        console.error('❌ Error creando administrador master:', error);
        throw error;
    }
}

async function main() {
    try {
        // Limpiar base de datos
        await cleanDatabase();
        
        // Crear administrador master
        await createAdminMaster();
        
        console.log('\n🎉 Proceso completado exitosamente');
        console.log('📋 Resumen:');
        console.log('   ✅ Base de datos limpiada');
        console.log('   ✅ Administrador master creado');
        console.log('   ✅ Sistema listo para uso');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error en el proceso:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main();
}

module.exports = { cleanDatabase, createAdminMaster };
