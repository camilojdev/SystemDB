import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { crearProducto, actualizarProducto, getCategorias } from '../../api/inventario'
import { X } from 'lucide-react'

export default function ModalProducto({ producto, onClose, onSuccess }) {
  const esEdicion = !!producto
  const numeroInternoBloqueado = esEdicion && !!producto?.numeroInterno

  const [form, setForm] = useState({
    nombre: producto?.nombre || '',
    codigo: producto?.codigo || '',
    numeroInterno: producto?.numeroInterno || '',
    descripcion: producto?.descripcion || '',
    categoriaId: producto?.categoriaId || '',
    precioCompraConIva: producto?.precioCompraConIva || '',
    precioVentaDetal: producto?.precioVentaDetal || '',
    precioOculto: producto?.precioOculto || '',
    stockActual: producto?.stockActual || 0,
    stockMinimo: producto?.stockMinimo || 3,
    unidadMedida: producto?.unidadMedida || 'UNIDAD',
    mostrarEnListaPrecios: producto?.mostrarEnListaPrecios || false,
  })

  const [error, setError] = useState('')

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => getCategorias().then((r) => r.data.datos),
  })

  const categorias = categoriasData?.content || categoriasData || []

  const { mutate, isPending } = useMutation({
    mutationFn: (datos) =>
      esEdicion ? actualizarProducto(producto.id, datos) : crearProducto(datos),
    onSuccess: (res) => {
      const productoGuardado = res.data.datos
      const codigoCambio = esEdicion && producto.codigo !== form.codigo
      onSuccess(productoGuardado, { esEdicion, codigoCambio })
    },
    onError: (err) => {
      setError(err.response?.data?.mensaje || 'Error al guardar el producto')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.nombre || !form.codigo || !form.precioVentaDetal) {
      setError('Nombre, código y precio de venta detal son obligatorios')
      return
    }
    mutate({
        ...form,
        categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
        numeroInterno: form.numeroInterno ? String(form.numeroInterno).trim() : null,
        precioCompraConIva: Number(form.precioCompraConIva),
        precioVentaCop: Number(form.precioVentaDetal),
        stockActual: Number(form.stockActual),
        stockMinimo: Number(form.stockMinimo),
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
          <h2 className="text-lg font-semibold text-heading">
            {esEdicion ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} className="p-1 text-muted hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {campo('Nombre', 'nombre')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campo('Código', 'codigo')}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Número interno {numeroInternoBloqueado && <span className="text-xs text-muted">(no se puede cambiar)</span>}
              </label>
              <input
                type="text"
                value={form.numeroInterno}
                onChange={(e) => setForm({ ...form, numeroInterno: e.target.value })}
                disabled={numeroInternoBloqueado}
                placeholder="Ej. 123"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Categoría</label>
              <select
                value={form.categoriaId}
                onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            {campo('Descripción', 'descripcion')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campo('Precio de compra (COP)', 'precioCompraConIva', 'number')}
            {campo('Precio de venta (COP)', 'precioVentaDetal', 'number')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campo('Stock inicial', 'stockActual', 'number')}
            {campo('Stock mínimo', 'stockMinimo', 'number')}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mostrarEnListaPrecios"
              checked={form.mostrarEnListaPrecios}
              onChange={(e) => setForm({ ...form, mostrarEnListaPrecios: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="mostrarEnListaPrecios" className="text-sm text-gray-700 dark:text-slate-300">
              Mostrar en lista de precios
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Precio oculto (letras) <span className="text-xs text-muted">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.precioOculto}
              onChange={(e) => setForm({ ...form, precioOculto: e.target.value.toUpperCase() })}
              placeholder="Ej. NVLLLLL"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 text-heading rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              {isPending ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}