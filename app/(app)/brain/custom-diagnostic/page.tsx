'use client';

import { FormEvent, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DraftConfig {
  name: string;
  system_prompt: string;
  namespaces: string[];
  precomputations: string[];
}

export default function CustomDiagnosticBuilderPage() {
  const { tenant_id } = useTenant();
  const supabase = createClient();
  const [practiceArea, setPracticeArea] = useState('');
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content:
        "Describe the diagnostic you want to build. Tell me the practice area, what checks to run, what flags to look for, and how you want the output structured. I'll search your knowledge base and build it for you.",
    },
  ]);
  const [draft, setDraft] = useState<DraftConfig>({
    name: '',
    system_prompt: '',
    namespaces: [],
    precomputations: [],
  });

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenant_id || !input.trim()) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);

    const response = await api.buildDiagnostic({
      tenant_id,
      description: userText,
      practice_area: practiceArea,
    });

    const config = response?.diagnostic ?? response ?? {};
    setDraft({
      name: config.name ?? draft.name,
      system_prompt: config.system_prompt ?? draft.system_prompt,
      namespaces: config.namespaces ?? draft.namespaces,
      precomputations: config.precomputations ?? draft.precomputations,
    });
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: response?.message ?? 'Updated. Continue with add/change instructions.' },
    ]);
  };

  const saveDiagnostic = async () => {
    if (!tenant_id || !draft.name) return;
    setSaving(true);
    await supabase.from('custom_diagnostics').insert({
      tenant_id,
      name: draft.name,
      system_prompt: draft.system_prompt,
      namespaces: draft.namespaces,
      precomputations: draft.precomputations,
    });
    setSaving(false);
  };

  return (
    <div className="h-[calc(100vh-2rem)] p-6" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#F7F5F0' }}>
      <div className="h-full rounded-xl border bg-white overflow-hidden flex" style={{ borderColor: '#E2E8F0' }}>
        <section className="flex-1 flex flex-col">
          <div className="border-b px-4 py-3" style={{ borderColor: '#E2E8F0' }}>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0F1923' }}>
              Custom Diagnostic Builder
            </h1>
            <input
              className="mt-2 w-full max-w-sm rounded-md px-3 py-2 text-sm"
              style={{ border: '1px solid #E2E8F0' }}
              placeholder="Practice area (e.g., estate planning)"
              value={practiceArea}
              onChange={(e) => setPracticeArea(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className="rounded-md px-3 py-2 text-sm"
                style={{
                  backgroundColor: message.role === 'user' ? '#0F1923' : '#F8FAFC',
                  color: message.role === 'user' ? '#FFFFFF' : '#334155',
                }}
              >
                {message.content}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="border-t p-3 flex gap-2" style={{ borderColor: '#E2E8F0' }}>
            <input
              className="flex-1 rounded-md px-3 py-2 text-sm"
              style={{ border: '1px solid #E2E8F0' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what to add or change..."
            />
            <button type="submit" className="rounded-md px-4 py-2 text-sm text-white" style={{ backgroundColor: '#B8860B' }}>
              Build My Diagnostic
            </button>
          </form>
        </section>

        <aside className="w-[400px] border-l p-4 flex flex-col" style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0F1923' }}>
            Live Configuration Preview
          </h2>
          <div className="mt-4 space-y-4 text-sm flex-1 overflow-y-auto">
            <div>
              <p className="font-semibold" style={{ color: '#0F1923' }}>Name</p>
              <p style={{ color: '#475569' }}>{draft.name || 'Pending...'}</p>
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#0F1923' }}>System Prompt</p>
              <p className="whitespace-pre-wrap" style={{ color: '#475569' }}>
                {draft.system_prompt || 'Prompt preview will appear here as the build streams.'}
              </p>
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#0F1923' }}>Namespaces</p>
              <p style={{ color: '#475569' }}>{draft.namespaces.join(', ') || 'None yet'}</p>
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#0F1923' }}>Pre-computations</p>
              <p style={{ color: '#475569' }}>{draft.precomputations.join(', ') || 'None yet'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={saveDiagnostic}
            disabled={saving}
            className="mt-4 rounded-md px-4 py-2 text-sm text-white"
            style={{ backgroundColor: '#B8860B' }}
          >
            {saving ? 'Saving...' : 'Save Diagnostic'}
          </button>
        </aside>
      </div>
    </div>
  );
}
