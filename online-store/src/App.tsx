import { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { PaymentProvider } from './context/PaymentContext';
import { DevPanelProvider, useDevPanel } from './context/DevPanelContext';
import { PlansProvider } from './context/PlansContext';
import { useCart } from './context/CartContext';
import CheckoutModal from './components/CheckoutModal';
import Header from './components/Header';
import Tabs from './components/Tabs';
import type { TabId } from './components/Tabs';
import Cart from './components/Cart';
import DevPanel from './components/DevPanel';
import PaymentIframeModal from './components/PaymentIframeModal';
import ProductsTab from './pages/ProductsTab';
import SubscriptionsTab from './pages/SubscriptionsTab';
import CheckoutTab from './pages/CheckoutTab';
import ThankYouPage from './pages/ThankYouPage';
import { authenticate } from './services/paymentAuth';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab]       = useState<TabId>('products');
  const [showThankYou, setShowThankYou] = useState(false);
  const [paymentUrl, setPaymentUrl]     = useState<string | null>(null);
  const { request, setRequest } = useDevPanel();
  const { clearCart } = useCart();

  useEffect(() => {
    // Fallback: detect success from URL params (e.g. top-level redirect from payment page)
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      clearCart();
      setShowThankYou(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    authenticate()
      .then(() => console.log('[App] Payment API ready.'))
      .catch((err) => console.error('[App] Payment API auth error:', err));
  }, []);

  useEffect(() => {
    if (activeTab !== 'checkout' && activeTab !== 'subscriptions') setRequest(null);
  }, [activeTab, setRequest]);

  function handlePaymentSuccess() {
    setPaymentUrl(null);
    clearCart();
    setShowThankYou(true);
  }

  function handlePaymentClose() {
    setPaymentUrl(null);
  }

  function handleContinueShopping() {
    setShowThankYou(false);
    setActiveTab('checkout');
  }

  return (
    <div className="app">
      <Header />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="app-body">
        <main className="app-main">
          {showThankYou ? (
            <ThankYouPage onContinue={handleContinueShopping} />
          ) : (
            <>
              {activeTab === 'products'      && <ProductsTab />}
              {activeTab === 'subscriptions' && <SubscriptionsTab />}
              {activeTab === 'checkout'      && <CheckoutTab />}
            </>
          )}
        </main>
        <DevPanel request={request} />
      </div>

      <Cart activeTab={activeTab} onPaymentReady={setPaymentUrl} />
      <CheckoutModal />

      {paymentUrl && (
        <PaymentIframeModal
          url={paymentUrl}
          onSuccess={handlePaymentSuccess}
          onClose={handlePaymentClose}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <PaymentProvider>
        <PlansProvider>
          <DevPanelProvider>
            <AppContent />
          </DevPanelProvider>
        </PlansProvider>
      </PaymentProvider>
    </CartProvider>
  );
}
