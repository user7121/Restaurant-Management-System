import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCategories, fetchProducts } from '../api.js';
import CartDrawer from '../components/CartDrawer.jsx';
import ProductCard from '../components/ProductCard.jsx';
import SuccessScreen from '../components/SuccessScreen.jsx';

/* ── Category emoji map ─────────────────────────────────── */
const CATEGORY_EMOJIS = {
  default: '🍽️', burger: '🍔', pizza: '🍕', drinks: '🥤', beverage: '🥤',
  coffee: '☕', dessert: '🍰', salad: '🥗', soup: '🍲', pasta: '🍝',
  sushi: '🍱', chicken: '🍗', steak: '🥩', seafood: '🦐', sandwich: '🥪',
  breakfast: '🍳', snack: '🍟', alcohol: '🍺', wine: '🍷', cocktail: '🍹',
};
function getCategoryEmoji(name = '') {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_EMOJIS)) {
    if (lower.includes(key)) return val;
  }
  return CATEGORY_EMOJIS.default;
}

/* ── Product emoji map — corrected per requirements ──────── */
// Keys are lowercased product name substrings → emoji
const PRODUCT_NAME_EMOJIS = {
  americano: '☕',
  latte:     '☕',
  cappuccino:'☕',
  espresso:  '☕',
  coffee:    '☕',
  cheesecake:'🍰',
  cake:      '🍰',
};

const PRODUCT_EMOJIS_FALLBACK = ['🍔','🍕','🥗','🍝','🍜','🍱','🥩','🍗','🥪','🍣','🍲','🌮','🥙','🧆','🥓','🍟'];

function getProductEmoji(product) {
  const nameLower = (product.name || '').toLowerCase();
  for (const [key, emoji] of Object.entries(PRODUCT_NAME_EMOJIS)) {
    if (nameLower.includes(key)) return emoji;
  }
  return PRODUCT_EMOJIS_FALLBACK[(product.product_id - 1) % PRODUCT_EMOJIS_FALLBACK.length];
}

/* ── Theme management ────────────────────────────────────── */
function getInitialTheme() {
  try {
    return localStorage.getItem('rms-theme') || 'dark';
  } catch {
    return 'dark';
  }
}

export default function MenuPage() {
  const { tableId } = useParams();

  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const [cart, setCart]             = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast]           = useState(null);
  const [orderResult, setOrderResult] = useState(null);

  // Theme state
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('rms-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  /* ── Load data ─────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [cats, prods] = await Promise.all([fetchCategories(), fetchProducts()]);
      setCategories(cats);
      setProducts(prods);
      if (cats.length > 0) setActiveCategory(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Cart helpers ──────────────────────────────────────── */
  function getQty(productId) {
    return cart.find((i) => i.product_id === productId)?.quantity || 0;
  }

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.product_id);
      if (existing) return prev.map((i) => i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id: product.product_id, name: product.name, price: parseFloat(product.price), quantity: 1, emoji: getProductEmoji(product) }];
    });
    showToast(`${product.name} added ✓`);
  }

  function setQty(productId, qty) {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.product_id !== productId));
    else setCart((prev) => prev.map((i) => i.product_id === productId ? { ...i, quantity: qty } : i));
  }

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  /* ── Toast ─────────────────────────────────────────────── */
  function showToast(msg, type = '') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  }

  /* ── Filtered products ─────────────────────────────────── */
  const displayedProducts = activeCategory
    ? products.filter((p) => p.category_id === activeCategory)
    : products;

  function groupByCategory(prods) {
    const map = {};
    for (const p of prods) {
      const cat = categories.find((c) => c.category_id === p.category_id);
      const key = cat ? cat.name : 'Other';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }

  if (orderResult) {
    return <SuccessScreen result={orderResult} tableId={tableId} cart={cart} onNewOrder={() => { setOrderResult(null); setCart([]); }} />;
  }

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="top-header">
        <div className="header-brand">
          <div className="header-logo">🍽️</div>
          <div className="header-info">
            <h1>Our Menu</h1>
            <span>Table {tableId}</span>
          </div>
        </div>
        <div className="header-controls">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            id="cart-open-btn"
            className={`cart-btn${totalItems > 0 ? ' has-items' : ''}`}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open cart"
          >
            🛒
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        </div>
      </header>

      {/* ── Category tabs ── */}
      {!loading && !error && (
        <div className="category-tabs-wrapper">
          <div className="category-tabs" role="tablist">
            <button
              id="cat-tab-all"
              className={`cat-tab${activeCategory === null ? ' active' : ''}`}
              onClick={() => setActiveCategory(null)}
              role="tab"
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                id={`cat-tab-${cat.category_id}`}
                className={`cat-tab${activeCategory === cat.category_id ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat.category_id)}
                role="tab"
              >
                {getCategoryEmoji(cat.name)} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="menu-content">
        {loading && <SkeletonGrid />}
        {error && (
          <div className="error-state">
            <div className="icon">⚠️</div>
            <h2>Couldn't load menu</h2>
            <p>{error}</p>
            <button className="retry-btn" onClick={load}>Try Again</button>
          </div>
        )}
        {!loading && !error && (
          activeCategory === null ? (
            Object.entries(groupByCategory(displayedProducts)).map(([catName, prods]) => (
              <div key={catName}>
                <p className="section-title">{catName}</p>
                <div className="product-grid">
                  {prods.map((p) => (
                    <ProductCard
                      key={p.product_id}
                      product={p}
                      emoji={getProductEmoji(p)}
                      qty={getQty(p.product_id)}
                      onAdd={() => addToCart(p)}
                      onChangeQty={(qty) => setQty(p.product_id, qty)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="product-grid">
              {displayedProducts.map((p) => (
                <ProductCard
                  key={p.product_id}
                  product={p}
                  emoji={getProductEmoji(p)}
                  qty={getQty(p.product_id)}
                  onAdd={() => addToCart(p)}
                  onChangeQty={(qty) => setQty(p.product_id, qty)}
                />
              ))}
            </div>
          )
        )}
      </main>

      {/* ── Cart Drawer ── */}
      {drawerOpen && (
        <CartDrawer
          cart={cart}
          total={totalPrice}
          tableId={tableId}
          onClose={() => setDrawerOpen(false)}
          onChangeQty={setQty}
          onOrderSuccess={(result) => { setDrawerOpen(false); setOrderResult(result); }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* ── Toast ── */}
      {toast && <div className={`toast${toast.type ? ` ${toast.type}` : ''}`}>{toast.msg}</div>}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="product-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ height: 110 }} />
          <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '85%' }} />
            <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '55%' }} />
            <div className="skeleton" style={{ height: 20, borderRadius: 6, width: '45%', marginTop: 4 }} />
            <div className="skeleton" style={{ height: 32, borderRadius: 8, marginTop: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
