import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVentaPorId, anularVenta } from '../../api/pos'
import { formatCOP, formatFecha } from '../../utils/formato'
import { X, Package, ShoppingCart, AlertTriangle } from 'lucide-react'
import useAuthStore from '../../store/authStore'

export default function ModalDetalleVenta({ ventaId, onClose }) {
  const queryClient = useQueryClient()
  const usuario = useAuthStore((s) => s.usuario)
  const esDueno = usuario?.rol === 'DUENO'

  const [confirmandoAnulacion, setConfirmandoAnulacion] = useState(false)
  const [razon, setRazon] = useState('')
  const [error, setError] = useState('')

  const { data: venta, isLoading } = useQuery({
    queryKey: ['venta-detalle', ventaId],
    queryFn: () => getVentaPorId(ventaId).then((r) => r.data.datos),
  })

  const { mutate: anular, isPending: anulando } = useMutation({
    mutationFn: () => anularVenta(ventaId, razon),
    onSuccess: () => {
      queryClient.invalidateQueries(['venta-detalle', ventaId])
      queryClient.invalidateQueries(['caja-actual'])
      queryClient.invalidateQueries(['historial-caja'])
      queryClient.invalidateQueries(['reporte-ventas'])
      setConfirmandoAnulacion(false)
      setRazon('')
      setError('')
    },
    onError: (err) => setError(err.response?.data?.mensaje || 'Error al anular la venta'),
  })

  const handleAnular = () => {
    if (!razon.trim()) { setError('La razón es obligatoria'); return }
    anular()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-heading">Venta #{ventaId}</h2>
              {venta && <p className="text-sm text-muted">{formatFecha(venta.creadoEn)}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-heading">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : venta && (
            <>
              {/* Estado anulada */}
              {venta.estado === 'ANULADA' && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  <p className="font-semibold mb-1">⚠️ Venta anulada</p>
                  {venta.razonAnulacion && <p>{venta.razonAnulacion}</p>}
                </div>
              )}

              {/* Info general */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted mb-1">Cliente</p>
                  <p className="font-medium text-heading">{venta.nombreCliente || 'Ocasional'}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Método de pago</p>
                  <p className="font-medium text-heading">{venta.metodoPago}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Estado</p>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    venta.estado === 'COMPLETADA'
                      ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                  }`}>
                    {venta.estado}
                  </span>
                </div>
                <div>
                  <p className="text-muted mb-1">Puntos ganados</p>
                  <p className="font-medium text-yellow-600 dark:text-yellow-400">⭐ {venta.puntosGanados}</p>
                </div>
              </div>

              {/* Productos */}
              <div>
                <p className="text-sm font-semibold text-heading mb-2">Productos vendidos</p>
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="text-left text-xs font-semibold text-muted uppercase px-3 py-2">Producto</th>
                      <th className="text-center text-xs font-semibold text-muted uppercase px-3 py-2">Cant.</th>
                      <th className="text-right text-xs font-semibold text-muted uppercase px-3 py-2">Precio</th>
                      <th className="text-right text-xs font-semibold text-muted uppercase px-3 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                    {venta.items?.map((item) => (
                      <tr key={item.productoId} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Package size={13} className="text-indigo-500 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-heading">{item.nombreProducto}</p>
                              <p className="text-xs text-muted font-mono">{item.codigoProducto}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-sm text-heading">{item.cantidad}</td>
                        <td className="px-3 py-2 text-right text-sm text-heading">{formatCOP(item.precioUnitarioCop)}</td>
                        <td className="px-3 py-2 text-right text-sm font-medium text-heading">{formatCOP(item.subtotalCop)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Totales */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-heading">{formatCOP(venta.subtotalCop)}</span>
                </div>
                {venta.descuentoCop > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>Descuento</span>
                    <span>-{formatCOP(venta.descuentoCop)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-gray-200 dark:border-slate-600 pt-2 text-heading">
                  <span>Total</span>
                  <span>{formatCOP(venta.totalCop)}</span>
                </div>
                {venta.vueltoCop > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Vuelto</span>
                    <span>{formatCOP(venta.vueltoCop)}</span>
                  </div>
                )}
              </div>

              {/* Botón anular — solo dueño y solo si está completada */}
              {esDueno && venta.estado === 'COMPLETADA' && !confirmandoAnulacion && (
                <button
                  onClick={() => setConfirmandoAnulacion(true)}
                  className="w-full py-2 border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <AlertTriangle size={15} />
                  Anular venta
                </button>
              )}

              {/* Formulario confirmación anulación */}
              {confirmandoAnulacion && (
                <div className="border border-red-200 dark:border-red-500/30 rounded-lg p-4 space-y-3 bg-red-50 dark:bg-red-500/10">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertTriangle size={15} />
                    Confirmar anulación
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Se reintegrará el stock de todos los productos. Esta acción no se puede deshacer.
                  </p>
                  <textarea
                    value={razon}
                    onChange={(e) => setRazon(e.target.value)}
                    placeholder="Razón de la anulación..."
                    rows={2}
                    className="w-full px-3 py-2 border border-red-300 dark:border-red-500/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-white dark:bg-slate-800 text-heading"
                  />
                  {error && <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setConfirmandoAnulacion(false); setRazon(''); setError('') }}
                      className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm hover:bg-white dark:hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAnular}
                      disabled={anulando}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {anulando ? 'Anulando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}