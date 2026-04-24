'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, ScanSearch } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, STATUS_COLORS } from '@/lib/utils';
import ProfileTab from '@/components/clients/detail/ProfileTab';
import DiagnosticsTab from '@/components/clients/detail/DiagnosticsTab';
import EstateCanvas from '@/components/canvas/EstateCanvas';
import CouncilBriefingPanel from '@/components/canvas/CouncilBriefingPanel';
import { api } from '@/lib/api';

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

interface ActionItem {
  id: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { tenant_id, loading: tenantLoading } = useTenant();
  const supabase = createClient();

  const [client, setClient] = useState<Client | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'forge_actions' | 'documents' | 'profile'>('diagnostics');
  const [selectedNode, setSelectedNode] = useState<any>(null);

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

  const fetchActionItems = useCallback(async () => {
    if (!tenant_id) return;
    const { data } = await supabase
      .from('action_items')
      .select('id, title, description, urgency, status')
      .eq('tenant_id', tenant_id)
      .eq('client_id', params.id)
      .order('created_at', { ascending: false });
    setActionItems((data as ActionItem[]) ?? []);
  }, [params.id, supabase, tenant_id]);

  useEffect(() => {
    if (!tenantLoading && tenant_id) {
      void fetchClient();
      void fetchActionItems();
    }
  }, [tenant_id, tenantLoading, fetchActionItems, fetchClient]);

  if (tenantLoading || loading) {
    return (
      <div className="h-[80vh] m-6 animate-pulse rounded-xl" style={{ backgroundColor: '#E2E8F0' }} />
    );
  }

  if (notFound || !client) {
    return (
      <div className="px-8 py-8">
        <p className="text-base mb-4" style={{ color: '#0F1923', fontFamily: "'Inter', sans-serif" }}>Client not found.</p>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ backgroundColor: '#B8860B', fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={16} /> Back to Clients
        </Link>
      </div>
    );
  }

  const runRiskArchitecture = async () => {
    if (!tenant_id || !client) return;
    await api.runDiagnostic({
      tenant_id,
      client_id: client.id,
      diagnostic_type: 'risk_architecture',
      include_badge_check: true,
    });
    setActiveTab('diagnostics');
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F7F5F0', fontFamily: "'Inter', sans-serif" }}>
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
        <div className="flex items-center gap-4">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1 text-sm"
            style={{ color: '#64748B' }}
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <h1
            className="font-semibold leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0F1923', fontSize: 38 }}
          >
            {client.first_name} {client.last_name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[client.client_status] ?? 'bg-gray-100 text-gray-700'}`}
          >
            {client.client_status.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}
          </span>
          <span className="text-sm" style={{ color: '#64748B' }}>
            {formatCurrency(client.estate_size_estimate || 0)}
          </span>
          <button
            onClick={runRiskArchitecture}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#B8860B' }}
          >
            <ScanSearch size={16} /> Analyze Structure
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className="rounded-md px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#B8860B' }}
          >
            View All Diagnostics
          </button>
          <button
            onClick={() => setSelectedNode(null)}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#B8860B' }}
          >
            <Plus size={16} /> Add to Structure
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-6 py-4">
        <div className="h-[56vh] min-h-[420px] flex overflow-hidden rounded-xl border" style={{ borderColor: '#E2E8F0', display: 'flex' }}>
          <div className="flex-1 min-w-0" style={{ flex: 1 }}>
            <EstateCanvas client={client} tenant_id={tenant_id!} onNodeSelect={setSelectedNode} />
          </div>
          <div style={{ width: 320, flexShrink: 0 }}>
            <CouncilBriefingPanel client={client} tenant_id={tenant_id!} selectedNode={selectedNode} />
          </div>
        </div>

        <div className="mt-4 h-[calc(100%-56vh-1rem)] min-h-[240px] overflow-hidden rounded-xl border bg-white" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex gap-1 px-4 pt-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
            {(['diagnostics', 'forge_actions', 'documents', 'profile'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2.5 text-sm font-medium transition-all"
                style={{
                  color: activeTab === tab ? '#B8860B' : '#64748B',
                  borderBottom: activeTab === tab ? '2px solid #B8860B' : '2px solid transparent',
                  marginBottom: -1,
                  textTransform: 'none',
                }}
              >
                {tab === 'forge_actions'
                  ? 'Forge Actions'
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-4 h-[calc(100%-56px)] overflow-y-auto">
            {activeTab === 'diagnostics' && (
              <DiagnosticsTab client={{ ...client, tenant_id: tenant_id! }} />
            )}
            {activeTab === 'forge_actions' && (
              <div className="space-y-2">
                {actionItems.length === 0 ? (
                  <p className="text-sm" style={{ color: '#64748B' }}>No Forge actions yet.</p>
                ) : (
                  actionItems.map((item) => (
                    <div key={item.id} className="rounded-md border px-3 py-2" style={{ borderColor: '#E2E8F0' }}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold" style={{ color: '#0F1923' }}>{item.title}</p>
                        <span className="text-xs rounded-full px-2 py-0.5" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
                          {item.urgency}
                        </span>
                      </div>
                      <p className="mt-1 text-sm" style={{ color: '#475569' }}>{item.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeTab === 'documents' && (
              <p className="text-sm" style={{ color: '#64748B' }}>
                Document intelligence coming soon
              </p>
            )}
            {activeTab === 'profile' && (
              <ProfileTab client={{ ...client, tenant_id: tenant_id! }} onUpdated={fetchClient} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
