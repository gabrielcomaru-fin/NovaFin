import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UnifiedNavigation } from '@/components/UnifiedNavigation';
import { useResponsive } from '@/hooks/useResponsive';

export function MainLayout({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleLogout = async () => {
    try {
      await onLogout?.();
    } finally {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Unified Navigation */}
      <UnifiedNavigation 
        user={user} 
        onLogout={handleLogout} 
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
			: 'lg:ml-48' // Desktop sidebar margin when expanded (match w-48)
      }`}>
        <div className={`px-4 py-4 md:px-6 md:py-6 ${isMobile ? 'px-4 py-4' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}