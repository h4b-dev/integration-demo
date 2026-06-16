import { useState, useCallback } from 'react';
import type { ApiRequest } from '../context/useDevPanel';
import './DevPanel.css';

// ── JSON syntax highlighter ─────────────────────────────────────────────────
function highlight(value: unknown): string {
  const json = JSON.stringify(value, null, 2)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'json-num';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-str';
      } else if (/true|false/.test(match)) {
        cls = 'json-bool';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

// ── Method badge colours ────────────────────────────────────────────────────
const METHOD_COLOR: Record<string, string> = {
  POST:   '#10b981',
  GET:    '#3b82f6',
  DELETE: '#ef4444',
};

// ── Copy button ─────────────────────────────────────────────────────────────
function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = getText();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getText]);

  return (
    <button className={`dp-copy-btn ${copied ? 'dp-copy-btn--done' : ''}`} onClick={handleCopy} title="Copy to clipboard">
      {copied ? (
        <>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 8 6.5 11.5 13 5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="5" width="9" height="9" rx="1.5" />
            <path d="M3 11H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ── Idle screen ─────────────────────────────────────────────────────────────
function IdleScreen() {
  return (
    <div className="dp-idle">
      <div className="dp-idle-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      </div>
      <p className="dp-idle-title">Live Request Preview</p>
      <p className="dp-idle-sub">
        Interact with the store to see API requests being built in real time.
      </p>
      <div className="dp-api-list">
        <div className="dp-api-item">
          <span className="dp-api-badge post">POST</span>
          <span>/api/v3/Token</span>
        </div>
        <div className="dp-api-item">
          <span className="dp-api-badge post">POST</span>
          <span>/api/v3/PaymentMethods</span>
        </div>
        <div className="dp-api-item">
          <span className="dp-api-badge post">POST</span>
          <span>/api/v3/Charges</span>
        </div>
        <div className="dp-api-item">
          <span className="dp-api-badge post">POST</span>
          <span>/api/paymentlink/checkout</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
interface DevPanelProps {
  request: ApiRequest | null;
}

export default function DevPanel({ request }: DevPanelProps) {
  const [collapsed, setCollapsed]     = useState(false);
  const [headersOpen, setHeadersOpen] = useState(true);

  return (
    <aside className={`dev-panel ${collapsed ? 'dev-panel--collapsed' : ''}`}>
      {/* Top bar */}
      <div className="dp-header">
        {!collapsed && (
          <div className="dp-header-left">
            <span className="dp-dot" />
            <span className="dp-header-title">API Request Preview</span>
          </div>
        )}
        <button
          className="dp-collapse-btn"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '‹' : '›'}
        </button>
      </div>

      {!collapsed && (
        <div className="dp-body">
          {!request ? (
            <IdleScreen />
          ) : (
            <>
              {/* Label */}
              <div className="dp-label">{request.label}</div>

              {/* Method + Endpoint row */}
              <div className="dp-endpoint-block">
                <span
                  className="dp-method"
                  style={{ background: METHOD_COLOR[request.method] ?? '#6366f1' }}
                >
                  {request.method}
                </span>
                <span className="dp-endpoint">{request.endpoint}</span>
                <CopyButton getText={() => `${request.method} ${request.baseUrl}${request.endpoint}`} />
              </div>
              <div className="dp-baseurl">{request.baseUrl}</div>

              {/* Headers */}
              <div className="dp-section">
                <button
                  className="dp-section-toggle"
                  onClick={() => setHeadersOpen((v) => !v)}
                >
                  <span className="dp-section-arrow">{headersOpen ? '▾' : '▸'}</span>
                  Headers
                </button>
                {headersOpen && (
                  <div className="dp-headers">
                    {Object.entries(request.headers).map(([k, v]) => (
                      <div key={k} className="dp-header-row">
                        <span className="dp-hkey">{k}:</span>
                        <span className="dp-hval">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="dp-section dp-section--body">
                <div className="dp-section-label-row">
                  <span className="dp-section-label">Body</span>
                  <CopyButton getText={() => JSON.stringify(request.body, null, 2)} />
                </div>
                <pre
                  className="dp-json"
                  dangerouslySetInnerHTML={{ __html: highlight(request.body) }}
                />
              </div>

              {/* Response */}
              {request.response !== undefined && (
                <div className="dp-section dp-section--response">
                  <div className="dp-section-label-row">
                    <span className="dp-section-label dp-section-label--response">Response</span>
                    <CopyButton getText={() => JSON.stringify(request.response, null, 2)} />
                  </div>
                  <pre
                    className="dp-json"
                    dangerouslySetInnerHTML={{ __html: highlight(request.response) }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  );
}
