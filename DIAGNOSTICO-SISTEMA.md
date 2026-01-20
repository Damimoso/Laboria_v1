# 🔍 DIAGNÓSTICO DEL SISTEMA LABORIA

## 🚨 PROBLEMAS IDENTIFICADOS

### **1. Node.js y npm NO INSTALADOS**
```
❌ Error: 'node' no se reconoce como nombre de un cmdlet
❌ Error: 'npm' no se reconoce como nombre de un cmdlet
```

**🔍 Causa:** Node.js y npm no están instalados o no están en el PATH del sistema.

---

### **2. Dependencias Faltantes**
El servidor requiere las siguientes dependencias de Node.js:
```json
{
  "express": "^4.18.0",
  "mysql2": "^3.6.0", 
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "morgan": "^1.10.0",
  "express-rate-limit": "^6.7.0"
}
```

**❌ Problema:** Las dependencias no están instaladas.

---

### **3. Base de Datos MySQL**
El sistema requiere MySQL 8.0+ con la base de datos `laboria_db` creada.

**❌ Problema:** Probablemente la base de datos no está creada o MySQL no está corriendo.

---

## ✅ SOLUCIONES PASO A PASO

### **PASO 1: Instalar Node.js**
**Opción A: Descargar desde sitio oficial**
1. Ir a https://nodejs.org/
2. Descargar la versión LTS (Long Term Support)
3. Instalar con opciones por defecto

**Opción B: Usar gestor de versiones**
1. Instalar nvm (Node Version Manager)
2. Usar nvm para instalar Node.js

### **PASO 2: Instalar dependencias**
```bash
cd backend
npm install express mysql2 bcryptjs jsonwebtoken cors helmet morgan express-rate-limit
```

### **PASO 3: Configurar Base de Datos MySQL**
1. **Iniciar MySQL:**
   - Windows: Services > MySQL80 > Start
   - Mac/Linux: `sudo systemctl start mysql` o `brew services start mysql`

2. **Crear base de datos:**
   ```sql
   mysql -u root -p
   CREATE DATABASE laboria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Importar estructura:**
   ```bash
   mysql -u root -p laboria_db < database/laboria_database_unificada.sql
   ```

### **PASO 4: Configurar Variables de Entorno**
Crear archivo `.env` en el directorio backend:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=laboria_db
JWT_SECRET=laboria_secret_key_2024
JWT_EXPIRES_IN=24h
PORT=3000
```

### **PASO 5: Iniciar Servidor**
```bash
cd backend
node server-unificado.js
```

---

## 🧪 VERIFICACIÓN DEL SISTEMA

### **Test 1: Verificar instalación de Node.js**
```bash
node --version
npm --version
```

### **Test 2: Verificar dependencias**
```bash
cd backend
npm list
```

### **Test 3: Verificar conexión a BD**
```bash
cd backend
node -e "const db = require('./config/database-unificado'); db.testConnection().then(console.log).catch(console.error);"
```

### **Test 4: Iniciar servidor**
```bash
cd backend
node server-unificado.js
```

### **Test 5: Acceder al sistema**
Abrir navegador en: http://localhost:3000/pages/index.html

---

## 🔧 ARCHIVOS CRÍTICOS REQUERIDOS

### **Backend:**
- ✅ `server-unificado.js` - Servidor principal
- ✅ `config/database-unificado.js` - Configuración BD
- ✅ `routes/auth-unificado.js` - Rutas API
- ✅ `controllers/authController-unificado.js` - Controladores
- ✅ `models/Usuario-Unificado.js` - Modelo usuarios
- ✅ `models/Administrador-Unificado.js` - Modelo admins
- ✅ `package.json` - Dependencias (corregido)

### **Frontend:**
- ✅ `pages/index.html` - Login/registro (corregido)
- ✅ `pages/usuarios/perfil.html` - Perfil dinámico
- ✅ `js/api-unificado.js` - Cliente API
- ✅ `shared/constants.js` - Constantes

### **Base de Datos:**
- ✅ `database/laboria_database_unificada.sql` - Estructura completa

---

## 🚀 ACCIONES INMEDIATAS

### **1. Instalar Node.js**
Descargar e instalar Node.js LTS desde https://nodejs.org/

### **2. Instalar MySQL**
Asegurar que MySQL 8.0+ esté instalado y corriendo

### **3. Crear Base de Datos**
```bash
mysql -u root -p
CREATE DATABASE laboria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### **4. Importar Estructura**
```bash
mysql -u root -p laboria_db < database/laboria_database_unificada.sql
```

### **5. Instalar Dependencias**
```bash
cd backend
npm install
```

### **6. Configurar Variables**
Crear archivo `.env` con las credenciales de MySQL

### **7. Iniciar Servidor**
```bash
cd backend
node server-unificado.js
```

---

## 🎯 RESULTADO ESPERADO

Una vez completados estos pasos, el sistema debería:
- ✅ Iniciar sin errores
- ✅ Conectarse a la base de datos
- ✅ Servir el frontend en http://localhost:3000
- ✅ Permitir registro y login de usuarios
- ✅ Mostrar perfiles dinámicos con datos reales

---

## 📞 POSIBLES ERRORES Y SOLUCIONES

### **Error: "Cannot find module 'express'"**
**Solución:** Ejecutar `npm install` en el directorio backend

### **Error: "ECONNREFUSED connection to MySQL"**
**Solución:** 
1. Verificar que MySQL esté corriendo
2. Verificar credenciales en `.env`
3. Verificar que la base de datos `laboria_db` exista

### **Error: "Access denied for user"**
**Solución:** 
1. Verificar usuario y contraseña de MySQL
2. Crear usuario con permisos adecuados si es necesario

### **Error: "Port 3000 already in use"**
**Solución:** 
1. Cambiar el puerto en `.env` (PORT=3001)
2. Matar proceso ocupando el puerto: `netstat -ano | findstr :3000`

---

## 🎯 PRIORIDADES

1. **🔥 ALTA:** Instalar Node.js y MySQL
2. **🔥 ALTA:** Crear base de datos
3. **🔥 ALTA:** Instalar dependencias
4. **🟡 MEDIA:** Configurar variables de entorno
5. **🟡 MEDIA:** Iniciar servidor
6. **🟢 BAJA:** Probar funcionalidad

---

**📋 Seguir estos pasos en orden garantizará que el sistema Laboria funcione correctamente.**
