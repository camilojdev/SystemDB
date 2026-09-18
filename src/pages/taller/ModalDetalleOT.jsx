import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { cambiarEstado, agregarServicio, agregarRepuesto } from '../../api/taller'
import { getProductos } from '../../api/inventario'
import { formatCOP, formatFecha } from '../../utils/formato'
import { X, ChevronRight, Plus, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { NOMBRE_NEGOCIO } from '../../utils/marca'

const ESTADOS_SIGUIENTES = {
  RECIBIDO: 'EN_DIAGNOSTICO',
  EN_DIAGNOSTICO: 'EN_REPARACION',
  EN_REPARACION: 'LISTO',
  ESPERANDO_REPUESTO: 'EN_REPARACION',
  LISTO: 'ENTREGADO',
}

const LABELS = {
  RECIBIDO: 'Iniciar diagnóstico',
  EN_DIAGNOSTICO: 'Iniciar reparación',
  EN_REPARACION: 'Marcar listo',
  ESPERANDO_REPUESTO: 'Reanudar reparación',
  LISTO: 'Marcar entregado',
}

function generarPlanillaOT(ot) {
  const doc = new jsPDF()
  const fmt = (n) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(n || 0)

  // Header
  doc.setFontSize(18); doc.setFont('helvetica', 'bold')
  doc.text(NOMBRE_NEGOCIO, 14, 20)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text('Taller automotriz', 14, 27)
  doc.setFontSize(14); doc.setFont('helvetica', 'bold')
  doc.text(`ORDEN DE TRABAJO #${ot.id}`, 120, 20)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(`Estado: ${ot.estado}`, 120, 27)
  doc.line(14, 32, 196, 32)

  // Info cliente y vehículo
  let y = 40
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL CLIENTE', 14, y); y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`Nombre: ${ot.nombreCliente || '—'}`, 14, y)
  doc.text(`Celular: ${ot.celularCliente || '—'}`, 110, y); y += 6
  doc.text(`Ingreso: ${ot.creadoEn ? new Date(ot.creadoEn).toLocaleString('es-CO') : '—'}`, 14, y)
  doc.text(`Entrega prometida: ${ot.fechaPrometidaEntrega ? new Date(ot.fechaPrometidaEntrega).toLocaleDateString('es-CO') : '—'}`, 110, y); y += 10

  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL VEHÍCULO', 14, y); y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`Placa: ${ot.placa || '—'}`, 14, y)
  doc.text(`Marca: ${ot.marcaVehiculo || '—'}`, 70, y)
  doc.text(`Modelo: ${ot.modeloVehiculo || '—'}`, 120, y); y += 6
  doc.text(`Año: ${ot.anioVehiculo || '—'}`, 14, y)
  doc.text(`Color: ${ot.colorVehiculo || '—'}`, 70, y)
  doc.text(`Km: ${ot.kilometraje || '—'}`, 120, y); y += 6
  doc.text(`Mecánico: ${ot.mecanicoNombre || 'No asignado'}`, 14, y); y += 10

  doc.line(14, y, 196, y); y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIPCIÓN DEL PROBLEMA', 14, y); y += 7
  doc.setFont('helvetica', 'normal')
  const problemaLineas = doc.splitTextToSize(ot.descripcionProblema || '—', 180)
  doc.text(problemaLineas, 14, y)
  y += problemaLineas.length * 6 + 4

  if (ot.observacionesMecanico) {
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVACIONES DEL MECÁNICO', 14, y); y += 7
    doc.setFont('helvetica', 'normal')
    const obsLineas = doc.splitTextToSize(ot.observacionesMecanico, 180)
    doc.text(obsLineas, 14, y)
    y += obsLineas.length * 6 + 4
  }

  // Servicios
  if (ot.servicios?.length > 0) {
    doc.line(14, y, 196, y); y += 7
    doc.setFont('helvetica', 'bold')
    doc.text('SERVICIOS', 14, y); y += 7
    doc.setFillColor(240, 240, 240)
    doc.rect(14, y - 5, 182, 7, 'F')
    doc.text('Descripción', 16, y)
    doc.text('Cant.', 130, y)
    doc.text('Precio unit.', 148, y)
    doc.text('Subtotal', 175, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    ot.servicios.forEach((s) => {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.text((s.descripcion || '').substring(0, 45), 16, y)
      doc.text(String(s.cantidad), 130, y)
      doc.text(fmt(s.precioUnitarioCop), 145, y)
      doc.text(fmt(s.subtotalCop), 172, y)
      y += 6
    })
    y += 2
  }

  // Repuestos
  if (ot.repuestos?.length > 0) {
    doc.line(14, y, 196, y); y += 7
    doc.setFont('helvetica', 'bold')
    doc.text('REPUESTOS', 14, y); y += 7
    doc.setFillColor(240, 240, 240)
    doc.rect(14, y - 5, 182, 7, 'F')
    doc.text('Repuesto', 16, y)
    doc.text('Cant.', 130, y)
    doc.text('Precio unit.', 148, y)
    doc.text('Subtotal', 175, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    ot.repuestos.forEach((r) => {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.text((r.nombreRepuesto || '').substring(0, 45), 16, y)
      doc.text(String(r.cantidad), 130, y)
      doc.text(fmt(r.precioUnitarioCop), 145, y)
      doc.text(fmt(r.subtotalCop), 172, y)
      y += 6
    })
    y += 2
  }

  // Totales
  doc.line(14, y, 196, y); y += 7
  doc.setFont('helvetica', 'normal')
  doc.text('Total servicios:', 130, y)
  doc.text(fmt(ot.totalServiciosCop), 172, y); y += 6
  doc.text('Total repuestos:', 130, y)
  doc.text(fmt(ot.totalRepuestosCop), 172, y); y += 6
  if (ot.descuentoCop > 0) {
    doc.text('Descuento:', 130, y)
    doc.setTextColor(220, 38, 38)
    doc.text(`-${fmt(ot.descuentoCop)}`, 172, y)
    doc.setTextColor(0, 0, 0); y += 6
  }
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', 130, y)
  doc.text(fmt(ot.granTotalCop), 172, y); y += 14

  // Firmas
  if (y > 240) { doc.addPage(); y = 20 }
  doc.line(14, y, 80, y)
  doc.line(120, y, 196, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.text('Firma del cliente', 30, y)
  doc.text('Firma del mecánico', 142, y)

  doc.setFontSize(8); doc.setTextColor(150, 150, 150)
  doc.text(`Generado por ${NOMBRE_NEGOCIO}`, 14, 290)
  doc.setTextColor(0, 0, 0)

  doc.save(`OT-${ot.id}-${ot.placa}.pdf`)
}

export default function ModalDetalleOT({ ot, onClose, onCambioEstado }) {
  const [tabActiva, setTabActiva] = useState('info')
  const [formServicio, setFormServicio] = useState({ descripcion: '', cantidad: 1, precioUnitarioCop: '' })
  const [formRepuesto, setFormRepuesto] = useState({ productoId: '', cantidad: 1 })
  const [errorServicio, setErrorServicio] = useState('')
  const [errorRepuesto, setErrorRepuesto] = useState('')

  const siguienteEstado = ESTADOS_SIGUIENTES[ot.estado]

  const { mutate: avanzar, isPending: avanzando } = useMutation({
    mutationFn: () => cambiarEstado(ot.id, siguienteEstado),
    onSuccess: onCambioEstado,
  })

  const { mutate: addServicio, isPending: guardandoServicio } = useMutation({
    mutationFn: (datos) => agregarServicio(ot.id, datos),
    onSuccess: () => {
      setFormServicio({ descripcion: '', cantidad: 1, precioUnitarioCop: '' })
      setErrorServicio('')
      onCambioEstado()
    },
    onError: (err) => setErrorServicio(err.response?.data?.mensaje || 'Error al agregar servicio'),
  })

  const { mutate: addRepuesto, isPending: guardandoRepuesto } = useMutation({
    mutationFn: (datos) => agregarRepuesto(ot.id, datos),
    onSuccess: () => {
      setFormRepuesto({ productoId: '', cantidad: 1 })
      setErrorRepuesto('')
      onCambioEstado()
    },
    onError: (err) => setErrorRepuesto(err.response?.data?.mensaje || 'Error al agregar repuesto'),
  })

  const { data: productosData } = useQuery({
    queryKey: ['productos', 0],
    queryFn: () => getProductos(0, 100).then((r) => r.data.datos.content),
    staleTime: 0,
    refetchOnMount: true,
  })
  const productos = productosData || []

  const handleServicio = (e) => {
    e.preventDefault()
    if (!formServicio.descripcion || !formServicio.precioUnitarioCop) {
      setErrorServicio('Descripción y precio son obligatorios')
      return
    }
    addServicio({
      descripcion: formServicio.descripcion,
      cantidad: Number(formServicio.cantidad),
      precioUnitarioCop: Number(formServicio.precioUnitarioCop),
    })
  }

  const handleRepuesto = (e) => {
    e.preventDefault()
    if (!formRepuesto.productoId) {
      setErrorRepuesto('Selecciona un producto')
      return
    }
    const producto = productos.find((p) => String(p.id) === String(formRepuesto.productoId))
    addRepuesto({
      productoId: Number(formRepuesto.productoId),
      cantidad: Number(formRepuesto.cantidad),
      precioUnitarioCop: producto?.precioVentaDetal || 0,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-heading">OT #{ot.id}</h2>
            <p className="text-sm text-muted">{ot.placa} — {ot.nombreCliente}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generarPlanillaOT(ot)}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <Download size={14} /> Planilla PDF
            </button>
            <button onClick={onClose} className="p-1 text-muted hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200 dark:border-slate-700 px-6 overflow-x-auto">
          {['info', 'servicios', 'repuestos'].map((tab) => (
            <button key={tab} onClick={() => setTabActiva(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 whitespace-nowrap transition-colors ${
                tabActiva === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-muted hover:text-heading'
              }`}>
              {tab === 'info' ? 'Información' : tab === 'servicios' ? 'Servicios' : 'Repuestos'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {tabActiva === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted mb-1">Cliente</p>
                  <p className="font-medium text-heading">{ot.nombreCliente}</p>
                  <p className="text-muted">{ot.celularCliente || '—'}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Vehículo</p>
                  <p className="font-medium text-heading">{ot.placa}</p>
                  <p className="text-muted">{[ot.marcaVehiculo, ot.modeloVehiculo, ot.anioVehiculo].filter(Boolean).join(' ')}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Problema</p>
                  <p className="font-medium text-heading">{ot.descripcionProblema}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Mecánico</p>
                  <p className="font-medium text-heading">{ot.mecanicoNombre || 'No asignado'}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Ingreso</p>
                  <p className="font-medium text-heading">{formatFecha(ot.creadoEn)}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Entrega prometida</p>
                  <p className="font-medium text-heading">{ot.fechaPrometidaEntrega ? formatFecha(ot.fechaPrometidaEntrega) : '—'}</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Servicios</span>
                  <span className="text-heading">{formatCOP(ot.totalServiciosCop)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Repuestos</span>
                  <span className="text-heading">{formatCOP(ot.totalRepuestosCop)}</span>
                </div>
                {ot.descuentoCop > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>Descuento</span>
                    <span>-{formatCOP(ot.descuentoCop)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-heading border-t border-gray-200 dark:border-slate-600 pt-2 mt-2">
                  <span>Total</span>
                  <span>{formatCOP(ot.granTotalCop)}</span>
                </div>
              </div>
            </div>
          )}

          {tabActiva === 'servicios' && (
            <div className="space-y-4">
              {ot.servicios?.length > 0 ? (
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg divide-y divide-gray-100 dark:divide-slate-600">
                  {ot.servicios.map((s) => (
                    <div key={s.id} className="flex justify-between items-center px-4 py-3 text-sm">
                      <span className="text-heading">{s.descripcion} x{s.cantidad}</span>
                      <span className="font-medium text-heading">{formatCOP(s.subtotalCop)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm text-center py-4">No hay servicios agregados</p>
              )}
              {ot.estado !== 'ENTREGADO' && ot.estado !== 'CANCELADO' && (
                <form onSubmit={handleServicio} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Agregar servicio</p>
                  <input type="text" placeholder="Descripción del servicio"
                    value={formServicio.descripcion}
                    onChange={(e) => setFormServicio({ ...formServicio, descripcion: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="number" placeholder="Cantidad" min="1"
                      value={formServicio.cantidad}
                      onChange={(e) => setFormServicio({ ...formServicio, cantidad: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" placeholder="Precio unitario (COP)"
                      value={formServicio.precioUnitarioCop}
                      onChange={(e) => setFormServicio({ ...formServicio, precioUnitarioCop: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {errorServicio && <p className="text-red-500 dark:text-red-400 text-xs">{errorServicio}</p>}
                  <button type="submit" disabled={guardandoServicio}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    <Plus size={14} />
                    {guardandoServicio ? 'Guardando...' : 'Agregar servicio'}
                  </button>
                </form>
              )}
            </div>
          )}

          {tabActiva === 'repuestos' && (
            <div className="space-y-4">
              {ot.repuestos?.length > 0 ? (
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg divide-y divide-gray-100 dark:divide-slate-600">
                  {ot.repuestos.map((r) => (
                    <div key={r.id} className="flex justify-between items-center px-4 py-3 text-sm">
                      <span className="text-heading">{r.nombreRepuesto} x{r.cantidad}</span>
                      <span className="font-medium text-heading">{formatCOP(r.subtotalCop)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm text-center py-4">No hay repuestos agregados</p>
              )}
              {ot.estado !== 'ENTREGADO' && ot.estado !== 'CANCELADO' && (
                <form onSubmit={handleRepuesto} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Agregar repuesto</p>
                  <select value={formRepuesto.productoId}
                    onChange={(e) => setFormRepuesto({ ...formRepuesto, productoId: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Seleccionar producto</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — Stock: {p.stockActual} — {formatCOP(p.precioVentaDetal)}
                      </option>
                    ))}
                  </select>
                  <input type="number" placeholder="Cantidad" min="1"
                    value={formRepuesto.cantidad}
                    onChange={(e) => setFormRepuesto({ ...formRepuesto, cantidad: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errorRepuesto && <p className="text-red-500 dark:text-red-400 text-xs">{errorRepuesto}</p>}
                  <button type="submit" disabled={guardandoRepuesto}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    <Plus size={14} />
                    {guardandoRepuesto ? 'Guardando...' : 'Agregar repuesto'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {siguienteEstado && (
          <div className="p-6 border-t border-gray-200 dark:border-slate-700">
            <button onClick={() => avanzar()} disabled={avanzando}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              <ChevronRight size={16} />
              {LABELS[ot.estado]}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}