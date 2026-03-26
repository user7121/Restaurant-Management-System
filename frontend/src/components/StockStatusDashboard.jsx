import React, { useState, useEffect } from 'react';

const StockStatusDashboard = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch product stock data from backend.
  // Backend endpoint: GET /api/products (requires JWT)
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:5000/api/products', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (response.status === 401) {
          throw new Error('Please login first.');
        }

        if (!response.ok) throw new Error(`Failed to fetch products (HTTP ${response.status})`);
        
        const data = await response.json();

        // API format: { success: true, data: rows }
        setStockData(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, []);

  // Helper to define stock status color coding
  const getStatusStyle = (quantity, threshold) => {
    if (quantity === 0) return { color: 'red', fontWeight: 'bold', label: 'Out of Stock' };
    if (quantity <= threshold) return { color: 'orange', fontWeight: 'bold', label: 'Low Stock' };
    return { color: 'green', label: 'In Stock' };
  };

  if (loading) return <p>Loading Stock Status...</p>;
  if (error) {
    return (
      <div style={{ color: 'crimson', background: '#fff', padding: 16, borderRadius: 8 }}>
        {error}
      </div>
    );
  }

  return (
    <div className="stock-dashboard-container" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
      <h3>📦 Inventory & Stock Status</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Product Name</th>
            <th style={{ padding: '10px' }}>Category</th>
            <th style={{ padding: '10px' }}>Current Stock</th>
            <th style={{ padding: '10px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {stockData.map((item) => {
            const threshold = 10; // simple threshold for demo
            const status = getStatusStyle(item.stock_quantity, threshold);
            return (
              <tr key={item.product_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{item.name}</td>
                <td style={{ padding: '10px' }}>{item.category_name}</td>
                <td style={{ padding: '10px' }}>{item.stock_quantity}</td>
                <td style={{ padding: '10px', color: status.color }}>
                  {status.label}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockStatusDashboard;
