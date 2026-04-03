import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Tables",
    path: "/admin/tables",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 3v18" />
      </svg>
    ),
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Categories",
    path: "/admin/categories",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
      </svg>
    ),
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
];

const styles = {
  wrapper: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "var(--surface-950)",
  },
  sidebar: {
    width: "var(--sidebar-width)",
    minWidth: "var(--sidebar-width)",
    background: "linear-gradient(180deg, var(--surface-900) 0%, var(--surface-950) 100%)",
    borderRight: "1px solid rgba(148, 163, 184, 0.08)",
    display: "flex",
    flexDirection: "column",
    transition: "width var(--transition-normal)",
    zIndex: 20,
  },
  logo: {
    padding: "var(--space-6) var(--space-5)",
    borderBottom: "1px solid rgba(148, 163, 184, 0.06)",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: "var(--radius-lg)",
    background: "linear-gradient(135deg, var(--primary-500), var(--purple-500))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  logoText: {
    fontSize: "15px",
    fontWeight: 700,
    color: "var(--surface-100)",
    lineHeight: 1.3,
  },
  logoSub: {
    fontSize: "11px",
    fontWeight: 500,
    color: "var(--surface-500)",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  nav: {
    flex: 1,
    padding: "var(--space-4) var(--space-3)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-1)",
    overflowY: "auto",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    padding: "var(--space-3) var(--space-4)",
    borderRadius: "var(--radius-md)",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--surface-400)",
    transition: "all var(--transition-fast)",
    textDecoration: "none",
    position: "relative",
  },
  navLinkActive: {
    background: "rgba(99, 102, 241, 0.12)",
    color: "var(--primary-400)",
    fontWeight: 600,
  },
  navLinkHover: {
    background: "rgba(148, 163, 184, 0.08)",
    color: "var(--surface-200)",
  },
  sidebarFooter: {
    padding: "var(--space-4) var(--space-5)",
    borderTop: "1px solid rgba(148, 163, 184, 0.06)",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    width: "100%",
    padding: "var(--space-3) var(--space-4)",
    borderRadius: "var(--radius-md)",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--danger-400)",
    transition: "all var(--transition-fast)",
    cursor: "pointer",
    border: "none",
    background: "none",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
  header: {
    height: "var(--header-height)",
    minHeight: "var(--header-height)",
    padding: "0 var(--space-8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(148, 163, 184, 0.06)",
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    zIndex: 10,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-4)",
  },
  headerTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--surface-200)",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-4)",
  },
  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    padding: "var(--space-1) var(--space-3)",
    borderRadius: "var(--radius-full)",
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--success-400)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--success-400)",
    animation: "pulse 2s infinite",
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: "var(--space-8)",
  },
};

export default function AdminLayout() {
  const [hoveredNav, setHoveredNav] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🍽️</div>
          <div>
            <div style={styles.logoText}>Restaurant Management System</div>
            <div style={styles.logoSub}>Management</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              onMouseEnter={() => setHoveredNav(item.path)}
              onMouseLeave={() => setHoveredNav(null)}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
                ...(hoveredNav === item.path && !isActive ? styles.navLinkHover : {}),
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button
            style={styles.logoutBtn}
            onClick={handleLogout}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={styles.mainArea}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerTitle}>{dateStr}</div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.liveIndicator}>
              <div style={styles.liveDot} />
              Live
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--surface-300)" }}>
              {timeStr}
            </div>
          </div>
        </header>

        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
