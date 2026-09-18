import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ejecutarBackup, getHistorialBackups, getUrlDescargaBackup } from '../../api/backup'
import { formatFecha } from '../../utils/formato'
import { DatabaseZap, Download, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'

const formatTamano = (bytes) => {
  if (!bytes) return '—'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

export default function Backup() {
  const queryClient = useQueryClient()
  const [descargandoId, setDescargandoId] = useState(null)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['backups-historial'],
    queryFn: () => getHistorialBackups(0, 20).then((r) => r.data.datos),
    refetchInterval: 15000, // por si el backup se está generando en este momento
  })

  const { mutate: generar, isPending: generando } = useMutation({
    mutationFn: ejecutarBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups-historial'] })
    },
    onError: (err) => {
      setError(err.response?.data?.mensaje || 'No se pudo generar el backup')
    },
  })

  const descargar = async (id) => {
    setError('')
    setDescargandoId(id)
    try {
      const res = await getUrlDescargaBackup(id)
      const url = res.data.datos
      window.open(url, '_blank')
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo generar el enlace de descarga')
    } finally {
      setDescargandoId(null)
    }
  }

  const backups = data?.content || []

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-heading">Copias de seguridad</h1>
        <p className="text-muted text-base mt-1">
          Respaldo completo de la base de datos, almacenado fuera del servidor
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/30 rounded-xl p-4 flex gap-3">
        <ShieldCheck className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium">El sistema ya te protege automáticamente</p>
          <p className="mt-1 text-blue-700 dark:text-blue-400">
            Se genera un backup solo cada día a las 2:00 a.m. y también cada vez que se
            cierra una sesión de caja. El botón de abajo es para cuando quieras generar
            uno extra en el momento, por ejemplo antes de un cambio importante.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-heading">Generar backup ahora</h2>
          <button
            onClick={() => generar()}
            disabled={generando}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <DatabaseZap size={16} />
            {generando ? 'Generando...' : 'Generar backup'}
          </button>
        </div>
        {error && <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>}
        {generando && (
          <p className="text-sm text-muted">
            Esto puede tardar unos segundos dependiendo del tamaño de la base de datos...
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-heading mb-4">Historial de backups</h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : backups.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">Aún no se ha generado ningún backup</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Archivo</th>
                <th className="text-center text-xs font-semibold text-muted uppercase px-4 py-2">Estado</th>
                <th className="text-right text-xs font-semibold text-muted uppercase px-4 py-2">Tamaño</th>
                <th className="text-left text-xs font-semibold text-muted uppercase px-4 py-2">Fecha</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 text-sm font-mono text-heading">{b.nombreArchivo}</td>
                  <td className="px-4 py-3 text-center">
                    {b.exitoso ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                        <CheckCircle2 size={14} /> Exitoso
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
                        title={b.mensajeError || ''}
                      >
                        <XCircle size={14} /> Falló
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted">{formatTamano(b.tamanoBytes)}</td>
                  <td className="px-4 py-3 text-sm text-muted">{formatFecha(b.creadoEn)}</td>
                  <td className="px-4 py-3 text-right">
                    {b.exitoso && (
                      <button
                        onClick={() => descargar(b.id)}
                        disabled={descargandoId === b.id}
                        className="flex items-center gap-1 ml-auto px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50"
                      >
                        <Download size={13} />
                        {descargandoId === b.id ? '...' : 'Descargar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}