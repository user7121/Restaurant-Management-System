import React from 'react';

export default function SuccessScreen({ result, tableId, cart, onNewOrder }) {
  return (
    <div className="success-screen">
      <div className="success-anim">✓</div>
      <h1>Order Placed!</h1>
      <p>Your order has been sent to the kitchen.</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Table {tableId}</p>
      <div className="order-id-chip">Order #{result?.order_id}</div>

      {cart.length > 0 && (
        <div className="order-summary-mini">
          <h3>Order Summary</h3>
          {cart.map((item) => (
            <div key={item.product_id} className="summary-item">
              <span className="summary-item-name">{item.emoji} {item.name} × {item.quantity}</span>
              <span className="summary-item-total">
                {(item.price * item.quantity).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
          ))}
          <div className="summary-grand">
            <span className="label">Total</span>
            <span className="value">
              {(result?.total_amount ?? cart.reduce((s, i) => s + i.price * i.quantity, 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
          </div>
        </div>
      )}

      <button id="new-order-btn" className="new-order-btn" onClick={onNewOrder}>
        ＋ Order More
      </button>
    </div>
  );
}
