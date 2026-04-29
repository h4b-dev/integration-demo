import { useState, useEffect } from 'react';
import { useDevPanel } from '../context/useDevPanel';
import { usePlans } from '../context/usePlans';
import { useCredentials } from '../context/useCredentials';
import { ENVIRONMENTS } from '../config/environments';
import { createPlan } from '../services/plans';
import type { PlanPayload } from '../services/plans';
import './AdminPlansTab.css';

const CYCLE_TYPES = ['DAY', 'WEEK', 'MONTH', 'YEAR'];

const DEFAULT_FORM = {
  name: '',
  description: '',
  amount: '',
  successUrl: 'https://pay.h4b.dev',
  cancelUrl: 'https://pay.h4b.dev',
  billingCycleType: 'MONTH',
  billingCyclesNumber: '1',
  trialCycleType: 'DAY',
  trialCyclesNumber: '7',
  cyclesToBillBeforeAllowCancelation: '',
  subscriberLimit: '',
  enrollmentEndDate: '',
  subscriptionEndDate: '',
  billingDay: '',
  locationId: '119',
};

function toPayload(form: typeof DEFAULT_FORM): PlanPayload {
  return {
    name: form.name,
    description: form.description,
    amount: parseFloat(form.amount) || 0,
    successUrl: form.successUrl,
    cancelUrl: form.cancelUrl,
    billingCycleType: form.billingCycleType,
    billingCyclesNumber: parseInt(form.billingCyclesNumber) || 1,
    trialCycleType: form.trialCycleType,
    trialCyclesNumber: parseInt(form.trialCyclesNumber) || 0,
    cyclesToBillBeforeAllowCancelation: form.cyclesToBillBeforeAllowCancelation
      ? parseInt(form.cyclesToBillBeforeAllowCancelation)
      : null,
    subscriberLimit: form.subscriberLimit ? parseInt(form.subscriberLimit) : null,
    enrollmentEndDate: form.enrollmentEndDate || null,
    subscriptionEndDate: form.subscriptionEndDate || null,
    billingDay: form.billingDay ? parseInt(form.billingDay) : null,
    locationId: parseInt(form.locationId) || 119,
  };
}

export default function AdminPlansTab() {
  const { setRequest } = useDevPanel();
  const { plans, addPlan, removePlan } = usePlans();
  const { credentials } = useCredentials();
  const BASE_URL = ENVIRONMENTS[credentials.environment].paymentApi;
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update DevPanel in real time as form changes
  useEffect(() => {
    setRequest({
      label: 'Create Plan',
      method: 'POST',
      baseUrl: BASE_URL,
      endpoint: '/api/v2/Plans',
      headers: {
        'Authorization': 'Bearer <access_token>',
        'Content-Type': 'application/json',
      },
      body: toPayload(form),
    });
  }, [form, setRequest, BASE_URL]);

  // Clear DevPanel on unmount
  useEffect(() => {
    return () => setRequest(null);
  }, [setRequest]);

  function set(field: keyof typeof DEFAULT_FORM, value: string) {
    setError(null);
    setSuccess(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Plan name is required.');
    if (!form.amount || isNaN(parseFloat(form.amount))) return setError('A valid amount is required.');

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = toPayload(form);

    try {
      const planId = await createPlan(payload);

      // Update DevPanel to show response
      setRequest({
        label: 'Create Plan',
        method: 'POST',
        baseUrl: BASE_URL,
        endpoint: '/api/v2/Plans',
        headers: {
          'Authorization': 'Bearer <access_token>',
          'Content-Type': 'application/json',
        },
        body: payload,
        response: planId,
      });

      addPlan({
        id: planId,
        name: form.name,
        description: form.description,
        amount: payload.amount,
        billingCycleType: form.billingCycleType,
        billingCyclesNumber: payload.billingCyclesNumber,
        trialCycleType: form.trialCycleType,
        trialCyclesNumber: payload.trialCyclesNumber,
        locationId: payload.locationId,
      });

      setSuccess(`Plan "${form.name}" created — ID: ${planId}`);
      setForm(DEFAULT_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="apt-container">
      <div className="apt-header">
        <div>
          <h3 className="apt-title">Create Subscription Plan</h3>
          <p className="apt-subtitle">Configure a plan — the sidebar shows the live API request</p>
        </div>
      </div>

      <form className="apt-form" onSubmit={handleSubmit}>

        {/* ── Basic info ── */}
        <div className="apt-section">
          <span className="apt-section-title">Basic Info</span>
          <div className="apt-row">
            <div className="apt-field apt-field--full">
              <label className="apt-label">Plan name</label>
              <input className="apt-input" type="text" placeholder="Plan en sandbox"
                value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="apt-field apt-field--full">
              <label className="apt-label">Description</label>
              <textarea className="apt-input apt-textarea" placeholder="Descripción de la suscripción"
                value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
            </div>
            <div className="apt-field">
              <label className="apt-label">Amount (USD)</label>
              <input className="apt-input" type="number" step="0.01" min="0" placeholder="14.99"
                value={form.amount} onChange={(e) => set('amount', e.target.value)} />
            </div>
            <div className="apt-field">
              <label className="apt-label">Location ID</label>
              <input className="apt-input" type="number" placeholder="119"
                value={form.locationId} onChange={(e) => set('locationId', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Billing cycle ── */}
        <div className="apt-section">
          <span className="apt-section-title">Billing Cycle</span>
          <div className="apt-row">
            <div className="apt-field">
              <label className="apt-label">Cycle type</label>
              <select className="apt-input apt-select"
                value={form.billingCycleType} onChange={(e) => set('billingCycleType', e.target.value)}>
                {CYCLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="apt-field">
              <label className="apt-label">Number of cycles</label>
              <input className="apt-input" type="number" min="1" placeholder="1"
                value={form.billingCyclesNumber} onChange={(e) => set('billingCyclesNumber', e.target.value)} />
            </div>
            <div className="apt-field">
              <label className="apt-label">Billing day <span className="apt-optional">(optional)</span></label>
              <input className="apt-input" type="number" min="1" max="31" placeholder="null"
                value={form.billingDay} onChange={(e) => set('billingDay', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Trial ── */}
        <div className="apt-section">
          <span className="apt-section-title">Trial Period</span>
          <div className="apt-row">
            <div className="apt-field">
              <label className="apt-label">Trial cycle type</label>
              <select className="apt-input apt-select"
                value={form.trialCycleType} onChange={(e) => set('trialCycleType', e.target.value)}>
                {CYCLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="apt-field">
              <label className="apt-label">Trial cycles</label>
              <input className="apt-input" type="number" min="0" placeholder="7"
                value={form.trialCyclesNumber} onChange={(e) => set('trialCyclesNumber', e.target.value)} />
            </div>
            <div className="apt-field">
              <label className="apt-label">Cycles before cancel <span className="apt-optional">(optional)</span></label>
              <input className="apt-input" type="number" min="0" placeholder="null"
                value={form.cyclesToBillBeforeAllowCancelation}
                onChange={(e) => set('cyclesToBillBeforeAllowCancelation', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Limits & dates ── */}
        <div className="apt-section">
          <span className="apt-section-title">Limits & Dates <span className="apt-optional">(all optional)</span></span>
          <div className="apt-row">
            <div className="apt-field">
              <label className="apt-label">Subscriber limit</label>
              <input className="apt-input" type="number" min="0" placeholder="null"
                value={form.subscriberLimit} onChange={(e) => set('subscriberLimit', e.target.value)} />
            </div>
            <div className="apt-field">
              <label className="apt-label">Enrollment end date</label>
              <input className="apt-input" type="date"
                value={form.enrollmentEndDate} onChange={(e) => set('enrollmentEndDate', e.target.value)} />
            </div>
            <div className="apt-field">
              <label className="apt-label">Subscription end date</label>
              <input className="apt-input" type="date"
                value={form.subscriptionEndDate} onChange={(e) => set('subscriptionEndDate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── URLs ── */}
        <div className="apt-section">
          <span className="apt-section-title">Redirect URLs</span>
          <div className="apt-row">
            <div className="apt-field apt-field--full">
              <label className="apt-label">Success URL</label>
              <input className="apt-input" type="url" placeholder="https://pay.h4b.dev"
                value={form.successUrl} onChange={(e) => set('successUrl', e.target.value)} />
            </div>
            <div className="apt-field apt-field--full">
              <label className="apt-label">Cancel URL</label>
              <input className="apt-input" type="url" placeholder="https://pay.h4b.dev"
                value={form.cancelUrl} onChange={(e) => set('cancelUrl', e.target.value)} />
            </div>
          </div>
        </div>

        {error  && <div className="apt-error">{error}</div>}
        {success && <div className="apt-success">{success}</div>}

        <button className="apt-submit" type="submit" disabled={loading}>
          {loading ? 'Creating plan…' : 'Create Plan'}
        </button>
      </form>

      {/* ── Created plans list ── */}
      {plans.length > 0 && (
        <div className="apt-plans-list">
          <span className="apt-section-title">Created Plans</span>
          {plans.map((plan) => (
            <div key={plan.id} className="apt-plan-row">
              <div className="apt-plan-info">
                <span className="apt-plan-name">{plan.name}</span>
                <span className="apt-plan-meta">
                  ${plan.amount.toFixed(2)}/{plan.billingCycleType.toLowerCase()} · ID: {plan.id}
                </span>
              </div>
              <button className="apt-delete-btn" onClick={() => removePlan(plan.id)} title="Remove plan">
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
