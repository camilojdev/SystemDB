import api from './axios'

export const getPlantillasEtiqueta = () => api.get('/inventario/etiquetas/plantillas')

export const actualizarPlantillaEtiqueta = (codigo, datos) =>
  api.put(`/inventario/etiquetas/plantillas/${codigo}`, datos)

export const generarEtiquetasPdf = (datos) =>
  api.post('/inventario/etiquetas/generar', datos, { responseType: 'blob' })