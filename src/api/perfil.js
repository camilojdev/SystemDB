import api from './axios'

export const obtenerPerfil = () => api.get('/perfil')

export const actualizarNombre = (nombreCompleto) =>
  api.patch('/perfil/nombre', { nombreCompleto })

export const subirFotoPerfil = (archivo) => {
  const formData = new FormData()
  formData.append('archivo', archivo)
  return api.post('/perfil/foto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const eliminarFotoPerfil = () => api.delete('/perfil/foto')

export const cambiarContrasenaConActual = (datos) => api.patch('/perfil/contrasena', datos)

export const solicitarCodigoCambioContrasena = () => api.post('/perfil/contrasena/solicitar-codigo')

export const confirmarCambioContrasenaConCodigo = (datos) =>
  api.post('/perfil/contrasena/confirmar-codigo', datos)

export const solicitarCambioCorreo = (correoNuevo) =>
  api.post('/perfil/correo/solicitar-cambio', { correoNuevo })

export const confirmarCambioCorreo = (codigo) =>
  api.post('/perfil/correo/confirmar-cambio', { codigo })