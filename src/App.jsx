import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { isAuthenticated } from './auth.js'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import { adminPages } from './pages/adminPages.js'

function ProtectedRoute() {
  const location = useLocation()

  return isAuthenticated() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  )
}

function PublicRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {adminPages.map((page) => (
          <Route key={page.path} path={page.path} element={<Dashboard />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
