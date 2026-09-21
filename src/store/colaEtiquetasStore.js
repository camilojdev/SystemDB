import { create } from 'zustand'

const useColaEtiquetasStore = create((set, get) => ({
  items: [], // { producto, cantidad }

  agregar: (producto, cantidad) => {
    const items = get().items
    const existente = items.find((i) => i.producto.id === producto.id)
    if (existente) {
      set({
        items: items.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        ),
      })
    } else {
      set({ items: [...items, { producto, cantidad }] })
    }
  },

  actualizarCantidad: (productoId, cantidad) => {
    set({
      items: get().items.map((i) =>
        i.producto.id === productoId ? { ...i, cantidad: Math.max(1, cantidad) } : i
      ),
    })
  },

  quitar: (productoId) => {
    set({ items: get().items.filter((i) => i.producto.id !== productoId) })
  },

  vaciar: () => set({ items: [] }),
}))

export default useColaEtiquetasStore