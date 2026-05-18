import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { getToken, getStoredUser } from './api'
import Layout from './components/Layout'
import Login from './pages/Login'
import EmailDirectory from './pages/EmailDirectory'
import UsersPermissions from './pages/UsersPermissions'
import SystemConsole from './pages/SystemConsole'
import ConnectionDirectory from './pages/ConnectionDirectory'
import BotConfiguration from './pages/BotConfiguration'
import TenantOnboarding from './pages/TenantOnboarding'
import TenantWelcome from './pages/TenantWelcome'

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
                <Route path="/" element={<Navigate to="/conexiones" replace />} />
                <Route path="/conexiones" element={<ConnectionDirectory />} />
                <Route path="/bots" element={<BotConfiguration />} />
                <Route path="/correos"    element={<EmailDirectory />} />
                <Route path="/usuarios"   element={<UsersPermissions />} />
                <Route path="/consola"    element={<SystemConsole />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
