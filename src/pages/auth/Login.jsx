import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { login } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { NOMBRE_NEGOCIO } from '../../utils/marca'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const token = useAuthStore((s) => s.token)

  const [form, setForm] = useState({ nombreUsuario: '', contrasena: '' })
  const [error, setError] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)

  // Si ya está autenticado redirigir
  if (token) {
    navigate('/dashboard')
    return null
  }

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      const { token, nombreCompleto, rol, nombreUsuario } = res.data.datos
      setAuth(token, { nombreCompleto, rol, nombreUsuario })
      navigate('/dashboard')
    },
    onError: () => {
      setError('Usuario o contraseña incorrectos')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.nombreUsuario || !form.contrasena) {
      setError('Todos los campos son obligatorios')
      return
    }
    mutate(form)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo-db.png" alt={NOMBRE_NEGOCIO} className="w-24 h-24 object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">{NOMBRE_NEGOCIO}</h1>
          <p className="text-gray-400 mt-1">Sistema de Gestión Integral</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Usuario o correo
              </label>
              <input
                type="text"
                value={form.nombreUsuario}
                onChange={(e) =>
                  setForm({ ...form, nombreUsuario: e.target.value })
                }
                placeholder="Ingresa tu usuario o correo"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarContrasena ? 'text' : 'password'}
                  value={form.contrasena}
                  onChange={(e) =>
                    setForm({ ...form, contrasena: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena((v) => !v)}
                  tabIndex={-1}
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {mostrarContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/recuperar-contrasena')}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div> 

            {error && (
              <div className="bg-red-900/40 border border-red-500/50 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors mt-2"
            >
              {isPending ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          {NOMBRE_NEGOCIO} © 2026
        </p>
      </div>
    </div>
  )
}