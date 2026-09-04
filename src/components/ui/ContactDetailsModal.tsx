'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, X, User, Mail, Phone, Briefcase, Link, Trash2, Edit2, Check, ChevronDown, FileText } from 'lucide-react';
import { Contact } from '@/types';
import { cn } from '@/lib/utils';
import DocumentGenerator from './DocumentGenerator';

interface ContactDetailsModalProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (contact: Contact) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ContactDetailsModal({ contact, isOpen, onClose, onUpdate, onDelete }: ContactDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Contact>(contact);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDocGen, setShowDocGen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'services'>('details');

  if (!isOpen) return null;

  const handleCopy = (text: string | undefined) => {
    if (text) navigator.clipboard.writeText(text);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(editData);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this contact? This cannot be undone.')) {
      setIsDeleting(true);
      await onDelete(contact.id);
      setIsDeleting(false);
      onClose();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const updated = { ...contact, status: newStatus };
    setEditData(updated);
    await onUpdate(updated);
    setShowStatusDropdown(false);
  };

  const statusOptions = ['new', 'contacted', 'qualified', 'won', 'lost'];
  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-purple-100 text-purple-700',
    qualified: 'bg-amber-100 text-amber-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="font-bold text-lg text-slate-900">
            {isEditing ? 'Edit Contact' : 'Contact Details'}
          </h3>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Edit2 size={16} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <User size={32} />
            </div>
            <div className="flex-1 relative">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editData.name}
                  onChange={e => setEditData({...editData, name: e.target.value})}
                  className="w-full text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <h2 className="text-xl font-bold text-slate-900 truncate pr-2">{contact.name}</h2>
              )}
              
              <div className="mt-2 flex gap-2">
                <span className={cn("text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider", contact.type === 'client' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600')}>
                  {contact.type}
                </span>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors hover:brightness-95",
                      statusColors[contact.status || 'new']
                    )}
                  >
                    {contact.status || 'new'} <ChevronDown size={12} />
                  </button>
                  
                  {showStatusDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10">
                      {statusOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleStatusChange(opt)}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors",
                            contact.status === opt ? "text-blue-600 bg-blue-50" : "text-slate-600"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex border-b border-slate-200 mb-4 mx-2">
            <button
              onClick={() => setActiveTab('details')}
              className={cn(
                "pb-2 px-4 text-sm font-semibold transition-colors border-b-2 flex-1",
                activeTab === 'details' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              Contact Details
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={cn(
                "pb-2 px-4 text-sm font-semibold transition-colors border-b-2 flex-1",
                activeTab === 'services' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              Services
            </button>
          </div>

          {activeTab === 'details' ? (
            <div className="space-y-3">
              {[
                { icon: Briefcase, label: 'Business Name', key: 'business_name', value: isEditing ? editData.business_name : contact.business_name },
                { icon: Mail, label: 'Email', key: 'email', value: isEditing ? editData.email : contact.email },
                { icon: Phone, label: 'Phone', key: 'phone', value: isEditing ? editData.phone : contact.phone },
                { icon: Phone, label: 'WhatsApp', key: 'whatsapp_number', value: isEditing ? editData.whatsapp_number : contact.whatsapp_number },
                { icon: Briefcase, label: 'Niche', key: 'niche', value: isEditing ? editData.niche : contact.niche },
                { icon: Briefcase, label: 'Service', key: 'service', value: isEditing ? editData.service : contact.service },
                { icon: Link, label: 'Social', key: 'social_media', value: isEditing ? editData.social_media : contact.social_media },
                { icon: FileText, label: 'Notes', key: 'notes', value: isEditing ? editData.notes : contact.notes }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="text-slate-400 shrink-0">
                      <item.icon size={18} />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
                      {isEditing ? (
                        item.key === 'notes' ? (
                          <textarea 
                            value={item.value || ''}
                            onChange={e => setEditData({...editData, [item.key]: e.target.value})}
                            className="w-full text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 mt-0.5 focus:ring-1 focus:ring-blue-500 outline-none resize-y min-h-[60px]"
                          />
                        ) : (
                          <input 
                            type={item.key === 'email' ? 'email' : item.key === 'phone' || item.key === 'whatsapp_number' ? 'tel' : 'text'}
                            value={item.value || ''}
                            onChange={e => setEditData({...editData, [item.key]: e.target.value})}
                            className="w-full text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 mt-0.5 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        )
                      ) : (
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {item.value || <span className="text-slate-400 italic font-normal">Not provided</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  {!isEditing && item.value && (
                    <button 
                      onClick={() => handleCopy(item.value as string)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0 ml-2"
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {contact.receipts && contact.receipts.length > 0 ? (
                contact.receipts.flatMap(receipt => 
                  (receipt.line_items || []).map((item: { id?: string; service?: string; price?: string; description?: string }) => (
                    <div key={`${receipt.id}-${item.id || Math.random()}`} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-slate-900">{item.service || 'Unnamed Service'}</h4>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full shrink-0">
                          ₹{item.price || '0'}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{item.description}</p>
                      )}
                      <div className="mt-2 text-[10px] text-slate-400 font-medium">
                        Purchased on {new Date(receipt.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-sm text-slate-500 font-medium">No services purchased yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2 shrink-0">
          {isEditing ? (
            <>
              <button 
                onClick={() => { setIsEditing(false); setEditData(contact); }}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? 'Saving...' : <><Check size={18} /> Save</>}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                title="Delete Contact"
              >
                <Trash2 size={18} /> Delete Contact
              </button>
            </>
          )}
        </div>
      </motion.div>

      {showDocGen && (
        <DocumentGenerator
          contact={contact}
          isOpen={showDocGen}
          onClose={() => setShowDocGen(false)}
          onContactUpdate={async (updated) => {
            // DocumentGenerator handles the db update, so we just update local state
            await onUpdate(updated);
          }}
        />
      )}
    </div>
  );
}
