'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, FileSignature, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Contact } from '@/types';
import { cn } from '@/lib/utils';
import DocumentGenerator from '@/components/ui/DocumentGenerator';

type DocType = 'proposal' | 'invoice' | 'receipt';

interface CachedQuote {
  service: string;
  price: string;
  description: string;
}

export default function DocumentsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocType, setSelectedDocType] = useState<DocType>('invoice');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeQuote, setActiveQuote] = useState<CachedQuote | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchContacts();
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('inrecrm_calculated_quote');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.service && parsed?.price) {
            setActiveQuote(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.niche && c.niche.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Documents</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Select a document type and a client to generate.</p>
      </header>

      {/* Document Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { type: 'invoice', label: 'Invoice', desc: 'Request for payment', icon: FileText },
          { type: 'receipt', label: 'Receipt', desc: 'Proof of payment', icon: CheckCircle }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = selectedDocType === item.type;
          
          return (
            <button
              key={item.type}
              onClick={() => setSelectedDocType(item.type as DocType)}
              className={cn(
                "p-6 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-3 group relative overflow-hidden",
                isActive 
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-sm" 
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                isActive ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400"
              )}>
                <Icon size={24} />
              </div>
              <div>
                <h3 className={cn("text-lg font-bold capitalize", isActive ? "text-blue-900 dark:text-blue-300" : "text-slate-900 dark:text-white")}>
                  {item.label}
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
              
              {/* Active Indicator Ring */}
              {isActive && (
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
              )}
            </button>
          )
        })}
      </div>

      {/* Calculated Quote Notice Banner */}
      {activeQuote && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                Calculated Quote Ready: {activeQuote.service} (₹{Number(activeQuote.price).toLocaleString('en-IN')})
              </span>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                Select any client below, then click &quot;Paste Calculated Price&quot; inside the document builder to apply.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('inrecrm_calculated_quote');
              setActiveQuote(null);
            }}
            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold shrink-0"
          >
            Clear
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-slate-400 dark:text-slate-500" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search to generate ${selectedDocType}...`}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-4 text-base font-medium dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
        />
      </div>

      {/* Contact List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
            No contacts found matching "{search}"
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredContacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
              >
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{contact.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{contact.niche}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider",
                    contact.type === 'client' ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400" : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400"
                  )}>
                    {contact.type}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FileText size={18} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Document Generator Modal */}
      {selectedContact && (
        <DocumentGenerator
          contact={selectedContact}
          isOpen={true}
          initialDocType={selectedDocType}
          onClose={() => setSelectedContact(null)}
          onContactUpdate={(updated) => {
            setContacts(contacts.map(c => c.id === updated.id ? updated : c));
          }}
        />
      )}
    </div>
  );
}
