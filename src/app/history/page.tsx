'use client';

import ClientHistoryView from '@/components/ui/ClientHistoryView';
import Link from 'next/link';
import { Tag } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-8">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Client History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View complete client timelines, invoices and receipts history
          </p>
        </div>

        <Link
          href="/services?tab=pricing"
          className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors w-fit"
        >
          <Tag size={16} />
          <span>Go to Pricing & Rate Card</span>
        </Link>
      </header>

      <ClientHistoryView />
    </div>
  );
}
