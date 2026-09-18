'use client';

import { useState, useMemo } from 'react';
import { PricingService, CalculationOptions } from '@/types';
import { calculatePrice } from '@/lib/pricingData';
import { 
  Calculator, 
  Copy, 
  Check, 
  Sparkles, 
  Tag, 
  FileText, 
  Plus, 
  Minus, 
  Clock, 
  Globe, 
  Languages, 
  Layers, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface PriceCalculatorProps {
  services: PricingService[];
  className?: string;
  onSelectQuote?: (result: { service: string; amount: number; description: string }) => void;
}

export default function PriceCalculator({ services, className, onSelectQuote }: PriceCalculatorProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || 'video-translation');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-20');
  const [quantity, setQuantity] = useState<number>(20);
  const [additionalLanguages, setAdditionalLanguages] = useState<number>(0);
  const [extraDurationBlocks, setExtraDurationBlocks] = useState<number>(0);
  const [captionType, setCaptionType] = useState<'none' | 'easy-medium' | 'complex'>('none');
  const [additionalPlatforms, setAdditionalPlatforms] = useState<number>(0);
  const [months, setMonths] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const currentService = useMemo(() => {
    return services.find(s => s.id === selectedServiceId) || services[0];
  }, [services, selectedServiceId]);

  // Sync state when service changes
  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const s = services.find(srv => srv.id === serviceId);
    if (s?.id === 'video-translation') {
      setSelectedPackageId('pkg-20');
      setQuantity(20);
    } else if (s?.billingType === 'per-month') {
      setMonths(1);
      setQuantity(1);
    } else {
      setQuantity(1);
      setSelectedPackageId('');
    }
    setAdditionalLanguages(0);
    setExtraDurationBlocks(0);
    setCaptionType('none');
    setAdditionalPlatforms(0);
  };

  // Select a preset package for Video Translation
  const handlePackageSelect = (pkgId: string, qty: number) => {
    setSelectedPackageId(pkgId);
    setQuantity(qty);
  };

  // Perform calculation
  const calculation = useMemo(() => {
    if (!currentService) return null;
    const options: CalculationOptions = {
      serviceId: currentService.id,
      quantity,
      packageId: selectedPackageId,
      additionalLanguages,
      extraDurationBlocks,
      captionType,
      additionalPlatforms,
      months
    };
    return calculatePrice(currentService, options);
  }, [
    currentService, 
    quantity, 
    selectedPackageId, 
    additionalLanguages, 
    extraDurationBlocks, 
    captionType, 
    additionalPlatforms, 
    months
  ]);

  const handleCopyQuote = () => {
    if (!calculation) return;
    const quoteText = `Service Quote:\n${calculation.shortDescription}\n\nPrice Breakdown:\n${calculation.breakdown.map(b => `• ${b.label}: ₹${b.amount.toLocaleString('en-IN')}`).join('\n')}\n\nTotal: ₹${calculation.totalPrice.toLocaleString('en-IN')}`;
    navigator.clipboard.writeText(quoteText);
    setCopied(true);
    toast.success('Quote & description copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
    if (onSelectQuote) {
      onSelectQuote({
        service: calculation.serviceName,
        amount: calculation.totalPrice,
        description: calculation.shortDescription
      });
    }
  };

  const handleCreateDocument = () => {
    if (!calculation) return;
    const quoteData = {
      service: calculation.serviceName,
      price: calculation.totalPrice.toString(),
      description: calculation.shortDescription,
      timestamp: Date.now()
    };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('inrecrm_calculated_quote', JSON.stringify(quoteData));
    }
    const quoteText = `Service Quote:\n${calculation.shortDescription}\n\nTotal: ₹${calculation.totalPrice.toLocaleString('en-IN')}`;
    navigator.clipboard.writeText(quoteText).catch(() => {});
    toast.success('Quote copied! Ready to paste on document.');
  };

  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-md relative overflow-hidden", className)}>
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Calculator size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Price & Package Calculator
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                Live
              </span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Configure services, tiered bulk discounts, duration and add-ons for instant proposals
            </p>
          </div>
        </div>

        {/* Service Category / Selector */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedServiceId}
            onChange={(e) => handleServiceChange(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Live Quote on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Service Scope Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-start gap-2.5">
              <Sparkles size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">{currentService?.name}</h4>
                <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-0.5">{currentService?.scopeDescription}</p>
              </div>
            </div>
          </div>

          {/* 1. Video Translation Specific Tiered Packages */}
          {currentService?.id === 'video-translation' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Select Video Package / Tier
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {currentService.packages?.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handlePackageSelect(pkg.id, pkg.quantity)}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all duration-200 relative group flex flex-col justify-between",
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-blue-400"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={cn("text-xs font-bold", isSelected ? "text-white" : "text-slate-900 dark:text-white")}>
                          {pkg.quantity} Video{pkg.quantity > 1 ? 's' : ''}
                        </span>
                        {pkg.discountPct > 0 && (
                          <span className={cn(
                            "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md",
                            isSelected ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                          )}>
                            {pkg.discountPct}% OFF
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <p className={cn("text-sm font-black", isSelected ? "text-white" : "text-blue-600 dark:text-blue-400")}>
                          ₹{pkg.totalPrice.toLocaleString('en-IN')}
                        </p>
                        <p className={cn("text-[10px]", isSelected ? "text-blue-100" : "text-slate-400")}>
                          ₹{pkg.pricePerUnit}/video
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Quantity & Retainer Duration Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity Stepper (for per-video, per-unit, pages) */}
            {currentService?.id !== 'ai-chatbot' && currentService?.id !== 'ai-automation-sales' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {currentService?.id === 'social-media-management' ? 'Number of Pages' : 'Quantity / Videos'}
                </label>
                <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1">
                  <button
                    type="button"
                    onClick={() => {
                      const newQty = Math.max(1, quantity - 1);
                      setQuantity(newQty);
                      // Deselect package id if custom qty
                      if (currentService?.id === 'video-translation') {
                        const matched = currentService.packages?.find(p => p.quantity === newQty);
                        setSelectedPackageId(matched ? matched.id : '');
                      }
                    }}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center hover:bg-slate-100 shadow-sm"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setQuantity(val);
                      if (currentService?.id === 'video-translation') {
                        const matched = currentService.packages?.find(p => p.quantity === val);
                        setSelectedPackageId(matched ? matched.id : '');
                      }
                    }}
                    className="flex-1 text-center font-bold text-slate-900 dark:text-white bg-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newQty = quantity + 1;
                      setQuantity(newQty);
                      if (currentService?.id === 'video-translation') {
                        const matched = currentService.packages?.find(p => p.quantity === newQty);
                        setSelectedPackageId(matched ? matched.id : '');
                      }
                    }}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center hover:bg-slate-100 shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Retainer Duration (for monthly retainers & AI automation) */}
            {(currentService?.billingType === 'per-month' || currentService?.id === 'ai-automation-sales') && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Duration (Months)
                </label>
                <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1">
                  <button
                    type="button"
                    onClick={() => setMonths(Math.max(1, months - 1))}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center hover:bg-slate-100 shadow-sm"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="flex-1 text-center font-bold text-slate-900 dark:text-white">
                    {months} Month{months > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMonths(months + 1)}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center hover:bg-slate-100 shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Add-ons & Scope Modifiers */}
          {currentService?.id === 'video-translation' && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Add-ons & Scope Options
              </h4>

              {/* Extra Languages */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <Languages size={18} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Additional Languages (Same Content)
                    </span>
                    <span className="text-[11px] text-slate-400">+₹600 per language per video</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdditionalLanguages(Math.max(0, additionalLanguages - 1))}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-bold text-sm w-6 text-center text-slate-900 dark:text-white">
                    {additionalLanguages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdditionalLanguages(additionalLanguages + 1)}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Extra Duration 30s Blocks */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Extra Duration (per 30s beyond 1.5 min)
                    </span>
                    <span className="text-[11px] text-slate-400">+₹200 per 30s block per video</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraDurationBlocks(Math.max(0, extraDurationBlocks - 1))}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-bold text-sm w-8 text-center text-slate-900 dark:text-white">
                    +{extraDurationBlocks * 30}s
                  </span>
                  <button
                    type="button"
                    onClick={() => setExtraDurationBlocks(extraDurationBlocks + 1)}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Caption Editing */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Caption Editing Style
                  </span>
                  <span className="text-[11px] text-slate-400">Animated subtitles</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'None', price: '₹0' },
                    { id: 'easy-medium', label: 'Easy/Med', price: '+₹350/vid' },
                    { id: 'complex', label: 'Complex', price: '+₹500/vid' },
                  ].map(cap => (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => setCaptionType(cap.id as any)}
                      className={cn(
                        "p-2 rounded-xl text-center border transition-all text-xs",
                        captionType === cap.id
                          ? "bg-blue-600 text-white border-blue-600 font-bold shadow-sm"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <span className="block font-semibold">{cap.label}</span>
                      <span className={cn("text-[10px]", captionType === cap.id ? "text-blue-100" : "text-slate-400")}>
                        {cap.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 4. Chatbot & Automation Platforms Add-on */}
          {(currentService?.id === 'ai-chatbot' || currentService?.id === 'ai-automation-sales') && (
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Additional Platform Integrations</h4>
                  <p className="text-[11px] text-slate-400">
                    {currentService.id === 'ai-chatbot'
                      ? 'Base includes 2 platforms · +₹7,000 per additional platform'
                      : 'Base includes 1 platform · +₹5,000 setup & +₹2,000/mo retainer'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdditionalPlatforms(Math.max(0, additionalPlatforms - 1))}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-bold text-sm w-6 text-center text-slate-900 dark:text-white">
                    {additionalPlatforms}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdditionalPlatforms(additionalPlatforms + 1)}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live Quotation & Proposal Text (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 bg-slate-50/80 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80">
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Calculated Quotation
              </span>
              {calculation && calculation.discountAmount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  Save ₹{calculation.discountAmount.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Big Total Price */}
            <div className="mb-4">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                ₹{calculation ? calculation.totalPrice.toLocaleString('en-IN') : '0'}
              </span>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Inclusive of all selected options & discounts
              </p>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700/60 mb-5">
              {calculation?.breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 pr-2">{item.label}</span>
                  <span className="font-semibold text-slate-900 dark:text-white shrink-0">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Generated Short Description / Proposal Text */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Client Short Description
              </label>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                {calculation?.shortDescription}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={handleCopyQuote}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-all"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Quote Copied!' : 'Copy Proposal Quote'}</span>
            </button>

            <Link
              href={`/documents?service=${encodeURIComponent(calculation?.serviceName || '')}&amount=${calculation?.totalPrice || 0}&desc=${encodeURIComponent(calculation?.shortDescription || '')}`}
              onClick={handleCreateDocument}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-3 rounded-xl font-semibold text-xs transition-colors"
            >
              <FileText size={16} />
              <span>Create Invoice / Document with Quote</span>
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
