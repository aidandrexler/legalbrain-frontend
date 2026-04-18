'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Brain, Search, Clock, Check, X } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { US_STATES } from '@/lib/utils';

const PRACTICE_AREAS = [
  'Estate Planning',
  'Asset Protection',
  'Business Planning',
  'Elder Law',
  'Tax Planning',
];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex items-center">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
            style={{
              fontFamily: "'Inter', sans-serif",
              backgroundColor: n <= step ? '#B87333' : '#E5E1DA',
              color: n <= step ? '#fff' : '#6B6B6B',
            }}
          >
            {n < step ? <Check size={16} /> : n}
          </div>
          {n < 4 && (
            <div
              className="w-12 h-0.5 mx-1"
              style={{ backgroundColor: n < step ? '#B87333' : '#E5E1DA' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { tenant_id, refreshTenant } = useTenant();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [firmName, setFirmName] = useState('');
  const [attorneyName, setAttorneyName] = useState('');
  const [barNumber, setBarNumber] = useState('');
  const [jurisdiction, setJurisdiction] = useState('FL');
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);

  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  const togglePracticeArea = (area: string) => {
    setPracticeAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleExploreDemoClick = async () => {
    if (!tenant_id) return;
    setLoading(true);
    try {
      await api.provisionSandbox(tenant_id);
    } catch {}
    router.push('/dashboard');
  };

  const handleSavePracticeInfo = async () => {
    if (!tenant_id) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase
      .from('tenants')
      .update({
        firm_name: firmName,
        attorney_name: attorneyName,
        bar_number: barNumber,
        primary_jurisdiction: jurisdiction,
        practice_areas: practiceAreas,
      })
      .eq('id', tenant_id);
    setLoading(false);
    if (err) { setError(err.message); return; }
    await refreshTenant();
    setStep(3);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      await api.health();
      setTestStatus('ok');
    } catch {
      setTestStatus('fail');
    }
  };

  const handleSaveApiKeys = async () => {
    if (!tenant_id) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase
      .from('tenants')
      .update({
        anthropic_api_key_encrypted: anthropicKey,
        openai_api_key_encrypted: openaiKey,
      })
      .eq('id', tenant_id);
    setLoading(false);
    if (err) { setError(err.message); return; }
    await refreshTenant();
    setStep(4);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#F4F2EE', fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-2xl">
        <ProgressBar step={step} />

        {step === 1 && (
          <div
            className="bg-white rounded-lg p-8 shadow-sm"
            style={{ border: '1px solid #E5E1DA' }}
          >
            <h1
              className="text-3xl font-bold mb-3 text-center"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
            >
              Welcome to LegalBrain AI
            </h1>
            <p
              className="text-center mb-8"
              style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}
            >
              Your AI-powered legal intelligence platform for estate planning. We&apos;ll analyze your clients,
              detect critical flags, and surface planning opportunities — so nothing falls through the cracks.
            </p>

            <div
              className="rounded-lg p-5 mb-6"
              style={{ backgroundColor: '#F4F2EE', border: '1px solid #E5E1DA' }}
            >
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6B6B6B' }}>
                Demo Preview
              </p>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}>
                    The Roy Family Estate
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>Estate: $4,200,000 &nbsp;·&nbsp; Status: Active</p>
                  <p className="text-sm mt-0.5" style={{ color: '#6B6B6B' }}>Critical flags: 2 &nbsp;·&nbsp; Last diagnostic: Risk Architecture</p>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded font-semibold"
                  style={{ backgroundColor: '#C0392B', color: '#fff' }}
                >
                  CRITICAL
                </span>
              </div>
            </div>

            <div
              className="rounded-md px-4 py-3 mb-6 font-semibold text-sm"
              style={{ backgroundColor: '#C0392B', color: '#fff' }}
            >
              ⚠ ATTORNEY REVIEW REQUIRED — Review this output before sharing with any client
            </div>

            <button
              onClick={handleExploreDemoClick}
              disabled={loading}
              className="w-full py-3 rounded-md font-semibold text-white transition-colors mb-3"
              style={{
                backgroundColor: loading ? '#9A6425' : '#B87333',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {loading ? 'Loading...' : 'Explore the Demo →'}
            </button>

            <div className="text-center">
              <button
                onClick={() => setStep(2)}
                className="text-sm underline"
                style={{ color: '#B87333', fontFamily: "'Inter', sans-serif" }}
              >
                Skip to setup →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div
            className="bg-white rounded-lg p-8 shadow-sm"
            style={{ border: '1px solid #E5E1DA' }}
          >
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
            >
              Practice Information
            </h2>
            <p className="mb-6 text-sm" style={{ color: '#6B6B6B' }}>
              Tell us about your practice so we can tailor your experience.
            </p>

            {error && (
              <div className="mb-4 px-3 py-2 rounded text-sm" style={{ backgroundColor: '#fef2f2', color: '#C0392B' }}>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#2C2C2C' }}>Firm Name</label>
                  <input
                    type="text"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-2"
                    style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
                    placeholder="Smith & Associates"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#2C2C2C' }}>Attorney Name</label>
                  <input
                    type="text"
                    value={attorneyName}
                    onChange={(e) => setAttorneyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm outline-none"
                    style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
                    placeholder="Jane Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2C2C2C' }}>Bar Number</label>
                <input
                  type="text"
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm outline-none"
                  style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
                  placeholder="FL12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2C2C2C' }}>Primary Jurisdiction</label>
                <select
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm outline-none"
                  style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
                >
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>Practice Areas</label>
                <div className="flex flex-wrap gap-2">
                  {PRACTICE_AREAS.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => togglePracticeArea(area)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        border: `1px solid ${practiceAreas.includes(area) ? '#B87333' : '#E5E1DA'}`,
                        backgroundColor: practiceAreas.includes(area) ? '#B87333' : 'transparent',
                        color: practiceAreas.includes(area) ? '#fff' : '#6B6B6B',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSavePracticeInfo}
              disabled={loading}
              className="mt-6 w-full py-3 rounded-md font-semibold text-white transition-colors"
              style={{
                backgroundColor: loading ? '#9A6425' : '#B87333',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {loading ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div
            className="bg-white rounded-lg p-8 shadow-sm"
            style={{ border: '1px solid #E5E1DA' }}
          >
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
            >
              Configure APIs
            </h2>
            <p className="mb-6 text-sm" style={{ color: '#6B6B6B' }}>
              Connect your AI keys to enable diagnostics and research capabilities.
            </p>

            {error && (
              <div className="mb-4 px-3 py-2 rounded text-sm" style={{ backgroundColor: '#fef2f2', color: '#C0392B' }}>
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2C2C2C' }}>Anthropic API Key</label>
                <div className="relative">
                  <input
                    type={showAnthropicKey ? 'text' : 'password'}
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-md text-sm outline-none"
                    style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
                    placeholder="sk-ant-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#6B6B6B' }}
                  >
                    {showAnthropicKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Starts with sk-ant-</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2C2C2C' }}>OpenAI API Key</label>
                <div className="relative">
                  <input
                    type={showOpenaiKey ? 'text' : 'password'}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-md text-sm outline-none"
                    style={{ border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" }}
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#6B6B6B' }}
                  >
                    {showOpenaiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Starts with sk-</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    border: '1px solid #B87333',
                    color: '#B87333',
                    backgroundColor: 'transparent',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
                {testStatus === 'ok' && (
                  <span className="flex items-center gap-1 text-sm" style={{ color: '#3A6B4B' }}>
                    <Check size={16} /> Connected
                  </span>
                )}
                {testStatus === 'fail' && (
                  <span className="flex items-center gap-1 text-sm" style={{ color: '#C0392B' }}>
                    <X size={16} /> Connection failed
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveApiKeys}
              disabled={loading}
              className="mt-6 w-full py-3 rounded-md font-semibold text-white transition-colors"
              style={{
                backgroundColor: loading ? '#9A6425' : '#B87333',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>

            <div className="text-center mt-3">
              <button
                onClick={() => setStep(4)}
                className="text-sm underline"
                style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif" }}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div
            className="bg-white rounded-lg p-8 shadow-sm text-center"
            style={{ border: '1px solid #E5E1DA' }}
          >
            <h2
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}
            >
              Your legal brain is ready
            </h2>
            <p className="mb-8 text-sm" style={{ color: '#6B6B6B' }}>
              You&apos;re all set. Here&apos;s what LegalBrain AI will do for you.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div
                className="rounded-lg p-5"
                style={{ backgroundColor: '#F4F2EE', border: '1px solid #E5E1DA' }}
              >
                <Brain size={28} style={{ color: '#B87333', margin: '0 auto 10px' }} />
                <p className="font-semibold text-sm mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}>
                  AI Diagnostics
                </p>
                <p className="text-xs" style={{ color: '#6B6B6B' }}>
                  Run 5 types of in-depth estate planning analyses.
                </p>
              </div>
              <div
                className="rounded-lg p-5"
                style={{ backgroundColor: '#F4F2EE', border: '1px solid #E5E1DA' }}
              >
                <Search size={28} style={{ color: '#B87333', margin: '0 auto 10px' }} />
                <p className="font-semibold text-sm mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}>
                  Legal Research
                </p>
                <p className="text-xs" style={{ color: '#6B6B6B' }}>
                  Instant answers from your knowledge base.
                </p>
              </div>
              <div
                className="rounded-lg p-5"
                style={{ backgroundColor: '#F4F2EE', border: '1px solid #E5E1DA' }}
              >
                <Clock size={28} style={{ color: '#B87333', margin: '0 auto 10px' }} />
                <p className="font-semibold text-sm mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}>
                  Temporal Engine
                </p>
                <p className="text-xs" style={{ color: '#6B6B6B' }}>
                  Never miss a rate window or planning deadline.
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 rounded-md font-semibold text-white transition-colors"
              style={{
                backgroundColor: '#B87333',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Start analyzing clients →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
