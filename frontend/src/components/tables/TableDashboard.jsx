import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTables, updateTableStatus } from '../../services/api';

const FILTERS = ['All', 'Empty', 'Occupied'];

const TableDashboard = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const loadTables = async () => {
    try {
      const resp = await getTables();
      setTables(resp.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
    const interval = setInterval(loadTables, 10000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTableClick = (table_id) => {
    navigate(`/admin/pos/${table_id}`);
  };

  const handleFreeTable = async (e, table_id) => {
    e.stopPropagation();
    try {
      await updateTableStatus(table_id, 'Empty');
      showToast('Table cleared successfully');
      loadTables();
    } catch (err) {
      showToast('Failed to clear table: ' + err.message, 'error');
    }
  };

  const filtered = filter === 'All' ? tables : tables.filter(t => t.status === filter);
  const occupied = tables.filter(t => t.status === 'Occupied').length;
  const empty = tables.filter(t => t.status === 'Empty').length;

  if (loading && tables.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingGrid}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ width: '100%', height: 180, borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.errorBox}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger-400)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>{error}</span>
          <button onClick={loadTables} style={s.retryBtn}>Retry</button>
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

      {/* Page header */}
      <div style={s.pageHeader} className="animate-fade-in">
        <div>
          <h1 style={s.title}>Table Management</h1>
          <p style={s.subtitle}>Select a table to open the POS terminal</p>
        </div>
      </div>

      {/* Stats bar */}
      <div style={s.statsRow} className="animate-fade-in">
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary-400)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 3v18"/></svg>
          </div>
          <div>
            <div style={s.statValue}>{tables.length}</div>
            <div style={s.statLabel}>Total Tables</div>
          </div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger-400)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div>
            <div style={s.statValue}>{occupied}</div>
            <div style={s.statLabel}>Occupied</div>
          </div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success-400)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <div style={s.statValue}>{empty}</div>
            <div style={s.statLabel}>Available</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={s.filterRow} className="animate-fade-in">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...s.filterBtn,
              ...(filter === f ? s.filterBtnActive : {}),
            }}
            onMouseEnter={(e) => { if (filter !== f) e.currentTarget.style.background = 'rgba(148,163,184,0.1)'; }}
            onMouseLeave={(e) => { if (filter !== f) e.currentTarget.style.background = 'transparent'; }}
          >
            {f}
            <span style={{
              ...s.filterCount,
              background: filter === f ? 'rgba(255,255,255,0.2)' : 'rgba(148,163,184,0.15)',
            }}>
              {f === 'All' ? tables.length : f === 'Occupied' ? occupied : empty}
            </span>
          </button>
        ))}
      </div>

      {/* Table grid */}
      <div style={s.grid}>
        {filtered.map((table, idx) => {
          const isOccupied = table.status === 'Occupied';
          return (
            <div
              key={table.table_id}
              onClick={() => handleTableClick(table.table_id)}
              className="animate-fade-in-up"
              style={{
                ...s.tableCard,
                animationDelay: `${idx * 50}ms`,
                borderColor: isOccupied
                  ? 'rgba(239, 68, 68, 0.25)'
                  : 'rgba(16, 185, 129, 0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                e.currentTarget.style.boxShadow = isOccupied
                  ? '0 20px 40px rgba(239, 68, 68, 0.12)'
                  : '0 20px 40px rgba(16, 185, 129, 0.12)';
                e.currentTarget.style.borderColor = isOccupied
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(16, 185, 129, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = isOccupied
                  ? 'rgba(239, 68, 68, 0.25)'
                  : 'rgba(16, 185, 129, 0.15)';
              }}
            >
              {/* Status ring */}
              <div style={{
                ...s.statusRing,
                background: isOccupied
                  ? 'linear-gradient(135deg, var(--danger-500), var(--orange-500))'
                  : 'linear-gradient(135deg, var(--success-500), #06d6a0)',
                animation: isOccupied ? 'statusPulse 2s infinite' : 'none',
              }}>
                <div style={s.tableNumber}>
                  {table.table_number}
                </div>
              </div>

              {/* Status badge */}
              <div style={{
                ...s.statusBadge,
                background: isOccupied ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: isOccupied ? 'var(--danger-400)' : 'var(--success-400)',
                border: `1px solid ${isOccupied ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isOccupied ? 'var(--danger-400)' : 'var(--success-400)',
                }} />
                {isOccupied ? 'Occupied' : 'Available'}
              </div>

              {/* Clear button */}
              {isOccupied && (
                <button
                  onClick={(e) => handleFreeTable(e, table.table_id)}
                  style={s.clearBtn}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--danger-500)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = 'var(--danger-400)';
                  }}
                >
                  Clear Table
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={s.emptyState} className="animate-fade-in">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--surface-600)" strokeWidth="1.5"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 3v18"/></svg>
          <p style={{ color: 'var(--surface-500)', marginTop: 'var(--space-4)' }}>No tables match the selected filter</p>
        </div>
      )}
    </div>
  );
};

const s = {
  page: {
    position: 'relative',
  },
  pageHeader: {
    marginBottom: 'var(--space-6)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--surface-50)',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--surface-400)',
    marginTop: 'var(--space-1)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-5)',
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid rgba(148, 163, 184, 0.06)',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--surface-100)',
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--surface-500)',
  },
  filterRow: {
    display: 'flex',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-6)',
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-full)',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--surface-400)',
    background: 'transparent',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  filterBtnActive: {
    background: 'var(--primary-600)',
    color: 'white',
    borderColor: 'var(--primary-600)',
  },
  filterCount: {
    padding: '1px 8px',
    borderRadius: 'var(--radius-full)',
    fontSize: '11px',
    fontWeight: 700,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 'var(--space-5)',
  },
  tableCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-6) var(--space-5)',
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-md)',
    transition: 'all var(--transition-normal)',
    position: 'relative',
  },
  statusRing: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tableNumber: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'var(--surface-900)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 800,
    color: 'var(--surface-100)',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)',
    fontSize: '12px',
    fontWeight: 600,
  },
  clearBtn: {
    padding: '6px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '12px',
    fontWeight: 600,
    background: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger-400)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  toast: {
    position: 'fixed',
    top: 20,
    right: 20,
    padding: '12px 24px',
    borderRadius: 'var(--radius-lg)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    zIndex: 999,
    boxShadow: 'var(--shadow-xl)',
  },
  loadingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 'var(--space-5)',
    marginTop: 'var(--space-8)',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-6)',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--danger-400)',
    fontSize: '14px',
  },
  retryBtn: {
    marginLeft: 'auto',
    padding: '6px 16px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--danger-500)',
    color: 'white',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-16)',
  },
};

export default TableDashboard;
