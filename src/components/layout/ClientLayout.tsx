'use client';

import { useAuth } from '@/context/AuthContext';
import Navigation from './Navigation';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSidebarCollapsed, status, logout } = useAuth();

  const showSidebar = isAuthenticated && status === 'approved';

  return (
    <>
      {showSidebar && <Navigation />}
      {showSidebar && (
        <button 
          onClick={logout}
          className="md:hidden fixed top-6 right-4 z-50 w-10 h-10 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      )}
      <main 
        className={cn(
          "flex-1 w-full relative transition-all duration-300",
          showSidebar ? "pt-16 md:pt-0" : "",
          showSidebar ? (isSidebarCollapsed ? "md:pl-20" : "md:pl-64") : ""
        )}
      >
        <div className={cn("mx-auto w-full", showSidebar ? "max-w-5xl" : "max-w-full")}>
          {children}
        </div>
      </main>
    </>
  );
}
