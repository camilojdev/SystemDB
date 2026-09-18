import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { crearCliente, actualizarCliente } from '../../api/clientes'
import { X } from 'lucide-react'

const TIPOS_ID = ['CC', 'NIT', 'CE', 'PASAPORTE']

export default function ModalCrearCliente({ cliente, onClose, onSuccess }) {
  const esEdicion = !!cliente

  const [form, setForm] = useState({
    nombreCompleto: cliente?.nombreCompleto || '',
    tipoIdentificacion: cliente?.tipoIdentificacion || 'CC',
    numeroIdentificacion: cliente?.numeroIdentificacion || '',
    celular: cliente?.celular || '',
    correo: cliente?.correo || '',
    direccion: cliente?.direccion || '',
  })

  const [error, setError] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (datos) =>
      esEdicion ? actualizarCliente(cliente.id, datos) : crearCliente(datos),
    onSuccess,
    onError: (err) => {
      setError(err.response?.data?.mensaje || 'Error al guardar el cliente')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.nombreCompleto || !form.numeroIdentificacion) {
      setError('Nombre e identificación son obligatorios')
      return
    }
    mutate(form)
  }

  const campo = (label, name, type = 'text', opciones = null) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
      {opciones ? (
        <select
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {opciones.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-heading">
            {esEdicion ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
          <button onClick={onClose} className="p-1 text-muted hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {campo('Nombre completo', 'nombreCompleto')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campo('Tipo ID', 'tipoIdentificacion', 'text', TIPOS_ID)}
            {campo('Número ID', 'numeroIdentificacion')}
          </div>
          {campo('Celular', 'celular', 'tel')}
          {campo('Correo', 'correo', 'email')}
          {campo('Dirección', 'direccion')}

          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}