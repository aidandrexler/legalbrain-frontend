'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import ActionItems from '@/components/dashboard/ActionItems';
import RecentActivity from '@/components/dashboard/RecentActivity';

interface ActionItem {
  id: string;
  title: string;
  urgency: string;
  created_at: string;
  client_id: string;
  clients?: { first_name: string; last_name: string } | null;
}

interface Diagnostic {
  id: string;
  client_id: string;
  diagnostic_type: string;
  status: string;
  created_at: string;
  clients?: { first_name: string; last_name: string } | null;
}

export default function DashboardPage() {
  const { tenant_id, loading: tenantLoading } = useTenant();
  const supabase = createClient();

  const [activeClients, setActiveClients] = useState<number>(0);
  const [criticalItems, setCriticalItems] = useState<number>(0);
  const [pendingReviews, setPendingReviews] = useState<number>(0);
  const [systemHealthy, setSystemHealthy] = useState<boolean | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!tenant_id) return;
    setLoading(true);
    setError('');

    try {
      const [
        { count: ac },
        { count: ci },
        { count: pr },
        { data: aiData },
        { data: diagData },
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .eq('tenant_id', tenant_id),
        supabase
          .from('action_items')
          .select('*', { count: 'exact', head: true })
          .in('urgency', ['CRITICAL', 'URGENT'])
          .eq('status', 'open')
          .eq('tenant_id', tenant_id),
        supabase
          .from('diagnostics')
          .select('*', { count: 'exact', head: true })
          .eq('attorney_reviewed', false)
          .eq('status', 'complete')
          .eq('tenant_id', tenant_id),
        supabase
          .from('action_items')
          .select('*, clients(first_name, last_name)')
          .eq('tenant_id', tenant_id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('diagnostics')
          .select('*, clients(first_name, last_name)')
          .eq('tenant_id', tenant_id)
          .eq('status', 'complete')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      setActiveClients(ac ?? 0);
      setCriticalItems(ci ?? 0);
      setPendingReviews(pr ?? 0);
      setActionItems((aiData as ActionItem[]) ?? []);
      setDiagnostics((diagData as Diagnostic[]) ?? []);

      if (process.env.NEXT_PUBLIC_API_URL) {
        try {
          await api.health();
          setSystemHealthy(true);
        } catch {
          setSystemHealthy(false);
        }
      } else {
        setSystemHealthy(null);
      }
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [tenant_id, supabase]);

  useEffect(() => {
    if (!tenantLoading && tenant_id) {
      fetchData();
    }
  }, [tenant_id, tenantLoading, fetchData]);

  const handleCompleteItem = async (id: string) => {
    if (!tenant_id) return;
    await supabase
      .from('action_items')
      .update({ status: 'complete' })
      .eq('id', id)
      .eq('tenant_id', tenant_id);
    setActionItems((prev) => prev.filter((i) => i.id !== id));
    setCriticalItems((prev) => {
      const removed = actionItems.find((i) => i.id === id);
      if (removed && ['CRITICAL', 'URGENT'].includes(removed.urgency)) return Math.max(0, prev - 1);
      return prev;
    });
  };

  if (tenantLoading || loading) {
    return (
      <div className="px-8 py-8">
        <div className="h-8 w-40 rounded mb-6 animate-pulse" style={{ backgroundColor: '#E5E1DA' }} />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 h-24 animate-pulse" style={{ border: '1px solid #E5E1DA' }} />
          ))}
        </div>
        <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm mb-3" style={{ color: '#C0392B', fontFamily: "'Inter', sans-serif" }}>{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ backgroundColor: '#B8860B', fontFamily: "'Inter', sans-serif" }}
        >
          Retry
        </button>
      </div>
    );
  }

  const metrics = [
    { label: 'Active Clients', value: activeClients },
    { label: 'Open Critical Items', value: criticalItems },
    { label: 'Pending Reviews', value: pendingReviews },
  ];

  return (
    <div className="px-8 py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <h1
        className="text-3xl font-bold mb-6"
        style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
      >
        Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map(({ label, value }) => (
          <div
            key={label}
            className="bg-white rounded-lg p-4 shadow-sm"
            style={{ border: '1px solid #E5E1DA' }}
          >
            <p
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
            >
              {value}
            </p>
            <p className="text-sm" style={{ color: '#6B6B6B' }}>{label}</p>
          </div>
        ))}

        <div
          className="bg-white rounded-lg p-4 shadow-sm"
          style={{ border: '1px solid #E5E1DA' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: systemHealthy === null ? '#9CA3AF' : systemHealthy ? '#3A6B4B' : '#C0392B' }}
            />
            <p
              className="text-lg font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
            >
              {systemHealthy === null ? 'Not Connected' : systemHealthy ? 'Healthy' : 'Issue'}
            </p>
          </div>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>System</p>
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
          <h2
            className="text-lg font-semibold mb-3"
            style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
          >
            Requires Attention
          </h2>
          <ActionItems items={actionItems} onComplete={handleCompleteItem} />
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
          <h2
            className="text-lg font-semibold mb-3"
            style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
          >
            Recent Activity
          </h2>
          <RecentActivity diagnostics={diagnostics} />
        </div>
      </div>
    </div>
  );
}
