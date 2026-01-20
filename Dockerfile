# =============================================
# DOCKERFILE - LABORIA PRODUCCIÓN
# =============================================

# Etapa 1: Build
FROM node:18-alpine AS builder

# Configurar variables de entorno
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

# Instalar dependencias de compilación
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Crear directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Construir aplicación
RUN npm run build

# Etapa 2: Runtime
FROM node:18-alpine AS runtime

# Instalar dependencias de runtime
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Crear usuario no root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S laboria -u 1001

# Configurar variables de entorno
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=error
ENV PORT=3000
ENV HOST=0.0.0.0

# Crear directorios necesarios
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R laboria:nodejs /app

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos desde builder
COPY --from=builder --chown=laboria:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=laboria:nodejs /app/package*.json ./
COPY --from=builder --chown=laboria:nodejs /app/server.js ./
COPY --from=builder --chown=laboria:nodejs /app/server-production.js ./
COPY --from=builder --chown=laboria:nodejs /app/config ./config
COPY --from=builder --chown=laboria:nodejs /app/routes ./routes
COPY --from=builder --chown=laboria:nodejs /app/middleware ./middleware
COPY --from=builder --chown=laboria:nodejs /app/websocket ./websocket
COPY --from=builder --chown=laboria:nodejs /app/docs ./docs

# Copiar frontend build si existe
COPY --from=builder --chown=laboria:nodejs /app/frontend/build ./frontend/build

# Cambiar al usuario no root
USER laboria

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Iniciar aplicación con dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server-production.js"]
