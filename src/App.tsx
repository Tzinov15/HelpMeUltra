import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/auth/AuthProvider'
import { useAuth } from '@/auth/AuthContext'
import { LoginPage } from '@/pages/LoginPage'
import { CallbackPage } from '@/pages/CallbackPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { WhereWeveBeenPage } from '@/pages/WhereWeveBeenPage'
import { PlanningPage } from '@/features/planning/PlanningPage'
import { queryClient } from '@/api/queryClient'
import { ThemeProvider } from '@/lib/theme'
import '@/lib/chartjs'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />

      {/* Protected layout — Header + TopLevelNav live here */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      >
        <Route path="/wherewevebeen" element={<WhereWeveBeenPage />} />
        <Route path="/wherearewegoing" element={<PlanningPage />} />
        {/* Legacy redirect */}
        <Route path="/dashboard" element={<Navigate to="/wherewevebeen" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
