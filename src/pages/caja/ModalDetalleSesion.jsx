import { useQuery } from '@tanstack/react-query'
import { formatCOP, formatFecha } from '../../utils/formato'
import { X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import api from '../../api/axios'
import { useState } from 'react'
import ModalDetalleVenta from './ModalDetalleVenta'

const getSesionPorId = (id) =>
  api.get(`/caja/${id}`).then((r) => r.data.datos)

function FilaMovimiento({ mov }) {
  const [verVenta, setVerVenta] = useState(false)
  const esIngreso = ['VENTA', 'VENTA_EFECTIVO', 'VENTA_TRANSFERENCIA', 'APERTURA', 'ABONO_CREDITO'].includes(mov.tipo)
  const esAnulacion = mov.descripcion?.toLowerCase().includes('anulación') || 
                      mov.descripcion?.toLowerCase().includes('anulacion')
  const esVenta = ['VENTA', 'VENTA_EFECTIVO', 'VENTA_TRANSFERENCIA'].includes(mov.tipo) && mov.ventaId

  return (
    <>
      <div className={`flex items-start justify-between gap-3 py-2.5 border-b border-gray-50 dark:border-slate-700 last:border-0 ${esAnulacion ? 'bg-red-50 dark:bg-red-500/10' : ''}`}>
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${esAnulacion ? 'bg-red-200 dark:bg-red-500/30' : esIngreso ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
            {esIngreso && !esAnulacion
              ? <TrendingUp size={13} className="text-green-600 dark:text-green-400" />
              : <TrendingDown size={13} className="text-red-600 dark:text-red-400" />}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-medium break-words ${esAnulacion ? 'text-red-700 dark:text-red-400' : 'text-heading'}`}>
              {mov.descripcion}
            </p>
            {esVenta && !esAnulacion && (
              <button onClick={() => setVerVenta(true)}
                className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                Ver detalle
              </button>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {mov.registradoPor && <p className="text-xs text-blue-500 dark:text-blue-400">{mov.registradoPor}</p>}
              <p className="text-xs text-muted">{formatFecha(mov.creadoEn)}</p>
            </div>
          </div>
        </div>
        <span className={`text-sm font-semibold flex-shrink-0 whitespace-nowrap ${esAnulacion ? 'text-red-700 dark:text-red-400' : esIngreso ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {esIngreso && !esAnulacion ? '+' : '-'}{formatCOP(mov.montoCop)}
        </span>
      </div>
      {verVenta && <ModalDetalleVenta ventaId={mov.ventaId} onClose={() => setVerVenta(false)} />}
    </>
  )
}

export default function ModalDetalleSesion({ sesionId, onClose }) {
  const { data: sesion, isLoading } = useQuery({
    queryKey: ['sesion-detalle', sesionId],
    queryFn: () => getSesionPorId(sesionId),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-heading">Detalle de sesión</h2>
            {sesion && <p className="text-sm text-muted">{sesion.cajera} — {formatFecha(sesion.abiertaEn)}</p>}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-heading">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sesion && (
            <>
              {/* Resumen general */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Saldo inicial', valor: sesion.saldoInicialCop, color: 'text-heading' },
                  { label: 'Total ventas', valor: sesion.totalVentasCop, color: 'text-green-600 dark:text-green-400' },
                  { label: 'Gastos', valor: sesion.totalGastosCop, color: 'text-red-600 dark:text-red-400' },
                  { label: 'Saldo esperado', valor: sesion.saldoEsperadoCop, color: 'text-blue-600 dark:text-blue-400' },
                ].map((m) => (
                  <div key={m.label} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <p className="text-xs text-muted mb-1">{m.label}</p>
                    <p className={`text-lg font-bold ${m.color}`}>{formatCOP(m.valor)}</p>
                  </div>
                ))}
              </div>

              {/* Desglose por método */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 dark:bg-green-500/10 rounded-lg p-3">
                  <p className="text-xs text-muted mb-1">💵 Efectivo</p>
                  <p className="text-lg font-bold text-heading">{formatCOP(sesion.totalEfectivoCop)}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-3">
                  <p className="text-xs text-muted mb-1">🏦 Transferencia</p>
                  <p className="text-lg font-bold text-heading">{formatCOP(sesion.totalTransferenciaCop)}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-500/10 rounded-lg p-3">
                  <p className="text-xs text-muted mb-1">📋 Crédito</p>
                  <p className="text-lg font-bold text-heading">{formatCOP(sesion.totalCreditoCop)}</p>
                </div>
              </div>

              {/* Cierre */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Efectivo contado</span>
                  <span className="font-medium text-heading">{formatCOP(sesion.saldoFinalCop)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Saldo esperado</span>
                  <span className="font-medium text-heading">{formatCOP(sesion.saldoEsperadoCop)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-slate-600 pt-2">
                  <span className="font-semibold text-heading">Diferencia</span>
                  <span className={`font-bold ${sesion.diferenciaCop >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {sesion.diferenciaCop >= 0 ? '+' : ''}{formatCOP(sesion.diferenciaCop)}
                  </span>
                </div>
                {sesion.notasCierre && (
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
                    <p className="text-muted text-xs mb-1">Notas de cierre</p>
                    <p className="text-heading">{sesion.notasCierre}</p>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted pt-1">
                  <span>Apertura: {formatFecha(sesion.abiertaEn)}</span>
                  <span>Cierre: {formatFecha(sesion.cerradaEn)}</span>
                </div>
              </div>

              {/* Movimientos */}
              <div>
                <p className="text-sm font-semibold text-heading mb-2 flex items-center gap-2">
                  <DollarSign size={14} />
                  Movimientos ({sesion.movimientos?.length || 0})
                </p>
                {sesion.movimientos?.length === 0 ? (
                  <p className="text-muted text-sm text-center py-4">Sin movimientos</p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {sesion.movimientos?.map((m) => (
                      <FilaMovimiento key={m.id} mov={m} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}