'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ResearchResult {
  answer?: string;
  analysis?: string;
  practice_notes?: string;
  citations?: string[];
  raw?: string;
}

function parseResearchResult(raw: string): ResearchResult {
  if (!raw) return {};
  const result: ResearchResult = { raw };
  const answerMatch = raw.match(/##?\s*(?:ANSWER|Answer)[:\s]*([\s\S]*?)(?=##|$)/i);
  const analysisMatch = raw.match(/##?\s*(?:ANALYSIS|Analysis)[:\s]*([\s\S]*?)(?=##|$)/i);
  const practiceMatch = raw.match(/##?\s*(?:PRACTICE NOTES?|Practice Notes?)[:\s]*([\s\S]*?)(?=##|$)/i);
  const citationsMatch = raw.match(/##?\s*(?:CITATIONS?|Citations?)[:\s]*([\s\S]*?)(?=##|$)/i);

  if (answerMatch) result.answer = answerMatch[1].trim();
  if (analysisMatch) result.analysis = analysisMatch[1].trim();
  if (practiceMatch) result.practice_notes = practiceMatch[1].trim();
  if (citationsMatch) {
    result.citations = citationsMatch[1]
      .split(/\n|,/)
      .map(c => c.replace(/^[-•*\d.]\s*/, '').trim())
      .filter(Boolean);
  }
  return result;
}

export default function FloatingResearch() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const { tenant_id } = useTenant();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('legalbrain_research_history');
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const saveHistory = (q: string) => {
    const updated = [q, ...history.filter(h => h !== q)].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('legalbrain_research_history', JSON.stringify(updated));
  };

  const runSearch = async (q?: string) => {
    const query = q || question;
    if (!query.trim() || !tenant_id) return;
    setLoading(true);
    setError('');
    setResult(null);
    saveHistory(query);
    try {
      const data = await api.research({ tenant_id, question: query });
      setResult(parseResearchResult(data.answer || data.result || data.text || JSON.stringify(data)));
    } catch {
      setError('Research failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: '#B87333', color: 'white' }}
        aria-label="Quick Research"
        title="Quick Research"
      >
        <Search size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative w-full max-w-[480px] h-full bg-white shadow-2xl flex flex-col overflow-hidden"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1DA]">
              <h2
                className="text-lg font-semibold"
                style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
              >
                Quick Research
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-[#E5E1DA]">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runSearch()}
                  placeholder="Ask any legal question..."
                  className="flex-1 px-3 py-2 border border-[#E5E1DA] rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#B87333' } as React.CSSProperties}
                />
                <button
                  onClick={() => runSearch()}
                  disabled={loading || !question.trim()}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#B87333' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ backgroundColor: '#B87333', animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Searching your knowledge base...</p>
                </div>
              )}

              {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {error}
                </div>
              )}

              {result && !loading && (
                <div className="px-6 py-4 space-y-4">
                  {result.answer && (
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        borderLeft: '4px solid #B87333',
                        backgroundColor: '#FDF9F5',
                      }}
                    >
                      <p className="text-[15px] leading-relaxed text-[#2C2C2C]">{result.answer}</p>
                    </div>
                  )}
                  {result.analysis && (
                    <div>
                      <h4
                        className="text-sm font-semibold mb-2"
                        style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
                      >
                        Analysis
                      </h4>
                      <p className="text-sm text-[#6B6B6B] leading-relaxed">{result.analysis}</p>
                    </div>
                  )}
                  {result.practice_notes && (
                    <div className="p-3 bg-[#F4F2EE] border border-[#E5E1DA] rounded-lg">
                      <h4
                        className="text-sm font-semibold mb-1"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        Practice Notes
                      </h4>
                      <p className="text-sm text-[#6B6B6B] leading-relaxed">{result.practice_notes}</p>
                    </div>
                  )}
                  {result.citations && result.citations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Citations</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.citations.map((c, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded border"
                            style={{ borderColor: '#B87333', color: '#B87333' }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!result.answer && !result.analysis && result.raw && (
                    <p className="text-sm text-[#6B6B6B] leading-relaxed whitespace-pre-wrap">{result.raw}</p>
                  )}
                </div>
              )}

              {!loading && !result && history.length > 0 && (
                <div className="px-6 py-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Recent Searches</h4>
                  <div className="space-y-1">
                    {history.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => { setQuestion(h); runSearch(h); }}
                        className="w-full text-left text-sm px-3 py-2 rounded hover:bg-[#F4F2EE] text-[#2C2C2C] truncate transition-colors"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
