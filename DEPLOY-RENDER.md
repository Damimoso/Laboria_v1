# 🚀 Guía de Despliegue - Laboria en Render

## 📋 Requisitos Previos

1. **Cuenta en Render** (https://render.com)
2. **Repositorio en GitHub** con el código del proyecto
3. **Node.js 18+** y dependencias instaladas

## 🔧 Configuración del Proyecto

### 1. Archivos de Configuración Creados

- ✅ `render.yaml` - Configuración completa para Render
- ✅ `backend/.env.production` - Variables de entorno producción
- ✅ `backend/config/database-production.js` - Configuración multi-base de datos
- ✅ `frontend/shared/constants-production.js` - Constantes para producción
- ✅ `backend/server-production.js` - Servidor optimizado para producción

### 2. Dependencias Actualizadas

- ✅ `pg` - Soporte para PostgreSQL (Render)
- ✅ `sqlite3` - Fallback local
- ✅ `mysql2` - Soporte MySQL (opcional)

## 🚀 Pasos de Despliegue

### Paso 1: Preparar el Repositorio

```bash
# Commit todos los cambios
git add .
git commit -m "Preparar para despliegue en Render"
git push origin main
```

### Paso 2: Configurar en Render

1. **Conectar GitHub** a Render
2. **Importar el repositorio** del proyecto
3. **Render detectará automáticamente** el archivo `render.yaml`

### Paso 3: Configurar Variables de Entorno

En el dashboard de Render, configurar:

#### Para el Backend (laboria-api):
```
NODE_ENV=production
PORT=10000
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=[auto-generado por Render]
DB_NAME=laboria_prod
JWT_SECRET=[auto-generado por Render]
CORS_ORIGIN=https://laboria.onrender.com
```

#### Para el Frontend (laboria-frontend):
```
API_BASE_URL=https://laboria-api.onrender.com
```

### Paso 4: Base de Datos

Render creará automáticamente una base de datos PostgreSQL. 
**Importante:** El archivo `render.yaml` ya incluye la configuración para la base de datos.

### Paso 5: Despliegue Automático

Una vez configurado, Render hará:

1. **Build** del backend con `npm install`
2. **Start** del servidor con `node server.js`
3. **Deploy** del frontend estático
4. **Setup** de la base de datos PostgreSQL

## 🌐 URLs Finales

- **Frontend:** `https://laboria.onrender.com`
- **Backend API:** `https://laboria-api.onrender.com/api`
- **Health Check:** `https://laboria-api.onrender.com/api/health`

## 🔍 Verificación del Despliegue

### 1. Health Check
```bash
curl https://laboria-api.onrender.com/api/health
```

### 2. Test de Registro
```bash
curl -X POST https://laboria-api.onrender.com/api/auth/register/usuario \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","confirmPassword":"password123"}'
```

### 3. Test de Login
```bash
curl -X POST https://laboria-api.onrender.com/api/auth/login/usuario \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🛠️ Solución de Problemas Comunes

### Error: "Cannot find module"
**Solución:** Asegurar que `package.json` esté actualizado y hacer `npm install`

### Error: "Database connection failed"
**Solución:** Verificar variables de entorno de la base de datos en Render

### Error: "CORS issues"
**Solución:** Actualizar `CORS_ORIGIN` en variables de entorno

### Error: "Port already in use"
**Solución:** Render usa puerto 10000, asegurarse que el código lo use

## 🔄 GoDaddy Go Live Integration

Para conectar con GoDaddy Go Live:

1. **En GoDaddy:**
   - Ir a "Domains" → "Manage DNS"
   - Crear registro A: `laboria.com` → IP de Render
   - O crear registro CNAME: `www` → `laboria-api.onrender.com`

2. **En Render:**
   - Añadir dominio custom en settings
   - Configurar SSL automático

3. **Actualizar CORS:**
   ```env
   CORS_ORIGIN=https://laboria.com,https://www.laboria.com
   ```

## 📊 Monitoreo y Logs

- **Logs:** Disponibles en el dashboard de Render
- **Métricas:** Render proporciona métricas básicas
- **Health Checks:** Configurados automáticamente

## 🔐 Seguridad en Producción

- ✅ Variables de entorno configuradas
- ✅ CORS restringido a dominios específicos
- ✅ Rate limiting activado
- ✅ Helmet para seguridad HTTP
- ✅ JWT secrets generados automáticamente

## 🚀 Optimizaciones

- ✅ Servidor optimizado para producción
- ✅ Base de datos PostgreSQL nativa
- ✅ CDN para archivos estáticos
- ✅ Compresión GZIP activada
- ✅ Caching configurado

## 📞 Soporte

Si tienes problemas durante el despliegue:

1. **Revisar logs** en el dashboard de Render
2. **Verificar variables** de entorno
3. **Test local** con `npm run start:prod`
4. **Contactar soporte** de Render si es necesario

---

**🎯 Una vez completados estos pasos, tu aplicación Laboria estará completamente funcional en producción.**
