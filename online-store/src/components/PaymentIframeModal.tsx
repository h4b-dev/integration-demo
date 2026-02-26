import { useRef, useState } from 'react';
import './PaymentIframeModal.css';

interface Props {
  url: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PaymentIframeModal({ url, onSuccess, onClose }: Props) {
  const iframeRef   = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading]     = useState(true);
  const [doneOnce, setDoneOnce]   = useState(false);

  function handleLoad() {
    setLoading(false);
    if (doneOnce) return;
    try {
      // Only readable once the iframe is on our own origin (after redirect)
      const href = iframeRef.current?.contentWindow?.location.href ?? '';
      if (href.includes('checkout=success')) {
        setDoneOnce(true);
        onSuccess();
      } else if (href.includes('checkout=cancelled')) {
        setDoneOnce(true);
        onClose();
      }
    } catch {
      // Cross-origin page still loading — CORS blocks the read, which is expected.
    }
  }

  return (
    <div className="pim-overlay">
      <div className="pim-modal">

        {/* Header bar */}
        <div className="pim-header">
          <div className="pim-header-left">
            <span className="pim-lock">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <span className="pim-title">Secure Payment</span>
            <span className="pim-powered">· Powered by N1CO Pay</span>
          </div>
          <button className="pim-close" onClick={onClose} title="Cancel payment">✕</button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="pim-loading">
            <div className="pim-spinner" />
            <p>Loading secure payment page…</p>
          </div>
        )}

        {/* The iframe itself */}
        <iframe
          ref={iframeRef}
          src={url}
          title="Secure Payment"
          className={`pim-iframe ${loading ? 'pim-iframe--hidden' : ''}`}
          onLoad={handleLoad}
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals allow-pointer-lock allow-top-navigation"
        />
      </div>
    </div>
  );
}
