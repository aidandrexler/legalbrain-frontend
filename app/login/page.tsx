'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError('Invalid email or password. Please try again.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
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
        <div className="text-center mb-8">
          <span
            className="text-3xl font-bold block mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: '#B87333' }}
          >
            LegalBrain AI
          </span>
          <h1
            className="text-xl font-semibold text-[#2C2C2C]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Sign in to LegalBrain AI
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#2C2C2C] mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#E5E1DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333] focus:border-transparent bg-white text-[#2C2C2C] placeholder:text-gray-400"
              placeholder="attorney@yourfirm.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#2C2C2C] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-[#E5E1DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333] focus:border-transparent bg-white text-[#2C2C2C]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#C0392B] bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: loading ? '#9A6F08' : '#B8860B' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="text-right">
            <Link href="/reset-password" className="text-sm hover:underline" style={{ color: '#B8860B' }}>
              Forgot password?
            </Link>
          </div>
        </form>

        <p className="text-center text-sm text-[#6B6B6B] mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: '#B8860B' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
