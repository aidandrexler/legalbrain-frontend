'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface ParsedSection {
  type: 'ANSWER' | 'ANALYSIS' | 'PRACTICE NOTES' | 'CITATIONS' | 'OTHER';
  heading: string;
  content: string;
}

const HISTORY_KEY = 'legalbrain_research_history';

function parseResearchResult(text: string): ParsedSection[] {
  if (!text) return [];

  const sectionPatterns = ['ANSWER', 'ANALYSIS', 'PRACTICE NOTES', 'CITATIONS'];
  const sections: ParsedSection[] = [];

  const splitRegex = /^(#{1,3}\s+)(ANSWER|ANALYSIS|PRACTICE NOTES|CITATIONS|[A-Z][A-Z\s]+)/m;
  const parts = text.split(/(?=^#{1,3}\s+[A-Z])/m).filter(Boolean);

  if (parts.length <= 1) {
    const lines = text.split('\n\n').filter(Boolean);
    const first = lines[0] ?? text;
    return [{
      type: 'ANSWER',
      heading: 'Answer',
      content: text,
    }];
  }

  for (const part of parts) {
    const lines = part.split('\n');
    const headingLine = lines[0].replace(/^#{1,3}\s+/, '').trim();
    const upperHeading = headingLine.toUpperCase();
    const body = lines.slice(1).join('\n').trim();

    let type: ParsedSection['type'] = 'OTHER';
    for (const p of sectionPatterns) {
      if (upperHeading.includes(p)) {
        type = p as ParsedSection['type'];
        break;
      }
    }

    sections.push({ type, heading: headingLine, content: body });
  }

  return sections;
}

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
}

function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc list-inside space-y-1 mb-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#2C2C2C' }}>
          {listItems.map((item, i) => <li key={i}>{parseBold(item)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2));
    } else {
      flushList();
      if (trimmed) {
        elements.push(
          <p key={i} className="mb-2 text-sm leading-relaxed" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
            {parseBold(trimmed)}
          </p>
        );
      }
    }
  });
  flushList();
  return elements;
}

function CitationChip({ text }: { text: string }) {
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ border: '1px solid #B8860B', color: '#B8860B', fontFamily: "'Inter', sans-serif" }}
    >
      {text.trim()}
    </span>
  );
}

function parseCitations(content: string): string[] {
  return content
    .split(/\n|,|;/)
    .map(c => c.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);
}

export default function ResearchPage() {
  const { tenant_id, loading: tenantLoading } = useTenant();
  const supabase = createClient();

  const [question, setQuestion] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const saveToHistory = (q: string) => {
    setHistory(prev => {
      const next = [q, ...prev.filter(h => h !== q)].slice(0, 20);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  };

  const fetchClients = useCallback(async () => {
    if (!tenant_id) return;
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('tenant_id', tenant_id)
      .order('last_name');
    setClients((data as Client[]) ?? []);
  }, [tenant_id, supabase]);

  useEffect(() => {
    if (!tenantLoading && tenant_id) fetchClients();
  }, [tenant_id, tenantLoading, fetchClients]);

  const runSearch = async (q?: string) => {
    const queryToRun = q ?? question;
    if (!queryToRun.trim() || !tenant_id) return;
    setSearching(true);
    setResult(null);
    setError('');
    saveToHistory(queryToRun);
    if (q) setQuestion(q);

    try {
      const res = await api.research({
        tenant_id,
        question: queryToRun,
        client_id: selectedClientId || undefined,
      });
      setResult(res.result ?? res.answer ?? res.response ?? JSON.stringify(res));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Research failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') runSearch();
  };

  const sections = result ? parseResearchResult(result) : [];

  return (
    <div className="flex h-[calc(100vh-0px)]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div
        className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ backgroundColor: '#0F1923', color: '#fff' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: '#B8860B' }}>History</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {history.length === 0 ? (
            <p className="text-xs px-2" style={{ color: 'rgba(255,255,255,0.4)' }}>No search history yet.</p>
          ) : (
            history.map((h, i) => (
              <button
                key={i}
                onClick={() => runSearch(h)}
                className="w-full text-left px-3 py-2 rounded text-xs transition-colors hover:bg-white/10 truncate"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                title={h}
              >
                {h.length > 40 ? h.slice(0, 40) + '...' : h}
              </button>
            ))
          )}
        </div>
        {history.length > 0 && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={clearHistory}
              className="text-xs underline"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Clear history
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F4F2EE' }}>
        <div className="px-8 py-8">
          <h1
            className="text-3xl font-bold mb-6"
            style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
          >
            Legal Research
          </h1>

          <div className="bg-white rounded-lg p-5 shadow-sm mb-6" style={{ border: '1px solid #E5E1DA' }}>
            <div className="relative mb-3">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any legal question..."
                className="w-full pl-10 pr-4 py-3 rounded-md outline-none text-lg"
                style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif", fontSize: 18 }}
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm whitespace-nowrap" style={{ color: '#6B6B6B' }}>Client context (optional):</label>
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="px-3 py-1.5 rounded-md text-sm outline-none"
                  style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif", minWidth: 180 }}
                >
                  <option value="">No client selected</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.last_name}, {c.first_name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => runSearch()}
                disabled={searching || !question.trim()}
                className="px-5 py-2 rounded-md text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: searching || !question.trim() ? '#9A6425' : '#B8860B', fontFamily: "'Inter', sans-serif" }}
              >
                {searching ? 'Researching...' : 'Research'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 rounded text-sm" style={{ backgroundColor: '#fef2f2', color: '#C0392B' }}>
              {error}
            </div>
          )}

          {searching && (
            <div className="flex items-center gap-3 py-6">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: '#B8860B', animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-sm" style={{ color: '#6B6B6B' }}>Searching your knowledge base...</span>
            </div>
          )}

          {sections.length > 0 && (
            <div className="space-y-4">
              {sections.map((section, i) => {
                if (section.type === 'ANSWER') {
                  return (
                    <div
                      key={i}
                      className="px-5 py-4 rounded-lg"
                      style={{
                        borderLeft: '4px solid #B8860B',
                        backgroundColor: '#FDF9F5',
                      }}
                    >
                      <p className="font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#B8860B', fontSize: 18 }}>
                        {section.heading}
                      </p>
                      <div style={{ fontSize: 16 }}>{renderContent(section.content)}</div>
                    </div>
                  );
                }

                if (section.type === 'CITATIONS') {
                  const citations = parseCitations(section.content);
                  return (
                    <div
                      key={i}
                      className="bg-white rounded-lg p-4 shadow-sm"
                      style={{ border: '1px solid #E5E1DA' }}
                    >
                      <p className="font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 16 }}>
                        {section.heading}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {citations.map((c, ci) => <CitationChip key={ci} text={c} />)}
                      </div>
                    </div>
                  );
                }

                if (section.type === 'PRACTICE NOTES') {
                  return (
                    <div
                      key={i}
                      className="rounded-lg p-4"
                      style={{ backgroundColor: '#F4F2EE', border: '1px solid #E5E1DA' }}
                    >
                      <p className="font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 16 }}>
                        {section.heading}
                      </p>
                      {renderContent(section.content)}
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    className="bg-white rounded-lg p-4 shadow-sm"
                    style={{ border: '1px solid #E5E1DA' }}
                  >
                    <p className="font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 16 }}>
                      {section.heading}
                    </p>
                    {renderContent(section.content)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
