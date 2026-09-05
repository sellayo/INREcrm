'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { Contact } from '@/types';
import { Search, History as HistoryIcon, FileText, CheckCircle, Clock, DollarSign, Briefcase, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const { role, user, isAuthenticated, status } = useAuth();
  const [clients, setClients] = useState<Contact[]>([]);
  const [filteredClients, setFilteredClients] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Contact | null>(null);
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  const supabase = createClient();

  // Redirect or show access denied if not internal/admin
  if (isAuthenticated && status === 'approved' && role !== 'admin' && role !== 'internal') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <HistoryIcon size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 max-w-md">You do not have permission to view client history. This area is restricted to internal managers and administrators.</p>
      </div>
    );
  }

  // Fetch all clients
  useEffect(() => {
    if (!user || (role !== 'admin' && role !== 'internal')) return;

    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('type', 'client')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setClients(data || []);
        setFilteredClients(data || []);
      } catch (error: any) {
        toast.error('Failed to load clients');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [user, role, supabase]);

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = clients.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      (c.business_name && c.business_name.toLowerCase().includes(lowerQuery)) ||
      (c.phone && c.phone.includes(lowerQuery))
    );
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  // Fetch selected client details
  useEffect(() => {
    if (!selectedClient) {
      setInvoices([]);
      setReceipts([]);
      return;
    }

    const fetchClientDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const [invRes, recRes] = await Promise.all([
          supabase.from('invoices').select('*').eq('contact_id', selectedClient.id).order('created_at', { ascending: false }),
          supabase.from('receipts').select('*').eq('contact_id', selectedClient.id).order('created_at', { ascending: false })
        ]);

        if (invRes.error) throw invRes.error;
        if (recRes.error) throw recRes.error;

        setInvoices(invRes.data || []);
        setReceipts(recRes.data || []);
      } catch (error: any) {
        toast.error('Failed to load client history');
        console.error(error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchClientDetails();
  }, [selectedClient, supabase]);

  // Calculate Aggregates
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const totalReceiptAmount = receipts.reduce((sum, rec) => sum + (Number(rec.amount) || 0), 0);
  
  // Combine and sort timeline events
  const timelineEvents = [...invoices.map(i => ({...i, type: 'invoice'})), ...receipts.map(r => ({...r, type: 'receipt'}))]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Extract unique services
  const servicesSet = new Set<string>();
  timelineEvents.forEach(event => {
    if (event.line_items && Array.isArray(event.line_items)) {
      event.line_items.forEach((item: any) => {
        if (item.service) servicesSet.add(item.service);
      });
    }
  });
  const uniqueServices = Array.from(servicesSet);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col md:flex-row gap-6">
      
      {/* Left Sidebar - Client List */}
      <div className={cn(
        "w-full md:w-1/3 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[calc(100vh-8rem)]",
        selectedClient ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Client Directory
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center p-8 text-slate-500 text-sm">No clients found.</div>
          ) : (
            <div className="space-y-1">
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all duration-200",
                    selectedClient?.id === client.id 
                      ? "bg-blue-50 border border-blue-100 shadow-sm" 
                      : "hover:bg-slate-50 border border-transparent"
                  )}
                >
                  <div className="font-semibold text-slate-900 truncate">{client.name}</div>
                  {client.business_name && (
                    <div className="text-xs text-blue-600 font-medium truncate mt-0.5">{client.business_name}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Content - Client Details */}
      <div className={cn(
        "w-full md:w-2/3 flex flex-col h-[calc(100vh-8rem)]",
        !selectedClient ? "hidden md:flex" : "flex"
      )}>
        {!selectedClient ? (
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <HistoryIcon size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Client</h3>
            <p className="text-slate-500 max-w-sm">Choose a client from the directory to view their complete purchase history, timeline, and service details.</p>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-900 to-blue-700 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              
              <button 
                onClick={() => setSelectedClient(null)}
                className="md:hidden mb-4 text-blue-100 hover:text-white text-sm flex items-center gap-1 font-medium z-10 relative"
              >
                &larr; Back to Directory
              </button>
              
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                  {selectedClient.business_name && <p className="text-blue-100 mt-1 flex items-center gap-2"><Briefcase size={16} /> {selectedClient.business_name}</p>}
                </div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/30 capitalize">
                  {selectedClient.status}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDetails ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <div className="space-y-8">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col">
                      <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <CheckCircle size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Received</span>
                      </div>
                      <span className="text-3xl font-extrabold text-emerald-700">${totalReceiptAmount.toFixed(2)}</span>
                      <span className="text-xs text-emerald-600/70 mt-1">{receipts.length} Receipts Issued</span>
                    </div>
                    
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col">
                      <div className="flex items-center gap-2 text-indigo-600 mb-2">
                        <FileText size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Invoiced</span>
                      </div>
                      <span className="text-3xl font-extrabold text-indigo-700">${totalInvoiceAmount.toFixed(2)}</span>
                      <span className="text-xs text-indigo-600/70 mt-1">{invoices.length} Invoices Sent</span>
                    </div>
                  </div>

                  {/* Services Provided */}
                  {uniqueServices.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Briefcase size={16} className="text-blue-600" />
                        Services Rendered
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {uniqueServices.map((srv, idx) => (
                          <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Document Timeline */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Clock size={16} className="text-blue-600" />
                      Document History
                    </h3>
                    
                    {timelineEvents.length === 0 ? (
                      <p className="text-slate-500 text-sm bg-slate-50 p-4 rounded-xl text-center">No invoices or receipts found for this client.</p>
                    ) : (
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:to-transparent">
                        {timelineEvents.map((event, idx) => (
                          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            
                            {/* Icon */}
                            <div className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10",
                              event.type === 'receipt' ? "bg-emerald-500 text-white" : "bg-indigo-500 text-white"
                            )}>
                              {event.type === 'receipt' ? <CheckCircle size={16} /> : <FileText size={16} />}
                            </div>

                            {/* Card */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                  "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                                  event.type === 'receipt' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                                )}>
                                  {event.type}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                  {new Date(event.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-lg font-extrabold text-slate-900">
                                ${event.amount}
                              </div>
                              <div className="text-xs text-slate-500 mt-1 font-mono">
                                #{event.type === 'receipt' ? event.receipt_no : event.invoice_no}
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
