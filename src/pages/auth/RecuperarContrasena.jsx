import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { olvidoContrasena, restablecerContrasena } from '../../api/auth'
import { NOMBRE_NEGOCIO } from '../../utils/marca'

export default function RecuperarContrasena() {
  const navigate = useNavigate()

  const [paso, setPaso] = useState(1) // 1 = pedir código, 2 = ingresar código + nueva contraseña
  const [identificador, setIdentificador] = useState('')
  const [codigo, setCodigo] = useState('')
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmarContrasena, setConfirmarContrasena] = useState('')
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  const { mutate: pedirCodigo, isPending: enviandoCodigo } = useMutation({
    mutationFn: () => olvidoContrasena(identificador),
    onSuccess: (res) => {
      setError('')
      setMensajeExito(res.data.mensaje)
      setPaso(2)
    },
    onError: (err) => {
      setError(err.response?.data?.mensaje || 'No se pudo procesar la solicitud')
    },
  })

  const { mutate: confirmarRestablecimiento, isPending: restableciendo } = useMutation({
    mutationFn: () =>
      restablecerContrasena({ identificador, codigo, nuevaContrasena }),
    onSuccess: () => {
      setError('')
      setMensajeExito('Contraseña restablecida correctamente. Ya puedes iniciar sesión.')
      setTimeout(() => navigate('/login'), 2500)
    },
    onError: (err) => {
      setError(err.response?.data?.mensaje || 'No se pudo restablecer la contraseña')
    },
  })

  const handlePaso1 = (e) => {
    e.preventDefault()
    setError('')
    if (!identificador.trim()) {
      setError('Ingresa tu usuario o correo')
      return
    }
    pedirCodigo()
  }

  const handlePaso2 = (e) => {
    e.preventDefault()
    setError('')
    if (!codigo || !nuevaContrasena || !confirmarContrasena) {
      setError('Todos los campos son obligatorios')
      return
    }
    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden')
      return
    }
    confirmarRestablecimiento()
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-db.png" alt={NOMBRE_NEGOCIO} className="w-24 h-24 object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">{NOMBRE_NEGOCIO}</h1>
          <p className="text-gray-400 mt-1">Recuperar contraseña</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          {paso === 1 ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Ingresa tu usuario o correo y te enviaremos un código para restablecerla.
              </p>

              <form onSubmit={handlePaso1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Usuario o correo
                  </label>
                  <input
                    type="text"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="Tu usuario o correo"
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/40 border border-red-500/50 rounded-lg px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={enviandoCodigo}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors mt-2"
                >
                  {enviandoCodigo ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">
                Ingresa el código
              </h2>
              {mensajeExito && (
                <div className="bg-blue-900/40 border border-blue-500/50 rounded-lg px-4 py-3 mb-4">
                  <p className="text-blue-300 text-sm">{mensajeExito}</p>
                </div>
              )}

              <form onSubmit={handlePaso2} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Código de 6 dígitos
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={nuevaContrasena}
                    onChange={(e) => setNuevaContrasena(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 8 caracteres, con una mayúscula y un número
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmarContrasena}
                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/40 border border-red-500/50 rounded-lg px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={restableciendo}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors mt-2"
                >
                  {restableciendo ? 'Restableciendo...' : 'Restablecer contraseña'}
                </button>

                <button
                  type="button"
                  onClick={() => pedirCodigo()}
                  disabled={enviandoCodigo}
                  className="w-full text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  ¿No te llegó? Reenviar código
                </button>
              </form>
            </>
          )}

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-400 mt-6 transition-colors"
          >
            ← Volver a iniciar sesión
          </button>
        </div>
      </div>
    </div>
  )
}