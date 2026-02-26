import './ThankYouPage.css';

interface ThankYouPageProps {
  onContinue: () => void;
}

export default function ThankYouPage({ onContinue }: ThankYouPageProps) {
  return (
    <div className="thankyou-page">
      <div className="thankyou-card">
        <div className="thankyou-icon">✓</div>
        <h1 className="thankyou-title">Thank you for your purchase!</h1>
        <p className="thankyou-message">
          Your order has been placed successfully. You'll receive a confirmation shortly.
        </p>
        <button className="thankyou-btn" onClick={onContinue}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
