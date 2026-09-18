import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrdenes, buscarOrdenes, cambiarEstado } from '../../api/taller'
import { formatCOP, formatFecha } from '../../utils/formato'
import { Search, Plus, Wrench, Eye } from 'lucide-react'
import ModalCrearOT from './ModalCrearOT'
import ModalDetalleOT from './ModalDetalleOT'

const ESTADOS = {
  RECIBIDO: { label: 'Recibido', color: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300' },
  EN_DIAGNOSTICO: { label: 'En diagnóstico', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' },
  EN_REPARACION: { label: 'En reparación', color: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' },
  ESPERANDO_REPUESTO: { label: 'Esperando repuesto', color: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300' },
  LISTO: { label: 'Listo', color: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' },
  ENTREGADO: { label: 'Entregado', color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' },
}

function BadgeEstado({ estado }) {
  const cfg = ESTADOS[estado] || { label: estado, color: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300' }
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export default function Taller() {
  const queryClient = useQueryClient()
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(0)
  const [modalCrear, setModalCrear] = useState(false)
  const [otDetalle, setOtDetalle] = useState(null)
  const [verHistorial, setVerHistorial] = useState(false)


  const { data, isLoading } = useQuery({
    queryKey: busqueda.length >= 2
      ? ['ordenes-busqueda', busqueda]
      : ['ordenes', pagina, verHistorial],
    queryFn: () =>
      busqueda.length >= 2
        ? buscarOrdenes(busqueda).then((r) => ({ content: r.data.datos, totalPages: 1 }))
        : getOrdenes(pagina, verHistorial).then((r) => r.data.datos),
    keepPreviousData: true,
  })

  const ordenes = data?.content || []
  const totalPaginas = data?.totalPages || 1

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-heading">Taller</h1>
          <p className="text-muted text-base mt-1">Órdenes de trabajo</p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nueva OT
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por placa o cliente..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(0) }}
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-heading placeholder-gray-400 dark:placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setVerHistorial(false); setPagina(0) }}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            !verHistorial
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Activas
        </button>
        <button
          onClick={() => { setVerHistorial(true); setPagina(0) }}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            verHistorial
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Historial
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ordenes.length === 0 ? (
          <div className="text-center py-16">
            <Wrench size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-muted">No hay órdenes de trabajo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">OT</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Vehículo</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Fecha</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {ordenes.map((ot) => (
                <tr key={ot.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Wrench size={14} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-mono text-sm font-medium text-heading">#{ot.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-heading text-sm">{ot.nombreCliente}</p>
                    <p className="text-xs text-muted">{ot.celularCliente || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-heading text-sm">{ot.placa}</p>
                    <p className="text-xs text-muted">
                      {[ot.marcaVehiculo, ot.modeloVehiculo, ot.anioVehiculo].filter(Boolean).join(' ')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <BadgeEstado estado={ot.estado} />
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-sm text-heading">
                    {formatCOP(ot.granTotalCop)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {formatFecha(ot.creadoEn)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setOtDetalle(ot)}
                      className="p-1.5 text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {!busqueda && totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            disabled={pagina === 0}
            className="px-3 py-1.5 text-sm text-heading border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Anterior
          </button>
          <span className="text-sm text-muted">
            Página {pagina + 1} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
            disabled={pagina >= totalPaginas - 1}
            className="px-3 py-1.5 text-sm text-heading border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Siguiente
          </button>
        </div>
      )}

      {modalCrear && (
        <ModalCrearOT
          onClose={() => setModalCrear(false)}
          onSuccess={() => {
            setModalCrear(false)
            queryClient.invalidateQueries(['ordenes'])
          }}
        />
      )}

      {otDetalle && (
        <ModalDetalleOT
          ot={otDetalle}
          onClose={() => setOtDetalle(null)}
          onCambioEstado={() => {
            queryClient.invalidateQueries(['ordenes'])
            setOtDetalle(null)
          }}
        />
      )}
    </div>
  )
}