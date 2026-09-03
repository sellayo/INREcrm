'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, FileSignature } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Contact } from '../crm/page';
import { cn } from '@/lib/utils';
import DocumentGenerator from '@/components/ui/DocumentGenerator';

type DocType = 'proposal' | 'invoice' | 'receipt';

export default function DocumentsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocType, setSelectedDocType] = useState<DocType>('invoice');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchContacts();
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
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Documents</h1>
        <p className="text-slate-500 font-medium text-sm">Select a document type and a client to generate.</p>
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
                  ? "border-blue-600 bg-blue-50 shadow-sm" 
                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
              )}>
                <Icon size={24} />
              </div>
              <div>
                <h3 className={cn("text-lg font-bold capitalize", isActive ? "text-blue-900" : "text-slate-900")}>
                  {item.label}
                </h3>
                <p className="text-sm font-medium text-slate-500">{item.desc}</p>
              </div>
              
              {/* Active Indicator Ring */}
              {isActive && (
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
              )}
            </button>
          )
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-slate-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search to generate ${selectedDocType}...`}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-4 text-base font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
        />
      </div>

      {/* Contact List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No contacts found matching "{search}"
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredContacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
              >
                <div>
                  <h4 className="text-base font-bold text-slate-900">{contact.name}</h4>
                  <p className="text-sm text-slate-500">{contact.niche}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider",
                    contact.type === 'client' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {contact.type}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
