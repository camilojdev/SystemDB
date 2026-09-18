import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { crearCreditoProveedor, registrarPagoProveedor, getProveedores } from '../../api/compras'
import { formatCOP, formatFecha } from '../../utils/formato'
import { X, CreditCard } from 'lucide-react'

export default function ModalCreditoProveedor({ credito, onClose, onSuccess }) {
  const esNuevo = !credito
  const [tab, setTab] = useState(esNuevo ? 'crear' : 'resumen')
  const [form, setForm] = useState({
    proveedorId: '',
    montoTotalCop: '',
    notas: '',
  })
  const [pagoForm, setPagoForm] = useState({ montoCop: '', notas: '' })
  const [error, setError] = useState('')

  const { data: proveedoresData } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => getProveedores().then((r) => r.data.datos),
    enabled: esNuevo,
  })
  const proveedores = proveedoresData || []

  const { mutate: crear, isPending: creando } = useMutation({
    mutationFn: crearCreditoProveedor,
    onSuccess,
    onError: (err) => setError(err.response?.data?.mensaje || 'Error al crear crédito'),
  })

  const { mutate: pagar, isPending: pagando } = useMutation({
    mutationFn: ({ id, datos }) => registrarPagoProveedor(id, datos),
    onSuccess,
    onError: (err) => setError(err.response?.data?.mensaje || 'Error al registrar pago'),
  })

  const handleCrear = (e) => {
    e.preventDefault()
    setError('')
    if (!form.proveedorId || !form.montoTotalCop) {
      setError('Proveedor y monto son obligatorios')
      return
    }
    crear({ ...form, proveedorId: Number(form.proveedorId), montoTotalCop: Number(form.montoTotalCop) })
  }

  const handlePago = (e) => {
    e.preventDefault()
    setError('')
    if (!pagoForm.montoCop || Number(pagoForm.montoCop) <= 0) {
      setError('Ingresa un monto válido')
      return
    }
    pagar({ id: credito.id, datos: { montoCop: Number(pagoForm.montoCop), notas: pagoForm.notas } })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-heading">
              {esNuevo ? 'Nuevo crédito' : `Crédito — ${credito.proveedorNombre}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-heading"><X size={20} /></button>
        </div>

        {!esNuevo && (
          <div className="flex border-b border-gray-200 dark:border-slate-700 px-6">
            {[
              { key: 'resumen', label: 'Resumen' },
              { key: 'pago', label: 'Registrar pago' },
            ].map((t) => (
              <button key={t.key} onClick={() => { setTab(t.key); setError('') }}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {/* Crear nuevo crédito */}
          {esNuevo && (
            <form onSubmit={handleCrear} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-heading mb-1">Proveedor</label>
                <select value={form.proveedorId}
                  onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-heading mb-1">Monto total (COP)</label>
                <input type="number" value={form.montoTotalCop}
                  onChange={(e) => setForm({ ...form, montoTotalCop: e.target.value })}
                  placeholder="Ej: 500000"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-heading mb-1">Notas</label>
                <input type="text" value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Descripción del crédito"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={creando}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {creando ? 'Registrando...' : 'Registrar crédito'}
              </button>
            </form>
          )}

          {/* Resumen */}
          {!esNuevo && tab === 'resumen' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted mb-1">Total deuda</p>
                  <p className="font-bold text-heading text-sm">{formatCOP(credito.montoTotalCop)}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-500/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted mb-1">Pagado</p>
                  <p className="font-bold text-green-700 dark:text-green-400 text-sm">{formatCOP(credito.montoPagadoCop)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted mb-1">Restante</p>
                  <p className="font-bold text-red-700 dark:text-red-400 text-sm">{formatCOP(credito.montoRestanteCop)}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Progreso</span>
                  <span>{credito.montoTotalCop > 0
                    ? Math.round((credito.montoPagadoCop / credito.montoTotalCop) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, credito.montoTotalCop > 0
                      ? (credito.montoPagadoCop / credito.montoTotalCop) * 100 : 0)}%` }} />
                </div>
              </div>

              {credito.pagos?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Historial de pagos</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {credito.pagos.map((p) => (
                      <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-slate-700">
                        <div>
                          <p className="text-xs text-heading">{p.notas || 'Abono'}</p>
                          <p className="text-xs text-muted">{formatFecha(p.creadoEn)}</p>
                        </div>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">+{formatCOP(p.montoCop)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Registrar pago */}
          {!esNuevo && tab === 'pago' && (
            <form onSubmit={handlePago} className="space-y-3">
              <p className="text-sm text-muted">
                Restante: <strong className="text-red-600 dark:text-red-400">{formatCOP(credito.montoRestanteCop)}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-heading mb-1">Monto del pago (COP)</label>
                <input type="number" value={pagoForm.montoCop}
                  onChange={(e) => setPagoForm({ ...pagoForm, montoCop: e.target.value })}
                  placeholder="Ej: 100000"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-heading mb-1">Notas (opcional)</label>
                <input type="text" value={pagoForm.notas}
                  onChange={(e) => setPagoForm({ ...pagoForm, notas: e.target.value })}
                  placeholder="Ej: Pago parcial transferencia"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={pagando}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {pagando ? 'Registrando...' : 'Registrar pago'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}