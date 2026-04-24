'use client';

import { useState, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  tenantId: string;
}

const SOURCE_TYPES = ['Treatise', 'Statute', 'CLE', 'Case Law', 'Article', 'Personal Observation', 'Shadowing Note'];
const AUTHORITY_LEVELS = ['Major Treatise', 'CLE', 'Case Law', 'Practitioner Note'];
const CONFIDENCE_TIER_DESCRIPTIONS: Record<number, string> = {
  1: 'Tier 1 — Highest confidence, primary law',
  2: 'Tier 2 — Secondary authority',
  3: 'Tier 3 — Practitioner patterns',
  4: 'Tier 4 — Observations / notes',
};
const EXTRACTION_DEPTHS = [
  { value: 2, label: 'Tier 2 - Standard' },
  { value: 1, label: 'Tier 1 - Deep' },
  { value: 3, label: 'Tier 3 - Fast' },
];

export default function ExtractionTab({ tenantId }: Props) {
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceType, setSourceType] = useState('Treatise');
  const [authorityLevel, setAuthorityLevel] = useState('Major Treatise');
  const [confidenceTier, setConfidenceTier] = useState(2);
  const [jurisdiction, setJurisdiction] = useState('FL');
  const [userSourceId, setUserSourceId] = useState('');
  const [extractionDepth, setExtractionDepth] = useState(2);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('paste');
  const [pastedText, setPastedText] = useState('');

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [jobProgress, setJobProgress] = useState(0);
  const [jobCurrentStep, setJobCurrentStep] = useState('');
  const [jobChunks, setJobChunks] = useState(0);
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [running, setRunning] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const startExtraction = async () => {
    if (!sourceTitle.trim()) {
      setExtractionError('Source title is required.');
      return;
    }
    if (inputMode === 'paste' && !pastedText.trim()) {
      setExtractionError('Please paste or upload content.');
      return;
    }

    setRunning(true);
    setExtractionComplete(false);
    setExtractionError('');
    setJobProgress(0);
    setJobCurrentStep('Initializing...');
    setJobChunks(0);

    try {
      const result = await api.startExtraction({
        tenant_id: tenantId,
        source_title: sourceTitle,
        source_type: sourceType,
        authority_level: authorityLevel,
        confidence_tier: confidenceTier,
        jurisdiction,
        tier: extractionDepth,
        text: inputMode === 'paste' ? pastedText : undefined,
        user_source_id: userSourceId || undefined,
      });

      const jid = result.job_id ?? result.id ?? '';
      setJobId(jid);
      setJobStatus('processing');

      if (!jid) {
        setExtractionComplete(true);
        setJobChunks(result.chunks_added ?? 0);
        setJobProgress(100);
        setRunning(false);
        return;
      }

      pollRef.current = setInterval(async () => {
        try {
          const status = await api.extractionStatus(jid);
          setJobProgress(status.progress ?? 0);
          setJobCurrentStep(status.current_step ?? '');
          setJobChunks(status.chunks_added ?? 0);
          setJobStatus(status.status ?? '');

          if (status.status === 'complete') {
            stopPolling();
            setExtractionComplete(true);
            setRunning(false);
          } else if (status.status === 'failed') {
            stopPolling();
            setExtractionError(status.error_message ?? 'Extraction failed.');
            setRunning(false);
          }
        } catch {}
      }, 3000);
    } catch (err: unknown) {
      setExtractionError(err instanceof Error ? err.message : 'Failed to start extraction.');
      setRunning(false);
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-md text-sm outline-none";
  const inputStyle = { border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" };

  return (
    <div className="space-y-4">
      {extractionError && (
        <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: '#fef2f2', color: '#C0392B' }}>
          {extractionError}
        </div>
      )}

      {extractionComplete && (
        <div className="flex items-center gap-2 px-3 py-2 rounded text-sm" style={{ backgroundColor: '#F0FDF4', color: '#3A6B4B', border: '1px solid #86EFAC' }}>
          <Check size={16} />
          Extraction complete — {jobChunks} chunks added to your knowledge base
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Source Title <span style={{ color: '#C0392B' }}>*</span></label>
          <input type="text" value={sourceTitle} onChange={e => setSourceTitle(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g., Heckerling Estates 2024" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Source Type</label>
          <select value={sourceType} onChange={e => setSourceType(e.target.value)} className={inputClass} style={inputStyle}>
            {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Authority Level</label>
          <select value={authorityLevel} onChange={e => setAuthorityLevel(e.target.value)} className={inputClass} style={inputStyle}>
            {AUTHORITY_LEVELS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Confidence Tier</label>
          <select value={confidenceTier} onChange={e => setConfidenceTier(Number(e.target.value))} className={inputClass} style={inputStyle}>
            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{CONFIDENCE_TIER_DESCRIPTIONS[n]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Jurisdiction</label>
          <input type="text" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} className={inputClass} style={inputStyle} placeholder="FL" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Your Source ID (optional)</label>
          <input type="text" value={userSourceId} onChange={e => setUserSourceId(e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g., heckerling-2024" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Extraction Depth</label>
        <select value={extractionDepth} onChange={e => setExtractionDepth(Number(e.target.value))} className={inputClass} style={inputStyle}>
          {EXTRACTION_DEPTHS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      <div className="flex gap-2">
        {(['paste', 'upload'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setInputMode(mode)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
            style={{
              backgroundColor: inputMode === mode ? '#B8860B' : 'transparent',
              color: inputMode === mode ? '#fff' : '#6B6B6B',
              border: `1px solid ${inputMode === mode ? '#B8860B' : '#E5E1DA'}`,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {mode === 'paste' ? 'Paste Text' : 'Upload File'}
          </button>
        ))}
      </div>

      {inputMode === 'paste' ? (
        <textarea
          value={pastedText}
          onChange={e => setPastedText(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
          style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif", minHeight: 200 }}
          placeholder="Paste the source text here..."
        />
      ) : (
        <div>
          <div
            className="rounded-md p-8 text-center cursor-pointer transition-colors"
            style={{ border: '2px dashed #E5E1DA', backgroundColor: '#FAFAFA' }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) setFileName(file.name);
            }}
          >
            <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>
              {fileName || 'Drag & drop PDF here, or click to browse'}
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) setFileName(e.target.files[0].name); }} />
        </div>
      )}

      {running && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="animate-spin w-4 h-4 rounded-full" style={{ border: '2px solid #E5E1DA', borderTopColor: '#B8860B' }} />
            <span className="text-sm" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
              {jobCurrentStep || 'Processing...'}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E1DA' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${jobProgress}%`, backgroundColor: '#B8860B' }}
            />
          </div>
          {jobChunks > 0 && (
            <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>{jobChunks} chunks processed so far</p>
          )}
        </div>
      )}

      <button
        onClick={startExtraction}
        disabled={running}
        className="px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-colors"
        style={{ backgroundColor: running ? '#9A6425' : '#B8860B', fontFamily: "'Inter', sans-serif" }}
      >
        {running ? 'Extracting...' : 'Begin Extraction'}
      </button>
    </div>
  );
}
