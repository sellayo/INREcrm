import { PricingService, CalculationOptions, CalculationResult } from '@/types';
import { createClient } from '@/lib/supabase';

export const DEFAULT_SERVICES: PricingService[] = [
  {
    id: 'video-translation',
    name: 'AI Video Translation',
    category: 'Video Translation',
    billingType: 'tiered',
    basePrice: 700,
    scopeDescription: 'Short-form video localization & voice translation (1 - 1.5 min, 1 language included)',
    durationIncluded: '1 - 1.5 min',
    packages: [
      { id: 'single', name: 'Single Video (Trial/Pilot)', quantity: 1, pricePerUnit: 700, totalPrice: 700, discountPct: 0 },
      { id: 'pkg-10', name: '10 Videos Package', quantity: 10, pricePerUnit: 630, totalPrice: 6300, discountPct: 10 },
      { id: 'pkg-20', name: '20 Videos Package', quantity: 20, pricePerUnit: 595, totalPrice: 11900, discountPct: 15 },
      { id: 'pkg-30', name: '30 Videos Package', quantity: 30, pricePerUnit: 560, totalPrice: 16800, discountPct: 20 },
      { id: 'pkg-50', name: '50 Videos Package', quantity: 50, pricePerUnit: 525, totalPrice: 26250, discountPct: 25 },
      { id: 'pkg-100', name: '100 Videos Package', quantity: 100, pricePerUnit: 500, totalPrice: 50000, discountPct: 28.6 },
    ],
    addons: [
      { id: 'addnl-lang', name: 'Additional Language (Same content)', price: 600, billingType: 'per-unit', description: 'Per video per language' },
      { id: 'extra-duration', name: 'Extra Duration (per 30s block)', price: 200, billingType: 'per-unit', description: 'Beyond 1.5 min duration' },
      { id: 'extra-lang-duration', name: 'Extra Duration (Additional language, per 30s)', price: 200, billingType: 'per-unit', description: 'Per 30s block on additional language' },
      { id: 'captions-easy', name: 'Caption Editing (Easy to Medium)', price: 350, billingType: 'per-unit', description: 'Standard animated subtitles' },
      { id: 'captions-complex', name: 'Caption Editing (Complex)', price: 500, billingType: 'per-unit', description: 'High-end custom animations & styling' },
    ]
  },
  {
    id: 'ai-chatbot',
    name: 'AI Chatbot Setup',
    category: 'Automation & AI',
    billingType: 'one-time',
    basePrice: 10000,
    scopeDescription: 'Comprehensive AI assistant setup covering 2 platforms (e.g. WhatsApp & Website / Instagram)',
    addons: [
      { id: 'addnl-platform', name: 'Additional Platform Integration', price: 7000, billingType: 'one-time', description: 'Per extra channel or CRM connected' },
    ]
  },
  {
    id: 'ai-automation-sales',
    name: 'AI Automation (Sales Agent)',
    category: 'Automation & AI',
    billingType: 'per-month',
    basePrice: 15000,
    scopeDescription: 'Autonomous outbound/inbound sales AI agent (1 platform). Month 1 Setup: ₹15,000, subsequent ₹10,000/mo retainer.',
    addons: [
      { id: 'auto-addnl-platform-setup', name: 'Additional Platform Setup', price: 5000, billingType: 'one-time', description: 'Setup per additional channel' },
      { id: 'auto-addnl-platform-retainer', name: 'Additional Platform Retainer', price: 2000, billingType: 'per-month', description: 'Monthly management per extra channel' },
    ]
  },
  {
    id: 'website-development',
    name: 'Website Development',
    category: 'Market Expansion',
    billingType: 'one-time',
    basePrice: 20000,
    scopeDescription: 'Full responsive modern landing page / business website design, deployment & SEO optimization'
  },
  {
    id: 'social-media-management',
    name: 'Social Media Management',
    category: 'Content & Social',
    billingType: 'per-month',
    basePrice: 10000,
    scopeDescription: 'Monthly social page management, content calendar, organic growth & engagement (per page / month)'
  },
  {
    id: 'meta-ads-management',
    name: 'Meta Ads Management',
    category: 'Market Expansion',
    billingType: 'per-month',
    basePrice: 25000,
    scopeDescription: 'Comprehensive Meta (Facebook & Instagram) ads campaign management, targeting, testing & ROAS scaling (per month)'
  },
  {
    id: 'ai-video-creation',
    name: 'AI Video / Ad Creation',
    category: 'Content & Social',
    billingType: 'per-video',
    basePrice: 5000,
    scopeDescription: 'High-converting custom AI video creative and commercial ad production (per video)'
  },
  {
    id: 'caption-editing',
    name: 'Caption Editing Only',
    category: 'Content & Social',
    billingType: 'per-video',
    basePrice: 350,
    scopeDescription: 'Professional subtitle styling, kinetic typography & visual pacing (₹350 Easy/Medium, ₹500 Complex)'
  }
];

const LOCAL_STORAGE_KEY = 'inrecrm_pricing_catalog_v1';

/**
 * Calculate final price & generate client proposal text
 */
export function calculatePrice(service: PricingService, options: CalculationOptions): CalculationResult {
  const breakdown: { label: string; amount: number }[] = [];
  let baseAmount = 0;
  let discountAmount = 0;
  let addOnsTotal = 0;
  const descriptionParts: string[] = [];

  const qty = Math.max(1, options.quantity || 1);
  const months = Math.max(1, options.months || 1);

  // 1. Service Type Specific Logic
  if (service.id === 'video-translation') {
    // Check if matching a predefined package
    const matchedPackage = service.packages?.find(p => p.id === options.packageId || p.quantity === qty);
    
    if (matchedPackage) {
      baseAmount = matchedPackage.totalPrice;
      const unDiscounted = qty * 700;
      discountAmount = Math.max(0, unDiscounted - baseAmount);
      
      breakdown.push({
        label: `${matchedPackage.name} (${qty} videos @ ₹${matchedPackage.pricePerUnit}/video)`,
        amount: baseAmount
      });
      descriptionParts.push(`${service.name}: ${matchedPackage.name} (${qty} videos @ ₹${matchedPackage.pricePerUnit}/video)`);
      if (matchedPackage.discountPct > 0) {
        descriptionParts.push(`includes ${matchedPackage.discountPct}% bulk discount`);
      }
    } else {
      // Custom quantity calculation: look for closest package tier
      let rate = 700;
      let discPct = 0;
      if (qty >= 100) { rate = 500; discPct = 28.6; }
      else if (qty >= 50) { rate = 525; discPct = 25; }
      else if (qty >= 30) { rate = 560; discPct = 20; }
      else if (qty >= 20) { rate = 595; discPct = 15; }
      else if (qty >= 10) { rate = 630; discPct = 10; }

      baseAmount = qty * rate;
      const unDiscounted = qty * 700;
      discountAmount = Math.max(0, unDiscounted - baseAmount);

      breakdown.push({
        label: `${qty} Videos @ ₹${rate}/video${discPct > 0 ? ` (${discPct}% off)` : ''}`,
        amount: baseAmount
      });
      descriptionParts.push(`${service.name}: ${qty} Videos @ ₹${rate}/video`);
    }

    // Additional Languages (₹600 per video per language)
    const addnlLangs = Math.max(0, options.additionalLanguages || 0);
    if (addnlLangs > 0) {
      const addnlLangCost = qty * addnlLangs * 600;
      addOnsTotal += addnlLangCost;
      breakdown.push({
        label: `${addnlLangs} Additional language(s) across ${qty} video(s) @ ₹600/video`,
        amount: addnlLangCost
      });
      descriptionParts.push(`+ ${addnlLangs} extra language(s) (₹${addnlLangCost.toLocaleString('en-IN')})`);
    }

    // Extra Duration 30s blocks (₹200 per 30s per video)
    const extraBlocks = Math.max(0, options.extraDurationBlocks || 0);
    if (extraBlocks > 0) {
      const extraDurationCost = qty * extraBlocks * 200;
      addOnsTotal += extraDurationCost;
      breakdown.push({
        label: `Extra duration (+${extraBlocks * 30}s) across ${qty} video(s) @ ₹200/block`,
        amount: extraDurationCost
      });
      descriptionParts.push(`+ ${extraBlocks * 30}s extra duration (₹${extraDurationCost.toLocaleString('en-IN')})`);
    }

    // Extra Duration on Additional Languages
    const extraLangBlocks = Math.max(0, options.extraLangDurationBlocks || 0);
    if (extraLangBlocks > 0 && addnlLangs > 0) {
      const extraLangDurationCost = qty * addnlLangs * extraLangBlocks * 200;
      addOnsTotal += extraLangDurationCost;
      breakdown.push({
        label: `Extra duration on additional language(s) (+${extraLangBlocks * 30}s)`,
        amount: extraLangDurationCost
      });
    }

    // Caption Editing
    if (options.captionType === 'easy-medium') {
      const captionCost = qty * 350;
      addOnsTotal += captionCost;
      breakdown.push({ label: `Caption Editing (Easy/Medium) across ${qty} video(s)`, amount: captionCost });
      descriptionParts.push(`+ Easy/Medium captions (₹${captionCost.toLocaleString('en-IN')})`);
    } else if (options.captionType === 'complex') {
      const captionCost = qty * 500;
      addOnsTotal += captionCost;
      breakdown.push({ label: `Caption Editing (Complex Animated) across ${qty} video(s)`, amount: captionCost });
      descriptionParts.push(`+ Complex animated captions (₹${captionCost.toLocaleString('en-IN')})`);
    }

  } else if (service.id === 'ai-chatbot') {
    baseAmount = service.basePrice; // ₹10,000 (2 platforms)
    breakdown.push({ label: 'AI Chatbot Setup (covers 2 platforms)', amount: baseAmount });
    descriptionParts.push('AI Chatbot Setup (2 platforms included: e.g. WhatsApp & Website)');

    const extraPlatforms = Math.max(0, options.additionalPlatforms || 0);
    if (extraPlatforms > 0) {
      const platformCost = extraPlatforms * 7000;
      addOnsTotal += platformCost;
      breakdown.push({ label: `${extraPlatforms} Additional platform integration(s) @ ₹7,000`, amount: platformCost });
      descriptionParts.push(`+ ${extraPlatforms} additional platform(s) (₹${platformCost.toLocaleString('en-IN')})`);
    }

  } else if (service.id === 'ai-automation-sales') {
    // Month 1 Setup ₹15,000, Subsequent months ₹10,000/mo retainer
    const setupFee = 15000;
    const retainerMonths = Math.max(0, months - 1);
    const retainerFee = retainerMonths * 10000;
    baseAmount = setupFee + retainerFee;

    breakdown.push({ label: `Month 1 Setup & Deployment (1 platform)`, amount: setupFee });
    if (retainerMonths > 0) {
      breakdown.push({ label: `Monthly Retainer (${retainerMonths} additional month${retainerMonths > 1 ? 's' : ''} @ ₹10,000/mo)`, amount: retainerFee });
    }
    descriptionParts.push(`AI Automation Sales Agent (${months} month${months > 1 ? 's' : ''} engagement: M1 setup ₹15k${retainerMonths > 0 ? ` + ${retainerMonths}mo retainer @ ₹10k/mo` : ''})`);

    const extraPlatforms = Math.max(0, options.additionalPlatforms || 0);
    if (extraPlatforms > 0) {
      const extraPlatformSetup = extraPlatforms * 5000;
      const extraPlatformRetainer = extraPlatforms * retainerMonths * 2000;
      const totalExtraPlatform = extraPlatformSetup + extraPlatformRetainer;
      addOnsTotal += totalExtraPlatform;

      breakdown.push({ label: `${extraPlatforms} Extra Platform Setup @ ₹5,000`, amount: extraPlatformSetup });
      if (retainerMonths > 0) {
        breakdown.push({ label: `${extraPlatforms} Extra Platform Retainer (${retainerMonths}mo @ ₹2,000/mo)`, amount: extraPlatformRetainer });
      }
      descriptionParts.push(`+ ${extraPlatforms} extra platform(s) setup & retainer (₹${totalExtraPlatform.toLocaleString('en-IN')})`);
    }

  } else if (service.billingType === 'per-month') {
    // Retainers: Social Media, Meta Ads
    baseAmount = service.basePrice * qty * months;
    const unitLabel = service.id === 'social-media-management' ? `${qty} page${qty > 1 ? 's' : ''}` : 'Campaign';
    breakdown.push({
      label: `${service.name} (${unitLabel} × ${months} month${months > 1 ? 's' : ''} @ ₹${service.basePrice.toLocaleString('en-IN')}/mo)`,
      amount: baseAmount
    });
    descriptionParts.push(`${service.name}: ${unitLabel} for ${months} month${months > 1 ? 's' : ''} @ ₹${service.basePrice.toLocaleString('en-IN')}/mo`);

  } else if (service.billingType === 'per-video') {
    // AI Video/ad Creation, Caption Editing
    baseAmount = service.basePrice * qty;
    breakdown.push({
      label: `${service.name} (${qty} video${qty > 1 ? 's' : ''} @ ₹${service.basePrice.toLocaleString('en-IN')}/video)`,
      amount: baseAmount
    });
    descriptionParts.push(`${service.name}: ${qty} video${qty > 1 ? 's' : ''} @ ₹${service.basePrice.toLocaleString('en-IN')}/video`);

  } else {
    // Default / One-time (Website Development, Custom services)
    baseAmount = service.basePrice * qty;
    breakdown.push({
      label: `${service.name} (${qty} unit${qty > 1 ? 's' : ''} @ ₹${service.basePrice.toLocaleString('en-IN')})`,
      amount: baseAmount
    });
    descriptionParts.push(`${service.name} (${qty} unit${qty > 1 ? 's' : ''})`);
  }

  const finalTotal = baseAmount + addOnsTotal;
  const shortDescription = `${descriptionParts.join(' ')}. Total Investment: ₹${finalTotal.toLocaleString('en-IN')}.`;

  return {
    serviceName: service.name,
    totalPrice: finalTotal,
    basePrice: baseAmount,
    discountAmount,
    shortDescription,
    breakdown
  };
}

/**
 * Load pricing catalog from Supabase (or localStorage fallback)
 */
export async function loadPricingCatalog(): Promise<PricingService[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('pricing_catalog')
      .eq('id', 1)
      .single();

    if (!error && data?.pricing_catalog && Array.isArray(data.pricing_catalog) && data.pricing_catalog.length > 0) {
      // Also cache to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.pricing_catalog));
      }
      return data.pricing_catalog as PricingService[];
    }
  } catch (err) {
    console.warn('Could not load pricing from database, checking local storage:', err);
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse cached pricing:', e);
      }
    }
  }

  return DEFAULT_SERVICES;
}

/**
 * Save updated pricing catalog to Supabase & localStorage
 */
export async function savePricingCatalog(catalog: PricingService[]): Promise<boolean> {
  // Always save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(catalog));
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('app_settings')
      .update({ pricing_catalog: catalog })
      .eq('id', 1);

    if (error) {
      console.warn('Notice: app_settings pricing_catalog column may need to be added. Saved to local storage successfully.', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Database save skipped, saved locally:', err);
    return false;
  }
}
