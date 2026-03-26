import React, { useEffect, useState } from "react";
import ProductForm from "./ProductForm";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [catRes, prodRes] = await Promise.all([
        fetch("http://localhost:5000/api/categories", { headers }),
        fetch("http://localhost:5000/api/products", { headers }),
      ]);

      if (catRes.status === 401 || prodRes.status === 401) {
        throw new Error("Please login again.");
      }
      if (!catRes.ok) throw new Error(`Failed to load categories (HTTP ${catRes.status}).`);
      if (!prodRes.ok) throw new Error(`Failed to load products (HTTP ${prodRes.status}).`);

      const catData = await catRes.json();
      const prodData = await prodRes.json();

      const mappedCategories = Array.isArray(catData?.data)
        ? catData.data.map((row) => ({ id: row.category_id, name: row.category_name }))
        : [];
      setCategories(mappedCategories);

      const mappedProducts = Array.isArray(prodData?.data)
        ? prodData.data.map((row) => ({
            id: row.product_id,
            name: row.name,
            price: row.price,
            categoryId: row.category_id,
            description: "",
            stock: row.stock_quantity,
          }))
        : [];

      setProducts(mappedProducts);
    } catch (err) {
      setError(err?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const categoryNameById = (id) => {
    const found = categories.find((c) => Number(c.id) === Number(id));
    return found ? found.name : "-";
  };

  const handleSubmit = async (product) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setError(null);

    try {
      const payload = {
        category_id: Number(product.categoryId),
        name: (product.name || "").trim(),
        price: Number(product.price),
        stock_quantity: Number(product.stock),
      };

      if (editingProduct) {
        const res = await fetch(`http://localhost:5000/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Update failed (HTTP ${res.status}).`);
        setEditingProduct(null);
      } else {
        const res = await fetch("http://localhost:5000/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Create failed (HTTP ${res.status}).`);
      }

      await loadAll();
    } catch (err) {
      setError(err?.message || "Failed to save product.");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Delete failed (HTTP ${res.status}).`);

      if (editingProduct && editingProduct.id === id) setEditingProduct(null);
      await loadAll();
    } catch (err) {
      setError(err?.message || "Failed to delete product.");
    }
  };

  return (
    <div>
      <h2>Product Management</h2>

      <ProductForm onSubmit={handleSubmit} editingProduct={editingProduct} categories={categories} />

      {error ? <div style={{ color: "crimson", marginTop: 12 }}>{error}</div> : null}
      {loading ? <p>Loading...</p> : null}

      {!loading ? (
        <table border="1" cellPadding="10" width="100%" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{categoryNameById(p.categoryId)}</td>
                <td>{p.price}</td>
                <td>{p.stock}</td>
                <td>
                  <button onClick={() => handleEdit(p)} style={{ marginRight: 8 }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
};

export default ProductManagement;
