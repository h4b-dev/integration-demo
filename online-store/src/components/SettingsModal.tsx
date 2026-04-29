import { useState } from 'react';
import { useCredentials } from '../context/CredentialsContext';
import { ENVIRONMENTS, ENVIRONMENT_LABELS } from '../config/environments';
import type { Environment } from '../config/environments';
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { credentials, updateCredentials } = useCredentials();

  const [environment, setEnvironment]           = useState<Environment>(credentials.environment);
  const [clientId, setClientId]                 = useState(credentials.clientId);
  const [clientSecret, setClientSecret]         = useState(credentials.clientSecret);
  const [paymentLinkToken, setPaymentLinkToken] = useState(credentials.paymentLinkToken);

  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken]   = useState(false);

  const urls = ENVIRONMENTS[environment];

  function handleSave() {
    updateCredentials({
      environment,
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      paymentLinkToken: paymentLinkToken.trim(),
    });
    onClose();
  }

  return (
    <>
      <div className="sm-overlay" onClick={onClose} />
      <div className="sm-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="sm-header">
          <div>
            <h2 id="settings-title" className="sm-title">API Settings</h2>
            <p className="sm-subtitle">
              Configure your N1co credentials and pick a target environment. Values are saved in this browser only.
            </p>
          </div>
          <button className="sm-close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="sm-body">

          {/* ── Environment selector ────────────────────────────────── */}
          <section className="sm-section">
            <label className="sm-label">Environment</label>
            <div className="sm-env-toggle" role="radiogroup">
              {(Object.keys(ENVIRONMENTS) as Environment[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={environment === key}
                  className={`sm-env-option ${environment === key ? 'is-active' : ''} sm-env--${key}`}
                  onClick={() => setEnvironment(key)}
                >
                  <span className="sm-env-dot" />
                  <span className="sm-env-name">{ENVIRONMENT_LABELS[key]}</span>
                </button>
              ))}
            </div>

            <div className="sm-url-list">
              <div className="sm-url-row">
                <span className="sm-url-tag">Payment API</span>
                <code className="sm-url">{urls.paymentApi}/api/v3</code>
              </div>
              <div className="sm-url-row">
                <span className="sm-url-tag">Checkout Link API</span>
                <code className="sm-url">{urls.paymentLinkApi}/api</code>
              </div>
            </div>
          </section>

          {/* ── Credentials ─────────────────────────────────────────── */}
          <section className="sm-section">
            <label className="sm-label" htmlFor="sm-client-id">Client ID</label>
            <input
              id="sm-client-id"
              className="sm-input"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="your-client-id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <p className="sm-hint">Used to request the access token at <code>/api/v3/Token</code>.</p>
          </section>

          <section className="sm-section">
            <label className="sm-label" htmlFor="sm-client-secret">Client Secret</label>
            <div className="sm-input-row">
              <input
                id="sm-client-secret"
                className="sm-input"
                type={showSecret ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                placeholder="your-client-secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
              <button
                type="button"
                className="sm-eye-btn"
                onClick={() => setShowSecret((v) => !v)}
                aria-label={showSecret ? 'Hide secret' : 'Show secret'}
              >
                {showSecret ? 'Hide' : 'Show'}
              </button>
            </div>
          </section>

          <section className="sm-section">
            <label className="sm-label" htmlFor="sm-pl-token">Payment Link API Token</label>
            <div className="sm-input-row">
              <input
                id="sm-pl-token"
                className="sm-input"
                type={showToken ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                placeholder="sk_..."
                value={paymentLinkToken}
                onChange={(e) => setPaymentLinkToken(e.target.value)}
              />
              <button
                type="button"
                className="sm-eye-btn"
                onClick={() => setShowToken((v) => !v)}
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="sm-hint">Bearer token sent to the Checkout Link API at <code>/api/paymentlink/checkout</code>.</p>
          </section>
        </div>

        <div className="sm-footer">
          <button className="sm-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="sm-btn-primary" onClick={handleSave}>Save settings</button>
        </div>
      </div>
    </>
  );
}
