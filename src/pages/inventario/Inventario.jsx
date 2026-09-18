import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProductos, buscarProductos, eliminarProducto, ajustarStock } from '../../api/inventario'
import { formatCOP } from '../../utils/formato'
import { Search, Plus, Trash2, Edit2, AlertTriangle, BarChart3, Package, SlidersHorizontal } from 'lucide-react'
import ModalProducto from './ModalProducto'
import ModalKardex from './ModalKardex'
import ModalAjusteStock from './ModalAjusteStock'

function estadoStock(stock, minimo) {
  if (stock === 0) return { label: 'Agotado', dot: 'bg-red-500', texto: 'text-red-700 dark:text-red-300', fondo: 'bg-red-100 dark:bg-red-500/20', borde: 'border-l-red-500' }
  if (stock <= minimo) return { label: 'Stock bajo', dot: 'bg-yellow-500', texto: 'text-yellow-700 dark:text-yellow-300', fondo: 'bg-yellow-100 dark:bg-yellow-500/20', borde: 'border-l-yellow-500' }
  return { label: 'Normal', dot: 'bg-green-500', texto: 'text-green-700 dark:text-green-300', fondo: 'bg-green-100 dark:bg-green-500/20', borde: 'border-l-transparent' }
}

function BadgeStock({ stock, minimo }) {
  const e = estadoStock(stock, minimo)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${e.fondo} ${e.texto}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
      {e.label}
    </span>
  )
}

export default function Inventario() {
  const queryClient = useQueryClient()
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(0)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)
  const [productoKardex, setProductoKardex] = useState(null)
  const [productoAjuste, setProductoAjuste] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: busqueda.length >= 2 ? ['productos-busqueda', busqueda] : ['productos', pagina],
    queryFn: () =>
      busqueda.length >= 2
        ? buscarProductos(busqueda).then((r) => ({ content: r.data.datos, totalPages: 1 }))
        : getProductos(pagina).then((r) => r.data.datos),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const { mutate: eliminar } = useMutation({
    mutationFn: eliminarProducto,
    onSuccess: () => queryClient.invalidateQueries(['productos']),
  })

  const productos = data?.content || []
  const totalPaginas = data?.totalPages || 1

  const handleEditar = (producto) => { setProductoEditando(producto); setModalAbierto(true) }
  const handleNuevo = () => { setProductoEditando(null); setModalAbierto(true) }
  const handleEliminar = (id, nombre) => {
    if (confirm(`¿Desactivar el producto "${nombre}"?`)) eliminar(id)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-heading">Inventario</h1>
          <p className="text-muted text-base mt-1">Gestión de productos y stock</p>
        </div>
        <button onClick={handleNuevo}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input type="text" placeholder="Buscar por nombre o código..."
          value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(0) }}
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-heading placeholder-gray-400 dark:placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-muted">No se encontraron productos</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Producto</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Código</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Categoría</th>
                <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Precio venta</th>
                <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Stock</th>
                <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {productos.map((p) => {
                const e = estadoStock(p.stockActual, p.stockMinimo)
                return (
                <tr key={p.id} className={`border-l-2 ${e.borde} hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package size={16} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-heading text-sm">{p.nombre}</p>
                        {p.descripcion && <p className="text-xs text-muted truncate max-w-48">{p.descripcion}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted font-mono">{p.codigo}</td>
                  <td className="px-6 py-4 text-sm text-heading">{p.categoriaNombre || '—'}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-heading">{formatCOP(p.precioVentaDetal)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {p.stockActual <= p.stockMinimo && p.stockActual > 0 && (
                        <AlertTriangle size={14} className="text-yellow-500" />
                      )}
                      <span className={`font-semibold text-sm ${p.stockActual === 0 ? 'text-red-600 dark:text-red-400' : p.stockActual <= p.stockMinimo ? 'text-yellow-600 dark:text-yellow-400' : 'text-heading'}`}>
                        {p.stockActual}
                      </span>
                      <span className="text-xs text-muted">/ mín {p.stockMinimo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <BadgeStock stock={p.stockActual} minimo={p.stockMinimo} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => handleEditar(p)} title="Editar"
                        className="p-1.5 text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => setProductoAjuste(p)} title="Ajustar stock"
                        className="p-1.5 text-muted hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors">
                        <SlidersHorizontal size={15} />
                      </button>
                      <button onClick={() => setProductoKardex(p)} title="Ver kardex"
                        className="p-1.5 text-muted hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors">
                        <BarChart3 size={15} />
                      </button>
                      <button onClick={() => handleEliminar(p.id, p.nombre)} title="Desactivar"
                        className="p-1.5 text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {!busqueda && totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={pagina === 0}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 text-heading rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">
            Anterior
          </button>
          <span className="text-sm text-muted">Página {pagina + 1} de {totalPaginas}</span>
          <button onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))} disabled={pagina >= totalPaginas - 1}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 text-heading rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">
            Siguiente
          </button>
        </div>
      )}

      {modalAbierto && (
        <ModalProducto producto={productoEditando} onClose={() => setModalAbierto(false)}
          onSuccess={() => { setModalAbierto(false); queryClient.invalidateQueries(['productos']) }} />
      )}
      {productoKardex && (
        <ModalKardex producto={productoKardex} onClose={() => setProductoKardex(null)} />
      )}
      {productoAjuste && (
        <ModalAjusteStock
          producto={productoAjuste}
          onClose={() => setProductoAjuste(null)}
          onSuccess={() => {
            setProductoAjuste(null)
            queryClient.invalidateQueries(['productos'])
          }}
        />
      )}
    </div>
  )
}