import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'

// Pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ClientesPage } from '@/pages/clientes/ClientesPage'
import { UsuariosPage } from '@/pages/usuarios/UsuariosPage'
import { ProdutosPage } from '@/pages/produtos/ProdutosPage'
import { PedidosPage } from '@/pages/pedidos/PedidosPage'
import { PedidoFormPage } from '@/pages/pedidos/PedidoFormPage'
import { OpsKanbanPage } from '@/pages/ops/OpsKanbanPage'
import { ExtrusionForm } from '@/pages/ops/components/ExtrusionForm'
import { AparasPage } from '@/pages/aparas/AparasPage'
import { AnaliseClientes } from '@/pages/analise/AnaliseClientes'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="produtos" element={<ProdutosPage />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="pedidos/novo" element={<PedidoFormPage />} />
          <Route path="pedidos/:id" element={<PedidoFormPage />} />
          <Route path="ops" element={<OpsKanbanPage />} />
          <Route path="apontamento-extrusao" element={<ExtrusionForm />} />
          <Route path="aparas" element={<AparasPage />} />
          <Route path="analise-clientes" element={<AnaliseClientes />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}

export default App
