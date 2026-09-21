import api from './axios'

export const getProductos = (pagina = 0, tamano = 20) =>
  api.get(`/inventario/productos?page=${pagina}&size=${tamano}`)

export const buscarProductos = (termino) =>
  api.get(`/inventario/productos/buscar?q=${termino}`)

export const identificarProducto = (codigo) =>
  api.get(`/inventario/productos/identificar?codigo=${encodeURIComponent(codigo)}`)

export const getHistorialCodigos = (id) =>
  api.get(`/inventario/productos/${id}/historial-codigos`)

export const crearProducto = (datos) =>
  api.post('/inventario/productos', datos)

export const actualizarProducto = (id, datos) =>
  api.put(`/inventario/productos/${id}`, datos)

export const eliminarProducto = (id) =>
  api.delete(`/inventario/productos/${id}`)

export const getCategorias = () =>
  api.get('/inventario/categorias')

export const ajustarStock = (id, datos) =>
  api.post(`/inventario/productos/${id}/ajustar-stock`, datos)

export const getEntradas = (pagina = 0) =>
  api.get(`/inventario/entradas?page=${pagina}&size=20`)

export const registrarEntrada = (datos) =>
  api.post('/inventario/entradas', datos)

export const getProveedores = () =>
  api.get('/inventario/proveedores')

export const crearProveedor = (datos) =>
  api.post('/inventario/proveedores', datos)

export const actualizarProveedor = (id, datos) =>
  api.put(`/inventario/proveedores/${id}`, datos)

export const desactivarProveedor = (id) =>
  api.delete(`/inventario/proveedores/${id}`)