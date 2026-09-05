'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Save, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { logout, role } = useAuth();
  const supabase = createClient();
  
  const [invoiceNo, setInvoiceNo] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (role !== 'admin') return;
    
    const fetchSettings = async () => {
      setIsLoading(true);
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) {
        setInvoiceNo(data.next_invoice_number?.toString() || '101');
        setReceiptNo(data.next_receipt_number?.toString() || '101');
      }
      setIsLoading(false);
    };
    
    fetchSettings();
  }, [role, supabase]);

  const handleSaveSettings = async () => {
    if (!invoiceNo || !receiptNo) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('app_settings')
      .update({
        next_invoice_number: parseInt(invoiceNo, 10),
        next_receipt_number: parseInt(receiptNo, 10),
      })
      .eq('id', 1);
      
    if (error) {
      toast.error('Failed to update settings');
      console.error(error);
    } else {
      toast.success('Document numbers updated successfully');
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-8 px-4 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500">Manage your preferences</p>
      </header>
      
      <div className="flex-1 space-y-6">
        
        {role === 'admin' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Document Settings (Admin)</h3>
              <p className="text-xs text-slate-500">Set the starting sequence for newly generated documents.</p>
            </div>
            
            {isLoading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> Next Invoice Number
                  </label>
                  <input 
                    type="number" 
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="e.g. 1001"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle size={14} /> Next Receipt Number
                  </label>
                  <input 
                    type="number" 
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="e.g. 5001"
                  />
                </div>
                
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold shadow-sm transition-colors flex items-center justify-center gap-2",
                    isSaving ? "bg-slate-200 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  <Save size={18} /> {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            )}
          </div>
        )}

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
        
        <div className="mt-8 text-center pt-4">
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
