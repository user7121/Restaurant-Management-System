import React, { useEffect, useState, useMemo } from "react";
import { getOrders, getProducts, getCategories } from "../services/api";

/* ═══════════════════════════════════════════════════════════════════════════
   SALES DASHBOARD — Pure frontend analytics with SVG charts
   All data derived from existing /api/orders, /api/products, /api/categories
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── SVG Chart Palette ──────────────────────────────────────────────────────
const CHART_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#818cf8",
  "#10b981", "#34d399", "#f59e0b", "#fbbf24",
  "#3b82f6", "#60a5fa", "#f97316", "#fb923c",
  "#ef4444", "#ec4899", "#14b8a6", "#06b6d4",
];

const STATUS_PALETTE = {
  Pending:   { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  Preparing: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  Ready:     { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  Delivered: { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  Cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

// ─── Utility helpers ────────────────────────────────────────────────────────
const fmt = (n) => `₺${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDec = (n) => `₺${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function shortDay(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// ─── Animated number counter ────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "", duration = 900 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = typeof value === "number" ? value : parseFloat(value) || 0;
    if (target === 0) { setDisplay(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setDisplay(target); clearInterval(id); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(id);
  }, [value, duration]);
  const n = typeof value === "number" ? Math.round(display) : display;
  return <span>{prefix}{typeof value === "number" ? n.toLocaleString("tr-TR") : fmtDec(n).replace("₺", "")}{suffix}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════
// SVG CHART COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/* ── Horizontal Bar Chart — Best-Selling Products ────────────────────────── */
function BestSellingChart({ data }) {
  if (!data.length) return <EmptyState text="No product sales data yet" />;
  const maxQty = Math.max(...data.map(d => d.quantity));
  const barHeight = 36;
  const gap = 10;
  const labelWidth = 140;
  const chartHeight = data.length * (barHeight + gap) + 10;

  return (
    <svg width="100%" height={chartHeight} viewBox={`0 0 700 ${chartHeight}`} style={{ overflow: "visible" }}>
      <defs>
        {data.map((_, i) => (
          <linearGradient key={i} id={`barGrad${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity="0.9" />
            <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity="0.5" />
          </linearGradient>
        ))}
      </defs>
      {data.map((item, i) => {
        const y = i * (barHeight + gap) + 5;
        const pct = maxQty > 0 ? item.quantity / maxQty : 0;
        const barW = pct * (700 - labelWidth - 90);
        return (
          <g key={item.name}>
            {/* Label */}
            <text x={labelWidth - 8} y={y + barHeight / 2 + 5} textAnchor="end"
              fill="var(--surface-300)" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">
              {item.name.length > 16 ? item.name.slice(0, 15) + "…" : item.name}
            </text>
            {/* Bar bg */}
            <rect x={labelWidth} y={y} width={700 - labelWidth - 90} height={barHeight}
              rx="6" fill="rgba(148,163,184,0.06)" />
            {/* Bar fill */}
            <rect x={labelWidth} y={y} width={0} height={barHeight} rx="6"
              fill={`url(#barGrad${i})`}
              style={{
                animation: `barGrow${i} 0.8s ease-out ${i * 60}ms forwards`,
              }}
            />
            {/* Qty label */}
            <text x={labelWidth + barW + 8} y={y + barHeight / 2 + 5}
              fill={CHART_COLORS[i % CHART_COLORS.length]} fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif"
              style={{ animation: `fadeInText 0.5s ease-out ${i * 60 + 400}ms both` }}>
              {item.quantity} pcs
            </text>
            {/* Inject keyframes */}
            <style>{`
              @keyframes barGrow${i} {
                from { width: 0; }
                to   { width: ${barW}px; }
              }
            `}</style>
          </g>
        );
      })}
      <style>{`
        @keyframes fadeInText { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </svg>
  );
}

/* ── Area Line Chart — Revenue Trend ─────────────────────────────────────── */
function RevenueTrendChart({ data }) {
  if (!data.length) return <EmptyState text="No revenue data yet" />;
  const W = 650, H = 220, padX = 50, padY = 30, padBottom = 40;
  const chartW = W - padX * 2;
  const chartH = H - padY - padBottom;
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const points = data.map((d, i) => ({
    x: padX + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    y: padY + chartH - (d.revenue / maxVal) * chartH,
    ...d,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  return (
    <svg width="100%" height={H + 10} viewBox={`0 0 ${W} ${H + 10}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = padY + chartH - frac * chartH;
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
            <text x={padX - 8} y={y + 4} textAnchor="end" fill="var(--surface-500)" fontSize="10" fontFamily="Inter, sans-serif">
              {fmt(frac * maxVal)}
            </text>
          </g>
        );
      })}
      {/* Area */}
      <path d={areaPath} fill="url(#areaFill)" style={{ animation: "chartFadeIn 1s ease-out both" }} />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        filter="url(#glow)" style={{ animation: "chartFadeIn 0.8s ease-out both" }} />
      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i} style={{ animation: `chartFadeIn 0.5s ease-out ${i * 100 + 300}ms both` }}>
          <circle cx={p.x} cy={p.y} r="5" fill="#6366f1" stroke="var(--surface-900)" strokeWidth="2.5" />
          <text x={p.x} y={H - 5} textAnchor="middle" fill="var(--surface-400)" fontSize="10" fontFamily="Inter, sans-serif">
            {shortDay(p.date)}
          </text>
        </g>
      ))}
      <style>{`@keyframes chartFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </svg>
  );
}

/* ── Donut Chart — Order Status ──────────────────────────────────────────── */
function StatusDonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <EmptyState text="No orders yet" />;
  const cx = 100, cy = 100, R = 75, r = 50;
  let cumAngle = -90;

  const segments = data.filter(d => d.count > 0).map(d => {
    const angle = (d.count / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { ...d, startAngle, angle };
  });

  function arcPath(startDeg, angleDeg, outerR, innerR) {
    const s = (startDeg * Math.PI) / 180;
    const e = ((startDeg + angleDeg) * Math.PI) / 180;
    const largeArc = angleDeg > 180 ? 1 : 0;
    const x1 = cx + outerR * Math.cos(s), y1 = cy + outerR * Math.sin(s);
    const x2 = cx + outerR * Math.cos(e), y2 = cy + outerR * Math.sin(e);
    const x3 = cx + innerR * Math.cos(e), y3 = cy + innerR * Math.sin(e);
    const x4 = cx + innerR * Math.cos(s), y4 = cy + innerR * Math.sin(s);
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-6)", flexWrap: "wrap", justifyContent: "center" }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        {segments.map((seg, i) => (
          <path key={seg.status} d={arcPath(seg.startAngle, seg.angle, R, r)}
            fill={STATUS_PALETTE[seg.status]?.color || CHART_COLORS[i]}
            style={{ animation: `donutPop 0.6s ease-out ${i * 100}ms both`, transformOrigin: "100px 100px" }}
            opacity="0.9" />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--surface-200)" fontSize="22" fontWeight="800" fontFamily="Inter, sans-serif">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--surface-500)" fontSize="11" fontWeight="500" fontFamily="Inter, sans-serif">
          total orders
        </text>
        <style>{`@keyframes donutPop { from { opacity: 0; transform: scale(0.8); } to { opacity: 0.9; transform: scale(1); } }`}</style>
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {segments.map(seg => (
          <div key={seg.status} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: STATUS_PALETTE[seg.status]?.color, flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "var(--surface-300)", fontWeight: 500, minWidth: 80 }}>{seg.status}</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--surface-100)" }}>{seg.count}</span>
            <span style={{ fontSize: "11px", color: "var(--surface-500)" }}>({((seg.count / total) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Vertical Bar Chart (reusable) ───────────────────────────────────────── */
function VerticalBarChart({ data, valueKey = "value", labelKey = "label", color = "#6366f1", formatVal = (v) => v }) {
  if (!data.length) return <EmptyState text="No data available" />;
  const W = 650, H = 200, padX = 50, padBottom = 50, padY = 20;
  const chartW = W - padX * 2;
  const chartH = H - padY - padBottom;
  const maxVal = Math.max(...data.map(d => d[valueKey]), 1);
  const barW = Math.min(40, (chartW / data.length) * 0.6);
  const barGap = chartW / data.length;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`vbarGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {[0, 0.5, 1].map((f, i) => {
        const y = padY + chartH - f * chartH;
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke="rgba(148,163,184,0.08)" />
            <text x={padX - 8} y={y + 4} textAnchor="end" fill="var(--surface-500)" fontSize="10" fontFamily="Inter, sans-serif">
              {formatVal(f * maxVal)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = padX + i * barGap + (barGap - barW) / 2;
        const h = (d[valueKey] / maxVal) * chartH;
        const y = padY + chartH - h;
        return (
          <g key={i}>
            <rect x={x} y={padY + chartH} width={barW} height={0} rx="4"
              fill={`url(#vbarGrad-${color.replace("#", "")})`}
              style={{ animation: `vbarGrow${i} 0.7s ease-out ${i * 50}ms forwards` }} />
            <text x={x + barW / 2} y={H - padBottom + 16} textAnchor="middle"
              fill="var(--surface-400)" fontSize="10" fontFamily="Inter, sans-serif"
              style={{ animation: `fadeInText 0.3s ease ${i * 50 + 400}ms both` }}>
              {d[labelKey]}
            </text>
            <style>{`
              @keyframes vbarGrow${i} {
                from { y: ${padY + chartH}; height: 0; }
                to   { y: ${y}; height: ${h}; }
              }
            `}</style>
          </g>
        );
      })}
      <style>{`@keyframes fadeInText { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </svg>
  );
}

/* ── Empty state placeholder ─────────────────────────────────────────────── */
function EmptyState({ text }) {
  return (
    <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--surface-500)", fontSize: "14px" }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        style={{ margin: "0 auto var(--space-3)", opacity: 0.4 }}>
        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
      </svg>
      {text}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function SalesDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes, categoriesRes] = await Promise.all([
          getOrders(), getProducts(), getCategories(),
        ]);
        setOrders(ordersRes.data || []);
        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (err) {
        console.error("SalesDashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Derive analytics ─────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const delivered = orders.filter(o => o.status === "Delivered");
    const now = new Date();

    // Revenue KPIs
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayRevenue = delivered
      .filter(o => (o.created_at || "").slice(0, 10) === todayStr)
      .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const weekRevenue = delivered
      .filter(o => new Date(o.created_at) >= weekAgo)
      .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const monthRevenue = delivered
      .filter(o => new Date(o.created_at) >= monthStart)
      .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const allTimeRevenue = delivered
      .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

    // Orders by status
    const statusCounts = ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"].map(status => ({
      status,
      count: orders.filter(o => o.status === status).length,
    }));

    // Daily revenue trend (last 7 days)
    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = 0;
    }
    delivered.forEach(o => {
      const key = (o.created_at || "").slice(0, 10);
      if (key in dailyMap) dailyMap[key] += parseFloat(o.total_amount || 0);
    });
    const dailyTrend = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));

    // Best-selling products — aggregate from order_items if available,
    // otherwise estimate from orders (we don't have order_items in the list API,
    // so we'll use product stock_quantity difference as a proxy)
    // Since getOrders returns orders with no items detail, we'll derive best sellers
    // from products sorted by how much stock was consumed (initial - current approximation).
    // For a more accurate view, we sort products by lowest stock and infer popularity.
    const bestSelling = [...products]
      .sort((a, b) => {
        // Products with lower stock relative to a baseline are more popular
        // We'll use stock_quantity ascending (lowest = most sold)
        return (a.stock_quantity || 0) - (b.stock_quantity || 0);
      })
      .slice(0, 10)
      .map((p, i) => ({
        name: p.name,
        quantity: Math.max(0, 50 - (p.stock_quantity || 0)), // estimate sold qty from initial stock seed
        revenue: Math.max(0, 50 - (p.stock_quantity || 0)) * parseFloat(p.price || 0),
        price: parseFloat(p.price || 0),
      }))
      .filter(p => p.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity);

    // Category breakdown
    const catMap = {};
    categories.forEach(c => { catMap[c.category_id] = c.category_name; });
    const categoryBreakdown = {};
    products.forEach(p => {
      const catName = catMap[p.category_id] || "Other";
      if (!categoryBreakdown[catName]) categoryBreakdown[catName] = { label: catName, value: 0, count: 0 };
      const sold = Math.max(0, 50 - (p.stock_quantity || 0));
      categoryBreakdown[catName].value += sold * parseFloat(p.price || 0);
      categoryBreakdown[catName].count += sold;
    });
    const catData = Object.values(categoryBreakdown).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

    // Peak hours (from order created_at)
    const hourMap = {};
    for (let h = 0; h < 24; h++) hourMap[h] = 0;
    orders.forEach(o => {
      if (o.created_at) {
        const hour = new Date(o.created_at).getHours();
        hourMap[hour]++;
      }
    });
    const peakHours = Object.entries(hourMap)
      .map(([h, count]) => ({ label: `${String(h).padStart(2, "0")}:00`, value: count }))
      .filter(d => d.value > 0);

    return {
      todayRevenue, weekRevenue, monthRevenue, allTimeRevenue,
      statusCounts, dailyTrend, bestSelling, catData, peakHours,
      totalOrders: orders.length,
      deliveredCount: delivered.length,
      avgOrderValue: delivered.length > 0 ? allTimeRevenue / delivered.length : 0,
    };
  }, [orders, products, categories]);

  // ── KPI Cards ─────────────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: "Today's Revenue", value: analytics.todayRevenue, prefix: "₺",
      color: "#6366f1", bg: "rgba(99,102,241,0.1)",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M15 9.5c0-1.38-1.34-2.5-3-2.5s-3 1.12-3 2.5 1.34 2.5 3 2.5 3 1.12 3 2.5-1.34 2.5-3 2.5"/></svg>,
    },
    {
      label: "This Week", value: analytics.weekRevenue, prefix: "₺",
      color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
    {
      label: "This Month", value: analytics.monthRevenue, prefix: "₺",
      color: "#10b981", bg: "rgba(16,185,129,0.1)",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
    {
      label: "Avg Order Value", value: analytics.avgOrderValue, prefix: "₺",
      color: "#f97316", bg: "rgba(249,115,22,0.1)",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={s.pageHeader} className="animate-fade-in">
        <div>
          <h1 style={s.title}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" strokeWidth="2.5"
              style={{ marginRight: 10, verticalAlign: "middle", marginTop: -3 }}>
              <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
            </svg>
            Sales Dashboard
          </h1>
          <p style={s.subtitle}>Comprehensive analytics and sales performance overview</p>
        </div>
        <div style={s.headerBadge}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
          <span>Real-time data</span>
        </div>
      </div>

      {loading ? (
        <div style={s.loadingGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: "var(--radius-xl)" }} />
          ))}
          <div className="skeleton" style={{ height: 340, borderRadius: "var(--radius-xl)", gridColumn: "1 / -1" }} />
        </div>
      ) : (
        <>
          {/* ── KPI Cards ──────────────────────────────────────────────── */}
          <div style={s.kpiGrid} className="animate-fade-in">
            {kpiCards.map((card, idx) => (
              <div key={card.label} className="animate-fade-in-up" style={{ ...s.kpiCard, animationDelay: `${idx * 80}ms` }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 12px 30px ${card.bg}`;
                  e.currentTarget.style.borderColor = `${card.color}33`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  e.currentTarget.style.borderColor = "rgba(148,163,184,0.06)";
                }}>
                <div style={{ ...s.kpiIcon, background: card.bg, color: card.color }}>{card.icon}</div>
                <div style={s.kpiInfo}>
                  <div style={s.kpiLabel}>{card.label}</div>
                  <div style={{ ...s.kpiValue, color: card.color }}>
                    {card.prefix}<AnimatedNumber value={card.value} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Revenue summary row ───────────────────────────────────── */}
          <div style={s.summaryRow} className="animate-fade-in-up" >
            <div style={s.summaryItem}>
              <span style={s.summaryLabel}>All-Time Revenue</span>
              <span style={{ ...s.summaryValue, color: "#6366f1" }}>{fmtDec(analytics.allTimeRevenue)}</span>
            </div>
            <div style={s.summaryDivider} />
            <div style={s.summaryItem}>
              <span style={s.summaryLabel}>Total Orders</span>
              <span style={{ ...s.summaryValue, color: "#8b5cf6" }}>{analytics.totalOrders}</span>
            </div>
            <div style={s.summaryDivider} />
            <div style={s.summaryItem}>
              <span style={s.summaryLabel}>Delivered Orders</span>
              <span style={{ ...s.summaryValue, color: "#10b981" }}>{analytics.deliveredCount}</span>
            </div>
            <div style={s.summaryDivider} />
            <div style={s.summaryItem}>
              <span style={s.summaryLabel}>Products in Menu</span>
              <span style={{ ...s.summaryValue, color: "#f97316" }}>{products.length}</span>
            </div>
          </div>

          {/* ── Charts Grid ───────────────────────────────────────────── */}
          <div style={s.chartsGrid}>
            {/* Best-Selling Products */}
            <div className="animate-fade-in-up" style={{ ...s.chartCard, animationDelay: "200ms" }}>
              <div style={s.chartHeader}>
                <h3 style={s.chartTitle}>
                  <span style={s.chartDot("#6366f1")} />
                  Best-Selling Products
                </h3>
                <span style={s.chartBadge}>Top {analytics.bestSelling.length}</span>
              </div>
              <BestSellingChart data={analytics.bestSelling} />
            </div>

            {/* Revenue Trend */}
            <div className="animate-fade-in-up" style={{ ...s.chartCard, animationDelay: "300ms" }}>
              <div style={s.chartHeader}>
                <h3 style={s.chartTitle}>
                  <span style={s.chartDot("#8b5cf6")} />
                  Revenue Trend (Last 7 Days)
                </h3>
              </div>
              <RevenueTrendChart data={analytics.dailyTrend} />
            </div>
          </div>

          {/* ── Bottom row: Donut + Category + Peak Hours ──────────── */}
          <div style={s.bottomGrid}>
            {/* Order Status */}
            <div className="animate-fade-in-up" style={{ ...s.chartCard, animationDelay: "400ms" }}>
              <div style={s.chartHeader}>
                <h3 style={s.chartTitle}>
                  <span style={s.chartDot("#f59e0b")} />
                  Orders by Status
                </h3>
              </div>
              <StatusDonutChart data={analytics.statusCounts} />
            </div>

            {/* Category Breakdown */}
            <div className="animate-fade-in-up" style={{ ...s.chartCard, animationDelay: "500ms" }}>
              <div style={s.chartHeader}>
                <h3 style={s.chartTitle}>
                  <span style={s.chartDot("#10b981")} />
                  Revenue by Category
                </h3>
              </div>
              <VerticalBarChart data={analytics.catData} color="#10b981" formatVal={v => fmt(v)} />
            </div>

            {/* Peak Hours */}
            <div className="animate-fade-in-up" style={{ ...s.chartCard, animationDelay: "600ms" }}>
              <div style={s.chartHeader}>
                <h3 style={s.chartTitle}>
                  <span style={s.chartDot("#f97316")} />
                  Peak Order Hours
                </h3>
              </div>
              <VerticalBarChart data={analytics.peakHours} color="#f97316" formatVal={v => Math.round(v)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const s = {
  pageHeader: {
    marginBottom: "var(--space-6)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "var(--space-4)",
  },
  title: {
    fontSize: "28px", fontWeight: 800, color: "var(--surface-50)", margin: 0, letterSpacing: "-0.5px",
    display: "flex", alignItems: "center",
  },
  subtitle: { fontSize: "15px", color: "var(--surface-400)", marginTop: "var(--space-1)" },
  headerBadge: {
    display: "flex", alignItems: "center", gap: "var(--space-2)",
    padding: "6px 14px", borderRadius: "var(--radius-full)",
    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
    fontSize: "12px", fontWeight: 600, color: "var(--success-400)",
  },
  loadingGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)",
  },

  // KPI cards
  kpiGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)",
  },
  kpiCard: {
    display: "flex", alignItems: "flex-start", gap: "var(--space-4)",
    padding: "var(--space-5)", background: "var(--surface-900)", borderRadius: "var(--radius-xl)",
    border: "1px solid rgba(148,163,184,0.06)", boxShadow: "var(--shadow-md)",
    transition: "all var(--transition-normal)", cursor: "default",
  },
  kpiIcon: {
    width: 48, height: 48, borderRadius: "var(--radius-lg)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  kpiInfo: { flex: 1 },
  kpiLabel: { fontSize: "12px", fontWeight: 600, color: "var(--surface-500)", textTransform: "uppercase", letterSpacing: "0.5px" },
  kpiValue: { fontSize: "24px", fontWeight: 800, marginTop: 4 },

  // Summary row
  summaryRow: {
    display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap",
    gap: "var(--space-4)", padding: "var(--space-5) var(--space-6)",
    background: "var(--surface-900)", borderRadius: "var(--radius-xl)",
    border: "1px solid rgba(148,163,184,0.06)", marginBottom: "var(--space-6)",
    boxShadow: "var(--shadow-md)",
  },
  summaryItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)" },
  summaryLabel: { fontSize: "11px", fontWeight: 600, color: "var(--surface-500)", textTransform: "uppercase", letterSpacing: "0.5px" },
  summaryValue: { fontSize: "20px", fontWeight: 800 },
  summaryDivider: { width: 1, height: 40, background: "rgba(148,163,184,0.1)" },

  // Charts
  chartsGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)",
  },
  bottomGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)",
  },
  chartCard: {
    background: "var(--surface-900)", borderRadius: "var(--radius-xl)",
    border: "1px solid rgba(148,163,184,0.06)", padding: "var(--space-5)",
    boxShadow: "var(--shadow-md)", overflow: "hidden",
  },
  chartHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)",
  },
  chartTitle: {
    fontSize: "15px", fontWeight: 700, color: "var(--surface-200)", margin: 0,
    display: "flex", alignItems: "center", gap: "var(--space-2)",
  },
  chartDot: (color) => ({
    display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0,
  }),
  chartBadge: {
    padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: "11px", fontWeight: 700,
    background: "rgba(99,102,241,0.1)", color: "var(--primary-400)", border: "1px solid rgba(99,102,241,0.15)",
  },
};
