import { create } from 'zustand'

const obtenerTemaInicial = () => {
  const guardado = localStorage.getItem('tema')
  if (guardado === 'oscuro' || guardado === 'claro') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}

const aplicarClaseHtml = (tema) => {
  const html = document.documentElement
  if (tema === 'oscuro') html.classList.add('dark')
  else html.classList.remove('dark')
}

// Se aplica de inmediato al importar el módulo
const temaInicial = obtenerTemaInicial()
aplicarClaseHtml(temaInicial)

const useThemeStore = create((set, get) => ({
  tema: temaInicial,

  alternarTema: () => {
    const nuevo = get().tema === 'oscuro' ? 'claro' : 'oscuro'
    localStorage.setItem('tema', nuevo)
    aplicarClaseHtml(nuevo)
    set({ tema: nuevo })
  },
}))

export default useThemeStore