#!/bin/bash

# =============================================
# SCRIPT DE ACTUALIZACIÓN LABORIA - PRODUCCIÓN
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

# Variables de configuración
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="backups"
UPDATE_LOG="logs/update.log"

# Función para crear backup
create_backup() {
    log_info "Creando backup antes de actualizar..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/pre_update_${timestamp}.sql"
    
    # Crear directorio de backup si no existe
    mkdir -p "$BACKUP_DIR"
    
    # Backup de base de datos
    log_info "Haciendo backup de base de datos..."
    docker-compose -f "$COMPOSE_FILE" exec mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases > "$backup_file"
    
    # Comprimir backup
    gzip "$backup_file"
    
    # Backup de configuraciones
    log_info "Haciendo backup de configuraciones..."
    tar -czf "${BACKUP_DIR}/config_${timestamp}.tar.gz" \
        docker-compose.prod.yml \
        nginx/ \
        monitoring/ \
        .env.production
    
    log_success "Backup completado: ${backup_file}.gz"
}

# Función para verificar estado actual
verify_current_state() {
    log_info "Verificando estado actual del sistema..."
    
    # Verificar que los conteneders estén corriendo
    local containers=("mysql" "redis" "laboria-api" "nginx")
    
    for container in "${containers[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps "$container" | grep -q "Up"; then
            log_success "✓ $container está corriendo"
        else
            log_error "✗ $container no está corriendo"
            return 1
        fi
    done
    
    # Verificar health checks
    log_info "Verificando health checks..."
    
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        log_success "✓ API responde correctamente"
    else
        log_error "✗ API no responde"
        return 1
    fi
    
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "✓ Nginx responde correctamente"
    else
        log_error "✗ Nginx no responde"
        return 1
    fi
    
    log_success "Estado actual verificado"
}

# Función para descargar actualizaciones
download_updates() {
    log_info "Descargando actualizaciones..."
    
    # Hacer backup del estado actual de git
    git stash push -m "pre-update-$(date +%Y%m%d_%H%M%S)"
    
    # Descargar últimos cambios
    git fetch origin
    
    # Verificar si hay actualizaciones
    local current_commit=$(git rev-parse HEAD)
    local latest_commit=$(git rev-parse origin/main)
    
    if [ "$current_commit" = "$latest_commit" ]; then
        log_info "No hay actualizaciones disponibles"
        git stash pop
        return 0
    fi
    
    log_info "Actualizaciones disponibles. Aplicando cambios..."
    
    # Aplicar actualizaciones
    git pull origin main
    
    log_success "Actualizaciones descargadas"
}

# Función para construir nuevas imágenes
build_images() {
    log_info "Construyendo nuevas imágenes Docker..."
    
    # Construir imagen de la aplicación
    docker build -t laboria-api:latest .
    
    # Etiquetar con commit hash
    local commit_hash=$(git rev-parse --short HEAD)
    docker tag laboria-api:latest laboria-api:"$commit_hash"
    
    log_success "Imágenes construidas"
}

# Función para actualizar servicios con zero downtime
update_services() {
    log_info "Actualizando servicios con zero downtime..."
    
    # Actualizar servicios uno por uno
    
    # 1. Actualizar aplicación (rolling update)
    log_info "Actualizando aplicación..."
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps laboria-api
    
    # Esperar a que la aplicación esté lista
    log_info "Esperando a que la aplicación esté lista..."
    sleep 30
    
    # Verificar que la nueva versión esté funcionando
    if ! curl -f http://localhost/api/health > /dev/null 2>&1; then
        log_error "La nueva versión de la aplicación no responde. Haciendo rollback..."
        rollback_services
        return 1
    fi
    
    # 2. Actualizar Nginx
    log_info "Actualizando Nginx..."
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps nginx
    
    # Esperar a que Nginx esté listo
    sleep 10
    
    # 3. Actualizar servicios de monitoreo
    log_info "Actualizando servicios de monitoreo..."
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps prometheus grafana
    
    log_success "Servicios actualizados"
}

# Función para rollback en caso de error
rollback_services() {
    log_error "Iniciando rollback..."
    
    # Restaurar backup de base de datos
    local latest_backup=$(ls -t "$BACKUP_DIR"/pre_update_*.sql.gz | head -n 1)
    
    if [ -n "$latest_backup" ]; then
        log_info "Restaurando backup de base de datos: $latest_backup"
        gunzip -c "$latest_backup" | docker-compose -f "$COMPOSE_FILE" exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD"
    fi
    
    # Restaurar configuraciones
    local latest_config=$(ls -t "$BACKUP_DIR"/config_*.tar.gz | head -n 1)
    
    if [ -n "$latest_config" ]; then
        log_info "Restaurando configuraciones: $latest_config"
        tar -xzf "$latest_config" -C ./
    fi
    
    # Reiniciar servicios con configuración anterior
    log_info "Reiniciando servicios..."
    docker-compose -f "$COMPOSE_FILE" down
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Esperar a que todo esté listo
    sleep 30
    
    # Verificar que el rollback funcionó
    if verify_current_state; then
        log_success "Rollback completado exitosamente"
    else
        log_error "Rollback falló. Requiere intervención manual"
        exit 1
    fi
}

# Función para limpiar recursos antiguos
cleanup_resources() {
    log_info "Limpiando recursos antiguos..."
    
    # Limpiar imágenes Docker no utilizadas
    docker image prune -f
    
    # Limpiar volúmenes huérfanos
    docker volume prune -f
    
    # Limpiar logs antiguos (más de 30 días)
    find logs/ -name "*.log" -mtime +30 -delete
    find logs/ -name "*.log.gz" -mtime +90 -delete
    
    # Limpiar backups antiguos (más de 90 días)
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +90 -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +90 -delete
    
    log_success "Limpieza completada"
}

# Función para verificar post-actualización
verify_post_update() {
    log_info "Verificando post-actualización..."
    
    # Verificar que todos los servicios estén corriendo
    if ! verify_current_state; then
        log_error "Verificación post-actualización falló"
        return 1
    fi
    
    # Verificar versión actual
    local current_version=$(curl -s http://localhost/api/health | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    log_success "Versión actual: $current_version"
    
    # Verificar funcionalidad básica
    log_info "Verificando funcionalidad básica..."
    
    # Test de login
    local login_response=$(curl -s -X POST http://localhost/api/auth/login/usuario \
        -H "Content-Type: application/json" \
        -d '{"email":"test@laboria.com","password":"test123"}')
    
    if echo "$login_response" | grep -q '"success":false'; then
        log_warning "Test de login falló (esperado si no existe el usuario de test)"
    else
        log_success "Test de login exitoso"
    fi
    
    # Test de registro
    local register_response=$(curl -s -X POST http://localhost/api/auth/register/usuario \
        -H "Content-Type: application/json" \
        -d '{"username":"testuser","email":"test@laboria.com","password":"Test123!@#"}')
    
    if echo "$register_response" | grep -q '"success":true'; then
        log_success "Test de registro exitoso"
    else
        log_warning "Test de registro falló (posible usuario duplicado)"
    fi
    
    log_success "Verificación post-actualización completada"
}

# Función para enviar notificación
send_notification() {
    local status=$1
    local message=$2
    
    # Enviar notificación a Slack (si está configurado)
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Laboria Update $status: $message\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    # Enviar email (si está configurado)
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "Laboria Update $status" "$NOTIFICATION_EMAIL"
    fi
}

# Función principal
main() {
    local start_time=$(date +%s)
    
    echo "🔄 Iniciando actualización de Laboria en producción..."
    echo "========================================"
    
    # Crear log de actualización
    mkdir -p logs
    exec > >(tee -a "$UPDATE_LOG")
    
    # Enviar notificación de inicio
    send_notification "STARTED" "Iniciando actualización del sistema"
    
    # Ejecutar pasos de actualización
    create_backup
    verify_current_state
    download_updates
    build_images
    update_services
    verify_post_update
    cleanup_resources
    
    # Calcular tiempo total
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_formatted=$(printf '%02d:%02d:%02d' $((duration/3600)) $((duration%3600/60)) $((duration%60)))
    
    echo "========================================"
    log_success "¡Actualización completada exitosamente!"
    log_info "Tiempo total: $duration_formatted"
    log_info "Log de actualización: $UPDATE_LOG"
    
    # Enviar notificación de éxito
    send_notification "COMPLETED" "Actualización completada en $duration_formatted"
    
    # Mostrar resumen
    echo ""
    echo "📊 Resumen de la actualización:"
    echo "   ✅ Backup creado"
    echo "   ✅ Código actualizado"
    echo "   ✅ Imágenes construidas"
    echo "   ✅ Servicios actualizados"
    echo "   ✅ Verificación completada"
    echo "   ✅ Limpieza realizada"
    echo ""
    echo "🌐 Sistema actualizado y funcionando:"
    echo "   📱 Aplicación: https://laboria.com"
    echo "   📊 Monitoreo: http://localhost:3001"
    echo "   📝 Logs: http://localhost:5601"
    echo ""
}

# Manejo de errores
trap 'log_error "Error en la actualización. Revisa los logs en $UPDATE_LOG"; send_notification "FAILED" "Error en la actualización"; exit 1' ERR

# Manejo de interrupción
trap 'log_warning "Actualización interrumpida"; send_notification "INTERRUPTED" "Actualización interrumpida por el usuario"; exit 130' INT

# Verificar si se está ejecutando como root
if [ "$EUID" -eq 0 ]; then
    log_error "No ejecutes este script como root"
    exit 1
fi

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    log_error "Docker no está corriendo. Por favor, inicia Docker."
    exit 1
fi

# Verificar si está en el directorio correcto
if [ ! -f "docker-compose.prod.yml" ]; then
    log_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

# Ejecutar función principal
main "$@"
