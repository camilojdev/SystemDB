import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getReporteVentas, getReporteInventario, getListaPrecios,
  getReporteTaller, getProductosSinMovimiento
} from '../../api/reportes'
import { getClientes } from '../../api/clientes'
import { formatCOP, formatFecha, formatFechaCorta } from '../../utils/formato'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import {
  BarChart3, Package, DollarSign, Download, Search,
  FileSpreadsheet, CreditCard, Wrench, AlertTriangle
} from 'lucide-react'
import { NOMBRE_NEGOCIO } from '../../utils/marca'

const fmt = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0
}).format(n || 0)

function pdfVentas(ventas, desde, hasta) {
  const doc = new jsPDF()
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(`${NOMBRE_NEGOCIO} — Reporte de Ventas`, 14, 20)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(`Periodo: ${desde} al ${hasta}`, 14, 28)
  doc.text(`Total ventas: ${ventas.length}`, 14, 35)
  const total = ventas.reduce((s, v) => s + (v.totalCop || 0), 0)
  doc.text(`Total ingresos: ${fmt(total)}`, 14, 42)
  doc.line(14, 46, 196, 46)
  let y = 54
  doc.setFont('helvetica', 'bold'); doc.setFillColor(240, 240, 240)
  doc.rect(14, y - 5, 182, 7, 'F')
  doc.text('Cliente', 16, y); doc.text('Metodo', 80, y)
  doc.text('Items', 120, y); doc.text('Total', 145, y); doc.text('Fecha', 170, y)
  y += 5; doc.setFont('helvetica', 'normal')
  ventas.forEach((v) => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.text((v.nombreCliente || 'Ocasional').substring(0, 25), 16, y)
    doc.text(v.metodoPago || '', 80, y)
    doc.text(String(v.cantidadItems || 0), 120, y)
    doc.text(fmt(v.totalCop), 140, y)
    doc.text(v.fecha ? new Date(v.fecha).toLocaleDateString('es-CO') : '', 170, y)
    y += 7
  })
  doc.setFontSize(8); doc.setTextColor(150, 150, 150)
  doc.text(`Generado por ${NOMBRE_NEGOCIO} — ` + new Date().toLocaleDateString('es-CO'), 14, 290)
  doc.setTextColor(0, 0, 0)
  doc.save(`ventas-${desde}-${hasta}.pdf`)
}

function pdfInventario(productos) {
  const doc = new jsPDF()
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(`${NOMBRE_NEGOCIO} — Reporte de Inventario`, 14, 20)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 28)
  doc.line(14, 32, 196, 32)
  let y = 42
  doc.setFont('helvetica', 'bold'); doc.setFillColor(240, 240, 240)
  doc.rect(14, y - 5, 182, 7, 'F')
  doc.text('Producto', 16, y); doc.text('Stock', 100, y)
  doc.text('Min', 120, y); doc.text('Precio', 145, y); doc.text('Estado', 175, y)
  y += 5; doc.setFont('helvetica', 'normal')
  productos.forEach((p) => {
    if (y > 270) { doc.addPage(); y = 20 }
    p.stockBajo ? doc.setTextColor(220, 38, 38) : doc.setTextColor(0, 0, 0)
    doc.text((p.nombre || '').substring(0, 35), 16, y)
    doc.setTextColor(0, 0, 0)
    doc.text(String(p.stockActual), 100, y)
    doc.text(String(p.stockMinimo), 120, y)
    doc.text(fmt(p.precioVentaDetal), 140, y)
    doc.text(p.stockActual === 0 ? 'Agotado' : p.stockBajo ? 'Bajo' : 'OK', 175, y)
    y += 7
  })
  doc.setFontSize(8); doc.setTextColor(150, 150, 150)
  doc.text(`Generado por ${NOMBRE_NEGOCIO} — ` + new Date().toLocaleDateString('es-CO'), 14, 290)
  doc.setTextColor(0, 0, 0); doc.save('inventario.pdf')
}

function pdfListaPrecios(productos) {
  const doc = new jsPDF()
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(`${NOMBRE_NEGOCIO} — Lista de Precios`, 14, 20)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 28)
  doc.line(14, 32, 196, 32)
  let y = 42
  doc.setFont('helvetica', 'bold'); doc.setFillColor(240, 240, 240)
  doc.rect(14, y - 5, 182, 7, 'F')
  doc.text('Producto', 16, y); doc.text('Codigo', 110, y); doc.text('Precio', 155, y)
  y += 5; doc.setFont('helvetica', 'normal')
  productos.forEach((p) => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.text((p.nombre || '').substring(0, 45), 16, y)
    doc.text(p.codigo || '', 110, y)
    doc.text(fmt(p.precioVentaDetal), 155, y)
    y += 7
  })
  doc.setFontSize(8); doc.setTextColor(150, 150, 150)
  doc.text(`Generado por ${NOMBRE_NEGOCIO} — ` + new Date().toLocaleDateString('es-CO'), 14, 290)
  doc.setTextColor(0, 0, 0); doc.save('lista-precios.pdf')
}

function excelListaPrecios(productos) {
  const datos = productos.map((p) => ({
    'Producto': p.nombre || '',
    'Código': p.codigo || '',
    'Categoría': p.categoriaNombre || '',
    'Precio Detal': p.precioVentaDetal || 0,
    'Precio Detal (COP)': fmt(p.precioVentaDetal),
    'Precio Mayor': p.precioVentaMayor || 0,
    'Precio Mayor (COP)': fmt(p.precioVentaMayor),
  }))
  const hoja = XLSX.utils.json_to_sheet(datos)
  hoja['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 18 }]
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Lista de Precios')
  const info = XLSX.utils.aoa_to_sheet([
    [`${NOMBRE_NEGOCIO} — Lista de Precios`],
    [`Generado: ${new Date().toLocaleString('es-CO')}`],
    [`Total productos: ${productos.length}`],
  ])
  XLSX.utils.book_append_sheet(libro, info, 'Info')
  XLSX.writeFile(libro, `lista-precios-${new Date().toISOString().split('T')[0]}.xlsx`)
}

function pdfCreditos(clientes) {
  const doc = new jsPDF()
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(`${NOMBRE_NEGOCIO} — Reporte de Créditos`, 14, 20)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 28)
  const totalDeuda = clientes.reduce((s, c) => s + (c.saldoCreditoCop || 0), 0)
  doc.text(`Total por cobrar: ${fmt(totalDeuda)}`, 14, 35)
  doc.line(14, 39, 196, 39)
  let y = 47
  doc.setFont('helvetica', 'bold'); doc.setFillColor(240, 240, 240)
  doc.rect(14, y - 5, 182, 7, 'F')
  doc.text('Cliente', 16, y); doc.text('Identificación', 80, y)
  doc.text('Total deuda', 120, y); doc.text('Saldo pendiente', 158, y)
  y += 5; doc.setFont('helvetica', 'normal')
  clientes.forEach((c) => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.text((c.nombreCompleto || '').substring(0, 30), 16, y)
    doc.text(`${c.tipoIdentificacion} ${c.numeroIdentificacion}`, 80, y)
    doc.text(fmt(c.cupoCreditoCop), 120, y)
    doc.setTextColor(220, 38, 38)
    doc.text(fmt(c.saldoCreditoCop), 158, y)
    doc.setTextColor(0, 0, 0)
    y += 7
  })
  doc.setFontSize(8); doc.setTextColor(150, 150, 150)
  doc.text(`Generado por ${NOMBRE_NEGOCIO} — ` + new Date().toLocaleDateString('es-CO'), 14, 290)
  doc.setTextColor(0, 0, 0); doc.save('reporte-creditos.pdf')
}

function pdfMecanicos(ots) {
  const doc = new jsPDF()
  const porMecanico = {}
  ots.forEach((ot) => {
    const nombre = ot.mecanicoNombre || 'Sin asignar'
    if (!porMecanico[nombre]) porMecanico[nombre] = { ots: 0, total: 0 }
    porMecanico[nombre].ots++
    porMecanico[nombre].total += ot.granTotalCop || 0
  })

  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(`${NOMBRE_NEGOCIO} — Reporte de Mecánicos`, 14, 20)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 28)
  doc.line(14, 32, 196, 32)

  let y = 42
  doc.setFont('helvetica', 'bold'); doc.setFillColor(240, 240, 240)
  doc.rect(14, y - 5, 182, 7, 'F')
  doc.text('Mecánico', 16, y); doc.text('OTs', 110, y)
  doc.text('Total facturado', 135, y); doc.text('Promedio/OT', 170, y)
  y += 5; doc.setFont('helvetica', 'normal')

  Object.entries(porMecanico).forEach(([nombre, datos]) => {
    if (y > 270) { doc.addPage(); y = 20 }
    const promedio = datos.ots > 0 ? datos.total / datos.ots : 0
    doc.text(nombre.substring(0, 35), 16, y)
    doc.text(String(datos.ots), 110, y)
    doc.text(fmt(datos.total), 130, y)
    doc.text(fmt(promedio), 168, y)
    y += 7
  })

  doc.setFontSize(8); doc.setTextColor(150, 150, 150)
  doc.text(`Generado por ${NOMBRE_NEGOCIO} — ` + new Date().toLocaleDateString('es-CO'), 14, 290)
  doc.setTextColor(0, 0, 0); doc.save('reporte-mecanicos.pdf')
}

function pdfSinMovimiento(productos, dias) {
  const doc = new jsPDF()
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(`${NOMBRE_NEGOCIO} — Productos Sin Movimiento`, 14, 20)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(`Sin movimiento en los últimos ${dias} días`, 14, 28)
  const totalInmovilizado = productos.reduce((s, p) => s + (p.valorInmovilizadoCop || 0), 0)
  doc.text(`Total inmovilizado: ${fmt(totalInmovilizado)}`, 14, 35)
  doc.line(14, 39, 196, 39)

  let y = 47
  doc.setFont('helvetica', 'bold'); doc.setFillColor(240, 240, 240)
  doc.rect(14, y - 5, 182, 7, 'F')
  doc.text('Producto', 16, y); doc.text('Categoría', 85, y)
  doc.text('Stock', 125, y); doc.text('Valor', 145, y); doc.text('Último mov.', 170, y)
  y += 5; doc.setFont('helvetica', 'normal')

  productos.forEach((p) => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.text((p.nombre || '').substring(0, 30), 16, y)
    doc.text((p.categoria || '').substring(0, 18), 85, y)
    doc.text(String(p.stockActual), 128, y)
    doc.text(fmt(p.valorInmovilizadoCop), 143, y)
    doc.text(p.ultimoMovimiento ? formatFechaCorta(p.ultimoMovimiento) : 'Nunca', 170, y)
    y += 7
  })

  doc.setFontSize(8); doc.setTextColor(150, 150, 150)
  doc.text(`Generado por ${NOMBRE_NEGOCIO} — ` + new Date().toLocaleDateString('es-CO'), 14, 290)
  doc.setTextColor(0, 0, 0); doc.save(`productos-sin-movimiento-${dias}dias.pdf`)
}

export default function Reportes() {
  const [tab, setTab] = useState('ventas')
  const [desde, setDesde] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0])
  const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0])
  const [buscar, setBuscar] = useState(0)
  const [diasSinMovimiento, setDiasSinMovimiento] = useState(30)

  const { data: ventasData, isLoading: cargandoVentas } = useQuery({
    queryKey: ['reporte-ventas', desde, hasta, buscar],
    queryFn: () => getReporteVentas(desde, hasta).then((r) => r.data.datos),
    enabled: Boolean(buscar > 0),
  })

  const { data: inventarioData } = useQuery({
    queryKey: ['reporte-inventario'],
    queryFn: () => getReporteInventario().then((r) => r.data.datos),
    enabled: Boolean(tab === 'inventario'),
  })

  const { data: listaPreciosData } = useQuery({
    queryKey: ['lista-precios'],
    queryFn: () => getListaPrecios().then((r) => r.data.datos),
    enabled: Boolean(tab === 'precios'),
  })

  const { data: clientesData } = useQuery({
    queryKey: ['reporte-creditos'],
    queryFn: () => getClientes(0, 200).then((r) => r.data.datos?.content || []),
    enabled: Boolean(tab === 'creditos'),
  })

  const { data: tallerData } = useQuery({
    queryKey: ['reporte-taller'],
    queryFn: () => getReporteTaller().then((r) => r.data.datos),
    enabled: Boolean(tab === 'mecanicos'),
  })

  const { data: sinMovimientoData, isLoading: cargandoSinMovimiento } = useQuery({
    queryKey: ['reporte-sin-movimiento', diasSinMovimiento],
    queryFn: () => getProductosSinMovimiento(diasSinMovimiento).then((r) => r.data.datos),
    enabled: Boolean(tab === 'sin-movimiento'),
  })

  const ventas = ventasData?.content || ventasData || []
  const inventario = inventarioData || []
  const listaPrecios = listaPreciosData || []
  const clientesCredito = (clientesData || []).filter((c) => c.creditoHabilitado && c.saldoCreditoCop > 0)
  const totalDeuda = clientesCredito.reduce((s, c) => s + (c.saldoCreditoCop || 0), 0)
  const otsAll = tallerData || []
  const productosSinMovimiento = sinMovimientoData || []
  const totalInmovilizado = productosSinMovimiento.reduce((s, p) => s + (p.valorInmovilizadoCop || 0), 0)

  // Agrupar OTs por mecánico
  const porMecanico = {}
  otsAll.forEach((ot) => {
    const nombre = ot.mecanicoNombre || 'Sin asignar'
    if (!porMecanico[nombre]) porMecanico[nombre] = { ots: 0, total: 0, entregadas: 0 }
    porMecanico[nombre].ots++
    porMecanico[nombre].total += ot.granTotalCop || 0
    if (ot.estado === 'ENTREGADO') porMecanico[nombre].entregadas++
  })
  const mecanicos = Object.entries(porMecanico).map(([nombre, d]) => ({
    nombre, ...d, promedio: d.ots > 0 ? d.total / d.ots : 0
  }))

  const fmtCOP = (n) => formatCOP(n || 0)

  const TABS = [
    { key: 'ventas', label: 'Ventas', icon: DollarSign },
    { key: 'inventario', label: 'Inventario', icon: Package },
    { key: 'precios', label: 'Lista de precios', icon: BarChart3 },
    { key: 'creditos', label: 'Créditos', icon: CreditCard },
    { key: 'mecanicos', label: 'Mecánicos', icon: Wrench },
    { key: 'sin-movimiento', label: 'Sin movimiento', icon: AlertTriangle },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-heading">Reportes</h1>
        <p className="text-muted text-base mt-1">Análisis y exportación de datos</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted hover:text-heading'
            }`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* Tab ventas */}
      {tab === 'ventas' && (
        <div className="card space-y-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Desde</label>
              <input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setBuscar(0) }}
                className="px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setBuscar(0) }}
                className="px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => setBuscar((n) => n + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <Search size={14} /> Generar
            </button>
            {ventas.length > 0 && (
              <button onClick={() => pdfVentas(ventas, desde, hasta)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-heading hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">
                <Download size={14} /> PDF
              </button>
            )}
          </div>
          {cargandoVentas && <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}
          {ventas.length > 0 && !cargandoVentas && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted mb-1">Total ventas</p>
                  <p className="text-2xl font-bold text-heading">{ventas.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-500/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted mb-1">Ingresos</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-400">{fmtCOP(ventas.reduce((s, v) => s + (v.totalCop || 0), 0))}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted mb-1">Ticket promedio</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{fmtCOP(ventas.reduce((s, v) => s + (v.totalCop || 0), 0) / ventas.length)}</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Cliente</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Método</th>
                    <th className="text-center text-xs font-semibold text-muted uppercase px-4 py-2">Items</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Total</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {ventas.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3 text-sm text-heading">{v.nombreCliente || 'Ocasional'}</td>
                      <td className="px-4 py-3 text-sm text-muted">{v.metodoPago}</td>
                      <td className="px-4 py-3 text-center text-sm text-heading">{v.cantidadItems}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-heading">{fmtCOP(v.totalCop)}</td>
                      <td className="px-4 py-3 text-sm text-muted">{formatFecha(v.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
          {buscar > 0 && !cargandoVentas && ventas.length === 0 && (
            <p className="text-muted text-sm text-center py-8">Sin ventas en ese período</p>
          )}
        </div>
      )}

      {/* Tab inventario */}
      {tab === 'inventario' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-heading">Reporte de inventario</h2>
            {inventario.length > 0 && (
              <button onClick={() => pdfInventario(inventario)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-heading hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">
                <Download size={14} /> PDF
              </button>
            )}
          </div>
          {!inventarioData ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : inventario.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">Sin productos</p>
          ) : (
            <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Producto</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Categoría</th>
                  <th className="text-center text-xs font-semibold text-muted uppercase px-4 py-2">Stock</th>
                  <th className="text-center text-xs font-semibold text-muted uppercase px-4 py-2">Mínimo</th>
                  <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Precio</th>
                  <th className="text-center text-xs font-semibold text-muted uppercase px-4 py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {inventario.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 text-sm font-medium text-heading">{p.nombre}</td>
                    <td className="px-4 py-3 text-sm text-muted">{p.categoria || '—'}</td>
                    <td className={`px-4 py-3 text-center text-sm font-bold ${p.stockActual === 0 ? 'text-red-600 dark:text-red-400' : p.stockBajo ? 'text-yellow-600 dark:text-yellow-400' : 'text-heading'}`}>{p.stockActual}</td>
                    <td className="px-4 py-3 text-center text-sm text-muted">{p.stockMinimo}</td>
                    <td className="px-4 py-3 text-right text-sm text-heading">{fmtCOP(p.precioVentaDetal)}</td>
                    <td className="px-4 py-3 text-center">
                      {p.stockActual === 0
                        ? <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-full">Agotado</span>
                        : p.stockBajo
                          ? <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded-full">Stock bajo</span>
                          : <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 rounded-full">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Tab lista de precios */}
      {tab === 'precios' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-heading">Lista de precios</h2>
            {listaPrecios.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={() => pdfListaPrecios(listaPrecios)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-heading hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">
                  <Download size={14} /> PDF
                </button>
                <button onClick={() => excelListaPrecios(listaPrecios)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                  <FileSpreadsheet size={14} /> Excel
                </button>
              </div>
            )}
          </div>
          {!listaPreciosData ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : listaPrecios.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">No hay productos en la lista de precios</p>
          ) : (
            <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Producto</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Código</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Categoría</th>
                  <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {listaPrecios.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 text-sm font-medium text-heading">{p.nombre}</td>
                    <td className="px-4 py-3 text-sm font-mono text-muted">{p.codigo}</td>
                    <td className="px-4 py-3 text-sm text-muted">{p.categoriaNombre || '—'}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-heading">{fmtCOP(p.precioVentaDetal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Tab créditos */}
      {tab === 'creditos' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-heading">Cartera de créditos</h2>
            {clientesCredito.length > 0 && (
              <button onClick={() => pdfCreditos(clientesCredito)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-heading hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">
                <Download size={14} /> PDF
              </button>
            )}
          </div>

          {!clientesData ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : clientesCredito.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">No hay créditos activos</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted mb-1">Clientes con crédito</p>
                  <p className="text-2xl font-bold text-heading">{clientesCredito.length}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted mb-1">Total por cobrar</p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-400">{fmtCOP(totalDeuda)}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted mb-1">Promedio por cliente</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{fmtCOP(totalDeuda / clientesCredito.length)}</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Cliente</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Identificación</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Total deuda</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Saldo pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {[...clientesCredito].sort((a, b) => b.saldoCreditoCop - a.saldoCreditoCop).map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3 text-sm font-medium text-heading">{c.nombreCompleto}</td>
                      <td className="px-4 py-3 text-sm text-muted">{c.tipoIdentificacion} {c.numeroIdentificacion}</td>
                      <td className="px-4 py-3 text-right text-sm text-heading">{fmtCOP(c.cupoCreditoCop)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">{fmtCOP(c.saldoCreditoCop)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab mecánicos */}
      {tab === 'mecanicos' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-heading">Rendimiento por mecánico</h2>
            {mecanicos.length > 0 && (
              <button onClick={() => pdfMecanicos(otsAll)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-heading hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">
                <Download size={14} /> PDF
              </button>
            )}
          </div>

          {!tallerData ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : mecanicos.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">Sin datos de mecánicos</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted mb-1">Total OTs</p>
                  <p className="text-2xl font-bold text-heading">{otsAll.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-500/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted mb-1">Total facturado</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-400">{fmtCOP(otsAll.reduce((s, o) => s + (o.granTotalCop || 0), 0))}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted mb-1">Mecánicos activos</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{mecanicos.filter(m => m.nombre !== 'Sin asignar').length}</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Mecánico</th>
                    <th className="text-center text-xs font-semibold text-muted uppercase px-4 py-2">OTs totales</th>
                    <th className="text-center text-xs font-semibold text-muted uppercase px-4 py-2">Entregadas</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Total facturado</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Promedio/OT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {[...mecanicos].sort((a, b) => b.total - a.total).map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3 text-sm font-medium text-heading">{m.nombre}</td>
                      <td className="px-4 py-3 text-center text-sm text-heading">{m.ots}</td>
                      <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400 font-medium">{m.entregadas}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-heading">{fmtCOP(m.total)}</td>
                      <td className="px-4 py-3 text-right text-sm text-muted">{fmtCOP(m.promedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab productos sin movimiento */}
      {tab === 'sin-movimiento' && (
        <div className="card space-y-4">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Días sin movimiento</label>
                <input
                  type="number"
                  min={1}
                  value={diasSinMovimiento}
                  onChange={(e) => setDiasSinMovimiento(Math.max(1, Number(e.target.value) || 1))}
                  className="w-28 px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {productosSinMovimiento.length > 0 && (
              <button onClick={() => pdfSinMovimiento(productosSinMovimiento, diasSinMovimiento)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-heading hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">
                <Download size={14} /> PDF
              </button>
            )}
          </div>

          {cargandoSinMovimiento ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : productosSinMovimiento.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">
              No hay productos sin movimiento en los últimos {diasSinMovimiento} días
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted mb-1">Productos sin movimiento</p>
                  <p className="text-2xl font-bold text-heading">{productosSinMovimiento.length}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted mb-1">Valor inmovilizado</p>
                  <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{fmtCOP(totalInmovilizado)}</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Producto</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Categoría</th>
                    <th className="text-center text-xs font-semibold text-muted uppercase px-4 py-2">Stock</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Valor inmov.</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Último movimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {productosSinMovimiento.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3 text-sm font-medium text-heading">{p.nombre}</td>
                      <td className="px-4 py-3 text-sm text-muted">{p.categoria || '—'}</td>
                      <td className="px-4 py-3 text-center text-sm text-heading">{p.stockActual}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-yellow-700 dark:text-yellow-400">{fmtCOP(p.valorInmovilizadoCop)}</td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {p.ultimoMovimiento
                          ? `${formatFechaCorta(p.ultimoMovimiento)} (${p.diasSinMovimiento} días)`
                          : <span className="text-red-600 dark:text-red-400 font-medium">Nunca</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}