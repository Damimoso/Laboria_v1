/**
 * Sistema de Validación de Formularios Unificado para Laboria
 * Proporciona validación en tiempo real, estados visuales y feedback descriptivo
 */

class FormValidationSystem {
    constructor() {
        this.validators = this.initializeValidators();
        this.errorMessages = this.initializeErrorMessages();
        this.formStates = new Map(); // Estado de cada formulario
        this.init();
    }

    /**
     * Inicializar el sistema de validación
     */
    init() {
        console.log('📝 Inicializando Sistema de Validación de Formularios...');
        
        // Configurar listeners globales
        this.setupGlobalListeners();
        
        // Procesar formularios existentes
        this.processExistingForms();
        
        console.log('✅ Sistema de Validación inicializado');
    }

    /**
     * Inicializar validadores para diferentes tipos de campos
     */
    initializeValidators() {
        return {
            // Validadores de texto
            text: {
                required: (value) => value.trim().length > 0,
                minLength: (value, min) => value.trim().length >= min,
                maxLength: (value, max) => value.trim().length <= max,
                pattern: (value, pattern) => new RegExp(pattern).test(value),
                noNumbers: (value) => !/\d/.test(value),
                alphanumeric: (value) => /^[a-zA-Z0-9]+$/.test(value),
                names: (value) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)
            },
            
            // Validadores de email
            email: {
                required: (value) => value.trim().length > 0,
                format: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                domain: (value) => {
                    const domain = value.split('@')[1];
                    return domain && domain.includes('.');
                }
            },
            
            // Validadores de contraseña
            password: {
                required: (value) => value.length > 0,
                minLength: (value, min) => value.length >= min,
                strength: (value) => {
                    let score = 0;
                    if (value.length >= 8) score++;
                    if (/[a-z]/.test(value)) score++;
                    if (/[A-Z]/.test(value)) score++;
                    if (/\d/.test(value)) score++;
                    if (/[!@#$%^&*]/.test(value)) score++;
                    return score;
                },
                match: (value, confirmValue) => value === confirmValue
            },
            
            // Validadores de teléfono
            phone: {
                format: (value) => {
                    if (!value) return true; // Optional field
                    // Soporta formatos internacionales
                    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
                    return phoneRegex.test(value);
                }
            },
            
            // Validadores de número
            number: {
                required: (value) => value.trim().length > 0,
                min: (value, min) => parseFloat(value) >= min,
                max: (value, max) => parseFloat(value) <= max,
                integer: (value) => Number.isInteger(parseFloat(value)),
                positive: (value) => parseFloat(value) > 0
            },
            
            // Validadores de fecha
            date: {
                required: (value) => value.trim().length > 0,
                format: (value) => !isNaN(Date.parse(value)),
                minAge: (value, minAge) => {
                    const birthDate = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    return age >= minAge;
                },
                maxAge: (value, maxAge) => {
                    const birthDate = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    return age <= maxAge;
                }
            },
            
            // Validadores de archivo
            file: {
                required: (input) => input.files && input.files.length > 0,
                maxSize: (input, maxSizeMB) => {
                    if (!input.files || input.files.length === 0) return true;
                    const fileSize = input.files[0].size;
                    const maxSizeBytes = maxSizeMB * 1024 * 1024;
                    return fileSize <= maxSizeBytes;
                },
                allowedTypes: (input, allowedTypes) => {
                    if (!input.files || input.files.length === 0) return true;
                    const fileType = input.files[0].type;
                    return allowedTypes.includes(fileType) || allowedTypes.some(type => fileType.includes(type));
                },
                imageDimensions: (input, maxWidth, maxHeight) => {
                    return new Promise((resolve) => {
                        if (!input.files || input.files.length === 0) {
                            resolve(true);
                            return;
                        }
                        
                        const img = new Image();
                        img.onload = () => {
                            resolve(img.width <= maxWidth && img.height <= maxHeight);
                        };
                        img.onerror = () => resolve(false);
                        img.src = URL.createObjectURL(input.files[0]);
                    });
                }
            }
        };
    }

    /**
     * Inicializar mensajes de error
     */
    initializeErrorMessages() {
        return {
            required: 'Este campo es obligatorio',
            minLength: 'Debe tener al menos {min} caracteres',
            maxLength: 'No puede tener más de {max} caracteres',
            email: 'Ingresa un email válido',
            phone: 'Ingresa un número de teléfono válido',
            password: {
                weak: 'La contraseña es muy débil',
                fair: 'La contraseña es débil',
                good: 'La contraseña es aceptable',
                strong: 'La contraseña es fuerte',
                match: 'Las contraseñas no coinciden'
            },
            file: {
                maxSize: 'El archivo no puede superar los {maxSize}MB',
                type: 'Solo se permiten archivos de tipo: {types}',
                dimensions: 'La imagen no puede superar {width}x{height} píxeles'
            },
            date: {
                format: 'Ingresa una fecha válida',
                minAge: 'Debes tener al menos {age} años',
                maxAge: 'No puedes tener más de {age} años'
            }
        };
    }

    /**
     * Configurar listeners globales
     */
    setupGlobalListeners() {
        // Listener para inputs con validación en tiempo real
        document.addEventListener('input', (event) => {
            const input = event.target;
            if (input.matches('[data-validate]')) {
                this.handleRealtimeValidation(input);
            }
        });

        // Listener para blur (validación final)
        document.addEventListener('blur', (event) => {
            const input = event.target;
            if (input.matches('[data-validate]')) {
                this.handleFieldValidation(input, true);
            }
        }, true);

        // Listener para form submit
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.matches('[data-form-validation]')) {
                this.handleFormSubmit(form, event);
            }
        });
    }

    /**
     * Procesar formularios existentes en el DOM
     */
    processExistingForms() {
        const forms = document.querySelectorAll('form[data-form-validation]');
        forms.forEach(form => {
            this.initializeForm(form);
        });

        // Procesar inputs individuales
        const inputs = document.querySelectorAll('input[data-validate], textarea[data-validate], select[data-validate]');
        inputs.forEach(input => {
            this.initializeField(input);
        });
    }

    /**
     * Inicializar un formulario específico
     */
    initializeForm(form) {
        const formId = form.id || `form-${Date.now()}`;
        
        // Estado inicial del formulario
        this.formStates.set(formId, {
            isValid: false,
            fields: new Map(),
            submitAttempts: 0
        });

        // Agregar indicador de estado
        this.addFormStatusIndicator(form);
    }

    /**
     * Inicializar un campo específico
     */
    initializeField(field) {
        const validationRules = this.parseValidationRules(field);
        
        // Crear contenedor de feedback si no existe
        this.createFieldFeedback(field);
        
        // Agregar indicadores visuales
        this.addFieldIndicators(field);
        
        // Validación inicial si tiene valor
        if (field.value.trim().length > 0) {
            this.handleFieldValidation(field, false);
        }
    }

    /**
     * Parsear reglas de validación desde atributos data
     */
    parseValidationRules(field) {
        const rules = {};
        
        // Parsear atributos data-validate
        const validateAttr = field.getAttribute('data-validate');
        if (validateAttr) {
            validateAttr.split('|').forEach(rule => {
                const [key, value] = rule.split(':');
                rules[key] = value || true;
            });
        }
        
        // Parsear otros atributos
        if (field.hasAttribute('required')) rules.required = true;
        if (field.hasAttribute('minlength')) rules.minLength = parseInt(field.getAttribute('minlength'));
        if (field.hasAttribute('maxlength')) rules.maxLength = parseInt(field.getAttribute('maxlength'));
        if (field.hasAttribute('min')) rules.min = parseFloat(field.getAttribute('min'));
        if (field.hasAttribute('max')) rules.max = parseFloat(field.getAttribute('max'));
        if (field.hasAttribute('pattern')) rules.pattern = field.getAttribute('pattern');
        
        return rules;
    }

    /**
     * Manejar validación en tiempo real
     */
    handleRealtimeValidation(field) {
        const rules = this.parseValidationRules(field);
        const value = field.value;
        
        // Validación básica de requerido
        if (rules.required && value.trim().length === 0) {
            this.showFieldError(field, this.errorMessages.required);
            this.setFieldState(field, 'error');
            return;
        }
        
        // Si no hay valor y no es requerido, limpiar
        if (!rules.required && value.trim().length === 0) {
            this.clearFieldError(field);
            this.setFieldState(field, 'empty');
            return;
        }
        
        // Validaciones específicas según tipo
        const validation = this.validateField(field, rules);
        
        if (validation.isValid) {
            this.clearFieldError(field);
            this.setFieldState(field, 'valid');
        } else {
            this.showFieldError(field, validation.message);
            this.setFieldState(field, 'error');
        }
    }

    /**
     * Manejar validación completa del campo
     */
    handleFieldValidation(field, isBlur = false) {
        this.handleRealtimeValidation(field);
        
        // Si es blur, mostrar indicadores más estrictos
        if (isBlur) {
            this.showFieldValidationSummary(field);
        }
    }

    /**
     * Validar un campo específico
     */
    validateField(field, rules) {
        const fieldType = field.type || 'text';
        const value = field.value;
        let isValid = true;
        let message = '';

        // Validación de requerido
        if (rules.required && value.trim().length === 0) {
            return { isValid: false, message: this.errorMessages.required };
        }

        // Si no hay valor y no es requerido
        if (!rules.required && value.trim().length === 0) {
            return { isValid: true, message: '' };
        }

        // Validaciones según tipo de campo
        switch (fieldType) {
            case 'email':
                if (!this.validators.email.format(value)) {
                    isValid = false;
                    message = this.errorMessages.email;
                }
                break;

            case 'tel':
                if (!this.validators.phone.format(value)) {
                    isValid = false;
                    message = this.errorMessages.phone;
                }
                break;

            case 'password':
                if (rules.minLength && !this.validators.password.minLength(value, rules.minLength)) {
                    isValid = false;
                    message = this.errorMessages.minLength.replace('{min}', rules.minLength);
                }
                
                // Validar fortaleza si se especifica
                if (rules.strength) {
                    const strength = this.validators.password.strength(value);
                    if (strength < 2) {
                        isValid = false;
                        message = this.errorMessages.password.weak;
                    }
                }
                break;

            case 'file':
                if (rules.maxSize && !this.validators.file.maxSize(field, rules.maxSize)) {
                    isValid = false;
                    message = this.errorMessages.file.maxSize.replace('{maxSize}', rules.maxSize);
                }
                
                if (rules.allowedTypes && !this.validators.file.allowedTypes(field, rules.allowedTypes)) {
                    isValid = false;
                    message = this.errorMessages.file.type.replace('{types}', rules.allowedTypes.join(', '));
                }
                break;
        }

        // Validaciones genéricas de texto
        if (fieldType === 'text' || fieldType === 'textarea') {
            if (rules.minLength && !this.validators.text.minLength(value, rules.minLength)) {
                isValid = false;
                message = this.errorMessages.minLength.replace('{min}', rules.minLength);
            }
            
            if (rules.maxLength && !this.validators.text.maxLength(value, rules.maxLength)) {
                isValid = false;
                message = this.errorMessages.maxLength.replace('{max}', rules.maxLength);
            }
            
            if (rules.pattern && !this.validators.text.pattern(value, rules.pattern)) {
                isValid = false;
                message = this.errorMessages.required; // Mensaje genérico para pattern
            }
            
            if (rules.names && !this.validators.text.names(value)) {
                isValid = false;
                message = 'Solo se permiten letras y espacios';
            }
        }

        // Validaciones numéricas
        if (fieldType === 'number') {
            const numValue = parseFloat(value);
            
            if (rules.min !== undefined && !this.validators.number.min(value, rules.min)) {
                isValid = false;
                message = `El valor debe ser al menos ${rules.min}`;
            }
            
            if (rules.max !== undefined && !this.validators.number.max(value, rules.max)) {
                isValid = false;
                message = `El valor no puede superar ${rules.max}`;
            }
            
            if (rules.integer && !this.validators.number.integer(value)) {
                isValid = false;
                message = 'Debe ser un número entero';
            }
        }

        return { isValid, message };
    }

    /**
     * Manejar submit de formulario
     */
    handleFormSubmit(form, event) {
        const formId = form.id || `form-${Date.now()}`;
        const formState = this.formStates.get(formId);
        
        // Validar todos los campos
        const fields = form.querySelectorAll('[data-validate]');
        let isFormValid = true;
        let firstInvalidField = null;

        fields.forEach(field => {
            const validation = this.validateField(field, this.parseValidationRules(field));
            
            if (!validation.isValid) {
                isFormValid = false;
                if (!firstInvalidField) {
                    firstInvalidField = field;
                }
                this.showFieldError(field, validation.message);
                this.setFieldState(field, 'error');
            } else {
                this.clearFieldError(field);
                this.setFieldState(field, 'valid');
            }
        });

        // Actualizar estado del formulario
        formState.isValid = isFormValid;
        formState.submitAttempts++;

        if (!isFormValid) {
            event.preventDefault();
            
            // Mostrar resumen de errores
            this.showFormErrorSummary(form, fields);
            
            // Enfocar primer campo inválido
            if (firstInvalidField) {
                firstInvalidField.focus();
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Vibración en móvil si está disponible
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }
            
            return false;
        }

        // Deshabilitar botón de submit para prevenir doble envío
        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) {
            this.setSubmitButtonState(submitButton, 'loading');
        }

        return true;
    }

    /**
     * Crear contenedor de feedback para campo
     */
    createFieldFeedback(field) {
        let feedbackContainer = field.parentNode.querySelector('.field-feedback');
        
        if (!feedbackContainer) {
            feedbackContainer = document.createElement('div');
            feedbackContainer.className = 'field-feedback';
            feedbackContainer.setAttribute('aria-live', 'polite');
            field.parentNode.appendChild(feedbackContainer);
        }
        
        field.feedbackContainer = feedbackContainer;
    }

    /**
     * Mostrar error de campo
     */
    showFieldError(field, message) {
        const feedbackContainer = field.feedbackContainer;
        
        // Mensaje de error
        let errorElement = feedbackContainer.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');
            feedbackContainer.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Icono de error
        let errorIcon = field.parentNode.querySelector('.field-error-icon');
        if (!errorIcon) {
            errorIcon = document.createElement('i');
            errorIcon.className = 'field-error-icon fas fa-exclamation-circle';
            field.parentNode.appendChild(errorIcon);
        }
        
        // Estados visuales
        this.setFieldState(field, 'error');
    }

    /**
     * Limpiar error de campo
     */
    clearFieldError(field) {
        const feedbackContainer = field.feedbackContainer;
        const errorElement = feedbackContainer?.querySelector('.error-message');
        const errorIcon = field.parentNode?.querySelector('.field-error-icon');
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        if (errorIcon) {
            errorIcon.remove();
        }
    }

    /**
     * Establecer estado visual del campo
     */
    setFieldState(field, state) {
        // Remover estados anteriores
        field.classList.remove('valid', 'invalid', 'empty', 'loading');
        
        // Agregar nuevo estado
        field.classList.add(state);
        
        // Actualizar ARIA attributes
        field.setAttribute('aria-invalid', state === 'error' ? 'true' : 'false');
        field.setAttribute('aria-describedby', field.id ? `${field.id}-feedback` : '');
    }

    /**
     * Agregar indicadores visuales al campo
     */
    addFieldIndicators(field) {
        // Indicador de carga
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'field-loading-indicator';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        field.parentNode.appendChild(loadingIndicator);
        
        field.loadingIndicator = loadingIndicator;
    }

    /**
     * Mostrar resumen de validación
     */
    showFieldValidationSummary(field) {
        const feedbackContainer = field.feedbackContainer;
        
        // Indicador de fortaleza de contraseña
        if (field.type === 'password') {
            let strengthIndicator = feedbackContainer.querySelector('.password-strength');
            if (!strengthIndicator) {
                strengthIndicator = document.createElement('div');
                strengthIndicator.className = 'password-strength';
                feedbackContainer.appendChild(strengthIndicator);
            }
            
            const strength = this.validators.password.strength(field.value);
            this.updatePasswordStrengthIndicator(strengthIndicator, strength);
        }
    }

    /**
     * Actualizar indicador de fortaleza de contraseña
     */
    updatePasswordStrengthIndicator(indicator, strength) {
        const levels = ['muy débil', 'débil', 'aceptable', 'fuerte', 'muy fuerte'];
        const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];
        
        indicator.textContent = `Fortaleza: ${levels[strength]}`;
        indicator.style.color = colors[strength];
        indicator.style.fontWeight = '600';
        indicator.style.fontSize = '0.875rem';
        indicator.style.marginTop = '0.5rem';
    }

    /**
     * Mostrar resumen de errores del formulario
     */
    showFormErrorSummary(form, fields) {
        let summaryContainer = form.querySelector('.form-error-summary');
        
        if (!summaryContainer) {
            summaryContainer = document.createElement('div');
            summaryContainer.className = 'form-error-summary';
            summaryContainer.setAttribute('role', 'alert');
            
            const title = document.createElement('h4');
            title.textContent = 'Por favor corrige los siguientes errores:';
            summaryContainer.appendChild(title);
            
            const errorList = document.createElement('ul');
            errorList.className = 'error-list';
            summaryContainer.appendChild(errorList);
            
            form.insertBefore(summaryContainer, form.firstChild);
        }
        
        // Actualizar lista de errores
        const errorList = summaryContainer.querySelector('.error-list');
        errorList.innerHTML = '';
        
        fields.forEach(field => {
            const validation = this.validateField(field, this.parseValidationRules(field));
            if (!validation.isValid) {
                const li = document.createElement('li');
                li.textContent = `${field.getAttribute('data-label') || field.name}: ${validation.message}`;
                errorList.appendChild(li);
            }
        });
    }

    /**
     * Agregar indicador de estado al formulario
     */
    addFormStatusIndicator(form) {
        let statusIndicator = form.querySelector('.form-status-indicator');
        
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.className = 'form-status-indicator';
            form.insertBefore(statusIndicator, form.firstChild);
        }
        
        form.statusIndicator = statusIndicator;
    }

    /**
     * Establecer estado del botón de submit
     */
    setSubmitButtonState(button, state) {
        button.classList.remove('loading', 'success', 'error', 'disabled');
        button.classList.add(state);
        
        switch (state) {
            case 'loading':
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
                break;
            case 'success':
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-check"></i> Enviado';
                setTimeout(() => {
                    button.classList.remove('success');
                    button.innerHTML = 'Enviar';
                }, 2000);
                break;
            case 'error':
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-exclamation"></i> Reintentar';
                setTimeout(() => {
                    button.classList.remove('error');
                    button.innerHTML = 'Enviar';
                }, 3000);
                break;
            default:
                button.disabled = false;
                button.innerHTML = 'Enviar';
        }
    }

    /**
     * Validar formulario completo
     */
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return { isValid: false, errors: ['Formulario no encontrado'] };
        
        const fields = form.querySelectorAll('[data-validate]');
        const errors = [];
        let isValid = true;
        
        fields.forEach(field => {
            const validation = this.validateField(field, this.parseValidationRules(field));
            if (!validation.isValid) {
                isValid = false;
                errors.push({
                    field: field.name || field.id,
                    message: validation.message
                });
            }
        });
        
        return { isValid, errors };
    }

    /**
     * Limpiar validaciones de un formulario
     */
    clearFormValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const fields = form.querySelectorAll('[data-validate]');
        fields.forEach(field => {
            this.clearFieldError(field);
            this.setFieldState(field, 'empty');
        });
        
        // Limpiar resumen de errores
        const summaryContainer = form.querySelector('.form-error-summary');
        if (summaryContainer) {
            summaryContainer.remove();
        }
    }
}

// =============================================
// ESTILOS CSS PARA VALIDACIÓN
// =============================================

const validationStyles = `
.field-feedback {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.4;
}

.error-message {
    color: #dc2626;
    display: none;
    padding: 0.5rem;
    background: rgba(220, 38, 38, 0.1);
    border-left: 3px solid #dc2626;
    border-radius: 0 0.375rem 0.375rem 0;
    animation: slideDown 0.3s ease-out;
}

.field-error-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #dc2626;
    font-size: 1rem;
    pointer-events: none;
    animation: fadeIn 0.3s ease-out;
}

.field-loading-indicator {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #3b82f6;
    font-size: 1rem;
    pointer-events: none;
    display: none;
}

.form-status-indicator {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 0.5rem;
    border-left: 4px solid #eab308;
    background: rgba(234, 179, 8, 0.1);
    animation: slideDown 0.3s ease-out;
}

.form-error-summary {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
}

.form-error-summary h4 {
    color: #dc2626;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
}

.error-list {
    margin: 0;
    padding-left: 1rem;
    color: #dc2626;
}

.error-list li {
    margin-bottom: 0.25rem;
    list-style-position: inside;
}

.password-strength {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
}

/* Estados de campo */
.valid {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.invalid {
    border-color: #dc2626 !important;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.empty {
    border-color: #e5e7eb;
}

.loading {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Estados de botón */
.loading {
    opacity: 0.7;
    cursor: not-allowed;
}

.success {
    background: #10b981 !important;
    border-color: #10b981 !important;
}

.error {
    background: #dc2626 !important;
    border-color: #dc2626 !important;
}

.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Animaciones */
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
    .field-feedback {
        font-size: 0.8rem;
    }
    
    .form-error-summary {
        padding: 0.75rem;
    }
    
    .error-message {
        padding: 0.375rem;
        font-size: 0.8rem;
    }
}
`;

// Agregar estilos al DOM si no existen
if (!document.querySelector('#validation-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'validation-styles';
    styleElement.textContent = validationStyles;
    document.head.appendChild(styleElement);
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

window.LaboriaFormValidation = new FormValidationSystem();

console.log('📝 Sistema de Validación de Formularios inicializado:', {
    validators: Object.keys(window.LaboriaFormValidation.validators),
    features: ['Realtime validation', 'Visual feedback', 'Error summaries', 'Accessibility support']
});
