'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, STATUS_COLORS } from '@/lib/utils';
import ProfileTab from '@/components/clients/detail/ProfileTab';
import DiagnosticsTab from '@/components/clients/detail/DiagnosticsTab';

interface Client {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  email: string;
  phone: string;
  marital_status: string;
  spouse_first_name: string;
  number_of_children: number;
  estate_size_estimate: number;
  net_worth: number;
  annual_income: number;
  homestead_declared: boolean;
  trust_funded: boolean;
  trust_signed_date: string | null;
  entity_type: string;
  is_physician: boolean;
  physician_specialty: string;
  practice_entity_type: string;
  practice_name: string;
  annual_practice_revenue: number;
  top_payer_concentration: number;
  has_malpractice_coverage: boolean;
  malpractice_limit: number;
  has_buy_sell_agreement: boolean;
  buy_sell_funded: boolean;
  goal_tax_efficiency: number;
  goal_risk_reduction: number;
  goal_liquidity: number;
  goal_simplicity: number;
  client_status: string;
  anticipated_sale_date: string | null;
  anticipated_inheritance_date: string | null;
  anticipated_inheritance_amount: number;
  divorce_risk_flag: boolean;
  health_flag: boolean;
  cpa_name: string;
  financial_advisor_name: string;
  referral_source: string;
  created_at: string;
  updated_at: string;
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { tenant_id, loading: tenantLoading } = useTenant();
  const supabase = createClient();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'diagnostics'>('profile');

  const fetchClient = useCallback(async () => {
    if (!tenant_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', tenant_id)
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setClient(data as Client);
    }
    setLoading(false);
  }, [tenant_id, params.id, supabase]);

  useEffect(() => {
    if (!tenantLoading && tenant_id) fetchClient();
  }, [tenant_id, tenantLoading, fetchClient]);

  if (tenantLoading || loading) {
    return (
      <div className="px-8 py-8">
        <div className="h-8 w-48 rounded mb-4 animate-pulse" style={{ backgroundColor: '#E5E1DA' }} />
        <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>Loading client...</p>
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="px-8 py-8">
        <p className="text-base mb-4" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>Client not found.</p>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ backgroundColor: '#B87333', fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={16} /> Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="px-8 py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm mb-5"
        style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}
      >
        <ArrowLeft size={14} /> Back to Clients
      </Link>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1
            className="font-bold leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 28 }}
          >
            {client.first_name} {client.last_name}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[client.client_status] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {client.client_status.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())}
            </span>
            {client.estate_size_estimate> 0 && (
              <span className="text-sm" style={{ color: '#6B6B6B' }}>
                {formatCurrency(client.estate_size_estimate)}
              </span>
            )}
            {client.is_physician && (
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}
              >
                Physician
              </span>
            )}
            {client.entity_type && (
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ backgroundColor: '#F4F2EE', color: '#6B6B6B', border: '1px solid #E5E1DA' }}
              >
                {client.entity_type}
              </span>
            )}
            {client.marital_status && (
              <span className="text-sm capitalize" style={{ color: '#6B6B6B' }}>
                {client.marital_status}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 mt-4" style={{ borderBottom: '1px solid #E5E1DA' }}>
        {(['profile', 'diagnostics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm font-medium transition-all capitalize"
            style={{
              color: activeTab === tab ? '#B87333' : '#6B6B6B',
              borderBottom: activeTab === tab ? '2px solid #B87333' : '2px solid transparent',
              fontFamily: "'Inter', sans-serif",
              marginBottom: -1,
              backgroundColor: 'transparent',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <ProfileTab client={client} onUpdated={fetchClient} />
      )}

      {activeTab === 'diagnostics' && (
        <DiagnosticsTab client={client} />
      )}
    </div>
  );
}
