'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { URGENCY_COLORS, timeAgo } from '@/lib/utils';

const URGENCY_ORDER = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];

interface ActionItem {
  id: string;
  title: string;
  urgency: string;
  created_at: string;
  client_id: string;
  clients?: { first_name: string; last_name: string } | null;
}

interface Props {
  items: ActionItem[];
  onComplete: (id: string) => void;
}

export default function ActionItems({ items, onComplete }: Props) {
  const sorted = [...items].sort(
    (a, b) => URGENCY_ORDER.indexOf(a.urgency) - URGENCY_ORDER.indexOf(b.urgency)
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center py-10" style={{ color: '#6B6B6B' }}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: '#DCFCE7' }}
        >
          <Check size={20} style={{ color: '#3A6B4B' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: '#3A6B4B', fontFamily: "'Inter', sans-serif" }}>
          No open items. Your practice is fully up to date.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: '#E5E1DA' }}>
      {sorted.map((item) => {
        const clientName = item.clients
          ? `${item.clients.first_name} ${item.clients.last_name}`
          : 'Unknown Client';
        return (
          <div key={item.id} className="flex items-center gap-3 py-3">
            <span
              className={`text-xs px-2 py-0.5 rounded font-semibold flex-shrink-0 ${URGENCY_COLORS[item.urgency] ?? 'bg-gray-300 text-gray-700'}`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {item.urgency}
            </span>
            <Link
              href={`/clients/${item.client_id}`}
              className="text-sm font-medium hover:underline flex-shrink-0"
              style={{ color: '#B8860B', fontFamily: "'Inter', sans-serif" }}
            >
              {clientName}
            </Link>
            <span className="text-sm flex-1 truncate" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
              {item.title}
            </span>
            <span className="text-xs flex-shrink-0" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>
              {timeAgo(item.created_at)}
            </span>
            <button
              onClick={() => onComplete(item.id)}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-green-50"
              title="Mark complete"
              style={{ border: '1px solid #E5E1DA' }}
            >
              <Check size={14} style={{ color: '#3A6B4B' }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
