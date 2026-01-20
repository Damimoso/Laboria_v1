# 🚀 Laboria - Plataforma Integral de Empleo y Cursos

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#descripción-del-proyecto)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Funcionalidades Principales](#funcionalidades-principales)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Configuración del Entorno](#configuración-del-entorno)
- [Instalación y Puesta en Marcha](#instalación-y-puesta-en-marcha)
- [API Endpoints](#api-endpoints)
- [Base de Datos](#base-de-datos)
- [Mejoras Recomendadas](#mejoras-recomendendadas)
- [Troubleshooting](#troubleshooting)
- [Contribución](#contribución)

---

## 📖 Descripción del Proyecto

**Laboria** es una plataforma web integral que conecta profesionales con oportunidades de empleo y ofrece cursos de capacitación. El sistema está diseñado para facilitar la búsqueda de trabajo, la gestión de perfiles profesionales y el acceso a formación continua.

### 🎯 Objetivos Principales

- **Conectar** profesionales con empresas
- **Facilitar** la búsqueda de empleo
- **Ofrecer** cursos de capacitación
- **Gestionar** perfiles profesionales
- **Proporcionar** herramientas de networking

---

## 🏗️ Arquitectura del Sistema

### **Arquitectura Cliente-Servidor**

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   Frontend      │ ◄──────────────► │   Backend       │
│   (HTML/CSS/JS) │                  │   (Node.js)     │
└─────────────────┘                  └─────────────────┘
                                            │
                                            ▼
                                    ┌─────────────────┐
                                    │   Base de Datos │
                                    │   (MySQL)       │
                                    └─────────────────┘
```

### **Componentes Principales**

1. **Frontend**: Interfaz de usuario responsiva
2. **Backend**: API RESTful con Node.js y Express
3. **Base de Datos**: MySQL para persistencia de datos
4. **Autenticación**: JWT para gestión de sesiones
5. **File System**: Almacenamiento de archivos estáticos

---

## 📁 Estructura del Proyecto

```
BuscoTrabajo_Intento2/
├── 📂 frontend/                    # Interfaz de usuario
│   ├── 📂 pages/                   # Páginas HTML
│   │   ├── 📄 index.html          # Login/Registro
│   │   ├── 📂 usuarios/           # Páginas de usuario
│   │   │   └── 📄 perfil.html     # Perfil de usuario
│   │   └── 📂 admin/              # Páginas de admin
│   ├── 📂 js/                     # JavaScript del frontend
│   │   ├── 📄 api-unificado.js    # Cliente API
│   │   └── 📄 main.js            # Lógica principal
│   ├── 📂 css/                    # Estilos CSS
│   └── 📂 assets/                 # Recursos estáticos
├── 📂 backend/                     # Servidor backend
│   ├── 📂 config/                 # Configuración
│   │   └── 📄 database.js         # Configuración DB
│   ├── 📂 routes/                  # Rutas API
│   ├── 📂 middleware/              # Middleware personalizado
│   ├── 📄 server.js               # Servidor principal
│   ├── 📄 package.json            # Dependencias
│   └── 📄 .env                    # Variables de entorno
├── 📂 database/                    # Base de datos
│   └── 📄 laboria_database_unificada.sql
├── 📂 shared/                      # Recursos compartidos
├── 📂 .vscode/                     # Configuración VS Code
│   └── 📄 settings.json           # Configuración editor
├── 📄 README-COMPLETO.md           # Esta documentación
├── 📄 PROMPT-IA.md                 # Prompt para IA
└── 📄 package.json                 # Configuración raíz
```

---

## ⚡ Funcionalidades Principales

### 🔐 **Autenticación y Gestión de Usuarios**

- **Registro de Usuarios**: Creación de cuentas con validación
- **Login de Usuarios**: Autenticación con JWT
- **Gestión de Perfiles**: Edición de información personal
- **Roles de Usuario**: Usuario, Administrador, Empresa

### 📊 **Gestión de Perfiles Profesionales**

- **Información Básica**: Nombre, email, teléfono
- **Experiencia Laboral**: Historial profesional
- **Educación**: Formación académica
- **Habilidades**: Competencias técnicas
- **Portfolio**: Proyectos y trabajos

### 💼 **Búsqueda de Empleo**

- **Filtros Avanzados**: Por sector, ubicación, salario
- **Búsqueda por Palabras Clave**: Búsqueda inteligente
- **Guardado de Ofertas**: Favoritos y alertas
- **Postulación Directa**: Aplicar a ofertas

### 📚 **Gestión de Cursos**

- **Catálogo de Cursos**: Listado de formación disponible
- **Inscripción a Cursos**: Registro en programas
- **Seguimiento del Progreso**: Estado de aprendizaje
- **Certificados**: Generación de diplomas

### 🏢 **Panel de Administración**

- **Gestión de Usuarios**: CRUD de usuarios
- **Moderación de Contenido**: Aprobación de publicaciones
- **Estadísticas**: Métricas y reportes
- **Configuración del Sistema**: Parámetros generales

---

## 🛠️ Tecnologías Utilizadas

### **Frontend**

| Tecnología | Versión | Uso |
|-------------|---------|-----|
| HTML5 | - | Estructura de páginas |
| CSS3 | - | Estilos y diseño |
| JavaScript | ES6+ | Lógica del cliente |
| Bootstrap | 5.x | Framework CSS |
| Font Awesome | 6.x | Iconos |

### **Backend**

| Tecnología | Versión | Uso |
|-------------|---------|-----|
| Node.js | v20.11.1 LTS | Runtime JavaScript |
| Express.js | 4.18.2 | Framework web |
| JWT | 9.0.2 | Autenticación |
| bcryptjs | 2.4.3 | Hash de contraseñas |
| MySQL2 | 3.6.5 | Conector MySQL |
| dotenv | 16.3.1 | Variables de entorno |
| cors | 2.8.5 | CORS |
| helmet | 7.1.0 | Seguridad |
| morgan | 1.10.0 | Logging |
| multer | 1.4.5 | Upload de archivos |

### **Base de Datos**

| Tecnología | Versión | Uso |
|-------------|---------|-----|
| MySQL | 8.0+ | Base de datos relacional |

### **Herramientas de Desarrollo**

| Herramienta | Uso |
|-------------|-----|
| VS Code | Editor de código |
| Live Server | Servidor de desarrollo |
| Git | Control de versiones |
| PowerShell | Terminal Windows |

---

## ⚙️ Configuración del Entorno

### **Variables de Entorno (.env)**

```bash
# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=laboria_db
DB_PORT=3306

# Aplicación
NODE_ENV=development
PORT=3000

# Seguridad
JWT_SECRET=laboria_jwt_secret_2026
SESSION_SECRET=laboria_session_secret_2026

# CORS
CORS_ORIGIN=http://localhost:5500

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
```

### **Configuración VS Code**

```json
{
    "liveServer.settings.port": 5500,
    "liveServer.settings.root": "/frontend",
    "liveServer.settings.host": "127.0.0.1",
    "liveServer.settings.CustomBrowser": "chrome"
}
```

---

## 🚀 Instalación y Puesta en Marcha

### **Prerrequisitos**

- Node.js v20.11.1 LTS o superior
- MySQL 8.0+ o superior
- Git para control de versiones
- VS Code (recomendado)

### **Pasos de Instalación**

1. **Clonar el Repositorio**
   ```bash
   git clone <repository-url>
   cd BuscoTrabajo_Intento2
   ```

2. **Instalar Node.js**
   - Descargar desde [nodejs.org](https://nodejs.org/)
   - Verificar instalación: `node --version`

3. **Configurar Base de Datos**
   ```bash
   mysql -u root -p
   CREATE DATABASE laboria_db;
   USE laboria_db;
   SOURCE database/laboria_database_unificada.sql;
   ```

4. **Configurar Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

5. **Iniciar Servidor Backend**
   ```bash
   npm start
   ```

6. **Iniciar Frontend**
   - Abrir `frontend/pages/index.html` con Live Server
   - O usar: `npx live-server frontend --port=5500`

### **Verificación de Instalación**

- Backend: `http://localhost:3000/api/health`
- Frontend: `http://localhost:5500/pages/index.html`

---

## 🔌 API Endpoints

### **Autenticación**

| Método | Endpoint | Descripción |
|--------|----------|------------|
| POST | `/api/auth/login/usuario` | Login de usuario |
| POST | `/api/auth/register/usuario` | Registro de usuario |
| POST | `/api/auth/login/admin` | Login de administrador |
| POST | `/api/auth/logout` | Cerrar sesión |

### **Usuarios**

| Método | Endpoint | Descripción |
|--------|----------|------------|
| GET | `/api/users/profile` | Obtener perfil |
| PUT | `/api/users/profile` | Actualizar perfil |
| GET | `/api/users/:id` | Obtener usuario por ID |
| DELETE | `/api/users/:id` | Eliminar usuario |

### **Empleos**

| Método | Endpoint | Descripción |
|--------|----------|------------|
| GET | `/api/jobs` | Listar ofertas |
| GET | `/api/jobs/:id` | Obtener oferta |
| POST | `/api/jobs` | Crear oferta |
| PUT | `/api/jobs/:id` | Actualizar oferta |
| DELETE | `/api/jobs/:id` | Eliminar oferta |

### **Cursos**

| Método | Endpoint | Descripción |
|--------|----------|------------|
| GET | `/api/courses` | Listar cursos |
| GET | `/api/courses/:id` | Obtener curso |
| POST | `/api/courses` | Crear curso |
| PUT | `/api/courses/:id` | Actualizar curso |
| DELETE | `/api/courses/:id` | Eliminar curso |

---

## 🗄️ Base de Datos

### **Esquema Principal**

```sql
-- Usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'empresa') DEFAULT 'user',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Perfiles
CREATE TABLE perfiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT REFERENCES usuarios(id),
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    telefono VARCHAR(20),
    bio TEXT,
    experiencia TEXT,
    educacion TEXT,
    habilidades TEXT,
    portfolio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Empleos
CREATE TABLE empleos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    empresa VARCHAR(100),
    ubicacion VARCHAR(100),
    salario DECIMAL(10,2),
    tipo VARCHAR(50),
    categoria VARCHAR(50),
    requisitos TEXT,
    beneficios TEXT,
    publicado_por INT REFERENCES usuarios(id),
    estado ENUM('activo', 'inactivo', 'cerrado') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cursos
CREATE TABLE cursos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    instructor VARCHAR(100),
    duracion VARCHAR(50),
    nivel VARCHAR(50),
    categoria VARCHAR(50),
    precio DECIMAL(10,2),
    imagen VARCHAR(255),
    contenido TEXT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    creado_por INT REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🚀 Mejoras Recomendadas

### **Prioridad Alta**

1. **Implementar Autenticación Completa**
   - Sistema de JWT robusto
   - Refresh tokens
   - Recuperación de contraseña
   - Verificación de email

2. **Optimización de Base de Datos**
   - Índices para consultas frecuentes
   - Conexión pool optimizada
   - Migraciones de base de datos
   - Seeds para datos de prueba

3. **Mejorar Experiencia de Usuario**
   - Loading states
   - Validación en tiempo real
   - Notificaciones push
   - Diseño responsivo mejorado

### **Prioridad Media**

4. **Funcionalidades Avanzadas**
   - Sistema de mensajería
   - Videoconferencias integradas
   - Sistema de calificaciones
   - Recomendaciones IA

5. **Infraestructura**
   - Dockerización
   - CI/CD pipeline
   - Testing automatizado
   - Monitorización

6. **Seguridad**
   - Rate limiting avanzado
   - Input sanitization
   - CORS configuración
   - HTTPS obligatorio

### **Prioridad Baja**

7. **Características Extra**
   - Blog integrado
   - Foro de discusión
   - Eventos y webinars
   - Newsletter

8. **Optimización**
   - Lazy loading
   - Caching strategies
   - CDN implementation
   - Performance monitoring

---

## 🔧 Troubleshooting

### **Problemas Comunes**

#### **1. Error: "node command not found"**
```bash
# Solución: Reinstalar Node.js o agregar al PATH
# Descargar desde nodejs.org y reinstalar
```

#### **2. Error: "Cannot connect to database"**
```bash
# Verificar configuración en .env
# Asegurar que MySQL está corriendo
# Revisar credenciales de base de datos
```

#### **3. Error: "CORS policy error"**
```bash
# Verificar configuración CORS en backend
# Asegurar que el origen está permitido
# Revisar puerto del frontend
```

#### **4. Error: "Port already in use"**
```bash
# Cambiar puerto en .env
# Matar proceso usando el puerto
# Usar puerto diferente
```

### **Comandos Útiles**

```bash
# Verificar Node.js
node --version
npm --version

# Verificar MySQL
mysql --version

# Verificar procesos en puerto
netstat -ano | findstr :3000

# Limpiar cache npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## 👥 Contribución

### **Guía de Contribución**

1. **Fork** el repositorio
2. **Crear** rama de feature (`git checkout -b feature/amazing-feature`)
3. **Commit** cambios (`git commit -m 'Add amazing feature'`)
4. **Push** a la rama (`git push origin feature/amazing-feature`)
5. **Abrir** Pull Request

### **Estándares de Código**

- **JavaScript**: ES6+ con ESLint
- **CSS**: BEM methodology
- **HTML**: Semántico y accesible
- **Commits**: Conventional Commits

### **Reporte de Issues**

- Usar plantilla de issue
- Incluir pasos para reproducir
- Adjuntar capturas de pantalla
- Especificar entorno

---

## 📄 Licencia

Este proyecto está licenciado bajo la **MIT License** - ver archivo [LICENSE](LICENSE) para detalles.

---

## 📞 Contacto

- **Email**: support@laboria.com
- **Website**: https://laboria.com
- **GitHub**: @laboria-team

---

## 🙏 Agradecimientos

- A la comunidad de desarrolladores Open Source
- A los contribuidores del proyecto
- A nuestros usuarios y testers

---

**🚀 Laboria - Construyendo el futuro profesional juntos!**
