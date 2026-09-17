import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),

  setAuth: (token, usuario) => {
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(usuario))
    set({ token, usuario })
  },

  actualizarUsuario: (cambios) => {
    const actual = get().usuario || {}
    const actualizado = { ...actual, ...cambios }
    localStorage.setItem('usuario', JSON.stringify(actualizado))
    set({ usuario: actualizado })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    set({ token: null, usuario: null })
  },

  estaAutenticado: () => !!localStorage.getItem('token'),
}))

export default useAuthStore