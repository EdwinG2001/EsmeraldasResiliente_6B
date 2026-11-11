import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
                <Route path="incidentes" element={<IncidentCommandPage />} />
                <Route path="comando-coe" element={<IncidentCommandPage />} />
                <Route path="reportes" element={<CitizenReportPage />} />
                <Route path="albergues" element={<SheltersPage />} />
                <Route path="humanitaria" element={<HumanitarianPage />} />
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
