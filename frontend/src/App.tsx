import { Routes, Route } from 'react-router-dom'
import { PageLayout } from './components/layout/page-layout'
import { ProtectedRoute } from './components/auth/protected-route'
import { Dashboard } from './pages/dashboard'
import { Customers } from './pages/customers'
import { CustomerDetail } from './pages/customer-detail'
import { Login } from './pages/auth/login'
import { Register } from './pages/auth/register'
import { ForgotPassword } from './pages/auth/forgot-password'
import { ResetPassword } from './pages/auth/reset-password'
import { ProfileSettings } from './pages/settings/profile'
import { SecuritySettings } from './pages/settings/security'

function App() {
  return (
    <Routes>
      {/* Kimlik doğrulama sayfaları */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      
      {/* Korumalı sayfalar */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PageLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="settings/profile" element={<ProfileSettings />} />
        <Route path="settings/security" element={<SecuritySettings />} />
        <Route path="*" element={<div>Sayfa bulunamadı</div>} />
      </Route>
    </Routes>
  )
}

export default App
