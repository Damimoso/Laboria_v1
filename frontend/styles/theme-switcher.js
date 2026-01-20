/**
 * Theme Switcher JavaScript - UNIFIED
 * Sistema unificado de gestión de temas (consolidado de theme-manager_Global.js)
 */

class UnifiedThemeManager {
    constructor() {
        this.themes = ['light', 'dark', 'spring', 'summer', 'autumn', 'winter'];
        this.currentTheme = this.getStoredTheme() || this.getAutoSeasonalTheme();
        this.currentSeason = this.getCurrentSeason();
        this.isAnimating = false;
        this.particles = [];
        this.init();
    }

    init() {
        console.log('🎨 Inicializando gestor de temas unificado...');
        this.applyTheme(this.currentTheme);
        this.applySeason(this.currentSeason);
        this.createThemeSwitcher();
        this.setupEventListeners();
        this.setupAutoThemeChange();
        this.setupSeasonalAnimations();
        this.createFloatingParticles();
        this.startDynamicAnimations();
        console.log('✅ Gestor de temas unificado inicializado');
    }

    // Theme Management
    getStoredTheme() {
        return localStorage.getItem('laboria-theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('laboria-theme', theme);
    }

    getCurrentSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }

    getAutoSeasonalTheme() {
        const month = new Date().getMonth();
        const seasonThemes = {
            spring: [2, 3, 4],
            summer: [5, 6, 7],
            autumn: [8, 9, 10],
            winter: [11, 0, 1]
        };

        for (const [season, months] of Object.entries(seasonThemes)) {
            if (months.includes(month)) {
                return season;
            }
        }
        return 'light';
    }

    applyTheme(theme) {
        if (!this.themes.includes(theme)) {
            console.warn(`Tema "${theme}" no válido. Usando tema por defecto.`);
            theme = 'light';
        }

        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.setStoredTheme(theme);
        
        // Update theme switcher UI
        this.updateThemeSwitcherUI();
        
        // Apply theme-specific styles
        this.applyThemeStyles(theme);
        
        // Dispatch theme change event
        this.dispatchThemeChange(theme);
    }

    applySeason(season) {
        this.currentSeason = season;
        document.documentElement.setAttribute('data-season', season);
        localStorage.setItem('laboria-season', season);
        
        // Update particles
        this.updateParticles();
        
        // Apply season-specific animations
        this.applySeasonAnimations(season);
    }

    applyThemeStyles(theme) {
        const root = document.documentElement;
        
        // Theme-specific CSS variables
        const themeVariables = {
            light: {
                '--primary-color': '#6366f1',
                '--secondary-color': '#3b82f6',
                '--accent-color': '#10b981',
                '--background': '#ffffff',
                '--surface': '#f8fafc',
                '--text': '#1e293b',
                '--text-secondary': '#64748b'
            },
            dark: {
                '--primary-color': '#818cf8',
                '--secondary-color': '#60a5fa',
                '--accent-color': '#34d399',
                '--background': '#0f172a',
                '--surface': '#1e293b',
                '--text': '#f1f5f9',
                '--text-secondary': '#94a3b8'
            },
            spring: {
                '--primary-color': '#10b981',
                '--secondary-color': '#34d399',
                '--accent-color': '#6366f1',
                '--background': '#f0fdf4',
                '--surface': '#dcfce7',
                '--text': '#064e3b',
                '--text-secondary': '#047857'
            },
            summer: {
                '--primary-color': '#f59e0b',
                '--secondary-color': '#fbbf24',
                '--accent-color': '#ef4444',
                '--background': '#fffbeb',
                '--surface': '#fef3c7',
                '--text': '#78350f',
                '--text-secondary': '#92400e'
            },
            autumn: {
                '--primary-color': '#f97316',
                '--secondary-color': '#fb923c',
                '--accent-color': '#dc2626',
                '--background': '#fff7ed',
                '--surface': '#fed7aa',
                '--text': '#7c2d12',
                '--text-secondary': '#9a3412'
            },
            winter: {
                '--primary-color': '#3b82f6',
                '--secondary-color': '#60a5fa',
                '--accent-color': '#6366f1',
                '--background': '#f0f9ff',
                '--surface': '#dbeafe',
                '--text': '#1e3a8a',
                '--text-secondary': '#1e40af'
            }
        };

        const variables = themeVariables[theme] || themeVariables.light;
        
        Object.entries(variables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }

    createThemeSwitcher() {
        // Remove existing switcher if present
        const existing = document.querySelector('.theme-switcher');
        if (existing) existing.remove();

        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher';
        switcher.innerHTML = `
            <button class="theme-switcher-btn" id="themeToggle" title="Cambiar tema">
                <i class="fas fa-palette"></i>
                <span class="theme-icon"></span>
            </button>
            <div class="theme-dropdown" id="themeDropdown">
                <div class="theme-options">
                    ${this.themes.map(theme => `
                        <button class="theme-option ${theme === this.currentTheme ? 'active' : ''}" 
                                data-theme="${theme}" 
                                title="Tema ${theme}">
                            <i class="fas ${this.getThemeIcon(theme)}"></i>
                            <span>${this.getThemeName(theme)}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(switcher);
        this.setupThemeSwitcherEvents();
    }

    setupThemeSwitcherEvents() {
        const toggle = document.getElementById('themeToggle');
        const dropdown = document.getElementById('themeDropdown');

        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
        }

        // Theme option clicks
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.applyTheme(theme);
                dropdown.classList.remove('show');
            });
        });

        // Close dropdown on outside click
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
    }

    updateThemeSwitcherUI() {
        // Update active theme in dropdown
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === this.currentTheme);
        });

        // Update main button icon
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            const newClasses = `theme-icon fas ${this.getThemeIcon(this.currentTheme)}`;
            
            // Usar método compatible con todos los elementos
            try {
                // Intentar usar className primero (para elementos HTML)
                icon.className = newClasses;
            } catch (error) {
                // Si falla, usar setAttribute (para SVG y otros elementos)
                icon.setAttribute('class', newClasses);
            }
        }

        // Update theme logo in login page (use vertical logos)
        const themeLogo = document.getElementById('themeLogo');
        if (themeLogo) {
            const isDarkTheme = ['dark', 'autumn', 'winter'].includes(this.currentTheme);
            themeLogo.src = isDarkTheme ? '../assets/logo-blanco-vertical.png' : '../assets/logo-negro-vertical.png';
        }

        // Update header logo in other pages
        const headerLogo = document.getElementById('headerLogo');
        if (headerLogo) {
            const isDarkTheme = ['dark', 'autumn', 'winter'].includes(this.currentTheme);
            headerLogo.src = isDarkTheme ? '../assets/logo-blanco.png' : '../assets/logo-negro.png';
        }

        // Update admin logo
        const adminLogo = document.getElementById('adminLogo');
        if (adminLogo) {
            const isDarkTheme = ['dark', 'autumn', 'winter'].includes(this.currentTheme);
            adminLogo.src = isDarkTheme ? '../../assets/logo-blanco.png' : '../../assets/logo-negro.png';
        }

        // Update admin invitado logo
        const adminInvitadoLogo = document.getElementById('adminInvitadoLogo');
        if (adminInvitadoLogo) {
            const isDarkTheme = ['dark', 'autumn', 'winter'].includes(this.currentTheme);
            adminInvitadoLogo.src = isDarkTheme ? '../../assets/logo-blanco.png' : '../../assets/logo-negro.png';
        }

        // Update user profile logo
        const userProfileLogo = document.getElementById('userProfileLogo');
        if (userProfileLogo) {
            const isDarkTheme = ['dark', 'autumn', 'winter'].includes(this.currentTheme);
            userProfileLogo.src = isDarkTheme ? '../assets/logo-blanco.png' : '../assets/logo-negro.png';
        }
    }

    getThemeIcon(theme) {
        const icons = {
            light: 'fa-sun',
            dark: 'fa-moon',
            spring: 'fa-seedling',
            summer: 'fa-umbrella-beach',
            autumn: 'fa-leaf',
            winter: 'fa-snowflake'
        };
        return icons[theme] || 'fa-palette';
    }

    getThemeName(theme) {
        const names = {
            light: 'Claro',
            dark: 'Oscuro',
            spring: 'Primavera',
            summer: 'Verano',
            autumn: 'Otoño',
            winter: 'Invierno'
        };
        return names[theme] || theme;
    }

    setupEventListeners() {
        // System theme change detection
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Season change detection (check daily)
        this.checkSeasonChange();
        setInterval(() => this.checkSeasonChange(), 24 * 60 * 60 * 1000);
    }

    setupAutoThemeChange() {
        // Auto-change theme based on time of day
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 18) {
            // Daytime - use seasonal theme
            this.applySeason(this.getCurrentSeason());
        } else {
            // Nighttime - use dark theme
            this.applyTheme('dark');
        }
    }

    setupSeasonalAnimations() {
        this.applySeasonAnimations(this.currentSeason);
    }

    applySeasonAnimations(season) {
        const body = document.body;
        
        // Remove all season classes
        body.classList.remove('season-spring', 'season-summer', 'season-autumn', 'season-winter');
        
        // Add current season class
        body.classList.add(`season-${season}`);
        
        // Update particles
        this.updateParticles();
    }

    createFloatingParticles() {
        const container = document.createElement('div');
        container.className = 'particles-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
        `;
        
        document.body.appendChild(container);
        this.particlesContainer = container;
        this.updateParticles();
    }

    updateParticles() {
        if (!this.particlesContainer) return;

        // Clear existing particles
        this.particlesContainer.innerHTML = '';
        this.particles = [];

        const particleCount = this.getParticleCount();
        const season = this.currentSeason;

        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle(season);
            this.particles.push(particle);
            this.particlesContainer.appendChild(particle.element);
        }
    }

    getParticleCount() {
        const counts = {
            spring: 15,
            summer: 10,
            autumn: 20,
            winter: 25
        };
        return counts[this.currentSeason] || 10;
    }

    createParticle(season) {
        const particle = document.createElement('div');
        particle.className = `particle particle-${season}`;
        
        const configs = {
            spring: {
                emoji: ['🌸', '🌺', '🌷', '🌹'],
                size: [20, 30],
                duration: [15, 25],
                delay: Math.random() * 20
            },
            summer: {
                emoji: ['☀️', '🌻', '🌊', '🏖️'],
                size: [25, 35],
                duration: [20, 30],
                delay: Math.random() * 25
            },
            autumn: {
                emoji: ['🍂', '🍁', '🍃', '🌰'],
                size: [15, 25],
                duration: [10, 20],
                delay: Math.random() * 15
            },
            winter: {
                emoji: ['❄️', '⛄', '🎿', '⛷️'],
                size: [20, 30],
                duration: [15, 25],
                delay: Math.random() * 20
            }
        };

        const config = configs[season] || configs.spring;
        const emoji = config.emoji[Math.floor(Math.random() * config.emoji.length)];
        const size = config.size[0] + Math.random() * (config.size[1] - config.size[0]);
        
        particle.textContent = emoji;
        particle.style.cssText = `
            position: absolute;
            font-size: ${size}px;
            left: ${Math.random() * 100}%;
            top: -50px;
            animation: fall ${config.duration[0] + Math.random() * (config.duration[1] - config.duration[0])}s linear ${config.delay}s infinite;
            opacity: 0.7;
            z-index: 1;
        `;

        return {
            element: particle,
            season: season
        };
    }

    startDynamicAnimations() {
        // Add CSS for particle animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fall {
                from {
                    transform: translateY(-50px) rotate(0deg);
                }
                to {
                    transform: translateY(100vh) rotate(360deg);
                }
            }
            
            .particle {
                pointer-events: none;
                user-select: none;
            }
            
            .theme-switcher {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
            }
            
            .theme-switcher-btn {
                background: rgba(255, 255, 255, 0.9);
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
                position: relative;
            }
            
            .theme-switcher-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            }
            
            .theme-dropdown {
                position: absolute;
                top: 60px;
                right: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                min-width: 200px;
            }
            
            .theme-dropdown.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .theme-options {
                padding: 0.5rem;
            }
            
            .theme-option {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                border: none;
                background: transparent;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.875rem;
                color: var(--text, #1e293b);
            }
            
            .theme-option:hover {
                background: rgba(99, 102, 241, 0.1);
                color: var(--primary-color, #6366f1);
            }
            
            .theme-option.active {
                background: var(--primary-color, #6366f1);
                color: white;
            }
            
            @media (max-width: 768px) {
                .theme-switcher {
                    top: 10px;
                    right: 10px;
                }
                
                .theme-switcher-btn {
                    width: 40px;
                    height: 40px;
                }
                
                .theme-dropdown {
                    right: -50px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    checkSeasonChange() {
        const newSeason = this.getCurrentSeason();
        if (newSeason !== this.currentSeason) {
            this.applySeason(newSeason);
        }
    }

    dispatchThemeChange(theme) {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: theme,
                season: this.currentSeason
            }
        });
        document.dispatchEvent(event);
    }

    // Public API
    getTheme() {
        return this.currentTheme;
    }

    getSeason() {
        return this.currentSeason;
    }

    setTheme(theme) {
        this.applyTheme(theme);
    }

    setSeason(season) {
        this.applySeason(season);
    }

    toggleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.applyTheme(this.themes[nextIndex]);
    }
}

// Initialize unified theme manager
document.addEventListener('DOMContentLoaded', () => {
    window.unifiedThemeManager = new UnifiedThemeManager();
    
    // Make it globally available for legacy compatibility
    window.themeManager = window.unifiedThemeManager;
    window.ThemeManager = UnifiedThemeManager;
});
