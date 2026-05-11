import React, { useEffect, useState, useMemo } from "react";
import { getOrders, getProducts, getCategories } from "../services/api";

const fmt = (n) => `₺${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDec = (n) => `₺${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n) => `${Number(n).toFixed(1)}%`;

function AnimNum({ value, prefix = "" }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    const t = typeof value === "number" ? value : parseFloat(value) || 0;
    if (t === 0) { setD(0); return; }
    let cur = 0; const step = t / 56;
    const id = setInterval(() => { cur += step; if (cur >= t) { setD(t); clearInterval(id); } else setD(cur); }, 16);
    return () => clearInterval(id);
  }, [value]);
  return <span>{prefix}{fmtDec(d).replace("₺", "")}</span>;
}

function MiniBar({ label, value, max, color }) {
  const w = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "var(--surface-300)", fontWeight: 600 }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{fmt(value)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(148,163,184,0.08)" }}>
        <div style={{ height: 6, borderRadius: 3, background: color, width: `${w}%`, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function TrendChart({ data, costRatio }) {
  if (!data.length) return <div style={{ padding: 40, textAlign: "center", color: "var(--surface-500)" }}>No data</div>;
  const W = 620, H = 200, px = 50, py = 25, pb = 40;
  const cW = W - px * 2, cH = H - py - pb;
  const maxV = Math.max(...data.map(d => d.revenue), 1);
  const pts = data.map((d, i) => ({
    x: px + (data.length === 1 ? cW / 2 : (i / (data.length - 1)) * cW),
    yR: py + cH - (d.revenue / maxV) * cH,
    yP: py + cH - ((d.revenue * (1 - costRatio)) / maxV) * cH,
    ...d,
  }));
  const rl = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yR}`).join(" ");
  const pl = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yP}`).join(" ");
  const ra = `${rl} L ${pts[pts.length-1].x} ${py+cH} L ${pts[0].x} ${py+cH} Z`;
  const pa = `${pl} L ${pts[pts.length-1].x} ${py+cH} L ${pts[0].x} ${py+cH} Z`;
  const sd = (s) => new Date(s).toLocaleDateString("en-US", { weekday: "short" });
  return (
    <svg width="100%" height={H+10} viewBox={`0 0 ${W} ${H+10}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" /></linearGradient>
        <linearGradient id="profFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.3" /><stop offset="100%" stopColor="#10b981" stopOpacity="0.02" /></linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => { const y = py + cH - f * cH; return (
        <g key={i}><line x1={px} y1={y} x2={px+cW} y2={y} stroke="rgba(148,163,184,0.08)" /><text x={px-8} y={y+4} textAnchor="end" fill="var(--surface-500)" fontSize="10" fontFamily="Inter,sans-serif">{fmt(f*maxV)}</text></g>
      ); })}
      <path d={ra} fill="url(#revFill)" /><path d={rl} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
      <path d={pa} fill="url(#profFill)" /><path d={pl} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 3" />
      {pts.map((p, i) => (
        <g key={i}><circle cx={p.x} cy={p.yR} r="4" fill="#6366f1" stroke="var(--surface-900)" strokeWidth="2" />
        <circle cx={p.x} cy={p.yP} r="3" fill="#10b981" stroke="var(--surface-900)" strokeWidth="2" />
        <text x={p.x} y={H-5} textAnchor="middle" fill="var(--surface-400)" fontSize="10" fontFamily="Inter,sans-serif">{sd(p.date)}</text></g>
      ))}
      <g transform={`translate(${px+cW-120},${py-10})`}><rect x="0" y="0" width="8" height="8" rx="2" fill="#6366f1" /><text x="12" y="8" fontSize="10" fill="var(--surface-400)" fontFamily="Inter">Revenue</text>
      <rect x="60" y="0" width="8" height="8" rx="2" fill="#10b981" /><text x="72" y="8" fontSize="10" fill="var(--surface-400)" fontFamily="Inter">Profit</text></g>
    </svg>
  );
}

export default function RevenueProfit() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [costRatio, setCostRatio] = useState(0.4);

  useEffect(() => {
    (async () => {
      try {
        const [o, p, c] = await Promise.all([getOrders(), getProducts(), getCategories()]);
        setOrders(o.data || []); setProducts(p.data || []); setCategories(c.data || []);
      } catch (e) { console.error("RevenueProfit fetch:", e); }
      finally { setLoading(false); }
    })();
  }, []);

  const data = useMemo(() => {
    const del = orders.filter(o => o.status === "Delivered");
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalRev = del.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const todayRev = del.filter(o => (o.created_at || "").slice(0, 10) === todayStr).reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const weekRev = del.filter(o => new Date(o.created_at) >= weekAgo).reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const monthRev = del.filter(o => new Date(o.created_at) >= monthStart).reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const grossProfit = totalRev * (1 - costRatio);
    const opOverhead = 0.15;
    const netProfit = grossProfit * (1 - opOverhead);
    const marginPct = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;
    const avgOrder = del.length > 0 ? totalRev / del.length : 0;

    // Daily trend
    const dm = {};
    for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); dm[d.toISOString().slice(0, 10)] = 0; }
    del.forEach(o => { const k = (o.created_at || "").slice(0, 10); if (k in dm) dm[k] += parseFloat(o.total_amount || 0); });
    const dailyTrend = Object.entries(dm).map(([date, revenue]) => ({ date, revenue }));

    // Category breakdown
    const catMap = {}; categories.forEach(c => { catMap[c.category_id] = c.category_name; });
    const catBreak = {};
    products.forEach(p => {
      const cn = catMap[p.category_id] || "Other";
      if (!catBreak[cn]) catBreak[cn] = { name: cn, revenue: 0 };
      const sold = Math.max(0, 50 - (p.stock_quantity || 0));
      catBreak[cn].revenue += sold * parseFloat(p.price || 0);
    });
    const catData = Object.values(catBreak).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);
    const catMax = catData.length ? Math.max(...catData.map(c => c.revenue)) : 0;

    // Top products
    const topProducts = [...products]
      .map(p => { const sold = Math.max(0, 50 - (p.stock_quantity || 0)); return { name: p.name, sold, revenue: sold * parseFloat(p.price || 0), price: parseFloat(p.price || 0) }; })
      .filter(p => p.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    const tables = orders.length; // approximate
    const revPerOrder = avgOrder;
    const revPerProduct = products.length > 0 ? totalRev / products.length : 0;

    return { totalRev, todayRev, weekRev, monthRev, grossProfit, netProfit, marginPct, avgOrder, dailyTrend, catData, catMax, topProducts, deliveredCount: del.length, totalOrders: orders.length, revPerOrder, revPerProduct };
  }, [orders, products, categories, costRatio]);

  const kpis = [
    { label: "Total Revenue", value: data.totalRev, prefix: "₺", color: "#6366f1", bg: "rgba(99,102,241,0.1)", icon: "💰" },
    { label: "Gross Profit", value: data.grossProfit, prefix: "₺", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: "📈" },
    { label: "Net Profit", value: data.netProfit, prefix: "₺", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", icon: "🎯" },
    { label: "Profit Margin", value: data.marginPct, suffix: "%", color: "#f97316", bg: "rgba(249,115,22,0.1)", icon: "⚡" },
  ];

  const perfMetrics = [
    { label: "Avg Order Value", value: data.avgOrder, color: "#6366f1" },
    { label: "Revenue / Product", value: data.revPerProduct, color: "#8b5cf6" },
    { label: "Delivered Orders", value: data.deliveredCount, color: "#10b981", raw: true },
    { label: "Total Orders", value: data.totalOrders, color: "#f59e0b", raw: true },
  ];

  if (loading) return (
    <div><div style={st.kpiGrid}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: "var(--radius-xl)" }} />)}</div>
    <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-xl)", marginTop: 24 }} /></div>
  );

  return (
    <div>
      {/* Header */}
      <div style={st.header} className="animate-fade-in">
        <div>
          <h1 style={st.title}>💰 Revenue & Profit</h1>
          <p style={st.sub}>Financial overview with configurable cost analysis</p>
        </div>
        <div style={st.badge}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} /><span>Live metrics</span></div>
      </div>

      {/* KPI Cards */}
      <div style={st.kpiGrid} className="animate-fade-in">
        {kpis.map((k, i) => (
          <div key={k.label} className="animate-fade-in-up" style={{ ...st.kpiCard, animationDelay: `${i * 80}ms` }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 30px ${k.bg}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}>
            <div style={{ ...st.kpiIcon, background: k.bg }}><span style={{ fontSize: 22 }}>{k.icon}</span></div>
            <div style={{ flex: 1 }}>
              <div style={st.kpiLabel}>{k.label}</div>
              <div style={{ ...st.kpiValue, color: k.color }}>
                {k.suffix ? <>{data.marginPct.toFixed(1)}%</> : <>{k.prefix}<AnimNum value={k.value} /></>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Summary Row */}
      <div style={st.summaryRow} className="animate-fade-in-up">
        {[
          { label: "Today", value: data.todayRev, color: "#6366f1" },
          { label: "This Week", value: data.weekRev, color: "#8b5cf6" },
          { label: "This Month", value: data.monthRev, color: "#10b981" },
          { label: "All-Time", value: data.totalRev, color: "#f97316" },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <div style={{ width: 1, height: 40, background: "rgba(148,163,184,0.1)" }} />}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--surface-500)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 4 }}>{fmtDec(s.value)}</div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Cost Ratio Slider */}
      <div style={st.sliderCard} className="animate-fade-in-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--surface-200)" }}>⚙️ Cost Ratio Estimator</div>
            <div style={{ fontSize: 12, color: "var(--surface-500)", marginTop: 2 }}>Adjust estimated cost of goods sold to recalculate profits</div>
          </div>
          <div style={{ ...st.sliderBadge, background: `rgba(${costRatio > 0.5 ? "239,68,68" : "16,185,129"},0.1)`, color: costRatio > 0.5 ? "#ef4444" : "#10b981" }}>
            Cost: {(costRatio * 100).toFixed(0)}% → Margin: {((1 - costRatio) * 100).toFixed(0)}%
          </div>
        </div>
        <input type="range" min="10" max="80" value={costRatio * 100} onChange={e => setCostRatio(e.target.value / 100)}
          style={{ width: "100%", accentColor: "#6366f1", height: 6, cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--surface-500)", marginTop: 4 }}>
          <span>10% cost</span><span>80% cost</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={st.chartsGrid}>
        {/* Trend Chart */}
        <div style={st.chartCard} className="animate-fade-in-up">
          <div style={st.chartHead}><h3 style={st.chartTitle}><span style={{ ...st.dot, background: "#6366f1" }} />Revenue & Profit Trend (7 Days)</h3></div>
          <TrendChart data={data.dailyTrend} costRatio={costRatio} />
        </div>

        {/* Category Breakdown */}
        <div style={st.chartCard} className="animate-fade-in-up">
          <div style={st.chartHead}><h3 style={st.chartTitle}><span style={{ ...st.dot, background: "#10b981" }} />Revenue by Category</h3></div>
          {data.catData.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "var(--surface-500)" }}>No category data</div> :
            <div style={{ padding: "var(--space-2) 0" }}>
              {data.catData.map((c, i) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 100, fontSize: 13, fontWeight: 600, color: "var(--surface-300)", textAlign: "right", flexShrink: 0 }}>{c.name}</div>
                  <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1, height: 22, borderRadius: 6, background: "rgba(148,163,184,0.06)", overflow: "hidden", position: "relative" }}>
                      <div style={{ height: "100%", borderRadius: 6, background: `linear-gradient(90deg, #10b981cc, #10b98166)`, width: `${(c.revenue / data.catMax) * 100}%`, transition: "width 0.8s ease" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981", minWidth: 70, textAlign: "right" }}>{fmt(c.revenue)}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#8b5cf6", minWidth: 60, textAlign: "right" }}>{fmt(c.revenue * (1 - costRatio))}</span>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 8, fontSize: 11, color: "var(--surface-500)" }}>
                <span><span style={{ ...st.dot, background: "#10b981", marginRight: 4 }} />Revenue</span>
                <span><span style={{ ...st.dot, background: "#8b5cf6", marginRight: 4 }} />Est. Profit</span>
              </div>
            </div>
          }
        </div>
      </div>

      {/* Bottom Grid: Top Products + Performance */}
      <div style={st.bottomGrid}>
        {/* Top Revenue Products */}
        <div style={st.chartCard} className="animate-fade-in-up">
          <div style={st.chartHead}><h3 style={st.chartTitle}><span style={{ ...st.dot, background: "#f97316" }} />Top Revenue Generators</h3></div>
          {data.topProducts.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "var(--surface-500)" }}>No product data</div> :
            <div>{data.topProducts.map((p, i) => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: i % 2 === 0 ? "rgba(148,163,184,0.03)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: `rgba(249,115,22,${0.15 - i * 0.015})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#f97316" }}>{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--surface-200)" }}>{p.name}</span>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--surface-500)" }}>{p.sold} sold</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#f97316", minWidth: 60, textAlign: "right" }}>{fmt(p.revenue)}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981", minWidth: 55, textAlign: "right" }}>{fmt(p.revenue * (1 - costRatio))}</span>
                </div>
              </div>
            ))}</div>
          }
        </div>

        {/* Performance Metrics */}
        <div style={st.chartCard} className="animate-fade-in-up">
          <div style={st.chartHead}><h3 style={st.chartTitle}><span style={{ ...st.dot, background: "#8b5cf6" }} />Performance Metrics</h3></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {perfMetrics.map(m => (
              <div key={m.label} style={{ padding: 16, background: "rgba(148,163,184,0.04)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--surface-500)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.raw ? m.value : fmtDec(m.value)}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--surface-300)", marginBottom: 12 }}>Profit Margin Gauge</div>
            <div style={{ height: 12, borderRadius: 6, background: "rgba(148,163,184,0.08)", position: "relative", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 6, background: data.marginPct > 30 ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #ef4444, #f97316)", width: `${Math.min(data.marginPct, 100)}%`, transition: "width 0.8s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--surface-500)", marginTop: 4 }}>
              <span>0%</span><span style={{ fontWeight: 700, color: data.marginPct > 30 ? "#10b981" : "#ef4444" }}>{data.marginPct.toFixed(1)}%</span><span>100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const st = {
  header: { marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-4)" },
  title: { fontSize: 28, fontWeight: 800, color: "var(--surface-50)", margin: 0, letterSpacing: "-0.5px" },
  sub: { fontSize: 15, color: "var(--surface-400)", marginTop: "var(--space-1)" },
  badge: { display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "6px 14px", borderRadius: "var(--radius-full)", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", fontSize: 12, fontWeight: 600, color: "var(--success-400)" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" },
  kpiCard: { display: "flex", alignItems: "flex-start", gap: "var(--space-4)", padding: "var(--space-5)", background: "var(--surface-900)", borderRadius: "var(--radius-xl)", border: "1px solid rgba(148,163,184,0.06)", boxShadow: "var(--shadow-md)", transition: "all var(--transition-normal)", cursor: "default" },
  kpiIcon: { width: 48, height: 48, borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  kpiLabel: { fontSize: 12, fontWeight: 600, color: "var(--surface-500)", textTransform: "uppercase", letterSpacing: "0.5px" },
  kpiValue: { fontSize: 24, fontWeight: 800, marginTop: 4 },
  summaryRow: { display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "var(--space-4)", padding: "var(--space-5) var(--space-6)", background: "var(--surface-900)", borderRadius: "var(--radius-xl)", border: "1px solid rgba(148,163,184,0.06)", marginBottom: "var(--space-6)", boxShadow: "var(--shadow-md)" },
  sliderCard: { padding: "var(--space-5)", background: "var(--surface-900)", borderRadius: "var(--radius-xl)", border: "1px solid rgba(148,163,184,0.06)", marginBottom: "var(--space-6)", boxShadow: "var(--shadow-md)" },
  sliderBadge: { padding: "4px 12px", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 700 },
  chartsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" },
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" },
  chartCard: { background: "var(--surface-900)", borderRadius: "var(--radius-xl)", border: "1px solid rgba(148,163,184,0.06)", padding: "var(--space-5)", boxShadow: "var(--shadow-md)", overflow: "hidden" },
  chartHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" },
  chartTitle: { fontSize: 15, fontWeight: 700, color: "var(--surface-200)", margin: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" },
  dot: { display: "inline-block", width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
};
