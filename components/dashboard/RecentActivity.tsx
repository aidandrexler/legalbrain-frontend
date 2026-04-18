'use client';

import { useRouter } from 'next/navigation';
import { getDiagnosticLabel, formatDate } from '@/lib/utils';

interface Diagnostic {
  id: string;
  client_id: string;
  diagnostic_type: string;
  status: string;
  created_at: string;
  clients?: { first_name: string; last_name: string } | null;
}

interface Props {
  diagnostics: Diagnostic[];
}

const STATUS_BADGE: Record<string, string> = {
  complete: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
};

export default function RecentActivity({ diagnostics }: Props) {
  const router = useRouter();

  if (diagnostics.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>
          No recent diagnostics. Run your first analysis from a client profile.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: '#E5E1DA' }}>
      {diagnostics.map((d) => {
        const clientName = d.clients
          ? `${d.clients.first_name} ${d.clients.last_name}`
          : 'Unknown Client';
        return (
          <div
            key={d.id}
            className="py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded px-1 transition-colors"
            onClick={() => router.push(`/clients/${d.client_id}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
                {clientName}
              </p>
              <p className="text-xs truncate" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>
                {getDiagnosticLabel(d.diagnostic_type)} · {formatDate(d.created_at)}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded flex-shrink-0 font-medium ${STATUS_BADGE[d.status] ?? 'bg-gray-100 text-gray-700'}`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {d.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
