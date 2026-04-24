'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { US_STATES } from '@/lib/utils';

const PRACTICE_AREAS_LIST = [
  'Estate Planning',
  'Asset Protection',
  'Business Planning',
  'Elder Law',
  'Tax Planning',
];

interface Tenant {
  id: string;
  attorney_name: string;
  bar_number: string;
  firm_name: string;
  email: string;
  phone: string;
  primary_jurisdiction: string;
  practice_areas: string[];
}

interface Props {
  tenant: Tenant;
  onSaved: () => void;
}

export default function FirmInfoCard({ tenant, onSaved }: Props) {
  const supabase = createClient();
  const [attorneyName, setAttorneyName] = useState(tenant.attorney_name || '');
  const [barNumber, setBarNumber] = useState(tenant.bar_number || '');
  const [firmName, setFirmName] = useState(tenant.firm_name || '');
  const [email, setEmail] = useState(tenant.email || '');
  const [phone, setPhone] = useState(tenant.phone || '');
  const [jurisdiction, setJurisdiction] = useState(tenant.primary_jurisdiction || 'FL');
  const [practiceAreas, setPracticeAreas] = useState<string[]>(tenant.practice_areas || []);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleArea = (area: string) => {
    setPracticeAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    await supabase.from('tenants').update({
      attorney_name: attorneyName,
      bar_number: barNumber,
      firm_name: firmName,
      email,
      phone,
      primary_jurisdiction: jurisdiction,
      practice_areas: practiceAreas,
    }).eq('id', tenant.id);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    onSaved();
  };

  const inputClass = "w-full px-3 py-2 rounded-md text-sm outline-none";
  const inputStyle = { border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
      <h2 className="font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 18 }}>
        Firm Information
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Attorney Name</label>
          <input type="text" value={attorneyName} onChange={e => setAttorneyName(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Bar Number</label>
          <input type="text" value={barNumber} onChange={e => setBarNumber(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Firm Name</label>
          <input type="text" value={firmName} onChange={e => setFirmName(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Primary Jurisdiction</label>
          <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} className={inputClass} style={inputStyle}>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium mb-2" style={{ color: '#6B6B6B' }}>Practice Areas</label>
        <div className="flex flex-wrap gap-2">
          {PRACTICE_AREAS_LIST.map(area => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                border: `1px solid ${practiceAreas.includes(area) ? '#B8860B' : '#E5E1DA'}`,
                backgroundColor: practiceAreas.includes(area) ? '#B8860B' : 'transparent',
                color: practiceAreas.includes(area) ? '#fff' : '#6B6B6B',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: saving ? '#9A6425' : '#B8860B', fontFamily: "'Inter', sans-serif" }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {success && (
          <span className="text-sm" style={{ color: '#3A6B4B', fontFamily: "'Inter', sans-serif" }}>
            Saved successfully.
          </span>
        )}
      </div>
    </div>
  );
}
