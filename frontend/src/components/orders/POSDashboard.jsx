import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategories, getProducts, getOrders, createOrder, updateOrderStatus } from '../../services/api';

const POSDashboard = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [addedProduct, setAddedProduct] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes, ordersRes] = await Promise.all([
          getCategories(), getProducts(), getOrders()
        ]);
        setCategories(catRes.data || []);
        setProducts(prodRes.data || []);
        if (catRes.data && catRes.data.length > 0) {
          setActiveCategory(catRes.data[0].category_id);
        }
        const tableOrders = (ordersRes.data || []).filter(
          o => o.table_number === parseInt(tableId) && !['Delivered', 'Cancelled'].includes(o.status)
        );
        if (tableOrders.length > 0) setActiveOrder(tableOrders[0]);
      } catch (err) {
        setError('Error loading POS data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableId]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = (product) => {
    if (activeOrder) return;
    setCart((prev) => {
      const existing = prev.find(item => item.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          showToast('Not enough stock available!', 'error');
          return prev;
        }
        return prev.map(item =>
          item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (product.stock_quantity < 1) {
        showToast('Out of stock!', 'error');
        return prev;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setAddedProduct(product.product_id);
    setTimeout(() => setAddedProduct(null), 400);
  };

  const updateQty = (productId, delta) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.product_id !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty < 1) return null;
        if (newQty > item.stock_quantity) {
          showToast('Not enough stock!', 'error');
          return item;
        }
        return { ...item, quantity: newQty };
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter(item => item.product_id !== productId));
  };

  const currentProducts = products.filter(p => p.category_id === activeCategory);
  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const items = cart.map(c => ({ product_id: c.product_id, quantity: c.quantity }));
      await createOrder({ table_id: parseInt(tableId), items });
      showToast('Order placed successfully!');
      setTimeout(() => navigate('/admin/tables'), 1000);
    } catch (err) {
      showToast('Failed to place order: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!activeOrder) return;
    try {
      await updateOrderStatus(activeOrder.order_id, status);
      showToast(`Order marked as ${status}`);
      setTimeout(() => navigate('/admin/tables'), 1000);
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  const statusFlow = [
    { status: 'Pending', label: 'Pending', color: 'var(--warning-500)', icon: '⏳' },
    { status: 'Preparing', label: 'Preparing', color: 'var(--info-500)', icon: '👨‍🍳' },
    { status: 'Ready', label: 'Ready', color: 'var(--success-500)', icon: '✅' },
    { status: 'Delivered', label: 'Delivered', color: 'var(--purple-500)', icon: '🎉' },
  ];

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loadingState}>
          <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 'var(--radius-lg)', marginBottom: 20 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ width: '100%', height: 120, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.errorBox}>
          <span>{error}</span>
          <button onClick={() => window.location.reload()} style={s.retryBtn}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div style={{
          ...s.toast,
          background: toast.type === 'error' ? 'var(--danger-600)' : 'var(--success-600)',
        }} className="animate-slide-right">
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.posHeader} className="animate-fade-in">
        <div style={s.headerLeft}>
          <button onClick={() => navigate('/admin/tables')} style={s.backBtn}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(148,163,184,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(148,163,184,0.08)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 style={s.title}>Table #{tableId}</h1>
            <p style={s.subtitle}>{activeOrder ? `Active Order #${activeOrder.order_id}` : 'POS Terminal'}</p>
          </div>
        </div>
        <div style={s.headerRight}>
          {!activeOrder && cartCount > 0 && (
            <div style={s.cartBadge} className="animate-pop-in">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>
      </div>

      <div style={s.container}>
        {/* Left: Menu */}
        <div style={s.menuPanel} className="animate-fade-in">
          {/* Categories */}
          <div style={s.categoryBar}>
            {categories.map(cat => (
              <button
                key={cat.category_id}
                onClick={() => setActiveCategory(cat.category_id)}
                style={{
                  ...s.categoryBtn,
                  ...(activeCategory === cat.category_id ? s.categoryBtnActive : {}),
                }}
                onMouseEnter={e => {
                  if (activeCategory !== cat.category_id) e.currentTarget.style.background = 'rgba(148,163,184,0.1)';
                }}
                onMouseLeave={e => {
                  if (activeCategory !== cat.category_id) e.currentTarget.style.background = 'transparent';
                }}
              >
                {cat.category_name}
              </button>
            ))}
          </div>

          {/* Products */}
          <div style={s.productGrid}>
            {currentProducts.map((product, idx) => {
              const outOfStock = product.stock_quantity < 1;
              const disabled = outOfStock || !!activeOrder;
              const isAdding = addedProduct === product.product_id;
              return (
                <div
                  key={product.product_id}
                  onClick={() => !disabled && addToCart(product)}
                  className="animate-fade-in-up"
                  style={{
                    ...s.productCard,
                    animationDelay: `${idx * 30}ms`,
                    opacity: disabled ? 0.45 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transform: isAdding ? 'scale(0.95)' : 'scale(1)',
                    borderColor: isAdding ? 'var(--primary-500)' : 'rgba(148, 163, 184, 0.08)',
                  }}
                  onMouseEnter={e => {
                    if (!disabled) {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.08)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div style={s.productTop}>
                    <div style={s.productName}>{product.name}</div>
                    {!disabled && (
                      <div style={s.addIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </div>
                    )}
                  </div>
                  <div style={s.productPrice}>₺{parseFloat(product.price).toFixed(2)}</div>
                  <div style={{
                    ...s.stockChip,
                    color: outOfStock ? 'var(--danger-400)' : product.stock_quantity <= 5 ? 'var(--warning-400)' : 'var(--surface-500)',
                  }}>
                    {outOfStock ? 'Out of stock' : `${product.stock_quantity} in stock`}
                  </div>
                </div>
              );
            })}
            {currentProducts.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-10)', color: 'var(--surface-500)' }}>
                No products in this category
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart / Order */}
        <div style={s.cartPanel} className="animate-slide-right">
          {activeOrder ? (
            /* Active Order View */
            <div style={s.activeOrderContent}>
              <h3 style={s.cartTitle}>Order #{activeOrder.order_id}</h3>

              {/* Status timeline */}
              <div style={s.timeline}>
                {statusFlow.map((step, idx) => {
                  const currentIdx = statusFlow.findIndex(sf => sf.status === activeOrder.status);
                  const isActive = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div key={step.status} style={s.timelineStep}>
                      <div style={{
                        ...s.timelineDot,
                        background: isActive ? step.color : 'var(--surface-700)',
                        boxShadow: isCurrent ? `0 0 0 4px ${step.color}33` : 'none',
                      }}>
                        {isActive ? step.icon : idx + 1}
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isActive ? 'var(--surface-200)' : 'var(--surface-600)',
                        marginTop: 4,
                      }}>
                        {step.label}
                      </span>
                      {idx < statusFlow.length - 1 && (
                        <div style={{
                          ...s.timelineLine,
                          background: isActive ? step.color : 'var(--surface-700)',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={s.orderTotal}>
                <span style={{ color: 'var(--surface-400)' }}>Total Amount</span>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--surface-50)' }}>
                  ₺{parseFloat(activeOrder.total_amount).toFixed(2)}
                </span>
              </div>

              <div style={s.orderNote}>
                Note: Cannot add items to existing orders in this version.
              </div>

              <div style={s.actionButtons}>
                {activeOrder.status === 'Pending' && (
                  <button onClick={() => handleUpdateStatus('Preparing')} style={{ ...s.actionBtn, background: 'var(--info-600)' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    👨‍🍳 Start Preparing
                  </button>
                )}
                {activeOrder.status === 'Preparing' && (
                  <button onClick={() => handleUpdateStatus('Ready')} style={{ ...s.actionBtn, background: 'var(--success-600)' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    ✅ Mark Ready
                  </button>
                )}
                {activeOrder.status === 'Ready' && (
                  <button onClick={() => handleUpdateStatus('Delivered')} style={{ ...s.actionBtn, background: 'var(--purple-600)' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    🎉 Mark Delivered
                  </button>
                )}
                <button onClick={() => handleUpdateStatus('Cancelled')} style={{ ...s.actionBtn, background: 'rgba(239,68,68,0.12)', color: 'var(--danger-400)', border: '1px solid rgba(239,68,68,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-600)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = 'var(--danger-400)'; }}
                >
                  Cancel Order
                </button>
              </div>
            </div>
          ) : (
            /* Cart View */
            <>
              <h3 style={s.cartTitle}>Current Cart</h3>

              <div style={s.cartItems}>
                {cart.length === 0 ? (
                  <div style={s.emptyCart}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--surface-600)" strokeWidth="1.5">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <p style={{ color: 'var(--surface-500)', marginTop: 'var(--space-3)', fontSize: '14px' }}>
                      Select products to add to cart
                    </p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product_id} style={s.cartItem} className="animate-fade-in">
                      <div style={s.cartItemInfo}>
                        <div style={s.cartItemName}>{item.name}</div>
                        <div style={s.cartItemPrice}>₺{parseFloat(item.price).toFixed(2)} each</div>
                      </div>
                      <div style={s.cartItemRight}>
                        <div style={s.qtyControl}>
                          <button onClick={() => updateQty(item.product_id, -1)} style={s.qtyBtn}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-600)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-700)'}
                          >−</button>
                          <span style={s.qtyValue}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.product_id, 1)} style={s.qtyBtn}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-600)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-700)'}
                          >+</button>
                        </div>
                        <div style={s.lineTotal}>₺{(item.quantity * parseFloat(item.price)).toFixed(2)}</div>
                        <button onClick={() => removeFromCart(item.product_id)} style={s.removeBtn}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-500)'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger-400)'; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart footer */}
              <div style={s.cartFooter}>
                <div style={s.totalRow}>
                  <span style={{ fontSize: '14px', color: 'var(--surface-400)', fontWeight: 500 }}>Total</span>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--surface-50)' }}>₺{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0 || isSubmitting}
                  style={{
                    ...s.submitBtn,
                    opacity: (cart.length === 0 || isSubmitting) ? 0.5 : 1,
                    cursor: (cart.length === 0 || isSubmitting) ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { if (cart.length > 0 && !isSubmitting) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {isSubmitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'pulse 0.6s linear infinite' }} />
                      Placing Order...
                    </span>
                  ) : (
                    '🍳 Send to Kitchen'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const s = {
  page: { position: 'relative' },
  posHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-6)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 'var(--space-4)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 'var(--radius-lg)',
    background: 'rgba(148,163,184,0.08)',
    border: '1px solid rgba(148,163,184,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--surface-300)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  title: { fontSize: '24px', fontWeight: 800, color: 'var(--surface-50)', margin: 0, letterSpacing: '-0.3px' },
  subtitle: { fontSize: '13px', color: 'var(--surface-500)', marginTop: 2 },
  cartBadge: {
    padding: '4px 14px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--primary-600)',
    color: 'white',
    fontSize: '12px',
    fontWeight: 700,
  },
  container: {
    display: 'flex',
    gap: 'var(--space-6)',
    height: 'calc(100vh - 180px)',
    minHeight: 0,
  },
  menuPanel: {
    flex: 2,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  categoryBar: {
    display: 'flex',
    gap: 'var(--space-2)',
    overflowX: 'auto',
    paddingBottom: 'var(--space-4)',
    marginBottom: 'var(--space-4)',
    flexShrink: 0,
  },
  categoryBtn: {
    padding: 'var(--space-2) var(--space-5)',
    borderRadius: 'var(--radius-full)',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--surface-400)',
    background: 'transparent',
    border: '1px solid rgba(148,163,184,0.1)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
  },
  categoryBtnActive: {
    background: 'var(--primary-600)',
    color: 'white',
    borderColor: 'var(--primary-600)',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: 'var(--space-4)',
    overflowY: 'auto',
    flex: 1,
    paddingRight: 'var(--space-2)',
  },
  productCard: {
    padding: 'var(--space-4)',
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(148,163,184,0.08)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  productTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--surface-100)',
    flex: 1,
  },
  addIcon: {
    width: 28, height: 28,
    borderRadius: 'var(--radius-md)',
    background: 'rgba(99,102,241,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--primary-400)',
    flexShrink: 0,
  },
  productPrice: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--primary-400)',
  },
  stockChip: {
    fontSize: '11px',
    fontWeight: 600,
  },
  cartPanel: {
    flex: 1,
    minWidth: 320,
    maxWidth: 380,
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid rgba(148,163,184,0.06)',
    padding: 'var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  cartTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--surface-100)',
    margin: 0,
    marginBottom: 'var(--space-4)',
    paddingBottom: 'var(--space-3)',
    borderBottom: '1px solid rgba(148,163,184,0.06)',
  },
  cartItems: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  emptyCart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 'var(--space-10)',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-3) var(--space-3)',
    background: 'rgba(148,163,184,0.04)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(148,163,184,0.06)',
  },
  cartItemInfo: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  cartItemName: { fontSize: '13px', fontWeight: 600, color: 'var(--surface-100)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cartItemPrice: { fontSize: '11px', color: 'var(--surface-500)' },
  cartItemRight: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 },
  qtyControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    background: 'var(--surface-800)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 28, height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface-700)',
    color: 'var(--surface-200)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 700,
    transition: 'all var(--transition-fast)',
  },
  qtyValue: {
    width: 28, height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--surface-100)',
  },
  lineTotal: { fontSize: '13px', fontWeight: 700, color: 'var(--primary-400)', minWidth: 55, textAlign: 'right' },
  removeBtn: {
    width: 24, height: 24,
    borderRadius: 'var(--radius-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent',
    color: 'var(--danger-400)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  cartFooter: {
    borderTop: '1px solid rgba(148,163,184,0.08)',
    paddingTop: 'var(--space-4)',
    marginTop: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-lg)',
    background: 'linear-gradient(135deg, var(--success-600), var(--success-500))',
    color: 'white',
    fontSize: '15px',
    fontWeight: 700,
    border: 'none',
    transition: 'all var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Active order styles
  activeOrderContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: 'var(--space-5)',
  },
  timeline: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 'var(--space-4) 0',
    position: 'relative',
  },
  timelineStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  timelineDot: {
    width: 36, height: 36,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: 'white',
    transition: 'all var(--transition-normal)',
  },
  timelineLine: {
    position: 'absolute',
    top: 18,
    left: '60%',
    right: '-40%',
    height: 2,
    zIndex: 0,
  },
  orderTotal: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-5)',
    background: 'rgba(148,163,184,0.04)',
    borderRadius: 'var(--radius-lg)',
  },
  orderNote: {
    fontSize: '12px',
    color: 'var(--surface-500)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    marginTop: 'auto',
  },
  actionBtn: {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-lg)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    textAlign: 'center',
  },
  toast: {
    position: 'fixed',
    top: 20, right: 20,
    padding: '12px 24px',
    borderRadius: 'var(--radius-lg)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    zIndex: 999,
    boxShadow: 'var(--shadow-xl)',
  },
  loadingState: { padding: 'var(--space-8)' },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-6)',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--danger-400)',
    fontSize: '14px',
  },
  retryBtn: {
    marginLeft: 'auto', padding: '6px 16px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--danger-500)', color: 'white',
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', border: 'none',
  },
};

export default POSDashboard;
