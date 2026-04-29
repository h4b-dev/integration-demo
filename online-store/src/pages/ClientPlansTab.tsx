import { usePlans } from '../context/usePlans';
import { usePayment } from '../context/usePayment';
import './ClientPlansTab.css';

const CYCLE_LABEL: Record<string, string> = {
  DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year',
};

export default function ClientPlansTab() {
  const { plans } = usePlans();
  const { openCheckout, selectPlan } = usePayment();

  if (plans.length === 0) {
    return (
      <div className="cpt-empty">
        <div className="cpt-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
        </div>
        <p className="cpt-empty-title">No plans available yet</p>
        <p className="cpt-empty-sub">Go to the <strong>Admin</strong> tab to create subscription plans.</p>
      </div>
    );
  }

  return (
    <div className="cpt-grid">
      {plans.map((plan) => (
        <div key={plan.id} className="cpt-card">
          <div className="cpt-card-body">
            <h3 className="cpt-name">{plan.name}</h3>
            {plan.description && <p className="cpt-desc">{plan.description}</p>}

            <div className="cpt-price-block">
              <span className="cpt-price">${plan.amount.toFixed(2)}</span>
              <span className="cpt-period">
                /{CYCLE_LABEL[plan.billingCycleType] ?? plan.billingCycleType.toLowerCase()}
              </span>
            </div>

            {plan.trialCyclesNumber > 0 && (
              <span className="cpt-trial">
                {plan.trialCyclesNumber}-{CYCLE_LABEL[plan.trialCycleType] ?? plan.trialCycleType.toLowerCase()} free trial
              </span>
            )}
          </div>

          <div className="cpt-card-footer">
            <div className="cpt-plan-id" title="Plan ID (required for subscription API)">
              <span className="cpt-plan-id-label">Plan ID</span>
              <code className="cpt-plan-id-value">{plan.id}</code>
            </div>
            <button
              className="cpt-btn"
              onClick={() => { selectPlan(plan.id); openCheckout('subscriptions'); }}
            >
              Subscribe
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
