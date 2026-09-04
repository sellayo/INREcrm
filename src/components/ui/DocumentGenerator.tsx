'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Save, FileText, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Contact, LineItem } from '@/types';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';

interface DocumentGeneratorProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onContactUpdate: (updatedContact: Contact) => void;
  initialDocType?: DocType;
}

type DocType = 'proposal' | 'invoice' | 'receipt';



export default function DocumentGenerator({ contact, isOpen, onClose, onContactUpdate, initialDocType = 'invoice' }: DocumentGeneratorProps) {
  const [docType, setDocType] = useState<DocType>(initialDocType);
  
  // New Form State
  const [receivedFrom, setReceivedFrom] = useState(contact.name);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', service: '', description: '', price: '' }
  ]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [receiptNo, setReceiptNo] = useState<number | null>(null);
  const [invoiceNo, setInvoiceNo] = useState<number | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchNextNumber = async (table: string, column: string, setter: (val: number) => void) => {
    const { data } = await supabase
      .from(table)
      .select(column)
      .order(column, { ascending: false })
      .limit(1);
    
    if (data && data.length > 0) {
      const record = data[0] as unknown as Record<string, number>;
      setter((record[column] || 100) + 1);
    } else {
      setter(101);
    }
  };

  useEffect(() => {
    if (docType === 'receipt') {
      fetchNextNumber('receipts', 'receipt_no', setReceiptNo);
    } else if (docType === 'invoice') {
      fetchNextNumber('invoices', 'invoice_no', setInvoiceNo);
    }
    
    // Pre-fill from latest document
    const fetchLatest = async () => {
      const table = docType === 'proposal' ? 'proposals' : 'invoices';
      const { data } = await supabase
        .from(table)
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (data && data.length > 0) {
        const prev = data[0];
        if (prev.address) setAddress(prev.address);
        if (prev.payment_method) setPaymentMethod(prev.payment_method);
        // We do not pre-fill transactionId as it's typically unique per payment
        if (prev.line_items && prev.line_items.length > 0) {
          setLineItems(prev.line_items);
        }
      }
    };
    
    if (isOpen) {
      fetchLatest();
      // Avoid calling setState synchronously in effect if not needed, but here it is needed to sync props
      // We wrap it in setTimeout to avoid the React warning
      setTimeout(() => setReceivedFrom(contact.name), 0);
    }
  }, [docType, contact.id, contact.name, isOpen, supabase]);

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Math.random().toString(), service: '', description: '', price: '' }]);
  };

  const removeLineItem = (id?: string) => {
    if (!id || lineItems.length <= 1) return;
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string | undefined, field: keyof LineItem, value: string) => {
    if (!id) return;
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!printRef.current) return;
    
    // The Bulletproof Fix: Detach all stylesheets to prevent html2canvas lab() crash
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    const stashed: { el: Element; parent: ParentNode | null; nextSibling: ChildNode | null }[] = [];
    
    styles.forEach(s => {
      stashed.push({ el: s, parent: s.parentNode, nextSibling: s.nextSibling });
      s.remove();
    });

    const opt = {
      margin:       0.5,
      filename:     `${docType}_${contact.name.replace(/ /g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };

    try {
      await html2pdf().set(opt).from(printRef.current).save();
    } finally {
      // Instantly restore stylesheets so the UI doesn't break
      stashed.forEach(s => {
        if (s.parent) {
          if (s.nextSibling) {
            s.parent.insertBefore(s.el, s.nextSibling);
          } else {
            s.parent.appendChild(s.el);
          }
        }
      });
    }
  };

  const handleSaveToCRM = async () => {
    setIsSaving(true);
    
    try {
      const totalAmount = calculateTotal();
      let table = '';
      const data: Record<string, unknown> = {
        contact_id: contact.id,
        amount: totalAmount,
      };

      if (docType === 'proposal') {
        table = 'proposals';
        // Mock mapping for old description field
        data.scope_of_work = lineItems.map(i => `${i.service}: ${i.description}`).join('\n');
      } else if (docType === 'invoice') {
        table = 'invoices';
        data.address = address;
        data.payment_method = paymentMethod;
        data.transaction_id = transactionId;
        data.line_items = lineItems;
      } else if (docType === 'receipt') {
        table = 'receipts';
        data.address = address;
        data.payment_method = paymentMethod;
        data.transaction_id = transactionId;
        data.line_items = lineItems;
      }

      const { error } = await supabase.from(table).insert([data]);
      if (error) throw error;

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error: unknown) {
      console.error("Save Error:", JSON.stringify(error, null, 2), error);
      const err = error as { message?: string, details?: string };
      toast.error('Failed to save document to CRM. ' + (err.message || err.details || JSON.stringify(error)));
    } finally {
      setIsSaving(false);
    }
  };

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalAmount = calculateTotal();
  const isValidToSave = totalAmount > 0 && lineItems.some(i => i.service.trim() !== '');

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-100 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]"
      >
        {/* Editor Sidebar */}
        <div className="w-full md:w-2/5 bg-white border-r border-slate-200 flex flex-col h-full">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 capitalize">
              <FileText size={20} className="text-blue-600" /> {docType} Builder
            </h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Received From</label>
                <input 
                  type="text" 
                  value={receivedFrom}
                  onChange={e => setReceivedFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Client Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street, City, Zip"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {docType === 'receipt' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Payment Method</label>
                    <input 
                      type="text" 
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      placeholder="e.g. UPI via Google Pay"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Transaction ID</label>
                    <input 
                      type="text" 
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      placeholder="e.g. 620563402"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Line Items</label>
                <button onClick={addLineItem} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700">
                  <Plus size={14} /> Add Item
                </button>
              </div>
              
              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                    <button 
                      onClick={() => removeLineItem(item.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="col-span-2">
                        <input 
                          type="text" 
                          placeholder="Service Name"
                          value={item.service}
                          onChange={e => updateLineItem(item.id, 'service', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                        />
                      </div>
                      <div className="col-span-1">
                        <input 
                          type="number" 
                          placeholder="Price (₹)"
                          value={item.price}
                          onChange={e => updateLineItem(item.id, 'price', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <textarea 
                      placeholder="Bullet point description (e.g. • 4 videos translated)"
                      value={item.description}
                      onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between items-center px-2">
                <span className="font-semibold text-slate-500">Total</span>
                <span className="font-bold text-xl text-blue-600">₹{totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col gap-3 shrink-0">
            <button 
              onClick={handleDownload}
              disabled={!isValidToSave}
              className={cn(
                "w-full py-3 rounded-xl font-semibold shadow-sm transition-colors flex items-center justify-center gap-2",
                isValidToSave ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              <Download size={18} /> Download PDF
            </button>
            <button 
              onClick={handleSaveToCRM}
              disabled={isSaving || isSaved || !isValidToSave}
              className={cn(
                "w-full py-3 rounded-xl font-semibold shadow-sm transition-colors flex items-center justify-center gap-2",
                isSaved ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
              )}
            >
              {isSaved ? <><CheckCircle size={18} /> Saved to CRM</> : isSaving ? 'Saving...' : <><Save size={18} /> Save to CRM</>}
            </button>
          </div>
        </div>

        {/* PDF Preview Pane */}
        <div className="flex-1 bg-slate-200 p-4 md:p-8 overflow-auto">
          <div className="min-w-[700px] flex items-start justify-center">
            <div 
              ref={printRef}
            style={{ 
              width: '100%', 
              maxWidth: '800px', 
              padding: '40px', 
              margin: '0 auto',
              fontFamily: 'Arial, sans-serif', 
              backgroundColor: '#ffffff', 
              color: '#0f172a',
              boxSizing: 'border-box'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '16px', marginBottom: '24px', borderBottom: '1.5px solid #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/sellayo-logo.png" alt="Sellayo Logo" style={{ height: '56px' }} />
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', margin: 0, padding: 0 }}>
                    SELLAYO PRIVATE LIMITED
                  </h1>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sell To Anyone, Anywhere, Automatically
                  </p>
                </div>
              </div>
              <h2 style={{ fontSize: '30px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1e3a8a', margin: 0, padding: 0 }}>
                {docType}
              </h2>
            </div>

            {/* Meta Grid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', fontSize: '13px', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', width: '144px' }}>RECEIVED FROM:</span>
                  <span>{receivedFrom}</span>
                </div>
                {address && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', width: '144px' }}>ADDRESS:</span>
                    <span>{address}</span>
                  </div>
                )}
                {paymentMethod && docType === 'receipt' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <span style={{ fontWeight: 'bold', width: '144px' }}>PAYMENT METHOD:</span>
                    <span>{paymentMethod}</span>
                  </div>
                )}
                {transactionId && docType === 'receipt' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', width: '144px' }}>TRANSACTION ID:</span>
                    <span>{transactionId}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{docType} NO:</span>
                  <span>{docType === 'receipt' ? receiptNo : invoiceNo || '---'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <span>{today}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ marginBottom: '32px' }}>
              {/* Header Row */}
              <div style={{ display: 'flex', padding: '8px 16px', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>
                <div style={{ width: '48px' }}>NO</div>
                <div style={{ flex: 1 }}>DESCRIPTION</div>
                <div style={{ width: '128px', textAlign: 'right' }}>AMOUNT(₹)</div>
              </div>
              
              {/* Items */}
              <div style={{ minHeight: '100px' }}>
                {lineItems.map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', padding: '16px', fontSize: '14px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '48px', color: '#64748b' }}>{i + 1}</div>
                    <div style={{ flex: 1, paddingRight: '16px' }}>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>{item.service || '---'}</div>
                      {item.description && (
                        <div style={{ color: '#475569', marginTop: '4px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div style={{ width: '128px', textAlign: 'right', fontWeight: 500 }}>{item.price || '0'}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '2px solid #cbd5e1' }}>
                <div style={{ width: '256px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #cbd5e1' }}>
                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px' }}>TOTAL PAID :</span>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>₹{totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signatures / Footer */}
            <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', lineHeight: '1.5' }}>
              <div>
                <div style={{ width: '192px', marginBottom: '16px', borderTop: '1px solid #cbd5e1' }}></div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', width: '96px' }}>RECEIVED BY :</span>
                  <span>Sellayo Private Limited</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', width: '96px' }}>ADDRESS:</span>
                  <span>
                    Sellayo Private Limited<br/>
                    Suite No. 376 B<br/>
                    Basement Floor, Pallath Square,<br/>
                    FACT Kalamassery Rd,<br/>
                    Kalamassery P.O.,<br/>
                    Ernakulam - 683104
                  </span>
                </div>
                <div style={{ width: '256px', marginTop: '32px', borderTop: '1px solid #cbd5e1' }}></div>
              </div>
            </div>

            {/* Very Bottom Footer */}
            <div style={{ marginTop: '96px', paddingTop: '16px', textAlign: 'center', borderTop: '2px solid #cbd5e1' }}>
              <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '16px' }}>Thank you for your business with us!</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  contact@sellayo.com
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  +91 97787 02277
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
                  www.sellayo.com
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
