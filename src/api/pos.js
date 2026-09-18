import api from './axios'

export const crearVenta = (datos) => api.post('/ventas', datos)
export const getVentaPorId = (id) => api.get(`/ventas/${id}`)
export const getVentasHoy = (pagina = 0) => api.get(`/ventas/hoy?page=${pagina}&size=50`)
export const anularVenta = (id, razon) => api.post(`/ventas/${id}/anular`, { razon })
export const descargarFacturaPdf = (ventaId) => api.get(`/ventas/${ventaId}/factura`, { responseType: 'blob' })