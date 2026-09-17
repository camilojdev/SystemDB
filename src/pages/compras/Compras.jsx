import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEntradas, getProveedores, getCreditosProveedor } from '../../api/compras'
import { formatCOP, formatFecha } from '../../utils/formato'
import { Package, Truck, CreditCard, Plus, Eye } from 'lucide-react'
import ModalEntradaMercancia from '../inventario/ModalEntradaMercancia'
import ModalProveedor from '../inventario/ModalProveedor'
import ModalCreditoProveedor from './ModalCreditoProveedor'
import ModalDetalleEntrada from './ModalDetalleEntrada'

export default function Compras() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('entradas')
  const [modalEntrada, setModalEntrada] = useState(false)
  const [modalProveedor, setModalProveedor] = useState(false)
  const [proveedorEditando, setProveedorEditando] = useState(null)
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null)
  const [entradaDetalle, setEntradaDetalle] = useState(null)

  const { data: entradasData, isLoading: cargandoEntradas } = useQuery({
    queryKey: ['entradas'],
    queryFn: () => getEntradas(0).then((r) => r.data.datos),
    enabled: Boolean(tab === 'entradas'),
  })
  const entradas = entradasData?.content || []

  const { data: proveedoresData, isLoading: cargandoProveedores } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => getProveedores().then((r) => r.data.datos),
    enabled: Boolean(tab === 'proveedores'),
  })
  const proveedores = proveedoresData || []

  const { data: creditosData, isLoading: cargandoCreditos } = useQuery({
    queryKey: ['creditos-proveedor'],
    queryFn: () => getCreditosProveedor().then((r) => r.data.datos),
    enabled: Boolean(tab === 'creditos'),
  })
  const creditos = creditosData || []

  const totalDeuda = creditos.reduce((s, c) => s + (c.montoRestanteCop || 0), 0)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Compras</h1>
          <p className="text-muted text-base mt-1">Entradas, proveedores y créditos</p>
        </div>
        {tab === 'entradas' && (
          <button onClick={() => setModalEntrada(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium self-start sm:self-auto">
            <Plus size={16} /> Nueva entrada
          </button>
        )}
        {tab === 'proveedores' && (
          <button onClick={() => { setProveedorEditando(null); setModalProveedor(true) }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium self-start sm:self-auto">
            <Plus size={16} /> Nuevo proveedor
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
        {[
          { key: 'entradas', label: 'Entradas', icon: Package },
          { key: 'proveedores', label: 'Proveedores', icon: Truck },
          { key: 'creditos', label: 'Crédito proveedores', icon: CreditCard },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted hover:text-heading'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Entradas */}
      {tab === 'entradas' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          {cargandoEntradas ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entradas.length === 0 ? (
            <div className="text-center py-16">
              <Package size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-muted">No hay entradas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-6 py-3">#</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-6 py-3">Proveedor</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-6 py-3">Factura</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-6 py-3">Registrado por</th>
                  <th className="text-right text-xs font-semibold text-muted uppercase px-6 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-6 py-3">Fecha</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {entradas.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                    <td className="px-6 py-4 text-sm font-medium text-heading">#{e.id}</td>
                    <td className="px-6 py-4 text-sm text-heading">{e.proveedorNombre || '—'}</td>
                    <td className="px-6 py-4 text-sm text-heading">{e.numeroFacturaProveedor || '—'}</td>
                    <td className="px-6 py-4 text-sm text-muted">{e.registradoPor || '—'}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-heading">{formatCOP(e.costoTotalCop)}</td>
                    <td className="px-6 py-4 text-sm text-muted">{formatFecha(e.creadoEn)}</td>
                    <td className="px-6 py-4"> <button onClick={() => setEntradaDetalle(e)} className="p-1.5 text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"> <Eye size={15} /> </button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Proveedores */}
      {tab === 'proveedores' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          {cargandoProveedores ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : proveedores.length === 0 ? (
            <div className="text-center py-16">
              <Truck size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-muted">No hay proveedores registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-6 py-3">Proveedor</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-6 py-3">NIT</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-6 py-3">Contacto</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-6 py-3">Teléfono</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {proveedores.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                    <td className="px-6 py-4">
                      <p className="font-medium text-heading">{p.nombre}</p>
                      {p.correo && <p className="text-xs text-muted">{p.correo}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-heading">{p.nit || '—'}</td>
                    <td className="px-6 py-4 text-sm text-heading">{p.personaContacto || '—'}</td>
                    <td className="px-6 py-4 text-sm text-heading">{p.telefono || '—'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => { setProveedorEditando(p); setModalProveedor(true) }}
                        className="p-1.5 text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg">
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
      )}

      {/* Tab Créditos */}
      {tab === 'creditos' && (
        <div className="space-y-4">
          {/* Resumen */}
          {creditos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card !p-4">
                <p className="text-xs text-muted mb-1">Créditos activos</p>
                <p className="text-2xl font-bold text-heading">{creditos.length}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-4 shadow-sm border border-red-100 dark:border-red-500/30">
                <p className="text-xs text-muted mb-1">Total por pagar</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCOP(totalDeuda)}</p>
              </div>
              <div className="card !p-4 flex items-center justify-center">
                <button onClick={() => setCreditoSeleccionado({ nuevo: true })}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  <Plus size={14} /> Nuevo crédito
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            {cargandoCreditos ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : creditos.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-muted mb-4">No hay créditos con proveedores</p>
                <button onClick={() => setCreditoSeleccionado({ nuevo: true })}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium mx-auto">
                  <Plus size={14} /> Registrar crédito
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                  <tr>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-6 py-3">Proveedor</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-6 py-3">Total</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-6 py-3">Pagado</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-6 py-3">Restante</th>
                    <th className="text-center text-xs font-semibold text-muted uppercase px-6 py-3">Estado</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {creditos.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                      <td className="px-6 py-4">
                        <p className="font-medium text-heading">{c.proveedorNombre}</p>
                        {c.notas && <p className="text-xs text-muted">{c.notas}</p>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-heading">{formatCOP(c.montoTotalCop)}</td>
                      <td className="px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">{formatCOP(c.montoPagadoCop)}</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-red-600 dark:text-red-400">{formatCOP(c.montoRestanteCop)}</td>
                      <td className="px-6 py-4 text-center">
                        {c.estaActivo
                          ? <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded-full">Pendiente</span>
                          : <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 rounded-full">Pagado</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => setCreditoSeleccionado(c)}
                          className="p-1.5 text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg">
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
        </div>
      )}

      {/* Modales */}
      {modalEntrada && (
        <ModalEntradaMercancia
          onClose={() => setModalEntrada(false)}
          onSuccess={() => {
            setModalEntrada(false)
            queryClient.invalidateQueries(['entradas'])
          }}
        />
      )}

      {modalProveedor && (
        <ModalProveedor
          proveedor={proveedorEditando}
          onClose={() => setModalProveedor(false)}
          onSuccess={() => {
            setModalProveedor(false)
            queryClient.invalidateQueries(['proveedores'])
          }}
        />
      )}

      {creditoSeleccionado && (
        <ModalCreditoProveedor
          credito={creditoSeleccionado.nuevo ? null : creditoSeleccionado}
          onClose={() => setCreditoSeleccionado(null)}
          onSuccess={() => {
            setCreditoSeleccionado(null)
            queryClient.invalidateQueries(['creditos-proveedor'])
          }}
        />
      )}

      {entradaDetalle && (
        <ModalDetalleEntrada
          entrada={entradaDetalle}
          onClose={() => setEntradaDetalle(null)}
        />
      )}
    </div>
  )
}