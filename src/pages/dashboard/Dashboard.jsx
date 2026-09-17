import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../../api/dashboard'
import { formatCOP } from '../../utils/formato'
import {
  ShoppingCart,
  Package,
  Wrench,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  CreditCard,
} from 'lucide-react'

function TarjetaMetrica({ titulo, valor, subtitulo, icono: Icon, color }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-medium text-muted">{titulo}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-heading">{valor}</p>
      {subtitulo && (
        <p className="text-sm text-muted mt-1">{subtitulo}</p>
      )}
    </div>
  )
}

function EstadoOT({ label, cantidad, color }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-base text-muted">{label}</span>
      </div>
      <span className="text-lg font-semibold text-heading">{cantidad}</span>
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard().then((r) => r.data.datos),
    refetchInterval: 30000, // refrescar cada 30s
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-3" />
          <p className="text-heading">Error al cargar el dashboard</p>
        </div>
      </div>
    )
  }

  const { resumenDia, inventario, taller, cartera, caja } = data

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-heading">Dashboard</h1>
        <p className="text-muted text-base mt-1">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Resumen del día */}
      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
          Resumen del día
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TarjetaMetrica
            titulo="Ventas hoy"
            valor={resumenDia.totalVentas}
            subtitulo="transacciones completadas"
            icono={ShoppingCart}
            color="bg-blue-500"
          />
          <TarjetaMetrica
            titulo="Ingresos hoy"
            valor={formatCOP(resumenDia.ingresosCop)}
            subtitulo="ventas completadas"
            icono={TrendingUp}
            color="bg-green-500"
          />
          <TarjetaMetrica
            titulo="Clientes atendidos"
            valor={resumenDia.clientesAtendidos}
            subtitulo="clientes registrados"
            icono={Users}
            color="bg-purple-500"
          />
          <TarjetaMetrica
            titulo="Puntos otorgados"
            valor={resumenDia.puntosOtorgados}
            subtitulo="puntos de fidelización"
            icono={TrendingUp}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Estado del taller */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Wrench size={18} className="text-muted" />
            <h3 className="text-lg font-semibold text-heading">Taller</h3>
            <span className="ml-auto bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {taller.otsTotalesActivas} activas
            </span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            <EstadoOT label="Recibido" cantidad={taller.otsRecibidas} color="bg-gray-400" />
            <EstadoOT label="En diagnóstico" cantidad={taller.otsEnDiagnostico} color="bg-blue-400" />
            <EstadoOT label="En reparación" cantidad={taller.otsEnReparacion} color="bg-yellow-400" />
            <EstadoOT label="Esperando repuesto" cantidad={taller.otsEsperandoRepuesto} color="bg-orange-400" />
            <EstadoOT label="Listo para entrega" cantidad={taller.otsListas} color="bg-green-400" />
          </div>
        </div>

        {/* Inventario */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-muted" />
            <h3 className="text-lg font-semibold text-heading">Inventario</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base text-muted">Total productos</span>
              <span className="text-lg font-semibold text-heading">{inventario.totalProductos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base text-muted">Valor total</span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCOP(inventario.valorTotalInventarioCop)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-yellow-500" />
                <span className="text-base text-muted">Stock bajo</span>
              </div>
              <span className={`text-lg font-semibold ${inventario.productosStockBajo > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted'}`}>
                {inventario.productosStockBajo}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-base text-muted">Agotados</span>
              </div>
              <span className={`text-lg font-semibold ${inventario.productosAgotados > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted'}`}>
                {inventario.productosAgotados}
              </span>
            </div>
          </div>
        </div>

        {/* Cartera y Caja */}
        <div className="space-y-4">
          {/* Cartera */}
          <div className="card !p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={18} className="text-muted" />
              <h3 className="text-lg font-semibold text-heading">Cartera</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-muted">Créditos activos</span>
                <span className="font-medium text-heading">{cartera.totalCreditosActivos}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-muted">Por cobrar</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {formatCOP(cartera.totalRestanteCop)}
                </span>
              </div>
            </div>
          </div>

          {/* Caja */}
          <div className={`rounded-xl p-5 shadow-sm border transition-colors ${
            caja.cajaAbierta
              ? 'bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30'
              : 'bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-slate-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={18} className={caja.cajaAbierta ? 'text-green-600 dark:text-green-400' : 'text-muted'} />
              <h3 className="text-lg font-semibold text-heading">Caja</h3>
              <span className={`ml-auto text-sm font-medium px-2.5 py-0.5 rounded-full ${
                caja.cajaAbierta
                  ? 'bg-green-200 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                  : 'bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {caja.cajaAbierta ? 'Abierta' : 'Cerrada'}
              </span>
            </div>
            {caja.cajaAbierta && (
              <div className="space-y-2">
                <div className="flex justify-between text-base">
                  <span className="text-muted">Ventas</span>
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {formatCOP(caja.totalVentasCop)}
                  </span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-muted">Saldo esperado</span>
                  <span className="font-medium text-heading">
                    {formatCOP(caja.saldoEsperadoCop)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}