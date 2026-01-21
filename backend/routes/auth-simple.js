// =============================================
// RUTAS SIMPLIFICADAS PARA DEBUGGING - LABORIA
// =============================================

const express = require('express');
const router = express.Router();

// Health check simple
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth routes working',
        timestamp: new Date().toISOString()
    });
});

// Login simulado
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son obligatorios'
        });
    }
    
    // Respuesta simulada para debugging
    res.json({
        success: true,
        message: 'Login simulado exitoso',
        data: {
            user: {
                id: 1,
                email: email,
                name: 'Usuario Demo'
            },
            token: 'simulated_token_' + Date.now()
        }
    });
});

// Register simulado
router.post('/register', (req, res) => {
    const { email, password, fullName } = req.body;
    
    if (!email || !password || !fullName) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son obligatorios'
        });
    }
    
    // Respuesta simulada para debugging
    res.json({
        success: true,
        message: 'Registro simulado exitoso',
        data: {
            user: {
                id: 1,
                email: email,
                name: fullName
            }
        }
    });
});

module.exports = router;
