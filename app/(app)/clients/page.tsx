'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, getDiagnosticLabel, STATUS_COLORS } from '@/lib/utils';
import NewClientSlideOver from '@/components/clients/NewClientSlideOver';

interface ClientRow {
  id: string;
  first_name: string;
  last_name: string;
  estate_size_estimate number;
  status: string;
  diagnostics?: { diagnostic_type: string; created_at: string }[];
}

export default function ClientsPage() {
  const { tenant_id, loading: tenantLoading } = useTenant();
  const supabase = createClient();

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSlideOver, setShowSlideOver] = useState(false);

  const fetchClients = useCallback(async () => {
    if (!tenant_id) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('clients')
      .select('id, first_name, last_name, estate_size_estimate status, diagnostics(diagnostic_type, created_at)')
      .eq('tenant_id', tenant_id)
      .order('updated_at', { ascending: false });

    setLoading(false);
    if (err) { setError(err.message); return; }
    setClients((data as ClientRow[]) ?? []);
  }, [tenant_id, supabase]);

  useEffect(() => {
    if (!tenantLoading && tenant_id) fetchClients();
  }, [tenant_id, tenantLoading, fetchClients]);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q);
  });

  const getLastDiagnostic = (c: ClientRow): string => {
    if (!c.diagnostics || c.diagnostics.length === 0) return '';
    const sorted = [...c.diagnostics].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0].diagnostic_type;
  };

  if (tenantLoading || loading) {
    return (
      <div className="px-8 py-8">
        <div className="h-8 w-32 rounded mb-6 animate-pulse" style={{ backgroundColor: '#E5E1DA' }} />
        <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>Loading clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm mb-3" style={{ color: '#C0392B', fontFamily: "'Inter', sans-serif" }}>{error}</p>
        <button
          onClick={fetchClients}
          className="px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ backgroundColor: '#B87333', fontFamily: "'Inter', sans-serif" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="px-8 py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
        >
          Clients
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="pl-9 pr-4 py-2 rounded-md text-sm outline-none"
              style={{ border: '1px solid #E5E1DA', backgroundColor: '#fff', fontFamily: "'Inter', sans-serif", width: 240 }}
            />
          </div>
          <button
            onClick={() => setShowSlideOver(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#B87333', fontFamily: "'Inter', sans-serif" }}
          >
            <Plus size={16} />
            New Client
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
          <p className="text-base mb-4" style={{ color: '#6B6B6B' }}>
            {search ? 'No clients match your search.' : 'No clients yet. Add your first client to get started.'}
          </p>
          {!search && (
            <button
              onClick={() => setShowSlideOver(true)}
              className="px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: '#B87333', fontFamily: "'Inter', sans-serif" }}
            >
              New Client
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden" style={{ border: '1px solid #E5E1DA' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E1DA', backgroundColor: '#F4F2EE' }}>
                  {['Name', 'Estate Size', 'Status', 'Last Diagnostic', 'Actions'].map((col) => (
                    <th
                      key={col}
                      className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide"
                      style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const lastDx = getLastDiagnostic(c);
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: '1px solid #E5E1DA' }}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/clients/${c.id}`}
                          className="font-medium hover:underline"
                          style={{ color: '#B87333', fontFamily: "'Inter', sans-serif" }}
                        >
                          {c.first_name} {c.last_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3" style={{ color: '#2C2C2C' }}>
                        {c.estate_size_estimate> 0 ? formatCurrency(c.estate_size_estimate : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-700'}`}
                        >
                          {c.status.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: '#6B6B6B' }}>
                        {lastDx ? getDiagnosticLabel(lastDx) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/clients/${c.id}`}
                          className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                          style={{ border: '1px solid #B87333', color: '#B87333', backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif" }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((c) => {
              const lastDx = getLastDiagnostic(c);
              return (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="block bg-white rounded-lg p-4 shadow-sm"
                  style={{ border: '1px solid #E5E1DA' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium" style={{ color: '#2C2C2C', fontFamily: "'Playfair Display', serif" }}>
                      {c.first_name} {c.last_name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#6B6B6B' }}>
                    {c.estate_size_estimate> 0 ? formatCurrency(c.estate_size_estimate : 'No estate value'} · {lastDx ? getDiagnosticLabel(lastDx) : 'No diagnostics'}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {showSlideOver && tenant_id && (
        <NewClientSlideOver
          tenantId={tenant_id}
          onClose={() => setShowSlideOver(false)}
          onSaved={fetchClients}
        />
      )}
    </div>
  );
}
