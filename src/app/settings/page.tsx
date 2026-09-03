'use client';

import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-8 px-4 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500">Manage your preferences</p>
      </header>
      
      <div className="flex-1 space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            <p className="text-xs text-slate-500">Email and push alerts</p>
          </div>
          <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Dark Mode</h3>
            <p className="text-xs text-slate-500">Toggle dark theme</p>
          </div>
          <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button 
            onClick={logout}
            className="text-red-600 font-medium text-sm hover:underline"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
