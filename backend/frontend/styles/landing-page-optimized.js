/**
 * Landing Page Optimized - Performance & Bundle Optimized
 * Sistema optimizado de landing page con pestañas y gráficas
 */

class OptimizedLandingPage {
    constructor() {
        this.state = {
            currentTab: 'inicio',
            isAnimating: false,
            charts: new Map(),
            observers: new Map(),
            cache: new Map()
        };
        
        this.config = {
            animationDuration: 300,
            debounceDelay: 100,
            throttleDelay: 16,
            chartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                }
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupTabSystem();
        this.initializeCharts();
        this.setupOptimizedAnimations();
        this.setupPerformanceOptimizations();
        this.setupLazyLoading();
        console.log('🚀 Landing Page Optimized initialized');
    }
    
    setupTabSystem() {
        // Optimized tab system with event delegation
        const tabContainer = document.querySelector('.modern-nav');
        if (tabContainer) {
            tabContainer.addEventListener('click', this.handleTabClick.bind(this));
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
        
        // URL tab handling
        this.handleURLTab();
    }
    
    handleTabClick(e) {
        const tabBtn = e.target.closest('.modern-nav-btn');
        if (!tabBtn) return;
        
        e.preventDefault();
        const targetTab = tabBtn.dataset.tab;
        if (targetTab && targetTab !== this.state.currentTab) {
            this.switchTab(targetTab);
        }
    }
    
    handleKeyboardNavigation(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const tabs = Array.from(document.querySelectorAll('.modern-nav-btn'));
            const currentIndex = tabs.findIndex(tab => tab.dataset.tab === this.state.currentTab);
            
            let newIndex;
            if (e.key === 'ArrowLeft') {
                newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
            } else {
                newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
            }
            
            const newTab = tabs[newIndex];
            if (newTab) {
                this.switchTab(newTab.dataset.tab);
            }
        }
    }
    
    handleURLTab() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = urlParams.get('tab');
        if (urlTab && document.querySelector(`[data-tab="${urlTab}"]`)) {
            this.switchTab(urlTab);
        }
    }
    
    switchTab(tabName) {
        if (this.state.isAnimating) return;
        
        this.state.isAnimating = true;
        const oldTab = this.state.currentTab;
        
        // Update button states
        this.updateTabButtons(tabName);
        
        // Animate panes
        this.animateTabTransition(oldTab, tabName, () => {
            this.state.currentTab = tabName;
            this.state.isAnimating = false;
            this.initializeTabContent(tabName);
            this.updateURL(tabName);
        });
    }
    
    updateTabButtons(tabName) {
        document.querySelectorAll('.modern-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
    }
    
    animateTabTransition(oldTab, newTab, callback) {
        const oldPane = document.getElementById(`${oldTab}-tab`);
        const newPane = document.getElementById(`${newTab}-tab`);
        
        if (!oldPane || !newPane) {
            callback();
            return;
        }
        
        // Optimized transition with requestAnimationFrame
        requestAnimationFrame(() => {
            oldPane.classList.remove('active');
            newPane.classList.add('active');
            
            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            setTimeout(callback, this.config.animationDuration);
        });
    }
    
    initializeTabContent(tabName) {
        // Lazy initialization of tab content
        if (!this.state.cache.has(tabName)) {
            this.state.cache.set(tabName, true);
            
            switch (tabName) {
                case 'inicio':
                    this.initializeDashboardCharts();
                    break;
                case 'empleos':
                    this.initializeJobsContent();
                    break;
                case 'cursos':
                    this.initializeCoursesContent();
                    break;
            }
        }
    }
    
    initializeCharts() {
        // Only initialize Chart.js if needed
        if (typeof Chart === 'undefined') {
            this.loadChartLibrary(() => {
                this.createCharts();
            });
        } else {
            this.createCharts();
        }
    }
    
    loadChartLibrary(callback) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = callback;
        script.onerror = () => console.error('Failed to load Chart.js');
        document.head.appendChild(script);
    }
    
    createCharts() {
        // Create charts only when visible
        this.setupIntersectionObserver();
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.state.charts.has(entry.target.id)) {
                    this.createChart(entry.target.id);
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('canvas[id*="Chart"]').forEach(canvas => {
            observer.observe(canvas);
        });
        
        this.state.observers.set('charts', observer);
    }
    
    createChart(chartId) {
        const ctx = document.getElementById(chartId);
        if (!ctx) return;
        
        let chart;
        
        switch (chartId) {
            case 'activityChart':
                chart = this.createActivityChart(ctx);
                break;
            case 'skillsChart':
                chart = this.createSkillsChart(ctx);
                break;
            case 'progressChart':
                chart = this.createProgressChart(ctx);
                break;
            case 'usersGrowthChart':
                chart = this.createUsersGrowthChart(ctx);
                break;
            case 'revenueChart':
                chart = this.createRevenueChart(ctx);
                break;
            case 'engagementChart':
                chart = this.createEngagementChart(ctx);
                break;
            case 'performanceChart':
                chart = this.createPerformanceChart(ctx);
                break;
        }
        
        if (chart) {
            this.state.charts.set(chartId, chart);
        }
    }
    
    createActivityChart(ctx) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Actividad',
                    data: [12, 19, 15, 25, 22, 30],
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                ...this.config.chartOptions,
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }
    
    createSkillsChart(ctx) {
        return new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['JavaScript', 'React', 'Node.js', 'Python', 'CSS', 'SQL'],
                datasets: [{
                    label: 'Skills',
                    data: [90, 85, 75, 70, 88, 65],
                    borderColor: 'rgb(118, 75, 162)',
                    backgroundColor: 'rgba(118, 75, 162, 0.2)'
                }]
            },
            options: {
                ...this.config.chartOptions,
                scales: {
                    r: { beginAtZero: true, max: 100 }
                }
            }
        });
    }
    
    createProgressChart(ctx) {
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completado', 'En Progreso', 'Pendiente'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ]
                }]
            },
            options: {
                ...this.config.chartOptions,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    createUsersGrowthChart(ctx) {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Nuevos Usuarios',
                    data: [120, 190, 150, 250, 220, 300],
                    backgroundColor: 'rgba(99, 102, 241, 0.8)'
                }]
            },
            options: {
                ...this.config.chartOptions,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
    
    createRevenueChart(ctx) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Ingresos',
                    data: [30000, 35000, 32000, 42000, 38000, 45000],
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                ...this.config.chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '$' + value.toLocaleString()
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => '$' + context.parsed.y.toLocaleString()
                        }
                    }
                }
            }
        });
    }
    
    createEngagementChart(ctx) {
        return new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: ['Desktop', 'Mobile', 'Tablet', 'Smart TV', 'Otros'],
                datasets: [{
                    data: [45, 30, 15, 5, 5],
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ]
                }]
            },
            options: {
                ...this.config.chartOptions,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
    
    createPerformanceChart(ctx) {
        return new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Response Time',
                    data: [
                        {x: 1, y: 120},
                        {x: 2, y: 110},
                        {x: 3, y: 105},
                        {x: 4, y: 95},
                        {x: 5, y: 90},
                        {x: 6, y: 85}
                    ],
                    backgroundColor: 'rgba(99, 102, 241, 0.8)'
                }]
            },
            options: {
                ...this.config.chartOptions,
                scales: {
                    x: { title: { display: true, text: 'Time (hours)' } },
                    y: { title: { display: true, text: 'Response Time (ms)' } }
                }
            }
        });
    }
    
    setupOptimizedAnimations() {
        // Use requestAnimationFrame for smooth animations
        this.setupScrollAnimations();
        this.setupHoverEffects();
    }
    
    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        document.querySelectorAll('.modern-card, .stat-card, .action-card').forEach(el => {
            observer.observe(el);
        });
        
        this.state.observers.set('scroll', observer);
    }
    
    animateElement(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        requestAnimationFrame(() => {
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }
    
    setupHoverEffects() {
        // Use event delegation for better performance
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    }
    
    handleMouseOver(e) {
        const card = e.target.closest('.modern-card, .modern-btn');
        if (card) {
            card.style.transform = 'translateY(-4px) scale(1.02)';
            card.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
        }
    }
    
    handleMouseOut(e) {
        const card = e.target.closest('.modern-card, .modern-btn');
        if (card) {
            card.style.transform = '';
            card.style.boxShadow = '';
        }
    }
    
    setupPerformanceOptimizations() {
        // Debounced scroll handler
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, this.config.debounceDelay);
        });
        
        // Throttled resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (!resizeTimeout) {
                resizeTimeout = setTimeout(() => {
                    this.handleResize();
                    resizeTimeout = null;
                }, this.config.throttleDelay);
            }
        });
        
        // Memory cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }
    
    setupLazyLoading() {
        // Lazy load images
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
        
        this.state.observers.set('images', imageObserver);
    }
    
    handleScroll() {
        // Handle scroll-based optimizations
        this.resizeCharts();
    }
    
    handleResize() {
        // Handle resize-based optimizations
        this.resizeCharts();
        this.setupScrollAnimations();
    }
    
    resizeCharts() {
        this.state.charts.forEach(chart => {
            if (chart.resize) {
                chart.resize();
            }
        });
    }
    
    updateURL(tabName) {
        const url = new URL(window.location);
        url.searchParams.set('tab', tabName);
        window.history.pushState({}, '', url);
    }
    
    initializeDashboardCharts() {
        // Charts are initialized lazily when visible
    }
    
    initializeJobsContent() {
        // Initialize jobs content if needed
    }
    
    initializeCoursesContent() {
        // Initialize courses content if needed
    }
    
    // Public API
    getCurrentTab() {
        return this.state.currentTab;
    }
    
    switchToTab(tabName) {
        this.switchTab(tabName);
    }
    
    getChart(chartId) {
        return this.state.charts.get(chartId);
    }
    
    updateChart(chartId, newData) {
        const chart = this.state.charts.get(chartId);
        if (chart) {
            chart.data = newData;
            chart.update('active');
        }
    }
    
    cleanup() {
        // Clean up observers
        this.state.observers.forEach(observer => {
            observer.disconnect();
        });
        
        // Clean up charts
        this.state.charts.forEach(chart => {
            if (chart.destroy) {
                chart.destroy();
            }
        });
        
        // Clear caches
        this.state.cache.clear();
        this.state.charts.clear();
        this.state.observers.clear();
    }
}

// Initialize optimized landing page
document.addEventListener('DOMContentLoaded', () => {
    window.optimizedLandingPage = new OptimizedLandingPage();
    
    // Make it globally available for compatibility
    window.landingPageAdvanced = window.optimizedLandingPage;
});
