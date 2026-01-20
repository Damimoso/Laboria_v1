#!/bin/bash

# =============================================
# SCRIPT DE DESPLIEGUE LABORIA - PRODUCCIÓN
# =============================================

set -e  # Salir si hay error
set -u  # Salir si hay variable no definida

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

# Variables de entorno
ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.prod.yml"

# Función para verificar variables de entorno
verify_env_vars() {
    log_info "Verificando variables de entorno..."
    
    local required_vars=(
        "MYSQL_ROOT_PASSWORD"
        "MYSQL_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "SESSION_SECRET"
        "CORS_ORIGIN"
        "EMAIL_HOST"
        "EMAIL_USER"
        "EMAIL_PASS"
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "AWS_REGION"
        "AWS_S3_BUCKET"
        "STRIPE_SECRET_KEY"
        "SENTRY_DSN"
        "GRAFANA_PASSWORD"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Faltan las siguientes variables de entorno:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log_error "Por favor, configura estas variables en $ENV_FILE"
        exit 1
    fi
    
    log_success "Variables de entorno verificadas"
}

# Función para crear directorios necesarios
create_directories() {
    log_info "Creando directorios necesarios..."
    
    local directories=(
        "logs"
        "uploads"
        "uploads/avatars"
        "uploads/documents"
        "uploads/images"
        "temp"
        "backups"
        "ssl"
        "nginx/conf.d"
        "monitoring"
        "monitoring/grafana/dashboards"
        "monitoring/grafana/datasources"
        "database"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "Directorio creado: $dir"
        fi
    done
    
    log_success "Directorios creados"
}

# Función para generar configuración SSL
generate_ssl_config() {
    log_info "Generando configuración SSL..."
    
    if [ ! -f "ssl/laboria.com.crt" ]; then
        log_warning "Certificado SSL no encontrado. Generando certificado auto-firmado para desarrollo..."
        
        # Generar clave privada
        openssl genrsa -out ssl/laboria.com.key 2048
        
        # Generar CSR
        openssl req -new -key ssl/laboria.com.key -out ssl/laboria.com.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=laboria.com"
        
        # Generar certificado auto-firmado
        openssl x509 -req -days 365 -in ssl/laboria.com.csr -signkey ssl/laboria.com.key -out ssl/laboria.com.crt
        
        # Limpiar CSR
        rm ssl/laboria.com.csr
        
        log_info "Certificado SSL auto-firmado generado"
        log_warning "IMPORTANTE: Para producción, reemplaza con un certificado real de una CA"
    else
        log_success "Certificado SSL encontrado"
    fi
}

# Función para crear archivos de configuración
create_config_files() {
    log_info "Creando archivos de configuración..."
    
    # Configuración de MySQL
    if [ ! -f "database/mysql.cnf" ]; then
        cat > database/mysql.cnf << EOF
[mysqld]
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
max_connections = 200
query_cache_size = 32M
query_cache_type = 1
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
EOF
        log_info "Configuración MySQL creada"
    fi
    
    # Configuración de Redis
    if [ ! -f "database/redis.conf" ]; then
        cat > database/redis.conf << EOF
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
EOF
        log_info "Configuración Redis creada"
    fi
    
    # Configuración de Prometheus
    if [ ! -f "monitoring/prometheus.yml" ]; then
        cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'laboria-api'
    static_configs:
      - targets: ['nginx:80']
    metrics_path: '/metrics'
    scrape_interval: 30s
EOF
        log_info "Configuración Prometheus creada"
    fi
    
    # Configuración de Filebeat
    if [ ! -f "monitoring/filebeat.yml" ]; then
        cat > monitoring/filebeat.yml << EOF
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/app/*.log
  fields:
    service: laboria-api
  fields_under_root: true

- type: log
  enabled: true
  paths:
    - /var/log/nginx/*.log
  fields:
    service: nginx
  fields_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]

setup.kibana:
  host: "kibana:5601"
EOF
        log_info "Configuración Filebeat creada"
    fi
    
    log_success "Archivos de configuración creados"
}

# Función para construir imágenes Docker
build_images() {
    log_info "Construyendo imágenes Docker..."
    
    # Construir imagen de la aplicación
    docker build -t laboria-api:latest .
    
    log_success "Imágenes Docker construidas"
}

# Función para iniciar servicios
start_services() {
    log_info "Iniciando servicios con Docker Compose..."
    
    # Iniciar servicios en orden
    docker-compose -f "$COMPOSE_FILE" up -d mysql redis
    
    # Esperar a que la base de datos esté lista
    log_info "Esperando a que la base de datos esté lista..."
    sleep 30
    
    # Iniciar aplicación
    docker-compose -f "$COMPOSE_FILE" up -d laboria-api
    
    # Esperar a que la aplicación esté lista
    log_info "Esperando a que la aplicación esté lista..."
    sleep 15
    
    # Iniciar servicios restantes
    docker-compose -f "$COMPOSE_FILE" up -d nginx prometheus grafana elasticsearch kibana filebeat
    
    log_success "Servicios iniciados"
}

# Función para verificar despliegue
verify_deployment() {
    log_info "Verificando despliegue..."
    
    # Verificar que los conteneders estén corriendo
    local containers=("mysql" "redis" "laboria-api" "nginx" "prometheus" "grafana" "elasticsearch" "kibana" "filebeat")
    
    for container in "${containers[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps "$container" | grep -q "Up"; then
            log_success "✓ $container está corriendo"
        else
            log_error "✗ $container no está corriendo"
            return 1
        fi
    done
    
    # Verificar health check de la API
    log_info "Verificando health check de la API..."
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        log_success "✓ API responde correctamente"
    else
        log_error "✗ API no responde"
        return 1
    fi
    
    # Verificar health check de Nginx
    log_info "Verificando health check de Nginx..."
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "✓ Nginx responde correctamente"
    else
        log_error "✗ Nginx no responde"
        return 1
    fi
    
    log_success "Verificación completada"
}

# Función para mostrar información de acceso
show_access_info() {
    log_info "Información de acceso:"
    echo ""
    echo "🌐 Aplicación:"
    echo "   URL: https://laboria.com"
    echo "   API: https://laboria.com/api"
    echo "   Health: https://laboria.com/health"
    echo ""
    echo "📊 Monitoreo:"
    echo "   Prometheus: http://localhost:9090"
    echo "   Grafana: http://localhost:3001"
    echo "   Usuario: admin"
    echo "   Contraseña: ${GRAFANA_PASSWORD}"
    echo ""
    echo "📝 Logs:"
    echo "   Kibana: http://localhost:5601"
    echo ""
    echo "🗄️ Base de datos:"
    echo "   Host: localhost:3306"
    echo "   Base de datos: laboria_prod"
    echo "   Usuario: laboria_user"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "   Ver logs: docker-compose -f $COMPOSE_FILE logs -f laboria-api"
    echo "   Reiniciar: docker-compose -f $COMPOSE_FILE restart"
    echo "   Detener: docker-compose -f $COMPOSE_FILE down"
    echo ""
}

# Función principal
main() {
    echo "🚀 Iniciando despliegue de Laboria en producción..."
    echo ""
    
    # Verificar prerequisitos
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose no está instalado"
        exit 1
    fi
    
    # Ejecutar pasos del despliegue
    verify_env_vars
    create_directories
    generate_ssl_config
    create_config_files
    build_images
    start_services
    verify_deployment
    show_access_info
    
    log_success "¡Despliegue completado exitosamente!"
    echo ""
    log_info "Laboria está ahora corriendo en producción"
    log_info "Visita https://laboria.com para acceder a la aplicación"
}

# Ejecutar función principal
main "$@"
