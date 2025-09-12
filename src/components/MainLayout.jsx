import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UnifiedNavigation } from '@/components/UnifiedNavigation';
import { useResponsive } from '@/hooks/useResponsive';

export function MainLayout({ user, onLogout }) {
  const location = useLocation();
  const { isMobile } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!user) {
    return null;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const handleCollapseChange = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Unified Navigation */}
      <UnifiedNavigation 
        user={user} 
        onLogout={onLogout} 
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onOpen={openSidebar}
        onCollapseChange={handleCollapseChange}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ease-in-out ${
        isMobile 
          ? 'pt-16' // Add top padding for mobile header
          : sidebarCollapsed 
            ? 'lg:ml-16' // Desktop sidebar margin when collapsed
            : 'lg:ml-64' // Desktop sidebar margin when expanded
      }`}>
        <div className={`px-4 py-4 ${isMobile ? 'px-3 py-3' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}