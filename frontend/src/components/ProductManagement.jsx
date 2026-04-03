import React, { useEffect, useState } from "react";

const API = "http://localhost:5000/api";
const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ─── Icon Components ─────────────────────────────────────── */
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconGrid = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconList = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

/* ─── Slide-over Form Panel ───────────────────────────────── */
const ProductFormPanel = ({ open, onClose, onSubmit, editingProduct, categories }) => {
  const [form, setForm] = useState({ name: "", price: "", categoryId: "", stock: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(editingProduct
      ? { name: editingProduct.name, price: editingProduct.price, categoryId: editingProduct.categoryId, stock: editingProduct.stock }
      : { name: "", price: "", categoryId: "", stock: "" }
    );
  }, [editingProduct, open]);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async (e) => { e.preventDefault(); setSubmitting(true); await onSubmit(form); setSubmitting(false); };

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    background: "var(--surface-800)",
    border: "1.5px solid var(--surface-700)",
    borderRadius: "10px",
    color: "var(--surface-100)", fontSize: "14px", outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
    fontFamily: "var(--font-family)",
  };
  const onFocus = (e) => { e.target.style.borderColor = "var(--primary-500)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; };
  const onBlur  = (e) => { e.target.style.borderColor = "var(--surface-700)"; e.target.style.boxShadow = "none"; };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(2,6,23,0.75)", backdropFilter:"blur(6px)", zIndex:40, opacity:open?1:0, pointerEvents:open?"auto":"none", transition:"opacity 0.25s" }} />
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"440px", background:"var(--surface-900)", borderLeft:"1px solid var(--surface-800)", zIndex:50, transform:open?"translateX(0)":"translateX(100%)", transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)", display:"flex", flexDirection:"column", boxShadow:"-20px 0 60px rgba(0,0,0,0.5)" }}>

        {/* Panel header */}
        <div style={{ padding:"24px 28px", borderBottom:"1px solid var(--surface-800)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.02)" }}>
          <div>
            <p style={{ fontSize:"11px", color:"var(--primary-400)", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", margin:0 }}>
              {editingProduct ? "Edit Product" : "New Product"}
            </p>
            <h2 style={{ margin:"5px 0 0", fontSize:"20px", fontWeight:700, color:"var(--surface-50)" }}>
              {editingProduct ? editingProduct.name : "Add to Menu"}
            </h2>
          </div>
          <button onClick={onClose}
            style={{ background:"var(--surface-800)", border:"1px solid var(--surface-700)", borderRadius:"8px", width:"36px", height:"36px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--surface-400)", transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--surface-700)"; e.currentTarget.style.color="var(--surface-200)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--surface-800)"; e.currentTarget.style.color="var(--surface-400)";}}>
            <IconX />
          </button>
        </div>

        <form onSubmit={submit} style={{ padding:"28px", display:"flex", flexDirection:"column", gap:"20px", flex:1, overflowY:"auto" }}>
          {[
            { label:"Product Name", name:"name",  type:"text",   placeholder:"e.g. Margherita Pizza", required:true },
            { label:"Price (₺)",    name:"price", type:"number", placeholder:"0.00",                  required:true },
            { label:"Stock Qty",   name:"stock", type:"number", placeholder:"0" },
          ].map(f => (
            <div key={f.name}>
              <label style={{ display:"block", fontSize:"13px", fontWeight:600, color:"var(--surface-300)", marginBottom:"8px" }}>
                {f.label}{f.required && <span style={{ color:"var(--primary-400)", marginLeft:"4px" }}>*</span>}
              </label>
              <input type={f.type} name={f.name} placeholder={f.placeholder} value={form[f.name]} onChange={handle} required={f.required} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          ))}

          <div>
            <label style={{ display:"block", fontSize:"13px", fontWeight:600, color:"var(--surface-300)", marginBottom:"8px" }}>
              Category <span style={{ color:"var(--primary-400)" }}>*</span>
            </label>
            <select name="categoryId" value={form.categoryId} onChange={handle} required
              style={{ ...inputStyle, appearance:"none", cursor:"pointer", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", paddingRight:"36px", color:form.categoryId?"var(--surface-100)":"var(--surface-500)" }} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Select a category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ marginTop:"auto", paddingTop:"16px", display:"flex", gap:"12px" }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, padding:"12px", background:"var(--surface-800)", border:"1px solid var(--surface-700)", borderRadius:"10px", color:"var(--surface-400)", fontSize:"14px", fontWeight:500, cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--surface-700)"; e.currentTarget.style.color="var(--surface-200)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="var(--surface-800)"; e.currentTarget.style.color="var(--surface-400)";}}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ flex:2, padding:"12px", background:submitting?"var(--primary-700)":"var(--primary-600)", border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:600, cursor:submitting?"not-allowed":"pointer", opacity:submitting?0.75:1, transition:"all 0.15s", boxShadow:submitting?"none":"0 4px 14px rgba(99,102,241,0.35)" }}
              onMouseEnter={e=>{ if(!submitting) { e.currentTarget.style.background="var(--primary-500)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(99,102,241,0.45)"; }}}
              onMouseLeave={e=>{ e.currentTarget.style.background=submitting?"var(--primary-700)":"var(--primary-600)"; e.currentTarget.style.boxShadow=submitting?"none":"0 4px 14px rgba(99,102,241,0.35)"; }}>
              {submitting ? "Saving…" : editingProduct ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

/* ─── Delete Confirm Modal ────────────────────────────────── */
const DeleteModal = ({ product, onConfirm, onCancel }) => {
  if (!product) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:60, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(2,6,23,0.85)", backdropFilter:"blur(8px)" }}>
      <div style={{ background:"var(--surface-900)", border:"1px solid var(--surface-700)", borderRadius:"20px", padding:"36px", width:"380px", textAlign:"center", boxShadow:"0 25px 50px rgba(0,0,0,0.6)", animation:"scaleIn 0.2s ease-out both" }}>
        <div style={{ width:"60px", height:"60px", borderRadius:"50%", background:"rgba(239,68,68,0.15)", border:"1.5px solid rgba(239,68,68,0.35)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", color:"var(--danger-400)" }}>
          <IconTrash />
        </div>
        <h3 style={{ margin:"0 0 8px", color:"var(--surface-50)", fontSize:"18px", fontWeight:700 }}>Delete Product?</h3>
        <p style={{ margin:"0 0 28px", color:"var(--surface-500)", fontSize:"14px", lineHeight:1.6 }}>
          <strong style={{ color:"var(--surface-200)" }}>{product.name}</strong> will be permanently removed from the menu.
        </p>
        <div style={{ display:"flex", gap:"12px" }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"12px", background:"var(--surface-800)", border:"1px solid var(--surface-700)", borderRadius:"10px", color:"var(--surface-300)", fontSize:"14px", fontWeight:500, cursor:"pointer", transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--surface-700)";}} onMouseLeave={e=>{e.currentTarget.style.background="var(--surface-800)";}}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ flex:1, padding:"12px", background:"var(--danger-600)", border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:600, cursor:"pointer", transition:"background 0.15s", boxShadow:"0 4px 14px rgba(239,68,68,0.3)" }}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--danger-500)";}} onMouseLeave={e=>{e.currentTarget.style.background="var(--danger-600)";}}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Stock Badge ─────────────────────────────────────────── */
const StockBadge = ({ qty }) => {
  const n = Number(qty);
  const [bg, color, dot, label] = n === 0
    ? ["rgba(239,68,68,0.18)", "var(--danger-400)", "var(--danger-400)", "Out of Stock"]
    : n < 10
    ? ["rgba(245,158,11,0.18)", "var(--warning-400)", "var(--warning-400)", `${n} low`]
    : ["rgba(16,185,129,0.18)", "var(--success-400)", "var(--success-400)", `${n} in stock`];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"5px 11px", borderRadius:"20px", background:bg, color, fontSize:"12px", fontWeight:600, whiteSpace:"nowrap" }}>
      <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:dot, flexShrink:0 }} />
      {label}
    </span>
  );
};

/* ─── Product Card (grid view) ────────────────────────────── */
const ProductCard = ({ product, catName, onEdit, onDelete }) => {
  const n = Number(product.stock);
  const [sc, dc] = n===0 ? ["rgba(239,68,68,0.18)","var(--danger-400)"] : n<10 ? ["rgba(245,158,11,0.18)","var(--warning-400)"] : ["rgba(16,185,129,0.18)","var(--success-400)"];
  return (
    <div className="animate-fade-in-up"
      style={{ background:"var(--surface-900)", border:"1px solid var(--surface-800)", borderRadius:"16px", padding:"20px", display:"flex", flexDirection:"column", gap:"16px", transition:"all 0.2s", boxShadow:"0 4px 6px rgba(0,0,0,0.15)" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.borderColor="rgba(99,102,241,0.4)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(99,102,241,0.15)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor="var(--surface-800)"; e.currentTarget.style.boxShadow="0 4px 6px rgba(0,0,0,0.15)";}}>
      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
        <div style={{ width:"46px", height:"46px", borderRadius:"12px", background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>🍽</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, color:"var(--surface-50)", fontSize:"14px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{product.name}</div>
          <span style={{ padding:"2px 8px", borderRadius:"6px", background:"var(--surface-800)", color:"var(--surface-400)", fontSize:"11px", fontWeight:600 }}>{catName(product.categoryId)}</span>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:"22px", fontWeight:800, color:"var(--primary-400)", letterSpacing:"-0.5px" }}>₺{Number(product.price).toFixed(2)}</span>
        <span style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"5px 11px", borderRadius:"20px", background:sc, color:dc, fontSize:"12px", fontWeight:600 }}>
          <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:dc }} />
          {n===0 ? "Out of Stock" : n<10 ? `${n} low` : `${n} in stock`}
        </span>
      </div>
      <div style={{ display:"flex", gap:"8px", paddingTop:"12px", borderTop:"1px solid var(--surface-800)" }}>
        <button onClick={()=>onEdit(product)}
          style={{ flex:1, padding:"9px", background:"var(--primary-600)", border:"none", borderRadius:"8px", color:"#fff", fontSize:"13px", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", transition:"all 0.15s", boxShadow:"0 2px 8px rgba(99,102,241,0.3)" }}
          onMouseEnter={e=>{e.currentTarget.style.background="var(--primary-500)"; e.currentTarget.style.boxShadow="0 4px 12px rgba(99,102,241,0.45)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="var(--primary-600)"; e.currentTarget.style.boxShadow="0 2px 8px rgba(99,102,241,0.3)";}}>
          <IconEdit /> Edit
        </button>
        <button onClick={()=>onDelete(product)}
          style={{ flex:1, padding:"9px", background:"var(--danger-600)", border:"none", borderRadius:"8px", color:"#fff", fontSize:"13px", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", transition:"all 0.15s", boxShadow:"0 2px 8px rgba(239,68,68,0.25)" }}
          onMouseEnter={e=>{e.currentTarget.style.background="var(--danger-500)"; e.currentTarget.style.boxShadow="0 4px 12px rgba(239,68,68,0.4)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="var(--danger-600)"; e.currentTarget.style.boxShadow="0 2px 8px rgba(239,68,68,0.25)";}}>
          <IconTrash /> Delete
        </button>
      </div>
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────── */
export default function ProductManagement() {
  const [products,       setProducts]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [panelOpen,      setPanelOpen]      = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [search,         setSearch]         = useState("");
  const [filterCat,      setFilterCat]      = useState("");
  const [viewMode,       setViewMode]       = useState("table");

  const loadAll = async () => {
    setLoading(true); setError(null);
    try {
      const h = authHeaders();
      const [catRes, prodRes] = await Promise.all([
        fetch(`${API}/categories`, { headers: h }),
        fetch(`${API}/products`,   { headers: h }),
      ]);
      if (catRes.status === 401 || prodRes.status === 401) throw new Error("Please login again.");
      if (!catRes.ok)  throw new Error(`Failed to load categories (${catRes.status}).`);
      if (!prodRes.ok) throw new Error(`Failed to load products (${prodRes.status}).`);
      const catData  = await catRes.json();
      const prodData = await prodRes.json();
      setCategories(Array.isArray(catData?.data)  ? catData.data.map(r  => ({ id: r.category_id, name: r.category_name })) : []);
      setProducts  (Array.isArray(prodData?.data) ? prodData.data.map(r => ({ id: r.product_id, name: r.name, price: r.price, categoryId: r.category_id, stock: r.stock_quantity })) : []);
    } catch(e) { setError(e?.message || "Failed to load."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const catName = (id) => categories.find(c => Number(c.id) === Number(id))?.name ?? "—";

  const handleSubmit = async (form) => {
    const token = localStorage.getItem("token"); if (!token) return;
    setError(null);
    try {
      const payload = { category_id: Number(form.categoryId), name: form.name.trim(), price: Number(form.price), stock_quantity: Number(form.stock) };
      const url = editingProduct ? `${API}/products/${editingProduct.id}` : `${API}/products`;
      const res = await fetch(url, { method: editingProduct ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Save failed (${res.status}).`);
      setEditingProduct(null); setPanelOpen(false); await loadAll();
    } catch(e) { setError(e?.message || "Failed to save."); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API}/products/${deleteTarget.id}`, { method:"DELETE", headers:authHeaders() });
      if (!res.ok) throw new Error(`Delete failed (${res.status}).`);
      setDeleteTarget(null); await loadAll();
    } catch(e) { setError(e?.message || "Failed to delete."); }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.name.toLowerCase().includes(q) || catName(p.categoryId).toLowerCase().includes(q))
        && (!filterCat || String(p.categoryId) === filterCat);
  });

  const openEdit   = (p) => { setEditingProduct(p); setPanelOpen(true); };
  const closePanel = ()  => { setPanelOpen(false); setEditingProduct(null); };

  /* Stat values */
  const outOfStock = products.filter(p => Number(p.stock) === 0).length;
  const lowStock   = products.filter(p => Number(p.stock) > 0 && Number(p.stock) < 10).length;
  const totalValue = products.reduce((s, p) => s + Number(p.price) * Number(p.stock), 0);

  const stats = [
    {
      label:"Total Products", value: loading?"—":products.length, sub:`across ${categories.length} categories`,
      color:"var(--primary-400)", bg:"rgba(99,102,241,0.12)", border:"rgba(99,102,241,0.25)",
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    },
    {
      label:"Low Stock", value: loading?"—":lowStock, sub:"items below 10 units",
      color:"var(--warning-400)", bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.25)",
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    },
    {
      label:"Out of Stock", value: loading?"—":outOfStock, sub:"need restocking now",
      color:"var(--danger-400)", bg:"rgba(239,68,68,0.12)", border:"rgba(239,68,68,0.25)",
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    },
    {
      label:"Inventory Value", value: loading?"—":`₺${totalValue.toLocaleString("tr-TR",{maximumFractionDigits:0})}`, sub:"total stock value",
      color:"var(--success-400)", bg:"rgba(16,185,129,0.12)", border:"rgba(16,185,129,0.25)",
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
  ];

  return (
    <div style={{ minHeight:"100%", fontFamily:"var(--font-family)", color:"var(--surface-100)" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.93); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .pm-row:hover td { background: rgba(255,255,255,0.03) !important; }
        .pm-edit-btn { padding:8px 16px; background:var(--primary-600); border:none; border-radius:8px; color:#fff; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.15s; box-shadow:0 2px 8px rgba(99,102,241,0.35); font-family:var(--font-family); letter-spacing:0.02em; }
        .pm-edit-btn:hover { background:var(--primary-500); box-shadow:0 4px 14px rgba(99,102,241,0.5); transform:translateY(-1px); }
        .pm-delete-btn { padding:8px 16px; background:var(--danger-600); border:none; border-radius:8px; color:#fff; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.15s; box-shadow:0 2px 8px rgba(239,68,68,0.3); font-family:var(--font-family); letter-spacing:0.02em; }
        .pm-delete-btn:hover { background:var(--danger-500); box-shadow:0 4px 14px rgba(239,68,68,0.45); transform:translateY(-1px); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:"28px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"16px", animation:"fadeInUp 0.4s ease-out both" }}>
        <div>
          <h1 style={{ margin:0, fontSize:"28px", fontWeight:800, color:"var(--surface-50)", letterSpacing:"-0.5px" }}>Products</h1>
          <p style={{ margin:"6px 0 0", color:"var(--surface-500)", fontSize:"14px" }}>
            {loading ? "Loading…" : `${products.length} item${products.length!==1?"s":""} across ${categories.length} categories`}
          </p>
        </div>
        <div style={{ display:"flex", gap:"10px" }}>
          <button onClick={loadAll}
            style={{ display:"flex", alignItems:"center", gap:"8px", padding:"11px 18px", background:"var(--surface-800)", border:"1px solid var(--surface-700)", borderRadius:"10px", color:"var(--surface-300)", fontSize:"14px", fontWeight:500, cursor:"pointer", transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--surface-700)"; e.currentTarget.style.color="var(--surface-100)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--surface-800)"; e.currentTarget.style.color="var(--surface-300)";}}>
            <IconRefresh /> Refresh
          </button>
          <button
            onClick={() => { setEditingProduct(null); setPanelOpen(true); }}
            style={{ display:"flex", alignItems:"center", gap:"8px", padding:"11px 22px", background:"var(--primary-600)", border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:600, cursor:"pointer", transition:"all 0.15s", boxShadow:"0 4px 14px rgba(99,102,241,0.35)" }}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--primary-500)"; e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(99,102,241,0.5)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--primary-600)"; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 14px rgba(99,102,241,0.35)";}}>
            <IconPlus /> Add Product
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"28px" }}>
        {stats.map((s, i) => (
          <div key={s.label}
            style={{ display:"flex", alignItems:"flex-start", gap:"14px", padding:"20px", background:"var(--surface-900)", border:`1px solid ${s.border}`, borderRadius:"16px", boxShadow:"0 4px 6px rgba(0,0,0,0.15)", animation:`fadeInUp 0.4s ${i*70}ms ease-out both`, transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 16px 40px ${s.bg}`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 6px rgba(0,0,0,0.15)";}}>
            <div style={{ width:46, height:46, borderRadius:"12px", background:s.bg, color:s.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:"11px", fontWeight:700, color:"var(--surface-600)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{s.label}</div>
              <div style={{ fontSize:"24px", fontWeight:800, color:s.color, marginTop:3 }}>{s.value}</div>
              <div style={{ fontSize:"12px", color:"var(--surface-600)", marginTop:3 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ marginBottom:"20px", padding:"12px 16px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"10px", color:"var(--danger-400)", fontSize:"14px", display:"flex", alignItems:"center", gap:"8px" }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{ display:"flex", gap:"12px", marginBottom:"20px", flexWrap:"wrap", alignItems:"center", animation:"fadeInUp 0.4s 280ms ease-out both" }}>
        {/* Search */}
        <div style={{ position:"relative", flex:"1 1 260px" }}>
          <span style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", color:"var(--surface-500)", pointerEvents:"none" }}><IconSearch /></span>
          <input placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:"100%", padding:"11px 14px 11px 40px", background:"var(--surface-800)", border:"1.5px solid var(--surface-700)", borderRadius:"10px", color:"var(--surface-100)", fontSize:"14px", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s", fontFamily:"var(--font-family)" }}
            onFocus={e=>{e.target.style.borderColor="var(--primary-500)"; e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,0.12)";}}
            onBlur={e=>{e.target.style.borderColor="var(--surface-700)"; e.target.style.boxShadow="none";}} />
        </div>

        {/* Category filter */}
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)}
          style={{ padding:"11px 36px 11px 14px", background:"var(--surface-800)", border:"1.5px solid var(--surface-700)", borderRadius:"10px", color:filterCat?"var(--surface-100)":"var(--surface-500)", fontSize:"14px", outline:"none", cursor:"pointer", minWidth:"170px", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", fontFamily:"var(--font-family)" }}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Results count */}
        {!loading && (
          <span style={{ fontSize:"13px", color:"var(--surface-500)", whiteSpace:"nowrap", background:"var(--surface-800)", padding:"6px 12px", borderRadius:"8px", border:"1px solid var(--surface-700)" }}>
            {filtered.length} result{filtered.length!==1?"s":""}
          </span>
        )}

        {/* View toggle */}
        <div style={{ display:"flex", background:"var(--surface-800)", border:"1.5px solid var(--surface-700)", borderRadius:"10px", overflow:"hidden", marginLeft:"auto" }}>
          {[{mode:"table",icon:<IconList />},{mode:"grid",icon:<IconGrid />}].map(({mode,icon}) => (
            <button key={mode} onClick={()=>setViewMode(mode)}
              style={{ padding:"10px 16px", background:viewMode===mode?"var(--primary-600)":"transparent", border:"none", color:viewMode===mode?"#fff":"var(--surface-500)", cursor:"pointer", display:"flex", alignItems:"center", transition:"all 0.15s", fontFamily:"var(--font-family)" }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"80px 0", gap:"16px" }}>
          <div style={{ width:"40px", height:"40px", border:"3px solid var(--surface-800)", borderTopColor:"var(--primary-500)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          <p style={{ color:"var(--surface-500)", margin:0, fontSize:"14px" }}>Loading products…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 0", background:"var(--surface-900)", border:"1px solid var(--surface-800)", borderRadius:"16px" }}>
          <div style={{ fontSize:"48px", marginBottom:"16px" }}>📦</div>
          <p style={{ margin:0, fontWeight:600, fontSize:"15px", color:"var(--surface-200)" }}>No products found</p>
          <p style={{ margin:"8px 0 0", fontSize:"13px", color:"var(--surface-500)" }}>Try adjusting your search or filters</p>
        </div>
      ) : viewMode === "grid" ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"16px" }}>
          {filtered.map(p => <ProductCard key={p.id} product={p} catName={catName} onEdit={openEdit} onDelete={setDeleteTarget} />)}
        </div>
      ) : (
        /* ── Table View ── */
        <div style={{ background:"var(--surface-900)", border:"1px solid var(--surface-800)", borderRadius:"16px", overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,0.2)", animation:"fadeInUp 0.4s 320ms ease-out both" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--surface-800)", background:"rgba(255,255,255,0.025)" }}>
                {["#","Product","Category","Price","Stock","Actions"].map((h,i) => (
                  <th key={i} style={{ padding:"13px 18px", textAlign:i===5?"center":"left", fontSize:"11px", fontWeight:700, color:"var(--surface-500)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id} className="pm-row" style={{ borderBottom:"1px solid var(--surface-800)", transition:"background 0.12s" }}>
                  <td style={{ padding:"14px 18px", color:"var(--surface-600)", fontSize:"13px", fontWeight:500 }}>{idx+1}</td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                      <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"16px" }}>🍽</div>
                      <span style={{ fontWeight:600, color:"var(--surface-100)", fontSize:"14px" }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px 18px" }}>
                    <span style={{ padding:"4px 10px", borderRadius:"6px", background:"var(--surface-800)", color:"var(--surface-400)", fontSize:"12px", fontWeight:600, border:"1px solid var(--surface-700)" }}>{catName(p.categoryId)}</span>
                  </td>
                  <td style={{ padding:"14px 18px", fontWeight:800, color:"var(--primary-400)", fontSize:"15px", letterSpacing:"-0.3px" }}>₺{Number(p.price).toFixed(2)}</td>
                  <td style={{ padding:"14px 18px" }}><StockBadge qty={p.stock} /></td>
                  <td style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:"8px", justifyContent:"center" }}>
                      <button className="pm-edit-btn" onClick={()=>openEdit(p)}>
                        <IconEdit /> Edit
                      </button>
                      <button className="pm-delete-btn" onClick={()=>setDeleteTarget(p)}>
                        <IconTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormPanel open={panelOpen} onClose={closePanel} onSubmit={handleSubmit} editingProduct={editingProduct} categories={categories} />
      <DeleteModal product={deleteTarget} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)} />
    </div>
  );
}
