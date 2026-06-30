import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { getToken, getStoredUser } from './api'
import Layout from './components/Layout'
import Login from './pages/Login'
import EmailDirectory from './pages/EmailDirectory'
import UsersPermissions from './pages/UsersPermissions'
import SystemConsole from './pages/SystemConsole'
import BotConfiguration from './pages/BotConfiguration'
import RadicacionCampos from './pages/RadicacionCampos'
import RadicacionMonitoreo from './pages/RadicacionMonitoreo'
import TenantOnboarding from './pages/TenantOnboarding'
import TenantWelcome from './pages/TenantWelcome'
import RegistroEmpresa from './pages/RegistroEmpresa'
import SolicitarDemo from './pages/SolicitarDemo'
import Leads from './pages/Leads'
import Empresas from './pages/Empresas'

function ProtectedRoute({ children }) {
  const token = getToken()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(getStoredUser)

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={setUser} />} />

      {/* Registro self-service — público, sin JWT, usa token de invitación */}
      <Route path="/registro" element={<RegistroEmpresa />} />

      {/* Onboarding público completo — wizard "Hola" con token de invitación */}
      <Route path="/onboarding" element={<TenantOnboarding />} />

      {/* Formulario público de solicitud de demo */}
      <Route path="/solicitar-demo" element={<SolicitarDemo />} />

      {/* Onboarding wizard — full screen, sin Layout */}
      <Route
        path="/tenants/:companyId/onboarding"
        element={
          <ProtectedRoute>
            <TenantOnboarding />
          </ProtectedRoute>
        }
      />

      {/* Pantalla de bienvenida — full screen, sin Layout */}
      <Route
        path="/tenants/:companyId/welcome"
        element={
          <ProtectedRoute>
            <TenantWelcome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout user={user}>
              <Routes>
                <Route path="/" element={<Navigate to="/bots" replace />} />
                <Route path="/bots" element={<BotConfiguration />} />
                <Route path="/radicacion/campos"    element={<RadicacionCampos />} />
                <Route path="/radicacion/monitoreo" element={<RadicacionMonitoreo />} />
                <Route path="/correos"    element={<EmailDirectory />} />
                <Route path="/usuarios"   element={<UsersPermissions />} />
                <Route path="/consola"    element={<SystemConsole />} />
                <Route path="/leads"     element={<Leads />} />
                <Route path="/empresas"  element={<Empresas />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
