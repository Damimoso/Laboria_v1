// =============================================
// SISTEMA DE DISEÑO UNIFICADO LABORIA
// =============================================

class LaboriaUISystem {
    constructor() {
        this.themes = {
            admin_master: {
                primary: '#667eea',
                secondary: '#764ba2',
                accent: '#5a67d8',
                success: '#48bb78',
                warning: '#ed8936',
                danger: '#f56565',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                cardBg: 'rgba(255, 255, 255, 0.95)',
                textPrimary: '#2d3748',
                textSecondary: '#718096'
            },
            administrador: {
                primary: '#f59e0b',
                secondary: '#d97706',
                accent: '#ed8936',
                success: '#48bb78',
                warning: '#ed8936',
                danger: '#f56565',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                cardBg: 'rgba(255, 255, 255, 0.95)',
                textPrimary: '#2d3748',
                textSecondary: '#718096'
            },
            usuario: {
                primary: '#10b981',
                secondary: '#059669',
                accent: '#059669',
                success: '#48bb78',
                warning: '#ed8936',
                danger: '#f56565',
                gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                cardBg: 'rgba(255, 255, 255, 0.95)',
                textPrimary: '#2d3748',
                textSecondary: '#718096'
            }
        };
        
        this.darkThemes = {
            admin_master: {
                primary: '#667eea',
                secondary: '#764ba2',
                accent: '#5a67d8',
                success: '#48bb78',
                warning: '#ed8936',
                danger: '#f56565',
                gradient: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                cardBg: 'rgba(45, 55, 72, 0.95)',
                textPrimary: '#f7fafc',
                textSecondary: '#cbd5e0'
            },
            administrador: {
                primary: '#f59e0b',
                secondary: '#d97706',
                accent: '#ed8936',
                success: '#48bb78',
                warning: '#ed8936',
                danger: '#f56565',
                gradient: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                cardBg: 'rgba(45, 55, 72, 0.95)',
                textPrimary: '#f7fafc',
                textSecondary: '#cbd5e0'
            },
            usuario: {
                primary: '#10b981',
                secondary: '#059669',
                accent: '#059669',
                success: '#48bb78',
                warning: '#ed8936',
                danger: '#f56565',
                gradient: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                cardBg: 'rgba(45, 55, 72, 0.95)',
                textPrimary: '#f7fafc',
                textSecondary: '#cbd5e0'
            }
        };
        
        this.currentTheme = null;
        this.isDarkMode = false;
        this.baseStyles = this.getBaseStyles();
    }

    // Obtener tema según rol y modo
    getTheme(role, darkMode = false) {
        const themes = darkMode ? this.darkThemes : this.themes;
        return themes[role] || themes.usuario;
    }

    // Aplicar tema a la página
    applyTheme(role, darkMode = false) {
        this.currentTheme = this.getTheme(role, darkMode);
        this.isDarkMode = darkMode;
        this.injectStyles();
        this.updateElements();
        this.createThemeToggle();
        console.log(`🎨 Tema aplicado para rol: ${role}, modo: ${darkMode ? 'oscuro' : 'claro'}`, this.currentTheme);
    }

    // Crear toggle de tema
    createThemeToggle() {
        // Eliminar toggle existente
        const existingToggle = document.getElementById('theme-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }

        // Crear nuevo toggle
        const toggle = document.createElement('button');
        toggle.id = 'theme-toggle';
        toggle.className = 'theme-toggle';
        toggle.innerHTML = this.isDarkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
        toggle.onclick = () => this.toggleTheme();
        
        // Estilos del toggle
        toggle.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--theme-primary);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(toggle);
    }

    // Toggle tema
    toggleTheme() {
        const role = window.LaboriaAPI?.usuarioActual?.rol || 'usuario';
        this.applyTheme(role, !this.isDarkMode);
        
        // Guardar preferencia
        localStorage.setItem('laboria-dark-mode', this.isDarkMode);
    }

    // Obtener estilos base
    getBaseStyles() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: var(--theme-gradient);
                min-height: 100vh;
                color: var(--theme-text-primary);
                line-height: 1.6;
                transition: background 0.3s ease, color 0.3s ease;
            }
            
            .header {
                background: var(--theme-card-bg);
                backdrop-filter: blur(10px);
                padding: 1rem 2rem;
                box-shadow: 0 2px 20px rgba(0,0,0,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: sticky;
                top: 0;
                z-index: 1000;
                border-bottom: 2px solid var(--theme-primary);
                transition: background 0.3s ease;
            }
            
            .logo {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .logo i {
                font-size: 2rem;
                color: var(--theme-primary);
                transition: transform 0.3s ease;
            }
            
            .logo:hover i {
                transform: scale(1.1);
            }
            
            .logo h1 {
                color: var(--theme-text-primary);
                font-size: 1.5rem;
                font-weight: 700;
            }
            
            .user-menu {
                display: flex;
                align-items: center;
                gap: 1.5rem;
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-weight: 500;
                color: var(--theme-text-primary);
            }
            
            .logout-btn {
                background: var(--theme-danger);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 500;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .logout-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(245, 101, 101, 0.3);
            }
            
            .main-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 2rem;
            }
            
            .welcome-section {
                background: var(--theme-card-bg);
                backdrop-filter: blur(10px);
                padding: 3rem;
                border-radius: 20px;
                text-align: center;
                margin-bottom: 3rem;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                border-left: 5px solid var(--theme-primary);
                transition: background 0.3s ease;
            }
            
            .welcome-title {
                font-size: 3rem;
                font-weight: 700;
                color: var(--theme-primary);
                margin-bottom: 1rem;
                line-height: 1.2;
            }
            
            .welcome-subtitle {
                font-size: 1.3rem;
                color: var(--theme-text-secondary);
                margin-bottom: 2rem;
            }
            
            .actions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                margin-top: 3rem;
            }
            
            .action-card {
                background: var(--theme-card-bg);
                backdrop-filter: blur(10px);
                padding: 2rem;
                border-radius: 15px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                border: 2px solid transparent;
            }
            
            .action-card:hover {
                transform: translateY(-10px);
                box-shadow: 0 15px 40px rgba(0,0,0,0.15);
                border-color: var(--theme-primary);
            }
            
            .action-icon {
                font-size: 3rem;
                color: var(--theme-primary);
                margin-bottom: 1rem;
                transition: transform 0.3s ease;
            }
            
            .action-card:hover .action-icon {
                transform: scale(1.1);
            }
            
            .action-title {
                font-size: 1.5rem;
                font-weight: 600;
                color: var(--theme-text-primary);
                margin-bottom: 0.5rem;
            }
            
            .action-description {
                color: var(--theme-text-secondary);
                line-height: 1.6;
            }
            
            .stats-container {
                background: var(--theme-card-bg);
                backdrop-filter: blur(10px);
                padding: 2rem;
                border-radius: 15px;
                margin-top: 3rem;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                transition: background 0.3s ease;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 2rem;
                margin-top: 1.5rem;
            }
            
            .stat-item {
                text-align: center;
                padding: 1.5rem;
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: background 0.3s ease;
            }
            
            .stat-number {
                font-size: 2.5rem;
                font-weight: bold;
                color: var(--theme-primary);
                margin-bottom: 0.5rem;
            }
            
            .stat-label {
                color: var(--theme-text-secondary);
                font-size: 1.1rem;
                font-weight: 500;
            }
            
            .badge {
                display: inline-block;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .badge-admin-master {
                background: var(--theme-primary);
                color: white;
            }
            
            .badge-admin {
                background: var(--theme-primary);
                color: white;
            }
            
            .badge-user {
                background: var(--theme-primary);
                color: white;
            }
            
            .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
                font-weight: 500;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                text-decoration: none;
            }
            
            .btn-primary {
                background: var(--theme-primary);
                color: white;
            }
            
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .btn-secondary {
                background: var(--theme-secondary);
                color: white;
            }
            
            .btn-success {
                background: var(--theme-success);
                color: white;
            }
            
            .btn-warning {
                background: var(--theme-warning);
                color: white;
            }
            
            .btn-danger {
                background: var(--theme-danger);
                color: white;
            }
            
            /* Loading States */
            .loading {
                opacity: 0.6;
                pointer-events: none;
            }
            
            .spinner {
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top: 3px solid white;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
                display: inline-block;
                margin: 0 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Mobile-First Responsive Design */
            @media (max-width: 1200px) {
                .main-container {
                    padding: 1.5rem;
                }
                
                .welcome-title {
                    font-size: 2.5rem;
                }
                
                .actions-grid {
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                }
            }
            
            @media (max-width: 992px) {
                .header {
                    padding: 0.75rem 1.5rem;
                }
                
                .logo h1 {
                    font-size: 1.3rem;
                }
                
                .welcome-title {
                    font-size: 2.2rem;
                }
                
                .welcome-subtitle {
                    font-size: 1.1rem;
                }
                
                .stats-grid {
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 1.5rem;
                }
            }
            
            @media (max-width: 768px) {
                .header {
                    flex-direction: column;
                    gap: 1rem;
                    padding: 1rem;
                    text-align: center;
                }
                
                .user-menu {
                    flex-direction: column;
                    gap: 0.75rem;
                    width: 100%;
                }
                
                .user-info {
                    justify-content: center;
                }
                
                .logout-btn {
                    width: 100%;
                    justify-content: center;
                }
                
                .main-container {
                    padding: 1rem;
                }
                
                .welcome-section {
                    padding: 2rem 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .welcome-title {
                    font-size: 2rem;
                    line-height: 1.1;
                }
                
                .welcome-subtitle {
                    font-size: 1rem;
                    margin-bottom: 1.5rem;
                }
                
                .actions-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                    margin-top: 2rem;
                }
                
                .action-card {
                    padding: 1.5rem;
                }
                
                .action-icon {
                    font-size: 2.5rem;
                }
                
                .action-title {
                    font-size: 1.3rem;
                }
                
                .action-description {
                    font-size: 0.9rem;
                }
                
                .stats-container {
                    padding: 1.5rem;
                    margin-top: 2rem;
                }
                
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin-top: 1rem;
                }
                
                .stat-item {
                    padding: 1rem;
                }
                
                .stat-number {
                    font-size: 2rem;
                }
                
                .stat-label {
                    font-size: 0.9rem;
                }
                
                .theme-toggle {
                    bottom: 15px;
                    right: 15px;
                    width: 45px;
                    height: 45px;
                    font-size: 1rem;
                }
            }
            
            @media (max-width: 480px) {
                .header {
                    padding: 0.75rem;
                }
                
                .logo i {
                    font-size: 1.5rem;
                }
                
                .logo h1 {
                    font-size: 1.1rem;
                }
                
                .welcome-section {
                    padding: 1.5rem 1rem;
                }
                
                .welcome-title {
                    font-size: 1.8rem;
                }
                
                .action-card {
                    padding: 1rem;
                }
                
                .action-icon {
                    font-size: 2rem;
                    margin-bottom: 0.75rem;
                }
                
                .action-title {
                    font-size: 1.2rem;
                }
                
                .action-description {
                    font-size: 0.85rem;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                    gap: 0.75rem;
                }
                
                .stat-item {
                    padding: 0.75rem;
                }
                
                .stat-number {
                    font-size: 1.8rem;
                }
                
                .stat-label {
                    font-size: 0.8rem;
                }
                
                .theme-toggle {
                    bottom: 10px;
                    right: 10px;
                    width: 40px;
                    height: 40px;
                    font-size: 0.9rem;
                }
                
                .btn {
                    padding: 0.6rem 1.2rem;
                    font-size: 0.9rem;
                }
                
                .logout-btn {
                    padding: 0.6rem 1rem;
                    font-size: 0.85rem;
                }
            }
            
            /* Animaciones */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes slideIn {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .fade-in {
                animation: fadeIn 0.6s ease-out;
            }
            
            .slide-in {
                animation: slideIn 0.4s ease-out;
            }
            
            .pulse {
                animation: pulse 2s infinite;
            }
        `;
    }

    // Inyectar estilos CSS
    injectStyles() {
        if (!document.getElementById('laboria-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'laboria-ui-styles';
            style.textContent = this.baseStyles;
            document.head.appendChild(style);
        }

        // Aplicar variables CSS del tema
        const root = document.documentElement;
        Object.keys(this.currentTheme).forEach(key => {
            const cssVar = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            root.style.setProperty(cssVar, this.currentTheme[key]);
        });
    }

    // Actualizar elementos existentes
    updateElements() {
        // Actualizar colores de iconos
        const icons = document.querySelectorAll('.logo i, .action-icon, .stat-number');
        icons.forEach(icon => {
            icon.style.color = 'var(--theme-primary)';
        });

        // Actualizar badges
        const badges = document.querySelectorAll('.badge');
        badges.forEach(badge => {
            if (badge.classList.contains('badge-admin-master') || 
                badge.classList.contains('badge-admin') || 
                badge.classList.contains('badge-user')) {
                badge.style.background = 'var(--theme-primary)';
            }
        });

        // Agregar animaciones
        const cards = document.querySelectorAll('.action-card, .welcome-section, .stats-container');
        cards.forEach((card, index) => {
            card.classList.add('fade-in');
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    // Crear componente de notificación
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `laboria-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        const styles = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--theme-${type});
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 500;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        notification.style.cssText = styles;
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Inicializar sistema
    init() {
        // Detectar rol del usuario
        if (window.LaboriaAPI?.usuarioActual?.rol) {
            const role = window.LaboriaAPI.usuarioActual.rol;
            const savedDarkMode = localStorage.getItem('laboria-dark-mode') === 'true';
            this.applyTheme(role, savedDarkMode);
        }
        
        // Reemplazar sistema de notificaciones
        if (window.LaboriaAPI) {
            window.LaboriaAPI.showNotification = (message, type) => {
                this.showNotification(message, type);
            };
        }
        
        console.log('🎨 Sistema UI/UX Laboria inicializado');
    }
}

// Instancia global
window.LaboriaUI = new LaboriaUISystem();

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.LaboriaUI.init();
    }, 100);
});
