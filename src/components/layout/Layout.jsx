import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import Dashboard from '../../pages/dashboard/Dashboard'
import DashboardMecanico from '../../pages/dashboard/DashboardMecanico'
import Clientes from '../../pages/clientes/Clientes'
import Inventario from '../../pages/inventario/Inventario'
import Taller from '../../pages/taller/Taller'
import Pos from '../../pages/pos/Pos'
import Caja from '../../pages/caja/Caja'
import Reportes from '../../pages/reportes/Reportes'
import Usuarios from '../../pages/usuarios/Usuarios'
import useAuthStore from '../../store/authStore'
import Compras from '../../pages/compras/Compras'
import Categorias from '../../pages/inventario/Categorias'
import DashboardCajera from '../../pages/dashboard/DashboardCajera'
import Backup from '../../pages/administracion/Backup'
import Perfil from '../../pages/perfil/Perfil'
import ConfiguracionNegocio from '../../pages/administracion/ConfiguracionNegocio'

export default function Layout() {
  const usuario = useAuthStore((s) => s.usuario)
  const esMecanico = usuario?.rol === 'MECANICO'
  const esCajera = usuario?.rol === 'CAJERA'
  const esDueno = usuario?.rol === 'DUENO'
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      <Sidebar abierto={sidebarAbierto} onCerrar={() => setSidebarAbierto(false)} />

      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header solo visible en móvil/tablet — en lg: desaparece porque el sidebar ya queda fijo */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-20">
          <button
            onClick={() => setSidebarAbierto(true)}
            className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-heading text-sm truncate">Menú</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={esMecanico ? <DashboardMecanico /> : esCajera ? <DashboardCajera /> : <Dashboard />} />
            <Route path="/dashboard" element={esMecanico ? <DashboardMecanico /> : esCajera ? <DashboardCajera /> : <Dashboard />} />
            <Route path="/pos" element={<Pos />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/taller" element={<Taller />} />
            <Route path="/caja" element={<Caja />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/perfil" element={<Perfil />} />
            {esDueno && <Route path="/configuracion-negocio" element={<ConfiguracionNegocio />} />}
          </Routes>
        </main>
      </div>
    </div>
  )
}