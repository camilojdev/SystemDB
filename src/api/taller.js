import api from './axios'

export const getOrdenes = (pagina = 0, historial = false) =>
  api.get(historial
    ? `/taller/ordenes/historial?page=${pagina}&size=20`
    : `/taller/ordenes?page=${pagina}&size=20`)

export const buscarOrdenes = (termino) =>
  api.get(`/taller/ordenes/buscar?q=${termino}`)

export const getOrdenPorId = (id) =>
  api.get(`/taller/ordenes/${id}`)

export const crearOrden = (datos) =>
  api.post('/taller/ordenes', datos)

export const cambiarEstado = (id, estado) =>
  api.patch(`/taller/ordenes/${id}/estado`, { nuevoEstado: estado })

export const agregarServicio = (id, datos) =>
  api.post(`/taller/ordenes/${id}/servicios`, datos)

export const agregarRepuesto = (id, datos) =>
  api.post(`/taller/ordenes/${id}/repuestos`, datos)

export const descargarPlanillaOt = (id) =>
  api.get(`/taller/ordenes/${id}/planilla`, { responseType: 'blob' })