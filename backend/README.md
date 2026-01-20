# Backend Laboria - Versión Simplificada

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Editar el archivo `.env` con tus credenciales de base de datos.

### 3. Iniciar servidor
```bash
npm start
```

## 📋 Endpoints Disponibles

### Autenticación
- `POST /api/auth/login/usuario` - Login de usuario
- `POST /api/auth/register/usuario` - Registro de usuario

### Sistema
- `GET /api/health` - Health check del servidor

## 🔧 Configuración

El servidor corre en el puerto 3000 por defecto.
El frontend está disponible en `http://localhost:3000/pages/index.html`

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   └── database.js     # Configuración de base de datos
├── server.js           # Servidor principal
├── package.json        # Dependencias y scripts
├── .env              # Variables de entorno
└── README.md          # Esta documentación
```

## 🛠️ Tecnologías

- Express.js
- MySQL2
- JWT
- CORS
- Helmet
- Morgan
- Rate Limiting
