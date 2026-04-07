import React, { useState } from 'react';
import { placeOrder } from '../api.js';

export default function CartDrawer({ cart, total, tableId, onClose, onChangeQty, onOrderSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const result = await placeOrder(tableId, cart);
      onOrderSuccess(result);
    } catch (err) {
      onError(err.message);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="drawer-overlay" id="cart-overlay" onClick={onClose} />
      <div className="drawer" id="cart-drawer" role="dialog" aria-label="Shopping cart">
        <div className="drawer-handle" />
        <div className="drawer-header">
          <h2>🛒 Your Order</h2>
          <button id="cart-close-btn" className="drawer-close" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        <div className="drawer-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🍽️</div>
              <p>Your cart is empty.<br />Add some items to get started!</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="drawer-item" id={`cart-item-${item.product_id}`}>
                <span className="drawer-item-emoji">{item.emoji}</span>
                <div className="drawer-item-info">
                  <p className="drawer-item-name">{item.name}</p>
                  <p className="drawer-item-price">
                    {(item.price * item.quantity).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </p>
                </div>
                <div className="drawer-item-qty">
                  <button
                    className="qty-btn"
                    id={`drawer-dec-${item.product_id}`}
                    onClick={() => onChangeQty(item.product_id, item.quantity - 1)}
                    aria-label="Decrease"
                  >−</button>
                  <span className="qty-num">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    id={`drawer-inc-${item.product_id}`}
                    onClick={() => onChangeQty(item.product_id, item.quantity + 1)}
                    aria-label="Increase"
                  >+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="totals-row">
              <span className="totals-label">Total</span>
              <span className="totals-value">
                {total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
            <button
              id="checkout-btn"
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Placing Order…' : '✓ Place Order'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
