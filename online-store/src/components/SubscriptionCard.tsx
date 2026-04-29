import { useState } from 'react';
import type { Subscription } from '../types';
import { useCart } from '../context/useCart';
import './SubscriptionCard.css';

interface SubscriptionCardProps {
  subscription: Subscription;
}

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const { addItem, state } = useCart();
  const [added, setAdded] = useState(false);

  const inCart = state.items.some((i) => i.id === subscription.id);

  function handleSubscribe() {
    addItem({
      id: subscription.id,
      name: subscription.name,
      price: subscription.price,
      quantity: 1,
      image: subscription.image,
      type: 'subscription',
      interval: subscription.interval,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  const perMonth =
    subscription.interval === 'yearly'
      ? (subscription.price / 12).toFixed(2)
      : subscription.price.toFixed(2);

  return (
    <div className={`sub-card ${subscription.popular ? 'popular' : ''}`}>
      {subscription.popular && <div className="popular-badge">Most Popular</div>}
      <div className="sub-header">
        <h3 className="sub-name">{subscription.name}</h3>
        <p className="sub-desc">{subscription.description}</p>
        <div className="sub-price-block">
          <span className="sub-price">${perMonth}</span>
          <span className="sub-period">/mo</span>
        </div>
        {subscription.interval === 'yearly' && (
          <p className="sub-billed">Billed ${subscription.price.toFixed(2)}/year</p>
        )}
      </div>
      <ul className="sub-features">
        {subscription.features.map((f, i) => (
          <li key={i} className="sub-feature">
            <span className="feature-check">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <button
        className={`sub-btn ${added ? 'added' : ''} ${inCart ? 'in-cart' : ''}`}
        onClick={handleSubscribe}
      >
        {added ? '✓ Added!' : inCart ? 'In cart' : 'Subscribe'}
      </button>
    </div>
  );
}
