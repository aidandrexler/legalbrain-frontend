'use client';

import { createClient } from '@/lib/supabase/client';

interface OAuthToken {
  id: string;
  provider: string;
}

interface Props {
  tenantId: string;
  oauthTokens: OAuthToken[];
  onRefresh: () => void;
}

export default function IntegrationsCard({ tenantId, oauthTokens, onRefresh }: Props) {
  const supabase = createClient();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  const isConnected = (provider: string) => oauthTokens.some(t => t.provider === provider);

  const connect = (provider: string) => {
    window.location.href = `${apiUrl}/api/v1/oauth/${provider}/connect?tenant_id=${tenantId}`;
  };

  const disconnect = async (provider: string) => {
    await supabase
      .from('oauth_tokens')
      .delete()
      .eq('provider', provider)
      .eq('tenant_id', tenantId);
    onRefresh();
  };

  const integrations = [
    { provider: 'clio', name: 'Clio', description: 'Import clients and matters from Clio Manage.' },
    { provider: 'leap', name: 'LEAP', description: 'Sync matters from LEAP Legal Software.' },
  ];

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
      <h2 className="font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 18 }}>
        Integrations
      </h2>
      <div className="divide-y" style={{ borderColor: '#E5E1DA' }}>
        {integrations.map(({ provider, name, description }) => {
          const connected = isConnected(provider);
          return (
            <div key={provider} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>{name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>{description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{
                    backgroundColor: connected ? '#DCFCE7' : '#F4F2EE',
                    color: connected ? '#3A6B4B' : '#6B6B6B',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: connected ? '#3A6B4B' : '#9CA3AF' }} />
                  {connected ? 'Connected' : 'Not Connected'}
                </span>
                {connected ? (
                  <button
                    onClick={() => disconnect(provider)}
                    className="text-xs px-3 py-1.5 rounded transition-colors"
                    style={{ border: '1px solid #C0392B', color: '#C0392B', backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif" }}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connect(provider)}
                    className="text-xs px-3 py-1.5 rounded font-medium text-white transition-colors"
                    style={{ backgroundColor: '#B87333', fontFamily: "'Inter', sans-serif" }}
                  >
                    Connect {name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
