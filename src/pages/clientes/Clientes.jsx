import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClientes, buscarClientes, eliminarCliente } from '../../api/clientes'
import { formatCOP } from '../../utils/formato'
import { Search, Plus, Trash2, Edit2, Star, CreditCard, Eye, Users } from 'lucide-react'
import ModalCrearCliente from './ModalCrearCliente'
import ModalCredito from './ModalCredito'

export default function Clientes() {
  const queryClient = useQueryClient()
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(0)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [clienteCredito, setClienteCredito] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: busqueda.length >= 2
      ? ['clientes-busqueda', busqueda]
      : ['clientes', pagina],
    queryFn: () =>
      busqueda.length >= 2
        ? buscarClientes(busqueda).then((r) => ({ content: r.data.datos, totalPages: 1 }))
        : getClientes(pagina).then((r) => r.data.datos),
    keepPreviousData: true,
  })

  const { mutate: eliminar } = useMutation({
    mutationFn: eliminarCliente,
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes'])
    },
  })

  const clientes = data?.content || []
  const totalPaginas = data?.totalPages || 1

  const handleEditar = (cliente) => {
    setClienteEditando(cliente)
    setModalAbierto(true)
  }

  const handleNuevo = () => {
    setClienteEditando(null)
    setModalAbierto(true)
  }

  const handleEliminar = (id, nombre) => {
    if (confirm(`¿Eliminar al cliente ${nombre}?`)) {
      eliminar(id)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-heading">Clientes</h1>
          <p className="text-muted text-base mt-1">Gestión de clientes y fidelización</p>
        </div>
        <button
          onClick={handleNuevo}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nombre, cédula o celular..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(0) }}
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-heading placeholder-gray-400 dark:placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-muted">No se encontraron clientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Identificación</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Contacto</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Puntos</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-3">Crédito</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-sm flex-shrink-0">
                        {c.nombreCompleto?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-heading">{c.nombreCompleto}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-heading">
                    <span className="text-xs text-muted mr-1">{c.tipoIdentificacion}</span>
                    {c.numeroIdentificacion}
                  </td>
                  <td className="px-6 py-4 text-sm text-heading">
                    <div>{c.celular || '—'}</div>
                    <div className="text-xs text-muted">{c.correo || ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Star size={14} className="text-yellow-500" />
                      <span className="font-medium text-heading">{c.saldoPuntos || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {c.creditoHabilitado ? (
                      <button onClick={() => setClienteCredito(c)}
                        className="flex items-center gap-2 text-sm group">
                        <CreditCard size={14} className="text-green-500" />
                        <span className="text-green-700 dark:text-green-400 font-medium">
                          {formatCOP(c.saldoCreditoCop)}
                        </span>
                        <Eye size={13} className="text-gray-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                      </button>
                    ) : (
                      <span className="text-xs text-muted">Sin crédito</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleEditar(c)}
                        className="p-1.5 text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleEliminar(c.id, c.nombreCompleto)}
                        className="p-1.5 text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 text-heading rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Anterior
          </button>
          <span className="text-sm text-muted">
            Página {pagina + 1} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
            disabled={pagina >= totalPaginas - 1}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 text-heading rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal */}
      {clienteCredito && (
        <ModalCredito
          cliente={clienteCredito}
          onClose={() => setClienteCredito(null)}
        />
      )}
      {modalAbierto && (
        <ModalCrearCliente
          cliente={clienteEditando}
          onClose={() => setModalAbierto(false)}
          onSuccess={() => {
            setModalAbierto(false)
            queryClient.invalidateQueries(['clientes'])
          }}
        />
      )}
    </div>
  )
}