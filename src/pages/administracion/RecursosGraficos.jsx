import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  obtenerConfiguracionNegocio,
  subirLogoNegocio,
  subirLogoEtiquetas,
} from '../../api/configuracionNegocio'
import { Image as ImageIcon, Upload, Info } from 'lucide-react'

export default function RecursosGraficos() {
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracion-negocio'],
    queryFn: () => obtenerConfiguracionNegocio().then((r) => r.data.datos),
  })

  const invalidar = (res) => {
    queryClient.setQueryData(['configuracion-negocio'], res.data.datos)
    queryClient.invalidateQueries({ queryKey: ['configuracion-negocio'] })
  }

  if (isLoading || !config) {
    return <p className="p-6 text-muted">Cargando...</p>
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <ImageIcon size={22} className="text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-heading">Recursos Gráficos</h1>
      </div>
      <p className="text-sm text-muted -mt-4">
        Administra los logos que usa el sistema. Cada uno se usa en un lugar distinto y son independientes entre sí.
      </p>

      <RecursoLogo
        titulo="Logo del sistema"
        descripcion="Aparece en la barra lateral, en la factura de venta y en la planilla de OT."
        logoUrl={config.logoUrl}
        subirFn={subirLogoNegocio}
        onExito={invalidar}
        exigirTransparencia={false}
      />

      <RecursoLogo
        titulo="Logo de etiquetas"
        descripcion="Se usa exclusivamente en las etiquetas de producto. Debe ser PNG con fondo transparente."
        logoUrl={config.logoEtiquetasUrl}
        subirFn={subirLogoEtiquetas}
        onExito={invalidar}
        exigirTransparencia={true}
      />
    </div>
  )
}

function RecursoLogo({ titulo, descripcion, logoUrl, subirFn, onExito, exigirTransparencia }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')

  const { mutate: subir, isPending } = useMutation({
    mutationFn: subirFn,
    onSuccess: (res) => { setError(''); onExito(res) },
    onError: (err) => setError(err.response?.data?.mensaje || 'No se pudo subir la imagen'),
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

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-heading">{titulo}</h2>
      </div>
      <p className="text-sm text-muted mb-4">{descripcion}</p>

      <div className="flex items-center gap-5">
        <div className="w-24 h-24 rounded-lg bg-[repeating-conic-gradient(#e5e7eb_0_25%,#ffffff_0_50%)] dark:bg-[repeating-conic-gradient(#334155_0_25%,#1e293b_0_50%)] bg-[length:16px_16px] border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={titulo} className="max-w-full max-h-full object-contain" />
          ) : (
            <ImageIcon size={28} className="text-gray-300 dark:text-slate-600" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center gap-1.5 w-fit"
          >
            <Upload size={14} /> {isPending ? 'Subiendo...' : logoUrl ? 'Reemplazar' : 'Subir logo'}
          </button>
          {exigirTransparencia && (
            <p className="text-xs text-muted flex items-center gap-1">
              <Info size={12} /> Solo PNG con transparencia. Máximo 5 MB.
            </p>
          )}
          {!exigirTransparencia && (
            <p className="text-xs text-muted">JPG, PNG o WEBP. Máximo 5 MB.</p>
          )}
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={exigirTransparencia ? 'image/png' : 'image/jpeg,image/png,image/webp'}
          className="hidden"
          onChange={handleSeleccion}
        />
      </div>
    </div>
  )
}