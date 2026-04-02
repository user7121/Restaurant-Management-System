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
  const [activeOrder, setActiveOrder] = useState(null); // If table already has an order
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes, ordersRes] = await Promise.all([
          getCategories(),
          getProducts(),
          getOrders()
        ]);
        
        setCategories(catRes.data || []);
        setProducts(prodRes.data || []);
        if (catRes.data && catRes.data.length > 0) {
          setActiveCategory(catRes.data[0].category_id);
        }

        // Check if table is occupied by finding a pending/preparing/ready order
        const tableOrders = (ordersRes.data || []).filter(
          o => o.table_number === parseInt(tableId) && !['Delivered', 'Cancelled'].includes(o.status)
        );
        if (tableOrders.length > 0) {
          setActiveOrder(tableOrders[0]);
        }
      } catch (err) {
        setError('Error loading POS data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableId]);

  const addToCart = (product) => {
    if (activeOrder) return; // if active order exists, we prevent modifying cart in MVP
    
    setCart((prev) => {
      const existing = prev.find(item => item.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert('Not enough stock available!');
          return prev;
        }
        return prev.map(item =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (product.stock_quantity < 1) {
        alert('Out of stock!');
        return prev;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter(item => item.product_id !== productId));
  };

  const currentProducts = products.filter(p => p.category_id === activeCategory);
  
  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const items = cart.map(c => ({ product_id: c.product_id, quantity: c.quantity }));
      const newOrder = await createOrder({ table_id: parseInt(tableId), items });
      alert('Order Placed Successfully!');
      navigate('/admin/tables'); // Go back to tables map
    } catch (err) {
      alert('Failed to place order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!activeOrder) return;
    try {
      await updateOrderStatus(activeOrder.order_id, status);
      alert(`Order ${status}!`);
      navigate('/admin/tables');
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  if (loading) return <p>Loading POS Terminal...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  // Styles
  const containerStyle = { display: 'flex', height: '80vh', gap: '20px', padding: '20px' };
  const leftPanel = { flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' };
  const rightPanel = { flex: 1, backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' };
  const categoryMenu = { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' };
  const productGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', overflowY: 'auto' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 20px' }}>
        <h2>Table #{tableId} - POS System</h2>
        <button onClick={() => navigate('/admin/tables')} style={{ padding: '8px 16px', cursor: 'pointer' }}>Back to Tables</button>
      </div>

      <div style={containerStyle}>
        {/* Left Side: Categories & Products */}
        <div style={leftPanel}>
          <div style={categoryMenu}>
            {categories.map(cat => (
              <button
                key={cat.category_id}
                onClick={() => setActiveCategory(cat.category_id)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: activeCategory === cat.category_id ? '#3b82f6' : '#e5e7eb',
                  color: activeCategory === cat.category_id ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.category_name}
              </button>
            ))}
          </div>

          <div style={productGrid}>
            {currentProducts.map(product => (
              <div 
                key={product.product_id}
                onClick={() => addToCart(product)}
                style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  cursor: activeOrder ? 'not-allowed' : 'pointer',
                  opacity: (product.stock_quantity < 1 || activeOrder) ? 0.5 : 1,
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{product.name}</div>
                <div style={{ color: '#2563eb', fontWeight: 'bold' }}>₺{parseFloat(product.price).toFixed(2)}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>Stock: {product.stock_quantity}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Cart / Current Order */}
        <div style={rightPanel}>
          <h3 style={{ marginTop: 0 }}>
            {activeOrder ? `Active Order (#${activeOrder.order_id})` : 'Current Cart'}
          </h3>

          {activeOrder ? (
            <div style={{ flex: 1 }}>
              <p><strong>Status:</strong> <span style={{ color: '#f59e0b'}}>{activeOrder.status}</span></p>
              <p><strong>Total:</strong> <span style={{ fontSize: '24px', fontWeight: 'bold' }}>₺{parseFloat(activeOrder.total_amount).toFixed(2)}</span></p>
              <hr />
              <p><em>Note: Cannot add items to existing orders in MVP version.</em></p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => handleUpdateStatus('Preparing')} style={btnStyle('#3b82f6')}>Mark Preparing</button>
                <button onClick={() => handleUpdateStatus('Ready')} style={btnStyle('#10b981')}>Mark Ready</button>
                <button onClick={() => handleUpdateStatus('Delivered')} style={btnStyle('#8b5cf6')}>Mark Delivered (Closes Table)</button>
                <button onClick={() => handleUpdateStatus('Cancelled')} style={btnStyle('#ef4444')}>Cancel Order (Restores Stock)</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {cart.length === 0 ? <p style={{ color: '#9ca3af' }}>Cart is empty. Select products to add.</p> : null}
                {cart.map(item => (
                  <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ fontSize: '13px', color: '#4b5563' }}>{item.quantity} x ₺{parseFloat(item.price).toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold' }}>₺{(item.quantity * parseFloat(item.price)).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.product_id)} style={{ padding: '2px 6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '2px dashed #d1d5db', paddingTop: '15px', marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
                  <span>Total:</span>
                  <span>₺{cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handlePlaceOrder} 
                  disabled={cart.length === 0 || isSubmitting}
                  style={{ width: '100%', padding: '15px', backgroundColor: cart.length === 0 ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? 'Placing Order...' : 'Send Order to Kitchen'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const btnStyle = (color) => ({ padding: '12px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' });

export default POSDashboard;
