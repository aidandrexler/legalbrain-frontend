'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { getDiagnosticLabel, formatDate } from '@/lib/utils';

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

interface Props {
  tenantId: string;
  improvements: Improvement[];
  onRefresh: () => void;
}

export default function SystemImprovements({ tenantId, improvements, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [showApproved, setShowApproved] = useState(false);

  const pending = improvements.filter(i => i.status === 'pending');
  const approved = improvements.filter(i => i.status === 'approved');

  const handle = async (imp: Improvement, decision: string, finalRule?: string) => {
    setProcessing(imp.id);
    try {
      await api.handleImprovement({
        tenant_id: tenantId,
        improvement_id: imp.id,
        decision,
        final_rule: finalRule ?? imp.proposed_rule,
      });
      onRefresh();
    } finally {
      setProcessing(null);
      setEditingId(null);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
        >
          Proposed System Improvements
        </h2>
        {pending.length > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
            style={{ backgroundColor: '#B8860B', fontFamily: "'Inter', sans-serif" }}
          >
            {pending.length}
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <p className="text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>No pending improvements.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((imp) => (
            <div key={imp.id} className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{ backgroundColor: 'rgba(184,115,51,0.15)', color: '#B8860B', fontFamily: "'Inter', sans-serif" }}
                >
                  {getDiagnosticLabel(imp.diagnostic_type)}
                </span>
                <span className="text-xs" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>
                  Triggered by {imp.trigger_count} attorney correction{imp.trigger_count !== 1 ? 's' : ''}
                </span>
              </div>

              {editingId === imp.id ? (
                <textarea
                  value={editedText}
                  onChange={e => setEditedText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none mb-3"
                  style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
                />
              ) : (
                <blockquote
                  className="px-3 py-3 rounded mb-3 text-sm italic"
                  style={{
                    backgroundColor: '#FDF9F5',
                    borderLeft: '4px solid #B8860B',
                    color: '#2C2C2C',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {imp.proposed_rule}
                </blockquote>
              )}

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handle(imp, 'approve', imp.proposed_rule)}
                  disabled={processing === imp.id}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-white transition-colors"
                  style={{ backgroundColor: '#3A6B4B', fontFamily: "'Inter', sans-serif" }}
                >
                  Approve
                </button>

                {editingId === imp.id ? (
                  <button
                    onClick={() => handle(imp, 'approve', editedText)}
                    disabled={processing === imp.id}
                    className="px-3 py-1.5 rounded text-xs font-semibold text-white transition-colors"
                    style={{ backgroundColor: '#B8860B', fontFamily: "'Inter', sans-serif" }}
                  >
                    Save & Approve
                  </button>
                ) : (
                  <button
                    onClick={() => { setEditingId(imp.id); setEditedText(imp.proposed_rule); }}
                    className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                    style={{ border: '1px solid #B8860B', color: '#B8860B', backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif" }}
                  >
                    Edit & Approve
                  </button>
                )}

                {editingId === imp.id && (
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded text-xs font-medium"
                    style={{ border: '1px solid #E5E1DA', color: '#6B6B6B', backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif" }}
                  >
                    Cancel
                  </button>
                )}

                <button
                  onClick={() => handle(imp, 'reject')}
                  disabled={processing === imp.id}
                  className="px-3 py-1.5 rounded text-xs font-medium ml-auto transition-colors"
                  style={{ border: '1px solid #C0392B', color: '#C0392B', backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif" }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowApproved(!showApproved)}
            className="flex items-center gap-2 text-sm font-medium mb-3"
            style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}
          >
            {showApproved ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Approved Improvements ({approved.length})
          </button>

          {showApproved && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ border: '1px solid #E5E1DA' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E1DA', backgroundColor: '#F4F2EE' }}>
                    {['Diagnostic Type', 'Final Rule', 'Approved Date', 'Actions'].map(col => (
                      <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6B6B' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {approved.map(imp => (
                    <tr key={imp.id} style={{ borderBottom: '1px solid #E5E1DA' }}>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(184,115,51,0.15)', color: '#B8860B' }}>
                          {getDiagnosticLabel(imp.diagnostic_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm truncate" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
                          {imp.final_rule || imp.proposed_rule}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>
                        {formatDate(imp.approved_at ?? imp.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handle(imp, 'reject')}
                          className="text-xs px-2.5 py-1 rounded transition-colors"
                          style={{ border: '1px solid #C0392B', color: '#C0392B', backgroundColor: 'transparent' }}
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
