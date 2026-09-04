'use client';

import { useState, useEffect } from 'react';
import ContactCard from '@/components/ui/ContactCard';
import ContactDetailsModal from '@/components/ui/ContactDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

import { Contact } from '@/types';

export default function CRMPage() {
  const { role, user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  useEffect(() => {
    if (!user) return;
    fetchContacts(page > 0);
  }, [user, debouncedSearch, statusFilter, page, supabase]);

  const fetchContacts = async (isLoadMore = false) => {
    setLoading(true);
    let query = supabase
      .from('contacts')
      .select('*, receipts (id, line_items, created_at), invoices (id)')
      .order('created_at', { ascending: false });

    if (debouncedSearch) {
      query = query.or(`name.ilike.%${debouncedSearch}%,niche.ilike.%${debouncedSearch}%`);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const from = page * 50;
    const to = from + 49;
    const { data, error } = await query.range(from, to);

    if (!error && data) {
      if (isLoadMore) {
        setContacts(prev => {
          // Prevent duplicates on double-fetch
          const newIds = new Set(data.map(d => d.id));
          return [...prev.filter(p => !newIds.has(p.id)), ...(data as Contact[])];
        });
      } else {
        setContacts(data as Contact[]);
      }
      setHasMore(data.length === 50);
    }
    setLoading(false);
  };
  
  const filteredContacts = contacts; // Now handled by database

  const handleUpdateContact = async (updatedContact: Contact) => {
    const { error } = await supabase
      .from('contacts')
      .update({ 
        name: updatedContact.name, 
        email: updatedContact.email, 
        phone: updatedContact.phone, 
        whatsapp_number: updatedContact.whatsapp_number,
        niche: updatedContact.niche, 
        service: updatedContact.service,
        notes: updatedContact.notes,
        social_media: updatedContact.social_media,
        status: updatedContact.status
      })
      .eq('id', updatedContact.id);

    if (!error) {
      setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
      setSelectedContact(updatedContact);
    } else {
      toast.error('Failed to update contact');
    }
  };

  const handleDeleteContact = async (id: string) => {
    // Call the safe delete RPC to handle constraints and role checks
    const { error } = await supabase.rpc('delete_contact', { contact_id: id });
    
    if (!error) {
      setContacts(prev => prev.filter(c => c.id !== id));
      setSelectedContact(null);
    } else {
      console.error(error);
      toast.error('Failed to delete contact: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleTransfer = async (id: string) => {
    const { error } = await supabase
      .rpc('transfer_lead_to_client', { contact_id: id });
      
    if (!error) {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, type: 'client', status: 'won' } : c));
      toast.success('Successfully transferred to Internal CRM as a Client!');
    } else {
      console.error(error);
      toast.error('Failed to transfer contact: ' + (error.message || JSON.stringify(error)));
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All' },
    { id: 'new', label: 'New' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'won', label: 'Closed' },
    { id: 'lost', label: 'Lost' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-8 px-4 pb-24">
      {/* Header & Role Toggle */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM</h1>
          <p className="text-sm text-slate-500">Manage your network</p>
        </div>
      </header>

      {/* Search */}
      <div className="mb-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..." 
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-2">
        {statusTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors",
              statusFilter === tab.id 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="mb-6 bg-blue-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h2 className="text-blue-200 text-sm font-medium mb-1">Total {role === 'sales' ? 'Leads' : 'Clients'}</h2>
        <p className="text-3xl font-bold">{filteredContacts.length}</p>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto pb-4 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredContacts.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredContacts.map(contact => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <ContactCard 
                    {...contact} 
                    receiptsCount={contact.receipts?.length}
                    invoicesCount={contact.invoices?.length}
                    onCall={(id) => toast.success('Call initiated for ' + id)}
                    onInvoice={(id) => toast.success('Invoice initiated for ' + id)}
                    onTransfer={handleTransfer}
                    onClick={() => setSelectedContact(contact)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-100 border-dashed">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-900">No contacts found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search query.</p>
            </div>
          )}
          
          {hasMore && !loading && filteredContacts.length >= 50 && (
            <div className="flex justify-center pt-4 pb-8">
              <button 
                onClick={() => setPage(p => p + 1)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedContact && (
        <ContactDetailsModal 
          isOpen={!!selectedContact} 
          onClose={() => setSelectedContact(null)} 
          contact={selectedContact}
          onUpdate={handleUpdateContact}
          onDelete={handleDeleteContact}
        />
      )}
    </div>
  );
}
