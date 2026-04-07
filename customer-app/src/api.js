// api.js — Public API service for customer-app
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function fetchCategories() {
  const res = await fetch(`${BASE}/api/public/categories`);
  if (!res.ok) throw new Error('Failed to load categories');
  const json = await res.json();
  return json.data || [];
}

export async function fetchProducts() {
  const res = await fetch(`${BASE}/api/public/products`);
  if (!res.ok) throw new Error('Failed to load products');
  const json = await res.json();
  return json.data || [];
}

export async function placeOrder(tableId, items) {
  const res = await fetch(`${BASE}/api/public/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table_id: Number(tableId),
      items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to place order');
  return json.data;
}
