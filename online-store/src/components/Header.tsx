import { useCart } from '../context/CartContext';
import './Header.css';

export default function Header() {
  const { totalItems, toggleCart } = useCart();

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">NexShop</span>
        </div>
        <button className="cart-button" onClick={toggleCart}>
          <span className="cart-icon">🛒</span>
          <span className="cart-label">Cart</span>
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </div>
    </header>
  );
}
