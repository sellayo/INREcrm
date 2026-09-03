'use client';

import { motion, useAnimation, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Phone, FileText, User } from 'lucide-react';
import { useState } from 'react';

interface ContactCardProps {
  id: string;
  name: string;
  niche: string;
  type: 'lead' | 'client';
  receiptsCount?: number;
  invoicesCount?: number;
  onCall?: (id: string) => void;
  onInvoice?: (id: string) => void;
  onTransfer?: (id: string) => void;
  onClick?: () => void;
}

const SWIPE_THRESHOLD = 80;

export default function ContactCard({ id, name, niche, type, receiptsCount = 0, invoicesCount = 0, onCall, onInvoice, onTransfer, onClick }: ContactCardProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();

  const leftActionOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rightActionOpacity = useTransform(x, [0, -SWIPE_THRESHOLD], [0, 1]);

  const handleDragEnd = (event: unknown, info: PanInfo) => {
    const offset = info.offset.x;

    if (offset > SWIPE_THRESHOLD) {
      // Swiped right (Call)
      controls.start({ x: SWIPE_THRESHOLD, transition: { type: 'spring', stiffness: 400, damping: 25 } });
    } else if (offset < -SWIPE_THRESHOLD && type === 'lead' && receiptsCount > 0) {
      // Swiped left (Transfer)
      controls.start({ x: -SWIPE_THRESHOLD, transition: { type: 'spring', stiffness: 400, damping: 25 } });
    } else {
      // Snap back
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
    }
  };

  const handleReset = () => {
    controls.start({ x: 0 });
  };

  return (
    <div className="relative w-full rounded-2xl bg-slate-100 overflow-hidden mb-3 shadow-sm border border-slate-100">
      
      {/* Background Actions */}
      <div className="absolute inset-y-0 left-0 flex items-center px-6">
        <motion.button 
          style={{ opacity: leftActionOpacity }}
          className="text-green-600 flex flex-col items-center justify-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onCall?.(id);
            handleReset();
          }}
        >
          <div className="bg-green-100 p-2 rounded-full">
            <Phone size={20} fill="currentColor" />
          </div>
          <span className="text-[10px] font-bold tracking-wide uppercase">Call</span>
        </motion.button>
      </div>

      {type === 'lead' && receiptsCount > 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center px-6">
          <motion.button 
            style={{ opacity: rightActionOpacity }}
            className="text-blue-600 flex flex-col items-center justify-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onTransfer?.(id);
              handleReset();
            }}
          >
            <div className="bg-blue-100 p-2 rounded-full">
              <FileText size={20} fill="currentColor" />
            </div>
            <span className="text-[10px] font-bold tracking-wide uppercase">Transfer</span>
          </motion.button>
        </div>
      )}

      {/* Foreground Draggable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        onClick={() => {
          if (x.get() === 0) {
            onClick?.();
          }
        }}
        className="relative bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer active:cursor-grabbing"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{name}</h3>
            <p className="text-sm text-slate-500">{niche}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
            type === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {type}
          </span>
          {receiptsCount > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-green-100 text-green-700 mt-1">
              Receipt Sent
            </span>
          )}
          {invoicesCount > 0 && receiptsCount === 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-100 text-purple-700 mt-1">
              Invoice Sent
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
