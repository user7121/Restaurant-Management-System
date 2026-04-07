import React from 'react';

export default function ProductCard({ product, emoji, qty, onAdd, onChangeQty }) {
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <div className={`product-card${isOutOfStock ? ' out-of-stock' : ''}`}>
      {isOutOfStock && <span className="product-stock-badge">Sold out</span>}
      <div className="product-img-wrap">{emoji}</div>
      <div className="product-info">
        <p className="product-name">{product.name}</p>
        <p className="product-price">
          {parseFloat(product.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </p>
        {qty === 0 ? (
          <button
            id={`add-btn-${product.product_id}`}
            className="add-btn"
            onClick={onAdd}
            disabled={isOutOfStock}
          >
            + Add
          </button>
        ) : (
          <div className="qty-controls">
            <button
              className="qty-btn"
              id={`qty-dec-${product.product_id}`}
              onClick={() => onChangeQty(qty - 1)}
              aria-label="Decrease quantity"
            >−</button>
            <span className="qty-num">{qty}</span>
            <button
              className="qty-btn"
              id={`qty-inc-${product.product_id}`}
              onClick={() => onChangeQty(qty + 1)}
              aria-label="Increase quantity"
            >+</button>
          </div>
        )}
      </div>
    </div>
  );
}
