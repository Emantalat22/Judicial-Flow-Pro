import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import CustomCursor from './components/ui/CustomCursor'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Cases from './pages/Cases'
import CaseDetail from './pages/CaseDetail'
import Hearings from './pages/Hearings'
import Documents from './pages/Documents'
import Tasks from './pages/Tasks'
import AIAssistant from './pages/AIAssistant'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Users from './pages/Users'

export default function App() {
  return (
    <AuthProvider>
      {/* Premium 3D Gold Custom Cursor (Active Across Entire App) */}
      <CustomCursor />

      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Root URL opens the Login page first */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Application Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/hearings" element={<Hearings />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/users" element={<Users />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}
