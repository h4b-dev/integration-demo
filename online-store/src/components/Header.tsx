import { useState } from 'react';
import { useCart } from '../context/useCart';
import { useCredentials } from '../context/useCredentials';
import { ENVIRONMENT_LABELS } from '../config/environments';
import SettingsModal from './SettingsModal';
import './Header.css';

export default function Header() {
  const { totalItems, toggleCart } = useCart();
  const { credentials, isConfigured } = useCredentials();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-icon">⬡</span>
            <span className="logo-text">NexShop</span>
          </div>
          <div className="header-actions">
            <button
              className={`env-badge env-badge--${credentials.environment} ${!isConfigured ? 'env-badge--warn' : ''}`}
              onClick={() => setSettingsOpen(true)}
              title={isConfigured ? 'Edit API settings' : 'API credentials missing — click to configure'}
            >
              <span className="env-badge-dot" />
              <span className="env-badge-label">
                {ENVIRONMENT_LABELS[credentials.environment]}
                {!isConfigured && ' · setup'}
              </span>
            </button>
            <button
              className="settings-button"
              onClick={() => setSettingsOpen(true)}
              title="API settings"
              aria-label="Open API settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button className="cart-button" onClick={toggleCart}>
              <span className="cart-icon">🛒</span>
              <span className="cart-label">Cart</span>
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
          </div>
        </div>
      </header>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
