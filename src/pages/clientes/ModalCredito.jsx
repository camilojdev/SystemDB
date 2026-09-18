import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCreditoCliente, registrarAbono, agregarDeuda } from '../../api/clientes'
import { formatCOP, formatFecha } from '../../utils/formato'
import { X, CreditCard } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { NOMBRE_NEGOCIO } from '../../utils/marca'

const fmt = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0
}).format(Math.abs(n))

function generarPDF(credito, cliente) {
  const doc = new jsPDF()
  const fmt = (n) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(Math.abs(n))

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(NOMBRE_NEGOCIO, 14, 20)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte de Credito', 14, 28)
  doc.setLineWidth(0.5)
  doc.line(14, 32, 196, 32)

  // Info cliente
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Cliente:', 14, 40)
  doc.setFont('helvetica', 'normal')
  doc.text(cliente.nombreCompleto, 45, 40)
  doc.setFont('helvetica', 'bold')
  doc.text('Fecha:', 14, 47)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('es-CO'), 45, 47)
  doc.setFont('helvetica', 'bold')
  doc.text('Desde:', 14, 54)
  doc.setFont('helvetica', 'normal')
  doc.text(credito.creadoEn
    ? new Date(credito.creadoEn).toLocaleDateString('es-CO') : '-', 45, 54)

  // Resumen
  doc.line(14, 60, 196, 60)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN', 14, 68)
  doc.setFontSize(10)

  let y = 76
  const resumen = [
    ['Total deuda', fmt(credito.montoTotalCop)],
    ['Total pagado', fmt(credito.montoPagadoCop)],
    ['Saldo restante', fmt(credito.montoRestanteCop)],
  ]
  resumen.forEach(([label, valor]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label + ':', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(valor, 70, y)
    y += 8
  })

  // Barra progreso
  const progreso = credito.montoTotalCop > 0
    ? Math.min(100, (credito.montoPagadoCop / credito.montoTotalCop) * 100) : 0
  y += 2
  doc.setFont('helvetica', 'bold')
  doc.text('Progreso de pago: ' + Math.round(progreso) + '%', 14, y)
  y += 5
  doc.setFillColor(220, 220, 220)
  doc.rect(14, y, 120, 5, 'F')
  doc.setFillColor(34, 197, 94)
  doc.rect(14, y, (120 * progreso) / 100, 5, 'F')
  y += 14

  // Historial
  doc.line(14, y, 196, y)
  y += 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('HISTORIAL DE MOVIMIENTOS', 14, y)
  y += 8

  if (!credito.movimientos || credito.movimientos.length === 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Sin movimientos registrados', 14, y)
  } else {
    // Encabezado tabla
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(240, 240, 240)
    doc.rect(14, y - 5, 182, 7, 'F')
    doc.text('TIPO', 16, y)
    doc.text('MONTO', 50, y)
    doc.text('FECHA', 100, y)
    doc.text('NOTA', 135, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    credito.movimientos.forEach((m) => {
      if (y > 270) { doc.addPage(); y = 20 }
      const esDeuda = m.montoCop < 0
      const nota = (m.notas?.replace('DEUDA: ', '') || '').substring(0, 35)
      const fecha = m.fecha ? new Date(m.fecha).toLocaleDateString('es-CO') : '-'

      esDeuda
        ? doc.setTextColor(220, 38, 38)
        : doc.setTextColor(22, 163, 74)
      doc.text(esDeuda ? 'DEUDA' : 'ABONO', 16, y)
      doc.setTextColor(0, 0, 0)
      doc.text(fmt(m.montoCop), 50, y)
      doc.text(fecha, 100, y)
      doc.text(nota, 135, y)
      y += 7
    })
  }

  // Footer
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Generado por ${NOMBRE_NEGOCIO} — ` + new Date().toLocaleDateString('es-CO'), 14, 290)
    doc.text('Pagina ' + i + ' de ' + total, 175, 290)
    doc.setTextColor(0, 0, 0)
  }

  doc.save('credito-' + cliente.nombreCompleto.replace(/\s+/g, '-') + '.pdf')
}

export default function ModalCredito({ cliente, onClose }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('resumen')
  const [montoAbono, setMontoAbono] = useState('')
  const [notasAbono, setNotasAbono] = useState('')
  const [montoDeuda, setMontoDeuda] = useState('')
  const [notasDeuda, setNotasDeuda] = useState('')
  const [error, setError] = useState('')
  const [metodoPagoAbono, setMetodoPagoAbono] = useState('EFECTIVO')

  const { data: creditoData, isLoading } = useQuery({
    queryKey: ['credito', cliente.id],
    queryFn: () => getCreditoCliente(cliente.id).then((r) => r.data.datos),
    retry: false,
  })
  const credito = creditoData

  const { mutate: abonar, isPending: abonando } = useMutation({
    mutationFn: () => registrarAbono(cliente.id, {
      montoCop: Number(montoAbono),
      notas: notasAbono || 'Abono en efectivo',
      metodoPago: metodoPagoAbono,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['credito', cliente.id])
      queryClient.invalidateQueries(['clientes'])
      setMontoAbono('')
      setNotasAbono('')
      setError('')
      setTab('resumen')
    },
    onError: (err) => setError(err.response?.data?.mensaje || 'Error al registrar abono'),
  })

  const { mutate: deuda, isPending: agregandoDeuda } = useMutation({
    mutationFn: () => agregarDeuda(cliente.id, {
      montoTotalCop: Number(montoDeuda),
      notas: notasDeuda || 'Deuda manual',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['credito', cliente.id])
      queryClient.invalidateQueries(['clientes'])
      setMontoDeuda('')
      setNotasDeuda('')
      setError('')
      setTab('resumen')
    },
    onError: (err) => setError(err.response?.data?.mensaje || 'Error al agregar deuda'),
  })

  const handleAbono = (e) => {
    e.preventDefault()
    setError('')
    if (!montoAbono || Number(montoAbono) <= 0) {
      setError('Ingresa un monto válido')
      return
    }
    abonar()
  }

  const handleDeuda = (e) => {
    e.preventDefault()
    setError('')
    if (!montoDeuda || Number(montoDeuda) <= 0) {
      setError('Ingresa un monto válido')
      return
    }
    deuda()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-green-600 dark:text-green-400" />
            <div>
              <h2 className="font-semibold text-heading">Crédito</h2>
              <p className="text-sm text-muted">{cliente.nombreCompleto}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 px-6 flex-shrink-0 overflow-x-auto">
          {[
            { key: 'resumen', label: 'Resumen' },
            { key: 'abono', label: 'Registrar abono' },
            { key: 'deuda', label: 'Agregar deuda' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError('') }}
              className={`px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-muted hover:text-heading'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* Tab resumen */}
          {tab === 'resumen' && (
            isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : credito ? (
              <div className="space-y-4">
                {/* Totales */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xs text-muted mb-1">Total deuda</p>
                    <p className="font-bold text-heading text-sm">{formatCOP(credito.montoTotalCop)}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-500/10 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xs text-muted mb-1">Pagado</p>
                    <p className="font-bold text-green-700 dark:text-green-400 text-sm">{formatCOP(credito.montoPagadoCop)}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xs text-muted mb-1">Restante</p>
                    <p className="font-bold text-red-700 dark:text-red-400 text-sm">{formatCOP(credito.montoRestanteCop)}</p>
                  </div>
                </div>

                {/* Barra progreso */}
                <div>
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>Progreso de pago</span>
                    <span>
                      {credito.montoTotalCop > 0
                        ? Math.round((credito.montoPagadoCop / credito.montoTotalCop) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: credito.montoTotalCop > 0
                          ? `${Math.min(100, (credito.montoPagadoCop / credito.montoTotalCop) * 100)}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>

                {/* Historial movimientos */}
                {credito.movimientos?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                      Historial
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {credito.movimientos.map((m, i) => {
                        const esDeuda = m.montoCop < 0
                        const nota = m.notas?.replace('DEUDA: ', '') || ''
                        return (
                          <div key={i} className="flex items-start justify-between py-1.5 border-b border-gray-50 dark:border-slate-700 last:border-0">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-heading truncate">
                                {esDeuda ? '📤 ' : '💰 '}{nota}
                              </p>
                              <p className="text-xs text-muted">{formatFecha(m.fecha)}</p>
                            </div>
                            <span className={`text-xs font-semibold ml-2 flex-shrink-0 ${esDeuda ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {esDeuda ? '-' : '+'}{formatCOP(Math.abs(m.montoCop))}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted text-center">
                  Crédito desde {formatFecha(credito.creadoEn)}
                </p>

                {/* Exportar */}
                <button
                  onClick={() => generarPDF(credito, cliente)}
                  className="w-full py-2 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  📄 Exportar PDF
                </button>
              </div>
            ) : (
              <p className="text-muted text-sm text-center py-6">Sin crédito activo</p>
            )
          )}

          {/* Tab abono */}
          {tab === 'abono' && (
            <form onSubmit={handleAbono} className="space-y-3">
              <p className="text-sm text-muted">
                Restante: <strong className="text-red-600 dark:text-red-400">{formatCOP(credito?.montoRestanteCop)}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Monto del abono (COP)
                </label>
                <input
                  type="number"
                  placeholder="Ej: 50000"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago en efectivo"
                  value={notasAbono}
                  onChange={(e) => setNotasAbono(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Método de pago</label>
                <select value={metodoPagoAbono} onChange={(e) => setMetodoPagoAbono(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </div>
              {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={abonando}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {abonando ? 'Registrando...' : 'Registrar abono'}
              </button>
            </form>
          )}

          {/* Tab deuda */}
          {tab === 'deuda' && (
            <form onSubmit={handleDeuda} className="space-y-3">
              <p className="text-sm text-muted">
                Agrega monto a la deuda del cliente (préstamo u otro concepto).
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Monto a agregar (COP)
                </label>
                <input
                  type="number"
                  placeholder="Ej: 100000"
                  value={montoDeuda}
                  onChange={(e) => setMontoDeuda(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Motivo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Préstamo en efectivo, repuesto adelantado..."
                  value={notasDeuda}
                  onChange={(e) => setNotasDeuda(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={agregandoDeuda}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {agregandoDeuda ? 'Agregando...' : 'Agregar deuda'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}