/**
 * Sistema de Calificaciones y Reviews
 * Proporciona gestión completa de evaluaciones con moderación y analytics
 */

class ReviewSystem {
    constructor() {
        this.config = this.initializeConfig();
        this.state = {
            reviews: [],
            stats: {},
            userReviews: [],
            moderationQueue: []
        };
        this.eventListeners = new Map();
        this.init();
    }

    /**
     * Inicializar el sistema de reviews
     */
    init() {
        console.log('⭐ Inicializando Sistema de Reviews...');
        
        // Verificar autenticación
        if (!window.LaboriaAPI?.isAuthenticated()) {
            console.warn('⚠️ Usuario no autenticado');
            return;
        }
        
        // Configurar estado inicial
        this.setupInitialState();
        
        // Configurar listeners de eventos
        this.setupEventListeners();
        
        // Cargar datos iniciales
        this.loadInitialData();
        
        console.log('✅ Sistema de Reviews inicializado');
    }

    /**
     * Inicializar configuración
     */
    initializeConfig() {
        return {
            // Configuración de reviews
            reviews: {
                minLength: 10,
                maxLength: 2000,
                minTitleLength: 5,
                maxTitleLength: 100,
                allowedTargets: ['company', 'job', 'user', 'platform'],
                ratingRange: [1, 2, 3, 4, 5],
                autoModeration: true,
                requireApproval: false
            },
            
            // Configuración de moderación
            moderation: {
                enabled: true,
                autoApprove: false,
                flaggedWords: [
                    'spam', 'scam', 'fraud', 'fake', 'bot',
                    'odio', 'hate', 'racista', 'discriminacion',
                    'inapropiado', 'ofensivo', 'vulgar'
                ],
                maxReports: 3,
                reportReasons: [
                    'spam', 'inapropiado', 'falso', 'ofensivo',
                    'discriminacion', 'violencia', 'otro'
                ]
            },
            
            // Configuración de analytics
            analytics: {
                enabled: true,
                trackViews: true,
                trackInteractions: true,
                trackSentiment: true,
                updateInterval: 30000 // 30 segundos
            },
            
            // Configuración de notificaciones
            notifications: {
                newReview: true,
                reviewApproved: true,
                reviewRejected: true,
                reviewReported: true,
                helpfulThreshold: 5
            }
        };
    }

    /**
     * Configurar estado inicial
     */
    setupInitialState() {
        this.state.userId = window.LaboriaAPI.usuarioActual.id;
        this.state.userName = window.LaboriaAPI.usuarioActual.nombre || 
                               window.LaboriaAPI.usuarioActual.username;
        this.state.userRole = window.LaboriaAPI.usuarioActual.rol;
    }

    /**
     * Configurar listeners de eventos
     */
    setupEventListeners() {
        // Listener de visibilidad
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.syncData();
            }
        });
        
        // Listener de focus
        window.addEventListener('focus', () => {
            this.syncData();
        });
        
        // Listener de online/offline
        window.addEventListener('online', () => {
            this.syncData();
        });
    }

    /**
     * Cargar datos iniciales
     */
    async loadInitialData() {
        try {
            // Cargar estadísticas
            await this.loadStats();
            
            // Cargar reviews del usuario
            await this.loadUserReviews();
            
            // Cargar reviews públicas
            await this.loadPublicReviews();
            
        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
        }
    }

    /**
     * Cargar estadísticas
     */
    async loadStats() {
        try {
            const response = await fetch(`/api/reviews/stats`);
            const data = await response.json();
            
            if (data.success) {
                this.state.stats = data.stats;
                this.emit('statsLoaded', this.state.stats);
            }
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
        }
    }

    /**
     * Cargar reviews del usuario
     */
    async loadUserReviews() {
        try {
            const response = await fetch(`/api/reviews/user/${this.state.userId}`);
            const data = await response.json();
            
            if (data.success) {
                this.state.userReviews = data.reviews;
                this.emit('userReviewsLoaded', this.state.userReviews);
            }
        } catch (error) {
            console.error('❌ Error cargando reviews del usuario:', error);
        }
    }

    /**
     * Cargar reviews públicas
     */
    async loadPublicReviews(filters = {}) {
        try {
            const params = new URLSearchParams({
                ...filters,
                page: filters.page || 1,
                limit: filters.limit || 20
            });
            
            const response = await fetch(`/api/reviews?${params}`);
            const data = await response.json();
            
            if (data.success) {
                if (filters.page === 1) {
                    this.state.reviews = data.reviews;
                } else {
                    this.state.reviews.push(...data.reviews);
                }
                
                this.emit('publicReviewsLoaded', {
                    reviews: data.reviews,
                    page: filters.page || 1,
                    totalPages: data.totalPages,
                    hasMore: data.hasMore
                });
            }
        } catch (error) {
            console.error('❌ Error cargando reviews públicas:', error);
        }
    }

    /**
     * Crear nueva review
     */
    async createReview(reviewData) {
        try {
            // Validar datos
            const validation = this.validateReviewData(reviewData);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }
            
            // Preparar datos para enviar
            const processedData = {
                ...reviewData,
                userId: this.state.userId,
                userName: this.state.userName,
                userRole: this.state.userRole,
                createdAt: new Date().toISOString(),
                status: 'pending',
                helpfulCount: 0,
                reports: [],
                sentiment: this.analyzeSentiment(reviewData.content),
                moderated: false
            };
            
            // Enviar a servidor
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(processedData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                const newReview = { ...processedData, ...data.review };
                
                // Agregar a estado local
                this.state.userReviews.unshift(newReview);
                this.state.reviews.unshift(newReview);
                
                // Actualizar estadísticas
                this.updateLocalStats(newReview, 'created');
                
                // Disparar eventos
                this.emit('reviewCreated', newReview);
                this.emit('statsUpdated', this.state.stats);
                
                // Notificar si aplica
                if (this.config.notifications.newReview) {
                    this.notifyNewReview(newReview);
                }
                
                // Enviar a moderación si aplica
                if (this.config.reviews.autoModeration) {
                    await this.submitForModeration(newReview);
                }
                
                return newReview;
            } else {
                throw new Error(data.message || 'Error creando review');
            }
            
        } catch (error) {
            console.error('❌ Error creando review:', error);
            this.emit('reviewError', { error, data: reviewData });
            throw error;
        }
    }

    /**
     * Actualizar review existente
     */
    async updateReview(reviewId, updateData) {
        try {
            // Validar permisos
            const review = this.state.userReviews.find(r => r.id === reviewId);
            if (!review || review.userId !== this.state.userId) {
                throw new Error('No tienes permiso para editar esta review');
            }
            
            // Validar datos
            const validation = this.validateUpdateData(updateData);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }
            
            // Preparar datos para enviar
            const processedData = {
                ...updateData,
                updatedAt: new Date().toISOString(),
                sentiment: updateData.content ? this.analyzeSentiment(updateData.content) : review.sentiment
            };
            
            // Enviar a servidor
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(processedData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Actualizar estado local
                const updatedReview = { ...review, ...data.review, ...processedData };
                
                const userIndex = this.state.userReviews.findIndex(r => r.id === reviewId);
                if (userIndex > -1) {
                    this.state.userReviews[userIndex] = updatedReview;
                }
                
                const publicIndex = this.state.reviews.findIndex(r => r.id === reviewId);
                if (publicIndex > -1) {
                    this.state.reviews[publicIndex] = updatedReview;
                }
                
                // Disparar eventos
                this.emit('reviewUpdated', updatedReview);
                
                // Notificar si aplica
                if (this.config.notifications.reviewApproved) {
                    this.notifyReviewUpdated(updatedReview);
                }
                
                return updatedReview;
            } else {
                throw new Error(data.message || 'Error actualizando review');
            }
            
        } catch (error) {
            console.error('❌ Error actualizando review:', error);
            this.emit('reviewError', { error, reviewId, updateData });
            throw error;
        }
    }

    /**
     * Eliminar review
     */
    async deleteReview(reviewId) {
        try {
            // Validar permisos
            const review = this.state.userReviews.find(r => r.id === reviewId);
            if (!review || review.userId !== this.state.userId) {
                throw new Error('No tienes permiso para eliminar esta review');
            }
            
            // Enviar a servidor
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Actualizar estado local
                this.state.userReviews = this.state.userReviews.filter(r => r.id !== reviewId);
                this.state.reviews = this.state.reviews.filter(r => r.id !== reviewId);
                
                // Actualizar estadísticas
                this.updateLocalStats(review, 'deleted');
                
                // Disparar eventos
                this.emit('reviewDeleted', { reviewId, review });
                this.emit('statsUpdated', this.state.stats);
                
                return true;
            } else {
                throw new Error(data.message || 'Error eliminando review');
            }
            
        } catch (error) {
            console.error('❌ Error eliminando review:', error);
            this.emit('reviewError', { error, reviewId });
            throw error;
        }
    }

    /**
     * Marcar review como útil
     */
    async markAsHelpful(reviewId) {
        try {
            const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Actualizar estado local
                const review = this.state.reviews.find(r => r.id === reviewId);
                if (review) {
                    review.helpfulCount = (review.helpfulCount || 0) + 1;
                    review.userMarkedHelpful = true;
                    
                    // Disparar evento
                    this.emit('reviewMarkedHelpful', review);
                    
                    // Notificar si alcanza umbral
                    if (review.helpfulCount >= this.config.notifications.helpfulThreshold) {
                        this.notifyHelpfulThreshold(review);
                    }
                }
                
                return true;
            } else {
                throw new Error(data.message || 'Error marcando review como útil');
            }
            
        } catch (error) {
            console.error('❌ Error marcando review como útil:', error);
            this.emit('reviewError', { error, reviewId });
            throw error;
        }
    }

    /**
     * Reportar review
     */
    async reportReview(reviewId, reportData) {
        try {
            // Validar datos del reporte
            const validation = this.validateReportData(reportData);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }
            
            // Preparar datos para enviar
            const processedData = {
                reviewId,
                reporterId: this.state.userId,
                reporterName: this.state.userName,
                reason: reportData.reason,
                description: reportData.description,
                createdAt: new Date().toISOString()
            };
            
            // Enviar a servidor
            const response = await fetch(`/api/reviews/${reviewId}/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(processedData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Actualizar estado local
                const review = this.state.reviews.find(r => r.id === reviewId);
                if (review) {
                    review.reports = review.reports || [];
                    review.reports.push(processedData);
                    review.reportCount = (review.reportCount || 0) + 1;
                    
                    // Si hay muchos reportes, ocultar temporalmente
                    if (review.reportCount >= this.config.moderation.maxReports) {
                        review.status = 'reported';
                    }
                    
                    // Disparar evento
                    this.emit('reviewReported', { review, report: processedData });
                }
                
                // Notificar
                if (this.config.notifications.reviewReported) {
                    this.notifyReviewReported(review, processedData);
                }
                
                return true;
            } else {
                throw new Error(data.message || 'Error reportando review');
            }
            
        } catch (error) {
            console.error('❌ Error reportando review:', error);
            this.emit('reviewError', { error, reviewId, reportData });
            throw error;
        }
    }

    /**
     * Validar datos de review
     */
    validateReviewData(data) {
        const { reviews } = this.config;
        
        // Validar target
        if (!reviews.allowedTargets.includes(data.target)) {
            return {
                isValid: false,
                message: 'Target no válido'
            };
        }
        
        // Validar título
        if (data.title && data.title.length < reviews.minTitleLength) {
            return {
                isValid: false,
                message: `El título debe tener al menos ${reviews.minTitleLength} caracteres`
            };
        }
        
        if (data.title && data.title.length > reviews.maxTitleLength) {
            return {
                isValid: false,
                message: `El título no puede exceder ${reviews.maxTitleLength} caracteres`
            };
        }
        
        // Validar contenido
        if (data.content && data.content.length < reviews.minLength) {
            return {
                isValid: false,
                message: `El contenido debe tener al menos ${reviews.minLength} caracteres`
            };
        }
        
        if (data.content && data.content.length > reviews.maxLength) {
            return {
                isValid: false,
                message: `El contenido no puede exceder ${reviews.maxLength} caracteres`
            };
        }
        
        // Validar calificación
        if (data.rating && !reviews.ratingRange.includes(data.rating)) {
            return {
                isValid: false,
                message: 'La calificación debe estar entre 1 y 5 estrellas'
            };
        }
        
        // Validar palabras prohibidas
        if (this.containsFlaggedWords(data.title + ' ' + data.content)) {
            return {
                isValid: false,
                message: 'El contenido contiene palabras no permitidas'
            };
        }
        
        return { isValid: true };
    }

    /**
     * Validar datos de actualización
     */
    validateUpdateData(data) {
        const { reviews } = this.config;
        
        // Validar título
        if (data.title && data.title.length < reviews.minTitleLength) {
            return {
                isValid: false,
                message: `El título debe tener al menos ${reviews.minTitleLength} caracteres`
            };
        }
        
        if (data.title && data.title.length > reviews.maxTitleLength) {
            return {
                isValid: false,
                message: `El título no puede exceder ${reviews.maxTitleLength} caracteres`
            };
        }
        
        // Validar contenido
        if (data.content && data.content.length < reviews.minLength) {
            return {
                isValid: false,
                message: `El contenido debe tener al menos ${reviews.minLength} caracteres`
            };
        }
        
        if (data.content && data.content.length > reviews.maxLength) {
            return {
                isValid: false,
                message: `El contenido no puede exceder ${reviews.maxLength} caracteres`
            };
        }
        
        // Validar palabras prohibidas
        if (data.title || data.content) {
            const content = (data.title || '') + ' ' + (data.content || '');
            if (this.containsFlaggedWords(content)) {
                return {
                    isValid: false,
                    message: 'El contenido contiene palabras no permitidas'
                };
            }
        }
        
        return { isValid: true };
    }

    /**
     * Validar datos de reporte
     */
    validateReportData(data) {
        const { moderation } = this.config;
        
        // Validar razón
        if (!moderation.reportReasons.includes(data.reason)) {
            return {
                isValid: false,
                message: 'Razón de reporte no válida'
            };
        }
        
        // Validar descripción
        if (!data.description || data.description.length < 10) {
            return {
                isValid: false,
                message: 'La descripción debe tener al menos 10 caracteres'
            };
        }
        
        return { isValid: true };
    }

    /**
     * Verificar si contiene palabras marcadas
     */
    containsFlaggedWords(content) {
        const { moderation } = this.config;
        const lowerContent = content.toLowerCase();
        
        return moderation.flaggedWords.some(word => 
            lowerContent.includes(word.toLowerCase())
        );
    }

    /**
     * Analizar sentimiento
     */
    analyzeSentiment(content) {
        if (!content) return 'neutral';
        
        const positiveWords = ['excelente', 'bueno', 'genial', 'perfecto', 'increíble', 'fantástico', 'maravilloso', 'recomiendo', 'satisfecho'];
        const negativeWords = ['malo', 'terrible', 'horrible', 'pésimo', 'decepcionante', 'frustrante', 'inútil', 'no recomiendo', 'insatisfecho'];
        
        const lowerContent = content.toLowerCase();
        
        const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
        
        if (positiveCount > negativeCount) {
            return 'positive';
        } else if (negativeCount > positiveCount) {
            return 'negative';
        }
        
        return 'neutral';
    }

    /**
     * Enviar a moderación
     */
    async submitForModeration(review) {
        try {
            const moderationData = {
                reviewId: review.id,
                reason: 'auto_moderation',
                content: review.title + ' ' + review.content,
                userId: review.userId,
                createdAt: new Date().toISOString()
            };
            
            const response = await fetch('/api/reviews/moderate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(moderationData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                review.moderated = true;
                this.emit('reviewSubmittedForModeration', review);
            }
        } catch (error) {
            console.error('❌ Error enviando a moderación:', error);
        }
    }

    /**
     * Actualizar estadísticas locales
     */
    updateLocalStats(review, action) {
        const stats = this.state.stats;
        
        switch (action) {
            case 'created':
                stats.totalReviews = (stats.totalReviews || 0) + 1;
                stats.averageRating = this.calculateAverageRating(stats.totalReviews + 1, 
                    (stats.averageRating || 0) * (stats.totalReviews || 0) + review.rating);
                stats.thisMonth = (stats.thisMonth || 0) + 1;
                
                if (review.rating === 5) {
                    stats.fiveStarReviews = (stats.fiveStarReviews || 0) + 1;
                }
                break;
                
            case 'deleted':
                stats.totalReviews = Math.max(0, (stats.totalReviews || 0) - 1);
                stats.averageRating = this.calculateAverageRating(stats.totalReviews - 1, 
                    (stats.averageRating || 0) * (stats.totalReviews || 0) - review.rating);
                stats.thisMonth = Math.max(0, (stats.thisMonth || 0) - 1);
                
                if (review.rating === 5) {
                    stats.fiveStarReviews = Math.max(0, (stats.fiveStarReviews || 0) - 1);
                }
                break;
        }
        
        this.state.stats = stats;
    }

    /**
     * Calcular promedio de calificaciones
     */
    calculateAverageRating(totalReviews, totalRating) {
        if (totalReviews === 0) return 0;
        return totalRating / totalReviews;
    }

    /**
     * Sincronizar datos
     */
    async syncData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadUserReviews()
            ]);
        } catch (error) {
            console.error('❌ Error sincronizando datos:', error);
        }
    }

    /**
     * Notificar nueva review
     */
    notifyNewReview(review) {
        if (window.LaboriaPushNotifications) {
            window.LaboriaPushNotifications.sendPushNotification('new_review', {
                reviewerName: review.userName,
                target: review.target,
                rating: review.rating,
                title: review.title
            });
        }
    }

    /**
     * Notificar review actualizada
     */
    notifyReviewUpdated(review) {
        if (window.LaboriaPushNotifications) {
            window.LaboriaPushNotifications.sendPushNotification('review_approved', {
                action: 'actualizada',
                reviewId: review.id
            });
        }
    }

    /**
     * Notificar review reportada
     */
    notifyReviewReported(review, report) {
        if (window.LaboriaPushNotifications) {
            window.LaboriaPushNotifications.sendPushNotification('review_reported', {
                reviewId: review.id,
                reason: report.reason
            });
        }
    }

    /**
     * Notificar umbral de útil
     */
    notifyHelpfulThreshold(review) {
        if (window.LaboriaPushNotifications) {
            window.LaboriaPushNotifications.sendPushNotification('helpful_threshold', {
                reviewId: review.id,
                helpfulCount: review.helpfulCount
            });
        }
    }

    /**
     * Obtener reviews con filtros
     */
    async getReviews(filters = {}) {
        return await this.loadPublicReviews(filters);
    }

    /**
     * Obtener estadísticas
     */
    getStats() {
        return this.state.stats;
    }

    /**
     * Obtener reviews del usuario
     */
    getUserReviews() {
        return this.state.userReviews;
    }

    /**
     * Buscar reviews
     */
    searchReviews(query, filters = {}) {
        const searchQuery = query.toLowerCase();
        
        let filteredReviews = this.state.reviews;
        
        // Aplicar filtros existentes
        if (filters.rating) {
            filteredReviews = filteredReviews.filter(r => r.rating === parseInt(filters.rating));
        }
        
        if (filters.date) {
            const dateFilter = this.getDateFilter(filters.date);
            filteredReviews = filteredReviews.filter(r => 
                new Date(r.createdAt) >= dateFilter
            );
        }
        
        // Aplicar búsqueda
        if (searchQuery) {
            filteredReviews = filteredReviews.filter(r => 
                r.title.toLowerCase().includes(searchQuery) ||
                r.content.toLowerCase().includes(searchQuery) ||
                r.userName.toLowerCase().includes(searchQuery)
            );
        }
        
        return filteredReviews;
    }

    /**
     * Obtener filtro de fecha
     */
    getDateFilter(dateFilter) {
        const now = new Date();
        
        switch (dateFilter) {
            case 'today':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            case 'week':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            case 'month':
                return new Date(now.getFullYear(), now.getMonth(), 1);
            case 'year':
                return new Date(now.getFullYear(), 0, 1);
            default:
                return new Date(0);
        }
    }

    /**
     * Sistema de eventos
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('❌ Error en listener de evento:', error);
                }
            });
        }
    }

    /**
     * Limpiar sistema
     */
    cleanup() {
        this.state = {
            reviews: [],
            stats: {},
            userReviews: [],
            moderationQueue: []
        };
        this.eventListeners.clear();
        console.log('🧹 Sistema de reviews limpiado');
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

window.LaboriaReviews = new ReviewSystem();

console.log('⭐ Sistema de Reviews inicializado:', {
    features: [
        'Complete review management',
        'Advanced moderation system',
        'Sentiment analysis',
        'Real-time statistics',
        'User interaction tracking',
        'Automated notifications'
    ]
});

// Funciones helper globales
window.createReview = function(reviewData) {
    return window.LaboriaReviews.createReview(reviewData);
};

window.updateReview = function(reviewId, updateData) {
    return window.LaboriaReviews.updateReview(reviewId, updateData);
};

window.deleteReview = function(reviewId) {
    return window.LaboriaReviews.deleteReview(reviewId);
};

window.markReviewHelpful = function(reviewId) {
    return window.LaboriaReviews.markAsHelpful(reviewId);
};

window.reportReview = function(reviewId, reportData) {
    return window.LaboriaReviews.reportReview(reviewId, reportData);
};

window.getReviewStats = function() {
    return window.LaboriaReviews.getStats();
};

window.searchReviews = function(query, filters) {
    return window.LaboriaReviews.searchReviews(query, filters);
};
