'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface Tenant {
  id: string;
  owner_user_id: string;
  name: string;
  attorney_name: string;
  bar_number: string;
  firm_name: string;
  email: string;
  phone: string;
  primary_jurisdiction: string;
  practice_areas: string[];
  anthropic_api_key_encrypted: string;
  openai_api_key_encrypted: string;
  govinfo_api_key: string;
  courtlistener_token: string;
  is_platform_admin: boolean;
  sandbox_provisioned: boolean;
  created_at: string;
  updated_at: string;
}

interface TenantContextValue {
  tenant_id: string | null;
  tenant: Tenant | null;
  loading: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue>({
  tenant_id: null,
  tenant: null,
  loading: true,
  refreshTenant: async () => {},
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const loadTenant = useCallback(async (userId: string, userEmail: string) => {
    const { data: existing } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (existing) {
      setTenant(existing as Tenant);
      setLoading(false);
      return;
    }

    const { data: newTenant, error } = await supabase
      .from('tenants')
      .insert({
        owner_user_id: userId,
        name: userEmail,
        attorney_name: '',
        bar_number: '',
        firm_name: '',
        email: userEmail,
        phone: '',
        primary_jurisdiction: 'FL',
        practice_areas: [],
        anthropic_api_key_encrypted: '',
        openai_api_key_encrypted: '',
        govinfo_api_key: '',
        courtlistener_token: '',
        sandbox_provisioned: false,
      })
      .select('*')
      .single();

    if (error || !newTenant) {
      setLoading(false);
      return;
    }

    setTenant(newTenant as Tenant);

    if (!newTenant.sandbox_provisioned) {
      try {
        await api.provisionSandbox(newTenant.id);
        await supabase
          .from('tenants')
          .update({ sandbox_provisioned: true })
          .eq('id', newTenant.id);
      } catch {}
    }

    setLoading(false);
    router.push('/onboarding');
  }, [supabase, router]);

  const refreshTenant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_user_id', user.id)
      .maybeSingle();
    if (data) setTenant(data as Tenant);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: { user: { id: string; email?: string | null } } | null } }) => {
      if (session?.user) {
        loadTenant(session.user.id, session.user.email ?? '');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      (async () => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadTenant(session.user.id, session.user.email ?? '');
        } else if (event === 'SIGNED_OUT') {
          setTenant(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, [loadTenant, supabase]);

  return (
    <TenantContext.Provider value={{ tenant_id: tenant?.id ?? null, tenant, loading, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
