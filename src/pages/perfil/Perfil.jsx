import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  obtenerPerfil,
  actualizarNombre,
  subirFotoPerfil,
  eliminarFotoPerfil,
  cambiarContrasenaConActual,
  solicitarCodigoCambioContrasena,
  confirmarCambioContrasenaConCodigo,
  solicitarCambioCorreo,
  confirmarCambioCorreo,
} from '../../api/perfil'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import { Camera, Trash2, Sun, Moon, Mail, Lock, User as UserIcon } from 'lucide-react'

export default function Perfil() {
  const queryClient = useQueryClient()
  const actualizarUsuarioStore = useAuthStore((s) => s.actualizarUsuario)
  const { tema, alternarTema } = useThemeStore()
  const inputFotoRef = useRef(null)

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['perfil'],
    queryFn: () => obtenerPerfil().then((r) => r.data.datos),
  })

  const sincronizarStore = (datosPerfil) => {
    actualizarUsuarioStore({
      nombreCompleto: datosPerfil.nombreCompleto,
      fotoUrl: datosPerfil.fotoUrl,
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi perfil</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Administra tu información personal, tu contraseña y la apariencia del sistema.
        </p>
      </div>

      {isLoading ? (
        <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
      ) : (
        <>
          <SeccionFoto
            perfil={perfil}
            inputFotoRef={inputFotoRef}
            onExito={(datos) => {
              queryClient.setQueryData(['perfil'], datos)
              sincronizarStore(datos)
            }}
          />
          <SeccionNombre
            perfil={perfil}
            onExito={(datos) => {
              queryClient.setQueryData(['perfil'], datos)
              sincronizarStore(datos)
            }}
          />
          <SeccionCorreo
            perfil={perfil}
            onExito={(datos) => queryClient.setQueryData(['perfil'], datos)}
          />
          <SeccionContrasena />
          <SeccionApariencia tema={tema} alternarTema={alternarTema} />
        </>
      )}
    </div>
  )
}

function Tarjeta({ titulo, icono: Icono, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        {Icono && <Icono size={18} className="text-blue-600 dark:text-blue-400" />}
        <h2 className="font-semibold text-gray-900 dark:text-white">{titulo}</h2>
      </div>
      {children}
    </div>
  )
}

function SeccionFoto({ perfil, inputFotoRef, onExito }) {
  const [error, setError] = useState('')

  const { mutate: subir, isPending: subiendo } = useMutation({
    mutationFn: subirFotoPerfil,
    onSuccess: (res) => { setError(''); onExito(res.data.datos) },
    onError: (err) => setError(err.response?.data?.mensaje || 'No se pudo subir la foto'),
  })

  const { mutate: eliminar, isPending: eliminando } = useMutation({
    mutationFn: eliminarFotoPerfil,
    onSuccess: (res) => { setError(''); onExito(res.data.datos) },
    onError: (err) => setError(err.response?.data?.mensaje || 'No se pudo eliminar la foto'),
  })

  const handleSeleccion = (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (archivo.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5 MB')
      return
    }
    subir(archivo)
    e.target.value = ''
  }

  const iniciales = (perfil?.nombreCompleto || 'U')
    .split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')

  return (
    <Tarjeta titulo="Foto de perfil" icono={Camera}>
      <div className="flex items-center gap-5">
        {perfil?.fotoUrl ? (
          <img src={perfil.fotoUrl} alt="Foto de perfil" className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-semibold text-white">
            {iniciales}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={subiendo || eliminando}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              {subiendo ? 'Subiendo...' : perfil?.fotoUrl ? 'Cambiar foto' : 'Subir foto'}
            </button>
            {perfil?.fotoUrl && (
              <button
                type="button"
                onClick={() => eliminar()}
                disabled={subiendo || eliminando}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-60 text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} /> Quitar
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG o WEBP. Máximo 5 MB.</p>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleSeleccion}
        />
      </div>
    </Tarjeta>
  )
}

function SeccionNombre({ perfil, onExito }) {
  const [nombre, setNombre] = useState(perfil?.nombreCompleto || '')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => actualizarNombre(nombre),
    onSuccess: (res) => {
      setError('')
      setMensaje('Nombre actualizado')
      onExito(res.data.datos)
      setTimeout(() => setMensaje(''), 2500)
    },
    onError: (err) => setError(err.response?.data?.mensaje || 'No se pudo actualizar el nombre'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    mutate()
  }

  return (
    <Tarjeta titulo="Nombre completo" icono={UserIcon}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
      {mensaje && <p className="text-xs text-green-600 dark:text-green-400 mt-2">{mensaje}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </Tarjeta>
  )
}

function SeccionCorreo({ perfil, onExito }) {
  const [paso, setPaso] = useState('inicial')
  const [correoNuevo, setCorreoNuevo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const { mutate: solicitar, isPending: solicitando } = useMutation({
    mutationFn: () => solicitarCambioCorreo(correoNuevo),
    onSuccess: (res) => { setError(''); setMensaje(res.data.mensaje); setPaso('codigo') },
    onError: (err) => setError(err.response?.data?.mensaje || 'No se pudo procesar la solicitud'),
  })

  const { mutate: confirmar, isPending: confirmando } = useMutation({
    mutationFn: () => confirmarCambioCorreo(codigo),
    onSuccess: (res) => {
      setError('')
      setMensaje('Correo actualizado correctamente')
      onExito(res.data.datos)
      setPaso('inicial')
      setCorreoNuevo('')
      setCodigo('')
    },
    onError: (err) => setError(err.response?.data?.mensaje || 'Código inválido o expirado'),
  })

  return (
    <Tarjeta titulo="Correo electrónico" icono={Mail}>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        Correo actual: <span className="font-medium">{perfil?.correo}</span>
      </p>

      {paso === 'inicial' ? (
        <form onSubmit={(e) => { e.preventDefault(); setError(''); solicitar() }} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Nuevo correo"
            value={correoNuevo}
            onChange={(e) => setCorreoNuevo(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={solicitando || !correoNuevo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {solicitando ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setError(''); confirmar() }} className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enviamos un código a <span className="font-medium">{correoNuevo}</span>. Ingrésalo para confirmar el cambio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              className="w-full sm:w-40 px-3 py-2 text-center tracking-[0.4em] font-mono border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={confirmando || codigo.length !== 6}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {confirmando ? 'Confirmando...' : 'Confirmar cambio'}
            </button>
            <button
              type="button"
              onClick={() => { setPaso('inicial'); setCodigo(''); setError('') }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {mensaje && <p className="text-xs text-green-600 dark:text-green-400 mt-2">{mensaje}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </Tarjeta>
  )
}

function SeccionContrasena() {
  const [modo, setModo] = useState('actual')
  const [pasoCodigo, setPasoCodigo] = useState('inicial')

  const [contrasenaActual, setContrasenaActual] = useState('')
  const [contrasenaNueva, setContrasenaNueva] = useState('')
  const [confirmarNueva, setConfirmarNueva] = useState('')
  const [codigo, setCodigo] = useState('')

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const limpiarCampos = () => {
    setContrasenaActual(''); setContrasenaNueva(''); setConfirmarNueva(''); setCodigo('')
  }

  const { mutate: guardarConActual, isPending: guardandoConActual } = useMutation({
    mutationFn: () => cambiarContrasenaConActual({ contrasenaActual, contrasenaNueva }),
    onSuccess: () => { setError(''); setMensaje('Contraseña actualizada correctamente'); limpiarCampos() },
    onError: (err) => setError(err.response?.data?.mensaje || 'No se pudo cambiar la contraseña'),
  })

  const { mutate: pedirCodigo, isPending: pidiendoCodigo } = useMutation({
    mutationFn: solicitarCodigoCambioContrasena,
    onSuccess: (res) => { setError(''); setMensaje(res.data.mensaje); setPasoCodigo('ingresar') },
    onError: (err) => setError(err.response?.data?.mensaje || 'No se pudo enviar el código'),
  })

  const { mutate: confirmarConCodigo, isPending: confirmandoCodigo } = useMutation({
    mutationFn: () => confirmarCambioContrasenaConCodigo({ codigo, contrasenaNueva }),
    onSuccess: () => {
      setError(''); setMensaje('Contraseña actualizada correctamente'); limpiarCampos(); setPasoCodigo('inicial')
    },
    onError: (err) => setError(err.response?.data?.mensaje || 'Código inválido o expirado'),
  })

  const validarNueva = () => {
    if (contrasenaNueva.length < 8 || !/[A-Z]/.test(contrasenaNueva) || !/[0-9]/.test(contrasenaNueva)) {
      setError('La nueva contraseña debe tener mínimo 8 caracteres, una mayúscula y un número')
      return false
    }
    return true
  }

  const handleSubmitConActual = (e) => {
    e.preventDefault(); setError('')
    if (!contrasenaActual || !contrasenaNueva || !confirmarNueva) { setError('Todos los campos son obligatorios'); return }
    if (contrasenaNueva !== confirmarNueva) { setError('Las contraseñas no coinciden'); return }
    if (!validarNueva()) return
    guardarConActual()
  }

  const handleSubmitConCodigo = (e) => {
    e.preventDefault(); setError('')
    if (!codigo || !contrasenaNueva || !confirmarNueva) { setError('Todos los campos son obligatorios'); return }
    if (contrasenaNueva !== confirmarNueva) { setError('Las contraseñas no coinciden'); return }
    if (!validarNueva()) return
    confirmarConCodigo()
  }

  return (
    <Tarjeta titulo="Contraseña" icono={Lock}>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setModo('actual'); setError(''); setMensaje(''); limpiarCampos(); setPasoCodigo('inicial') }}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${modo === 'actual' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
        >
          Con mi contraseña actual
        </button>
        <button
          type="button"
          onClick={() => { setModo('codigo'); setError(''); setMensaje(''); limpiarCampos(); setPasoCodigo('inicial') }}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${modo === 'codigo' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
        >
          Con código al correo
        </button>
      </div>

      {modo === 'actual' ? (
        <form onSubmit={handleSubmitConActual} className="space-y-3">
          <Campo label="Contraseña actual" tipo="password" valor={contrasenaActual} onChange={setContrasenaActual} />
          <Campo label="Contraseña nueva" tipo="password" valor={contrasenaNueva} onChange={setContrasenaNueva} ayuda="Mínimo 8 caracteres, una mayúscula y un número" />
          <Campo label="Confirmar contraseña nueva" tipo="password" valor={confirmarNueva} onChange={setConfirmarNueva} />
          <button type="submit" disabled={guardandoConActual} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
            {guardandoConActual ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      ) : pasoCodigo === 'inicial' ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Paso 1 de 2: te enviaremos un código de verificación a tu correo registrado. Después de recibirlo, podrás escribir tu nueva contraseña.
          </p>
          <button type="button" onClick={() => { setError(''); pedirCodigo() }} disabled={pidiendoCodigo} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
            {pidiendoCodigo ? 'Enviando...' : 'Enviar código'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitConCodigo} className="space-y-3">
          <Campo label="Código de 6 dígitos" tipo="text" valor={codigo} onChange={(v) => setCodigo(v.replace(/\D/g, ''))} maxLength={6} />
          <Campo label="Contraseña nueva" tipo="password" valor={contrasenaNueva} onChange={setContrasenaNueva} ayuda="Mínimo 8 caracteres, una mayúscula y un número" />
          <Campo label="Confirmar contraseña nueva" tipo="password" valor={confirmarNueva} onChange={setConfirmarNueva} />
          <div className="flex gap-3">
            <button type="submit" disabled={confirmandoCodigo} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {confirmandoCodigo ? 'Guardando...' : 'Confirmar y cambiar'}
            </button>
            <button type="button" onClick={() => pedirCodigo()} disabled={pidiendoCodigo} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">
              Reenviar código
            </button>
          </div>
        </form>
      )}

      {mensaje && <p className="text-xs text-green-600 dark:text-green-400 mt-3">{mensaje}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-3">{error}</p>}
    </Tarjeta>
  )
}

function Campo({ label, tipo, valor, onChange, ayuda, maxLength }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type={tipo}
        value={valor}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {ayuda && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ayuda}</p>}
    </div>
  )
}

function SeccionApariencia({ tema, alternarTema }) {
  return (
    <Tarjeta titulo="Apariencia" icono={tema === 'oscuro' ? Moon : Sun}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">Modo {tema === 'oscuro' ? 'oscuro' : 'claro'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Se mantiene en este dispositivo aunque cierres sesión.</p>
        </div>
        <button
          type="button"
          onClick={alternarTema}
          className={`relative w-14 h-8 rounded-full transition-colors ${tema === 'oscuro' ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform flex items-center justify-center ${tema === 'oscuro' ? 'translate-x-6' : 'translate-x-0'}`}>
            {tema === 'oscuro' ? <Moon size={14} className="text-blue-600" /> : <Sun size={14} className="text-yellow-500" />}
          </span>
        </button>
      </div>
    </Tarjeta>
  )
}