# 🚀 Guía de Despliegue en Producción - Laboria

## 📋 Tabla de Contenido

- [Prerrequisitos](#prerrequisitos)
- [Configuración del Entorno](#configuración-del-entorno)
- [Despliegue Local](#despliegue-local)
- [Despliegue en Producción](#despliegue-en-producción)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Seguridad](#seguridad)
- [Mantenimiento](#mantenimiento)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerrequisitos

### Software Requerido

- **Docker** >= 20.10.0
- **Docker Compose** >= 2.0.0
- **Node.js** >= 18.0.0
- **Git** >= 2.30.0
- **OpenSSL** (para certificados SSL)

### Hardware Mínimo Recomendado

- **CPU**: 4 cores
- **RAM**: 8GB
- **Almacenamiento**: 50GB SSD
- **Red**: 1Gbps

### Servicios Externos

- **Dominio** (ej. laboria.com)
- **Certificado SSL** (recomendado Let's Encrypt o certificado comercial)
- **Cuenta AWS** (para S3, si se usa)
- **Cuenta Stripe** (para pagos, si se usa)
- **Cuenta SendGrid** (para emails, si se usa)

---

## ⚙️ Configuración del Entorno

### 1. Variables de Entorno

Copia el archivo de ejemplo y configúralo:

```bash
cp backend/.env.production backend/.env.production
```

Edita las siguientes variables críticas:

```bash
# Base de Datos
DB_HOST=localhost
DB_USER=laboria_user
DB_PASSWORD=TuPasswordSegura123!
DB_NAME=laboria_prod

# JWT
JWT_SECRET=SuperSecretJWTKeyForProduction2026!@#$%^&*()
SESSION_SECRET=SuperSecretSessionKeyForProduction2026!@#$%^&*()

# CORS
CORS_ORIGIN=https://laboria.com,https://www.laboria.com

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_USER=apikey
EMAIL_PASS=SG.YourSendGridAPIKey

# AWS (opcional)
AWS_ACCESS_KEY_ID=YourAWSAccessKey
AWS_SECRET_ACCESS_KEY=YourAWSSecretKey
AWS_REGION=us-east-1
AWS_S3_BUCKET=laboria-uploads

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_live_YourStripeSecretKey
STRIPE_WEBHOOK_SECRET=whsec_YourWebhookSecret

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
GRAFANA_PASSWORD=TuGrafanaPasswordSegura
```

### 2. Configuración de Base de Datos

```bash
# Crear base de datos y usuario
mysql -u root -p << EOF
CREATE DATABASE laboria_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'laboria_user'@'%' IDENTIFIED BY 'TuPasswordSegura123!';
GRANT ALL PRIVILEGES ON laboria_prod.* TO 'laboria_user'@'%';
FLUSH PRIVILEGES;
EOF
```

### 3. Configuración de SSL

#### Opción A: Let's Encrypt (Recomendado)

```bash
# Instalar certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d laboria.com -d www.laboria.com

# Configurar renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Opción B: Certificado Comercial

Coloca tus archivos SSL en `nginx/ssl/`:
- `nginx/ssl/laboria.com.crt`
- `nginx/ssl/laboria.com.key`

---

## 🚀 Despliegue Local

### 1. Preparar el Entorno

```bash
# Hacer ejecutable el script de despliegue
chmod +x deploy.sh

# Crear directorios necesarios
mkdir -p logs uploads temp backups ssl nginx/conf.d
```

### 2. Ejecutar Despliegue

```bash
# Ejecutar script de despliegue
./deploy.sh
```

El script realizará automáticamente:
- ✅ Verificación de variables de entorno
- ✅ Creación de directorios
- ✅ Generación de certificados SSL (auto-firmados para desarrollo)
- ✅ Creación de archivos de configuración
- ✅ Construcción de imágenes Docker
- ✅ Inicio de servicios
- ✅ Verificación del despliegue

### 3. Verificar Despliegue

```bash
# Verificar que todos los conteneders estén corriendo
docker-compose -f docker-compose.prod.yml ps

# Verificar health checks
curl -f http://localhost/api/health
curl -f http://localhost/health

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f laboria-api
```

---

## 🌐 Despliegue en Producción

### 1. Configurar Servidor

#### Requisitos del Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx (si no se usa Docker)
sudo apt install nginx -y

# Instalar herramientas adicionales
sudo apt install curl wget git openssl -y
```

### 2. Configurar Firewall

```bash
# Configurar UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir puertos necesarios
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Opcional: permitir acceso desde IPs específicas
sudo ufw allow from 192.168.1.0/24 to any port 22
```

### 3. Desplegar Aplicación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/laboria.git
cd laboria

# Configurar variables de entorno
cp backend/.env.production backend/.env.production
# Editar el archivo con tus credenciales

# Ejecutar despliegue
./deploy.sh
```

### 4. Configurar Nginx (si no se usa Docker)

```bash
# Copiar configuración de Nginx
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo cp nginx/conf.d/* /etc/nginx/conf.d/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5. Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado
sudo certbot --nginx -d laboria.com -d www.laboria.com

# Configurar renovación automática
sudo crontab -e
# Agregar línea: 0 12 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## 📊 Monitoreo y Logs

### 1. Acceso a Herramientas de Monitoreo

#### Grafana
- **URL**: http://localhost:3001
- **Usuario**: admin
- **Contraseña**: TuGrafanaPasswordSegura

#### Prometheus
- **URL**: http://localhost:9090
- **Métricas**: http://localhost:9090/metrics

#### Kibana
- **URL**: http://localhost:5601
- **Logs**: http://localhost:5601/app/kibana#/discover

### 2. Configurar Alertas

#### Alertas en Grafana

1. Ir a http://localhost:3001
2. Navegar a Alerting → Notification Channels
3. Configurar canal de notificación (email, Slack, etc.)
4. Crear reglas de alerta para:
   - CPU > 80%
   - Memory > 80%
   - Error rate > 5%
   - Response time > 2s

#### Alertas en Prometheus

```yaml
# monitoring/prometheus.yml
rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 3. Logs Centralizados

#### Filebeat Configuration

```yaml
# monitoring/filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/app/*.log
  fields:
    service: laboria-api
  fields_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

---

## 🔒 Seguridad

### 1. Configuración de Seguridad por Defecto

#### Headers de Seguridad
```nginx
# nginx.conf
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=63072000";
```

#### Rate Limiting
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
```

#### Políticas de Red
```bash
# Firewall rules
sudo ufw deny from 192.168.1.100 to any port 3306
sudo ufw deny from 0.0.0.0/0 to any port 6379
```

### 2. Escaneo de Seguridad

```bash
# Escanear vulnerabilidades
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image laboria-api:latest

# Escanear dependencias
npm audit --audit-level high

# Escanear OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://laboria.com
```

### 3. Backup y Recuperación

#### Backup Automático

```bash
# Script de backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u laboria_user -p laboria_prod > backup_$DATE.sql
gzip backup_$DATE.sql
aws s3 cp backup_$DATE.sql.gz s3://laboria-backups/
```

#### Recuperación de Desastres

```bash
# Restaurar desde backup
aws s3 cp s3://laboria-backups/backup_20231201_120000.sql.gz .
gunzip backup_20231201_120000.sql.gz
mysql -u laboria_user -p laboria_prod < backup_20231201_120000.sql
```

---

## 🔧 Mantenimiento

### 1. Tareas Programadas

#### Actualización Automática

```bash
# Crontab
0 2 * * * /path/to/laboria/update.sh
0 3 * * 0 /path/to/laboria/backup.sh
0 4 * * 0 /path/to/laboria/cleanup.sh
```

#### Script de Actualización

```bash
#!/bin/bash
# update.sh
echo "Actualizando Laboria..."

# Pull de nuevos cambios
git pull origin main

# Reconstruir imágenes
docker-compose -f docker-compose.prod.yml build --no-cache

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml up -d

echo "Actualización completada"
```

### 2. Limpieza de Recursos

#### Limpieza de Logs

```bash
# Limpiar logs antiguos
find logs/ -name "*.log" -mtime +30 -delete
find logs/ -name "*.log.gz" -mtime +90 -delete

# Limpiar Docker
docker system prune -f
docker volume prune -f
```

#### Limpieza de Base de Datos

```sql
-- Limpiar logs antiguos
DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Limpiar sesiones expiradas
DELETE FROM user_sessions WHERE expires_at < NOW();
```

### 3. Monitoreo de Recursos

#### Script de Monitoreo

```bash
#!/bin/bash
# monitor.sh
echo "=== Monitoreo de Recursos ==="

# CPU y Memoria
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Espacio en disco
df -h | grep -E "(Filesystem|/dev/)"

# Espacio en Docker
docker system df

# Conexiones activas
netstat -an | grep :3000 | wc -l
```

---

## 🚨 Troubleshooting

### 1. Problemas Comunes

#### Container no inicia

```bash
# Ver logs del container
docker-compose -f docker-compose.prod.yml logs laboria-api

# Verificar configuración
docker-compose -f docker-compose.prod.yml config

# Reiniciar container
docker-compose -f docker-compose.prod.yml restart laboria-api
```

#### Base de datos no conecta

```bash
# Verificar conexión
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p

# Verificar configuración
docker-compose -f docker-compose.prod.yml exec mysql cat /etc/mysql/my.cnf

# Reiniciar base de datos
docker-compose -f docker-compose.prod.yml restart mysql
```

#### Alto uso de memoria

```bash
# Identificar proceso
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"

# Reiniciar servicio
docker-compose -f docker-compose.prod.yml restart laboria-api

# Ajustar límites de memoria
# En docker-compose.prod.yml
services:
  laboria-api:
    deploy:
      resources:
        limits:
          memory: 2G
```

#### SSL Certificate Issues

```bash
# Verificar certificado
openssl x509 -in nginx/ssl/laboria.com.crt -text -noout

# Verificar configuración Nginx
nginx -t

# Renovar certificado
sudo certbot renew --quiet
```

### 2. Comandos de Diagnóstico

#### Verificar Estado General

```bash
# Estado de todos los servicios
docker-compose -f docker-compose.prod.yml ps

# Health checks
curl -f http://localhost/api/health
curl -f http://localhost/health

# Logs de errores
docker-compose -f docker-compose.prod.yml logs --tail=100 laboria-api | grep ERROR
```

#### Diagnóstico de Red

```bash
# Verificar puertos abiertos
netstat -tulpn | grep -E ":(80|443|3000|3306|6379)"

# Verificar DNS
nslookup laboria.com
dig laboria.com

# Verificar SSL
openssl s_client -connect laboria.com:443 -servername laboria.com
```

#### Diagnóstico de Base de Datos

```bash
# Conectar a base de datos
docker-compose -f docker-compose.prod.yml exec mysql mysql -u laboria_user -p laboria_prod

# Verificar tablas
SHOW TABLES;

# Verificar conexiones
SHOW PROCESSLIST;

# Verificar estado
SHOW ENGINE INNODB STATUS;
```

### 3. Recuperación de Emergencia

#### Modo Mantenimiento

```bash
# Poner aplicación en modo mantenimiento
# Editar nginx.conf para mostrar página de mantenimiento
sudo cp nginx/maintenance.conf /etc/nginx/nginx.conf
sudo nginx -s reload
```

#### Rollback a Versión Anterior

```bash
# Listar imágenes disponibles
docker images | grep laboria-api

# Cambiar a versión anterior
docker tag laboria-api:latest laboria-api:backup
docker tag laboria-api:v1.0.0 laboria-api:latest
docker-compose -f docker-compose.prod.yml up -d
```

#### Recuperación Completa

```bash
# Parar todos los servicios
docker-compose -f docker-compose.prod.yml down

# Limpiar volúmenes (cuidado: esto elimina datos)
docker-compose -f docker-compose.prod.yml down -v

# Reiniciar desde cero
./deploy.sh
```

---

## 📞 Soporte y Contacto

### Equipo de Operaciones

- **DevOps Lead**: devops@laboria.com
- **Backend Lead**: backend@laboria.com
- **Security Team**: security@laboria.com

### Canales de Comunicación

- **Slack**: #operations
- **Email**: ops@laboria.com
- **Phone**: +1-555-LABORIA (emergencias)

### Procedimientos de Escalada

1. **Nivel 1**: Issues de rutina (Slack #operations)
2. **Nivel 2**: Issues críticos (email + Slack)
3. **Nivel 3**: Emergencias (phone + email + Slack)

---

## 📚 Referencias

### Documentación Adicional

- [API Documentation](https://docs.laboria.com)
- [Database Schema](https://docs.laboria.com/database)
- [Security Guidelines](https://docs.laboria.com/security)
- [Performance Tuning](https://docs.laboria.com/performance)

### Herramientas Útiles

- [Docker Documentation](https://docs.docker.com)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Redis Documentation](https://redis.io/documentation)

### Best Practices

- [12-Factor App](https://12factor.net/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Nginx Security](https://www.nginx.com/blog/nginx-security-best-practices/)

---

## 🔄 Actualizaciones

Esta guía se actualiza regularmente. Última actualización: Diciembre 2023

Para sugerencias o correcciones, contacte al equipo de documentación: docs@laboria.com
