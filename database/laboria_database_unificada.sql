-- =============================================
-- BASE DE DATOS LABORIA - UNIFICADA COMPLETA
-- =============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS laboria_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE laboria_db;

-- =============================================
-- SISTEMA DE USUARIOS
-- =============================================

-- Tabla principal de USUARIOS
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_username (username)
);

-- Tabla de perfil de USUARIO
CREATE TABLE perfiles_usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL UNIQUE,
    foto_perfil VARCHAR(255) NULL,
    bio TEXT NULL,
    telefono VARCHAR(20) NULL,
    ubicacion VARCHAR(100) NULL,
    sitio_web VARCHAR(255) NULL,
    linkedin_url VARCHAR(255) NULL,
    github_url VARCHAR(255) NULL,
    disponibilidad ENUM('disponible', 'ocupado', 'buscando') DEFAULT 'disponible',
    preferencia_trabajo ENUM('remoto', 'presencial', 'hibrido') NULL,
    salario_minimo DECIMAL(10,2) NULL,
    salario_maximo DECIMAL(10,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_disponibilidad (disponibilidad)
);

-- Tabla de curriculum de USUARIO
CREATE TABLE curriculums (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL UNIQUE,
    titulo_profesional VARCHAR(100) NULL,
    experiencia_total_anios DECIMAL(3,1) DEFAULT 0,
    nivel_educativo ENUM('sin_estudios', 'primaria', 'secundaria', 'bachiller', 'grado', 'master', 'doctorado') NULL,
    campo_estudio VARCHAR(100) NULL,
    idiomas JSON NULL,
    habilidades_tecnicas JSON NULL,
    habilidades_blandas JSON NULL,
    certificaciones JSON NULL,
    proyectos_destacados JSON NULL,
    archivo_cv_url VARCHAR(255) NULL,
    cv_publico BOOLEAN DEFAULT TRUE,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_nivel_educativo (nivel_educativo)
);

-- Tabla de experiencia laboral de USUARIO
CREATE TABLE experiencia_laboral (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    empresa VARCHAR(100) NOT NULL,
    puesto VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    tipo_empleo ENUM('tiempo_completo', 'tiempo_parcial', 'freelance', 'practicas', 'temporal') NOT NULL,
    modalidad ENUM('remoto', 'presencial', 'hibrido') DEFAULT 'presencial',
    sector_industria VARCHAR(50) NULL,
    logotipo_empresa VARCHAR(255) NULL,
    actual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_empresa (empresa),
    INDEX idx_actual (actual)
);

-- Tabla de educación de USUARIO
CREATE TABLE educacion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    institucion VARCHAR(100) NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    nivel ENUM('secundaria', 'bachiller', 'grado', 'master', 'doctorado', 'certificacion', 'otro') NOT NULL,
    campo_estudio VARCHAR(100) NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    descripcion TEXT NULL,
    actual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_institucion (institucion),
    INDEX idx_actual (actual)
);

-- =============================================
-- SISTEMA DE ADMINISTRADORES
-- =============================================

-- Tabla de ADMINISTRADORES
CREATE TABLE administradores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    tipo_admin ENUM('master', 'invitado') NOT NULL,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_tipo_admin (tipo_admin),
    INDEX idx_status (status),
    INDEX idx_username (username)
);

-- Tabla de perfil de ADMINISTRADOR
CREATE TABLE perfiles_administrador (
    id INT PRIMARY KEY AUTO_INCREMENT,
    administrador_id INT NOT NULL UNIQUE,
    foto_perfil VARCHAR(255) NULL,
    bio TEXT NULL,
    telefono VARCHAR(20) NULL,
    ubicacion VARCHAR(100) NULL,
    departamento VARCHAR(100) NULL,
    cargo VARCHAR(100) NULL,
    empresa VARCHAR(100) NULL,
    linkedin_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (administrador_id) REFERENCES administradores(id) ON DELETE CASCADE,
    INDEX idx_administrador_id (administrador_id)
);

-- Tabla de solicitudes de administrador invitado
CREATE TABLE solicitudes_admin_invitado (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NULL,
    empresa VARCHAR(100) NULL,
    cargo VARCHAR(100) NULL,
    motivo_solicitud TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    aprobado_por INT NULL,
    fecha_aprobacion TIMESTAMP NULL,
    motivo_rechazo TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (aprobado_por) REFERENCES administradores(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_fecha_aprobacion (fecha_aprobacion)
);

-- =============================================
-- SISTEMA DE PERMISOS
-- =============================================

-- Tabla de configuración de permisos por tipo de administrador
CREATE TABLE configuracion_permisos_admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_admin ENUM('master', 'invitado') NOT NULL,
    permiso VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    nivel_acceso ENUM('bajo', 'medio', 'alto', 'total') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_tipo_permiso (tipo_admin, permiso),
    INDEX idx_tipo_admin (tipo_admin),
    INDEX idx_permiso (permiso),
    INDEX idx_activo (activo)
);

-- =============================================
-- SISTEMA DE IMÁGENES Y ARCHIVOS
-- =============================================

-- Tabla de imágenes de usuarios
CREATE TABLE imagenes_usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo_imagen ENUM('perfil', 'cv_documento', 'portada', 'certificado', 'portfolio') NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    url_archivo VARCHAR(500) NOT NULL,
    tamano_bytes INT NULL,
    formato VARCHAR(10) NULL,
    descripcion TEXT NULL,
    es_principal BOOLEAN DEFAULT FALSE,
    orden_visualizacion INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_tipo_imagen (tipo_imagen),
    INDEX idx_es_principal (es_principal)
);

-- Tabla de imágenes de administradores
CREATE TABLE imagenes_administrador (
    id INT PRIMARY KEY AUTO_INCREMENT,
    administrador_id INT NOT NULL,
    tipo_imagen ENUM('perfil', 'firma', 'documento_identidad', 'empresa_logo') NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    url_archivo VARCHAR(500) NOT NULL,
    tamano_bytes INT NULL,
    formato VARCHAR(10) NULL,
    descripcion TEXT NULL,
    es_principal BOOLEAN DEFAULT FALSE,
    orden_visualizacion INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (administrador_id) REFERENCES administradores(id) ON DELETE CASCADE,
    INDEX idx_administrador_id (administrador_id),
    INDEX idx_tipo_imagen (tipo_imagen),
    INDEX idx_es_principal (es_principal)
);

-- =============================================
-- SISTEMA DE NOTIFICACIONES
-- =============================================

-- Tabla de notificaciones de usuarios
CREATE TABLE notificaciones_usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo_notificacion ENUM('info', 'success', 'warning', 'error', 'system') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    url_accion VARCHAR(500) NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_tipo_notificacion (tipo_notificacion),
    INDEX idx_leida (leida),
    INDEX idx_fecha_creacion (fecha_creacion)
);

-- Tabla de notificaciones de administradores
CREATE TABLE notificaciones_administrador (
    id INT PRIMARY KEY AUTO_INCREMENT,
    administrador_id INT NOT NULL,
    tipo_notificacion ENUM('info', 'success', 'warning', 'error', 'system', 'user_request', 'security') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    url_accion VARCHAR(500) NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (administrador_id) REFERENCES administradores(id) ON DELETE CASCADE,
    INDEX idx_administrador_id (administrador_id),
    INDEX idx_tipo_notificacion (tipo_notificacion),
    INDEX idx_leida (leida),
    INDEX idx_fecha_creacion (fecha_creacion)
);

-- =============================================
-- SISTEMA DE SESIONES
-- =============================================

-- Tabla de sesiones de usuarios
CREATE TABLE sesiones_usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token_sesion VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP NULL,
    activa BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_token_sesion (token_sesion),
    INDEX idx_activa (activa),
    INDEX idx_fecha_ultima_actividad (fecha_ultima_actividad)
);

-- Tabla de sesiones de administradores
CREATE TABLE sesiones_administrador (
    id INT PRIMARY KEY AUTO_INCREMENT,
    administrador_id INT NOT NULL,
    token_sesion VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP NULL,
    activa BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (administrador_id) REFERENCES administradores(id) ON DELETE CASCADE,
    INDEX idx_administrador_id (administrador_id),
    INDEX idx_token_sesion (token_sesion),
    INDEX idx_activa (activa),
    INDEX idx_fecha_ultima_actividad (fecha_ultima_actividad)
);

-- =============================================
-- SISTEMA DE ESTADÍSTICAS Y ACTIVIDAD
-- =============================================

-- Tabla de estadísticas de usuarios (para admin invitado)
CREATE TABLE estadisticas_usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha_registro DATE NOT NULL,
    total_usuarios_activos INT DEFAULT 0,
    total_usuarios_nuevos INT DEFAULT 0,
    promedio_conexion_minutos DECIMAL(8,2) DEFAULT 0,
    total_conexiones_dia INT DEFAULT 0,
    plataforma_mas_accedida VARCHAR(50) NULL,
    tipo_email_mas_comun VARCHAR(100) NULL,
    palabra_busqueda_mas_usada VARCHAR(200) NULL,
    tipo_busqueda_mas_comun ENUM('empleo', 'curso', 'ambos') NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_fecha_registro (fecha_registro),
    INDEX idx_tipo_busqueda (tipo_busqueda_mas_comun)
);

-- Tabla de acceso a plataformas (para estadísticas)
CREATE TABLE acceso_plataformas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    plataforma VARCHAR(50) NOT NULL, -- 'empleos', 'cursos', 'perfil', 'mi_cv'
    fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tiempo_conexion_minutos INT DEFAULT 0,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_plataforma (plataforma),
    INDEX idx_fecha_acceso (fecha_acceso),
    INDEX idx_fecha_plataforma (DATE(fecha_acceso), plataforma)
);

-- Tabla de búsquedas de usuarios
CREATE TABLE busquedas_usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo_busqueda ENUM('empleo', 'curso') NOT NULL,
    termino_busqueda VARCHAR(200) NOT NULL,
    plataforma VARCHAR(50) NOT NULL, -- 'linkedin', 'indeed', 'glassdoor', etc.
    fecha_busqueda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultados_obtenidos INT DEFAULT 0,
    ip_address VARCHAR(45) NULL,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_tipo_busqueda (tipo_busqueda),
    INDEX idx_termino_busqueda (termino_busqueda),
    INDEX idx_fecha_busqueda (fecha_busqueda),
    INDEX idx_plataforma (plataforma)
);

-- Tabla de historial de actividad de usuarios
CREATE TABLE actividad_usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo_actividad ENUM('login', 'logout', 'perfil_update', 'cv_update', 'busqueda', 'aplicacion', 'registro') NOT NULL,
    descripcion TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    fecha_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_tipo_actividad (tipo_actividad),
    INDEX idx_fecha_actividad (fecha_actividad)
);

-- Tabla de historial de actividad de administradores
CREATE TABLE actividad_administrador (
    id INT PRIMARY KEY AUTO_INCREMENT,
    administrador_id INT NOT NULL,
    tipo_actividad ENUM('login', 'logout', 'usuario_view', 'usuario_edit', 'usuario_delete', 'config_change', 'report_generate') NOT NULL,
    descripcion TEXT NULL,
    objeto_afectado VARCHAR(100) NULL, -- ID del usuario afectado, etc.
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    fecha_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (administrador_id) REFERENCES administradores(id) ON DELETE CASCADE,
    INDEX idx_administrador_id (administrador_id),
    INDEX idx_tipo_actividad (tipo_actividad),
    INDEX idx_fecha_actividad (fecha_actividad)
);

-- =============================================
-- CONFIGURACIÓN INICIAL DE PERMISOS
-- =============================================

-- Permisos para ADMIN MASTER
INSERT INTO configuracion_permisos_admin (tipo_admin, permiso, descripcion, nivel_acceso) VALUES
('master', 'ver_usuarios_lista', 'Ver lista completa de usuarios con datos básicos', 'total'),
('master', 'ver_usuario_detalle', 'Ver detalles completos de un usuario específico', 'total'),
('master', 'ver_usuario_conexiones', 'Ver historial de conexiones y tiempo activo', 'total'),
('master', 'ver_usuario_perfil', 'Ver perfil completo de usuarios', 'total'),
('master', 'ver_usuario_curriculum', 'Ver curriculum y experiencia de usuarios', 'total'),
('master', 'editar_usuario_datos', 'Editar datos básicos de usuarios', 'alto'),
('master', 'editar_usuario_estado', 'Activar/desactivar usuarios', 'alto'),
('master', 'eliminar_usuario', 'Eliminar usuarios permanentemente', 'total'),
('master', 'ver_estadisticas_detalladas', 'Ver todas las estadísticas detalladas', 'total'),
('master', 'ver_estadisticas_basicas', 'Ver estadísticas básicas y resúmenes', 'medio'),
('master', 'exportar_datos_usuarios', 'Exportar datos de usuarios', 'alto'),
('master', 'ver_logs_sistema', 'Ver logs completos del sistema', 'total'),
('master', 'configurar_sistema', 'Configurar parámetros del sistema', 'total'),
('master', 'aprobar_admin_invitado', 'Aprobar solicitudes de admin invitado', 'total'),
('master', 'rechazar_admin_invitado', 'Rechazar solicitudes de admin invitado', 'total'),
('master', 'ver_solicitudes_admin', 'Ver todas las solicitudes de admin', 'total');

-- Permisos para ADMIN INVITADO
INSERT INTO configuracion_permisos_admin (tipo_admin, permiso, descripcion, nivel_acceso) VALUES
('invitado', 'ver_estadisticas_basicas', 'Ver estadísticas básicas y resúmenes', 'medio'),
('invitado', 'ver_usuarios_lista', 'Ver lista básica de usuarios (solo nombres y emails)', 'bajo'),
('invitado', 'ver_reportes_generales', 'Ver reportes generales sin datos personales', 'medio'),
('invitado', 'exportar_reportes_basicos', 'Exportar reportes básicos anonimizados', 'bajo'),
('invitado', 'ver_logs_basicos', 'Ver logs básicos del sistema', 'bajo');

-- =============================================
-- VIEWS PARA FACILITAR CONSULTAS
-- =============================================

-- Vista de usuarios con perfil completo
CREATE VIEW usuarios_completos AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.status,
    u.last_login,
    u.created_at,
    p.foto_perfil,
    p.bio,
    p.telefono,
    p.ubicacion,
    p.disponibilidad,
    p.preferencia_trabajo,
    c.titulo_profesional,
    c.experiencia_total_anios,
    c.nivel_educativo,
    c.campo_estudio,
    c.cv_publico
FROM usuarios u
LEFT JOIN perfiles_usuario p ON u.id = p.usuario_id
LEFT JOIN curriculums c ON u.id = c.usuario_id;

-- Vista de administradores con perfil completo
CREATE VIEW administradores_completos AS
SELECT 
    a.id,
    a.username,
    a.email,
    a.full_name,
    a.tipo_admin,
    a.status,
    a.last_login,
    a.created_at,
    pa.foto_perfil,
    pa.bio,
    pa.telefono,
    pa.ubicacion,
    pa.departamento,
    pa.cargo,
    pa.empresa
FROM administradores a
LEFT JOIN perfiles_administrador pa ON a.id = pa.administrador_id;

-- Vista de estadísticas diarias
CREATE VIEW estadisticas_diarias AS
SELECT 
    DATE(fecha_acceso) as fecha,
    COUNT(DISTINCT usuario_id) as usuarios_unicos,
    COUNT(*) as total_conexiones,
    AVG(tiempo_conexion_minutos) as promedio_conexion,
    plataforma
FROM acceso_plataformas
GROUP BY DATE(fecha_acceso), plataforma
ORDER BY fecha DESC;

-- =============================================
-- STORED PROCEDURES ÚTILES
-- =============================================

DELIMITER //

-- Procedimiento para registrar actividad de usuario
CREATE PROCEDURE registrar_actividad_usuario(
    IN p_usuario_id INT,
    IN p_tipo_actividad ENUM('login', 'logout', 'perfil_update', 'cv_update', 'busqueda', 'aplicacion', 'registro'),
    IN p_descripcion TEXT,
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    INSERT INTO actividad_usuario (usuario_id, tipo_actividad, descripcion, ip_address, user_agent)
    VALUES (p_usuario_id, p_tipo_actividad, p_descripcion, p_ip_address, p_user_agent);
    
    -- Actualizar última actividad en sesión si es login
    IF p_tipo_actividad = 'login' THEN
        UPDATE sesiones_usuario 
        SET fecha_ultima_actividad = NOW() 
        WHERE usuario_id = p_usuario_id AND activa = TRUE;
    END IF;
END //

-- Procedimiento para obtener estadísticas de admin invitado
CREATE PROCEDURE obtener_estadisticas_admin_invitado()
BEGIN
    SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as usuarios_activos,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as usuarios_hoy,
        AVG(CASE WHEN last_login IS NOT NULL THEN 
            TIMESTAMPDIFF(DAY, last_login, NOW()) 
        END) as dias_sin_login_promedio
    FROM usuarios;
    
    SELECT 
        plataforma,
        COUNT(*) as accesos_totales,
        COUNT(DISTINCT usuario_id) as usuarios_unicos,
        AVG(tiempo_conexion_minutos) as tiempo_promedio
    FROM acceso_plataformas 
    WHERE fecha_acceso >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY plataforma
    ORDER BY accesos_totales DESC;
    
    SELECT 
        termino_busqueda,
        COUNT(*) as busquedas_totales,
        COUNT(DISTINCT usuario_id) as usuarios_unicos
    FROM busquedas_usuarios 
    WHERE fecha_busqueda >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY termino_busqueda
    ORDER BY busquedas_totales DESC
    LIMIT 10;
END //

-- Procedimiento para aprobar solicitud de admin invitado
CREATE PROCEDURE aprobar_solicitud_admin_invitado(
    IN p_solicitud_id INT,
    IN p_admin_master_id INT
)
BEGIN
    DECLARE v_username VARCHAR(50);
    DECLARE v_email VARCHAR(100);
    DECLARE v_password VARCHAR(255);
    DECLARE v_full_name VARCHAR(100);
    
    -- Obtener datos de la solicitud
    SELECT username, email, password, full_name 
    INTO v_username, v_email, v_password, v_full_name
    FROM solicitudes_admin_invitado 
    WHERE id = p_solicitud_id AND status = 'pending';
    
    -- Crear administrador invitado
    INSERT INTO administradores (username, email, password, full_name, tipo_admin, status)
    VALUES (v_username, v_email, v_password, v_full_name, 'invitado', 'active');
    
    -- Actualizar estado de la solicitud
    UPDATE solicitudes_admin_invitado 
    SET status = 'approved', 
        aprobado_por = p_admin_master_id, 
        fecha_aprobacion = NOW()
    WHERE id = p_solicitud_id;
    
    -- Crear notificación para el nuevo admin
    INSERT INTO notificaciones_administrador (administrador_id, tipo_notificacion, titulo, mensaje)
    VALUES (
        LAST_INSERT_ID(), 
        'success', 
        'Solicitud Aprobada', 
        'Tu solicitud de acceso como administrador invitado ha sido aprobada. Ya puedes acceder al sistema.'
    );
END //

DELIMITER ;

-- =============================================
-- TRIGGERS PARA MANTENER CONSISTENCIA
-- =============================================

DELIMITER //

-- Trigger para registrar acceso a plataforma
CREATE TRIGGER after_acceso_plataforma_insert
AFTER INSERT ON acceso_plataformas
FOR EACH ROW
BEGIN
    -- Actualizar estadísticas del día
    INSERT INTO estadisticas_usuarios (
        fecha_registro, 
        total_usuarios_activos, 
        total_usuarios_nuevos, 
        total_conexiones_dia,
        plataforma_mas_accedida
    )
    VALUES (
        DATE(NEW.fecha_acceso),
        (SELECT COUNT(*) FROM usuarios WHERE status = 'active'),
        (SELECT COUNT(*) FROM usuarios WHERE DATE(created_at) = DATE(NEW.fecha_acceso)),
        1,
        NEW.plataforma
    )
    ON DUPLICATE KEY UPDATE
        total_conexiones_dia = total_conexiones_dia + 1,
        plataforma_mas_accedida = NEW.plataforma;
END //

-- Trigger para registrar actividad de usuario
CREATE TRIGGER after_usuario_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    IF OLD.full_name != NEW.full_name OR OLD.email != NEW.email OR OLD.status != NEW.status THEN
        INSERT INTO actividad_usuario (usuario_id, tipo_actividad, descripcion)
        VALUES (NEW.id, 'perfil_update', 
            CONCAT('Perfil actualizado: ', 
                   CASE WHEN OLD.full_name != NEW.full_name THEN 'nombre' END,
                   CASE WHEN OLD.email != NEW.email THEN ', email' END,
                   CASE WHEN OLD.status != NEW.status THEN ', estado' END
            )
        );
    END IF;
END //

DELIMITER ;

-- =============================================
-- DATOS INICIALES (PARA DESARROLLO)
-- =============================================

-- Insertar administrador master por defecto
INSERT INTO administradores (username, email, password, full_name, tipo_admin, status) 
VALUES ('admin_master', 'admin@laboria.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Administrador Master', 'master', 'active');

-- Insertar usuario demo
INSERT INTO usuarios (username, email, password, full_name, status) 
VALUES ('usuario_demo', 'usuario@laboria.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Usuario Demo', 'active');

-- =============================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =============================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_usuarios_status_created ON usuarios(status, created_at);
CREATE INDEX idx_admin_tipo_status ON administradores(tipo_admin, status);
CREATE INDEX idx_sesiones_usuario_activa ON sesiones_usuario(usuario_id, activa);
CREATE INDEX idx_sesiones_admin_activa ON sesiones_administrador(administrador_id, activa);
CREATE INDEX idx_notificaciones_usuario_no_leidas ON notificaciones_usuario(usuario_id, leida);
CREATE INDEX idx_notificaciones_admin_no_leidas ON notificaciones_administrador(administrador_id, leida);
CREATE INDEX idx_acceso_fecha_plataforma ON acceso_plataformas(DATE(fecha_acceso), plataforma);
CREATE INDEX idx_busqueda_fecha_tipo ON busquedas_usuarios(DATE(fecha_busqueda), tipo_busqueda);

-- =============================================
-- COMENTARIOS FINALES
-- =============================================

/*
Base de datos Laboria - Estructura unificada y optimizada

CARACTERÍSTICAS PRINCIPALES:
- Separación clara entre usuarios y administradores
- Sistema de permisos granular por tipo de administrador
- Gestión completa de imágenes y archivos
- Sistema de notificaciones dual (usuarios/admins)
- Seguimiento de sesiones y actividad
- Estadísticas detalladas para análisis
- Vistas optimizadas para consultas frecuentes
- Stored procedures para operaciones complejas
- Triggers para mantener consistencia automática
- Índices optimizados para rendimiento

ROLES Y PERMISOS:
- Usuarios: Acceso a perfil, CV, búsqueda de empleos/cursos
- Admin Master: Acceso total al sistema y usuarios
- Admin Invitado: Acceso limitado a estadísticas y reportes

INTEGRACIÓN CON FRONTEND:
- API endpoints para cada tabla principal
- Autenticación por token con sesiones
- Sistema de notificaciones en tiempo real
- Gestión de imágenes con URLs optimizadas
- Estadísticas actualizadas automáticamente

PARA PRODUCCIÓN:
- Configurar passwords con hash real (bcrypt)
- Ajustar límites de conexión y timeouts
- Configurar backup automático
- Monitorizar rendimiento de índices
- Revisar y ajustar permisos según necesidades
*/
