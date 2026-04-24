'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const RISK_COLORS: Record<string, string> = {
  red: '#C0392B',
  amber: '#D97706',
  green: '#166534',
  slate: '#94A3B8',
};

interface ClientLike {
  id: string;
  first_name?: string;
  last_name?: string;
}

interface SelectedNodeLike {
  data?: {
    label?: string;
    risk_level?: string;
    details?: string;
    recommended_actions?: string[];
  };
}

interface PreBriefData {
  summary?: string;
  changes_since_last_visit?: string[];
  unprompted_flags?: string[];
  recommended_actions?: string[];
}

interface CouncilBriefingPanelProps {
  client: ClientLike;
  tenant_id: string;
  selectedNode: SelectedNodeLike | null;
}

function SectionList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold" style={{ color: '#0F1923' }}>
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: '#64748B' }}>
          No updates available.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="text-sm" style={{ color: '#334155' }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CouncilBriefingPanel({ client, tenant_id, selectedNode }: CouncilBriefingPanelProps) {
  const [loading, setLoading] = useState(true);
  const [preBrief, setPreBrief] = useState<PreBriefData | null>(null);

  useEffect(() => {
    const loadPreBrief = async () => {
      setLoading(true);
      const response = await api.getPreBrief(client.id, tenant_id);
      setPreBrief(response ?? null);
      setLoading(false);
    };

    void loadPreBrief();
  }, [client.id, tenant_id]);

  if (loading) {
    return (
      <aside className="h-full w-[320px] border-l px-5 py-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
        <p
          className="text-xl font-semibold"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: '#B8860B' }}
        >
          FORGE COUNCIL
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Loader2 className="animate-spin" size={18} color="#B8860B" />
          <p className="text-sm" style={{ color: '#475569' }}>
            Forge is reviewing this file...
          </p>
        </div>
      </aside>
    );
  }

  const selectedRisk = selectedNode?.data?.risk_level ?? 'slate';
  const selectedActions = selectedNode?.data?.recommended_actions ?? [];

  return (
    <aside className="h-full w-[320px] border-l px-5 py-6 overflow-y-auto" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
      <div className="mb-5">
        <p
          className="text-2xl font-semibold tracking-wide"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: '#B8860B' }}
        >
          FORGE COUNCIL
        </p>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
          {client.first_name} {client.last_name}
        </p>
      </div>

      {selectedNode ? (
        <div className="space-y-4">
          <section>
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#64748B' }}>
              Selected Structure Node
            </p>
            <h3 className="text-lg font-semibold" style={{ color: '#0F1923' }}>
              {selectedNode.data?.label ?? 'Node'}
            </h3>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 mt-2 text-xs font-semibold"
              style={{ backgroundColor: `${RISK_COLORS[selectedRisk]}20`, color: RISK_COLORS[selectedRisk] ?? '#94A3B8' }}
            >
              {selectedRisk.toUpperCase()} RISK
            </span>
            <p className="text-sm mt-3" style={{ color: '#334155' }}>
              {selectedNode.data?.details ?? 'No additional details for this node yet.'}
            </p>
          </section>
          <SectionList title="Recommended Actions" items={selectedActions} />
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#B8860B' }}
          >
            Open Forge Actions
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <section>
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#64748B' }}>
              Pre-Brief
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>
              {preBrief?.summary ?? 'No pre-brief is available for this client yet.'}
            </p>
          </section>
          <SectionList
            title="What Changed Since Last Visit"
            items={preBrief?.changes_since_last_visit ?? []}
          />
          <SectionList
            title="What Forge Flagged Unprompted"
            items={preBrief?.unprompted_flags ?? []}
          />
          <SectionList
            title="Recommended Actions For This Session"
            items={preBrief?.recommended_actions ?? []}
          />
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#B8860B' }}
          >
            Begin Session Actions
          </button>
        </div>
      )}
    </aside>
  );
}
