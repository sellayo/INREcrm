'use client';

import { useAuth } from '@/context/AuthContext';
import { LogOut, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PendingPage() {
  const { logout, status } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
      >
        <div className="p-8 text-center flex flex-col items-center">
          {status === 'rejected' ? (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6">
                <AlertCircle size={40} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">Access Denied</h1>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Your account request has been rejected by the administrator. If you believe this is a mistake, please contact support.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6">
                <Clock size={40} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">Waiting for Approval</h1>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Your account has been created successfully, but it requires administrator approval before you can access the platform. Please check back later.
              </p>
            </>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
