import { useState, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Header from './components/Header'
import ProjectList from './components/ProjectList'
import ProjectDetail from './components/ProjectDetail'
import RealisasiAnggaranPanel from './components/RealisasiAnggaranPanel'
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <AuthProvider>
      <div className={`min-h-screen flex bg-slate-50 relative`}>
        {!isLoginPage && (
          <>
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={closeSidebar}
              />
            )}
            <Header
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              onNavClick={closeSidebar}
            />
          </>
        )}

        {/* Mobile top bar (hamburger) */}
        {!isLoginPage && (
          <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-slate-200 flex items-center px-4 shadow-sm print:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Buka Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="ml-3 text-sm font-bold text-slate-800">PBJ SAE</span>
          </div>
        )}

        <main className={`flex-1 min-w-0 ${
          isLoginPage
            ? 'p-0 h-screen overflow-hidden'
            : 'pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto min-h-screen'
        }`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/reports/absorption" element={<ProtectedRoute><RealisasiAnggaranPanel /></ProtectedRoute>} />
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