const API = process.env.NEXT_PUBLIC_API_URL;

export const api = {
  health: () =>
    fetch(`${API}/api/v1/health`).then(r => r.json()),

  runDiagnostic: (params: {
    tenant_id: string;
    diagnostic_type: 'risk_architecture' | 'estate_tax_architecture' | 'temporal_planning' | 'plan_integrity_audit' | 'advisor_intelligence';
    client_id: string;
    include_badge_check?: boolean;
    include_topsis?: boolean;
    include_scenarios?: boolean;
  }) => fetch(`${API}/api/v1/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }).then(r => r.json()),

  research: (params: { tenant_id: string; question: string; client_id?: string }) =>
    fetch(`${API}/api/v1/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    }).then(r => r.json()),

  ingest: (params: {
    tenant_id: string; content: string; source_id: string;
    description: string; namespace: string; confidence_tier: number;
    source_type: string; citation: string; replaces_source?: string;
  }) => fetch(`${API}/api/v1/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }).then(r => r.json()),

  startExtraction: (params: {
    tenant_id: string; source_title: string; source_type: string;
    authority_level: string; confidence_tier: number; jurisdiction: string;
    tier: number; text?: string; user_source_id?: string;
  }) => fetch(`${API}/api/v1/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }).then(r => r.json()),

  extractionStatus: (job_id: string) =>
    fetch(`${API}/api/v1/extract/${job_id}/status`).then(r => r.json()),

  runTemporal: (tenant_id: string, client_id?: string) =>
    fetch(`${API}/api/v1/temporal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id, client_id })
    }).then(r => r.json()),

  handleImprovement: (params: {
    tenant_id: string; improvement_id: string; decision: string; final_rule?: string;
  }) => fetch(`${API}/api/v1/improve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }).then(r => r.json()),

  provisionSandbox: (tenant_id: string) =>
    fetch(`${API}/api/v1/sandbox/provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id })
    }).then(r => r.json()),

  matterSync: (params: { tenant_id: string; provider: string; payload: object }) =>
    fetch(`${API}/api/v1/matter-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    }).then(r => r.json()),

  runDigest: (tenant_id: string) =>
    fetch(`${API}/api/v1/intelligence-digest?tenant_id=${tenant_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id })
    }).then(r => r.json()),
};
