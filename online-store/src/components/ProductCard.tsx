import { useState } from 'react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, state } = useCart();
  const [added, setAdded] = useState(false);

  const cartItem = state.items.find((i) => i.id === product.id);
  const quantityInCart = cartItem?.quantity ?? 0;

  function handleAdd() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      type: 'product',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="product-card">
      <div className="product-image-wrap">
        <img src={product.image} alt={product.name} className="product-image" loading="lazy" />
        <span className="product-category">{product.category}</span>
        {product.stock <= 10 && (
          <span className="product-stock-warn">Only {product.stock} left</span>
        )}
      </div>
      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <button
            className={`add-btn ${added ? 'added' : ''}`}
            onClick={handleAdd}
            disabled={product.stock === 0}
          >
            {added ? '✓ Added' : quantityInCart > 0 ? `Add more (${quantityInCart})` : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
