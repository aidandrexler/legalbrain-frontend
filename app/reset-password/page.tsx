'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://mylegalforge.com/reset-password'
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSuccess('Check your email for a reset link');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#F4F2EE', fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-sm p-8"
        style={{ border: '1px solid #E5E1DA' }}
      >
        <div className="text-center mb-6">
          <h1
            className="text-4xl font-semibold mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: '#B8860B' }}
          >
            Forge
          </h1>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            Enter your email to receive a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#2C2C2C] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#E5E1DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white text-[#2C2C2C]"
              style={{ ['--tw-ring-color' as string]: '#B8860B' }}
              placeholder="attorney@yourfirm.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#B8860B' }}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        {success && (
          <p className="mt-4 text-sm" style={{ color: '#166534' }}>
            {success}
          </p>
        )}
        {error && (
          <p className="mt-4 text-sm" style={{ color: '#C0392B' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
