import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { PortalSelectionPage } from './pages/portal/PortalSelectionPage';
import { CrisisRoomPage } from './pages/dashboard/CrisisRoomPage';
import { CitizenReportPage } from './pages/reports/CitizenReportPage';
import { SheltersPage } from './pages/evacuation/SheltersPage';
import { HumanitarianPage } from './pages/humanitarian/HumanitarianPage';
import { IncidentCommandPage } from './pages/incidents/IncidentCommandPage';
import { LoginPage } from './pages/auth/LoginPage';

// Control de acceso exclusivo para Personal Oficial COE (Redirige a /login si es visitante)
const ProtectedCoeRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <OfflineProvider>
            <Routes>
              {/* Pantalla de Selección Inicial (Portal de Acceso) */}
              <Route path="/" element={<PortalSelectionPage />} />
              <Route path="/portal" element={<PortalSelectionPage />} />

              {/* Módulos Principales del Sistema alojados dentro de MainLayout */}
              <Route element={<MainLayout />}>
                <Route path="sala-crisis" element={<CrisisRoomPage />} />
                <Route path="crisis" element={<CrisisRoomPage />} />
                <Route 
                  path="incidentes" 
                  element={
                    <ProtectedCoeRoute>
                      <IncidentCommandPage />
                    </ProtectedCoeRoute>
                  } 
                />
                <Route 
                  path="comando-coe" 
                  element={
                    <ProtectedCoeRoute>
                      <IncidentCommandPage />
                    </ProtectedCoeRoute>
                  } 
                />
                <Route path="reportes" element={<CitizenReportPage />} />
                <Route 
                  path="albergues" 
                  element={
                    <ProtectedCoeRoute>
                      <SheltersPage />
                    </ProtectedCoeRoute>
                  } 
                />
                <Route 
                  path="humanitaria" 
                  element={
                    <ProtectedCoeRoute>
                      <HumanitarianPage />
                    </ProtectedCoeRoute>
                  } 
                />
                <Route path="login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </OfflineProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
