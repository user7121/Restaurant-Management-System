import React, { useState, useEffect } from 'react';

const StockStatusDashboard = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stock data from your Express API
  useEffect(() => {
    const fetchStock = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch('http://localhost:5000/api/stock', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // JWT implementation
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch stock data');
        
        const data = await response.json();
        setStockData(data);
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
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

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
            const status = getStatusStyle(item.quantity, item.lowStockThreshold || 10);
            return (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{item.name}</td>
                <td style={{ padding: '10px' }}>{item.category}</td>
                <td style={{ padding: '10px' }}>{item.quantity}</td>
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
