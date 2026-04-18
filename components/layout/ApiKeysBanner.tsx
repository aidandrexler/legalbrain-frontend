'use client';

import Link from 'next/link';
import { useTenant } from '@/contexts/TenantContext';

export default function ApiKeysBanner() {
  const { tenant } = useTenant();

  if (!tenant) return null;
  if (tenant.anthropic_api_key_encrypted && tenant.openai_api_key_encrypted) return null;

  return (
    <div
      className="px-6 py-2 flex items-center justify-between text-sm"
      style={{
        backgroundColor: '#FDF9F5',
        borderBottom: '1px solid #E5E1DA',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <span className="text-[#6B6B6B]">
        Add your API keys in Settings to run diagnostics
      </span>
      <Link
        href="/settings"
        className="font-medium hover:underline transition-colors"
        style={{ color: '#B87333' }}
      >
        Go to Settings
      </Link>
    </div>
  );
}
