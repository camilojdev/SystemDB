import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { crearOrden } from '../../api/taller'
import { getClientes } from '../../api/clientes'
import { X } from 'lucide-react'
import { getUsuarios } from '../../api/usuarios'
import useAuthStore from '../../store/authStore'

export default function ModalCrearOT({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    nombreCliente: '',
    celularCliente: '',
    clienteId: '',
    placa: '',
    marcaVehiculo: '',
    modeloVehiculo: '',
    anioVehiculo: '',
    colorVehiculo: '',
    kilometraje: '',
    descripcionProblema: '',
    mecanicoId: '',
  })
  const [error, setError] = useState('')
  const usuario = useAuthStore((s) => s.usuario)
  const esDueno = usuario?.rol === 'DUENO'
  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => getUsuarios().then((r) => r.data.datos),
    enabled: esDueno, // solo cargar si es dueño
  })
  const mecanicos = (usuariosData || []).filter(
    (u) => u.rol === 'MECANICO' && u.estaActivo)

  const { data: clientesData } = useQuery({
    queryKey: ['clientes', 0],
    queryFn: () => getClientes(0, 100).then((r) => r.data.datos),
  })

  const clientes = clientesData?.content || []

  const { mutate, isPending } = useMutation({
    mutationFn: crearOrden,
    onSuccess,
    onError: (err) => {
      setError(err.response?.data?.mensaje || 'Error al crear la orden')
    },
  })

  const handleClienteChange = (e) => {
    const id = e.target.value
    const cliente = clientes.find((c) => String(c.id) === id)
    setForm({
      ...form,
      clienteId: id,
      nombreCliente: cliente?.nombreCompleto || '',
      celularCliente: cliente?.celular || '',
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.nombreCliente || !form.placa || !form.descripcionProblema) {
      setError('Cliente, placa y descripción del problema son obligatorios')
      return
    }
    mutate({
      ...form,
      clienteId: form.clienteId ? Number(form.clienteId) : null,
      mecanicoId: form.mecanicoId ? Number(form.mecanicoId) : null,
      anioVehiculo: form.anioVehiculo ? Number(form.anioVehiculo) : null,
      kilometraje: form.kilometraje ? Number(form.kilometraje) : null,
    })
  }

  const campo = (label, name, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-heading">Nueva orden de trabajo</h2>
          <button onClick={onClose} className="p-1 text-muted hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Cliente registrado (opcional)
            </label>
            <select
              value={form.clienteId}
              onChange={handleClienteChange}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Cliente ocasional</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombreCompleto}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campo('Nombre cliente', 'nombreCliente')}
            {campo('Celular', 'celularCliente', 'tel')}
          </div>

          <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
            <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-3">Datos del vehículo</p>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campo('Placa *', 'placa')}
                {campo('Marca', 'marcaVehiculo')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {campo('Modelo', 'modeloVehiculo')}
                {campo('Año', 'anioVehiculo', 'number')}
                {campo('Color', 'colorVehiculo')}
              </div>
              {campo('Kilometraje', 'kilometraje', 'number')}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
            <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-3">Problema</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Descripción del problema *
              </label>
              <textarea
                value={form.descripcionProblema}
                onChange={(e) => setForm({ ...form, descripcionProblema: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
          {esDueno && mecanicos.length > 0 && (
          <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
            <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-3">Asignación</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Mecánico asignado
              </label>
              <select
                value={form.mecanicoId}
                onChange={(e) => setForm({ ...form, mecanicoId: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {mecanicos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
                ))}
              </select>
            </div>
          </div>
        )}

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
              {isPending ? 'Creando...' : 'Crear OT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}