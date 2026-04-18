'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import ExtractionTab from '@/components/brain/ExtractionTab';
import QuickIngestTab from '@/components/brain/QuickIngestTab';
import SystemImprovements from '@/components/brain/SystemImprovements';

interface KnowledgeEntry {
  source: string;
  source_title: string;
  namespace: string;
  confidence_tier: number;
  ingested_at: string;
}

interface Improvement {
  id: string;
  diagnostic_type: string;
  proposed_rule: string;
  trigger_count: number;
  status: string;
  final_rule: string;
  approved_at: string | null;
  created_at: string;
}

const NAMESPACE_LABELS: Record<string, string> = {
  primary_law: 'Primary Law',
  secondary_law: 'Secondary Law',
  case_law: 'Case Law',
  irs_guidance: 'IRS Guidance',
  practitioner_patterns: 'Practitioner Patterns',
};

export default function BrainPage() {
  const { tenant_id, loading: tenantLoading } = useTenant();
  const supabase = createClient();

  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [lastIngestion, setLastIngestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAddTab, setActiveAddTab] = useState<'extraction' | 'quick'>('extraction');

  const fetchData = useCallback(async () => {
    if (!tenant_id) return;
    setLoading(true);

    const [
      { data: knowledgeData },
      { data: lastJobData },
      { data: improvementsData },
    ] = await Promise.all([
      supabase
        .from('legal_knowledge')
        .select('source, source_title, namespace, confidence_tier, ingested_at')
        .eq('tenant_id', tenant_id)
        .eq('is_superseded', false)
        .order('ingested_at', { ascending: false }),
      supabase
        .from('extraction_jobs')
        .select('updated_at')
        .eq('tenant_id', tenant_id)
        .eq('status', 'complete')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('system_improvements')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false }),
    ]);

    setKnowledgeEntries((knowledgeData as KnowledgeEntry[]) ?? []);
    setLastIngestion((lastJobData as { updated_at: string } | null)?.updated_at ?? null);
    setImprovements((improvementsData as Improvement[]) ?? []);
    setLoading(false);
  }, [tenant_id, supabase]);

  useEffect(() => {
    if (!tenantLoading && tenant_id) fetchData();
  }, [tenant_id, tenantLoading, fetchData]);

  const handleSupersede = async (source: string) => {
    if (!tenant_id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('legal_knowledge').update({ is_superseded: true }).eq('source', source).eq('tenant_id', tenant_id);
    fetchData();
  };

  const namespaceCounts: Record<string, number> = {};
  knowledgeEntries.forEach(e => {
    namespaceCounts[e.namespace] = (namespaceCounts[e.namespace] ?? 0) + 1;
  });

  const uniqueSources = Array.from(
    new Map(knowledgeEntries.map(e => [e.source, e])).values()
  );

  const stats = [
    { label: 'Total Chunks', value: knowledgeEntries.length },
    { label: 'Primary Law', value: namespaceCounts['primary_law'] ?? 0 },
    { label: 'Secondary Law', value: namespaceCounts['secondary_law'] ?? 0 },
    { label: 'Practitioner', value: namespaceCounts['practitioner_patterns'] ?? 0 },
  ];

  if (tenantLoading || loading) {
    return (
      <div className="px-8 py-8">
        <div className="h-8 w-48 rounded mb-6 animate-pulse" style={{ backgroundColor: '#E5E1DA' }} />
        <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>Loading knowledge base...</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-start justify-between mb-6">
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
        >
          Knowledge Base
        </h1>
        {lastIngestion && (
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            Last ingestion: {formatDate(lastIngestion)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
            <p className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}>{value}</p>
            <p className="text-sm" style={{ color: '#6B6B6B' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg p-5 shadow-sm mb-6" style={{ border: '1px solid #E5E1DA' }}>
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
        >
          Add Knowledge
        </h2>

        <div className="flex gap-1 mb-5" style={{ borderBottom: '1px solid #E5E1DA' }}>
          {([
            { key: 'extraction', label: 'Full Extraction' },
            { key: 'quick', label: 'Quick Ingest' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveAddTab(key)}
              className="px-4 py-2.5 text-sm font-medium transition-all"
              style={{
                color: activeAddTab === key ? '#B87333' : '#6B6B6B',
                borderBottom: activeAddTab === key ? '2px solid #B87333' : '2px solid transparent',
                fontFamily: "'Inter', sans-serif",
                marginBottom: -1,
                backgroundColor: 'transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeAddTab === 'extraction' && tenant_id && (
          <ExtractionTab tenantId={tenant_id} />
        )}
        {activeAddTab === 'quick' && tenant_id && (
          <QuickIngestTab tenantId={tenant_id} />
        )}
      </div>

      <div className="bg-white rounded-lg p-5 shadow-sm mb-6" style={{ border: '1px solid #E5E1DA' }}>
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
        >
          Your Knowledge Base
        </h2>

        {uniqueSources.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: '#6B6B6B' }}>
            No knowledge sources yet. Add your first source above.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md" style={{ border: '1px solid #E5E1DA' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E1DA', backgroundColor: '#F4F2EE' }}>
                  {['Source Title', 'Namespace', 'Tier', 'Count', 'Date', 'Actions'].map(col => (
                    <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6B6B' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueSources.map((entry) => {
                  const count = knowledgeEntries.filter(e => e.source === entry.source).length;
                  return (
                    <tr key={entry.source} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #E5E1DA' }}>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm font-medium truncate" style={{ color: '#2C2C2C' }}>{entry.source_title || entry.source}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded font-medium"
                          style={{ backgroundColor: 'rgba(184,115,51,0.15)', color: '#B87333' }}
                        >
                          {NAMESPACE_LABELS[entry.namespace] ?? entry.namespace}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#6B6B6B' }}>Tier {entry.confidence_tier}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#6B6B6B' }}>{count}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#6B6B6B' }}>{formatDate(entry.ingested_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSupersede(entry.source)}
                          className="text-xs px-2.5 py-1 rounded transition-colors"
                          style={{ border: '1px solid #C0392B', color: '#C0392B', backgroundColor: 'transparent' }}
                        >
                          Supersede
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tenant_id && (
        <SystemImprovements
          tenantId={tenant_id}
          improvements={improvements}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
