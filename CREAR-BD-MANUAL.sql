-- =============================================
-- CREAR BASE DE DATOS LABORIA - EJECUTAR MANUALMENTE
-- =============================================

-- 1. Crear base de datos
CREATE DATABASE IF NOT EXISTS laboria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Usar la base de datos
USE laboria_db;

-- 3. Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'empresa') DEFAULT 'user',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Crear tabla perfiles
CREATE TABLE IF NOT EXISTS perfiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    genero ENUM('masculino', 'femenino', 'otro', 'prefiero_no_decir'),
    pais VARCHAR(50),
    ciudad VARCHAR(50),
    bio TEXT,
    experiencia TEXT,
    educacion TEXT,
    habilidades TEXT,
    portfolio TEXT,
    linkedin VARCHAR(255),
    github VARCHAR(255),
    website VARCHAR(255),
    foto_perfil VARCHAR(255),
    disponibilidad ENUM('inmediata', '2_semanas', '1_mes', '3_meses', 'no_disponible'),
    salario_minimo DECIMAL(10,2),
    salario_maximo DECIMAL(10,2),
    modalidad_trabajo ENUM('presencial', 'remoto', 'hibrido'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Crear tabla empleos
CREATE TABLE IF NOT EXISTS empleos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    empresa VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(100),
    salario_minimo DECIMAL(10,2),
    salario_maximo DECIMAL(10,2),
    tipo_contrato ENUM('tiempo_completo', 'medio_tiempo', 'freelance', 'practicas', 'temporal'),
    modalidad ENUM('presencial', 'remoto', 'hibrido'),
    categoria VARCHAR(50),
    requisitos TEXT,
    beneficios TEXT,
    habilidades_requeridas TEXT,
    experiencia_requerida ENUM('sin_experiencia', '1_anio', '2_anios', '3_anios', '5_anios', 'mas_5_anios'),
    nivel_educativo ENUM('secundaria', 'bachiller', 'tecnico', 'universitario', 'posgrado'),
    publicado_por INT REFERENCES usuarios(id),
    estado ENUM('activo', 'inactivo', 'cerrado', 'pausado') DEFAULT 'activo',
    fecha_limite DATE,
    vistas INT DEFAULT 0,
    postulaciones INT DEFAULT 0,
    destacado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Crear tabla postulaciones
CREATE TABLE IF NOT EXISTS postulaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empleo_id INT REFERENCES empleos(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    estado ENUM('pendiente', 'revisando', 'aceptada', 'rechazada') DEFAULT 'pendiente',
    mensaje TEXT,
    cv_path VARCHAR(255),
    fecha_postulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(empleo_id, usuario_id)
);

-- 7. Crear tabla cursos
CREATE TABLE IF NOT EXISTS cursos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    instructor VARCHAR(100),
    duracion VARCHAR(50),
    nivel ENUM('principiante', 'intermedio', 'avanzado'),
    categoria VARCHAR(50),
    precio DECIMAL(10,2),
    precio_original DECIMAL(10,2),
    imagen VARCHAR(255),
    video_preview VARCHAR(255),
    contenido TEXT,
    objetivos TEXT,
    requisitos_curso TEXT,
    certificado BOOLEAN DEFAULT TRUE,
    valoracion DECIMAL(3,2) DEFAULT 0.00,
    num_valoraciones INT DEFAULT 0,
    estado ENUM('activo', 'inactivo', 'borrador') DEFAULT 'activo',
    creado_por INT REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Crear tabla inscripciones
CREATE TABLE IF NOT EXISTS inscripciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    curso_id INT REFERENCES cursos(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    estado ENUM('activa', 'completada', 'abandonada') DEFAULT 'activa',
    progreso DECIMAL(5,2) DEFAULT 0.00,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completacion TIMESTAMP NULL,
    certificado_generado BOOLEAN DEFAULT FALSE,
    UNIQUE(curso_id, usuario_id)
);

-- 9. Crear tabla notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    leida BOOLEAN DEFAULT FALSE,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Crear tabla mensajes
CREATE TABLE IF NOT EXISTS mensajes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    remitente_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    destinatario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    empleo_id INT REFERENCES empleos(id) ON DELETE SET NULL,
    asunto VARCHAR(200),
    contenido TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 11. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_perfiles_usuario_id ON perfiles(usuario_id);
CREATE INDEX IF NOT EXISTS idx_empleos_estado ON empleos(estado);
CREATE INDEX IF NOT EXISTS idx_empleos_categoria ON empleos(categoria);
CREATE INDEX IF NOT EXISTS idx_empleos_publicado_por ON empleos(publicado_por);
CREATE INDEX IF NOT EXISTS idx_postulaciones_empleo ON postulaciones(empleo_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_usuario ON postulaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cursos_estado ON cursos(estado);
CREATE INDEX IF NOT EXISTS idx_cursos_categoria ON cursos(categoria);
CREATE INDEX IF NOT EXISTS idx_inscripciones_curso ON inscripciones(curso_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_usuario ON inscripciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_remitente ON mensajes(remitente_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_destinatario ON mensajes(destinatario_id);

-- 12. Insertar usuario administrador por defecto
INSERT INTO usuarios (username, email, password, role, status) VALUES 
('admin', 'admin@laboria.com', '$2b$12$LQv3c1yqBWVHxkd0L9vOY.K6FzH8Z5Q5Q5Q5Q5Q5Q5Q5Q5Q', 'admin', 'active')
ON DUPLICATE KEY UPDATE username = username;

-- 13. Insertar usuario de prueba
INSERT INTO usuarios (username, email, password, role, status) VALUES 
('testuser', 'test@laboria.com', '$2b$12$LQv3c1yqBWVHxkd0L9vOY.K6FzH8Z5Q5Q5Q5Q5Q5Q5Q5Q5Q', 'user', 'active')
ON DUPLICATE KEY UPDATE username = username;

-- 14. Mostrar resultado
SELECT 'Base de datos Laboria creada exitosamente' AS mensaje;
SHOW TABLES;
