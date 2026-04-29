import { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { PaymentProvider } from './context/PaymentContext';
import { DevPanelProvider } from './context/DevPanelContext';
import { useDevPanel } from './context/useDevPanel';
import { PlansProvider } from './context/PlansContext';
import { CredentialsProvider } from './context/CredentialsContext';
import { useCredentials } from './context/useCredentials';
import { useCart } from './context/useCart';
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
import { authenticate, clearToken } from './services/paymentAuth';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab]       = useState<TabId>('products');
  // Initialize from URL synchronously so we don't need to setState inside an effect.
  const [showThankYou, setShowThankYou] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('checkout') === 'success';
  });
  const [paymentUrl, setPaymentUrl]     = useState<string | null>(null);
  const { request, setRequest } = useDevPanel();
  const { clearCart } = useCart();
  const { credentials, isConfigured } = useCredentials();

  useEffect(() => {
    // Fallback: clean up after a top-level redirect from the payment page.
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      clearCart();
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-authenticate when credentials or environment change. Cached tokens are
  // tied to a {environment + clientId} fingerprint, so changing either one
  // invalidates the previous token automatically.
  useEffect(() => {
    if (!isConfigured) {
      clearToken();
      console.warn('[App] API credentials not set — open Settings to configure.');
      return;
    }
    authenticate()
      .then(() => console.log('[App] Payment API ready.'))
      .catch((err) => console.error('[App] Payment API auth error:', err));
  }, [credentials.environment, credentials.clientId, credentials.clientSecret, isConfigured]);

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
    <CredentialsProvider>
      <CartProvider>
        <PaymentProvider>
          <PlansProvider>
            <DevPanelProvider>
              <AppContent />
            </DevPanelProvider>
          </PlansProvider>
        </PaymentProvider>
      </CartProvider>
    </CredentialsProvider>
  );
}
