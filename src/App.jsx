import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { getToken, getStoredUser } from './api'
import Layout from './components/Layout'
import Login from './pages/Login'
import EmailDirectory from './pages/EmailDirectory'
import UsersPermissions from './pages/UsersPermissions'
import SystemConsole from './pages/SystemConsole'

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
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout user={user}>
              <Routes>
                <Route path="/" element={<Navigate to="/correos" replace />} />
                <Route path="/correos" element={<EmailDirectory />} />
                <Route path="/usuarios" element={<UsersPermissions />} />
                <Route path="/consola" element={<SystemConsole />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
