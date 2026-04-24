'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  tenantId: string;
}

const NAMESPACE_OPTIONS = [
  { value: 'primary_law', label: 'Primary Law' },
  { value: 'secondary_law', label: 'Secondary Law' },
  { value: 'case_law', label: 'Case Law' },
  { value: 'irs_guidance', label: 'IRS Guidance' },
  { value: 'practitioner_patterns', label: 'Practitioner Patterns' },
];

export default function QuickIngestTab({ tenantId }: Props) {
  const [content, setContent] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [description, setDescription] = useState('');
  const [namespace, setNamespace] = useState('primary_law');
  const [confidenceTier, setConfidenceTier] = useState(2);
  const [citation, setCitation] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [successChunks, setSuccessChunks] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleIngest = async () => {
    if (!content.trim()) { setError('Content is required.'); return; }
    setIngesting(true);
    setError('');
    setSuccessChunks(null);
    try {
      const result = await api.ingest({
        tenant_id: tenantId,
        content,
        source_id: sourceId,
        description,
        namespace,
        confidence_tier: confidenceTier,
        source_type: 'note',
        citation,
      });
      setSuccessChunks(result.chunks_added ?? 1);
      setContent('');
      setCitation('');
      setSourceId('');
      setDescription('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ingest failed.');
    } finally {
      setIngesting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-md text-sm outline-none";
  const inputStyle = { border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" };

  return (
    <div className="space-y-3">
      {error && (
        <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: '#fef2f2', color: '#C0392B' }}>
          {error}
        </div>
      )}
      {successChunks !== null && (
        <div className="flex items-center gap-2 px-3 py-2 rounded text-sm" style={{ backgroundColor: '#F0FDF4', color: '#3A6B4B', border: '1px solid #86EFAC' }}>
          <Check size={16} />
          {successChunks} chunks added to your knowledge base
        </div>
      )}

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Content <span style={{ color: '#C0392B' }}>*</span></label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
          style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif", minHeight: 200 }}
          placeholder="Paste text, notes, or observations..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Source ID</label>
          <input type="text" value={sourceId} onChange={e => setSourceId(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g., my-note-001" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Description</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Namespace</label>
          <select value={namespace} onChange={e => setNamespace(e.target.value)} className={inputClass} style={inputStyle}>
            {NAMESPACE_OPTIONS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Confidence Tier (1-4)</label>
          <select value={confidenceTier} onChange={e => setConfidenceTier(Number(e.target.value))} className={inputClass} style={inputStyle}>
            {[1, 2, 3, 4].map(n => <option key={n} value={n}>Tier {n}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Citation</label>
        <input type="text" value={citation} onChange={e => setCitation(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g., IRC §2036(a)" />
      </div>

      <button
        onClick={handleIngest}
        disabled={ingesting}
        className="px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-colors"
        style={{ backgroundColor: ingesting ? '#9A6425' : '#B8860B', fontFamily: "'Inter', sans-serif" }}
      >
        {ingesting ? 'Ingesting...' : 'Ingest'}
      </button>
    </div>
  );
}
