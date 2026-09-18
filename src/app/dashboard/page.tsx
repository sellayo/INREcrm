'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  ChevronDown, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  CheckCircle,
  DollarSign,
  Calendar,
  CreditCard,
  Wallet,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface InvoiceRecord {
  id: string;
  invoice_no: number | string;
  amount: number;
  status: string;
  payment_method?: string;
  created_at: string;
  contacts?: { id?: string; name?: string; business_name?: string } | { id?: string; name?: string; business_name?: string }[] | null;
}

interface ReceiptRecord {
  id: string;
  receipt_no: number | string;
  amount: number;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  contacts?: { id?: string; name?: string; business_name?: string } | { id?: string; name?: string; business_name?: string }[] | null;
}

interface FinancialTransaction {
  id: string;
  type: 'receipt' | 'invoice';
  refNo: string;
  amount: number;
  clientName: string;
  businessName: string;
  date: string;
  status: string;
  paymentMethod?: string;
}

export default function DashboardPage() {
  const { role, user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('1 month');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  
  // Tab State (For Admin: CRM Overview vs Financial Overview)
  const [activeTab, setActiveTab] = useState<'crm' | 'financial'>('crm');
  const [financialFilter, setFinancialFilter] = useState<'all' | 'receipts' | 'invoices'>('all');

  // CRM Metrics State
  const [totalLeads, setTotalLeads] = useState(0);
  const [closedWon, setClosedWon] = useState(0);
  const [lost, setLost] = useState(0);
  const [invoicesSent, setInvoicesSent] = useState(0);
  const [receiptsSent, setReceiptsSent] = useState(0);

  // Financial Metrics State
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(false);

  const supabase = createClient();
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [leadData, setLeadData] = useState({ 
    name: '', 
    business_name: '', 
    email: '', 
    phone: '', 
    whatsapp_number: '', 
    niche: '', 
    service: '', 
    notes: '', 
    social_media: '' 
  });
  const [isSaving, setIsSaving] = useState(false);

  const timeOptions = ['1 day', '7 days', '1 month', '6 months', '1 year', 'All time'];

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      let dateFilter: string | null = null;
      const now = new Date();
      
      switch (timeFilter) {
        case '1 day': dateFilter = new Date(now.setDate(now.getDate() - 1)).toISOString(); break;
        case '7 days': dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString(); break;
        case '1 month': dateFilter = new Date(now.setMonth(now.getMonth() - 1)).toISOString(); break;
        case '6 months': dateFilter = new Date(now.setMonth(now.getMonth() - 6)).toISOString(); break;
        case '1 year': dateFilter = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString(); break;
        case 'All time': default: dateFilter = null; break;
      }

      // 1. CRM Lead & Document Count Queries
      let totalQuery = supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('type', 'lead');
      let wonQuery = supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('type', 'lead').eq('status', 'won');
      let lostQuery = supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('type', 'lead').eq('status', 'lost');
      let invoiceCountQuery = supabase.from('invoices').select('*', { count: 'exact', head: true });
      let receiptCountQuery = supabase.from('receipts').select('*', { count: 'exact', head: true });

      if (dateFilter) {
        totalQuery = totalQuery.gte('created_at', dateFilter);
        wonQuery = wonQuery.gte('updated_at', dateFilter);
        lostQuery = lostQuery.gte('updated_at', dateFilter);
        invoiceCountQuery = invoiceCountQuery.gte('created_at', dateFilter);
        receiptCountQuery = receiptCountQuery.gte('created_at', dateFilter);
      }

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
        invoiceCountQuery,
        receiptCountQuery
      ]);

      if (totalCount !== null) setTotalLeads(totalCount);
      if (wonCount !== null) setClosedWon(wonCount);
      if (lostCount !== null) setLost(lostCount);
      if (invoiceCount !== null) setInvoicesSent(invoiceCount);
      if (receiptCount !== null) setReceiptsSent(receiptCount);

      // 2. Financial Detailed Queries (Fetched for Admin)
      if (role === 'admin') {
        setIsLoadingFinancial(true);
        try {
          let invQuery = supabase
            .from('invoices')
            .select('id, invoice_no, amount, status, payment_method, created_at, contacts(id, name, business_name)')
            .order('created_at', { ascending: false });

          let recQuery = supabase
            .from('receipts')
            .select('id, receipt_no, amount, payment_method, transaction_id, created_at, contacts(id, name, business_name)')
            .order('created_at', { ascending: false });

          if (dateFilter) {
            invQuery = invQuery.gte('created_at', dateFilter);
            recQuery = recQuery.gte('created_at', dateFilter);
          }

          const [invRes, recRes] = await Promise.all([invQuery, recQuery]);
          if (invRes.data) setInvoices(invRes.data as unknown as InvoiceRecord[]);
          if (recRes.data) setReceipts(recRes.data as unknown as ReceiptRecord[]);
        } catch (err) {
          console.error('Error fetching financial records:', err);
        } finally {
          setIsLoadingFinancial(false);
        }
      }
    };

    fetchStats();
  }, [user, timeFilter, role, supabase]);

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
      
      toast.success('Lead added successfully!');
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

  // Financial Calculations
  const totalRevenue = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const pendingReceivables = pendingInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const avgDealSize = receipts.length > 0 ? Math.round(totalRevenue / receipts.length) : 0;
  const collectionRate = totalInvoiced > 0 
    ? Math.min(100, Math.round((totalRevenue / totalInvoiced) * 100))
    : (totalRevenue > 0 ? 100 : 0);

  // Payment Methods Breakdown
  const paymentMethodStats = (() => {
    const counts: Record<string, { count: number; total: number }> = {};
    receipts.forEach(r => {
      const raw = r.payment_method?.trim() || 'Standard';
      if (!counts[raw]) counts[raw] = { count: 0, total: 0 };
      counts[raw].count += 1;
      counts[raw].total += Number(r.amount) || 0;
    });
    return Object.entries(counts).map(([name, val]) => ({
      name,
      count: val.count,
      total: val.total,
      pct: totalRevenue > 0 ? Math.round((val.total / totalRevenue) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  })();

  // Transactions Ledger
  const transactions: FinancialTransaction[] = [
    ...receipts.map((r) => {
      const contact = Array.isArray(r.contacts) ? r.contacts[0] : r.contacts;
      return {
        id: `rec-${r.id}`,
        type: 'receipt' as const,
        refNo: `REC-${r.receipt_no || '---'}`,
        amount: Number(r.amount) || 0,
        clientName: contact?.name || 'Client',
        businessName: contact?.business_name || '',
        date: r.created_at,
        status: 'Paid',
        paymentMethod: r.payment_method || 'Direct'
      };
    }),
    ...invoices.map((i) => {
      const contact = Array.isArray(i.contacts) ? i.contacts[0] : i.contacts;
      return {
        id: `inv-${i.id}`,
        type: 'invoice' as const,
        refNo: `INV-${i.invoice_no || '---'}`,
        amount: Number(i.amount) || 0,
        clientName: contact?.name || 'Client',
        businessName: contact?.business_name || '',
        date: i.created_at,
        status: i.status === 'paid' ? 'Paid' : 'Pending',
        paymentMethod: i.payment_method || undefined
      };
    })
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = transactions.filter(t => {
    if (financialFilter === 'receipts') return t.type === 'receipt';
    if (financialFilter === 'invoices') return t.type === 'invoice';
    return true;
  });

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-8">
      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
            {role === 'admin' 
              ? (activeTab === 'financial' ? 'Financial & Revenue Overview' : 'CRM Pipeline & Lead Performance') 
              : `${role} Overview`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Add New Lead button in header for Quick Action (Admin & Sales) */}
          {(role === 'sales' || role === 'admin') && (
            <button
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all active:scale-95 shrink-0"
            >
              <Plus size={18} />
              <span>Add New Lead</span>
            </button>
          )}

          {/* Time Filter */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            >
              <Calendar size={15} className="text-slate-400 dark:text-slate-500" />
              <span>{timeFilter}</span>
              <ChevronDown size={16} className="text-slate-400 dark:text-slate-500" />
            </button>
            
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 z-30 py-2"
                >
                  {timeOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        setTimeFilter(opt);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                        timeFilter === opt ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Admin Tabs Switcher: CRM Overview vs Financial Overview */}
      {role === 'admin' && (
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl w-fit mb-6 border border-slate-300/50 dark:border-slate-700/60 shadow-inner">
          <button
            onClick={() => setActiveTab('crm')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
              activeTab === 'crm'
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Users size={17} />
            <span>CRM Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
              activeTab === 'financial'
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <DollarSign size={17} />
            <span>Financial Overview</span>
          </button>
        </div>
      )}

      {/* TAB CONTENT: CRM OVERVIEW */}
      {activeTab === 'crm' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Leads', value: totalLeads.toString(), icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/50', glow: 'shadow-blue-500/10' },
              { label: 'Closed Won', value: closedWon.toString(), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-900/50', glow: 'shadow-emerald-500/10' },
              { label: 'Lost', value: lost.toString(), icon: TrendingDown, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-900/50', glow: 'shadow-rose-500/10' },
              { label: 'Invoices Sent', value: invoicesSent.toString(), icon: FileText, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-900/50', glow: 'shadow-indigo-500/10' },
              { label: 'Receipts Sent', value: receiptsSent.toString(), icon: CheckCircle, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-100 dark:border-teal-900/50', glow: 'shadow-teal-500/10' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={i} 
                  className={cn(
                    "group relative p-5 rounded-3xl border flex flex-col bg-white dark:bg-slate-900 hover:-translate-y-1 transition-all duration-300 shadow-md",
                    stat.border, stat.glow,
                    "[&:nth-child(5)]:col-span-2 md:[&:nth-child(5)]:col-span-1"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                    <Icon size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">{stat.label}</span>
                  <div className="flex items-end justify-between mt-auto">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</span>
                  </div>
                  
                  {/* Subtle background glow effect on hover */}
                  <div className={cn("absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none blur-xl -z-10", stat.bg)} />
                </div>
              );
            })}
          </div>

          {/* CRM Conversion Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Win Rate</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) : '0'}%
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Closed won ratio</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Active Pipeline</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {Math.max(0, totalLeads - closedWon - lost)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Leads currently in progress</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Document Flow</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {invoicesSent + receiptsSent}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{invoicesSent} Invoices · {receiptsSent} Receipts</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText size={24} />
              </div>
            </div>
          </div>

          {/* Add Lead Primary Button Section (Admin and Sales) */}
          {(role === 'sales' || role === 'admin') && (
            <div className="mb-8">
              <button
                onClick={() => setIsWizardOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all active:scale-95"
              >
                <Plus size={20} />
                <span>Add New Lead</span>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* TAB CONTENT: FINANCIAL OVERVIEW (Admin Only) */}
      {role === 'admin' && activeTab === 'financial' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              {
                label: 'Total Revenue',
                value: `₹${totalRevenue.toLocaleString('en-IN')}`,
                sub: `${receipts.length} receipts collected`,
                icon: DollarSign,
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                border: 'border-emerald-100 dark:border-emerald-900/50',
                glow: 'shadow-emerald-500/10'
              },
              {
                label: 'Total Invoiced',
                value: `₹${totalInvoiced.toLocaleString('en-IN')}`,
                sub: `${invoices.length} invoices issued`,
                icon: FileText,
                color: 'text-indigo-600 dark:text-indigo-400',
                bg: 'bg-indigo-50 dark:bg-indigo-900/20',
                border: 'border-indigo-100 dark:border-indigo-900/50',
                glow: 'shadow-indigo-500/10'
              },
              {
                label: 'Pending Receivables',
                value: `₹${pendingReceivables.toLocaleString('en-IN')}`,
                sub: `${pendingInvoices.length} awaiting payment`,
                icon: Clock,
                color: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-50 dark:bg-amber-900/20',
                border: 'border-amber-100 dark:border-amber-900/50',
                glow: 'shadow-amber-500/10'
              },
              {
                label: 'Avg Deal Size',
                value: `₹${avgDealSize.toLocaleString('en-IN')}`,
                sub: 'Per paid transaction',
                icon: TrendingUp,
                color: 'text-purple-600 dark:text-purple-400',
                bg: 'bg-purple-50 dark:bg-purple-900/20',
                border: 'border-purple-100 dark:border-purple-900/50',
                glow: 'shadow-purple-500/10'
              },
              {
                label: 'Collection Rate',
                value: `${collectionRate}%`,
                sub: 'Billed vs collected',
                icon: CheckCircle2,
                color: 'text-teal-600 dark:text-teal-400',
                bg: 'bg-teal-50 dark:bg-teal-900/20',
                border: 'border-teal-100 dark:border-teal-900/50',
                glow: 'shadow-teal-500/10'
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={i} 
                  className={cn(
                    "group relative p-5 rounded-3xl border flex flex-col bg-white dark:bg-slate-900 hover:-translate-y-1 transition-all duration-300 shadow-md",
                    stat.border, stat.glow,
                    "[&:nth-child(5)]:col-span-2 md:[&:nth-child(5)]:col-span-1"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                    <Icon size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">{stat.label}</span>
                  <div className="flex flex-col mt-auto">
                    <span className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">{stat.value}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{stat.sub}</span>
                  </div>
                  
                  {/* Subtle background glow effect on hover */}
                  <div className={cn("absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none blur-xl -z-10", stat.bg)} />
                </div>
              );
            })}
          </div>

          {/* Detailed Financial Analytics & Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* Left 2 Columns: Transactions Ledger */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Invoices and receipts history for selected duration</p>
                </div>

                {/* Sub filter: All / Receipts / Invoices */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {(['all', 'receipts', 'invoices'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setFinancialFilter(tab)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                        financialFilter === tab 
                          ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions List */}
              {isLoadingFinancial ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                  Loading financial transactions...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                    <Wallet size={20} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No transactions recorded</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No receipts or invoices found for the selected timeframe.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                          tx.type === 'receipt' 
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                        )}>
                          {tx.type === 'receipt' ? <DollarSign size={18} /> : <FileText size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              {tx.clientName}
                            </span>
                            {tx.businessName && (
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate max-w-[140px]">
                                ({tx.businessName})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                              {tx.refNo}
                            </span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {tx.paymentMethod && (
                              <>
                                <span className="text-[10px] text-slate-400">•</span>
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  {tx.paymentMethod}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-base text-slate-900 dark:text-white">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </p>
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1",
                          tx.status === 'Paid'
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                        )}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Payment Methods & Financial Health */}
            <div className="space-y-6">
              
              {/* Payment Methods Breakdown */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment Methods</h3>
                  <CreditCard size={18} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Revenue collected split by settlement channel</p>

                {paymentMethodStats.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No payment data available</p>
                ) : (
                  <div className="space-y-4">
                    {paymentMethodStats.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {item.name}
                          </span>
                          <span className="text-slate-900 dark:text-white">
                            ₹{item.total.toLocaleString('en-IN')} <span className="text-slate-400 font-normal">({item.pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(item.pct, 4)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial Health Summary Box */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xl shadow-blue-600/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Financial Summary</span>
                  <ArrowUpRight size={20} className="text-blue-200" />
                </div>
                <h4 className="text-xl font-bold mb-1">
                  ₹{totalRevenue.toLocaleString('en-IN')} Collected
                </h4>
                <p className="text-xs text-blue-100 mb-6">
                  {collectionRate >= 75 
                    ? 'Healthy collection velocity across all active accounts.'
                    : 'Monitor pending invoices to maintain target collection cadence.'}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-blue-500/40 text-xs">
                  <div>
                    <span className="text-blue-200 block text-[11px]">Realization Rate</span>
                    <span className="font-bold text-sm">{collectionRate}%</span>
                  </div>
                  <div>
                    <span className="text-blue-200 block text-[11px]">Pending Amount</span>
                    <span className="font-bold text-sm">₹{pendingReceivables.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </motion.div>
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
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Wizard Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {step === 9 ? 'Review & Confirm' : `Add Lead - Step ${step} of 8`}
                </h3>
                <button 
                  onClick={() => setIsWizardOpen(false)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-2"
                >
                  Cancel
                </button>
              </div>

              {/* Wizard Content */}
              <div className="p-6 flex-1 overflow-y-auto min-h-[300px] flex flex-col justify-center">
                {step === 1 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                      <User size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">What is the lead's name?</h4>
                    <input 
                      autoFocus
                      type="text" 
                      value={leadData.name}
                      onChange={e => setLeadData({...leadData, name: e.target.value})}
                      placeholder="First Lead Name"
                      className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 mb-4"
                      onKeyDown={e => e.key === 'Enter' && leadData.name && handleNextStep()}
                    />
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">What is their page or business name?</h4>
                    <input 
                      type="text" 
                      value={leadData.business_name}
                      onChange={e => setLeadData({...leadData, business_name: e.target.value})}
                      placeholder="Second Page/Business Name"
                      className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && leadData.name && handleNextStep()}
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
                      <Mail size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">What is their email address?</h4>
                    <input 
                      autoFocus
                      type="email" 
                      value={leadData.email}
                      onChange={e => setLeadData({...leadData, email: e.target.value})}
                      placeholder="e.g. john@example.com"
                      className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && leadData.email && handleNextStep()}
                    />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                      <Phone size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">What is their phone number?</h4>
                    <input 
                      autoFocus
                      type="tel" 
                      value={leadData.phone}
                      onChange={e => setLeadData({...leadData, phone: e.target.value})}
                      placeholder="e.g. +1 234 567 8900"
                      className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && leadData.phone && handleNextStep()}
                    />
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-full flex items-center justify-center mb-4">
                      <Briefcase size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">What is their niche/industry?</h4>
                    <input 
                      autoFocus
                      type="text" 
                      value={leadData.niche}
                      onChange={e => setLeadData({...leadData, niche: e.target.value})}
                      placeholder="e.g. E-commerce, Course Creator"
                      className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && leadData.niche && handleNextStep()}
                    />
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Social Media Link</h4>
                    <input 
                      autoFocus
                      type="url" 
                      value={leadData.social_media}
                      onChange={e => setLeadData({...leadData, social_media: e.target.value})}
                      placeholder="e.g. https://linkedin.com/in/..."
                      className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                    />
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                      <Phone size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">What is their WhatsApp number?</h4>
                    <input 
                      autoFocus
                      type="tel" 
                      value={leadData.whatsapp_number}
                      onChange={e => setLeadData({...leadData, whatsapp_number: e.target.value})}
                      placeholder="e.g. +1 234 567 8900"
                      className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                    />
                  </motion.div>
                )}

                {step === 7 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
                      <Briefcase size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">What service are they interested in?</h4>
                    <input 
                      autoFocus
                      type="text" 
                      value={leadData.service}
                      onChange={e => setLeadData({...leadData, service: e.target.value})}
                      placeholder="e.g. SEO, Web Dev"
                      className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                    />
                  </motion.div>
                )}

                {step === 8 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Any notes?</h4>
                    <textarea 
                      autoFocus
                      value={leadData.notes}
                      onChange={e => setLeadData({...leadData, notes: e.target.value})}
                      placeholder="Additional details..."
                      rows={3}
                      className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </motion.div>
                )}

                {step === 9 && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">Review Details</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Please confirm the lead information.</p>
                    </div>

                    <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {[
                        { label: 'Name', value: leadData.name, stepToEdit: 1 },
                        { label: 'Page/Business', value: leadData.business_name, stepToEdit: 1 },
                        { label: 'Email', value: leadData.email, stepToEdit: 2 },
                        { label: 'Phone', value: leadData.phone, stepToEdit: 3 },
                        { label: 'Niche', value: leadData.niche, stepToEdit: 4 },
                        { label: 'Social', value: leadData.social_media, stepToEdit: 5 },
                        { label: 'WhatsApp', value: leadData.whatsapp_number, stepToEdit: 6 },
                        { label: 'Service', value: leadData.service, stepToEdit: 7 },
                        { label: 'Notes', value: leadData.notes, stepToEdit: 8 },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 last:border-0 last:pb-0">
                          <div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">{item.label}</p>
                            <p className="font-medium text-slate-900 dark:text-white">{item.value || '-'}</p>
                          </div>
                          <button 
                            onClick={() => setStep(item.stepToEdit)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors"
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
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                {step > 1 && step < 9 && (
                  <button 
                    onClick={handlePrevStep}
                    className="px-6 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
