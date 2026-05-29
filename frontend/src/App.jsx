import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Header from './components/Header'
import ProjectList from './components/ProjectList'
import ProjectDetail from './components/ProjectDetail'
import TicketList from './components/TicketList'
import TicketDetail from './components/TicketDetail'
import Login from './components/Login'
import UserManagement from './components/UserManagement'
import ProcurementPreparation from './components/ProcurementPreparation'
import ProcurementPanel from './components/ProcurementPanel'
import OcrApiKeyManager from './components/OcrApiKeyManager'
import TemplateSuratManager from './components/TemplateSuratManager'

import { Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (allowedRoles && !allowedRoles.some(r => r.toLowerCase() === user.role.toLowerCase())) {
    return <Navigate to="/" replace />
  }
  return children
}

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <AuthProvider>
      <div className={`min-h-screen flex bg-white relative ${isLoginPage ? 'bg-white' : ''}`}>
        {!isLoginPage && <Header />}
        <main className={`flex-1 min-w-0 ${isLoginPage ? 'p-0 h-screen overflow-hidden' : 'p-8 lg:p-12 overflow-y-auto'}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><TicketList /></ProtectedRoute>} />
            <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={['Admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/ppk/persiapan" element={<ProtectedRoute allowedRoles={['Admin', 'PPK']}><ProcurementPreparation /></ProtectedRoute>} />
            <Route path="/pp/panel" element={<ProtectedRoute allowedRoles={['Admin', 'PP']}><ProcurementPanel /></ProtectedRoute>} />
            <Route path="/admin/ocr" element={<ProtectedRoute allowedRoles={['Admin', 'PPK', 'PP']}><OcrApiKeyManager /></ProtectedRoute>} />
            <Route path="/admin/templates" element={<ProtectedRoute allowedRoles={['Admin', 'PPK', 'PP']}><TemplateSuratManager /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App