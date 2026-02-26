import { useState, useEffect, useRef } from 'react';
import { usePayment } from '../context/PaymentContext';
import { useCart } from '../context/CartContext';
import { useDevPanel } from '../context/DevPanelContext';
import { tokenizeCard } from '../services/paymentMethods';
import type { CardInput, SavedCard } from '../services/paymentMethods';
import { processCharge, generateOrderId } from '../services/charges';
import type { ChargeResponse, ChargeAuthentication } from '../services/charges';
import { processSubscription } from '../services/subscriptions';
import type { SubscriptionResponse } from '../services/subscriptions';
import './CheckoutModal.css';

// ── Sandbox customer (Payment API) ─────────────────────────────────────────
const SANDBOX_CUSTOMER = {
  id: 'coreAutomatess',
  email: 'coreAutomatess@n1co.com',
  name: 'coreAutomatess',
  phoneNumber: '+50310000019',
};

// ── Subscription customer (Subscription API) ───────────────────────────────
const SUBSCRIPTION_CUSTOMER = {
  name: 'Rollffin',
  email: 'rolfin.guiroa@n1co.com',
  phoneNumber: '+50778787',
};

const BILLING_INFO = { CountryCode: 'US', StateCode: 'CA', ZipCode: '10002' };

const BASE_URL = import.meta.env.VITE_PAYMENT_BASE_URL || 'https://api-sandbox.n1co.shop';

// ── Helpers ────────────────────────────────────────────────────────────────
function formatCardNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

const EMPTY_FORM: CardInput = {
  number: '', cardHolder: '', expirationMonth: '',
  expirationYear: '', cvv: '', singleUse: false,
};

type Step = 'card-select' | 'processing' | 'success' | 'failed' | '3ds';

// ── Component ──────────────────────────────────────────────────────────────
export default function CheckoutModal() {
  const { state, addCard, removeCard, selectCard, closeCheckout } = usePayment();
  const { totalPrice, state: cartState, clearCart } = useCart();
  const { setRequest } = useDevPanel();

  const [step, setStep]                   = useState<Step>('card-select');
  const [showAddCard, setShowAddCard]     = useState(state.savedCards.length === 0);

  // Re-show the add card form automatically when all cards have been removed
  useEffect(() => {
    if (state.savedCards.length === 0) setShowAddCard(true);
  }, [state.savedCards.length]);
  const [form, setForm]                   = useState<CardInput>(EMPTY_FORM);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [chargeResult, setChargeResult]           = useState<ChargeResponse | null>(null);
  const [subscriptionResult, setSubscriptionResult] = useState<SubscriptionResponse | null>(null);
  const [authentication, setAuthentication]       = useState<ChargeAuthentication | null>(null);
  const [threeDsUrl, setThreeDsUrl]               = useState<string | null>(null);
  const [storedAuthId, setStoredAuthId]           = useState<string | null>(null);
  const currentOrderId   = useRef<string | null>(null);
  const threeDsLoadCount = useRef(0);
  const threeDsTriggered = useRef(false);
  const paymentMode      = useRef<'charge' | 'subscription'>('charge');

  const isProductsTab      = state.sourceTab === 'products';
  const isSubscriptionsTab = state.sourceTab === 'subscriptions';

  // ── Dev panel: tokenize request (card form) ──────────────────────────────
  useEffect(() => {
    if (!state.isCheckoutOpen || !showAddCard) return;
    const rawNumber = form.number.replace(/\s/g, '');
    const maskedNumber = rawNumber.length > 0
      ? rawNumber.slice(0, 6).padEnd(rawNumber.length, '█')
      : '';
    setRequest({
      label: 'Tokenize Card',
      method: 'POST',
      baseUrl: BASE_URL,
      endpoint: '/api/v2/PaymentMethods',
      headers: {
        'Authorization': 'Bearer <access_token>',
        'Content-Type': 'application/json',
      },
      body: {
        customer: SANDBOX_CUSTOMER,
        card: {
          number: maskedNumber || '',
          cardHolderName: form.cardHolder || '',
          expirationMonth: form.expirationMonth || '',
          expirationYear: form.expirationYear || '',
          cvv: form.cvv ? '•••' : '',
        },
        singleUse: form.singleUse,
      },
    });
  }, [form, showAddCard, state.isCheckoutOpen, setRequest]);

  // ── Dev panel: charge request (Products tab, card select view) ───────────
  useEffect(() => {
    if (!state.isCheckoutOpen || showAddCard || step === '3ds' || isSubscriptionsTab) return;
    const selectedCard = state.savedCards.find((c) => c.id === state.selectedCardId);
    setRequest({
      label: 'Process Charge',
      method: 'POST',
      baseUrl: BASE_URL,
      endpoint: '/api/v2/Charges',
      headers: {
        'Authorization': 'Bearer <access_token>',
        'Content-Type': 'application/json',
      },
      body: {
        customerId: SANDBOX_CUSTOMER.id,
        cardId: selectedCard ? `tok_••••${selectedCard.last4}` : '<select a card>',
        authenticationId: null,
        BillingInfo: BILLING_INFO,
        order: {
          amount: parseFloat(totalPrice.toFixed(2)),
          description: 'NexShop Order',
          id: 'order-{timestamp}-{random}',
          name: `NexShop — ${cartState.items.length} item(s)`,
        },
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isCheckoutOpen, showAddCard, step, state.sourceTab, state.selectedCardId, state.savedCards, totalPrice, cartState.items.length, setRequest]);

  // ── Dev panel: subscription request (Subscriptions tab, card select view) ─
  useEffect(() => {
    if (!state.isCheckoutOpen || showAddCard || step === '3ds' || !isSubscriptionsTab) return;
    const selectedCard = state.savedCards.find((c) => c.id === state.selectedCardId);
    setRequest({
      label: 'Create Subscription',
      method: 'POST',
      baseUrl: BASE_URL,
      endpoint: '/api/v2/Subscriptions',
      headers: {
        'Authorization': 'Bearer <access_token>',
        'Content-Type': 'application/json',
      },
      body: {
        subscriptionLinkId: state.selectedPlanId ?? '<select a plan>',
        customer: SUBSCRIPTION_CUSTOMER,
        paymentMethod: { id: selectedCard ? `tok_••••${selectedCard.last4}` : '<select a card>' },
        locationCode: 'QA',
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isCheckoutOpen, showAddCard, step, state.sourceTab, state.selectedPlanId, state.selectedCardId, state.savedCards, setRequest]);

  // ── Dev panel: 3DS retry request ──────────────────────────────────────────
  useEffect(() => {
    if (step !== '3ds' || !authentication) return;
    const selectedCard = state.savedCards.find((c) => c.id === state.selectedCardId);

    if (paymentMode.current === 'subscription') {
      setRequest({
        label: 'Create Subscription (3DS Auth)',
        method: 'POST',
        baseUrl: BASE_URL,
        endpoint: '/api/v2/Subscriptions',
        headers: {
          'Authorization': 'Bearer <access_token>',
          'Content-Type': 'application/json',
        },
        body: {
          subscriptionLinkId: state.selectedPlanId ?? '<plan id>',
          customer: SUBSCRIPTION_CUSTOMER,
          paymentMethod: { id: selectedCard ? `tok_••••${selectedCard.last4}` : '<card>' },
          locationCode: 'QA',
          authenticationId: storedAuthId,
        },
      });
    } else {
      setRequest({
        label: 'Process Charge (3DS Auth)',
        method: 'POST',
        baseUrl: BASE_URL,
        endpoint: '/api/v2/Charges',
        headers: {
          'Authorization': 'Bearer <access_token>',
          'Content-Type': 'application/json',
        },
        body: {
          customerId: SANDBOX_CUSTOMER.id,
          cardId: selectedCard ? `tok_••••${selectedCard.last4}` : '<card>',
          authenticationId: storedAuthId,
          BillingInfo: BILLING_INFO,
          order: {
            amount: parseFloat(totalPrice.toFixed(2)),
            description: 'NexShop Order',
            id: 'order-{timestamp}-{random}',
            name: `NexShop — ${cartState.items.length} item(s)`,
          },
        },
      });
    }
  }, [step, storedAuthId, state.savedCards, state.selectedCardId, state.selectedPlanId, totalPrice, cartState.items.length, setRequest]);


  // ── 3DS: postMessage from the iframe ─────────────────────────────────────
  useEffect(() => {
    if (step !== '3ds' || !storedAuthId) return;

    function proceed(success: boolean) {
      if (threeDsTriggered.current) return;
      threeDsTriggered.current = true;
      if (success) {
        if (paymentMode.current === 'subscription') handleSubscribe();
        else handlePay();
      } else {
        setStep('failed');
      }
    }

    function handleMessage(event: MessageEvent) {
      const data = event.data;
      console.log('[3DS] postMessage from iframe:', data);

      let status: string | undefined;
      if (typeof data === 'string') {
        status = data.toLowerCase();
      } else if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        const raw = obj.status ?? obj.type ?? obj.result ?? obj.authStatus ?? obj.authentication_status;
        if (typeof raw === 'string') status = raw.toLowerCase();
      }

      if (!status) return;

      if (status.includes('success') || status.includes('authenticated') || status === 'y') {
        proceed(true);
      } else if (status.includes('fail') || status.includes('error') || status.includes('cancel') || status === 'n') {
        proceed(false);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, storedAuthId]);

  // ── Clear panel when modal closes ────────────────────────────────────────
  useEffect(() => {
    if (!state.isCheckoutOpen) setRequest(null);
  }, [state.isCheckoutOpen, setRequest]);

  if (!state.isCheckoutOpen) return null;

  // ── Card form handlers ─────────────────────────────────────────────────

  function handleFormChange(field: keyof CardInput, value: string | boolean) {
    setError(null);
    setForm((prev) => {
      if (field === 'number')          return { ...prev, number: formatCardNumber(value as string) };
      if (field === 'expirationMonth') return { ...prev, expirationMonth: (value as string).replace(/\D/g, '').slice(0, 2) };
      if (field === 'expirationYear')  return { ...prev, expirationYear: (value as string).replace(/\D/g, '').slice(0, 4) };
      if (field === 'cvv')             return { ...prev, cvv: (value as string).replace(/\D/g, '').slice(0, 4) };
      return { ...prev, [field]: value };
    });
  }

  function fillTestCard() {
    setForm({ number: '4000 0000 0000 1000', cardHolder: 'coreAutomatess', expirationMonth: '01', expirationYear: '2028', cvv: '123', singleUse: false });
  }

  async function handleTokenize() {
    const rawNumber = form.number.replace(/\s/g, '');
    if (rawNumber.length < 13)       return setError('Enter a valid card number.');
    if (!form.cardHolder.trim())     return setError('Cardholder name is required.');
    if (!form.expirationMonth || !form.expirationYear) return setError('Enter the expiration date.');
    if (!form.cvv)                   return setError('CVV is required.');

    setLoading(true);
    setError(null);
    try {
      const response = await tokenizeCard({ ...form, number: rawNumber }, SANDBOX_CUSTOMER);
      addCard({
        id: response.id,
        last4: rawNumber.slice(-4),
        cardHolder: form.cardHolder,
        expirationMonth: form.expirationMonth,
        expirationYear: form.expirationYear,
        brand: response.bin.brand,
      });
      setForm(EMPTY_FORM);
      setShowAddCard(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to tokenize card.');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(card: SavedCard) {
    removeCard(card.id);
  }

  // ── Payment (Products tab only) ────────────────────────────────────────

  async function handlePay() {
    const cardId = state.selectedCardId;
    if (!cardId) return setError('Select a card to continue.');

    // Read from state closure — null on the first call, real auth ID on the 3DS retry.
    const authenticationId = storedAuthId;
    console.log('[handlePay] called — authenticationId:', authenticationId);

    setStep('processing');
    setError(null);

    // Reuse the same order ID for the 3DS retry so the API recognises it as the
    // same order. Generate a fresh ID only on the initial attempt.
    const orderId = authenticationId === null ? generateOrderId() : currentOrderId.current!;
    if (authenticationId === null) currentOrderId.current = orderId;

    const payload = {
      customerId: SANDBOX_CUSTOMER.id,
      cardId,
      authenticationId,
      BillingInfo: BILLING_INFO,
      order: {
        amount: parseFloat(totalPrice.toFixed(2)),
        description: 'NexShop Order',
        id: orderId,
        name: `NexShop — ${cartState.items.length} item(s)`,
      },
    };

    try {
      const result = await processCharge(payload);
      setChargeResult(result);

      if (result.order !== null && result.error === null) {
        clearCart();
        setStep('success');
        return;
      }

      // 3DS required — only on the first attempt (authenticationId === null).
      // If we already sent with an authId and the API still returns authentication,
      // the token is invalid or expired — treat it as a failure to avoid looping.
      if (result.authentication && authenticationId === null) {
        const auth = result.authentication as Record<string, unknown>;

        // Try every plausible field name — the API might not use exactly "id"
        const resolvedAuthId =
          (auth.id              as string | undefined) ??
          (auth.authenticationId as string | undefined) ??
          (auth.authId          as string | undefined) ??
          (auth.token           as string | undefined) ??
          null;

        const url =
          (auth.redirectUrl as string | undefined) ??
          (auth.url         as string | undefined) ??
          (auth.authUrl     as string | undefined) ??
          (auth.threeDsUrl  as string | undefined) ??
          null;

        console.log('[3DS] Full authentication object:', JSON.stringify(auth, null, 2));
        console.log('[3DS] Resolved auth ID:', resolvedAuthId);

        if (resolvedAuthId && url) {
          setStoredAuthId(resolvedAuthId);
          threeDsLoadCount.current = 0;
          threeDsTriggered.current = false;
          setAuthentication(result.authentication);
          setThreeDsUrl(url);
          setStep('3ds');
        } else {
          console.warn('[3DS] Missing auth ID or redirect URL. Full auth:', auth);
          setStep('failed');
        }
        return;
      }

      setStep('failed');
    } catch (err) {
      setChargeResult(null);
      setError(err instanceof Error ? err.message : 'Unexpected error during payment.');
      setStep('card-select');
    }
  }

  // ── Subscription flow ──────────────────────────────────────────────────

  async function handleSubscribe() {
    const cardId = state.selectedCardId;
    if (!cardId) return setError('Select a card to continue.');
    const planId = state.selectedPlanId;
    if (!planId) return setError('No plan selected.');

    const authenticationId = storedAuthId;
    console.log('[handleSubscribe] called — authenticationId:', authenticationId);

    paymentMode.current = 'subscription';
    setStep('processing');
    setError(null);

    const payload = {
      subscriptionLinkId: planId,
      customer: SUBSCRIPTION_CUSTOMER,
      paymentMethod: { id: cardId },
      locationCode: 'QA',
      ...(authenticationId ? { authenticationId } : {}),
    };

    try {
      const result = await processSubscription(payload);
      setSubscriptionResult(result);

      if (result.error === null && !result.authentication) {
        setStep('success');
        return;
      }

      // 3DS required — only on the first attempt
      if (result.authentication && authenticationId === null) {
        const auth = result.authentication as Record<string, unknown>;

        const resolvedAuthId =
          (auth.id               as string | undefined) ??
          (auth.authenticationId as string | undefined) ??
          (auth.authId           as string | undefined) ??
          (auth.token            as string | undefined) ??
          null;

        const url =
          (auth.redirectUrl as string | undefined) ??
          (auth.url         as string | undefined) ??
          (auth.authUrl     as string | undefined) ??
          (auth.threeDsUrl  as string | undefined) ??
          null;

        console.log('[3DS Subscription] Full authentication object:', JSON.stringify(auth, null, 2));
        console.log('[3DS Subscription] Resolved auth ID:', resolvedAuthId);

        if (resolvedAuthId && url) {
          setStoredAuthId(resolvedAuthId);
          threeDsLoadCount.current = 0;
          threeDsTriggered.current = false;
          setAuthentication(result.authentication);
          setThreeDsUrl(url);
          setStep('3ds');
        } else {
          console.warn('[3DS Subscription] Missing auth ID or redirect URL:', auth);
          setStep('failed');
        }
        return;
      }

      setStep('failed');
    } catch (err) {
      setSubscriptionResult(null);
      setError(err instanceof Error ? err.message : 'Unexpected error during subscription.');
      setStep('card-select');
    }
  }

  function handleClose() {
    setStep('card-select');
    setChargeResult(null);
    setSubscriptionResult(null);
    setAuthentication(null);
    setThreeDsUrl(null);
    currentOrderId.current = null;
    setStoredAuthId(null);
    setError(null);
    closeCheckout();
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const title =
    step === 'processing' ? 'Processing...' :
    step === 'success'    ? (isSubscriptionsTab ? 'Subscription Confirmed' : 'Payment Successful') :
    step === 'failed'     ? (isSubscriptionsTab ? 'Subscription Failed' : 'Payment Failed') :
    step === '3ds'        ? '3DS Authentication' :
    isSubscriptionsTab    ? 'Subscribe' :
    'Checkout';

  return (
    <>
      <div className="cm-overlay" onClick={step === 'card-select' ? handleClose : undefined} />
      <div className="cm-modal">

        {/* Header */}
        <div className="cm-header">
          <div>
            <h2 className="cm-title">{title}</h2>
            {step === 'card-select' && (
              <p className="cm-subtitle">
                {isSubscriptionsTab ? (
                  <>Plan ID: <strong>{state.selectedPlanId ?? '—'}</strong><span className="cm-tab-badge">Subscription API</span></>
                ) : (
                  <>Total: <strong>${totalPrice.toFixed(2)}</strong>{isProductsTab && <span className="cm-tab-badge">Payment API</span>}</>
                )}
              </p>
            )}
          </div>
          {step !== 'processing' && (
            <button className="cm-close" onClick={handleClose}>✕</button>
          )}
        </div>

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div className="cm-status-screen">
            <div className="cm-spinner" />
            <p>Processing your payment…</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="cm-status-screen">
            <div className="cm-status-icon success">✓</div>
            <h3>{isSubscriptionsTab ? 'Subscription activated!' : 'Payment confirmed!'}</h3>
            <p className="cm-status-msg">
              {isSubscriptionsTab ? subscriptionResult?.message : chargeResult?.message}
            </p>
            {!isSubscriptionsTab && chargeResult?.order && (
              <pre className="cm-detail">{JSON.stringify(chargeResult.order, null, 2)}</pre>
            )}
            {isSubscriptionsTab && subscriptionResult?.subscription && (
              <pre className="cm-detail">{JSON.stringify(subscriptionResult.subscription, null, 2)}</pre>
            )}
            <button className="cm-action-btn" onClick={handleClose}>Done</button>
          </div>
        )}

        {/* ── FAILED ── */}
        {step === 'failed' && (
          <div className="cm-status-screen">
            <div className="cm-status-icon failed">✕</div>
            <h3>{isSubscriptionsTab ? 'Subscription failed' : 'Payment failed'}</h3>
            <p className="cm-status-msg">
              {isSubscriptionsTab
                ? (subscriptionResult?.message ?? 'The subscription could not be processed.')
                : (chargeResult?.message ?? 'The payment could not be processed.')}
            </p>
            {(isSubscriptionsTab ? subscriptionResult?.error : chargeResult?.error) && (
              <div className="cm-error-detail">
                <span className="cm-error-code">
                  Code {isSubscriptionsTab ? subscriptionResult?.error?.code : chargeResult?.error?.code}
                </span>
                <span>
                  {isSubscriptionsTab ? subscriptionResult?.error?.message : chargeResult?.error?.message}
                </span>
              </div>
            )}
            <div className="cm-status-actions">
              <button className="cm-action-btn" onClick={() => { setStep('card-select'); setChargeResult(null); }}>
                Try again
              </button>
              <button className="cm-action-btn-ghost" onClick={handleClose}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── 3DS AUTHENTICATION ── */}
        {step === '3ds' && (
          <div className="cm-3ds-container">
            <p className="cm-3ds-info">
              Your bank requires additional verification. Complete the authentication below — we'll continue automatically.
            </p>
            {threeDsUrl ? (
              <iframe
                src={threeDsUrl}
                className="cm-3ds-iframe"
                title="3DS Authentication"
                sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
                onLoad={() => {
                  threeDsLoadCount.current += 1;
                  console.log('[3DS] iframe load #', threeDsLoadCount.current);
                  // First load = initial 3DS page. Second load = completion redirect.
                  if (threeDsLoadCount.current === 2 && !threeDsTriggered.current) {
                    threeDsTriggered.current = true;
                    if (paymentMode.current === 'subscription') handleSubscribe();
                    else handlePay();
                  }
                }}
              />
            ) : (
              <div className="cm-3ds-no-url">
                <p>Authentication URL not available. Check console for details.</p>
              </div>
            )}
            <div className="cm-3ds-actions">
              <button className="cm-action-btn-ghost" onClick={handleClose}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── CARD SELECT ── */}
        {step === 'card-select' && (
          <div className="cm-body">

            {/* Saved cards */}
            {state.savedCards.length > 0 && (
              <section className="cm-section">
                <h3 className="cm-section-title">Saved cards</h3>
                <div className="cm-cards-list">
                  {state.savedCards.map((card) => (
                    <div
                      key={card.id}
                      className={`cm-card-row ${state.selectedCardId === card.id ? 'selected' : ''}`}
                      onClick={() => selectCard(card.id)}
                    >
                      <div className="cm-card-radio">
                        {state.selectedCardId === card.id && <div className="cm-radio-dot" />}
                      </div>
                      <span className="cm-card-brand">💳</span>
                      <div className="cm-card-info">
                        <span className="cm-card-number">•••• •••• •••• {card.last4}</span>
                        <span className="cm-card-meta">{card.brand} · {card.expirationMonth}/{card.expirationYear.slice(-2)}</span>
                      </div>
                      <button
                        className="cm-delete-btn"
                        onClick={(e) => { e.stopPropagation(); handleDelete(card); }}
                        title="Remove card"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
                <button className="cm-add-toggle" onClick={() => { setShowAddCard((v) => !v); setError(null); }}>
                  {showAddCard ? '− Cancel' : '+ Add new card'}
                </button>
              </section>
            )}

            {/* New card form */}
            {showAddCard && (
              <section className="cm-section">
                <div className="cm-form-header">
                  <h3 className="cm-section-title">
                    {state.savedCards.length === 0 ? 'Add your card' : 'New card'}
                  </h3>
                  <button className="cm-test-btn" onClick={fillTestCard}>Fill test card</button>
                </div>
                <div className="cm-form">
                  <div className="cm-field cm-field-full">
                    <label className="cm-label">Card number</label>
                    <input className="cm-input" type="text" placeholder="4000 0000 0000 1000"
                      value={form.number} onChange={(e) => handleFormChange('number', e.target.value)} inputMode="numeric" />
                  </div>
                  <div className="cm-field cm-field-full">
                    <label className="cm-label">Cardholder name</label>
                    <input className="cm-input" type="text" placeholder="Name as on card"
                      value={form.cardHolder} onChange={(e) => handleFormChange('cardHolder', e.target.value)} />
                  </div>
                  <div className="cm-field">
                    <label className="cm-label">Month</label>
                    <input className="cm-input" type="text" placeholder="MM"
                      value={form.expirationMonth} onChange={(e) => handleFormChange('expirationMonth', e.target.value)} inputMode="numeric" />
                  </div>
                  <div className="cm-field">
                    <label className="cm-label">Year</label>
                    <input className="cm-input" type="text" placeholder="YYYY"
                      value={form.expirationYear} onChange={(e) => handleFormChange('expirationYear', e.target.value)} inputMode="numeric" />
                  </div>
                  <div className="cm-field">
                    <label className="cm-label">CVV</label>
                    <input className="cm-input" type="password" placeholder="•••"
                      value={form.cvv} onChange={(e) => handleFormChange('cvv', e.target.value)} inputMode="numeric" />
                  </div>
                  <div className="cm-field cm-field-full cm-field-toggle">
                    <label className="cm-toggle-label">
                      <input type="checkbox" checked={form.singleUse} onChange={(e) => handleFormChange('singleUse', e.target.checked)} />
                      <span>Single use only</span>
                    </label>
                  </div>
                  <button className="cm-tokenize-btn" onClick={handleTokenize} disabled={loading}>
                    {loading ? 'Tokenizing…' : '🔐 Tokenize & save card'}
                  </button>
                </div>
              </section>
            )}

            {error && <div className="cm-error">{error}</div>}

            {/* Pay button — Products tab */}
            {state.savedCards.length > 0 && !showAddCard && isProductsTab && (
              <button className="cm-pay-btn" onClick={handlePay} disabled={!state.selectedCardId}>
                Pay ${totalPrice.toFixed(2)}
              </button>
            )}

            {/* Subscribe button — Subscriptions tab */}
            {state.savedCards.length > 0 && !showAddCard && isSubscriptionsTab && (
              <button className="cm-pay-btn" onClick={handleSubscribe} disabled={!state.selectedCardId}>
                Subscribe
              </button>
            )}

            {/* Other tabs: coming soon */}
            {state.savedCards.length > 0 && !showAddCard && !isProductsTab && !isSubscriptionsTab && (
              <div className="cm-coming-soon">
                Payment for this tab will be integrated soon.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
