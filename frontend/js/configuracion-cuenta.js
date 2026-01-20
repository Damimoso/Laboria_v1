/**
 * Configuración de Cuenta - Laboria Frontend
 * Maneja toda la lógica de configuración de cuenta de usuarios
 */

class ConfiguracionCuenta {
    constructor() {
        this.usuarioData = null;
        this.habilidadesTecnicas = [];
        this.habilidadesBlandas = [];
        this.idiomas = [];
        this.experiencia = [];
        this.educacion = [];
        
        this.init();
    }

    async init() {
        try {
            // Verificar autenticación
            await this.verificarAutenticacion();
            
            // Cargar datos del usuario
            await this.cargarDatosUsuario();
            
            // Inicializar event listeners
            this.initEventListeners();
            
            // Cargar experiencia y educación
            await this.cargarExperiencia();
            await this.cargarEducacion();
            
        } catch (error) {
            console.error('Error inicializando configuración:', error);
            this.mostrarError('Error al cargar la configuración');
        }
    }

    async verificarAutenticacion() {
        try {
            const response = await laboriaAPI.validarSesionUsuario();
            if (!response.success) {
                window.location.href = '/pages/index.html';
                return;
            }
            this.usuarioData = response.data.usuario;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            window.location.href = '/pages/index.html';
        }
    }

    async cargarDatosUsuario() {
        try {
            const response = await laboriaAPI.obtenerPerfilUsuario();
            if (response.success) {
                this.llenarFormularios(response.data.perfil);
            }
        } catch (error) {
            console.error('Error cargando datos del usuario:', error);
            // Fallback a localStorage
            this.cargarDatosDesdeLocalStorage();
        }
    }

    cargarDatosDesdeLocalStorage() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        this.usuarioData = userData;
        
        // Llenar formulario básico
        document.getElementById('bio').value = userData.bio || '';
        document.getElementById('telefono').value = userData.telefono || '';
        document.getElementById('ubicacion').value = userData.ubicacion || '';
    }

    llenarFormularios(perfil) {
        // Información Personal
        document.getElementById('bio').value = perfil.bio || '';
        document.getElementById('telefono').value = perfil.telefono || '';
        document.getElementById('ubicacion').value = perfil.ubicacion || '';
        document.getElementById('sitio_web').value = perfil.sitio_web || '';
        document.getElementById('linkedin_url').value = perfil.linkedin_url || '';
        document.getElementById('github_url').value = perfil.github_url || '';
        document.getElementById('disponibilidad').value = perfil.disponibilidad || 'disponible';
        document.getElementById('preferencia_trabajo').value = perfil.preferencia_trabajo || '';
        document.getElementById('salario_minimo').value = perfil.salario_minimo || '';
        document.getElementById('salario_maximo').value = perfil.salario_maximo || '';

        // Foto de perfil
        if (perfil.foto_perfil) {
            document.getElementById('currentPhoto').src = perfil.foto_perfil;
        }

        // Curriculum
        document.getElementById('titulo_profesional').value = perfil.titulo_profesional || '';
        document.getElementById('experiencia_total_anios').value = perfil.experiencia_total_anios || '';
        document.getElementById('nivel_educativo').value = perfil.nivel_educativo || '';
        document.getElementById('campo_estudio').value = perfil.campo_estudio || '';

        // Cargar arrays
        this.habilidadesTecnicas = perfil.habilidades_tecnicas || [];
        this.habilidadesBlandas = perfil.habilidades_blandas || [];
        this.idiomas = perfil.idiomas || [];

        // Mostrar habilidades e idiomas
        this.mostrarHabilidades();
        this.mostrarIdiomas();
    }

    initEventListeners() {
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.cambiarTab(e.target.dataset.tab));
        });

        // Formularios
        document.getElementById('informacionPersonalForm').addEventListener('submit', (e) => this.guardarInformacionPersonal(e));
        document.getElementById('curriculumForm').addEventListener('submit', (e) => this.guardarCurriculum(e));
        document.getElementById('cambiarContraseñaForm').addEventListener('submit', (e) => this.cambiarContraseña(e));

        // Foto de perfil
        document.getElementById('changePhotoBtn').addEventListener('click', () => {
            document.getElementById('photoInput').click();
        });

        document.getElementById('photoInput').addEventListener('change', (e) => this.subirFotoPerfil(e));

        // Habilidades
        document.querySelector('[data-type="tecnica"]').addEventListener('click', () => this.agregarHabilidad('tecnica'));
        document.querySelector('[data-type="blanda"]').addEventListener('click', () => this.agregarHabilidad('blanda'));

        // Idiomas
        document.querySelector('.add-language-btn').addEventListener('click', () => this.agregarIdioma());

        // Experiencia y Educación
        document.querySelector('.add-experience-btn').addEventListener('click', () => this.abrirModalExperiencia());
        document.querySelector('.add-education-btn').addEventListener('click', () => this.abrirModalEducacion());

        // Modales
        document.getElementById('experienciaForm').addEventListener('submit', (e) => this.guardarExperiencia(e));
        document.getElementById('educacionForm').addEventListener('submit', (e) => this.guardarEducacion(e));

        // Cerrar modales
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => this.cerrarModal(e.target.closest('.modal')));
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.cerrarSesion());

        // Validación de contraseña
        document.getElementById('contraseña_nueva').addEventListener('input', (e) => this.validarFortalezaContraseña(e.target.value));

        // Validación de fechas
        document.getElementById('exp_actual').addEventListener('change', (e) => {
            const fechaFin = document.getElementById('exp_fecha_fin');
            fechaFin.disabled = e.target.checked;
            if (e.target.checked) {
                fechaFin.value = '';
            }
        });

        document.getElementById('edu_actual').addEventListener('change', (e) => {
            const fechaFin = document.getElementById('edu_fecha_fin');
            fechaFin.disabled = e.target.checked;
            if (e.target.checked) {
                fechaFin.value = '';
            }
        });
    }

    cambiarTab(tabId) {
        // Ocultar todos los tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar tab seleccionado
        document.getElementById(tabId).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    }

    async guardarInformacionPersonal(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // Validaciones
            if (data.salario_minimo && data.salario_maximo && parseFloat(data.salario_minimo) > parseFloat(data.salario_maximo)) {
                this.mostrarError('El salario mínimo no puede ser mayor al máximo');
                return;
            }

            this.mostrarLoading(true);

            const response = await laboriaAPI.actualizarPerfilUsuario(data);
            
            if (response.success) {
                this.mostrarExito('Información personal actualizada exitosamente');
                // Actualizar datos locales
                Object.assign(this.usuarioData, data);
                localStorage.setItem('userData', JSON.stringify(this.usuarioData));
            } else {
                throw new Error(response.message || 'Error al actualizar información');
            }

        } catch (error) {
            console.error('Error guardando información personal:', error);
            this.mostrarError(error.message || 'Error al guardar la información');
        } finally {
            this.mostrarLoading(false);
        }
    }

    async guardarCurriculum(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // Agregar arrays
            data.habilidades_tecnicas = this.habilidadesTecnicas;
            data.habilidades_blandas = this.habilidadesBlandas;
            data.idiomas = this.idiomas;

            this.mostrarLoading(true);

            const response = await fetch('/api/usuario/perfil/curriculum', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${laboriaAPI.token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.mostrarExito('Curriculum actualizado exitosamente');
            } else {
                throw new Error(result.message || 'Error al actualizar curriculum');
            }

        } catch (error) {
            console.error('Error guardando curriculum:', error);
            this.mostrarError(error.message || 'Error al guardar el curriculum');
        } finally {
            this.mostrarLoading(false);
        }
    }

    async cambiarContraseña(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // Validar que las contraseñas coincidan
            if (data.contraseña_nueva !== data.confirmar_contraseña) {
                this.mostrarError('Las contraseñas nuevas no coinciden');
                return;
            }

            this.mostrarLoading(true);

            const response = await fetch('/api/usuario/contraseña', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${laboriaAPI.token}`
                },
                body: JSON.stringify({
                    contraseña_actual: data.contraseña_actual,
                    contraseña_nueva: data.contraseña_nueva,
                    confirmar_contraseña: data.confirmar_contraseña
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.mostrarExito('Contraseña actualizada exitosamente');
                e.target.reset();
            } else {
                throw new Error(result.message || 'Error al cambiar contraseña');
            }

        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            this.mostrarError(error.message || 'Error al cambiar la contraseña');
        } finally {
            this.mostrarLoading(false);
        }
    }

    async subirFotoPerfil(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Validar archivo
            if (!file.type.startsWith('image/')) {
                this.mostrarError('Solo se permiten archivos de imagen');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                this.mostrarError('El archivo es demasiado grande. Máximo 5MB');
                return;
            }

            this.mostrarLoading(true);

            const formData = new FormData();
            formData.append('foto', file);

            const response = await fetch('/api/usuario/foto-perfil', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${laboriaAPI.token}`
                },
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                // Actualizar foto mostrada
                document.getElementById('currentPhoto').src = result.data.url_imagen;
                this.mostrarExito('Foto de perfil actualizada exitosamente');
            } else {
                throw new Error(result.message || 'Error al subir foto');
            }

        } catch (error) {
            console.error('Error subiendo foto de perfil:', error);
            this.mostrarError(error.message || 'Error al subir la foto');
        } finally {
            this.mostrarLoading(false);
            // Limpiar input
            e.target.value = '';
        }
    }

    agregarHabilidad(tipo) {
        const input = tipo === 'tecnica' ? 
            document.getElementById('habilidades_tecnicas_input') : 
            document.getElementById('habilidades_blandas_input');
        
        const valor = input.value.trim();
        if (!valor) return;

        const array = tipo === 'tecnica' ? this.habilidadesTecnicas : this.habilidadesBlandas;
        
        if (array.includes(valor)) {
            this.mostrarError('Esta habilidad ya está agregada');
            return;
        }

        array.push(valor);
        this.mostrarHabilidades();
        input.value = '';
    }

    mostrarHabilidades() {
        // Mostrar habilidades técnicas
        const containerTecnicas = document.getElementById('habilidades_tecnicas_list');
        containerTecnicas.innerHTML = this.habilidadesTecnicas.map(habilidad => 
            `<span class="skill-tag">
                ${habilidad}
                <button type="button" class="remove-skill" data-skill="${habilidad}" data-type="tecnica">
                    <i class="fas fa-times"></i>
                </button>
            </span>`
        ).join('');

        // Mostrar habilidades blandas
        const containerBlandas = document.getElementById('habilidades_blandas_list');
        containerBlandas.innerHTML = this.habilidadesBlandas.map(habilidad => 
            `<span class="skill-tag">
                ${habilidad}
                <button type="button" class="remove-skill" data-skill="${habilidad}" data-type="blanda">
                    <i class="fas fa-times"></i>
                </button>
            </span>`
        ).join('');

        // Event listeners para eliminar
        containerTecnicas.querySelectorAll('.remove-skill').forEach(btn => {
            btn.addEventListener('click', (e) => this.eliminarHabilidad(e.target.dataset.skill, e.target.dataset.type));
        });

        containerBlandas.querySelectorAll('.remove-skill').forEach(btn => {
            btn.addEventListener('click', (e) => this.eliminarHabilidad(e.target.dataset.skill, e.target.dataset.type));
        });
    }

    eliminarHabilidad(habilidad, tipo) {
        const array = tipo === 'tecnica' ? this.habilidadesTecnicas : this.habilidadesBlandas;
        const index = array.indexOf(habilidad);
        if (index > -1) {
            array.splice(index, 1);
            this.mostrarHabilidades();
        }
    }

    agregarIdioma() {
        const idiomaSelect = document.getElementById('idioma_select');
        const nivelSelect = document.getElementById('nivel_idioma');
        
        const idioma = idiomaSelect.value;
        const nivel = nivelSelect.value;
        
        if (!idioma || !nivel) {
            this.mostrarError('Selecciona idioma y nivel');
            return;
        }

        // Verificar si ya existe
        const existe = this.idiomas.find(item => item.idioma === idioma);
        if (existe) {
            this.mostrarError('Este idioma ya está agregado');
            return;
        }

        this.idiomas.push({ idioma, nivel });
        this.mostrarIdiomas();
        
        // Reset selects
        idiomaSelect.value = '';
        nivelSelect.value = '';
    }

    mostrarIdiomas() {
        const container = document.getElementById('idiomas_list');
        container.innerHTML = this.idiomas.map((item, index) => 
            `<span class="language-tag">
                ${item.idioma} - ${item.nivel}
                <button type="button" class="remove-language" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </span>`
        ).join('');

        // Event listeners para eliminar
        container.querySelectorAll('.remove-language').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.idiomas.splice(index, 1);
                this.mostrarIdiomas();
            });
        });
    }

    async cargarExperiencia() {
        try {
            const response = await fetch('/api/usuario/experiencia', {
                headers: {
                    'Authorization': `Bearer ${laboriaAPI.token}`
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.experiencia = result.data.experiencia;
                this.mostrarExperiencia();
            }

        } catch (error) {
            console.error('Error cargando experiencia:', error);
        }
    }

    mostrarExperiencia() {
        const container = document.getElementById('experienciaList');
        
        if (this.experiencia.length === 0) {
            container.innerHTML = '<p class="no-data">No hay experiencia agregada</p>';
            return;
        }

        container.innerHTML = this.experiencia.map(exp => 
            `<div class="experience-item">
                <div class="experience-header">
                    <h4>${exp.puesto}</h4>
                    <div class="experience-actions">
                        <button class="btn-edit" data-id="${exp.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" data-id="${exp.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="experience-details">
                    <p><strong>Empresa:</strong> ${exp.empresa}</p>
                    <p><strong>Periodo:</strong> ${this.formatearFecha(exp.fecha_inicio)} - ${exp.actual ? 'Actualidad' : this.formatearFecha(exp.fecha_fin)}</p>
                    <p><strong>Tipo:</strong> ${exp.tipo_empleo} | <strong>Modalidad:</strong> ${exp.modalidad || 'No especificada'}</p>
                    ${exp.descripcion ? `<p>${exp.descripcion}</p>` : ''}
                </div>
            </div>`
        ).join('');

        // Event listeners
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.eliminarExperiencia(e.target.closest('.btn-delete').dataset.id));
        });
    }

    async cargarEducacion() {
        try {
            const response = await fetch('/api/usuario/educacion', {
                headers: {
                    'Authorization': `Bearer ${laboriaAPI.token}`
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.educacion = result.data.educacion;
                this.mostrarEducacion();
            }

        } catch (error) {
            console.error('Error cargando educación:', error);
        }
    }

    mostrarEducacion() {
        const container = document.getElementById('educacionList');
        
        if (this.educacion.length === 0) {
            container.innerHTML = '<p class="no-data">No hay educación agregada</p>';
            return;
        }

        container.innerHTML = this.educacion.map(edu => 
            `<div class="education-item">
                <div class="education-header">
                    <h4>${edu.titulo}</h4>
                    <div class="education-actions">
                        <button class="btn-edit" data-id="${edu.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" data-id="${edu.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="education-details">
                    <p><strong>Institución:</strong> ${edu.institucion}</p>
                    <p><strong>Periodo:</strong> ${this.formatearFecha(edu.fecha_inicio)} - ${edu.actual ? 'Actualidad' : this.formatearFecha(edu.fecha_fin)}</p>
                    <p><strong>Grado:</strong> ${edu.grado}</p>
                    ${edu.campo_estudio ? `<p><strong>Campo:</strong> ${edu.campo_estudio}</p>` : ''}
                    ${edu.descripcion ? `<p>${edu.descripcion}</p>` : ''}
                </div>
            </div>`
        ).join('');

        // Event listeners
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.eliminarEducacion(e.target.closest('.btn-delete').dataset.id));
        });
    }

    async guardarExperiencia(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // Convertir checkbox a boolean
            data.actual = formData.has('actual');

            this.mostrarLoading(true);

            const response = await fetch('/api/usuario/experiencia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${laboriaAPI.token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.mostrarExito('Experiencia agregada exitosamente');
                this.cerrarModal(document.getElementById('experienciaModal'));
                await this.cargarExperiencia();
                e.target.reset();
            } else {
                throw new Error(result.message || 'Error al agregar experiencia');
            }

        } catch (error) {
            console.error('Error guardando experiencia:', error);
            this.mostrarError(error.message || 'Error al guardar la experiencia');
        } finally {
            this.mostrarLoading(false);
        }
    }

    async guardarEducacion(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // Convertir checkbox a boolean
            data.actual = formData.has('actual');

            this.mostrarLoading(true);

            const response = await fetch('/api/usuario/educacion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${laboriaAPI.token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.mostrarExito('Educación agregada exitosamente');
                this.cerrarModal(document.getElementById('educacionModal'));
                await this.cargarEducacion();
                e.target.reset();
            } else {
                throw new Error(result.message || 'Error al agregar educación');
            }

        } catch (error) {
            console.error('Error guardando educación:', error);
            this.mostrarError(error.message || 'Error al guardar la educación');
        } finally {
            this.mostrarLoading(false);
        }
    }

    async eliminarExperiencia(id) {
        if (!confirm('¿Estás seguro de eliminar esta experiencia?')) return;

        try {
            this.mostrarLoading(true);

            const response = await fetch(`/api/usuario/experiencia/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${laboriaAPI.token}`
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.mostrarExito('Experiencia eliminada exitosamente');
                await this.cargarExperiencia();
            } else {
                throw new Error(result.message || 'Error al eliminar experiencia');
            }

        } catch (error) {
            console.error('Error eliminando experiencia:', error);
            this.mostrarError(error.message || 'Error al eliminar la experiencia');
        } finally {
            this.mostrarLoading(false);
        }
    }

    async eliminarEducacion(id) {
        if (!confirm('¿Estás seguro de eliminar esta educación?')) return;

        try {
            this.mostrarLoading(true);

            const response = await fetch(`/api/usuario/educacion/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${laboriaAPI.token}`
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.mostrarExito('Educación eliminada exitosamente');
                await this.cargarEducacion();
            } else {
                throw new Error(result.message || 'Error al eliminar educación');
            }

        } catch (error) {
            console.error('Error eliminando educación:', error);
            this.mostrarError(error.message || 'Error al eliminar la educación');
        } finally {
            this.mostrarLoading(false);
        }
    }

    abrirModalExperiencia() {
        document.getElementById('experienciaModal').style.display = 'block';
    }

    abrirModalEducacion() {
        document.getElementById('educacionModal').style.display = 'block';
    }

    cerrarModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async cerrarSesion() {
        try {
            await laboriaAPI.logoutUsuario();
            window.location.href = '/pages/index.html';
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            window.location.href = '/pages/index.html';
        }
    }

    validarFortalezaContraseña(contraseña) {
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        let strength = 0;
        
        // Longitud
        if (contraseña.length >= 8) strength++;
        if (contraseña.length >= 12) strength++;
        
        // Complejidad
        if (/[a-z]/.test(contraseña)) strength++;
        if (/[A-Z]/.test(contraseña)) strength++;
        if (/[0-9]/.test(contraseña)) strength++;
        if (/[^a-zA-Z0-9]/.test(contraseña)) strength++;

        // Actualizar barra
        const percentage = (strength / 6) * 100;
        strengthBar.style.width = `${percentage}%`;
        
        // Color y texto
        if (strength <= 2) {
            strengthBar.style.backgroundColor = '#ef4444';
            strengthText.textContent = 'Débil';
        } else if (strength <= 4) {
            strengthBar.style.backgroundColor = '#f59e0b';
            strengthText.textContent = 'Media';
        } else {
            strengthBar.style.backgroundColor = '#10b981';
            strengthText.textContent = 'Fuerte';
        }
    }

    formatearFecha(fecha) {
        if (!fecha) return '';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    mostrarLoading(show) {
        const loadingElements = document.querySelectorAll('.btn-primary');
        loadingElements.forEach(btn => {
            if (show) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            } else {
                btn.disabled = false;
                // Restaurar texto original (esto es simplificado)
                btn.innerHTML = btn.innerHTML.replace('<i class="fas fa-spinner fa-spin"></i> Procesando...', btn.innerHTML);
            }
        });
    }

    mostrarExito(mensaje) {
        if (window.UIGlobalFunctions?.showNotification) {
            window.UIGlobalFunctions.showNotification(mensaje, 'success');
        } else {
            alert(mensaje);
        }
    }

    mostrarError(mensaje) {
        if (window.UIGlobalFunctions?.showNotification) {
            window.UIGlobalFunctions.showNotification(mensaje, 'error');
        } else {
            alert(mensaje);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ConfiguracionCuenta();
});
