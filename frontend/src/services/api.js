const BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Custom fetch wrapper to handle 401 errors globally
const customFetch = async (url, options) => {
  const res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Session expired, please login again.');
  }
  return res;
};

// -- Tables API --
export const getTables = async () => {
  const res = await customFetch(`${BASE_URL}/tables`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const getTableById = async (id) => {
  const res = await customFetch(`${BASE_URL}/tables/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const updateTableStatus = async (id, status) => {
  const res = await customFetch(`${BASE_URL}/tables/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// -- Orders API --
export const createOrder = async (orderData) => {
  const res = await customFetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(orderData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const getOrders = async () => {
  const res = await customFetch(`${BASE_URL}/orders`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const getOrderById = async (id) => {
  const res = await customFetch(`${BASE_URL}/orders/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const updateOrderStatus = async (id, status) => {
  const res = await customFetch(`${BASE_URL}/orders/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return res.json();
};

// -- Products & Categories API for POS View --
export const getProducts = async () => {
  const res = await customFetch(`${BASE_URL}/products`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const getCategories = async () => {
  const res = await customFetch(`${BASE_URL}/categories`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};
