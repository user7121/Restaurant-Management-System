import React, { useEffect, useState } from "react";

const API = "http://localhost:5000/api";
const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconFolder = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>
  </svg>
);

// Pastel palette for category chips
const CHIP_COLORS = [
  { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", text: "var(--primary-300)" },
  { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", text: "var(--success-400)" },
  { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", text: "var(--warning-400)" },
  { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)", text: "var(--purple-400)" },
  { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.25)", text: "var(--orange-400)" },
  { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", text: "var(--info-400)" },
];

const DeleteModal = ({ category, onConfirm, onCancel }) => {
  if (!category) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,6,23,0.8)", backdropFilter: "blur(6px)" }}>
      <div style={{ background: "var(--surface-900)", border: "1px solid var(--surface-700)", borderRadius: "16px", padding: "32px", width: "380px", textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "var(--danger-400)" }}>
          <IconTrash />
        </div>
        <h3 style={{ margin: "0 0 8px", color: "var(--surface-50)", fontSize: "18px", fontWeight: 700 }}>Delete Category?</h3>
        <p style={{ margin: "0 0 6px", color: "var(--surface-400)", fontSize: "14px" }}>
          <strong style={{ color: "var(--surface-200)" }}>{category.name}</strong> will be permanently removed.
        </p>
        <p style={{ margin: "0 0 24px", color: "var(--warning-400)", fontSize: "12px", background: "rgba(245,158,11,0.08)", padding: "8px 12px", borderRadius: "8px" }}>
          ⚠ Products in this category may be affected.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", background: "var(--surface-800)", border: "1px solid var(--surface-700)", borderRadius: "10px", color: "var(--surface-300)", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px", background: "var(--danger-600)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
};

// Inline editable row
const CategoryRow = ({ cat, index, onEdit, onDelete, editing, onSave, onCancel }) => {
  const [val, setVal] = useState(cat.name);
  const color = CHIP_COLORS[index % CHIP_COLORS.length];
  const btnBase = { padding: "6px 11px", background: "var(--surface-800)", border: "1px solid var(--surface-700)", borderRadius: "7px", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.12s" };

  useEffect(() => { setVal(cat.name); }, [cat.name]);

  if (editing) {
    return (
      <tr style={{ borderBottom: "1px solid var(--surface-800)", background: "rgba(99,102,241,0.04)" }}>
        <td style={{ padding: "12px 16px", color: "var(--surface-600)", fontSize: "13px" }}>{index + 1}</td>
        <td style={{ padding: "10px 16px" }} colSpan={2}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: color.bg, border: `1px solid ${color.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: color.text, flexShrink: 0 }}>
              <IconFolder />
            </div>
            <input
              autoFocus
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") onSave(val); if (e.key === "Escape") onCancel(); }}
              style={{ flex: 1, padding: "8px 12px", background: "var(--surface-800)", border: "1px solid var(--primary-500)", borderRadius: "8px", color: "var(--surface-100)", fontSize: "14px", outline: "none", boxShadow: "0 0 0 3px rgba(99,102,241,0.12)" }}
            />
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button onClick={() => onSave(val)} style={{ ...btnBase, borderColor: "var(--success-600)", color: "var(--success-400)", background: "rgba(16,185,129,0.08)" }}>
                <IconCheck /> Save
              </button>
              <button onClick={onCancel} style={{ ...btnBase, color: "var(--surface-400)" }}>
                <IconX /> Cancel
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ borderBottom: "1px solid var(--surface-800)", transition: "background 0.12s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(248,250,252,0.02)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <td style={{ padding: "14px 16px", color: "var(--surface-600)", fontSize: "13px" }}>{index + 1}</td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: color.bg, border: `1px solid ${color.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: color.text, flexShrink: 0 }}>
            <IconFolder />
          </div>
          <span style={{ fontWeight: 600, color: "var(--surface-100)", fontSize: "14px" }}>{cat.name}</span>
        </div>
      </td>
      <td style={{ padding: "14px 16px", textAlign: "right" }}>
        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
          <button onClick={() => onEdit(cat)} style={{ ...btnBase, color: "var(--surface-300)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary-500)"; e.currentTarget.style.color = "var(--primary-400)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--surface-700)"; e.currentTarget.style.color = "var(--surface-300)"; }}>
            <IconEdit /> Edit
          </button>
          <button onClick={() => onDelete(cat)} style={{ ...btnBase, color: "var(--surface-300)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--danger-500)"; e.currentTarget.style.color = "var(--danger-400)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--surface-700)"; e.currentTarget.style.color = "var(--surface-300)"; }}>
            <IconTrash /> Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  const loadCategories = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/categories`, { headers: authHeaders() });
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Please login again.");
      }
      if (!res.ok) throw new Error(`Failed to load (HTTP ${res.status}).`);
      const data = await res.json();
      setCategories(Array.isArray(data?.data) ? data.data.map(r => ({ id: r.category_id, name: r.category_name })) : []);
    } catch (e) { setError(e?.message || "Failed to load categories."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const token = localStorage.getItem("token"); if (!token) return;
    setError(null);
    try {
      setAdding(true);
      const res = await fetch(`${API}/categories`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ category_name: trimmed }) });
      if (!res.ok) throw new Error(`Create failed (HTTP ${res.status}).`);
      setNewName(""); await loadCategories();
    } catch (e) { setError(e?.message || "Failed to create."); }
    finally { setAdding(false); }
  };

  const handleUpdate = async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) { setEditingId(null); return; }
    const token = localStorage.getItem("token"); if (!token) return;
    setError(null);
    try {
      const res = await fetch(`${API}/categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ category_name: trimmed }) });
      if (!res.ok) throw new Error(`Update failed (HTTP ${res.status}).`);
      setEditingId(null); await loadCategories();
    } catch (e) { setError(e?.message || "Failed to update."); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = localStorage.getItem("token"); if (!token) return;
    setError(null);
    try {
      const res = await fetch(`${API}/categories/${deleteTarget.id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error(`Delete failed (HTTP ${res.status}).`);
      setDeleteTarget(null); await loadCategories();
    } catch (e) { setError(e?.message || "Failed to delete."); }
  };

  const filtered = categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: "100%", color: "var(--surface-100)", fontFamily: "var(--font-family)" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "var(--surface-50)", letterSpacing: "-0.5px" }}>Categories</h1>
        <p style={{ margin: "6px 0 0", color: "var(--surface-400)", fontSize: "14px" }}>
          {loading ? "Loading…" : `${categories.length} categor${categories.length !== 1 ? "ies" : "y"} configured`}
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: "20px", padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", color: "var(--danger-400)", fontSize: "14px" }}>
          ⚠ {error}
        </div>
      )}

      {/* Add new category card */}
      <div style={{ background: "var(--surface-900)", border: "1px solid var(--surface-800)", borderRadius: "14px", padding: "20px 24px", marginBottom: "20px" }}>
        <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 600, color: "var(--surface-400)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Add New Category</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            placeholder="Category name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            style={{ flex: 1, padding: "11px 14px", background: "var(--surface-800)", border: "1px solid var(--surface-700)", borderRadius: "10px", color: "var(--surface-100)", fontSize: "14px", outline: "none" }}
            onFocus={e => { e.target.style.borderColor = "var(--primary-500)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--surface-700)"; e.target.style.boxShadow = "none"; }}
          />
          <button onClick={handleAdd} disabled={adding || !newName.trim()} style={{ padding: "11px 20px", background: "var(--primary-600)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: adding || !newName.trim() ? "not-allowed" : "pointer", opacity: adding || !newName.trim() ? 0.6 : 1, display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}
            onMouseEnter={e => { if (!adding && newName.trim()) e.currentTarget.style.background = "var(--primary-500)"; }}
            onMouseLeave={e => e.currentTarget.style.background = "var(--primary-600)"}>
            <IconPlus /> {adding ? "Adding…" : "Add Category"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "var(--surface-500)", pointerEvents: "none" }}><IconSearch /></span>
        <input placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "11px 14px 11px 40px", background: "var(--surface-800)", border: "1px solid var(--surface-700)", borderRadius: "10px", color: "var(--surface-100)", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = "var(--primary-500)"}
          onBlur={e => e.target.style.borderColor = "var(--surface-700)"} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", gap: "16px" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--surface-700)", borderTopColor: "var(--primary-500)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "var(--surface-500)", margin: 0 }}>Loading categories…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--surface-500)", background: "var(--surface-900)", border: "1px solid var(--surface-800)", borderRadius: "14px" }}>
          <p style={{ margin: 0, fontWeight: 500 }}>No categories found</p>
          <p style={{ margin: "6px 0 0", fontSize: "14px" }}>{search ? "Try a different search term" : "Add your first category above"}</p>
        </div>
      ) : (
        <div style={{ background: "var(--surface-900)", border: "1px solid var(--surface-800)", borderRadius: "14px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--surface-800)" }}>
                {["#", "Category Name", ""].map((h, i) => (
                  <th key={i} style={{ padding: "13px 16px", textAlign: i === 2 ? "right" : "left", fontSize: "11px", fontWeight: 600, color: "var(--surface-500)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat, idx) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  index={idx}
                  editing={editingId === cat.id}
                  onEdit={c => setEditingId(c.id)}
                  onDelete={c => setDeleteTarget(c)}
                  onSave={val => handleUpdate(cat.id, val)}
                  onCancel={() => setEditingId(null)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteModal category={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default CategoryManagement;
