import React, { useEffect, useState, useCallback } from 'react';
import { getOrders, getOrderById, updateOrderStatus } from '../services/api';

const STATUS_COLUMNS = [
  { key: 'Pending', label: 'Pending', color: 'var(--warning-500)', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', icon: '⏳' },
  { key: 'Preparing', label: 'Preparing', color: 'var(--info-500)', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)', icon: '👨‍🍳' },
  { key: 'Ready', label: 'Ready', color: 'var(--success-500)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', icon: '✅' },
  { key: 'Delivered', label: 'Delivered', color: 'var(--purple-500)', bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.2)', icon: '🎉' },
];

const NEXT_STATUS = {
  Pending: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Delivered',
};

const NEXT_LABEL = {
  Pending: 'Start Preparing',
  Preparing: 'Mark Ready',
  Ready: 'Mark Delivered',
};

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadOrders = useCallback(async () => {
    try {
      const res = await getOrders();
      setOrders(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleViewDetail = async (order) => {
    setSelectedOrder(order.order_id);
    setDetailLoading(true);
    try {
      const res = await getOrderById(order.order_id);
      setOrderDetail(res.data);
    } catch (err) {
      showToast('Failed to load order details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedOrder(null);
    setOrderDetail(null);
  };

  const handleAdvanceStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(`Order #${orderId} → ${newStatus}`);
      loadOrders();
      if (orderDetail && orderDetail.order_id === orderId) {
        setOrderDetail({ ...orderDetail, status: newStatus });
      }
    } catch (err) {
      showToast('Failed to update: ' + err.message, 'error');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'Cancelled');
      showToast(`Order #${orderId} cancelled`);
      loadOrders();
      handleCloseDetail();
    } catch (err) {
      showToast('Failed to cancel: ' + err.message, 'error');
    }
  };

  // Stats
  const todayOrders = orders;
  const pending = todayOrders.filter(o => o.status === 'Pending').length;
  const preparing = todayOrders.filter(o => o.status === 'Preparing').length;
  const ready = todayOrders.filter(o => o.status === 'Ready').length;
  const delivered = todayOrders.filter(o => o.status === 'Delivered').length;
  const cancelled = todayOrders.filter(o => o.status === 'Cancelled').length;

  const getElapsedTime = (createdAt) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  // For list view filtering
  const filteredOrders = todayOrders.filter(o => {
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchesSearch = searchQuery === '' ||
      `#${o.order_id}`.includes(searchQuery) ||
      `Table ${o.table_number}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.first_name && o.first_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading && orders.length === 0) {
    return (
      <div>
        <div style={s.statsRow}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-xl)' }} />
          ))}
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
      <div style={s.pageHeader} className="animate-fade-in">
        <div>
          <h1 style={s.title}>Order Tracking</h1>
          <p style={s.subtitle}>Monitor and manage all orders in real-time</p>
        </div>
        <div style={s.viewToggle}>
          <button
            onClick={() => setViewMode('kanban')}
            style={{ ...s.toggleBtn, ...(viewMode === 'kanban' ? s.toggleBtnActive : {}) }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="10" rx="1"/></svg>
            Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{ ...s.toggleBtn, ...(viewMode === 'list' ? s.toggleBtnActive : {}) }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            List
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsRow} className="animate-fade-in">
        {[
          { label: 'Pending', value: pending, color: 'var(--warning-500)', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Preparing', value: preparing, color: 'var(--info-500)', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Ready', value: ready, color: 'var(--success-500)', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Delivered', value: delivered, color: 'var(--purple-500)', bg: 'rgba(139,92,246,0.1)' },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <div style={{ ...s.statDot, background: stat.color }} />
            <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div style={s.kanbanGrid} className="animate-fade-in">
          {STATUS_COLUMNS.map(col => {
            const colOrders = todayOrders.filter(o => o.status === col.key);
            return (
              <div key={col.key} style={s.kanbanColumn}>
                <div style={{ ...s.colHeader, borderBottomColor: col.border }}>
                  <div style={s.colHeaderLeft}>
                    <span style={{ fontSize: '16px' }}>{col.icon}</span>
                    <span style={{ ...s.colTitle, color: col.color }}>{col.label}</span>
                  </div>
                  <span style={{
                    ...s.colCount,
                    background: col.bg,
                    color: col.color,
                    border: `1px solid ${col.border}`,
                  }}>
                    {colOrders.length}
                  </span>
                </div>
                <div style={s.colCards}>
                  {colOrders.map((order, idx) => (
                    <div
                      key={order.order_id}
                      className="animate-fade-in-up"
                      style={{ ...s.orderCard, animationDelay: `${idx * 60}ms` }}
                      onClick={() => handleViewDetail(order)}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = col.border;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.06)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      }}
                    >
                      <div style={s.cardTop}>
                        <span style={s.orderId}>#{order.order_id}</span>
                        <span style={s.elapsed}>{getElapsedTime(order.created_at)}</span>
                      </div>
                      <div style={s.cardTable}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--surface-500)" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/></svg>
                        Table #{order.table_number}
                      </div>
                      <div style={s.cardBottom}>
                        <span style={s.cardAmount}>₺{parseFloat(order.total_amount).toFixed(2)}</span>
                        {NEXT_STATUS[col.key] && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(order.order_id, NEXT_STATUS[col.key]); }}
                            style={{ ...s.advanceBtn, background: col.bg, color: col.color, border: `1px solid ${col.border}` }}
                            onMouseEnter={e => { e.currentTarget.style.background = col.color; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = col.bg; e.currentTarget.style.color = col.color; }}
                          >
                            {NEXT_LABEL[col.key]} →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {colOrders.length === 0 && (
                    <div style={s.emptyColumn}>
                      <span style={{ fontSize: '24px', opacity: 0.4 }}>{col.icon}</span>
                      <p style={{ color: 'var(--surface-600)', fontSize: '13px', marginTop: 8 }}>No orders</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="animate-fade-in">
          <div style={s.listControls}>
            <div style={s.searchBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--surface-500)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={s.searchInput}
              />
            </div>
            <div style={s.filterPills}>
              {['All', 'Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    ...s.filterPill,
                    ...(statusFilter === f ? s.filterPillActive : {}),
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={s.listTable}>
            <div style={s.listHeader}>
              <span style={{ ...s.listCell, flex: 0.5 }}>Order</span>
              <span style={{ ...s.listCell, flex: 1 }}>Table</span>
              <span style={{ ...s.listCell, flex: 1 }}>Waiter</span>
              <span style={{ ...s.listCell, flex: 1 }}>Status</span>
              <span style={{ ...s.listCell, flex: 0.8 }}>Amount</span>
              <span style={{ ...s.listCell, flex: 1 }}>Time</span>
              <span style={{ ...s.listCell, flex: 1 }}>Actions</span>
            </div>
            {filteredOrders.map((order, idx) => {
              const statusCol = STATUS_COLUMNS.find(c => c.key === order.status) || { color: 'var(--surface-500)', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
              return (
                <div
                  key={order.order_id}
                  style={s.listRow}
                  className="animate-fade-in"
                  onClick={() => handleViewDetail(order)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(148,163,184,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ ...s.listCell, flex: 0.5, fontWeight: 700, color: 'var(--surface-100)' }}>#{order.order_id}</span>
                  <span style={{ ...s.listCell, flex: 1 }}>Table #{order.table_number}</span>
                  <span style={{ ...s.listCell, flex: 1 }}>{order.first_name} {order.last_name}</span>
                  <span style={{ ...s.listCell, flex: 1 }}>
                    <span style={{
                      ...s.statusPill,
                      background: statusCol.bg,
                      color: statusCol.color,
                      border: `1px solid ${statusCol.border}`,
                    }}>
                      {order.status}
                    </span>
                  </span>
                  <span style={{ ...s.listCell, flex: 0.8, fontWeight: 600, color: 'var(--primary-400)' }}>
                    ₺{parseFloat(order.total_amount).toFixed(2)}
                  </span>
                  <span style={{ ...s.listCell, flex: 1, fontSize: '12px', color: 'var(--surface-500)' }}>
                    {getElapsedTime(order.created_at)}
                  </span>
                  <span style={{ ...s.listCell, flex: 1 }}>
                    {NEXT_STATUS[order.status] && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(order.order_id, NEXT_STATUS[order.status]); }}
                        style={{ ...s.listActionBtn, color: statusCol.color }}
                        onMouseEnter={e => e.currentTarget.style.background = statusCol.bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {NEXT_LABEL[order.status]}
                      </button>
                    )}
                  </span>
                </div>
              );
            })}
            {filteredOrders.length === 0 && (
              <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--surface-500)' }}>
                No orders match the current filters
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Slide-over Panel */}
      {selectedOrder && (
        <>
          <div style={s.overlay} onClick={handleCloseDetail} />
          <div style={s.slidePanel} className="animate-slide-right">
            <div style={s.panelHeader}>
              <h3 style={s.panelTitle}>Order #{selectedOrder}</h3>
              <button onClick={handleCloseDetail} style={s.closeBtn}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(148,163,184,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(148,163,184,0.08)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 20, borderRadius: 'var(--radius-sm)' }} />
                ))}
              </div>
            ) : orderDetail ? (
              <div style={s.panelContent}>
                {/* Info cards */}
                <div style={s.infoGrid}>
                  <div style={s.infoCard}>
                    <div style={s.infoLabel}>Table</div>
                    <div style={s.infoValue}>#{orderDetail.table_number}</div>
                  </div>
                  <div style={s.infoCard}>
                    <div style={s.infoLabel}>Status</div>
                    <div style={{
                      ...s.infoValue,
                      color: (STATUS_COLUMNS.find(c => c.key === orderDetail.status) || {}).color || 'var(--surface-300)',
                    }}>
                      {orderDetail.status}
                    </div>
                  </div>
                  <div style={s.infoCard}>
                    <div style={s.infoLabel}>Total</div>
                    <div style={{ ...s.infoValue, color: 'var(--primary-400)' }}>₺{parseFloat(orderDetail.total_amount).toFixed(2)}</div>
                  </div>
                  <div style={s.infoCard}>
                    <div style={s.infoLabel}>Waiter</div>
                    <div style={s.infoValue}>{orderDetail.first_name} {orderDetail.last_name}</div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--surface-200)', marginBottom: 'var(--space-3)' }}>Order Items</h4>
                  <div style={s.itemsList}>
                    {orderDetail.items && orderDetail.items.map(item => (
                      <div key={item.order_item_id} style={s.detailItem}>
                        <div style={s.detailItemLeft}>
                          <span style={s.detailQty}>{item.quantity}x</span>
                          <span style={s.detailName}>{item.product_name}</span>
                        </div>
                        <span style={s.detailPrice}>₺{(item.quantity * parseFloat(item.unit_price)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timestamps */}
                <div style={s.timestampSection}>
                  <div style={s.timestampRow}>
                    <span style={{ color: 'var(--surface-500)' }}>Created</span>
                    <span style={{ color: 'var(--surface-300)' }}>{new Date(orderDetail.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={s.panelActions}>
                  {NEXT_STATUS[orderDetail.status] && (
                    <button
                      onClick={() => handleAdvanceStatus(orderDetail.order_id, NEXT_STATUS[orderDetail.status])}
                      style={{
                        ...s.panelActionBtn,
                        background: (STATUS_COLUMNS.find(c => c.key === orderDetail.status) || {}).color || 'var(--primary-600)',
                      }}
                    >
                      {NEXT_LABEL[orderDetail.status]}
                    </button>
                  )}
                  {!['Delivered', 'Cancelled'].includes(orderDetail.status) && (
                    <button
                      onClick={() => handleCancelOrder(orderDetail.order_id)}
                      style={{ ...s.panelActionBtn, background: 'rgba(239,68,68,0.12)', color: 'var(--danger-400)', border: '1px solid rgba(239,68,68,0.2)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-600)'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = 'var(--danger-400)'; }}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  page: { position: 'relative' },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-6)',
  },
  title: { fontSize: '28px', fontWeight: 800, color: 'var(--surface-50)', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { fontSize: '15px', color: 'var(--surface-400)', marginTop: 'var(--space-1)' },
  viewToggle: {
    display: 'flex',
    gap: 0,
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-lg)',
    padding: 3,
    border: '1px solid rgba(148,163,184,0.08)',
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--surface-500)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  toggleBtnActive: {
    background: 'var(--primary-600)',
    color: 'white',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-4) var(--space-5)',
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid rgba(148,163,184,0.06)',
    gap: 'var(--space-1)',
  },
  statDot: { width: 8, height: 8, borderRadius: '50%' },
  statValue: { fontSize: '28px', fontWeight: 800 },
  statLabel: { fontSize: '12px', fontWeight: 600, color: 'var(--surface-500)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  // Kanban
  kanbanGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-4)',
    alignItems: 'flex-start',
  },
  kanbanColumn: {
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid rgba(148,163,184,0.06)',
    overflow: 'hidden',
    minHeight: 300,
  },
  colHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-4) var(--space-5)',
    borderBottom: '2px solid',
  },
  colHeaderLeft: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
  colTitle: { fontSize: '14px', fontWeight: 700 },
  colCount: {
    padding: '2px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: '12px',
    fontWeight: 700,
  },
  colCards: {
    padding: 'var(--space-3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    maxHeight: 'calc(100vh - 380px)',
    overflowY: 'auto',
  },
  orderCard: {
    padding: 'var(--space-4)',
    background: 'rgba(148,163,184,0.03)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(148,163,184,0.06)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: { fontSize: '15px', fontWeight: 700, color: 'var(--surface-100)' },
  elapsed: { fontSize: '11px', color: 'var(--surface-500)', fontWeight: 500 },
  cardTable: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: '13px',
    color: 'var(--surface-400)',
  },
  cardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAmount: { fontSize: '15px', fontWeight: 700, color: 'var(--primary-400)' },
  advanceBtn: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  emptyColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-8)',
  },
  // List view
  listControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-5)',
    gap: 'var(--space-4)',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-2) var(--space-4)',
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(148,163,184,0.1)',
    minWidth: 240,
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--surface-200)',
    fontSize: '14px',
    fontFamily: 'var(--font-family)',
    width: '100%',
  },
  filterPills: {
    display: 'flex',
    gap: 'var(--space-2)',
    flexWrap: 'wrap',
  },
  filterPill: {
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--surface-400)',
    background: 'transparent',
    border: '1px solid rgba(148,163,184,0.1)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  filterPillActive: {
    background: 'var(--primary-600)',
    color: 'white',
    borderColor: 'var(--primary-600)',
  },
  listTable: {
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid rgba(148,163,184,0.06)',
    overflow: 'hidden',
  },
  listHeader: {
    display: 'flex',
    padding: 'var(--space-3) var(--space-5)',
    borderBottom: '1px solid rgba(148,163,184,0.08)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--surface-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  listRow: {
    display: 'flex',
    padding: 'var(--space-3) var(--space-5)',
    borderBottom: '1px solid rgba(148,163,184,0.04)',
    fontSize: '13px',
    color: 'var(--surface-300)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    alignItems: 'center',
  },
  listCell: {
    display: 'flex',
    alignItems: 'center',
  },
  statusPill: {
    padding: '3px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: '11px',
    fontWeight: 700,
  },
  listActionBtn: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-md)',
    background: 'transparent',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  // Slide-over panel
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 40,
    animation: 'slideOverlayIn var(--transition-fast) ease-out',
  },
  slidePanel: {
    position: 'fixed',
    top: 0, right: 0, bottom: 0,
    width: 440,
    background: 'var(--surface-900)',
    borderLeft: '1px solid rgba(148,163,184,0.08)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '-20px 0 60px rgba(0,0,0,0.3)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-5) var(--space-6)',
    borderBottom: '1px solid rgba(148,163,184,0.06)',
    flexShrink: 0,
  },
  panelTitle: { fontSize: '18px', fontWeight: 700, color: 'var(--surface-100)', margin: 0 },
  closeBtn: {
    width: 36, height: 36,
    borderRadius: 'var(--radius-md)',
    background: 'rgba(148,163,184,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--surface-400)',
    cursor: 'pointer',
    border: 'none',
    transition: 'all var(--transition-fast)',
  },
  panelContent: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-3)',
  },
  infoCard: {
    padding: 'var(--space-4)',
    background: 'rgba(148,163,184,0.04)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(148,163,184,0.06)',
  },
  infoLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--surface-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  infoValue: { fontSize: '16px', fontWeight: 700, color: 'var(--surface-100)' },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-3) var(--space-4)',
    background: 'rgba(148,163,184,0.04)',
    borderRadius: 'var(--radius-md)',
  },
  detailItemLeft: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' },
  detailQty: {
    width: 28, height: 28,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--primary-600)',
    color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
  },
  detailName: { fontSize: '14px', fontWeight: 500, color: 'var(--surface-200)' },
  detailPrice: { fontSize: '14px', fontWeight: 700, color: 'var(--primary-400)' },
  timestampSection: {
    padding: 'var(--space-4)',
    background: 'rgba(148,163,184,0.04)',
    borderRadius: 'var(--radius-lg)',
  },
  timestampRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  panelActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    marginTop: 'auto',
  },
  panelActionBtn: {
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
};
