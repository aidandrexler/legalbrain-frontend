'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, Check } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { formatDate, URGENCY_COLORS } from '@/lib/utils';

interface RateRow {
  rate_7520: number;
  afr_mid_term: number;
}

interface PlanningWindow {
  id: string;
  client_id: string;
  window_title: string;
  description: string;
  urgency: string;
  due_date: string | null;
  window_type: string;
  created_at: string;
  clients?: { first_name: string; last_name: string } | null;
}

interface ActiveClient {
  id: string;
  first_name: string;
  last_name: string;
}

const URGENCY_ORDER = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];

const URGENCY_HEADER_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  CRITICAL: { backgroundColor: '#C0392B', color: '#fff' },
  URGENT: { backgroundColor: '#991b1b', color: '#fff' },
  HIGH: { backgroundColor: '#C9A84C', color: '#fff' },
  MEDIUM: { backgroundColor: '#6B7280', color: '#fff' },
  LOW: { backgroundColor: '#9CA3AF', color: '#374151' },
};

export default function TemporalPage() {
  const { tenant_id, loading: tenantLoading } = useTenant();
  const supabase = createClient();

  const [rate, setRate] = useState<RateRow | null>(null);
  const [windows, setWindows] = useState<PlanningWindow[]>([]);
  const [activeClients, setActiveClients] = useState<ActiveClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'all' | 'specific'>('all');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    MEDIUM: true,
    LOW: true,
  });

  const fetchData = useCallback(async () => {
    if (!tenant_id) return;
    setLoading(true);

    const [
      { data: rateData },
      { data: windowsData },
      { data: clientsData },
    ] = await Promise.all([
      supabase
        .from('rate_table')
        .select('rate_7520, afr_mid_term')
        .eq('tenant_id', tenant_id)
        .order('effective_month', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('planning_windows')
        .select('*, clients(first_name, last_name)')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .eq('tenant_id', tenant_id),
    ]);

    setRate(rateData as RateRow | null);
    setWindows((windowsData as PlanningWindow[]) ?? []);
    setActiveClients((clientsData as ActiveClient[]) ?? []);

    if (windowsData && windowsData.length > 0) {
      setLastScan((windowsData as PlanningWindow[])[0].created_at);
      setHasScanned(true);
    }

    setLoading(false);
  }, [tenant_id, supabase]);

  useEffect(() => {
    if (!tenantLoading && tenant_id) fetchData();
  }, [tenant_id, tenantLoading, fetchData]);

  const runScan = async () => {
    if (!tenant_id) return;
    setScanning(true);
    const clientId = scanMode === 'specific' && selectedClientId ? selectedClientId : undefined;
    try {
      await api.runTemporal(tenant_id, clientId);
      await fetchData();
      setHasScanned(true);
    } catch {}
    setScanning(false);
  };

  const toggleGroup = (urgency: string) => {
    setCollapsedGroups(prev => ({ ...prev, [urgency]: !prev[urgency] }));
  };

  const getRateInterpretation = () => {
    if (!rate) return { label: 'Rate Not Configured', style: { backgroundColor: '#9CA3AF', color: '#fff' } };
    const r = rate.rate_7520;
    if (r < 4.0) return { label: 'GRAT Window: OPTIMAL', style: { backgroundColor: '#3A6B4B', color: '#fff' } };
    if (r < 5.0) return { label: 'GRAT Window: FAVORABLE', style: { backgroundColor: '#C9A84C', color: '#fff' } };
    return { label: 'GRAT Window: NEUTRAL', style: { backgroundColor: '#9CA3AF', color: '#fff' } };
  };

  const rateInterp = getRateInterpretation();

  const grouped: Record<string, PlanningWindow[]> = {};
  for (const urgency of URGENCY_ORDER) {
    const group = windows.filter(w => w.urgency === urgency);
    if (group.length > 0) grouped[urgency] = group;
  }

  if (tenantLoading || loading) {
    return (
      <div className="px-8 py-8">
        <div className="h-8 w-56 rounded mb-6 animate-pulse" style={{ backgroundColor: '#E5E1DA' }} />
        <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>Loading temporal engine...</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <h1
        className="text-3xl font-bold mb-6"
        style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
      >
        Temporal Planning Engine
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
          <h2 className="font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 18 }}>
            Rate Environment
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#6B6B6B' }}>Current §7520 Rate</span>
              <span className="font-semibold text-sm" style={{ color: '#2C2C2C' }}>
                {rate ? `${rate.rate_7520}%` : 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#6B6B6B' }}>AFR Mid-Term Rate</span>
              <span className="font-semibold text-sm" style={{ color: '#2C2C2C' }}>
                {rate ? `${rate.afr_mid_term}%` : 'Not set'}
              </span>
            </div>
            <div className="pt-2">
              <span
                className="text-xs px-3 py-1.5 rounded font-semibold"
                style={rateInterp.style}
              >
                {rateInterp.label}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
          <h2 className="font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 18 }}>
            Scan Controls
          </h2>
          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#2C2C2C' }}>
                <input
                  type="radio"
                  checked={scanMode === 'all'}
                  onChange={() => setScanMode('all')}
                  className="accent-[#B87333]"
                />
                Scan all active clients
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#2C2C2C' }}>
                <input
                  type="radio"
                  checked={scanMode === 'specific'}
                  onChange={() => setScanMode('specific')}
                  className="accent-[#B87333]"
                />
                Specific client
              </label>
            </div>

            {scanMode === 'specific' && (
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
              >
                <option value="">Select a client...</option>
                {activeClients.map(c => (
                  <option key={c.id} value={c.id}>{c.last_name}, {c.first_name}</option>
                ))}
              </select>
            )}

            <button
              onClick={runScan}
              disabled={scanning || (scanMode === 'specific' && !selectedClientId)}
              className="w-full py-2.5 rounded-md text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: scanning ? '#9A6425' : '#B87333', fontFamily: "'Inter', sans-serif" }}
            >
              {scanning
                ? `Scanning ${scanMode === 'all' ? activeClients.length + ' active clients' : 'client'} for planning opportunities...`
                : 'Run Temporal Scan'}
            </button>

            <p className="text-xs" style={{ color: '#6B6B6B' }}>
              Last scan: {lastScan ? formatDate(lastScan) : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {!hasScanned ? (
        <div className="bg-white rounded-lg p-10 text-center shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            Run a temporal scan to detect planning opportunities.
          </p>
        </div>
      ) : windows.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: '#DCFCE7' }}
          >
            <Check size={24} style={{ color: '#3A6B4B' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: '#3A6B4B' }}>
            No planning windows detected. All clients are current.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {URGENCY_ORDER.filter(u => grouped[u]).map((urgency) => {
            const group = grouped[urgency];
            const isCollapsed = !!collapsedGroups[urgency];
            const headerStyle = URGENCY_HEADER_STYLES[urgency] ?? { backgroundColor: '#9CA3AF', color: '#fff' };
            const isCollapsible = urgency === 'MEDIUM' || urgency === 'LOW';

            return (
              <div key={urgency} className="rounded-lg overflow-hidden shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  onClick={isCollapsible ? () => toggleGroup(urgency) : undefined}
                  role={isCollapsible ? 'button' : undefined}
                  style={{ ...headerStyle, cursor: isCollapsible ? 'pointer' : 'default' }}
                >
                  <span className="font-semibold text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {urgency} — {group.length} window{group.length !== 1 ? 's' : ''}
                  </span>
                  {isCollapsible && (
                    <span className="text-xs opacity-75">
                      {isCollapsed ? '▼ Show' : '▲ Hide'}
                    </span>
                  )}
                </div>

                {(!isCollapsible || !isCollapsed) && (
                  <div className="divide-y" style={{ backgroundColor: '#fff', borderColor: '#E5E1DA' }}>
                    {group.map(w => {
                      const clientName = w.clients
                        ? `${w.clients.first_name} ${w.clients.last_name}`
                        : 'Unknown Client';
                      return (
                        <div key={w.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-semibold ${URGENCY_COLORS[w.urgency] ?? 'bg-gray-300 text-gray-700'}`}
                            >
                              {w.urgency}
                            </span>
                            <Link
                              href={`/clients/${w.client_id}`}
                              className="text-sm font-medium hover:underline"
                              style={{ color: '#B87333', fontFamily: "'Inter', sans-serif" }}
                            >
                              {clientName}
                            </Link>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
                              {w.window_title}
                            </p>
                            {w.description && (
                              <p className="text-xs truncate" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>
                                {w.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {w.due_date && (
                              <span className="text-xs" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>
                                Due {formatDate(w.due_date)}
                              </span>
                            )}
                            <ChevronRight size={16} style={{ color: '#6B6B6B' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
