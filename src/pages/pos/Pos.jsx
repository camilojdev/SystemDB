import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProductos, buscarProductos } from '../../api/inventario'
import { buscarClientes } from '../../api/clientes'
import { crearVenta } from '../../api/pos'
import { formatCOP } from '../../utils/formato'
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Package, Download, DollarSign, Banknote, Landmark, CreditCard, Layers } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import {useNavigate } from 'react-router-dom'
import useCajaStore from '../../store/cajaStore'
import useAuthStore from '../../store/authStore'
import { jsPDF } from 'jspdf'
import { NOMBRE_NEGOCIO } from '../../utils/marca'

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo', icono: Banknote },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icono: Landmark },
  { value: 'CREDITO', label: 'Crédito', icono: CreditCard },
  { value: 'MIXTO', label: 'Mixto', icono: Layers },
]

const DENOMINACIONES_COP = [5000, 10000, 20000, 50000, 100000]

function generarUUID() {
  return crypto.randomUUID()
}

function cargarLogoDataUrl() {
  return new Promise((resolve, reject) => {
    const imagen = new Image()
    imagen.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = imagen.naturalWidth
      canvas.height = imagen.naturalHeight
      canvas.getContext('2d').drawImage(imagen, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    imagen.onerror = reject
    imagen.src = '/logo-db.png'
  })
}

async function generarFacturaPDF(venta, negocio = NOMBRE_NEGOCIO) {
  const doc = new jsPDF()
  const fmt = (n) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(n || 0)

  // Header
  const logo = await cargarLogoDataUrl()
  doc.addImage(logo, 'PNG', 14, 8, 24, 18)
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(negocio, 42, 20)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text('Almacén y servicios eléctricos', 42, 27)
  doc.line(14, 32, 196, 32)

  // Info factura
  doc.setFontSize(12); doc.setFont('helvetica', 'bold')
  doc.text(`FACTURA DE VENTA #${venta.id}`, 14, 40)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${new Date(venta.creadoEn).toLocaleString('es-CO')}`, 14, 48)
  doc.text(`Cliente: ${venta.nombreCliente || 'Cliente general'}`, 14, 55)
  doc.text(`Método de pago: ${venta.metodoPago}`, 14, 62)
  doc.line(14, 67, 196, 67)

  // Productos
  let y = 75
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(240, 240, 240)
  doc.rect(14, y - 5, 182, 7, 'F')
  doc.text('Producto', 16, y)
  doc.text('Cod.', 90, y)
  doc.text('Cant.', 120, y)
  doc.text('Precio', 140, y)
  doc.text('Subtotal', 168, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  venta.items?.forEach((item) => {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.text((item.nombreProducto || '').substring(0, 30), 16, y)
    doc.text(item.codigoProducto || '', 90, y)
    doc.text(String(item.cantidad), 120, y)
    doc.text(fmt(item.precioUnitarioCop), 135, y)
    doc.text(fmt(item.subtotalCop), 168, y)
    y += 7
  })

  // Totales
  y += 3
  doc.line(14, y, 196, y); y += 7
  if (venta.descuentoCop > 0) {
    doc.text('Descuento:', 130, y)
    doc.text(`-${fmt(venta.descuentoCop)}`, 168, y); y += 7
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL:', 130, y)
  doc.text(fmt(venta.totalCop), 168, y); y += 8

  if (venta.vueltoCop > 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.text(`Vuelto: ${fmt(venta.vueltoCop)}`, 130, y); y += 7
  }

  if (venta.puntosGanados > 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.setTextColor(180, 120, 0)
    doc.text(`Puntos ganados: +${venta.puntosGanados}`, 14, y)
    doc.setTextColor(0, 0, 0)
  }

  // Footer
  doc.setFontSize(8); doc.setTextColor(150, 150, 150)
  doc.text('Gracias por su compra — ' + negocio, 14, 285)
  doc.text(`Factura #${venta.id}`, 170, 285)
  doc.setTextColor(0, 0, 0)

  doc.save(`factura-${venta.id}.pdf`)
}

export default function Pos() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const cajaAbierta = useCajaStore((s) => s.cajaAbierta)
  const cargandoCaja = useCajaStore((s) => s.cargando)
  const usuario = useAuthStore((s) => s.usuario)

  const [busqueda, setBusqueda] = useState('')
  const debouncedBusqueda = useDebounce(busqueda, 400)

  const [carrito, setCarrito] = useState([])

  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteEncontrado, setClienteEncontrado] = useState(null)
  const debouncedCliente = useDebounce(busquedaCliente, 300)

  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [montoEfectivo, setMontoEfectivo] = useState('')
  const [montoTransferencia, setMontoTransferencia] = useState('')
  const [montoCredito, setMontoCredito] = useState('')

  const [mensajeExito, setMensajeExito] = useState(null)
  const [error, setError] = useState('')

  const { data: productosData } = useQuery({
    queryKey: debouncedBusqueda.length >= 2
      ? ['productos-busqueda', debouncedBusqueda]
      : ['productos', 0],
    queryFn: () =>
      debouncedBusqueda.length >= 2
        ? buscarProductos(debouncedBusqueda).then((r) => r.data.datos)
        : getProductos(0, 50).then((r) => r.data.datos.content),
  })
  const productos = productosData || []

  const { data: clientesSugeridosData } = useQuery({
    queryKey: ['clientes-busqueda-pos', debouncedCliente],
    queryFn: () =>
      debouncedCliente.length >= 2
        ? buscarClientes(debouncedCliente).then((r) => r.data.datos)
        : Promise.resolve([]),
    enabled: Boolean(debouncedCliente.length >= 2 && !clienteEncontrado),
  })
  const clientesSugeridos = clientesSugeridosData || []

  const subtotal = useMemo(
    () => carrito.reduce((sum, item) => sum + item.precioUnitarioCop * item.cantidad, 0),
    [carrito]
  )

  const totalMixto = Number(montoEfectivo || 0) + Number(montoTransferencia || 0) + Number(montoCredito || 0)
  const vuelto = metodoPago === 'EFECTIVO' && montoEfectivo
    ? Number(montoEfectivo) - subtotal
    : 0

  const { mutate: registrarVenta, isPending } = useMutation({
    mutationFn: crearVenta,
    onSuccess: (res) => {
      setMensajeExito(res.data.datos)
      setCarrito([])
      setClienteEncontrado(null)
      setBusquedaCliente('')
      setMontoEfectivo('')
      setMontoTransferencia('')
      setMontoCredito('')
      setError('')
      queryClient.invalidateQueries(['productos'])
      queryClient.invalidateQueries(['dashboard'])
    },
    onError: (err) => {
      setError(err.response?.data?.mensaje || 'Error al procesar la venta')
    },
  })

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.productoId === producto.id)
      if (existe) {
        if (existe.cantidad >= producto.stockActual) return prev
        return prev.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precioUnitarioCop: producto.precioVentaDetal,
          cantidad: 1,
          stockDisponible: producto.stockActual,
        },
      ]
    })
  }

  const cambiarCantidad = (productoId, delta) => {
    setCarrito((prev) =>
      prev.map((i) => {
        if (i.productoId !== productoId) return i
        const nuevaCantidad = i.cantidad + delta
        if (nuevaCantidad < 1 || nuevaCantidad > i.stockDisponible) return i
        return { ...i, cantidad: nuevaCantidad }
      })
    )
  }

  const quitarDelCarrito = (productoId) => {
    setCarrito((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  const vaciarCarrito = () => {
    if (carrito.length === 0) return
    if (confirm('¿Vaciar todo el carrito?')) setCarrito([])
  }

  const agregarEfectivo = (monto) => {
    setMontoEfectivo((prev) => String(Number(prev || 0) + monto))
  }

  const usarMontoExacto = () => setMontoEfectivo(String(subtotal))

  const handleCobrar = () => {
    setError('')
    if (carrito.length === 0) {
      setError('Agrega al menos un producto')
      return
    }
    if (metodoPago === 'EFECTIVO' && montoEfectivo && Number(montoEfectivo) < subtotal) {
      setError(`Faltan ${formatCOP(subtotal - Number(montoEfectivo))} para completar el pago`)
      return
    }
    if (metodoPago === 'MIXTO' && totalMixto < subtotal) {
      setError(`Faltan ${formatCOP(subtotal - totalMixto)} para completar el pago`)
      return
    }

    registrarVenta({
      claveIdempotencia: generarUUID(),
      clienteId: clienteEncontrado ? clienteEncontrado.id : null,
      nombreClienteAnonimo: clienteEncontrado ? null : 'Cliente general',
      metodoPago,
      montoPagadoCop: metodoPago === 'EFECTIVO'
        ? (montoEfectivo ? Number(montoEfectivo) : subtotal)
        : subtotal,
      montoEfectivoCop: Number(montoEfectivo) || 0,
      montoTransferenciaCop: Number(montoTransferencia) || 0,
      montoCreditoCop: Number(montoCredito) || 0,
      items: carrito.map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precioUnitarioCop: i.precioUnitarioCop,
      })),
    })
  }

  if (cargandoCaja) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!cajaAbierta) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-2xl p-8 text-center max-w-sm">
          <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign size={24} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-lg font-semibold text-heading mb-2">Caja cerrada</h2>
          <p className="text-muted text-sm mb-4">
            Debes abrir la caja antes de realizar ventas.
          </p>
          <button
            onClick={() => navigate('/caja')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Ir a Caja
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Columna izquierda */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-heading">Punto de Venta</h1>
            <p className="text-muted text-sm mt-0.5">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {usuario && (
            <div className="hidden md:flex items-center gap-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-sm flex-shrink-0">
                {usuario.nombreCompleto?.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm leading-tight">
                <p className="font-medium text-heading">{usuario.nombreCompleto}</p>
                <p className="text-xs text-muted">Vendiendo ahora</p>
              </div>
            </div>
          )}
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar producto por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-heading placeholder-gray-400 dark:placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {productos.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-muted">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {productos.map((p) => {
              const agotado = p.stockActual === 0
              const stockBajo = !agotado && p.stockActual <= 5
              return (
                <button
                  key={p.id}
                  onClick={() => agregarAlCarrito(p)}
                  disabled={agotado}
                  className="group relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-left hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-slate-700"
                >
                  {(agotado || stockBajo) && (
                    <span className={`absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      agotado
                        ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                        : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {agotado ? 'Agotado' : `Quedan ${p.stockActual}`}
                    </span>
                  )}
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Package size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="font-medium text-sm text-heading truncate">{p.nombre}</p>
                  <p className="text-xs text-muted mb-2">Stock: {p.stockActual}</p>
                  <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{formatCOP(p.precioVentaDetal)}</p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Columna derecha: carrito */}
      <div className="w-96 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-muted" />
            <h2 className="font-semibold text-heading text-lg">Carrito</h2>
            <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
              {carrito.length} {carrito.length === 1 ? 'item' : 'items'}
            </span>
            {carrito.length > 0 && (
              <button onClick={vaciarCarrito} className="ml-auto text-xs text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors">
                Vaciar
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {carrito.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={32} className="text-gray-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-muted text-sm">Carrito vacío</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Toca un producto para agregarlo</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div key={item.productoId} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-heading flex-1">{item.nombre}</p>
                  <button onClick={() => quitarDelCarrito(item.productoId)}>
                    <Trash2 size={14} className="text-gray-400 dark:text-slate-500 hover:text-red-500" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => cambiarCantidad(item.productoId, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-heading rounded hover:bg-gray-100 dark:hover:bg-slate-600"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium w-6 text-center text-heading">{item.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(item.productoId, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-heading rounded hover:bg-gray-100 dark:hover:bg-slate-600"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-heading">
                    {formatCOP(item.precioUnitarioCop * item.cantidad)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
          {/* Búsqueda cliente */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Buscar cliente (nombre o cédula)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe nombre o cédula..."
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value)
                  if (!e.target.value) setClienteEncontrado(null)
                }}
                disabled={!!clienteEncontrado}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-slate-800"
              />
              {clientesSugeridos.length > 0 && !clienteEncontrado && (
                <div className="absolute bottom-full mb-1 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  {clientesSugeridos.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setClienteEncontrado(c)
                        setBusquedaCliente(c.nombreCompleto)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm border-b border-gray-100 dark:border-slate-700 last:border-0"
                    >
                      <p className="font-medium text-heading">{c.nombreCompleto}</p>
                      <p className="text-xs text-muted">{c.tipoIdentificacion} {c.numeroIdentificacion}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {clienteEncontrado ? (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-800 dark:text-blue-300">{clienteEncontrado.nombreCompleto}</p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs">
                    ⭐ {clienteEncontrado.saldoPuntos} puntos — {clienteEncontrado.tipoIdentificacion} {clienteEncontrado.numeroIdentificacion}
                  </p>
                </div>
                <button onClick={() => { setClienteEncontrado(null); setBusquedaCliente('') }}
                  className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 ml-2">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">Sin cliente — venta como ocasional</p>
          )}

          {/* Método de pago — selector tipo terminal, no dropdown */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Método de pago</label>
            <div className="grid grid-cols-4 gap-1.5">
              {METODOS_PAGO.map((m) => {
                const Icono = m.icono
                const activo = metodoPago === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setMetodoPago(m.value)
                      setMontoEfectivo('')
                      setMontoTransferencia('')
                      setMontoCredito('')
                    }}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      activo
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 dark:bg-slate-700/50 text-muted hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icono size={16} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Efectivo */}
          {metodoPago === 'EFECTIVO' && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Monto recibido</label>
              <input
                type="number"
                placeholder={String(subtotal)}
                value={montoEfectivo}
                onChange={(e) => setMontoEfectivo(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button type="button" onClick={usarMontoExacto}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20">
                  Exacto
                </button>
                {DENOMINACIONES_COP.map((d) => (
                  <button key={d} type="button" onClick={() => agregarEfectivo(d)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-heading hover:bg-gray-200 dark:hover:bg-slate-600">
                    +{formatCOP(d)}
                  </button>
                ))}
              </div>
              {montoEfectivo && vuelto > 0 && (
                <div className="flex justify-between items-center bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg px-3 py-2 mt-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Vuelto</span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">{formatCOP(vuelto)}</span>
                </div>
              )}
              {montoEfectivo && vuelto < 0 && (
                <div className="flex justify-between items-center bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-2 mt-2">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">Falta</span>
                  <span className="text-lg font-bold text-red-700 dark:text-red-300">{formatCOP(Math.abs(vuelto))}</span>
                </div>
              )}
            </div>
          )}

          {/* Mixto */}
          {metodoPago === 'MIXTO' && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted">Desglose del pago</p>
              <div>
                <label className="block text-xs text-muted mb-1">Efectivo</label>
                <input type="number" placeholder="0" value={montoEfectivo}
                  onChange={(e) => setMontoEfectivo(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Transferencia</label>
                <input type="number" placeholder="0" value={montoTransferencia}
                  onChange={(e) => setMontoTransferencia(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Crédito</label>
                <input type="number" placeholder="0" value={montoCredito}
                  onChange={(e) => setMontoCredito(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {totalMixto > 0 && (
                <div className={`flex justify-between text-xs px-2 py-1.5 rounded-lg ${
                  totalMixto >= subtotal
                    ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'
                }`}>
                  <span>Total ingresado</span>
                  <span className="font-semibold">{formatCOP(totalMixto)}</span>
                </div>
              )}
            </div>
          )}

          {/* Total — destacado como el display de una caja registradora */}
          <div className="flex justify-between items-center py-3 px-3 rounded-lg bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-700">
            <span className="text-muted font-medium">Total</span>
            <span className="text-2xl font-bold text-heading">{formatCOP(subtotal)}</span>
          </div>

          {error && (
            <p className="text-red-500 dark:text-red-400 text-xs bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            onClick={handleCobrar}
            disabled={
              isPending ||
              carrito.length === 0 ||
              (metodoPago === 'EFECTIVO' && montoEfectivo && Number(montoEfectivo) < subtotal) ||
              (metodoPago === 'MIXTO' && totalMixto > 0 && totalMixto < subtotal)
            }
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Procesando...' : 'Cobrar'}
          </button>
        </div>
      </div>

      {/* Modal éxito */}
      {mensajeExito && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-heading mb-1">Venta registrada</h3>
            <p className="text-muted text-sm mb-2">Total: {formatCOP(mensajeExito.totalCop)}</p>
            {mensajeExito.vueltoCop > 0 && (
              <div className="bg-green-50 dark:bg-green-500/10 rounded-lg px-4 py-2 mb-3">
                <p className="text-green-700 dark:text-green-300 font-bold text-lg">
                  Vuelto: {formatCOP(mensajeExito.vueltoCop)}
                </p>
              </div>
            )}
            {mensajeExito.puntosGanados > 0 && (
              <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-4">
                ⭐ +{mensajeExito.puntosGanados} puntos ganados
              </p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => generarFacturaPDF(mensajeExito)}
                className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 dark:border-slate-600 text-heading hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium"
              >
                <Download size={14} /> Factura PDF
              </button>
              <button
                onClick={() => setMensajeExito(null)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}