import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTables, getOrders, getProducts, getCategories } from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    tables: 0, occupied: 0,
    orders: 0, pending: 0, preparing: 0,
    products: 0, lowStock: 0,
    categories: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tablesRes, ordersRes, productsRes, categoriesRes] = await Promise.all([
          getTables(), getOrders(), getProducts(), getCategories()
        ]);
        const tables = tablesRes.data || [];
        const orders = ordersRes.data || [];
        const products = productsRes.data || [];
        const categories = categoriesRes.data || [];

        setStats({
          tables: tables.length,
          occupied: tables.filter(t => t.status === 'Occupied').length,
          orders: orders.length,
          pending: orders.filter(o => o.status === 'Pending').length,
          preparing: orders.filter(o => o.status === 'Preparing').length,
          products: products.length,
          lowStock: products.filter(p => p.stock_quantity <= 5).length,
          categories: categories.length,
          revenue: orders
            .filter(o => o.status === 'Delivered')
            .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
        });
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statCards = [
    {
      label: 'Total Tables',
      value: stats.tables,
      sub: `${stats.occupied} occupied`,
      color: 'var(--primary-500)',
      bg: 'rgba(99, 102, 241, 0.1)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 3v18"/></svg>
      ),
      link: '/admin/tables',
    },
    {
      label: 'Active Orders',
      value: stats.pending + stats.preparing,
      sub: `${stats.pending} pending, ${stats.preparing} preparing`,
      color: 'var(--warning-500)',
      bg: 'rgba(245, 158, 11, 0.1)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
      ),
      link: '/admin/orders',
    },
    {
      label: 'Products',
      value: stats.products,
      sub: stats.lowStock > 0 ? `⚠️ ${stats.lowStock} low stock` : 'All stocked',
      color: 'var(--success-500)',
      bg: 'rgba(16, 185, 129, 0.1)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
      ),
      link: '/admin/products',
    },
    {
      label: 'Revenue',
      value: `₺${stats.revenue.toFixed(0)}`,
      sub: `${stats.orders} total orders`,
      color: 'var(--purple-500)',
      bg: 'rgba(139, 92, 246, 0.1)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      ),
      link: '/admin/orders',
    },
  ];

  const quickLinks = [
    { label: 'Table & POS', desc: 'Manage tables and take orders', path: '/admin/tables', color: 'var(--success-600)', icon: '🍽️' },
    { label: 'Order Board', desc: 'Track all orders in real-time', path: '/admin/orders', color: 'var(--warning-600)', icon: '📋' },
    { label: 'Categories', desc: 'Manage menu categories', path: '/admin/categories', color: 'var(--primary-600)', icon: '📁' },
    { label: 'Products', desc: 'Manage products & stock', path: '/admin/products', color: 'var(--purple-600)', icon: '📦' },
  ];

  const statusColors = {
    Pending: { color: 'var(--warning-500)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    Preparing: { color: 'var(--info-500)', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    Ready: { color: 'var(--success-500)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    Delivered: { color: 'var(--purple-500)', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
    Cancelled: { color: 'var(--danger-500)', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
  };

  return (
    <div>
      {/* Header */}
      <div style={s.pageHeader} className="animate-fade-in">
        <div>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.subtitle}>Welcome back! Here's your restaurant overview.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={s.statsGrid} className="animate-fade-in">
        {statCards.map((card, idx) => (
          <Link
            key={card.label}
            to={card.link}
            className="animate-fade-in-up"
            style={{ ...s.statCard, animationDelay: `${idx * 80}ms`, textDecoration: 'none' }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 12px 30px ${card.bg}`;
              e.currentTarget.style.borderColor = `${card.color}33`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.06)';
            }}
          >
            <div style={{ ...s.statIcon, background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div style={s.statInfo}>
              <div style={s.statLabel}>{card.label}</div>
              <div style={{ ...s.statValue, color: card.color }}>
                {loading ? '—' : card.value}
              </div>
              <div style={s.statSub}>{loading ? '' : card.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Links & Recent Orders */}
      <div style={s.bottomGrid}>
        {/* Quick Access */}
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h3 style={s.sectionTitle}>Quick Access</h3>
          <div style={s.quickGrid}>
            {quickLinks.map((link, idx) => (
              <Link
                key={link.path}
                to={link.path}
                style={s.quickCard}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${link.color}44`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '28px' }}>{link.icon}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--surface-100)' }}>{link.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--surface-500)', marginTop: 2 }}>{link.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={s.sectionTitle}>Recent Orders</h3>
            <Link to="/admin/orders" style={s.viewAllLink}>View all →</Link>
          </div>
          <div style={s.ordersCard}>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 44, borderRadius: 'var(--radius-md)', marginBottom: 8 }} />
              ))
            ) : recentOrders.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--surface-500)' }}>
                No orders yet
              </div>
            ) : (
              recentOrders.map(order => {
                const sc = statusColors[order.status] || statusColors.Pending;
                return (
                  <div key={order.order_id} style={s.orderRow}>
                    <div style={s.orderLeft}>
                      <span style={{ fontWeight: 700, color: 'var(--surface-100)', fontSize: '14px' }}>#{order.order_id}</span>
                      <span style={{ fontSize: '12px', color: 'var(--surface-500)' }}>Table #{order.table_number}</span>
                    </div>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: sc.bg,
                      color: sc.color,
                      border: `1px solid ${sc.border}`,
                    }}>
                      {order.status}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-400)', minWidth: 70, textAlign: 'right' }}>
                      ₺{parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  pageHeader: { marginBottom: 'var(--space-6)' },
  title: { fontSize: '28px', fontWeight: 800, color: 'var(--surface-50)', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { fontSize: '15px', color: 'var(--surface-400)', marginTop: 'var(--space-1)' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-8)',
  },
  statCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-4)',
    padding: 'var(--space-5)',
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid rgba(148,163,184,0.06)',
    boxShadow: 'var(--shadow-md)',
    transition: 'all var(--transition-normal)',
    cursor: 'pointer',
  },
  statIcon: {
    width: 48, height: 48,
    borderRadius: 'var(--radius-lg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  statInfo: { flex: 1 },
  statLabel: { fontSize: '12px', fontWeight: 600, color: 'var(--surface-500)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { fontSize: '26px', fontWeight: 800, marginTop: 4 },
  statSub: { fontSize: '12px', color: 'var(--surface-500)', marginTop: 4 },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-6)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--surface-200)',
    margin: 0,
    marginBottom: 'var(--space-4)',
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-3)',
  },
  quickCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-4)',
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(148,163,184,0.06)',
    textDecoration: 'none',
    transition: 'all var(--transition-fast)',
  },
  viewAllLink: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--primary-400)',
    textDecoration: 'none',
  },
  ordersCard: {
    background: 'var(--surface-900)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid rgba(148,163,184,0.06)',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  orderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(148,163,184,0.03)',
  },
  orderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
};
