/**
 * Sistema de Navegación Unificado para Laboria
 * Gestiona la navegación entre páginas según el rol del usuario
 */

class NavigationSystem {
    constructor() {
        this.currentPage = this.getCurrentPageName();
        this.userRole = null;
        this.userData = null;
        this.navigationRoutes = this.initializeRoutes();
        this.init();
    }

    /**
     * Inicializar el sistema de navegación
     */
    async init() {
        console.log('🧭 Inicializando Sistema de Navegación...');
        
        // Esperar a que cargue el API
        await this.waitForAPI();
        
        // Cargar datos del usuario
        await this.loadUserData();
        
        // Configurar navegación según rol
        this.setupNavigation();
        
        // Actualizar UI
        this.updateNavigationUI();
        
        console.log('✅ Sistema de Navegación inicializado');
    }

    /**
     * Esperar a que LaboriaAPI esté disponible
     */
    async waitForAPI() {
        let attempts = 0;
        while (!window.LaboriaAPI && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.LaboriaAPI) {
            console.error('❌ LaboriaAPI no encontrado');
            return false;
        }
        return true;
    }

    /**
     * Cargar datos del usuario actual
     */
    async loadUserData() {
        try {
            if (window.LaboriaAPI?.isAuthenticated()) {
                this.userData = window.LaboriaAPI.usuarioActual;
                this.userRole = this.userData?.rol || 'usuario';
                console.log(`👤 Usuario cargado: ${this.userRole}`);
            } else {
                this.userRole = 'guest';
                console.log('👤 Usuario no autenticado');
            }
        } catch (error) {
            console.error('❌ Error cargando datos del usuario:', error);
            this.userRole = 'guest';
        }
    }

    /**
     * Inicializar rutas de navegación según rol
     */
    initializeRoutes() {
        return {
            guest: {
                login: '../pages/index.html',
                register: '../pages/register.html'
            },
            usuario: {
                dashboard: '../usuario/perfil.html',
                profile: '../usuario/perfil.html',
                jobs: '../pages/jobs.html',
                courses: '../pages/courses.html',
                applications: '../pages/applications.html'
            },
            administrador: {
                dashboard: '../pages/admin-invitado/Inicio-Invi-Admin.html',
                users: '../pages/admin-invitado/users.html',
                jobs: '../pages/admin-invitado/jobs.html',
                courses: '../pages/admin-invitado/courses.html',
                reports: '../pages/admin-invitado/reports.html'
            },
            administrador_master: {
                dashboard: '../pages/admin-master/InicioAdmin.html',
                users: '../pages/admin-master/usuarios.html',
                jobs: '../pages/admin-master/empleos.html',
                courses: '../pages/admin-master/cursos.html',
                analytics: '../pages/admin-master/analisis.html',
                settings: '../pages/admin-master/ajustes.html',
                admins: '../pages/admin-master/admins.html'
            }
        };
    }

    /**
     * Configurar navegación según rol actual
     */
    setupNavigation() {
        const routes = this.navigationRoutes[this.userRole];
        
        if (!routes) {
            console.warn(`⚠️ No hay rutas definidas para el rol: ${this.userRole}`);
            return;
        }

        // Actualizar enlaces de navegación
        this.updateNavigationLinks(routes);
        
        // Configurar menú de usuario
        this.setupUserMenu(routes);
        
        // Configurar breadcrumbs
        this.setupBreadcrumbs();
    }

    /**
     * Actualizar enlaces de navegación
     */
    updateNavigationLinks(routes) {
        // Actualizar navegación principal
        const mainNav = document.querySelector('.main-nav, .nav, .navigation');
        if (mainNav) {
            this.updateNavigationElement(mainNav, routes);
        }

        // Actualizar sidebar
        const sidebar = document.querySelector('.sidebar, .admin-sidebar');
        if (sidebar) {
            this.updateNavigationElement(sidebar, routes);
        }

        // Actualizar menú móvil
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav) {
            this.updateNavigationElement(mobileNav, routes);
        }
    }

    /**
     * Actualizar elemento de navegación específico
     */
    updateNavigationElement(navElement, routes) {
        const links = navElement.querySelectorAll('a[href]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            const routeKey = this.getRouteKeyFromHref(href);
            
            if (routeKey && routes[routeKey]) {
                link.setAttribute('href', routes[routeKey]);
                link.classList.remove('hidden', 'disabled');
                
                // Marcar enlace activo
                if (routes[routeKey] === window.location.pathname) {
                    link.classList.add('active');
                }
            } else if (routeKey && !routes[routeKey]) {
                // Ocultar enlaces no disponibles para este rol
                link.classList.add('hidden');
            }
        });
    }

    /**
     * Obtener clave de ruta desde href
     */
    getRouteKeyFromHref(href) {
        const routeMap = {
            'perfil.html': 'profile',
            'InicioAdmin.html': 'dashboard',
            'Inicio-Invi-Admin.html': 'dashboard',
            'usuarios.html': 'users',
            'empleos.html': 'jobs',
            'cursos.html': 'courses',
            'analisis.html': 'analytics',
            'ajustes.html': 'settings',
            'admins.html': 'admins',
            'jobs.html': 'jobs',
            'courses.html': 'courses',
            'applications.html': 'applications',
            'reports.html': 'reports'
        };

        for (const [key, value] of Object.entries(routeMap)) {
            if (href.includes(key)) {
                return value;
            }
        }
        
        return null;
    }

    /**
     * Configurar menú de usuario
     */
    setupUserMenu(routes) {
        const userMenu = document.querySelector('.user-menu, .admin-actions');
        if (!userMenu) return;

        // Actualizar información del usuario
        const userName = userMenu.querySelector('#userName, .user-name');
        if (userName && this.userData) {
            userName.textContent = this.userData.nombre || 'Usuario';
        }

        // Configurar acciones según rol
        this.setupUserActions(userMenu, routes);
    }

    /**
     * Configurar acciones de usuario
     */
    setupUserActions(userMenu, routes) {
        // Logout
        const logoutBtn = userMenu.querySelector('[onclick*="logout"], .logout-btn');
        if (logoutBtn) {
            logoutBtn.setAttribute('onclick', 'navigationSystem.handleLogout()');
        }

        // Perfil
        const profileBtn = userMenu.querySelector('[onclick*="profile"], .profile-btn');
        if (profileBtn && routes.profile) {
            profileBtn.setAttribute('onclick', `navigationSystem.navigateTo('${routes.profile}')`);
        }

        // Dashboard
        const dashboardBtn = userMenu.querySelector('[onclick*="dashboard"], .dashboard-btn');
        if (dashboardBtn && routes.dashboard) {
            dashboardBtn.setAttribute('onclick', `navigationSystem.navigateTo('${routes.dashboard}')`);
        }
    }

    /**
     * Configurar breadcrumbs
     */
    setupBreadcrumbs() {
        const breadcrumbContainer = document.querySelector('.breadcrumbs, .breadcrumb');
        if (!breadcrumbContainer) return;

        const breadcrumbs = this.generateBreadcrumbs();
        breadcrumbContainer.innerHTML = breadcrumbs.map((crumb, index) => `
            <li class="breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}">
                ${crumb.url ? `<a href="${crumb.url}">${crumb.label}</a>` : crumb.label}
            </li>
        `).join('');
    }

    /**
     * Generar breadcrumbs según página actual
     */
    generateBreadcrumbs() {
        const routes = this.navigationRoutes[this.userRole];
        const breadcrumbs = [
            { label: 'Inicio', url: routes.dashboard || '../pages/index.html' }
        ];

        // Agregar breadcrumb específico de página
        const pageName = this.getCurrentPageName();
        const pageMap = {
            'InicioAdmin': 'Panel Admin',
            'Inicio-Invi-Admin': 'Panel Admin',
            'perfil': 'Mi Perfil',
            'usuarios': 'Usuarios',
            'empleos': 'Empleos',
            'cursos': 'Cursos',
            'analisis': 'Análisis',
            'ajustes': 'Ajustes',
            'admins': 'Administradores'
        };

        if (pageMap[pageName]) {
            breadcrumbs.push({ label: pageMap[pageName] });
        }

        return breadcrumbs;
    }

    /**
     * Actualizar UI de navegación
     */
    updateNavigationUI() {
        // Actualizar branding
        this.updateBranding();
        
        // Actualizar tema
        this.updateTheme();
        
        // Actualizar notificaciones
        this.updateNotifications();
    }

    /**
     * Actualizar branding según rol
     */
    updateBranding() {
        const brandElements = document.querySelectorAll('.brand, .admin-brand');
        
        brandElements.forEach(element => {
            const brandName = this.getBrandName();
            const brandIcon = element.querySelector('i');
            
            if (brandIcon) {
                brandIcon.className = this.getBrandIcon();
            }
            
            const brandText = element.querySelector('span');
            if (brandText) {
                brandText.textContent = brandName;
            }
        });
    }

    /**
     * Obtener nombre de marca según rol
     */
    getBrandName() {
        const brandNames = {
            administrador_master: 'Laboria Admin Master',
            administrador: 'Laboria Admin',
            usuario: 'Laboria',
            guest: 'Laboria'
        };
        
        return brandNames[this.userRole] || 'Laboria';
    }

    /**
     * Obtener icono de marca según rol
     */
    getBrandIcon() {
        const iconMap = {
            administrador_master: 'fas fa-shield-alt',
            administrador: 'fas fa-user-shield',
            usuario: 'fas fa-briefcase',
            guest: 'fas fa-rocket'
        };
        
        return iconMap[this.userRole] || 'fas fa-briefcase';
    }

    /**
     * Actualizar tema
     */
    updateTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.toggle('dark-theme', savedTheme === 'dark');
        
        const themeIcon = document.querySelector('#themeIcon, .theme-icon i');
        if (themeIcon) {
            themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    /**
     * Actualizar notificaciones
     */
    updateNotifications() {
        const notificationBadge = document.querySelector('#notificationBadge, .notification-badge');
        if (notificationBadge && window.LaboriaAPI) {
            // Simular conteo de notificaciones
            const count = Math.floor(Math.random() * 5);
            notificationBadge.textContent = count;
            notificationBadge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    /**
     * Navegar a página específica
     */
    async navigateTo(url) {
        try {
            console.log(`🧭 Navegando a: ${url}`);
            
            // Mostrar loading
            if (window.LaboriaAPI?.showLoading) {
                window.LaboriaAPI.showLoading();
            }
            
            // Pequeña pausa para animación
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Navegar
            window.location.href = url;
        } catch (error) {
            console.error('❌ Error en navegación:', error);
            if (window.LaboriaAPI?.showNotification) {
                window.LaboriaAPI.showNotification('Error al navegar', 'error');
            }
        }
    }

    /**
     * Manejar logout
     */
    async handleLogout() {
        try {
            console.log('🚪 Cerrando sesión...');
            
            // Forzar limpieza completa de localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('tokenSesion');
            localStorage.removeItem('tokenJWT');
            localStorage.clear();
            
            // Limpiar API client si existe
            if (window.LaboriaAPI) {
                window.LaboriaAPI.clearAuthTokens();
            }
            
            console.log('🔓 Sesión cerrada, redirigiendo al login...');
            
            // Forzar redirección al login
            window.location.href = '../pages/index.html';
            
        } catch (error) {
            console.error('❌ Error en logout:', error);
            // Forzar limpieza y redirección en caso de error
            localStorage.clear();
            window.location.href = '../pages/index.html';
        }
    }

    /**
     * Alternar tema
     */
    toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        localStorage.setItem('theme', newTheme);
        document.body.classList.toggle('dark-theme', newTheme === 'dark');
        
        const themeIcon = document.querySelector('#themeIcon, .theme-icon i');
        if (themeIcon) {
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        if (window.LaboriaAPI?.showNotification) {
            window.LaboriaAPI.showNotification(`Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'success');
        }
    }

    /**
     * Mostrar notificaciones
     */
    toggleNotifications() {
        if (window.LaboriaAPI?.showNotification) {
            window.LaboriaAPI.showNotification('Centro de notificaciones en desarrollo', 'info');
        }
    }

    /**
     * Alternar menú de usuario
     */
    toggleUserMenu() {
        if (window.LaboriaAPI?.showNotification) {
            window.LaboriaAPI.showNotification('Menú de usuario en desarrollo', 'info');
        }
    }

    /**
     * Obtener nombre de página actual
     */
    getCurrentPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        const nameWithoutExt = filename.replace('.html', '');
        return nameWithoutExt || 'index';
    }

    /**
     * Verificar acceso a página
     */
    hasPageAccess(pageName) {
        const routes = this.navigationRoutes[this.userRole];
        if (!routes) return false;
        
        return Object.values(routes).some(route => route.includes(pageName));
    }

    /**
     * Redirigir según rol si es necesario
     */
    async redirectByRole() {
        if (!this.userRole || this.userRole === 'guest') {
            return; // No redirigir usuarios no autenticados
        }

        const routes = this.navigationRoutes[this.userRole];
        if (!routes) return;

        // Verificar si la página actual es accesible
        const currentPageName = this.getCurrentPageName();
        
        if (!this.hasPageAccess(currentPageName)) {
            console.log(`🚫 Acceso denegado a ${currentPageName}, redirigiendo a dashboard...`);
            await this.navigateTo(routes.dashboard);
            return false;
        }

        return true;
    }
}

// Funciones globales para acceso desde HTML
function navigateToPage(page) {
    if (window.navigationSystem) {
        window.navigationSystem.navigateTo(page);
    }
}

function toggleTheme() {
    if (window.navigationSystem) {
        window.navigationSystem.toggleTheme();
    }
}

function toggleNotifications() {
    if (window.navigationSystem) {
        window.navigationSystem.toggleNotifications();
    }
}

function toggleUserMenu() {
    if (window.navigationSystem) {
        window.navigationSystem.toggleUserMenu();
    }
}

function handleLogout() {
    try {
        if (window.navigationSystem) {
            window.navigationSystem.handleLogout();
        } else {
            console.warn('⚠️ Navigation system no disponible');
            // Fallback: limpiar localStorage y redirigir
            localStorage.clear();
            window.location.href = '../pages/index.html';
        }
    } catch (error) {
        console.error('❌ Error en handleLogout global:', error);
        // Fallback de emergencia
        localStorage.clear();
        window.location.href = '../pages/index.html';
    }
}

// Inicializar sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Crear instancia global
    window.navigationSystem = new NavigationSystem();
    
    // Verificar redirección por rol
    setTimeout(() => {
        window.navigationSystem.redirectByRole();
    }, 1000);
});

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationSystem;
}
