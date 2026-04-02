import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTables, updateTableStatus } from '../../services/api';

const TableDashboard = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadTables = async () => {
    setLoading(true);
    try {
      const resp = await getTables();
      setTables(resp.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
    // Optional: Refresh periodically for live status in a real restaurant
    const interval = setInterval(loadTables, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTableClick = (table_id) => {
    // Navigate to POS view for this table
    navigate(`/admin/pos/${table_id}`);
  };

  const handleFreeTable = async (e, table_id) => {
    e.stopPropagation();
    try {
      await updateTableStatus(table_id, 'Empty');
      loadTables();
    } catch (err) {
      alert('Failed to free table: ' + err.message);
    }
  };

  if (loading && tables.length === 0) return <p>Loading tables...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Table Management</h2>
      <p>Select a table to open the POS / Order Menu.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
        {tables.map(table => {
          const isOccupied = table.status === 'Occupied';
          return (
            <div
              key={table.table_id}
              onClick={() => handleTableClick(table.table_id)}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '12px',
                backgroundColor: isOccupied ? '#fef2f2' : '#f0fdf4',
                border: `2px solid ${isOccupied ? '#ef4444' : '#22c55e'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.1s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <h3 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>#{table.table_number}</h3>
              <p style={{
                margin: '10px 0',
                fontWeight: 'bold',
                color: isOccupied ? '#ef4444' : '#22c55e'
              }}>
                {isOccupied ? 'Occupied' : 'Empty'}
              </p>

              {isOccupied && (
                <button
                  onClick={(e) => handleFreeTable(e, table.table_id)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Clear Table
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableDashboard;
