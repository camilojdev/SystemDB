import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import useCajaStore from './store/cajaStore'
import { getCajaActual } from './api/caja'
import Login from './pages/auth/Login'
import RecuperarContrasena from './pages/auth/RecuperarContrasena'
import Layout from './components/layout/Layout'

function RutaProtegida({ children }) {
  const token = useAuthStore((s) => s.token)
  const setCajaAbierta = useCajaStore((s) => s.setCajaAbierta)

  useEffect(() => {
    if (!token) return
    getCajaActual()
      .then((r) => {
        const datos = r.data.datos
        setCajaAbierta(datos?.estaAbierta || false, datos?.id)
      })
      .catch(() => setCajaAbierta(false))
  }, [token])

  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route
          path="/*"
          element={
            <RutaProtegida>
              <Layout />
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}