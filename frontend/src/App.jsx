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

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <AuthProvider>
      <div className={`min-h-screen flex bg-white relative ${isLoginPage ? 'bg-white' : ''}`}>
        {!isLoginPage && <Header />}
        <main className={`flex-1 min-w-0 ${isLoginPage ? 'p-0 h-screen overflow-hidden' : 'p-8 lg:p-12 overflow-y-auto'}`}>
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/tickets" element={<TicketList />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/ppk/persiapan" element={<ProcurementPreparation />} />
            <Route path="/pp/panel" element={<ProcurementPanel />} />
            <Route path="/admin/ocr" element={<OcrApiKeyManager />} />
            <Route path="/admin/templates" element={<TemplateSuratManager />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App