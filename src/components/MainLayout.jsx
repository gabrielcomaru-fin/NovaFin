import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';

export function MainLayout({ user, onLogout }) {
  const location = useLocation();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 transition-all duration-300 ease-in-out lg:ml-64">
        <div className="px-4 py-8">
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