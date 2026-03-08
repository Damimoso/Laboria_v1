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
        
        // Configurar manejo de 404
        this.setup404Handling();
        
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
     * Inicializar rutas de navegación según rol (con rutas absolutas)
     */
    initializeRoutes() {
        return {
            guest: {
                login: '/pages/index.html',
                register: '/pages/index.html#register',
                about: '/pages/about.html',
                jobs: '/pages/jobs.html',
                courses: '/pages/courses.html'
            },
            usuario: {
                dashboard: '/usuario/perfil.html',
                profile: '/usuario/perfil.html',
                jobs: '/pages/jobs.html',
                courses: '/pages/courses.html',
                applications: '/usuario/applications.html',
                settings: '/usuario/settings.html'
            },
            admin_invitado: {
                dashboard: '/pages/admin-invitado/Inicio-Invi-Admin.html',
                users: '/pages/admin-invitado/users.html',
                jobs: '/pages/admin-invitado/jobs.html',
                courses: '/pages/admin-invitado/courses.html',
                reports: '/pages/admin-invitado/reports.html'
            },
            admin_master: {
                dashboard: '/pages/admin-master/InicioAdmin.html',
                users: '/pages/admin-master/usuarios.html',
                jobs: '/pages/admin-master/empleos.html',
                courses: '/pages/admin-master/cursos.html',
                reports: '/pages/admin-master/reports.html',
                settings: '/pages/admin-master/settings.html'
            },
            recruiter: {
                dashboard: '/pages/recruiter/dashboard.html',
                jobs: '/pages/recruiter/my-jobs.html',
                candidates: '/pages/recruiter/candidates.html',
                analytics: '/pages/recruiter/analytics.html'
            },
            company: {
                dashboard: '/pages/company/dashboard.html',
                profile: '/pages/company/profile.html',
                jobs: '/pages/company/my-jobs.html',
                analytics: '/pages/company/analytics.html'
            }
        };
    }

    /**
     * Configurar navegación según rol actual
     */
    setupNavigation() {
        // Crear menú de navegación si no existe
        this.createNavigationMenu();
        
        // Configurar enlaces según rol
        this.updateNavigationLinks();
        
        // Configurar breadcrumbs
        this.updateBreadcrumbs();
    }

    /**
     * Crear menú de navegación dinámico
     */
    createNavigationMenu() {
        // Buscar o crear contenedor de navegación
        let navContainer = document.querySelector('.main-navigation');
        
        if (!navContainer) {
            navContainer = document.createElement('nav');
            navContainer.className = 'main-navigation';
            navContainer.setAttribute('role', 'navigation');
            
            // Insertar al principio del body
            const header = document.querySelector('header') || document.body;
            header.insertBefore(navContainer, header.firstChild);
        }
        
        this.navContainer = navContainer;
    }

    /**
     * Actualizar enlaces de navegación según rol
     */
    updateNavigationLinks() {
        if (!this.navContainer) return;
        
        const routes = this.navigationRoutes[this.userRole] || this.navigationRoutes.guest;
        
        let navHTML = '<ul class="nav-menu">';
        
        // Enlaces según rol
        if (this.userRole === 'guest') {
            navHTML += `
                <li><a href="${routes.login}" class="nav-link">
                    <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                </a></li>
                <li><a href="${routes.jobs}" class="nav-link">
                    <i class="fas fa-briefcase"></i> Buscar Empleos
                </a></li>
                <li><a href="${routes.courses}" class="nav-link">
                    <i class="fas fa-graduation-cap"></i> Cursos
                </a></li>
            `;
        } else if (this.userRole === 'usuario') {
            navHTML += `
                <li><a href="${routes.dashboard}" class="nav-link active">
                    <i class="fas fa-user"></i> Mi Perfil
                </a></li>
                <li><a href="${routes.jobs}" class="nav-link">
                    <i class="fas fa-briefcase"></i> Buscar Empleos
                </a></li>
                <li><a href="${routes.courses}" class="nav-link">
                    <i class="fas fa-graduation-cap"></i> Mis Cursos
                </a></li>
                <li><a href="${routes.applications}" class="nav-link">
                    <i class="fas fa-file-alt"></i> Mis Aplicaciones
                </a></li>
            `;
        } else if (this.userRole === 'admin_invitado' || this.userRole === 'admin_master') {
            navHTML += `
                <li><a href="${routes.dashboard}" class="nav-link active">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </a></li>
                <li><a href="${routes.users}" class="nav-link">
                    <i class="fas fa-users"></i> Usuarios
                </a></li>
                <li><a href="${routes.jobs}" class="nav-link">
                    <i class="fas fa-briefcase"></i> Empleos
                </a></li>
                <li><a href="${routes.courses}" class="nav-link">
                    <i class="fas fa-graduation-cap"></i> Cursos
                </a></li>
                <li><a href="${routes.reports}" class="nav-link">
                    <i class="fas fa-chart-bar"></i> Reportes
                </a></li>
            `;
        }
        
        // Agregar logout si está autenticado
        if (this.userRole !== 'guest') {
            navHTML += `
                <li><a href="#" onclick="window.LaboriaNavigation.logout()" class="nav-link nav-logout">
                    <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                </a></li>
            `;
        }
        
        navHTML += '</ul>';
        
        // Agregar estilos CSS si no existen
        if (!document.querySelector('#navigation-styles')) {
            const style = document.createElement('style');
            style.id = 'navigation-styles';
            style.textContent = `
                .main-navigation {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    padding: 1rem 2rem;
                    border-radius: var(--border-radius-md);
                    box-shadow: var(--shadow-md);
                    margin-bottom: 1rem;
                }
                
                .nav-menu {
                    display: flex;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                
                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    text-decoration: none;
                    color: var(--theme-text-primary);
                    border-radius: var(--border-radius-sm);
                    transition: all 0.3s ease;
                    font-weight: 500;
                }
                
                .nav-link:hover {
                    background: var(--theme-primary);
                    color: white;
                    transform: translateY(-1px);
                }
                
                .nav-link.active {
                    background: var(--theme-primary);
                    color: white;
                }
                
                .nav-logout {
                    background: #ef4444;
                    color: white;
                }
                
                .nav-logout:hover {
                    background: #dc2626;
                }
                
                @media (max-width: 768px) {
                    .nav-menu {
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                    
                    .nav-link {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.navContainer.innerHTML = navHTML;
    }

    /**
     * Actualizar breadcrumbs
     */
    updateBreadcrumbs() {
        let breadcrumbContainer = document.querySelector('.breadcrumbs');
        
        if (!breadcrumbContainer) {
            breadcrumbContainer = document.createElement('nav');
            breadcrumbContainer.className = 'breadcrumbs';
            breadcrumbContainer.setAttribute('aria-label', 'Navegación');
            
            // Insertar después del menú principal
            if (this.navContainer) {
                this.navContainer.parentNode.insertBefore(breadcrumbContainer, this.navContainer.nextSibling);
            }
        }
        
        const currentPage = this.getCurrentPageName();
        let breadcrumbHTML = '<ol class="breadcrumb-list">';
        
        // Siempre mostrar inicio
        breadcrumbHTML += '<li><a href="/" class="breadcrumb-link">Inicio</a></li>';
        
        // Agregar página actual si no es inicio
        if (currentPage !== 'inicio') {
            breadcrumbHTML += `<li class="breadcrumb-current">${this.getPageDisplayName(currentPage)}</li>`;
        }
        
        breadcrumbHTML += '</ol>';
        
        // Agregar estilos si no existen
        if (!document.querySelector('#breadcrumb-styles')) {
            const style = document.createElement('style');
            style.id = 'breadcrumb-styles';
            style.textContent = `
                .breadcrumbs {
                    padding: 0.5rem 0;
                    margin-bottom: 1rem;
                }
                
                .breadcrumb-list {
                    display: flex;
                    align-items: center;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    gap: 0.5rem;
                }
                
                .breadcrumb-link {
                    color: var(--theme-text-secondary);
                    text-decoration: none;
                    padding: 0.25rem 0.5rem;
                    border-radius: var(--border-radius-sm);
                    transition: all 0.3s ease;
                }
                
                .breadcrumb-link:hover {
                    color: var(--theme-primary);
                    background: rgba(59, 130, 246, 0.1);
                }
                
                .breadcrumb-current {
                    color: var(--theme-text-primary);
                    font-weight: 600;
                    padding: 0.25rem 0.5rem;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: var(--border-radius-sm);
                }
                
                .breadcrumb-list li:not(:last-child)::after {
                    content: '›';
                    color: var(--theme-text-secondary);
                    margin: 0 0.5rem;
                }
                
                @media (max-width: 768px) {
                    .breadcrumb-list {
                        flex-wrap: wrap;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        breadcrumbContainer.innerHTML = breadcrumbHTML;
    }

    /**
     * Configurar manejo de errores 404
     */
    setup404Handling() {
        // Interceptar todas las navegaciones
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.href) {
                this.checkRouteExists(link.href, event);
            }
        });
        
        // Verificar ruta actual
        this.checkCurrentRoute();
    }

    /**
     * Verificar si una ruta existe
     */
    async checkRouteExists(href, event) {
        try {
            const url = new URL(href);
            const path = url.pathname;
            
            // Verificar si es una ruta conocida
            const isKnownRoute = this.isKnownRoute(path);
            
            if (!isKnownRoute) {
                console.warn(`🚫 Ruta desconocida: ${path}`);
                
                // Prevenir navegación y mostrar 404
                event.preventDefault();
                this.show404Page(path);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error verificando ruta:', error);
            return true;
        }
    }

    /**
     * Verificar ruta actual
     */
    checkCurrentRoute() {
        const currentPath = window.location.pathname;
        
        if (!this.isKnownRoute(currentPath) && currentPath !== '/pages/404.html') {
            console.warn(`🚫 Ruta actual no existe: ${currentPath}`);
            this.show404Page(currentPath);
        }
    }

    /**
     * Verificar si una ruta está en las rutas conocidas
     */
    isKnownRoute(path) {
        // Rutas estáticas conocidas
        const knownRoutes = [
            '/',
            '/pages/index.html',
            '/pages/404.html',
            '/usuario/perfil.html',
            '/pages/admin-master/InicioAdmin.html',
            '/pages/admin-invitado/Inicio-Invi-Admin.html'
        ];
        
        if (knownRoutes.includes(path)) {
            return true;
        }
        
        // Verificar en rutas por rol
        for (const role in this.navigationRoutes) {
            const routes = this.navigationRoutes[role];
            for (const routeName in routes) {
                if (routes[routeName] === path) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Mostrar página 404
     */
    show404Page(attemptedPath) {
        // Guardar la ruta intentada en sessionStorage
        sessionStorage.setItem('attemptedPath', attemptedPath);
        sessionStorage.setItem('404Timestamp', new Date().toISOString());
        
        // Redirigir a página 404
        window.location.href = '/pages/404.html';
    }

    /**
     * Obtener nombre de la página actual
     */
    getCurrentPageName() {
        const path = window.location.pathname;
        
        if (path === '/' || path.includes('/pages/index.html')) {
            return 'inicio';
        } else if (path.includes('/usuario/perfil.html')) {
            return 'perfil';
        } else if (path.includes('/admin-master/')) {
            return 'admin';
        } else if (path.includes('/admin-invitado/')) {
            return 'admin-invitado';
        } else if (path.includes('/404.html')) {
            return '404';
        }
        
        return 'desconocido';
    }

    /**
     * Obtener nombre para mostrar de la página
     */
    getPageDisplayName(pageName) {
        const displayNames = {
            'inicio': 'Inicio',
            'perfil': 'Mi Perfil',
            'admin': 'Panel Administrativo',
            'admin-invitado': 'Panel Invitado',
            '404': 'Página No Encontrada'
        };
        
        return displayNames[pageName] || pageName;
    }

    /**
     * Actualizar UI de navegación
     */
    updateNavigationUI() {
        // Actualizar estado activo en enlaces
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPath || 
                (currentPath.includes(link.getAttribute('href')) && link.getAttribute('href') !== '/')) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Navegar a una ruta
     */
    navigateTo(routeName) {
        const routes = this.navigationRoutes[this.userRole] || this.navigationRoutes.guest;
        const targetRoute = routes[routeName];
        
        if (targetRoute) {
            window.location.href = targetRoute;
        } else {
            console.error(`❌ Ruta no encontrada: ${routeName}`);
            this.show404Page(routeName);
        }
    }

    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            if (window.LaboriaAPI) {
                await window.LaboriaAPI.logout();
            } else {
                // Fallback
                localStorage.clear();
                window.location.href = '/pages/index.html';
            }
        } catch (error) {
            console.error('❌ Error en logout:', error);
            localStorage.clear();
            window.location.href = '/pages/index.html';
        }
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

window.LaboriaNavigation = new NavigationSystem();

console.log('🧭 Sistema de Navegación Laboria inicializado:', {
    currentPage: window.LaboriaNavigation.currentPage,
    userRole: window.LaboriaNavigation.userRole,
    isAuthenticated: window.LaboriaNavigation.userRole !== 'guest'
});
