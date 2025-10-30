import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/auth/Login';
import Dashboard from '@/pages/dashboard/Dashboard';
import EquiposList from '@/pages/equipos/EquiposList';
import EquipoForm from '@/pages/equipos/EquipoForm';
import EquipoDetail from '@/pages/equipos/EquipoDetail';
import TrasladosList from '@/pages/traslados/TrasladosList';
import TrasladoForm from '@/pages/traslados/TrasladoForm';
import BajasList from '@/pages/bajas/BajasList';
import BajaForm from '@/pages/bajas/BajaForm';
import BajaDetail from '@/pages/bajas/BajaDetail';
import Reportes from '@/pages/reportes/Reportes';
import AreasList from '@/pages/areas/AreasList';
import Perfil from '@/pages/perfil/Perfil';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública: Login */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="equipos" element={<EquiposList />} />
            <Route path="equipos/nuevo" element={<EquipoForm />} />
            <Route path="equipos/:id" element={<EquipoDetail />} />
            <Route path="equipos/:id/editar" element={<EquipoForm />} />
            <Route path="traslados" element={<TrasladosList />} />
            <Route path="traslados/nuevo" element={<TrasladoForm />} />
            <Route path="bajas" element={<BajasList />} />
            <Route path="bajas/nueva" element={<BajaForm />} />
            <Route path="bajas/:id" element={<BajaDetail />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="areas" element={<AreasList />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;