import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '../../store/authStore'
import useCajaStore from '../../store/cajaStore'
import { obtenerConfiguracionNegocio } from '../../api/configuracionNegocio'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Wrench,
  DollarSign,
  BarChart3,
  LogOut,
  Truck,
  Building2,
  X,
  Image as ImageIcon,
  Tag,
  DatabaseZap,
  Printer,
} from 'lucide-react'

const NAV_DUENO = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'Punto de Venta' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/taller', icon: Wrench, label: 'Taller' },
  { to: '/caja', icon: DollarSign, label: 'Caja' },
  { to: '/reportes', icon: BarChart3, label: 'Reportes' },
  { to: '/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/compras', icon: Truck, label: 'Compras' },
  { to: '/categorias', icon: Tag, label: 'Categorías' },
  { to: '/backup', icon: DatabaseZap, label: 'Copias de seguridad' },
  { to: '/configuracion-negocio', icon: Building2, label: 'Mi Negocio' },
  { to: '/recursos-graficos', icon: ImageIcon, label: 'Recursos gráficos' },
  { to: '/centro-etiquetas', icon: Printer, label: 'Centro de Etiquetas' },
]
const NAV_CAJERA = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'Punto de Venta' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/caja', icon: DollarSign, label: 'Caja' },
  { to: '/compras', icon: Truck, label: 'Compras' },
  { to: '/categorias', icon: Tag, label: 'Categorías' }
]

const NAV_MECANICO = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/taller', icon: Wrench, label: 'Taller' },
]

const NOMBRE_NEGOCIO_POR_DEFECTO = 'Almacén y Servicios Eléctricos DB'

export default function Sidebar({ abierto = false, onCerrar = () => {} }) {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const cajaAbierta = useCajaStore((state) => state.cajaAbierta)

  const { data: negocio } = useQuery({
    queryKey: ['configuracion-negocio'],
    queryFn: () => obtenerConfiguracionNegocio().then((r) => r.data.datos),
    staleTime: 5 * 60 * 1000, // 5 minutos — no hace falta refrescar en cada navegación
  })

  const nombreNegocio = negocio?.nombreNegocio || NOMBRE_NEGOCIO_POR_DEFECTO
  const [primeraLinea, ...resto] = nombreNegocio.split(' ')
  const segundaLinea = resto.join(' ')

  const esMecanico = usuario?.rol === 'MECANICO'
  const esCajera = usuario?.rol === 'CAJERA'
  const navItems = esMecanico ? NAV_MECANICO : esCajera ? NAV_CAJERA : NAV_DUENO

  const handleLogout = async () => {
    if (cajaAbierta) {
      const confirmar = window.confirm(
        '⚠️ La caja está abierta.\n\n¿Deseas cerrar sesión y dejar la caja abierta?\n\nPresiona "Cancelar" para ir a cerrar la caja primero.'
      )
      if (!confirmar) {
        navigate('/caja')
        return
      }
    }
    logout()
    navigate('/login')
  }

  const iniciales = (usuario?.nombreCompleto || 'U')
    .split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')

  return (
    <>
      {/* Overlay — solo en móvil, cuando el sidebar está abierto */}
      {abierto && (
        <div
          onClick={onCerrar}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${abierto ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-auto lg:z-auto`}
      >
        <div className="p-6 border-b border-gray-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={negocio?.logoUrl || '/logo-db.png'}
              alt="Logo"
              className="w-10 h-10 rounded object-contain flex-shrink-0 bg-white/5"
            />
            <div className="min-w-0">
              <h1 className="font-bold text-sm leading-tight truncate">{primeraLinea}</h1>
              {segundaLinea && <h1 className="font-bold text-sm leading-tight truncate">{segundaLinea}</h1>}
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors lg:hidden flex-shrink-0"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCerrar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <NavLink
            to="/perfil"
            onClick={onCerrar}
            className={({ isActive }) =>
              `flex items-center gap-3 mb-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-gray-800' : 'hover:bg-gray-800'
              }`
            }
          >
            {usuario?.fotoUrl ? (
              <img
                src={usuario.fotoUrl}
                alt="Foto de perfil"
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {iniciales}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {usuario?.nombreCompleto || 'Usuario'}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {usuario?.rol === 'DUENO' ? 'Dueño' :
                 usuario?.rol === 'CAJERA' ? 'Cajera' :
                 usuario?.rol === 'MECANICO' ? 'Mecánico' : ''}
              </p>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}