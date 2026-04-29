import { useState } from 'react';
import { useCart } from '../context/useCart';
import { usePayment } from '../context/usePayment';
import { useDevPanel } from '../context/useDevPanel';
import { createPaymentLink } from '../services/paymentLink';
import type { TabId } from './Tabs';
import './Cart.css';

interface CartProps {
  activeTab: TabId;
  onPaymentReady: (url: string) => void;
}

export default function Cart({ activeTab, onPaymentReady }: CartProps) {
  const { state, removeItem, updateQuantity, clearCart, closeCart, totalPrice } = useCart();
  const { openCheckout } = usePayment();
  const { setRequest } = useDevPanel();
  const [isLoading, setIsLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  async function handleCheckout() {
    if (activeTab === 'checkout') {
      setIsLoading(true);
      setLinkError(null);
      try {
        const successUrl = `${window.location.origin}${window.location.pathname}?checkout=success`;
        const cancelUrl  = `${window.location.origin}${window.location.pathname}?checkout=cancelled`;
        const result = await createPaymentLink(state.items);
        setRequest({
          label: 'Create Payment Link',
          method: 'POST',
          baseUrl: 'https://api-pay-sandbox.n1co.shop',
          endpoint: '/api/paymentlink/checkout',
          headers: {
            'Authorization': 'Bearer sk_5b62f3…fd5',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: {
            orderName: 'NexShop Order',
            orderDescription: 'Online store purchase',
            lineItems: state.items.map((item) => ({
              product: { sku: item.id, name: item.name, price: item.price },
              quantity: item.quantity,
            })),
            successUrl,
            cancelUrl,
            metadata: [{ name: 'clientId', value: 'nexshop-web' }],
          },
          response: result,
        });
        closeCart();
        onPaymentReady(result.paymentLinkUrl);
      } catch (err) {
        setLinkError(err instanceof Error ? err.message : 'Failed to create payment link');
      } finally {
        setIsLoading(false);
      }
      return;
    }
    closeCart();
    openCheckout(activeTab);
  }

  if (!state.isOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={closeCart} />
      <aside className="cart-panel">
        <div className="cart-header">
          <h2 className="cart-title">Your Cart</h2>
          <button className="cart-close" onClick={closeCart}>✕</button>
        </div>

        {state.items.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">🛒</span>
            <p>Your cart is empty</p>
            <p className="cart-empty-sub">Add some products to get started</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {state.items.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <p className="cart-item-name">{item.name}</p>
                    {item.type === 'subscription' && (
                      <span className="cart-item-tag">
                        {item.interval === 'yearly' ? 'Yearly' : 'Monthly'} plan
                      </span>
                    )}
                    <p className="cart-item-price">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="cart-item-controls">
                    {item.type === 'product' ? (
                      <div className="qty-controls">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>
                    ) : (
                      <span className="qty-fixed">×1</span>
                    )}
                    <button className="remove-btn" onClick={() => removeItem(item.id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span className="cart-total-price">${totalPrice.toFixed(2)}</span>
              </div>

              {linkError && <p className="cart-link-error">{linkError}</p>}

              <button
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="checkout-btn-loading">
                    <span className="checkout-spinner" />
                    Generating link…
                  </span>
                ) : (
                  activeTab === 'checkout' ? 'Pay with Payment Link' : 'Proceed to Checkout'
                )}
              </button>
              <button className="clear-btn" onClick={clearCart}>Clear cart</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
