'use client';

import { useAuth } from '@/context/AuthContext';
import Navigation from './Navigation';
import TopHeader from './TopHeader';
import { cn } from '@/lib/utils';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSidebarCollapsed, status } = useAuth();

  const showSidebar = isAuthenticated && status === 'approved';

  return (
    <>
      {showSidebar && <TopHeader />}
      {showSidebar && <Navigation />}
      <main 
        className={cn(
          "flex-1 w-full relative transition-all duration-300",
          showSidebar ? "pt-24 md:pt-24 pb-20 md:pb-8" : "",
          showSidebar ? (isSidebarCollapsed ? "md:pl-24" : "md:pl-72") : ""
        )}
      >
        <div className={cn("mx-auto w-full", showSidebar ? "max-w-5xl px-4 md:px-0" : "max-w-full")}>
          {children}
        </div>
      </main>
    </>
  );
}
