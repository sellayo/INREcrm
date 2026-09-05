'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Settings, LogOut, FileText, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, logout, role, isSidebarCollapsed, toggleSidebar } = useAuth();

  if (!isAuthenticated) return null;

  const tabs = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'CRM', href: '/crm', icon: Users },
    { name: 'Documents', href: '/documents', icon: FileText },
  ];

  if (role === 'admin') {
    tabs.push({ name: 'Team', href: '/team', icon: ShieldAlert });
  }

  tabs.push({ name: 'Settings', href: '/settings', icon: Settings });

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200 pb-safe">
        <nav className="flex justify-around items-center h-16 px-4">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className="relative flex flex-col items-center justify-center w-16 h-full gap-1"
              >
                <div
                  className={cn(
                    "p-2 rounded-2xl transition-colors duration-200",
                    isActive ? "text-blue-600" : "text-slate-500"
                  )}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span 
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-blue-600" : "text-slate-500"
                  )}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden md:flex flex-col fixed top-16 left-0 bottom-0 bg-blue-600 border-r border-blue-700 py-8 z-50 transition-all duration-300 shadow-xl",
          isSidebarCollapsed ? "w-20 px-2" : "w-64 px-4"
        )}
      >
        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex items-center rounded-xl transition-all duration-200 group relative",
                  isSidebarCollapsed ? "justify-center p-3" : "gap-3 px-3 py-3",
                  isActive 
                    ? "bg-white text-blue-700 font-bold shadow-md" 
                    : "text-blue-100 hover:bg-blue-700 hover:text-white font-medium"
                )}
                title={isSidebarCollapsed ? tab.name : undefined}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                {!isSidebarCollapsed && <span>{tab.name}</span>}
                {isActive && isSidebarCollapsed && (
                  <motion.div
                    layoutId="desktop-active-indicator-col"
                    className="absolute left-0 w-1 h-8 bg-blue-700 rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-blue-500 pt-4 flex flex-col gap-4">
          <button
            onClick={toggleSidebar}
            className={cn(
              "p-2 text-blue-200 hover:text-white transition-colors rounded-lg hover:bg-blue-700 mx-auto",
              isSidebarCollapsed ? "" : "w-full flex justify-start px-4"
            )}
            title="Toggle Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform duration-300", isSidebarCollapsed ? "rotate-180" : "")}><path d="m15 18-6-6 6-6"/></svg>
            {!isSidebarCollapsed && <span className="ml-3 text-sm font-medium">Collapse</span>}
          </button>
        </div>
      </div>
    </>
  );
}
