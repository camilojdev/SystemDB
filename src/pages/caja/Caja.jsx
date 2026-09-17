import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCajaActual, abrirCaja, cerrarCaja, registrarGasto, getSesionesAbiertas, getHistorialCaja } from '../../api/caja'
import { getUsuarios } from '../../api/usuarios'
import { formatCOP, formatFecha } from '../../utils/formato'
import { DollarSign, BarChart3, Lock, Download, Eye, Unlock, TrendingUp, TrendingDown, AlertTriangle, Users } from 'lucide-react'
import useCajaStore from '../../store/cajaStore'
import useAuthStore from '../../store/authStore'
import ModalDetalleSesion from './ModalDetalleSesion'
import ModalDetalleVenta from './ModalDetalleVenta'
import { jsPDF } from 'jspdf'
import { NOMBRE_NEGOCIO } from '../../utils/marca'

function generarCierrePDF(sesion) {
  const doc = new jsPDF()
  const fmt = (n) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(n || 0)

  doc.setFontSize(18); doc.setFont('helvetica', 'bold')
  doc.text(NOMBRE_NEGOCIO, 14, 20)
  doc.setFontSize(11); doc.setFont('helvetica', 'normal')
  doc.text('Reporte de Cierre de Caja', 14, 28)
  doc.line(14, 32, 196, 32)

  doc.setFontSize(10)
  doc.text(`Cajera: ${sesion.cajera}`, 14, 40)
  doc.text(`Apertura: ${sesion.abiertaEn ? new Date(sesion.abiertaEn).toLocaleString('es-CO') : '—'}`, 14, 47)
  doc.text(`Cierre: ${sesion.cerradaEn ? new Date(sesion.cerradaEn).toLocaleString('es-CO') : '—'}`, 14, 54)
  doc.line(14, 59, 196, 59)

  // Resumen
  let y = 67
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN DE LA SESIÓN', 14, y); y += 8
  doc.setFont('helvetica', 'normal')

  const filas = [
    ['Saldo inicial', fmt(sesion.saldoInicialCop)],
    ['Total ventas', fmt(sesion.totalVentasCop)],
    ['Abonos crédito', fmt(sesion.totalAbonosCreditoCop)],
    ['Total gastos', fmt(sesion.totalGastosCop)],
    ['Saldo esperado', fmt(sesion.saldoEsperadoCop)],
  ]
  filas.forEach(([label, valor]) => {
    doc.text(label + ':', 14, y)
    doc.text(valor, 120, y)
    y += 7
  })

  // Desglose método pago
  y += 3
  doc.line(14, y, 196, y); y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('DESGLOSE POR MÉTODO DE PAGO', 14, y); y += 8
  doc.setFont('helvetica', 'normal')
  ;[
    ['Efectivo', fmt(sesion.totalEfectivoCop)],
    ['Transferencia', fmt(sesion.totalTransferenciaCop)],
    ['Crédito', fmt(sesion.totalCreditoCop)],
  ].forEach(([label, valor]) => {
    doc.text(label + ':', 14, y)
    doc.text(valor, 120, y)
    y += 7
  })

  // Cierre
  y += 3
  doc.line(14, y, 196, y); y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('CUADRE DE CAJA', 14, y); y += 8
  doc.setFont('helvetica', 'normal')
  doc.text('Efectivo contado:', 14, y)
  doc.text(fmt(sesion.saldoFinalCop), 120, y); y += 7
  doc.text('Saldo esperado:', 14, y)
  doc.text(fmt(sesion.saldoEsperadoCop), 120, y); y += 7

  const diferencia = sesion.diferenciaCop || 0
  doc.setFont('helvetica', 'bold')
  doc.text('Diferencia:', 14, y)
  doc.setTextColor(diferencia >= 0 ? 0 : 220, diferencia >= 0 ? 150 : 38, 38)
  doc.text(`${diferencia >= 0 ? '+' : ''}${fmt(diferencia)}`, 120, y)
  doc.setTextColor(0, 0, 0); y += 10

  if (sesion.notasCierre) {
    doc.line(14, y, 196, y); y += 7
    doc.setFont('helvetica', 'bold')
    doc.text('Notas de cierre:', 14, y); y += 7
    doc.setFont('helvetica', 'normal')
    doc.text(sesion.notasCierre, 14, y); y += 10
  }

  // Movimientos
  if (sesion.movimientos?.length > 0) {
    doc.line(14, y, 196, y); y += 7
    doc.setFont('helvetica', 'bold')
    doc.text('MOVIMIENTOS', 14, y); y += 8
    doc.setFillColor(240, 240, 240)
    doc.rect(14, y - 5, 182, 7, 'F')
    doc.text('Tipo', 16, y)
    doc.text('Descripción', 50, y)
    doc.text('Usuario', 130, y)
    doc.text('Monto', 168, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    sesion.movimientos.forEach((m) => {
      if (y > 270) { doc.addPage(); y = 20 }
      const esIngreso = ['VENTA', 'VENTA_EFECTIVO', 'VENTA_TRANSFERENCIA', 'APERTURA', 'ABONO_CREDITO'].includes(m.tipo)
      doc.text(m.tipo || '', 16, y)
      doc.text((m.descripcion || '').substring(0, 35), 50, y)
      doc.text((m.registradoPor || '').substring(0, 20), 130, y)
      esIngreso ? doc.setTextColor(22, 163, 74) : doc.setTextColor(220, 38, 38)
      doc.text(`${esIngreso ? '+' : '-'}${fmt(m.montoCop)}`, 168, y)
      doc.setTextColor(0, 0, 0)
      y += 6
    })
  }

  doc.setFontSize(8); doc.setTextColor(150, 150, 150)
  doc.text(`Generado por ${NOMBRE_NEGOCIO} — ` + new Date().toLocaleString('es-CO'), 14, 290)
  doc.setTextColor(0, 0, 0)

  const fecha = sesion.cerradaEn
    ? new Date(sesion.cerradaEn).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]
  doc.save(`cierre-caja-${sesion.cajera?.replace(/\s+/g, '-')}-${fecha}.pdf`)
}

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
            <p className={`text-base font-medium break-words ${esAnulacion ? 'text-red-700 dark:text-red-400' : 'text-heading'}`}>
              {mov.descripcion}
            </p>
            {esVenta && !esAnulacion && (
              <button onClick={() => setVerVenta(true)}
                className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                Ver detalle
              </button>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {mov.registradoPor && <p className="text-sm text-blue-500 dark:text-blue-400">{mov.registradoPor}</p>}
              <p className="text-sm text-muted">{formatFecha(mov.creadoEn)}</p>
            </div>
          </div>
        </div>
        <span className={`text-base font-semibold flex-shrink-0 whitespace-nowrap ${esAnulacion ? 'text-red-700 dark:text-red-400' : esIngreso ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {esIngreso && !esAnulacion ? '+' : '-'}{formatCOP(mov.montoCop)}
        </span>
      </div>
      {verVenta && <ModalDetalleVenta ventaId={mov.ventaId} onClose={() => setVerVenta(false)} />}
    </>
  )
}

export default function Caja() {
  const queryClient = useQueryClient()
  const usuario = useAuthStore((s) => s.usuario)
  const esDueno = usuario?.rol === 'DUENO'

  const [tab, setTab] = useState('sesion')
  const [cajeraId, setCajeraId] = useState('')
  const [saldoApertura, setSaldoApertura] = useState('')
  const [sesionCierreId, setSesionCierreId] = useState('')
  const [saldoCierre, setSaldoCierre] = useState('')
  const [notasCierre, setNotasCierre] = useState('')
  const [montoGasto, setMontoGasto] = useState('')
  const [descGasto, setDescGasto] = useState('')
  const [error, setError] = useState('')
  const [tabHistorial, setTabHistorial] = useState(false)
  const [filtroCajeraId, setFiltroCajeraId] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [paginaHistorial, setPaginaHistorial] = useState(0)
  const [sesionDetalle, setSesionDetalle] = useState(null)

  const setCajaAbierta = useCajaStore((s) => s.setCajaAbierta)

  // Sesión del usuario actual
  const { data: cajaData, isLoading } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => getCajaActual().then((r) => {
      const datos = r.data.datos
      setCajaAbierta(datos?.estaAbierta || false, datos?.id)
      return datos
    }),
    retry: false,
    onError: () => setCajaAbierta(false),
  })

  const { data: historialData, isLoading: cargandoHistorial } = useQuery({
    queryKey: ['historial-caja', paginaHistorial, filtroCajeraId, filtroDesde, filtroHasta],
    queryFn: () => getHistorialCaja(paginaHistorial, filtroCajeraId, filtroDesde, filtroHasta)
      .then((r) => r.data.datos),
    enabled: Boolean(esDueno && tabHistorial),
  })
  const historial = historialData?.content || []
  const totalPaginasHistorial = historialData?.totalPages || 1

  // Sesiones abiertas de todos (solo dueño)
  const { data: sesionesAbiertasData } = useQuery({
    queryKey: ['sesiones-abiertas'],
    queryFn: () => getSesionesAbiertas().then((r) => r.data.datos),
    enabled: esDueno,
  })
  const sesionesAbiertas = sesionesAbiertasData || []

  // Usuarios cajeras (para abrir caja a nombre de alguien)
  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => getUsuarios().then((r) => r.data.datos),
    enabled: esDueno,
  })
  const cajeras = (usuariosData || []).filter(
    (u) => (u.rol === 'CAJERA' || u.rol === 'DUENO') && u.estaActivo
  )

  const sesion = cajaData
  const cajaAbierta = sesion?.estaAbierta === true

  const { mutate: abrir, isPending: abriendo } = useMutation({
    mutationFn: abrirCaja,
    onSuccess: (res) => {
      setCajaAbierta(true, res.data.datos?.id)
      queryClient.invalidateQueries(['caja-actual'])
      queryClient.invalidateQueries(['sesiones-abiertas'])
      queryClient.invalidateQueries(['dashboard'])
      setSaldoApertura('')
      setCajeraId('')
      setError('')
    },
    onError: (err) => setError(err.response?.data?.mensaje || 'Error al abrir caja'),
  })

  const { mutate: cerrar, isPending: cerrando } = useMutation({
    mutationFn: cerrarCaja,
    onSuccess: () => {
      setCajaAbierta(false)
      queryClient.invalidateQueries(['caja-actual'])
      queryClient.invalidateQueries(['sesiones-abiertas'])
      queryClient.invalidateQueries(['historial-caja'])
      queryClient.invalidateQueries(['dashboard'])
      setSaldoCierre('')
      setNotasCierre('')
      setSesionCierreId('')
      setError('')
      setTab('sesion')
    },
    onError: (err) => setError(err.response?.data?.mensaje || 'Error al cerrar caja'),
  })

  const { mutate: gasto, isPending: guardandoGasto } = useMutation({
    mutationFn: registrarGasto,
    onSuccess: () => {
      queryClient.invalidateQueries(['caja-actual'])
      setMontoGasto('')
      setDescGasto('')
      setError('')
    },
    onError: (err) => setError(err.response?.data?.mensaje || 'Error al registrar gasto'),
  })

  const handleAbrir = (e) => {
    e.preventDefault()
    setError('')
    if (!saldoApertura) { setError('Ingresa el saldo inicial'); return }
    abrir({
      saldoInicialCop: Number(saldoApertura),
      cajeraId: cajeraId ? Number(cajeraId) : null,
    })
  }

  const handleCerrar = (e) => {
    e.preventDefault()
    setError('')
    if (!saldoCierre) { setError('Ingresa el efectivo contado'); return }
    
    // Si solo hay una sesión abierta, usarla automáticamente
    const idSesion = sesionCierreId 
      ? Number(sesionCierreId) 
      : sesionesAbiertas.length === 1 
        ? sesionesAbiertas[0].id 
        : sesion?.id

    if (!idSesion) { setError('Selecciona la sesión a cerrar'); return }

    cerrar({
      sesionId: idSesion,
      saldoFinalContadoCop: Number(saldoCierre),
      notas: notasCierre,
    })
  }

  const handleGasto = (e) => {
    e.preventDefault()
    setError('')
    if (!montoGasto || !descGasto) { setError('Monto y descripción son obligatorios'); return }
    gasto({ montoCop: Number(montoGasto), descripcion: descGasto })
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Caja</h1>
          <p className="text-muted text-base mt-1">Gestión de sesiones de caja</p>
        </div>
        <div className={`inline-flex self-start sm:self-auto items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${cajaAbierta ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
          {cajaAbierta ? <Unlock size={14} /> : <Lock size={14} />}
          {cajaAbierta ? 'Mi caja abierta' : 'Mi caja cerrada'}
        </div>
      </div>

      {esDueno && (
        <button
          onClick={() => setTabHistorial(!tabHistorial)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tabHistorial
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <BarChart3 size={15} />
          {tabHistorial ? 'Ver cajas activas' : 'Ver historial'}
        </button>
      )}

      {/* Vista general dueño — sesiones abiertas */}
      {esDueno && sesionesAbiertas.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-blue-500 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-heading">Cajas activas del negocio</h2>
            <span className="ml-auto bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {sesionesAbiertas.length} abiertas
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sesionesAbiertas.map((s) => (
              <div key={s.id} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-heading">{s.cajera}</p>
                  <span className="text-sm text-muted">Desde {formatFecha(s.abiertaEn)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted">Ventas</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">{formatCOP(s.totalVentasCop)}</p>
                  </div>
                  <div>
                    <p className="text-muted">Gastos</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">{formatCOP(s.totalGastosCop)}</p>
                  </div>
                  <div>
                    <p className="text-muted">Saldo esperado</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">{formatCOP(s.saldoEsperadoCop)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abrir caja — solo dueño */}
      {esDueno && !isLoading && (
        <div className="card max-w-md">
          <h2 className="text-lg font-semibold text-heading mb-4 flex items-center gap-2">
            <Unlock size={16} className="text-green-600 dark:text-green-400" />
            Abrir sesión de caja
          </h2>
          <form onSubmit={handleAbrir} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-heading mb-1">Abrir para</label>
              <select value={cajeraId} onChange={(e) => setCajeraId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Mi propia caja</option>
                {cajeras.filter(c => c.rol !== 'DUENO').map((c) => (
                  <option key={c.id} value={c.id}>{c.nombreCompleto}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-heading mb-1">Saldo inicial (COP)</label>
              <input type="number" placeholder="Ej: 200000" value={saldoApertura}
                onChange={(e) => setSaldoApertura(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && tab !== 'cierre' && tab !== 'gasto' && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={abriendo}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {abriendo ? 'Abriendo...' : 'Abrir caja'}
            </button>
          </form>
        </div>
      )}

      {/* Mi sesión actual */}
      {cajaAbierta && sesion && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Saldo inicial', valor: sesion.saldoInicialCop, color: 'text-heading' },
              { label: 'Total ventas', valor: sesion.totalVentasCop, color: 'text-green-600 dark:text-green-400' },
              { label: 'Gastos', valor: sesion.totalGastosCop, color: 'text-red-600 dark:text-red-400' },
              { label: 'Saldo esperado', valor: sesion.saldoEsperadoCop, color: 'text-blue-600 dark:text-blue-400' },
            ].map((m) => (
              <div key={m.label} className="card !p-3 sm:!p-4">
                <p className="text-sm text-muted mb-1">{m.label}</p>
                <p className={`text-lg sm:text-2xl font-bold ${m.color}`}>{formatCOP(m.valor)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="card !p-3 sm:!p-4">
              <p className="text-sm text-muted mb-1">💵 Efectivo</p>
              <p className="text-base sm:text-xl font-bold text-heading">{formatCOP(sesion.totalEfectivoCop)}</p>
            </div>
            <div className="card !p-3 sm:!p-4">
              <p className="text-sm text-muted mb-1">🏦 Transferencia</p>
              <p className="text-base sm:text-xl font-bold text-heading">{formatCOP(sesion.totalTransferenciaCop)}</p>
            </div>
            <div className="card !p-3 sm:!p-4">
              <p className="text-sm text-muted mb-1">📋 Crédito</p>
              <p className="text-base sm:text-xl font-bold text-heading">{formatCOP(sesion.totalCreditoCop)}</p>
            </div>
          </div>

          <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
            {[
              { key: 'sesion', label: 'Movimientos' },
              { key: 'gasto', label: 'Registrar gasto' },
              ...(esDueno ? [{ key: 'cierre', label: 'Cerrar caja' }] : []),
            ].map((t) => (
              <button key={t.key} onClick={() => { setTab(t.key); setError('') }}
                className={`px-3 sm:px-4 py-2.5 text-sm sm:text-base font-medium border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted hover:text-heading'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'sesion' && (
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <DollarSign size={16} className="text-muted flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-heading truncate">Movimientos — {sesion.cajera}</h3>
                </div>
                <span className="text-sm text-muted sm:ml-auto">Desde {formatFecha(sesion.abiertaEn)}</span>
              </div>
              {sesion.movimientos?.length === 0 ? (
                <p className="text-muted text-base text-center py-6">Sin movimientos aún</p>
              ) : (
                <div className="space-y-1">
                  {sesion.movimientos?.map((m) => (
                    <FilaMovimiento key={m.id} mov={m} />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'gasto' && (
            <div className="card max-w-md">
              <h3 className="text-lg font-semibold text-heading mb-4">Registrar gasto operativo</h3>
              <form onSubmit={handleGasto} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Descripción</label>
                  <input type="text" placeholder="Ej: Papelería, servicios..."
                    value={descGasto} onChange={(e) => setDescGasto(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Monto (COP)</label>
                  <input type="number" placeholder="Ej: 15000"
                    value={montoGasto} onChange={(e) => setMontoGasto(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={guardandoGasto}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {guardandoGasto ? 'Registrando...' : 'Registrar gasto'}
                </button>
              </form>
            </div>
          )}

          {tab === 'cierre' && esDueno && (
            <div className="card max-w-md">
              <h3 className="text-lg font-semibold text-heading mb-1 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" />
                Cerrar sesión de caja
              </h3>
              <form onSubmit={handleCerrar} className="space-y-3 mt-4">
                {sesionesAbiertas.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-heading mb-1">Sesión a cerrar</label>
                    <select value={sesionCierreId} onChange={(e) => setSesionCierreId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Seleccionar cajera</option>
                      {sesionesAbiertas.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.cajera} — Saldo esperado: {formatCOP(s.saldoEsperadoCop)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Efectivo contado (COP)</label>
                  <input type="number" placeholder="Ingresa el dinero contado en caja"
                    value={saldoCierre} onChange={(e) => setSaldoCierre(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Notas de cierre (opcional)</label>
                  <textarea placeholder="Observaciones del turno..."
                    value={notasCierre} onChange={(e) => setNotasCierre(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={cerrando}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {cerrando ? 'Cerrando...' : 'Cerrar caja'}
                </button>
              </form>
              {/*Boton para generar PDF de cierre en previsualizacion*/} 
              {/* {tab === 'cierre' && esDueno && cajaAbierta && sesion && (
                  <button
                    onClick={() => generarCierrePDF(sesion)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium"
                  >
                    <Download size={14} /> Previsualizar PDF cierre
                  </button>
                )}*/}
            </div>
          )}
        </>
      )}

      {/* Cajera sin caja abierta */}
      {!esDueno && !cajaAbierta && !isLoading && (
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-6 text-center">
          <Lock size={32} className="text-yellow-500 mx-auto mb-3" />
          <p className="font-medium text-heading mb-1">Tu caja está cerrada</p>
          <p className="text-base text-muted">El administrador debe abrir tu sesión de caja.</p>
        </div>
      )}

      {esDueno && tabHistorial && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-heading">Historial de cajas cerradas</h2>

          {/* Filtros */}
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Cajera</label>
              <select value={filtroCajeraId}
                onChange={(e) => { setFiltroCajeraId(e.target.value); setPaginaHistorial(0) }}
                className="px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas</option>
                {cajeras.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombreCompleto}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Desde</label>
              <input type="date" value={filtroDesde}
                onChange={(e) => { setFiltroDesde(e.target.value); setPaginaHistorial(0) }}
                className="px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Hasta</label>
              <input type="date" value={filtroHasta}
                onChange={(e) => { setFiltroHasta(e.target.value); setPaginaHistorial(0) }}
                className="px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => { setFiltroCajeraId(''); setFiltroDesde(''); setFiltroHasta(''); setPaginaHistorial(0) }}
              className="px-3 py-2 text-sm text-muted hover:text-heading border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
              Limpiar
            </button>
          </div>

          {/* Tabla */}
          {cargandoHistorial ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : historial.length === 0 ? (
            <p className="text-muted text-base text-center py-8">No hay cajas cerradas</p>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Cajera</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Apertura</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Cierre</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Ventas</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Gastos</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {historial.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm font-medium text-heading">{s.cajera}</td>
                      <td className="px-4 py-3 text-sm text-muted">{formatFecha(s.abiertaEn)}</td>
                      <td className="px-4 py-3 text-sm text-muted">{formatFecha(s.cerradaEn)}</td>
                      <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400 font-medium">{formatCOP(s.totalVentasCop)}</td>
                      <td className="px-4 py-3 text-right text-sm text-red-600 dark:text-red-400">{formatCOP(s.totalGastosCop)}</td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${
                        s.diferenciaCop >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {s.diferenciaCop >= 0 ? '+' : ''}{formatCOP(s.diferenciaCop)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => generarCierrePDF(s)}
                            className="p-1.5 text-muted hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg"
                            title="Descargar PDF">
                            <Download size={15} />
                          </button>
                          <button onClick={() => setSesionDetalle(s.id)}
                            className="p-1.5 text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"
                            title="Ver detalle">
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {totalPaginasHistorial > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button onClick={() => setPaginaHistorial((p) => Math.max(0, p - 1))}
                    disabled={paginaHistorial === 0}
                    className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 text-heading rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">
                    Anterior
                  </button>
                  <span className="text-sm text-muted">
                    Página {paginaHistorial + 1} de {totalPaginasHistorial}
                  </span>
                  <button onClick={() => setPaginaHistorial((p) => Math.min(totalPaginasHistorial - 1, p + 1))}
                    disabled={paginaHistorial >= totalPaginasHistorial - 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 text-heading rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">
                    Siguiente
                  </button>
                </div>
              )}
              {sesionDetalle && (
                <ModalDetalleSesion
                  sesionId={sesionDetalle}
                  onClose={() => setSesionDetalle(null)}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}