'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Plus, ChevronDown, CheckCircle2, User, Mail, Phone, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { role, user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('1 month');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [closedWon, setClosedWon] = useState(0);
  const [lost, setLost] = useState(0);
  const [invoicesSent, setInvoicesSent] = useState(0);
  const [receiptsSent, setReceiptsSent] = useState(0);
  const supabase = createClient();
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [leadData, setLeadData] = useState({ name: '', business_name: '', email: '', phone: '', whatsapp_number: '', niche: '', service: '', notes: '', social_media: '' });
  const [isSaving, setIsSaving] = useState(false);

  const timeOptions = ['1 day', '7 days', '1 month', '6 months', '1 year', 'All time'];

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      let dateFilter = null;
      const now = new Date();
      
      switch (timeFilter) {
        case '1 day': dateFilter = new Date(now.setDate(now.getDate() - 1)).toISOString(); break;
        case '7 days': dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString(); break;
        case '1 month': dateFilter = new Date(now.setMonth(now.getMonth() - 1)).toISOString(); break;
        case '6 months': dateFilter = new Date(now.setMonth(now.getMonth() - 6)).toISOString(); break;
        case '1 year': dateFilter = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString(); break;
        case 'All time': default: dateFilter = null; break;
      }

      // Build base queries for leads
      let totalQuery = supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('type', 'lead');
      let wonQuery = supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('type', 'lead').eq('status', 'won');
      let lostQuery = supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('type', 'lead').eq('status', 'lost');
      let invoiceQuery = supabase.from('invoices').select('*', { count: 'exact', head: true });
      let receiptQuery = supabase.from('receipts').select('*', { count: 'exact', head: true });

      // Apply date filters if not 'All time'
      if (dateFilter) {
        totalQuery = totalQuery.gte('created_at', dateFilter);
        wonQuery = wonQuery.gte('updated_at', dateFilter); // Won/lost based on updated_at
        lostQuery = lostQuery.gte('updated_at', dateFilter);
        invoiceQuery = invoiceQuery.gte('created_at', dateFilter);
        receiptQuery = receiptQuery.gte('created_at', dateFilter);
      }

      // Execute all queries in parallel
      const [
        { count: totalCount },
        { count: wonCount },
        { count: lostCount },
        { count: invoiceCount },
        { count: receiptCount }
      ] = await Promise.all([
        totalQuery,
        wonQuery,
        lostQuery,
        invoiceQuery,
        receiptQuery
      ]);

      if (totalCount !== null) setTotalLeads(totalCount);
      if (wonCount !== null) setClosedWon(wonCount);
      if (lostCount !== null) setLost(lostCount);
      if (invoiceCount !== null) setInvoicesSent(invoiceCount);
      if (receiptCount !== null) setReceiptsSent(receiptCount);
    };

    fetchStats();
  }, [user, timeFilter, supabase]);

  const handleNextStep = () => setStep(prev => Math.min(prev + 1, 9));
  const handlePrevStep = () => setStep(prev => Math.max(prev - 1, 1));
  const handleSaveLead = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase.from('contacts').insert([{
        name: leadData.name,
        business_name: leadData.business_name || null,
        email: leadData.email || null,
        phone: leadData.phone || null,
        whatsapp_number: leadData.whatsapp_number || null,
        niche: leadData.niche || null,
        service: leadData.service || null,
        notes: leadData.notes || null,
        social_media: leadData.social_media || null,
        type: 'lead',
        assigned_sales_id: user.id
      }]);

      if (error) throw error;
      
      setIsWizardOpen(false);
      setStep(1);
      setLeadData({ name: '', business_name: '', email: '', phone: '', whatsapp_number: '', niche: '', service: '', notes: '', social_media: '' });
      setTotalLeads(prev => prev + 1);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error saving lead:', error.message || err, err);
      toast.error('Failed to save lead. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 capitalize">{role} Overview</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors"
          >
            {timeFilter} <ChevronDown size={16} className="text-slate-400" />
          </button>
          
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-2"
              >
                {timeOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setTimeFilter(opt);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors",
                      timeFilter === opt ? "text-blue-600 font-semibold bg-blue-50/50" : "text-slate-700"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Leads', value: totalLeads.toString(), trend: '' },
          { label: 'Closed Won', value: closedWon.toString(), trend: '' },
          { label: 'Lost', value: lost.toString(), trend: '' },
          { label: 'Invoices Sent', value: invoicesSent.toString(), trend: '' },
          { label: 'Receipts Sent', value: receiptsSent.toString(), trend: '' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col [&:nth-child(5)]:col-span-2 md:[&:nth-child(5)]:col-span-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{stat.label}</span>
            <div className="flex items-end justify-between mt-auto">
              <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
              {stat.trend && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">{stat.trend}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Add Lead Button */}
      {role === 'sales' && (
        <div className="mb-8">
          <button
            onClick={() => setIsWizardOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus size={20} />
            Add New Lead
          </button>
        </div>
      )}

      {/* Wizard Modal */}
      <AnimatePresence>
        {isWizardOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Wizard Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-semibold text-slate-900">
                  {step === 9 ? 'Review & Confirm' : `Add Lead - Step ${step} of 8`}
                </h3>
                <button 
                  onClick={() => setIsWizardOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2"
                >
                  Cancel
                </button>
              </div>

              {/* Wizard Content */}
              <div className="p-6 flex-1 overflow-y-auto min-h-[300px] flex flex-col justify-center">
                {step === 1 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                      <User size={24} />
                    </div>
                    <h4 className="text-xl font-bold">What is the lead's name?</h4>
                    <input 
                      autoFocus
                      type="text" 
                      value={leadData.name}
                      onChange={e => setLeadData({...leadData, name: e.target.value})}
                      placeholder="First Lead Name"
                      className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors mb-4"
                      onKeyDown={e => e.key === 'Enter' && leadData.name && handleNextStep()}
                    />
                    <h4 className="text-xl font-bold">What is their page or business name?</h4>
                    <input 
                      type="text" 
                      value={leadData.business_name}
                      onChange={e => setLeadData({...leadData, business_name: e.target.value})}
                      placeholder="Second Page/Business Name"
                      className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                      onKeyDown={e => e.key === 'Enter' && leadData.name && handleNextStep()}
                    />
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                      <Mail size={24} />
                    </div>
                    <h4 className="text-xl font-bold">What is their email address?</h4>
                    <input 
                      autoFocus
                      type="email" 
                      value={leadData.email}
                      onChange={e => setLeadData({...leadData, email: e.target.value})}
                      placeholder="e.g. john@example.com"
                      className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                      onKeyDown={e => e.key === 'Enter' && leadData.email && handleNextStep()}
                    />
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <Phone size={24} />
                    </div>
                    <h4 className="text-xl font-bold">What is their phone number?</h4>
                    <input 
                      autoFocus
                      type="tel" 
                      value={leadData.phone}
                      onChange={e => setLeadData({...leadData, phone: e.target.value})}
                      placeholder="e.g. +1 234 567 8900"
                      className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                      onKeyDown={e => e.key === 'Enter' && leadData.phone && handleNextStep()}
                    />
                  </motion.div>
                )}
                {step === 4 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                      <Briefcase size={24} />
                    </div>
                    <h4 className="text-xl font-bold">What is their niche/industry?</h4>
                    <input 
                      autoFocus
                      type="text" 
                      value={leadData.niche}
                      onChange={e => setLeadData({...leadData, niche: e.target.value})}
                      placeholder="e.g. E-commerce, Course Creator"
                      className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                      onKeyDown={e => e.key === 'Enter' && leadData.niche && handleNextStep()}
                    />
                  </motion.div>
                )}
                {step === 5 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    </div>
                    <h4 className="text-xl font-bold">Social Media Link</h4>
                    <input 
                      autoFocus
                      type="url" 
                      value={leadData.social_media}
                      onChange={e => setLeadData({...leadData, social_media: e.target.value})}
                      placeholder="e.g. https://linkedin.com/in/..."
                      className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                      onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                    />
                  </motion.div>
                )}
                {step === 6 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <Phone size={24} />
                    </div>
                    <h4 className="text-xl font-bold">What is their WhatsApp number?</h4>
                    <input 
                      autoFocus
                      type="tel" 
                      value={leadData.whatsapp_number}
                      onChange={e => setLeadData({...leadData, whatsapp_number: e.target.value})}
                      placeholder="e.g. +1 234 567 8900"
                      className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                      onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                    />
                  </motion.div>
                )}
                {step === 7 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                      <Briefcase size={24} />
                    </div>
                    <h4 className="text-xl font-bold">What service are they interested in?</h4>
                    <input 
                      autoFocus
                      type="text" 
                      value={leadData.service}
                      onChange={e => setLeadData({...leadData, service: e.target.value})}
                      placeholder="e.g. SEO, Web Dev"
                      className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                      onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                    />
                  </motion.div>
                )}
                {step === 8 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </div>
                    <h4 className="text-xl font-bold">Any notes?</h4>
                    <textarea 
                      autoFocus
                      value={leadData.notes}
                      onChange={e => setLeadData({...leadData, notes: e.target.value})}
                      placeholder="Additional details..."
                      rows={3}
                      className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                    />
                  </motion.div>
                )}
                {step === 9 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                      </div>
                      <h4 className="text-xl font-bold">Review Details</h4>
                      <p className="text-slate-500 text-sm">Please confirm the lead information.</p>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {[
                        { label: 'Name', value: leadData.name, stepToEdit: 1 },
                        { label: 'Email', value: leadData.email, stepToEdit: 2 },
                        { label: 'Phone', value: leadData.phone, stepToEdit: 3 },
                        { label: 'Niche', value: leadData.niche, stepToEdit: 4 },
                        { label: 'Social', value: leadData.social_media, stepToEdit: 5 },
                        { label: 'WhatsApp', value: leadData.whatsapp_number, stepToEdit: 6 },
                        { label: 'Service', value: leadData.service, stepToEdit: 7 },
                        { label: 'Notes', value: leadData.notes, stepToEdit: 8 },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between pb-3 border-b border-slate-200 last:border-0 last:pb-0">
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">{item.label}</p>
                            <p className="font-medium text-slate-900">{item.value || '-'}</p>
                          </div>
                          <button 
                            onClick={() => setStep(item.stepToEdit)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Wizard Footer */}
              <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
                {step > 1 && step < 9 && (
                  <button 
                    onClick={handlePrevStep}
                    className="px-6 py-3 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                
                {step < 9 ? (
                  <button 
                    onClick={handleNextStep}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-sm transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveLead}
                    disabled={isSaving}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-sm shadow-green-600/20 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Confirm & Save Lead'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
