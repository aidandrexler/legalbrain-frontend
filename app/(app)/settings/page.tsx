'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import FirmInfoCard from '@/components/settings/FirmInfoCard';
import ApiConfigCard from '@/components/settings/ApiConfigCard';
import IntegrationsCard from '@/components/settings/IntegrationsCard';

interface OAuthToken {
  id: string;
  provider: string;
}

interface DigestResult {
  patterns_detected?: number;
  improvements_proposed?: number;
  population_analytics?: string;
  [key: string]: unknown;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant_id, tenant, loading: tenantLoading, refreshTenant } = useTenant();
  const supabase = createClient();

  const [oauthTokens, setOauthTokens] = useState<OAuthToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);

  const [connectedBanner, setConnectedBanner] = useState<string | null>(null);

  const [rateMonth, setRateMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [rate7520, setRate7520] = useState('');
  const [savingRate, setSavingRate] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);

  const [digestResult, setDigestResult] = useState<DigestResult | null>(null);
  const [runningDigest, setRunningDigest] = useState(false);

  const [provisioningDemo, setProvisioningDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');

  useEffect(() => {
    const connected = searchParams.get('connected');
    if (connected === 'clio') setConnectedBanner('Clio connected successfully.');
    else if (connected === 'leap') setConnectedBanner('LEAP connected successfully.');
  }, [searchParams]);

  const fetchTokens = useCallback(async () => {
    if (!tenant_id) return;
    const { data } = await supabase
      .from('oauth_tokens')
      .select('id, provider')
      .eq('tenant_id', tenant_id);
    setOauthTokens((data as OAuthToken[]) ?? []);
    setLoadingTokens(false);
  }, [tenant_id, supabase]);

  useEffect(() => {
    if (!tenantLoading && tenant_id) fetchTokens();
  }, [tenant_id, tenantLoading, fetchTokens]);

  const saveRate = async () => {
    if (!tenant_id || !rate7520) return;
    setSavingRate(true);
    await supabase.from('rate_table').insert({
      tenant_id,
      effective_month: rateMonth,
      rate_7520: parseFloat(rate7520),
      afr_mid: 0,
    });
    setSavingRate(false);
    setRateSaved(true);
    setTimeout(() => setRateSaved(false), 3000);
  };

  const runDigest = async () => {
    if (!tenant_id) return;
    setRunningDigest(true);
    setDigestResult(null);
    try {
      const result = await api.runDigest(tenant_id);
      setDigestResult(result as DigestResult);
    } catch {}
    setRunningDigest(false);
  };

  const provisionDemo = async () => {
    if (!tenant_id) return;
    setProvisioningDemo(true);
    setDemoMessage('');
    try {
      await api.provisionSandbox(tenant_id);
      setDemoMessage('Demo sandbox provisioned successfully. Refresh to see demo data.');
    } catch {
      setDemoMessage('Failed to provision demo sandbox.');
    }
    setProvisioningDemo(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (tenantLoading) {
    return (
      <div className="px-8 py-8">
        <div className="h-8 w-32 rounded mb-6 animate-pulse" style={{ backgroundColor: '#E5E1DA' }} />
        <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>Loading settings...</p>
      </div>
    );
  }

  if (!tenant || !tenant_id) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>No tenant found.</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <h1
        className="text-3xl font-bold mb-6"
        style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
      >
        Settings
      </h1>

      {connectedBanner && (
        <div
          className="mb-4 px-4 py-3 rounded-md text-sm font-medium"
          style={{ backgroundColor: '#DCFCE7', color: '#3A6B4B', border: '1px solid #86EFAC' }}
        >
          {connectedBanner}
          <button
            onClick={() => setConnectedBanner(null)}
            className="ml-3 text-xs underline"
            style={{ color: '#3A6B4B' }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-5">
        <FirmInfoCard tenant={tenant} onSaved={refreshTenant} />

        <ApiConfigCard tenant={tenant} onSaved={refreshTenant} />

        {!loadingTokens && (
          <IntegrationsCard
            tenantId={tenant_id}
            oauthTokens={oauthTokens}
            onRefresh={fetchTokens}
          />
        )}

        <div className="bg-white rounded-lg p-5 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
          <h2 className="font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 18 }}>
            System
          </h2>

          <div className="mb-5 pb-5" style={{ borderBottom: '1px solid #E5E1DA' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#2C2C2C' }}>§7520 Rate Entry</h3>
            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Effective Month</label>
                <input
                  type="month"
                  value={rateMonth}
                  onChange={e => setRateMonth(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm outline-none"
                  style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>§7520 Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={rate7520}
                  onChange={e => setRate7520(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm outline-none"
                  style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif", width: 120 }}
                  placeholder="4.20"
                />
              </div>
              <button
                onClick={saveRate}
                disabled={savingRate || !rate7520}
                className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: savingRate ? '#9A6425' : '#B87333', fontFamily: "'Inter', sans-serif" }}
              >
                {savingRate ? 'Saving...' : 'Save Rate'}
              </button>
              {rateSaved && (
                <span className="text-sm" style={{ color: '#3A6B4B' }}>Saved.</span>
              )}
            </div>
          </div>

          <div className="mb-5 pb-5" style={{ borderBottom: '1px solid #E5E1DA' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#2C2C2C' }}>Intelligence Digest</h3>
            <p className="text-xs mb-3" style={{ color: '#6B6B6B' }}>
              Analyze attorney correction patterns to propose system improvements.
            </p>
            <button
              onClick={runDigest}
              disabled={runningDigest}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: runningDigest ? '#9A6425' : '#B87333', fontFamily: "'Inter', sans-serif" }}
            >
              {runningDigest ? 'Running...' : 'Run Intelligence Digest'}
            </button>
            {digestResult && (
              <div className="mt-3 px-3 py-3 rounded-md text-sm space-y-1" style={{ backgroundColor: '#F4F2EE', fontFamily: "'Inter', sans-serif" }}>
                <p style={{ color: '#2C2C2C' }}>
                  Patterns detected: <strong>{digestResult.patterns_detected ?? 'N/A'}</strong>
                </p>
                <p style={{ color: '#2C2C2C' }}>
                  Improvements proposed: <strong>{digestResult.improvements_proposed ?? 'N/A'}</strong>
                </p>
                {digestResult.population_analytics && (
                  <p style={{ color: '#2C2C2C' }}>
                    Population analytics: <strong>{digestResult.population_analytics}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#2C2C2C' }}>Demo Sandbox</h3>
            <p className="text-xs mb-3" style={{ color: '#6B6B6B' }}>
              Provision a fresh demo environment with sample clients and data.
            </p>
            <button
              onClick={provisionDemo}
              disabled={provisioningDemo}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: provisioningDemo ? '#9A6425' : '#B87333', fontFamily: "'Inter', sans-serif" }}
            >
              {provisioningDemo ? 'Provisioning...' : 'Provision Demo Sandbox'}
            </button>
            {demoMessage && (
              <p className="mt-2 text-sm" style={{ color: demoMessage.includes('Failed') ? '#C0392B' : '#3A6B4B', fontFamily: "'Inter', sans-serif" }}>
                {demoMessage}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg p-5" style={{ border: '2px solid #C0392B', backgroundColor: '#fff' }}>
          <h2 className="font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#C0392B', fontSize: 18 }}>
            Danger Zone
          </h2>
          <p className="text-sm mb-4" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>
            This will sign you out of LegalBrain AI immediately.
          </p>
          <button
            onClick={signOut}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#C0392B', fontFamily: "'Inter', sans-serif" }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
