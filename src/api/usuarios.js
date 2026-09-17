import api from './axios'

export const getUsuarios = () => api.get('/usuarios')
export const crearUsuario = (datos) => api.post('/usuarios', datos)
export const actualizarPermisos = (id, datos) => api.patch(`/usuarios/${id}/permisos`, datos)
export const desactivarUsuario = (id) => api.delete(`/usuarios/${id}`)
export const reactivarUsuario = (id) => api.patch(`/usuarios/${id}/reactivar`)
export const cambiarContrasena = (id, datos) => api.patch(`/usuarios/${id}/contrasena`, datos)
export const solicitarCreacionDueno = (datos) => api.post('/usuarios/solicitar-creacion-dueno', datos)
export const confirmarCreacionDueno = (datos) => api.post('/usuarios/confirmar-creacion-dueno', datos)