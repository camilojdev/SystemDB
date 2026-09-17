import api from './axios'

export const obtenerConfiguracionNegocio = () => api.get('/configuracion-negocio')

export const actualizarConfiguracionNegocio = (datos) => api.put('/configuracion-negocio', datos)

export const subirLogoNegocio = (archivo) => {
  const formData = new FormData()
  formData.append('archivo', archivo)
  return api.post('/configuracion-negocio/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}