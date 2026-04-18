'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { US_STATES } from '@/lib/utils';

interface Props {
  tenantId: string;
  onClose: () => void;
  onSaved: () => void;
}

const PRACTICE_ENTITY_TYPES = ['PA', 'PLLC', 'LLC', 'Other'];
const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'];
const CLIENT_STATUSES = ['intake', 'active', 'documents_signed', 'complete', 'archived'];

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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-sm font-semibold uppercase tracking-widest mb-3 pt-4"
      style={{ color: '#6B6B6B', fontFamily: "'Inter', sans-serif", borderTop: '1px solid #E5E1DA' }}
    >
      {children}
    </h3>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: '#2C2C2C', fontFamily: "'Inter', sans-serif" }}>
        {label}{required && <span style={{ color: '#C0392B' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 rounded-md text-sm outline-none focus:ring-1";
const inputStyle = { border: '1px solid #E5E1DA', fontFamily: "'Inter', sans-serif" };

export default function NewClientSlideOver({ tenantId, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('single');
  const [spouseFirstName, setSpouseFirstName] = useState('');
  const [numberOfChildren, setNumberOfChildren] = useState(0);

  const [estateSize, setEstateSize] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [annualIncome, setAnnualIncome] = useState(0);
  const [homesteadDeclared, setHomesteadDeclared] = useState(false);
  const [trustFunded, setTrustFunded] = useState(false);
  const [trustSignedDate, setTrustSignedDate] = useState('');
  const [entityType, setEntityType] = useState('');

  const [isPhysician, setIsPhysician] = useState(false);
  const [physicianSpecialty, setPhysicianSpecialty] = useState('');
  const [practiceEntityType, setPracticeEntityType] = useState('');
  const [practiceName, setPracticeName] = useState('');
  const [annualPracticeRevenue, setAnnualPracticeRevenue] = useState(0);
  const [topPayerConcentration, setTopPayerConcentration] = useState(0);
  const [hasMalpracticeCoverage, setHasMalpracticeCoverage] = useState(false);
  const [malpracticeLimit, setMalpracticeLimit] = useState(0);
  const [hasBuySellAgreement, setHasBuySellAgreement] = useState(false);
  const [buySellFunded, setBuySellFunded] = useState(false);

  const [goalTaxEfficiency, setGoalTaxEfficiency] = useState(25);
  const [goalRiskReduction, setGoalRiskReduction] = useState(25);
  const [goalLiquidity, setGoalLiquidity] = useState(25);
  const [goalSimplicity, setGoalSimplicity] = useState(25);
  const [clientStatus, setClientStatus] = useState('intake');

  const [anticipatedSaleDate, setAnticipatedSaleDate] = useState('');
  const [anticipatedInheritanceDate, setAnticipatedInheritanceDate] = useState('');
  const [anticipatedInheritanceAmount, setAnticipatedInheritanceAmount] = useState(0);
  const [divorceRiskFlag, setDivorceRiskFlag] = useState(false);
  const [healthFlag, setHealthFlag] = useState(false);

  const [cpaName, setCpaName] = useState('');
  const [financialAdvisorName, setFinancialAdvisorName] = useState('');
  const [referralSource, setReferralSource] = useState('');

  const goalSum = goalTaxEfficiency + goalRiskReduction + goalLiquidity + goalSimplicity;
  const unfundedTrustWarning = !trustFunded && !!trustSignedDate;

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setSaveError('First name and last name are required.');
      return;
    }
    setSaving(true);
    setSaveError('');

    const { error } = await supabase.from('clients').insert({
      tenant_id: tenantId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      date_of_birth: dateOfBirth || null,
      email,
      phone,
      marital_status: maritalStatus,
      spouse_first_name: maritalStatus === 'married' ? spouseFirstName : '',
      number_of_children: numberOfChildren,
      estate_size: estateSize,
      net_worth: netWorth,
      annual_income: annualIncome,
      homestead_declared: homesteadDeclared,
      trust_funded: trustFunded,
      trust_signed_date: trustSignedDate || null,
      entity_type: entityType,
      is_physician: isPhysician,
      physician_specialty: isPhysician ? physicianSpecialty : '',
      practice_entity_type: isPhysician ? practiceEntityType : '',
      practice_name: isPhysician ? practiceName : '',
      annual_practice_revenue: isPhysician ? annualPracticeRevenue : 0,
      top_payer_concentration: isPhysician ? topPayerConcentration : 0,
      has_malpractice_coverage: isPhysician ? hasMalpracticeCoverage : false,
      malpractice_limit: isPhysician && hasMalpracticeCoverage ? malpracticeLimit : 0,
      has_buy_sell_agreement: isPhysician ? hasBuySellAgreement : false,
      buy_sell_funded: isPhysician && hasBuySellAgreement ? buySellFunded : false,
      goal_tax_efficiency: goalTaxEfficiency,
      goal_risk_reduction: goalRiskReduction,
      goal_liquidity: goalLiquidity,
      goal_simplicity: goalSimplicity,
      status: clientStatus,
      anticipated_sale_date: anticipatedSaleDate || null,
      anticipated_inheritance_date: anticipatedInheritanceDate || null,
      anticipated_inheritance_amount: anticipatedInheritanceAmount,
      divorce_risk_flag: divorceRiskFlag,
      health_flag: healthFlag,
      cpa_name: cpaName,
      financial_advisor_name: financialAdvisorName,
      referral_source: referralSource,
    });

    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />
      <div
        className="relative flex flex-col bg-white h-full shadow-xl"
        style={{ width: 480, fontFamily: "'Inter', sans-serif" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #E5E1DA' }}
        >
          <h2 className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: '#2C2C2C' }}>
            New Client
          </h2>
          <button onClick={onClose} style={{ color: '#6B6B6B' }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {saveError && (
            <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: '#fef2f2', color: '#C0392B' }}>
              {saveError}
            </div>
          )}

          <SectionHeading>Basic Info</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Last Name" required>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
          </div>
          <Field label="Date of Birth">
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
          </div>
          <Field label="Marital Status">
            <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className={inputClass} style={inputStyle}>
              {MARITAL_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </Field>
          {maritalStatus === 'married' && (
            <Field label="Spouse First Name">
              <input type="text" value={spouseFirstName} onChange={e => setSpouseFirstName(e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
          )}
          <Field label="Number of Children">
            <input type="number" min={0} value={numberOfChildren} onChange={e => setNumberOfChildren(Number(e.target.value))} className={inputClass} style={inputStyle} />
          </Field>

          <SectionHeading>Financial</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estate Size Estimate ($)">
              <input type="number" min={0} value={estateSize} onChange={e => setEstateSize(Number(e.target.value))} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Net Worth ($)">
              <input type="number" min={0} value={netWorth} onChange={e => setNetWorth(Number(e.target.value))} className={inputClass} style={inputStyle} />
            </Field>
          </div>
          <Field label="Annual Income ($)">
            <input type="number" min={0} value={annualIncome} onChange={e => setAnnualIncome(Number(e.target.value))} className={inputClass} style={inputStyle} />
          </Field>
          <Toggle value={homesteadDeclared} onChange={setHomesteadDeclared} label="Homestead Declared" />
          <Toggle value={trustFunded} onChange={setTrustFunded} label="Trust Funded" />
          <Field label="Trust Signed Date">
            <input type="date" value={trustSignedDate} onChange={e => setTrustSignedDate(e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
          {unfundedTrustWarning && (
            <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: '#FEF9E7', border: '1px solid #C9A84C', color: '#92400e' }}>
              Unfunded trust — will trigger critical flag
            </div>
          )}
          <Field label="Entity Type">
            <input type="text" value={entityType} onChange={e => setEntityType(e.target.value)} className={inputClass} style={inputStyle} placeholder="LLC, LLLP, etc." />
          </Field>

          <SectionHeading>Physician</SectionHeading>
          <Toggle value={isPhysician} onChange={setIsPhysician} label="Is Physician" />
          {isPhysician && (
            <div className="space-y-3">
              <Field label="Physician Specialty">
                <input type="text" value={physicianSpecialty} onChange={e => setPhysicianSpecialty(e.target.value)} className={inputClass} style={inputStyle} />
              </Field>
              <Field label="Practice Entity Type">
                <select value={practiceEntityType} onChange={e => setPracticeEntityType(e.target.value)} className={inputClass} style={inputStyle}>
                  <option value="">Select...</option>
                  {PRACTICE_ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Practice Name">
                <input type="text" value={practiceName} onChange={e => setPracticeName(e.target.value)} className={inputClass} style={inputStyle} />
              </Field>
              <Field label="Annual Practice Revenue ($)">
                <input type="number" min={0} value={annualPracticeRevenue} onChange={e => setAnnualPracticeRevenue(Number(e.target.value))} className={inputClass} style={inputStyle} />
              </Field>
              <Field label="Top 3 Payer Concentration (%)">
                <input type="number" min={0} max={100} value={topPayerConcentration} onChange={e => setTopPayerConcentration(Number(e.target.value))} className={inputClass} style={inputStyle} />
              </Field>
              {topPayerConcentration > 70 && (
                <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: '#fef2f2', color: '#C0392B', border: '1px solid #C0392B' }}>
                  Critical — Gassman Founding Case Pattern risk
                </div>
              )}
              <Toggle value={hasMalpracticeCoverage} onChange={setHasMalpracticeCoverage} label="Has Malpractice Coverage" />
              {hasMalpracticeCoverage && (
                <Field label="Malpractice Limit ($)">
                  <input type="number" min={0} value={malpracticeLimit} onChange={e => setMalpracticeLimit(Number(e.target.value))} className={inputClass} style={inputStyle} />
                </Field>
              )}
              <Toggle value={hasBuySellAgreement} onChange={setHasBuySellAgreement} label="Has Buy-Sell Agreement" />
              {hasBuySellAgreement && (
                <Toggle value={buySellFunded} onChange={setBuySellFunded} label="Buy-Sell Funded" />
              )}
            </div>
          )}

          <SectionHeading>Planning Goals</SectionHeading>
          <p className="text-xs" style={{ color: '#6B6B6B' }}>Values should sum to 100%. Current total: <span style={{ color: goalSum === 100 ? '#3A6B4B' : '#C0392B', fontWeight: 600 }}>{goalSum}%</span></p>
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
              <input
                type="range" min={0} max={100} value={value}
                onChange={e => set(Number(e.target.value))}
                className="w-full accent-[#B87333]"
              />
            </div>
          ))}
          <Field label="Client Status">
            <select value={clientStatus} onChange={e => setClientStatus(e.target.value)} className={inputClass} style={inputStyle}>
              {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </Field>

          <SectionHeading>Future Events</SectionHeading>
          <Field label="Anticipated Sale Date">
            <input type="date" value={anticipatedSaleDate} onChange={e => setAnticipatedSaleDate(e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Anticipated Inheritance Date">
              <input type="date" value={anticipatedInheritanceDate} onChange={e => setAnticipatedInheritanceDate(e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Inheritance Amount ($)">
              <input type="number" min={0} value={anticipatedInheritanceAmount} onChange={e => setAnticipatedInheritanceAmount(Number(e.target.value))} className={inputClass} style={inputStyle} />
            </Field>
          </div>
          <Toggle value={divorceRiskFlag} onChange={setDivorceRiskFlag} label="Divorce Risk Flag" />
          <Toggle value={healthFlag} onChange={setHealthFlag} label="Health Flag" />

          <SectionHeading>Advisors</SectionHeading>
          <Field label="CPA Name">
            <input type="text" value={cpaName} onChange={e => setCpaName(e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Financial Advisor Name">
            <input type="text" value={financialAdvisorName} onChange={e => setFinancialAdvisorName(e.target.value)} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Referral Source">
            <input type="text" value={referralSource} onChange={e => setReferralSource(e.target.value)} className={inputClass} style={inputStyle} />
          </Field>

          <div className="pb-4" />
        </div>

        <div
          className="px-6 py-4 flex flex-col gap-2 flex-shrink-0"
          style={{ borderTop: '1px solid #E5E1DA' }}
        >
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ border: '1px solid #B87333', color: '#B87333', backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif" }}
            >
              Import from Clio
            </button>
            <button
              type="button"
              className="flex-1 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ border: '1px solid #B87333', color: '#B87333', backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif" }}
            >
              Import from LEAP
            </button>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-md text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: saving ? '#9A6425' : '#B87333', fontFamily: "'Inter', sans-serif" }}
          >
            {saving ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      </div>
    </div>
  );
}
