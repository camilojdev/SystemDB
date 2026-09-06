import api from './axios'

export const login = (credenciales) =>
  api.post('/autenticacion/ingresar', credenciales)

export const olvidoContrasena = (identificador) =>
  api.post('/autenticacion/olvide-contrasena', { identificador })

export const restablecerContrasena = (datos) =>
  api.post('/autenticacion/restablecer-contrasena', datos)

export const cerrarSesion = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
}