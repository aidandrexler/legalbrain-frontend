'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Client {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  email: string;
  phone: string;
  marital_status: string;
  spouse_first_name: string;
  number_of_children: number;
  estate_size: number;
  net_worth: number;
  annual_income: number;
  homestead_declared: boolean;
  trust_funded: boolean;
  trust_signed_date: string | null;
  entity_type: string;
  is_physician: boolean;
  physician_specialty: string;
  practice_entity_type: string;
  practice_name: string;
  annual_practice_revenue: number;
  top_payer_concentration: number;
  has_malpractice_coverage: boolean;
  malpractice_limit: number;
  has_buy_sell_agreement: boolean;
  buy_sell_funded: boolean;
  goal_tax_efficiency: number;
  goal_risk_reduction: number;
  goal_liquidity: number;
  goal_simplicity: number;
  anticipated_sale_date: string | null;
  anticipated_inheritance_date: string | null;
  anticipated_inheritance_amount: number;
  divorce_risk_flag: boolean;
  health_flag: boolean;
  cpa_name: string;
  financial_advisor_name: string;
  referral_source: string;
}

interface Props {
  client: Client;
  onUpdated: () => void;
}

const inputClass = "w-full px-3 py-2 rounded-md text-sm outline-none";
const inputStyle = { border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" };

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
        style={{ backgroundColor: value ? '#B87333' : '#E5E1DA' }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
          style={{ transform: value ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="mt-3 px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
      style={{ backgroundColor: saving ? '#9A6425' : '#B87333', fontFamily: "'Inter', sans-serif" }}
    >
      {saving ? 'Saving...' : 'Save'}
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #E5E1DA' }}>
      <h3 className="font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C', fontSize: 18 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function ProfileTab({ client, onUpdated }: Props) {
  const supabase = createClient();

  const [firstName, setFirstName] = useState(client.first_name);
  const [lastName, setLastName] = useState(client.last_name);
  const [dateOfBirth, setDateOfBirth] = useState(client.date_of_birth ?? '');
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone);
  const [maritalStatus, setMaritalStatus] = useState(client.marital_status);
  const [spouseFirstName, setSpouseFirstName] = useState(client.spouse_first_name);
  const [numberOfChildren, setNumberOfChildren] = useState(client.number_of_children);
  const [savingPersonal, setSavingPersonal] = useState(false);

  const [goalTaxEfficiency, setGoalTaxEfficiency] = useState(client.goal_tax_efficiency);
  const [goalRiskReduction, setGoalRiskReduction] = useState(client.goal_risk_reduction);
  const [goalLiquidity, setGoalLiquidity] = useState(client.goal_liquidity);
  const [goalSimplicity, setGoalSimplicity] = useState(client.goal_simplicity);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);

  const [physicianSpecialty, setPhysicianSpecialty] = useState(client.physician_specialty);
  const [practiceEntityType, setPracticeEntityType] = useState(client.practice_entity_type);
  const [practiceName, setPracticeName] = useState(client.practice_name);
  const [annualPracticeRevenue, setAnnualPracticeRevenue] = useState(client.annual_practice_revenue);
  const [topPayerConcentration, setTopPayerConcentration] = useState(client.top_payer_concentration);
  const [hasMalpracticeCoverage, setHasMalpracticeCoverage] = useState(client.has_malpractice_coverage);
  const [malpracticeLimit, setMalpracticeLimit] = useState(client.malpractice_limit);
  const [hasBuySellAgreement, setHasBuySellAgreement] = useState(client.has_buy_sell_agreement);
  const [buySellFunded, setBuySellFunded] = useState(client.buy_sell_funded);
  const [savingPhysician, setSavingPhysician] = useState(false);

  const [anticipatedSaleDate, setAnticipatedSaleDate] = useState(client.anticipated_sale_date ?? '');
  const [anticipatedInheritanceDate, setAnticipatedInheritanceDate] = useState(client.anticipated_inheritance_date ?? '');
  const [anticipatedInheritanceAmount, setAnticipatedInheritanceAmount] = useState(client.anticipated_inheritance_amount);
  const [divorceRiskFlag, setDivorceRiskFlag] = useState(client.divorce_risk_flag);
  const [healthFlag, setHealthFlag] = useState(client.health_flag);
  const [savingEvents, setSavingEvents] = useState(false);

  const savePersonal = async () => {
    setSavingPersonal(true);
    await supabase.from('clients').update({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth || null,
      email,
      phone,
      marital_status: maritalStatus,
      spouse_first_name: maritalStatus === 'married' ? spouseFirstName : '',
      number_of_children: numberOfChildren,
    }).eq('id', client.id).eq('tenant_id', client.tenant_id);
    setSavingPersonal(false);
    onUpdated();
  };

  const saveGoals = async () => {
    setSavingGoals(true);
    await supabase.from('clients').update({
      goal_tax_efficiency: goalTaxEfficiency,
      goal_risk_reduction: goalRiskReduction,
      goal_liquidity: goalLiquidity,
      goal_simplicity: goalSimplicity,
    }).eq('id', client.id).eq('tenant_id', client.tenant_id);
    setSavingGoals(false);
    setShowGoalModal(false);
    onUpdated();
  };

  const savePhysician = async () => {
    setSavingPhysician(true);
    await supabase.from('clients').update({
      physician_specialty: physicianSpecialty,
      practice_entity_type: practiceEntityType,
      practice_name: practiceName,
      annual_practice_revenue: annualPracticeRevenue,
      top_payer_concentration: topPayerConcentration,
      has_malpractice_coverage: hasMalpracticeCoverage,
      malpractice_limit: hasMalpracticeCoverage ? malpracticeLimit : 0,
      has_buy_sell_agreement: hasBuySellAgreement,
      buy_sell_funded: hasBuySellAgreement ? buySellFunded : false,
    }).eq('id', client.id).eq('tenant_id', client.tenant_id);
    setSavingPhysician(false);
    onUpdated();
  };

  const saveEvents = async () => {
    setSavingEvents(true);
    await supabase.from('clients').update({
      anticipated_sale_date: anticipatedSaleDate || null,
      anticipated_inheritance_date: anticipatedInheritanceDate || null,
      anticipated_inheritance_amount: anticipatedInheritanceAmount,
      divorce_risk_flag: divorceRiskFlag,
      health_flag: healthFlag,
    }).eq('id', client.id).eq('tenant_id', client.tenant_id);
    setSavingEvents(false);
    onUpdated();
  };

  const goalSum = goalTaxEfficiency + goalRiskReduction + goalLiquidity + goalSimplicity;

  return (
    <div className="space-y-4">
      <Card title="Personal Information">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>First Name</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Last Name</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Date of Birth</label>
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClass} style={inputStyle} />
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
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Marital Status</label>
            <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className={inputClass} style={inputStyle}>
              {['single', 'married', 'divorced', 'widowed'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          {maritalStatus === 'married' && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Spouse First Name</label>
              <input type="text" value={spouseFirstName} onChange={e => setSpouseFirstName(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Number of Children</label>
            <input type="number" min={0} value={numberOfChildren} onChange={e => setNumberOfChildren(Number(e.target.value))} className={inputClass} style={inputStyle} />
          </div>
        </div>
        <SaveButton onClick={savePersonal} saving={savingPersonal} />
      </Card>

      <Card title="Planning Goals">
        <div className="space-y-3">
          {[
            { label: 'Tax Efficiency', value: goalTaxEfficiency },
            { label: 'Risk Reduction', value: goalRiskReduction },
            { label: 'Liquidity', value: goalLiquidity },
            { label: 'Simplicity', value: goalSimplicity },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="text-sm" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>{label}</span>
                <span className="text-sm font-semibold" style={{ color: '#B87333', fontFamily: "'Inter', sans-serif" }}>{value}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E1DA' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: '#B87333' }} />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowGoalModal(true)}
          className="mt-3 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ border: '1px solid #B87333', color: '#B87333', backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif" }}
        >
          Edit Goals
        </button>

        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" style={{ border: '1px solid #E5E1DA' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}>
                Edit Planning Goals
              </h3>
              <p className="text-xs mb-3" style={{ color: '#6B6B6B' }}>
                Must sum to 100%. Current: <span style={{ color: goalSum === 100 ? '#3A6B4B' : '#C0392B', fontWeight: 600 }}>{goalSum}%</span>
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Tax Efficiency', value: goalTaxEfficiency, set: setGoalTaxEfficiency },
                  { label: 'Risk Reduction', value: goalRiskReduction, set: setGoalRiskReduction },
                  { label: 'Liquidity', value: goalLiquidity, set: setGoalLiquidity },
                  { label: 'Simplicity', value: goalSimplicity, set: setGoalSimplicity },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm" style={{ color: '#2C2C2C' }}>{label}</span>
                      <span className="text-sm font-medium" style={{ color: '#B87333' }}>{value}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={value} onChange={e => set(Number(e.target.value))} className="w-full accent-[#B87333]" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-2 rounded-md text-sm"
                  style={{ border: '1px solid #E5E1DA', color: '#6B6B6B', backgroundColor: 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveGoals}
                  disabled={savingGoals || goalSum !== 100}
                  className="flex-1 py-2 rounded-md text-sm font-semibold text-white"
                  style={{ backgroundColor: goalSum !== 100 ? '#E5E1DA' : '#B87333', color: goalSum !== 100 ? '#6B6B6B' : '#fff' }}
                >
                  {savingGoals ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {client.is_physician && (
        <Card title="Physician Details">
          <div className="space-y-3">
            {practiceEntityType === 'PA' && (
              <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #C0392B', color: '#C0392B' }}>
                CRITICAL — PA provides ZERO charging order protection under F.S. §605.0503
              </div>
            )}
            {topPayerConcentration > 70 && (
              <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #C0392B', color: '#C0392B' }}>
                Critical — Gassman Founding Case Pattern risk (payer concentration {topPayerConcentration}%)
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Specialty</label>
                <input type="text" value={physicianSpecialty} onChange={e => setPhysicianSpecialty(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Practice Entity Type</label>
                <select value={practiceEntityType} onChange={e => setPracticeEntityType(e.target.value)} className={inputClass} style={inputStyle}>
                  <option value="">Select...</option>
                  {['PA', 'PLLC', 'LLC', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Practice Name</label>
                <input type="text" value={practiceName} onChange={e => setPracticeName(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Annual Revenue ($)</label>
                <input type="number" min={0} value={annualPracticeRevenue} onChange={e => setAnnualPracticeRevenue(Number(e.target.value))} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Top Payer Concentration (%)</label>
                <input type="number" min={0} max={100} value={topPayerConcentration} onChange={e => setTopPayerConcentration(Number(e.target.value))} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Malpractice Limit ($)</label>
                <input type="number" min={0} value={malpracticeLimit} disabled={!hasMalpracticeCoverage} onChange={e => setMalpracticeLimit(Number(e.target.value))} className={inputClass} style={{ ...inputStyle, opacity: hasMalpracticeCoverage ? 1 : 0.5 }} />
              </div>
            </div>
            <Toggle value={hasMalpracticeCoverage} onChange={setHasMalpracticeCoverage} label="Has Malpractice Coverage" />
            <Toggle value={hasBuySellAgreement} onChange={setHasBuySellAgreement} label="Has Buy-Sell Agreement" />
            {hasBuySellAgreement && (
              <Toggle value={buySellFunded} onChange={setBuySellFunded} label="Buy-Sell Funded" />
            )}
          </div>
          <SaveButton onClick={savePhysician} saving={savingPhysician} />
        </Card>
      )}

      <Card title="Future Events & Flags">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Anticipated Sale Date</label>
              <input type="date" value={anticipatedSaleDate} onChange={e => setAnticipatedSaleDate(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Anticipated Inheritance Date</label>
              <input type="date" value={anticipatedInheritanceDate} onChange={e => setAnticipatedInheritanceDate(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Inheritance Amount ($)</label>
              <input type="number" min={0} value={anticipatedInheritanceAmount} onChange={e => setAnticipatedInheritanceAmount(Number(e.target.value))} className={inputClass} style={inputStyle} />
            </div>
          </div>
          <Toggle value={divorceRiskFlag} onChange={setDivorceRiskFlag} label="Divorce Risk Flag" />
          <Toggle value={healthFlag} onChange={setHealthFlag} label="Health Flag" />
        </div>
        <SaveButton onClick={saveEvents} saving={savingEvents} />
      </Card>
    </div>
  );
}
