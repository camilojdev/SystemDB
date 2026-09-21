import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Trash2, Printer, Settings } from 'lucide-react'
import { buscarProductos } from '../../api/inventario'
import { getPlantillasEtiqueta, actualizarPlantillaEtiqueta, generarEtiquetasPdf } from '../../api/etiquetas'
import useColaEtiquetasStore from '../../store/colaEtiquetasStore'
import useAuthStore from '../../store/authStore'
import { useDebounce } from '../../hooks/useDebounce'

export default function CentroEtiquetas() {
  const usuario = useAuthStore((s) => s.usuario)
  const esDueno = usuario?.rol === 'DUENO'

  const items = useColaEtiquetasStore((s) => s.items)
  const agregar = useColaEtiquetasStore((s) => s.agregar)
  const actualizarCantidad = useColaEtiquetasStore((s) => s.actualizarCantidad)
  const quitar = useColaEtiquetasStore((s) => s.quitar)
  const vaciar = useColaEtiquetasStore((s) => s.vaciar)

  const [busqueda, setBusqueda] = useState('')
  const debouncedBusqueda = useDebounce(busqueda, 300)
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState('A4_30')
  const [editandoPlantilla, setEditandoPlantilla] = useState(false)
  const [error, setError] = useState('')
  const [generando, setGenerando] = useState(false)

  const { data: sugerencias } = useQuery({
    queryKey: ['productos-busqueda-etiquetas', debouncedBusqueda],
    queryFn: () => buscarProductos(debouncedBusqueda).then((r) => r.data.datos),
    enabled: debouncedBusqueda.length >= 2,
  })

  const { data: plantillas } = useQuery({
    queryKey: ['plantillas-etiqueta'],
    queryFn: () => getPlantillasEtiqueta().then((r) => r.data.datos),
  })

  const plantillaActual = plantillas?.find((p) => p.codigo === plantillaSeleccionada)
  const totalEtiquetas = items.reduce((sum, i) => sum + i.cantidad, 0)

  const handleAgregarProducto = (producto) => {
    agregar(producto, 1)
    setBusqueda('')
  }

  const handleGenerar = async () => {
    setError('')
    if (items.length === 0) {
      setError('Agrega al menos un producto a la cola')
      return
    }
    setGenerando(true)
    try {
      const res = await generarEtiquetasPdf({
        plantillaCodigo: plantillaSeleccionada,
        items: items.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad })),
      })
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      window.open(blobUrl, '_blank')
      vaciar()
    } catch (err) {
      setError('No se pudo generar el PDF de etiquetas')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-heading">Centro de Etiquetas</h1>
        <p className="text-muted text-base mt-1">Busca productos, arma tu cola y genera el PDF de impresión</p>
      </div>

      <div className="card">
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Buscar producto</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {sugerencias?.length > 0 && busqueda.length >= 2 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
              {sugerencias.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleAgregarProducto(p)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm border-b border-gray-100 dark:border-slate-700 last:border-0"
                >
                  <p className="font-medium text-heading">{p.nombre}</p>
                  <p className="text-xs text-muted font-mono">{p.codigo}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-heading">Cola de impresión</h2>
          {items.length > 0 && (
            <button onClick={vaciar} className="text-xs text-muted hover:text-red-600 dark:hover:text-red-400">
              Vaciar
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">La cola está vacía. Busca un producto para agregarlo.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.producto.id} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-heading truncate">{item.producto.nombre}</p>
                  <p className="text-xs text-muted font-mono">{item.producto.codigo}</p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={item.cantidad}
                  onChange={(e) => actualizarCantidad(item.producto.id, Number(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-sm text-center bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg"
                />
                <button onClick={() => quitar(item.producto.id)} className="text-muted hover:text-red-600 dark:hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <p className="text-xs text-muted text-right pt-1">Total: {totalEtiquetas} etiqueta(s)</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-heading">Plantilla de impresión</h2>
          {esDueno && plantillaActual && (
            <button
              onClick={() => setEditandoPlantilla((v) => !v)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Settings size={13} /> {editandoPlantilla ? 'Cancelar' : 'Configurar medidas'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          {(plantillas || []).map((p) => (
            <button
              key={p.codigo}
              onClick={() => setPlantillaSeleccionada(p.codigo)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors text-left ${
                plantillaSeleccionada === p.codigo
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-200 dark:border-slate-600 text-heading hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {p.nombre}
            </button>
          ))}
        </div>

        {editandoPlantilla && plantillaActual && (
          <FormularioPlantilla plantilla={plantillaActual} />
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

      <button
        onClick={handleGenerar}
        disabled={generando || items.length === 0}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
      >
        <Printer size={18} /> {generando ? 'Generando...' : 'Generar PDF'}
      </button>
    </div>
  )
}

function FormularioPlantilla({ plantilla }) {
  const [form, setForm] = useState({
    anchoMm: plantilla.anchoMm,
    altoMm: plantilla.altoMm,
    columnas: plantilla.columnas,
    filas: plantilla.filas,
    margenSuperiorMm: plantilla.margenSuperiorMm,
    margenIzquierdoMm: plantilla.margenIzquierdoMm,
    separacionHorizontalMm: plantilla.separacionHorizontalMm,
    separacionVerticalMm: plantilla.separacionVerticalMm,
  })
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => actualizarPlantillaEtiqueta(plantilla.codigo, form),
    onSuccess: () => { setGuardado(true); setError(''); setTimeout(() => setGuardado(false), 2000) },
    onError: (err) => setError(err.response?.data?.mensaje || 'No se pudo guardar'),
  })

  const campo = (label, name) => (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      <input
        type="number"
        step="0.1"
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: Number(e.target.value) })}
        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg"
      />
    </div>
  )

  return (
    <div className="border-t border-gray-200 dark:border-slate-700 pt-3 mt-1 space-y-3">
      <p className="text-xs text-muted">
        Ajusta estas medidas si cambias de proveedor de hojas o de impresora. Todo en milímetros.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {campo('Ancho etiqueta', 'anchoMm')}
        {campo('Alto etiqueta', 'altoMm')}
        {campo('Columnas', 'columnas')}
        {campo('Filas', 'filas')}
        {campo('Margen superior', 'margenSuperiorMm')}
        {campo('Margen izquierdo', 'margenIzquierdoMm')}
        {campo('Separación horiz.', 'separacionHorizontalMm')}
        {campo('Separación vert.', 'separacionVerticalMm')}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {guardado && <p className="text-xs text-green-600 dark:text-green-400">Guardado</p>}
      <button
        onClick={() => mutate()}
        disabled={isPending}
        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg"
      >
        {isPending ? 'Guardando...' : 'Guardar medidas'}
      </button>
    </div>
  )
}