'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Brain, Search, Clock, Settings } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Structure Canvas', href: '/clients', icon: Users },
  { label: 'Brain', href: '/brain', icon: Brain },
  { label: 'Research', href: '/research', icon: Search },
  { label: 'Temporal', href: '/temporal', icon: Clock },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const [healthStatus, setHealthStatus] = useState<'green' | 'yellow' | 'red'>('yellow');
  const [showApiBanner, setShowApiBanner] = useState(true);

  useEffect(() => {
    api.health()
      .then(() => setHealthStatus('green'))
      .catch(() => setHealthStatus('red'));
  }, []);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('hide_api_key_banner');
      if (dismissed === '1') setShowApiBanner(false);
    } catch {}
  }, []);

  const healthColor = {
    green: 'bg-green-400',
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
  }[healthStatus];
  const missingAnthropicKey = !tenant?.anthropic_api_key_encrypted?.trim();

  const dismissBanner = () => {
    setShowApiBanner(false);
    try {
      sessionStorage.setItem('hide_api_key_banner', '1');
    } catch {}
  };

  return (
    <aside
      className="fixed top-0 left-0 h-full w-60 flex flex-col z-40"
      style={{ backgroundColor: '#0F1923' }}
    >
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/dashboard" className="block">
          <span
            className="text-xl leading-tight block"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#B8860B',
              fontWeight: 700,
            }}
          >
            Forge
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative',
                isActive
                  ? 'text-white bg-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
              style={
                isActive
                  ? {
                      borderLeft: '3px solid #B8860B',
                      paddingLeft: '9px',
                    }
                  : { borderLeft: '3px solid transparent', paddingLeft: '9px' }
              }
            >
              <Icon
                size={18}
                style={{ color: isActive ? '#B8860B' : 'inherit' }}
              />
              <span style={{ fontFamily: "'Inter', sans-serif" }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {tenant?.is_platform_admin && (
        <div className="px-3 pb-3">
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative',
              pathname === '/admin' ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
            style={
              pathname === '/admin'
                ? { borderLeft: '3px solid #B8860B', paddingLeft: '9px' }
                : { borderLeft: '3px solid transparent', paddingLeft: '9px' }
            }
          >
            <Settings size={18} style={{ color: pathname === '/admin' ? '#B8860B' : 'inherit' }} />
            <span style={{ fontFamily: "'Inter', sans-serif" }}>Admin</span>
          </Link>
        </div>
      )}

      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', healthColor)} />
          <span className="text-xs text-white/50" style={{ fontFamily: "'Inter', sans-serif" }}>
            {healthStatus === 'green' ? 'System Healthy' : healthStatus === 'yellow' ? 'Checking...' : 'System Issue'}
          </span>
        </div>
        {tenant && (
          <p
            className="text-xs text-white/40 truncate"
            style={{ fontFamily: "'Inter', sans-serif" }}
            title={tenant.attorney_name || tenant.firm_name || tenant.email}
          >
            {tenant.attorney_name || tenant.firm_name || tenant.email}
          </p>
        )}
      </div>
      {missingAnthropicKey && showApiBanner && (
        <div
          className="px-3 py-2 flex items-center gap-2"
          style={{ backgroundColor: '#B8860B', color: '#FFFFFF', fontSize: 12, fontFamily: "'Inter', sans-serif" }}
        >
          <span className="flex-1">Add API keys in Settings to enable diagnostics</span>
          <Link href="/settings" className="underline text-white">
            Settings
          </Link>
          <button
            onClick={dismissBanner}
            className="text-white"
            aria-label="Dismiss API key banner"
            title="Dismiss"
          >
            X
          </button>
        </div>
      )}
    </aside>
  );
}
