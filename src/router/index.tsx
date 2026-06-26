import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { FullSpinner } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { homePathForRole } from '@/lib/roles';

// Páginas de autenticación (entrada — carga eager)
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Páginas internas — code-splitting por ruta
const RecepcionDashboard = lazy(() => import('@/pages/recepcionista/DashboardPage'));
const PacientesPage = lazy(() => import('@/pages/recepcionista/PacientesPage'));
const PacienteDetallePage = lazy(() => import('@/pages/recepcionista/PacienteDetallePage'));
const CitasPage = lazy(() => import('@/pages/recepcionista/CitasPage'));
const ValidarCoberturaPage = lazy(() => import('@/pages/recepcionista/ValidarCoberturaPage'));
const PagosPage = lazy(() => import('@/pages/recepcionista/PagosPage'));
const RecetasPage = lazy(() => import('@/pages/recepcionista/RecetasPage'));

const DashboardMedicoPage = lazy(() => import('@/pages/medico/DashboardMedicoPage'));
const AtencionPage = lazy(() => import('@/pages/medico/AtencionPage'));
const HistoriaClinicaPage = lazy(() => import('@/pages/medico/HistoriaClinicaPage'));
const AgendaPage = lazy(() => import('@/pages/medico/AgendaPage'));

const DashboardAuditorPage = lazy(() => import('@/pages/auditor/DashboardAuditorPage'));
const TrazasPage = lazy(() => import('@/pages/auditor/TrazasPage'));
const UsuariosPage = lazy(() => import('@/pages/auditor/UsuariosPage'));
const MedicosAdminPage = lazy(() => import('@/pages/auditor/MedicosAdminPage'));
const AdminCitasPage = lazy(() => import('@/pages/auditor/AdminCitasPage'));
const AdminPagosPage = lazy(() => import('@/pages/auditor/AdminPagosPage'));
const AdminCoberturasPage = lazy(() => import('@/pages/auditor/AdminCoberturasPage'));
const AdminPrescripcionesPage = lazy(() => import('@/pages/auditor/AdminPrescripcionesPage'));
const AdminNotificacionesPage = lazy(() => import('@/pages/auditor/AdminNotificacionesPage'));

function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={user ? homePathForRole(user.rol) : '/login'} replace />;
}

export function AppRouter() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><FullSpinner /></div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* ─── Recepcionista ─── */}
            <Route element={<RoleRoute allow={['Recepcionista']} />}>
              <Route path="/recepcion" element={<RecepcionDashboard />} />
              <Route path="/recepcion/pacientes" element={<PacientesPage />} />
              <Route path="/recepcion/pacientes/:id" element={<PacienteDetallePage />} />
              <Route path="/recepcion/citas" element={<CitasPage />} />
              <Route path="/recepcion/cobertura" element={<ValidarCoberturaPage />} />
              <Route path="/recepcion/pagos" element={<PagosPage />} />
              <Route path="/recepcion/recetas" element={<RecetasPage />} />
              <Route path="/recepcion/usuarios" element={<UsuariosPage />} />
            </Route>

            {/* ─── Médico ─── */}
            <Route element={<RoleRoute allow={['Médico']} />}>
              <Route path="/medico" element={<DashboardMedicoPage />} />
              <Route path="/medico/atencion" element={<AtencionPage />} />
              <Route path="/medico/historias" element={<HistoriaClinicaPage />} />
              <Route path="/medico/agenda" element={<AgendaPage />} />
              <Route path="/medico/recetas" element={<RecetasPage />} />
              <Route path="/medico/usuarios" element={<UsuariosPage />} />
            </Route>

            {/* ─── Auditor ─── */}
            <Route element={<RoleRoute allow={['Auditor']} />}>
              <Route path="/auditor" element={<DashboardAuditorPage />} />
              <Route path="/auditor/pacientes" element={<PacientesPage />} />
              <Route path="/auditor/pacientes/:id" element={<PacienteDetallePage />} />
              <Route path="/auditor/citas" element={<AdminCitasPage />} />
              <Route path="/auditor/cobertura" element={<AdminCoberturasPage />} />
              <Route path="/auditor/pagos" element={<AdminPagosPage />} />
              <Route path="/auditor/prescripciones" element={<AdminPrescripcionesPage />} />
              <Route path="/auditor/notificaciones" element={<AdminNotificacionesPage />} />
              <Route path="/auditor/trazas" element={<TrazasPage />} />
              <Route path="/auditor/usuarios" element={<UsuariosPage />} />
              <Route path="/auditor/medicos" element={<MedicosAdminPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
