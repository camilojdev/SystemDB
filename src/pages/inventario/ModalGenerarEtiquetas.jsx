import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Tag } from 'lucide-react'
import useColaEtiquetasStore from '../../store/colaEtiquetasStore'

export default function ModalGenerarEtiquetas({ producto, cantidadSugerida, onClose }) {
  const navigate = useNavigate()
  const agregarACola = useColaEtiquetasStore((s) => s.agregar)
  const [cantidad, setCantidad] = useState(cantidadSugerida > 0 ? cantidadSugerida : 1)

  if (!producto) return null

  const handleGenerarAhora = () => {
    agregarACola(producto, cantidad)
    onClose()
    navigate('/centro-etiquetas')
  }

  const handleAgregarACola = () => {
    agregarACola(producto, cantidad)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-heading">Generar etiquetas</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted mb-3">
          ¿Deseas generar etiquetas para <span className="font-medium text-heading">{producto.nombre}</span>?
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Cantidad</label>
          <input
            type="number"
            min={1}
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={handleGenerarAhora} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            Generar ahora
          </button>
          <button onClick={handleAgregarACola} className="w-full py-2 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
            Agregar a cola
          </button>
          <button onClick={onClose} className="w-full py-2 text-sm text-muted hover:underline">
            Después
          </button>
        </div>
      </div>
    </div>
  )
}