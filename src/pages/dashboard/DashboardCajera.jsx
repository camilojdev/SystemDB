import { useQuery } from '@tanstack/react-query'
import { getCajaActual } from '../../api/caja'
import { getVentasHoy } from '../../api/pos'
import { formatCOP } from '../../utils/formato'
import { ShoppingCart, DollarSign, Users, TrendingUp } from 'lucide-react'
import useCajaStore from '../../store/cajaStore'

export default function DashboardCajera() {
  const cajaAbierta = useCajaStore((s) => s.cajaAbierta)

  const { data: cajaData } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => getCajaActual().then((r) => r.data.datos),
    retry: false,
    enabled: cajaAbierta,
  })

  const { data: ventasData } = useQuery({
    queryKey: ['ventas-hoy'],
    queryFn: () => getVentasHoy().then((r) => r.data.datos),
    retry: false,
  })

  const ventas = ventasData?.content || []
  const totalVentas = ventas.reduce((s, v) => s + (v.totalCop || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-heading">Dashboard</h1>
        <p className="text-muted text-base mt-1">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card !p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-base text-muted">Ventas hoy</p>
            <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg">
              <ShoppingCart size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-heading">{ventas.length}</p>
          <p className="text-sm text-muted mt-1">transacciones</p>
        </div>

        <div className="card !p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-base text-muted">Ingresos hoy</p>
            <div className="bg-green-100 dark:bg-green-500/20 p-2 rounded-lg">
              <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCOP(totalVentas)}</p>
          <p className="text-sm text-muted mt-1">ventas completadas</p>
        </div>

        {cajaAbierta && cajaData && (
          <>
            <div className="card !p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base text-muted">Efectivo en caja</p>
                <div className="bg-yellow-100 dark:bg-yellow-500/20 p-2 rounded-lg">
                  <DollarSign size={16} className="text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-heading">{formatCOP(cajaData.totalEfectivoCop)}</p>
              <p className="text-sm text-muted mt-1">del turno actual</p>
            </div>

            <div className="card !p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base text-muted">Saldo esperado</p>
                <div className="bg-purple-100 dark:bg-purple-500/20 p-2 rounded-lg">
                  <DollarSign size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCOP(cajaData.saldoEsperadoCop)}</p>
              <p className="text-sm text-muted mt-1">en caja</p>
            </div>
          </>
        )}
      </div>

      {!cajaAbierta && (
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4 text-base text-yellow-700 dark:text-yellow-300">
          ⚠️ No hay caja abierta. Ve a <strong>Caja</strong> para iniciar el turno.
        </div>
      )}

      {cajaAbierta && cajaData && (
        <div className="card">
          <h2 className="text-lg font-semibold text-heading mb-3">Resumen del turno</h2>
          <div className="grid grid-cols-3 gap-4 text-base">
            <div>
              <p className="text-muted mb-1">Gastos</p>
              <p className="font-semibold text-red-600 dark:text-red-400">{formatCOP(cajaData.totalGastosCop)}</p>
            </div>
            <div>
              <p className="text-muted mb-1">Transferencias</p>
              <p className="font-semibold text-heading">{formatCOP(cajaData.totalTransferenciaCop)}</p>
            </div>
            <div>
              <p className="text-muted mb-1">Crédito</p>
              <p className="font-semibold text-heading">{formatCOP(cajaData.totalCreditoCop)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}