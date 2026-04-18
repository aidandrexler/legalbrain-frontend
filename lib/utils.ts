import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const DIAGNOSTIC_LABELS: Record<string, string> = {
  risk_architecture: 'Risk Architecture',
  estate_tax_architecture: 'Estate & Tax Architecture',
  temporal_planning: 'Temporal Planning',
  plan_integrity_audit: 'Plan Integrity Audit',
  advisor_intelligence: 'Advisor Intelligence',
};

export function getDiagnosticLabel(type: string): string {
  return DIAGNOSTIC_LABELS[type] ?? type;
}

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

export const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-[#C0392B] text-white',
  URGENT: 'bg-red-800 text-white',
  HIGH: 'bg-[#C9A84C] text-white',
  MEDIUM: 'bg-gray-500 text-white',
  LOW: 'bg-gray-300 text-gray-700',
};

export const STATUS_COLORS: Record<string, string> = {
  intake: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  documents_signed: 'bg-yellow-100 text-yellow-800',
  complete: 'bg-gray-100 text-gray-700',
  archived: 'bg-gray-200 text-gray-500',
};
