'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';

interface GlobalChunk {
  source_title: string;
}

interface PlatformDiagnostic {
  id: string;
  name: string;
  version: number;
  system_prompt: string;
}

interface TenantRow {
  id: string;
  firm_name: string;
  attorney_name: string;
  email: string;
  created_at: string;
  sandbox_provisioned: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const { tenant, loading } = useTenant();
  const [adminKey, setAdminKey] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [globalChunks, setGlobalChunks] = useState<GlobalChunk[]>([]);
  const [diagnostics, setDiagnostics] = useState<PlatformDiagnostic[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [editor, setEditor] = useState<PlatformDiagnostic | null>(null);
  const [seedForm, setSeedForm] = useState({
    content: '',
    namespace: 'primary_law',
    confidence_tier: 2,
    source_id: '',
    description: '',
    citation: '',
  });
  const [extractionJobId, setExtractionJobId] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!tenant?.is_platform_admin) {
      router.replace('/dashboard');
    }
  }, [loading, router, tenant]);

  useEffect(() => {
    const savedKey = sessionStorage.getItem('forge_admin_key');
    if (savedKey) {
      setAdminKey(savedKey);
      setAdminUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!tenant?.is_platform_admin) return;

    const load = async () => {
      const chunkResponse = adminKey ? await api.getGlobalChunks(adminKey) : { chunks: [] };
      setGlobalChunks((chunkResponse?.chunks ?? []) as GlobalChunk[]);

      const diagResponse = await api.getPlatformDiagnostics();
      setDiagnostics((diagResponse?.diagnostics ?? []) as PlatformDiagnostic[]);

      const { data: tenantRows } = await supabase
        .from('tenants')
        .select('id, firm_name, attorney_name, email, created_at, sandbox_provisioned')
        .order('created_at', { ascending: false });
      setTenants((tenantRows as TenantRow[]) ?? []);
    };

    void load();
  }, [adminKey, supabase, tenant?.is_platform_admin]);

  const groupedChunks = useMemo(() => {
    return globalChunks.reduce<Record<string, number>>((acc, chunk) => {
      const key = chunk.source_title || 'Unknown Source';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [globalChunks]);

  if (loading || !tenant?.is_platform_admin) {
    return null;
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F7F5F0', fontFamily: "'Inter', sans-serif" }}>
      <aside className="w-64 p-5 text-white" style={{ backgroundColor: '#0F1923' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}>Forge Admin</h1>
        <nav className="mt-6 space-y-2 text-sm">
          <a href="#global-brain" className="block" style={{ color: '#B8860B' }}>Global Brain</a>
          <a href="#platform-diagnostics" className="block text-white/80">Platform Diagnostics</a>
          <a href="#tenants" className="block text-white/80">Tenants</a>
        </nav>
      </aside>

      <main className="flex-1 p-6 space-y-6">
        <div>
          <label className="block text-sm mb-1" style={{ color: '#475569' }}>Admin Key</label>
          <div className="flex items-center gap-2 max-w-xl">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => {
                setAdminKey(e.target.value);
                if (!e.target.value) setAdminUnlocked(false);
              }}
              className="w-full rounded-md px-3 py-2"
              style={{ border: '1px solid #E2E8F0' }}
              placeholder="Enter admin key"
            />
            <button
              type="button"
              onClick={() => {
                if (!adminKey) return;
                sessionStorage.setItem('forge_admin_key', adminKey);
                setAdminUnlocked(true);
              }}
              className="rounded-md px-3 py-2 text-sm text-white"
              style={{ backgroundColor: '#B8860B' }}
            >
              Unlock
            </button>
          </div>
        </div>

        <section id="global-brain" className="rounded-xl border bg-white p-5" style={{ borderColor: '#E2E8F0' }}>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0F1923' }}>Global Brain</h2>
          <p className="mt-2 text-sm" style={{ color: '#64748B' }}>Total Global Chunks: {globalChunks.length}</p>
          <div className="mt-3 space-y-1 text-sm">
            {Object.entries(groupedChunks).map(([source, count]) => (
              <p key={source} style={{ color: '#334155' }}>{source}: {count}</p>
            ))}
          </div>

          {adminUnlocked ? (
            <div className="mt-5 grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold" style={{ color: '#0F1923' }}>Seed Global Brain</h3>
                <textarea
                  value={seedForm.content}
                  onChange={(e) => setSeedForm((s) => ({ ...s, content: e.target.value }))}
                  className="w-full rounded-md p-2 text-sm"
                  rows={6}
                  style={{ border: '1px solid #E2E8F0' }}
                />
                <select
                  value={seedForm.namespace}
                  onChange={(e) => setSeedForm((s) => ({ ...s, namespace: e.target.value }))}
                  className="w-full rounded-md p-2 text-sm"
                  style={{ border: '1px solid #E2E8F0' }}
                >
                  {['primary_law', 'secondary_law', 'case_law', 'irs_guidance', 'practitioner_patterns'].map((namespace) => (
                    <option key={namespace} value={namespace}>{namespace}</option>
                  ))}
                </select>
                <select
                  value={seedForm.confidence_tier}
                  onChange={(e) => setSeedForm((s) => ({ ...s, confidence_tier: Number(e.target.value) }))}
                  className="w-full rounded-md p-2 text-sm"
                  style={{ border: '1px solid #E2E8F0' }}
                >
                  {[1, 2, 3, 4].map((tier) => <option key={tier} value={tier}>Confidence Tier {tier}</option>)}
                </select>
                <input value={seedForm.source_id} onChange={(e) => setSeedForm((s) => ({ ...s, source_id: e.target.value }))} className="w-full rounded-md px-3 py-2 text-sm" style={{ border: '1px solid #E2E8F0' }} placeholder="Source ID" />
                <input value={seedForm.description} onChange={(e) => setSeedForm((s) => ({ ...s, description: e.target.value }))} className="w-full rounded-md px-3 py-2 text-sm" style={{ border: '1px solid #E2E8F0' }} placeholder="Description" />
                <input value={seedForm.citation} onChange={(e) => setSeedForm((s) => ({ ...s, citation: e.target.value }))} className="w-full rounded-md px-3 py-2 text-sm" style={{ border: '1px solid #E2E8F0' }} placeholder="Citation" />
                <button
                  type="button"
                  onClick={() => api.seedGlobal(seedForm, adminKey)}
                  className="rounded-md px-3 py-2 text-sm text-white"
                  style={{ backgroundColor: '#B8860B' }}
                >
                  Seed to Global Brain
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold" style={{ color: '#0F1923' }}>Promote Extraction</h3>
                <input
                  value={extractionJobId}
                  onChange={(e) => setExtractionJobId(e.target.value)}
                  className="w-full rounded-md px-3 py-2 text-sm"
                  style={{ border: '1px solid #E2E8F0' }}
                  placeholder="Extraction job ID"
                />
                <button
                  type="button"
                  onClick={() => api.promoteExtraction(extractionJobId, adminKey)}
                  className="rounded-md px-3 py-2 text-sm text-white"
                  style={{ backgroundColor: '#B8860B' }}
                >
                  Promote All Chunks to Global
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm" style={{ color: '#64748B' }}>Enter admin key to unlock controls.</p>
          )}
        </section>

        <section id="platform-diagnostics" className="rounded-xl border bg-white p-5" style={{ borderColor: '#E2E8F0' }}>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0F1923' }}>Platform Diagnostics</h2>
          <div className="mt-4 space-y-3">
            {diagnostics.map((diag) => (
              <div key={diag.id} className="rounded-md border p-3" style={{ borderColor: '#E2E8F0' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: '#0F1923' }}>{diag.name}</p>
                    <p className="text-xs" style={{ color: '#64748B' }}>Version {diag.version}</p>
                  </div>
                  {adminUnlocked ? (
                    <button
                      type="button"
                      onClick={() => setEditor(diag)}
                      className="rounded-md px-3 py-1.5 text-sm text-white"
                      style={{ backgroundColor: '#B8860B' }}
                    >
                      Edit
                    </button>
                  ) : (
                    <span className="text-xs" style={{ color: '#64748B' }}>Enter admin key to unlock controls.</span>
                  )}
                </div>
                <p className="mt-2 text-sm line-clamp-2" style={{ color: '#475569' }}>{diag.system_prompt}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="tenants" className="rounded-xl border bg-white p-5" style={{ borderColor: '#E2E8F0' }}>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0F1923' }}>Tenants</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: '#64748B' }}>
                  <th className="text-left py-2">Firm</th>
                  <th className="text-left py-2">Attorney</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Created</th>
                  <th className="text-left py-2">Sandbox</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((item) => (
                  <tr key={item.id} className="border-t" style={{ borderColor: '#E2E8F0', color: '#334155' }}>
                    <td className="py-2">{item.firm_name}</td>
                    <td>{item.attorney_name}</td>
                    <td>{item.email}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>{item.sandbox_provisioned ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {editor && adminUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <div className="w-[760px] max-w-[95vw] rounded-xl bg-white p-5">
            <h3 className="text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0F1923' }}>
              Edit {editor.name}
            </h3>
            <p className="text-sm" style={{ color: '#64748B' }}>Current version: {editor.version}</p>
            <textarea
              value={editor.system_prompt}
              onChange={(e) => setEditor((prev) => (prev ? { ...prev, system_prompt: e.target.value } : null))}
              className="mt-3 h-72 w-full rounded-md p-3 text-sm"
              style={{ border: '1px solid #E2E8F0' }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditor(null)} className="rounded-md px-3 py-2 text-sm" style={{ border: '1px solid #E2E8F0' }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editor) return;
                  await supabase
                    .from('platform_diagnostics')
                    .update({
                      system_prompt: editor.system_prompt,
                      version: (editor.version ?? 0) + 1,
                    })
                    .eq('id', editor.id);
                  setDiagnostics((items) =>
                    items.map((item) =>
                      item.id === editor.id
                        ? { ...item, system_prompt: editor.system_prompt, version: (item.version ?? 0) + 1 }
                        : item
                    )
                  );
                  setEditor(null);
                }}
                className="rounded-md px-3 py-2 text-sm text-white"
                style={{ backgroundColor: '#B8860B' }}
              >
                Save Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
