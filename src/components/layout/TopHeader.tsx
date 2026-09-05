'use client';

import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';
import Image from 'next/image';

export default function TopHeader() {
  const { logout, role, user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-b border-slate-200 z-[60] flex items-center justify-between px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Image 
          src="/sellayo-logo.png" 
          alt="Sellayo CRM" 
          width={120} 
          height={40} 
          className="h-8 w-auto object-contain"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-bold text-slate-900 capitalize">{role}</span>
          <span className="text-xs text-slate-500">{user?.email || 'Logged in'}</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-inner">
          <User size={18} />
        </div>
        <button 
          onClick={logout}
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
