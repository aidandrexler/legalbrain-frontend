'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, Check, Clock, Copy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { getDiagnosticLabel, formatDate } from '@/lib/utils';

interface Client {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
}

interface Diagnostic {
  id: string;
  client_id: string;
  tenant_id: string;
  diagnostic_type: string;
  status: string;
  output_text: string;
  drafting_spec: unknown;
  attorney_reviewed: boolean;
  correction_type: string;
  correction_significance: string;
  correction_notes: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  client: Client;
}

const DIAGNOSTIC_TYPES = [
  { key: 'risk_architecture', label: 'Risk Architecture' },
  { key: 'estate_tax_architecture', label: 'Estate & Tax Architecture' },
  { key: 'temporal_planning', label: 'Temporal Planning' },
  { key: 'plan_integrity_audit', label: 'Plan Integrity Audit' },
  { key: 'advisor_intelligence', label: 'Advisor Intelligence' },
];

const STAGES = [
  'Stage 1/3: Running deterministic analysis...',
  'Stage 2/3: Retrieving relevant law from knowledge base...',
  'Stage 3/3: Generating planning memo...',
];

const CORRECTION_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'added_flag', label: 'Added Flag' },
  { value: 'removed_flag', label: 'Removed Flag' },
  { value: 'changed_recommendation', label: 'Changed Recommendation' },
  { value: 'wrong_jurisdiction', label: 'Wrong Jurisdiction' },
  { value: 'factual_error', label: 'Factual Error' },
  { value: 'incomplete_analysis', label: 'Incomplete Analysis' },
  { value: 'tone_adjustment', label: 'Tone Adjustment' },
];

const SIGNIFICANCE_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'minor', label: 'Minor' },
  { value: 'significant', label: 'Significant' },
  { value: 'major', label: 'Major' },
];

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

function parseOutputText(text: string) {
  if (!text) return [];
  const sections = text.split(/^## /m).filter(Boolean);
  return sections.map((section) => {
    const lines = section.split('\n');
    const heading = lines[0].trim();
    const body = lines.slice(1).join('\n').trim();
    return { heading, body };
  });
}

function renderBody(body: string) {
  const lines = body.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc list-inside space-y-1 mb-3" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
          {listItems.map((item, i) => <li key={i}>{parseBold(item)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
    } else {
      flushList();
      if (line.trim()) {
        elements.push(
          <p key={i} className="mb-2 text-sm leading-relaxed" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
            {parseBold(line)}
          </p>
        );
      }
    }
  });
  flushList();
  return elements;
}

export default function DiagnosticsTab({ client }: Props) {
  const supabase = createClient();
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [activeDiagnostic, setActiveDiagnostic] = useState<Diagnostic | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [runningType, setRunningType] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [pendingDiagnosticId, setPendingDiagnosticId] = useState<string | null>(null);

  const [correctionType, setCorrectionType] = useState('none');
  const [correctionSignificance, setCorrectionSignificance] = useState('none');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const [showDraftingSpec, setShowDraftingSpec] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const stageRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDiagnostics = useCallback(async () => {
    const { data } = await supabase
      .from('diagnostics')
      .select('*')
      .eq('client_id', client.id)
      .eq('tenant_id', client.tenant_id)
      .order('created_at', { ascending: false });
    setDiagnostics((data as Diagnostic[]) ?? []);
    setLoadingList(false);
  }, [client.id, client.tenant_id, supabase]);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (stageRef.current) clearInterval(stageRef.current);
    };
  }, []);

  const setActiveWithReview = (d: Diagnostic) => {
    setActiveDiagnostic(d);
    setCorrectionType(d.correction_type || 'none');
    setCorrectionSignificance(d.correction_significance || 'none');
    setCorrectionNotes(d.correction_notes || '');
  };

  const runDiagnostic = async (type: string) => {
    setShowDropdown(false);
    setRunningType(type);
    setStageIndex(0);
    setActiveDiagnostic(null);

    stageRef.current = setInterval(() => {
      setStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 4000);

    const params: Parameters<typeof api.runDiagnostic>[0] = {
      tenant_id: client.tenant_id,
      diagnostic_type: type as 'risk_architecture' | 'estate_tax_architecture' | 'temporal_planning' | 'plan_integrity_audit' | 'advisor_intelligence',
      client_id: client.id,
      ...(type === 'risk_architecture' && { include_badge_check: true }),
      ...(type === 'estate_tax_architecture' && { include_topsis: true }),
      ...(type === 'plan_integrity_audit' && { include_scenarios: true }),
    };

    const { data: insertedRow } = await supabase
      .from('diagnostics')
      .insert({
        tenant_id: client.tenant_id,
        client_id: client.id,
        diagnostic_type: type,
        status: 'pending',
        output_text: '',
        drafting_spec: null,
        attorney_reviewed: false,
        correction_type: 'none',
        correction_significance: 'none',
        correction_notes: '',
      })
      .select('id')
      .single();

    if (insertedRow) setPendingDiagnosticId(insertedRow.id);

    try {
      await api.runDiagnostic(params);
    } catch {}

    pollRef.current = setInterval(async () => {
      const { data: rows } = await supabase
        .from('diagnostics')
        .select('*')
        .eq('client_id', client.id)
        .eq('tenant_id', client.tenant_id)
        .order('created_at', { ascending: false });

      if (!rows) return;
      const latest = rows[0] as Diagnostic;
      if (latest && (latest.status === 'complete' || latest.status === 'failed')) {
        if (stageRef.current) clearInterval(stageRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
        setRunningType(null);
        setPendingDiagnosticId(null);
        setDiagnostics(rows as Diagnostic[]);
        if (latest.status === 'complete') setActiveWithReview(latest);
      }
    }, 2000);
  };

  const saveReview = async () => {
    if (!activeDiagnostic) return;
    setSavingReview(true);
    await supabase
      .from('diagnostics')
      .update({
        attorney_reviewed: true,
        correction_type: correctionType,
        correction_significance: correctionSignificance,
        correction_notes: correctionNotes,
      })
      .eq('id', activeDiagnostic.id)
      .eq('tenant_id', client.tenant_id);
    setSavingReview(false);
    await fetchDiagnostics();
    const { data } = await supabase.from('diagnostics').select('*').eq('id', activeDiagnostic.id).single();
    if (data) setActiveWithReview(data as Diagnostic);
  };

  const approveAsIs = async () => {
    if (!activeDiagnostic) return;
    setSavingReview(true);
    await supabase
      .from('diagnostics')
      .update({
        attorney_reviewed: true,
        correction_type: 'none',
        correction_significance: 'none',
        correction_notes: '',
      })
      .eq('id', activeDiagnostic.id)
      .eq('tenant_id', client.tenant_id);
    setSavingReview(false);
    await fetchDiagnostics();
    const { data } = await supabase.from('diagnostics').select('*').eq('id', activeDiagnostic.id).single();
    if (data) setActiveWithReview(data as Diagnostic);
  };

  const draftingSpec = activeDiagnostic?.drafting_spec as Record<string, unknown> | null;
  const specDocuments = draftingSpec
    ? ((draftingSpec.documents_required as unknown[]) ?? [])
    : [];
  const specTasks = draftingSpec
    ? ((draftingSpec.implementation_tasks as unknown[]) ?? [])
    : [];

  return (
    <div className="space-y-4">
      <div className="relative inline-block">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={!!runningType}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: runningType ? '#9A6425' : '#B87333', fontFamily: "'Inter', sans-serif" }}
        >
          {runningType ? `Running ${getDiagnosticLabel(runningType)}...` : 'Run Diagnostic'}
          {!runningType && <ChevronDown size={16} />}
        </button>
        {showDropdown && (
          <div
            className="absolute left-0 mt-1 w-56 bg-white rounded-md shadow-lg z-20 overflow-hidden"
            style={{ border: '1px solid #E5E1DA' }}
          >
            {DIAGNOSTIC_TYPES.map((dt) => (
              <button
                key={dt.key}
                onClick={() => runDiagnostic(dt.key)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}
              >
                {dt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {runningType && (
        <div className="bg-white rounded-lg p-6 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin w-5 h-5 rounded-full" style={{ border: '2px solid #E5E1DA', borderTopColor: '#B87333' }} />
            <span className="text-sm font-medium" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
              {STAGES[stageIndex]}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E1DA' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${((stageIndex + 1) / STAGES.length) * 100}%`, backgroundColor: '#B87333' }}
            />
          </div>
        </div>
      )}

      {activeDiagnostic && activeDiagnostic.status === 'complete' && (
        <div className="space-y-4">
          <div
            className="rounded-md px-4 py-3 font-semibold text-sm"
            style={{ backgroundColor: '#C0392B', color: '#fff' }}
          >
            ⚠ ATTORNEY REVIEW REQUIRED — Review this output before sharing with any client
          </div>

          {parseOutputText(activeDiagnostic.output_text).map((section, i) => (
            <div key={i} className="bg-white rounded-lg p-5 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
              <h3
                className="text-lg font-semibold mb-3"
                style={{ fontFamily: "'Playfair Display', serif", color: '#B87333' }}
              >
                {section.heading}
              </h3>
              <div>{renderBody(section.body)}</div>
            </div>
          ))}

          {draftingSpec && (
            <div>
              <button
                onClick={() => setShowDraftingSpec(true)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{ border: '1px solid #B87333', color: '#B87333', backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif" }}
              >
                View WealthCounsel Drafting Spec
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg p-5 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
            <h3
              className="text-lg font-semibold mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
            >
              Attorney Review
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Correction Type</label>
                  <select
                    value={correctionType}
                    onChange={e => setCorrectionType(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm outline-none"
                    style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
                  >
                    {CORRECTION_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Significance</label>
                  <select
                    value={correctionSignificance}
                    onChange={e => setCorrectionSignificance(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm outline-none"
                    style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
                  >
                    {SIGNIFICANCE_TYPES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Notes</label>
                <textarea
                  value={correctionNotes}
                  onChange={e => setCorrectionNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
                  style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
                  placeholder="Optional attorney notes..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={approveAsIs}
                  disabled={savingReview}
                  className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: '#3A6B4B', fontFamily: "'Inter', sans-serif" }}
                >
                  Approve As-Is
                </button>
                <button
                  onClick={saveReview}
                  disabled={savingReview}
                  className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: savingReview ? '#9A6425' : '#B87333', fontFamily: "'Inter', sans-serif" }}
                >
                  {savingReview ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
        <h3
          className="text-base font-semibold mb-3"
          style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
        >
          All Diagnostics
        </h3>
        {loadingList ? (
          <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>Loading...</p>
        ) : diagnostics.length === 0 ? (
          <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>No diagnostics yet. Run your first analysis above.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#E5E1DA' }}>
            {diagnostics.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-2.5">
                <span className="text-sm w-32 flex-shrink-0" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>
                  {formatDate(d.created_at)}
                </span>
                <span className="text-sm flex-1 truncate" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
                  {getDiagnosticLabel(d.diagnostic_type)}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${d.status === 'complete' ? 'bg-green-100 text-green-800' : d.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {d.status}
                </span>
                <span className="flex-shrink-0" title={d.attorney_reviewed ? 'Reviewed' : 'Pending review'}>
                  {d.attorney_reviewed
                    ? <Check size={15} style={{ color: '#3A6B4B' }} />
                    : <Clock size={15} style={{ color: '#C9A84C' }} />}
                </span>
                {d.status === 'complete' && (
                  <button
                    onClick={() => setActiveWithReview(d)}
                    className="text-xs px-2.5 py-1 rounded flex-shrink-0 transition-colors"
                    style={{ border: '1px solid #B87333', color: '#B87333', backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif" }}
                  >
                    View
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showDraftingSpec && draftingSpec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" style={{ border: '1px solid #E5E1DA' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E5E1DA' }}>
              <h3 className="font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 18 }}>
                WealthCounsel Drafting Specification
              </h3>
              <button onClick={() => setShowDraftingSpec(false)} style={{ color: '#6B6B6B' }}>✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {specDocuments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#2C2C2C', fontFamily: "'Playfair Display', serif" }}>Documents Required</h4>
                  <ul className="space-y-1">
                    {specDocuments.map((doc: unknown, i: number) => (
                      <li key={i} className="text-sm" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
                        {typeof doc === 'object' && doc !== null ? JSON.stringify(doc) : String(doc)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {specTasks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: '#2C2C2C', fontFamily: "'Playfair Display', serif" }}>Implementation Tasks</h4>
                  <ul className="space-y-2">
                    {specTasks.map((task: unknown, i: number) => {
                      const t = task as Record<string, unknown>;
                      return (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
                          <span className="flex-1">{String(t.task ?? t.description ?? JSON.stringify(t))}</span>
                          {t.criticality != null && (
                            <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: '#fef2f2', color: '#C0392B' }}>{String(t.criticality)}</span>
                          )}
                          {t.timeline != null && (
                            <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: '#F4F2EE', color: '#6B6B6B' }}>{String(t.timeline)}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <div>
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-xs underline"
                  style={{ color: '#6B6B6B' }}
                >
                  {showRawJson ? 'Hide' : 'Show'} Raw JSON
                </button>
                {showRawJson && (
                  <pre className="mt-2 text-xs p-3 rounded overflow-x-auto" style={{ backgroundColor: '#F4F2EE', color: '#2C2C2C', fontFamily: 'monospace', maxHeight: 200 }}>
                    {JSON.stringify(draftingSpec, null, 2)}
                  </pre>
                )}
              </div>
            </div>
            <div className="px-6 py-3" style={{ borderTop: '1px solid #E5E1DA' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(draftingSpec, null, 2));
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{ border: '1px solid #E5E1DA', color: '#6B6B6B', backgroundColor: 'transparent' }}
              >
                <Copy size={12} /> Copy JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
