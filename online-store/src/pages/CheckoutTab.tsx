import { useState, useEffect } from 'react';
import { checkoutProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useDevPanel } from '../context/DevPanelContext';
import './TabPage.css';

const categories = ['All', ...Array.from(new Set(checkoutProducts.map((p) => p.category)))];

export default function CheckoutTab() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const { state: cartState } = useCart();
  const { setRequest } = useDevPanel();

  // Keep the dev panel in sync with the current cart
  useEffect(() => {
    const successUrl = `${window.location.origin}${window.location.pathname}?checkout=success`;
    const cancelUrl  = `${window.location.origin}${window.location.pathname}?checkout=cancelled`;

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
        lineItems: cartState.items.map((item) => ({
          product: { sku: item.id, name: item.name, price: item.price },
          quantity: item.quantity,
        })),
        successUrl,
        cancelUrl,
        metadata: [{ name: 'clientId', value: 'nexshop-web' }],
      },
    });
  }, [cartState.items, setRequest]);

  const filtered = checkoutProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="tab-page">
      <div className="tab-page-header">
        <div>
          <h2 className="tab-page-title">Checkout Store</h2>
          <p className="tab-page-subtitle">Fast checkout links · Processed via Payment Link API</p>
        </div>
        <div className="tab-api-badge">Payment Link API</div>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="category-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-btn ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No products found matching your search.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
