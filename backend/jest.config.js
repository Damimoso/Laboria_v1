// =============================================
// CONFIGURACIÓN DE JEST - LABORIA
// =============================================

module.exports = {
    // Entorno de prueba
    testEnvironment: 'node',
    
    // Directorios de prueba
    roots: ['<rootDir>/tests'],
    
    // Patrones de archivos de prueba
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    
    // Archivos a ignorar
    testPathIgnorePatterns: [
        '/node_modules/',
        '/coverage/',
        '/dist/'
    ],
    
    // Archivos de configuración
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    
    // Cobertura de código
    collectCoverage: false,
    collectCoverageFrom: [
        'routes/**/*.js',
        'middleware/**/*.js',
        'config/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**',
        '!**/coverage/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],
    
    // Timeout por defecto
    testTimeout: 10000,
    
    // Verbosidad
    verbose: true,
    
    // Reporters
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: 'coverage',
                outputName: 'junit.xml',
                classNameTemplate: '{classname}',
                titleTemplate: '{title}',
                ancestorSeparator: ' › ',
                usePathForSuiteName: true
            }
        ]
    ],
    
    // Variables de entorno para pruebas
    testEnvironmentOptions: {
        NODE_ENV: 'test'
    },
    
    // Mocks globales
    clearMocks: true,
    restoreMocks: true,
    
    // Transformación de archivos
    transform: {},
    
    // Módulos a mockear
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    
    // Configuración específica para diferentes patrones
    projects: [
        {
            displayName: 'unit',
            testMatch: ['<rootDir>/tests/**/*.test.js'],
            setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
        },
        {
            displayName: 'integration',
            testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
            setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js']
        }
    ]
};
