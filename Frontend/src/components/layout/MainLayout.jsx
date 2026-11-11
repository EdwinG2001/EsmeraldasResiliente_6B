import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AIFloatingAssistant } from '../common/AIFloatingAssistant';

export const MainLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setDesktopSidebarOpen(!desktopSidebarOpen);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-crisis-900 text-slate-900 dark:text-slate-100">
      <Navbar 
        onToggleSidebar={handleToggleSidebar} 
        isSidebarOpen={mobileSidebarOpen}
        isDesktopSidebarOpen={desktopSidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          isOpen={mobileSidebarOpen} 
          onClose={() => setMobileSidebarOpen(false)}
          isDesktopOpen={desktopSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-crisis-900 w-full min-w-0">
          <Outlet />
        </main>
      </div>
      {/* Botón Flotante y Consola de Inteligencia Artificial (Módulo 6) */}
      <AIFloatingAssistant />
    </div>
  );
};
export default MainLayout;
