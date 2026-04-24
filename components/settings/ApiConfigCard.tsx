'use client';

import { useState } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';

interface Tenant {
  id: string;
  anthropic_api_key_encrypted: string;
  openai_api_key_encrypted: string;
  govinfo_api_key: string;
  courtlistener_token: string;
}

interface Props {
  tenant: Tenant;
  onSaved: () => void;
}

function ApiKeyRow({
  label,
  currentValue,
  onSave,
}: {
  label: string;
  currentValue: string;
  onSave: (val: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(!currentValue);
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);

  const last4 = currentValue ? currentValue.slice(-4) : '';

  const handleSave = async () => {
    if (!value.trim()) return;
    setSaving(true);
    await onSave(value.trim());
    setSaving(false);
    setEditing(false);
    setValue('');
  };

  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #E5E1DA' }}>
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>{label}</p>
          {currentValue && !editing && (
            <p className="text-xs" style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}>
              ...{last4}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
          style={{
            backgroundColor: currentValue ? '#DCFCE7' : '#F4F2EE',
            color: currentValue ? '#3A6B4B' : '#6B6B6B',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentValue ? '#3A6B4B' : '#9CA3AF' }} />
          {currentValue ? 'Connected' : 'Not configured'}
        </span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs px-3 py-1 rounded transition-colors"
            style={{ border: '1px solid #E5E1DA', color: '#6B6B6B', backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif" }}
          >
            Update
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type={showValue ? 'text' : 'password'}
                value={value}
                onChange={e => setValue(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-md text-sm outline-none"
                style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif", width: 200 }}
                placeholder="Enter new key..."
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: '#6B6B6B' }}
              >
                {showValue ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !value.trim()}
              className="text-xs px-3 py-1.5 rounded font-medium text-white"
              style={{ backgroundColor: '#B8860B', fontFamily: "'Inter', sans-serif" }}
            >
              {saving ? '...' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setValue(''); }}
              className="text-xs px-2 py-1.5 rounded"
              style={{ color: '#6B6B6B', border: '1px solid #E5E1DA', backgroundColor: 'transparent' }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApiConfigCard({ tenant, onSaved }: Props) {
  const supabase = createClient();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [govInfoKey, setGovInfoKey] = useState(tenant.govinfo_api_key || '');
  const [courtListenerToken, setCourtListenerToken] = useState(tenant.courtlistener_token || '');
  const [savingGov, setSavingGov] = useState(false);
  const [savingCourt, setSavingCourt] = useState(false);
  const [testResults, setTestResults] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);

  const updateField = async (field: string, val: string) => {
    await supabase.from('tenants').update({ [field]: val }).eq('id', tenant.id);
    onSaved();
  };

  const saveGovInfo = async () => {
    setSavingGov(true);
    await supabase.from('tenants').update({ govinfo_api_key: govInfoKey }).eq('id', tenant.id);
    setSavingGov(false);
    onSaved();
  };

  const saveCourtListener = async () => {
    setSavingCourt(true);
    await supabase.from('tenants').update({ courtlistener_token: courtListenerToken }).eq('id', tenant.id);
    setSavingCourt(false);
    onSaved();
  };

  const testAll = async () => {
    setTesting(true);
    setShowTestResults(false);
    try {
      const result = await api.health();
      setTestResults(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      setTestResults(`Error: ${err instanceof Error ? err.message : 'Connection failed'}`);
    }
    setTesting(false);
    setShowTestResults(true);
  };

  const inputClass = "w-full px-3 py-2 rounded-md text-sm outline-none";
  const inputStyle = { border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
      <h2 className="font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 18 }}>
        API Configuration
      </h2>

      <ApiKeyRow
        label="Anthropic API Key"
        currentValue={tenant.anthropic_api_key_encrypted}
        onSave={(val) => updateField('anthropic_api_key_encrypted', val)}
      />
      <ApiKeyRow
        label="OpenAI API Key"
        currentValue={tenant.openai_api_key_encrypted}
        onSave={(val) => updateField('openai_api_key_encrypted', val)}
      />

      <div className="mt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm"
          style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}
        >
          {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Advanced
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 pl-4" style={{ borderLeft: '2px solid #E5E1DA' }}>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>GovInfo API Key</label>
              <div className="flex gap-2">
                <input type="text" value={govInfoKey} onChange={e => setGovInfoKey(e.target.value)} className={inputClass} style={{ ...inputStyle, flex: 1 }} placeholder="govinfo.gov API key" />
                <button
                  onClick={saveGovInfo}
                  disabled={savingGov}
                  className="px-3 py-2 rounded-md text-sm font-medium text-white flex-shrink-0"
                  style={{ backgroundColor: '#B8860B' }}
                >
                  {savingGov ? '...' : 'Save'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>CourtListener Token</label>
              <div className="flex gap-2">
                <input type="text" value={courtListenerToken} onChange={e => setCourtListenerToken(e.target.value)} className={inputClass} style={{ ...inputStyle, flex: 1 }} placeholder="CourtListener API token" />
                <button
                  onClick={saveCourtListener}
                  disabled={savingCourt}
                  className="px-3 py-2 rounded-md text-sm font-medium text-white flex-shrink-0"
                  style={{ backgroundColor: '#B8860B' }}
                >
                  {savingCourt ? '...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <button
          onClick={testAll}
          disabled={testing}
          className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: testing ? '#9A6425' : '#B8860B', fontFamily: "'Inter', sans-serif" }}
        >
          {testing ? 'Testing...' : 'Test All Connections'}
        </button>
        {showTestResults && testResults && (
          <div className="mt-3">
            <pre
              className="text-xs p-3 rounded overflow-x-auto"
              style={{ backgroundColor: '#F4F2EE', color: '#2C2C2C', fontFamily: 'monospace', maxHeight: 200 }}
            >
              {testResults}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
