'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tag, 
  History as HistoryIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  Briefcase, 
  DollarSign, 
  Layers,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PricingService } from '@/types';
import { DEFAULT_SERVICES, loadPricingCatalog, savePricingCatalog } from '@/lib/pricingData';
import PriceCalculator from '@/components/ui/PriceCalculator';
import ClientHistoryView from '@/components/ui/ClientHistoryView';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ServicesContent() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'history' ? 'history' : 'pricing';

  const [activeTab, setActiveTab] = useState<'pricing' | 'history'>(initialTab);
  const [services, setServices] = useState<PricingService[]>(DEFAULT_SERVICES);
  const [isLoading, setIsLoading] = useState(true);

  // Admin Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<PricingService | null>(null);

  // New Service Form State
  const [newService, setNewService] = useState<Partial<PricingService>>({
    name: '',
    category: 'Market Expansion',
    billingType: 'one-time',
    basePrice: 5000,
    scopeDescription: ''
  });

  // Load catalog on mount
  useEffect(() => {
    loadPricingCatalog().then(data => {
      setServices(data);
      setIsLoading(false);
    });
  }, []);

  // Handle Save New Service
  const handleAddService = async () => {
    if (!newService.name || !newService.basePrice) {
      toast.error('Please enter service name and base price');
      return;
    }

    const created: PricingService = {
      id: `custom-${Date.now()}`,
      name: newService.name,
      category: newService.category || 'Custom',
      billingType: newService.billingType || 'one-time',
      basePrice: Number(newService.basePrice) || 0,
      scopeDescription: newService.scopeDescription || 'Custom service package',
      isCustom: true
    };

    const updated = [...services, created];
    setServices(updated);
    await savePricingCatalog(updated);
    toast.success(`Service "${created.name}" added to catalog!`);
    setIsAddModalOpen(false);
    setNewService({
      name: '',
      category: 'Market Expansion',
      billingType: 'one-time',
      basePrice: 5000,
      scopeDescription: ''
    });
  };

  // Handle Update Service
  const handleUpdateService = async () => {
    if (!editingService) return;
    const updated = services.map(s => s.id === editingService.id ? editingService : s);
    setServices(updated);
    await savePricingCatalog(updated);
    toast.success(`Pricing for "${editingService.name}" updated!`);
    setEditingService(null);
  };

  // Handle Delete Custom Service
  const handleDeleteService = async (serviceId: string) => {
    const updated = services.filter(s => s.id !== serviceId);
    setServices(updated);
    await savePricingCatalog(updated);
    toast.success('Service removed from catalog');
  };

  // Reset to default pricing
  const handleResetDefaults = async () => {
    if (confirm('Reset all services and packages back to original default rates?')) {
      setServices(DEFAULT_SERVICES);
      await savePricingCatalog(DEFAULT_SERVICES);
      toast.success('Pricing restored to default rates');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-8">
      {/* Page Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {role === 'sales' ? 'Services & Rate Card' : 'Services & Operations Hub'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {role === 'sales'
              ? 'Interactive price calculator, package builder, and official rate card'
              : (activeTab === 'pricing' 
                ? 'Rate card, live price calculator and catalog management'
                : 'Complete client transaction records and timeline')}
          </p>
        </div>

        {/* Top Tab Switcher (For Admin & Internal Managers) */}
        {(role === 'admin' || role === 'internal') && (
          <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl w-fit border border-slate-300/50 dark:border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('pricing')}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                activeTab === 'pricing'
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Tag size={17} />
              <span>Pricing & Packages</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                activeTab === 'history'
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <HistoryIcon size={17} />
              <span>Client History</span>
            </button>
          </div>
        )}
      </header>

      {/* TAB 1: PRICING & PACKAGES */}
      {activeTab === 'pricing' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          {/* 1. Interactive Price Calculator */}
          <PriceCalculator services={services} />

          {/* 2. Rate Card & Admin Service Management */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Official Rate Card & Catalog
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {services.length} Services
                  </span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Standard scope, billing models, and base pricing
                </p>
              </div>

              {/* Admin Actions: Add New Service / Reset */}
              {role === 'admin' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    <Plus size={16} />
                    <span>Add New Service</span>
                  </button>
                  <button
                    onClick={handleResetDefaults}
                    title="Reset to default rate card"
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-900/60 transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                        {srv.category}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 capitalize">
                        {srv.billingType.replace('-', ' ')}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1.5">
                      {srv.name}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                      {srv.scopeDescription}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Base Rate</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        ₹{srv.basePrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Admin Edit / Delete Actions */}
                    {role === 'admin' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingService(srv)}
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm"
                          title="Edit Service Price"
                        >
                          <Edit2 size={14} />
                        </button>
                        {srv.isCustom && (
                          <button
                            onClick={() => handleDeleteService(srv.id)}
                            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors shadow-sm"
                            title="Remove Service"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: CLIENT HISTORY */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ClientHistoryView />
        </motion.div>
      )}

      {/* MODAL: ADD NEW SERVICE (Admin Only) */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Service</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Service Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. YouTube Growth Package"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Category
                    </label>
                    <select
                      value={newService.category}
                      onChange={(e) => setNewService({ ...newService, category: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Market Expansion">Market Expansion</option>
                      <option value="Video Translation">Video Translation</option>
                      <option value="Automation & AI">Automation & AI</option>
                      <option value="Content & Social">Content & Social</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Billing Type
                    </label>
                    <select
                      value={newService.billingType}
                      onChange={(e) => setNewService({ ...newService, billingType: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="one-time">One-time</option>
                      <option value="per-video">Per Video</option>
                      <option value="per-month">Per Month (Retainer)</option>
                      <option value="tiered">Tiered Package</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 15000"
                    value={newService.basePrice}
                    onChange={(e) => setNewService({ ...newService, basePrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Scope & Deliverables Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Detailed explanation of what is included in this service..."
                    value={newService.scopeDescription}
                    onChange={(e) => setNewService({ ...newService, scopeDescription: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-5 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20"
                >
                  Save Service
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT SERVICE (Admin Only) */}
      <AnimatePresence>
        {editingService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Service Pricing</h3>
                  <p className="text-xs text-slate-400">{editingService.name}</p>
                </div>
                <button
                  onClick={() => setEditingService(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingService.basePrice}
                    onChange={(e) => setEditingService({ ...editingService, basePrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Scope Description
                  </label>
                  <textarea
                    rows={3}
                    value={editingService.scopeDescription}
                    onChange={(e) => setEditingService({ ...editingService, scopeDescription: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-5 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateService}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20"
                >
                  Update Pricing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 flex items-center justify-center text-slate-400">Loading services...</div>}>
      <ServicesContent />
    </Suspense>
  );
}

