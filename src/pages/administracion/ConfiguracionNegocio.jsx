import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  obtenerConfiguracionNegocio,
  actualizarConfiguracionNegocio,
  subirLogoNegocio,
} from '../../api/configuracionNegocio'
import { Building2, Camera } from 'lucide-react'

export default function ConfiguracionNegocio() {
  const queryClient = useQueryClient()
  const inputLogoRef = useRef(null)

  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracion-negocio'],
    queryFn: () => obtenerConfiguracionNegocio().then((r) => r.data.datos),
  })

  const [form, setForm] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (config) setForm(config)
  }, [config])

  const { mutate: guardar, isPending: guardando } = useMutation({
    mutationFn: () => actualizarConfiguracionNegocio(form),
    onSuccess: (res) => {
      setError('')
      setMensaje('Información del negocio actualizada')
      queryClient.setQueryData(['configuracion-negocio'], res.data.datos)
      queryClient.invalidateQueries({ queryKey: ['configuracion-negocio'] })
      setForm(res.data.datos)
      setTimeout(() => setMensaje(''), 2500)
    },
    onError: (err) => setError(err.response?.data?.mensaje || 'No se pudo guardar'),
  })

  const { mutate: subirLogo, isPending: subiendoLogo } = useMutation({
    mutationFn: subirLogoNegocio,
    onSuccess: (res) => {
      setError('')
      queryClient.setQueryData(['configuracion-negocio'], res.data.datos)
      queryClient.invalidateQueries({ queryKey: ['configuracion-negocio'] })
      setForm(res.data.datos)
    },
    onError: (err) => setError(err.response?.data?.mensaje || 'No se pudo subir el logo'),
  })

  const handleLogo = (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (archivo.size > 5 * 1024 * 1024) { setError('El logo no puede superar los 5 MB'); return }
    subirLogo(archivo)
    e.target.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form?.nombreNegocio?.trim()) { setError('El nombre del negocio es obligatorio'); return }
    guardar()
  }

  if (isLoading || !form) {
    return <p className="p-6 text-gray-500 dark:text-gray-400">Cargando...</p>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Building2 size={22} className="text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi negocio</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 -mt-4">
        Esta información aparecerá próximamente en las facturas y planillas de OT.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-5 mb-6">
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="Logo del negocio" className="w-20 h-20 rounded-lg object-contain bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Building2 size={28} className="text-gray-400" />
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => inputLogoRef.current?.click()}
              disabled={subiendoLogo}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Camera size={14} /> {subiendoLogo ? 'Subiendo...' : 'Cambiar logo'}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG o WEBP. Máximo 5 MB.</p>
          </div>
          <input ref={inputLogoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogo} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Campo label="Nombre del negocio" valor={form.nombreNegocio} onChange={(v) => setForm({ ...form, nombreNegocio: v })} />
          <Campo label="Eslogan" valor={form.eslogan} onChange={(v) => setForm({ ...form, eslogan: v })} />
          <Campo label="Dirección" valor={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Teléfono" valor={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
            <Campo label="NIT" valor={form.nit} onChange={(v) => setForm({ ...form, nit: v })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pie de página para facturas</label>
            <textarea
              rows={2}
              value={form.piePaginaFactura || ''}
              onChange={(e) => setForm({ ...form, piePaginaFactura: e.target.value })}
              placeholder='Ej. "Garantía de 30 días sobre repuestos"'
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {mensaje && <p className="text-sm text-green-600 dark:text-green-400">{mensaje}</p>}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button type="submit" disabled={guardando} className="px-5 py-2.5 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors">
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Campo({ label, valor, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type="text"
        value={valor || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}