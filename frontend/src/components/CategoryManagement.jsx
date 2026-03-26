import React, { useEffect, useState } from "react";
import CategoryForm from "./CategoryForm";
import CategoryTable from "./CategoryTable";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/categories", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.status === 401) throw new Error("Please login again.");
      if (!res.ok) throw new Error(`Failed to load categories (HTTP ${res.status}).`);

      const data = await res.json();
      const mapped = Array.isArray(data?.data)
        ? data.data.map((row) => ({
            id: row.category_id,
            name: row.category_name,
          }))
        : [];

      setCategories(mapped);
    } catch (err) {
      setError(err?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (name) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setError(null);
    try {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Category name cannot be empty.");

      if (editingCategory) {
        const res = await fetch(`http://localhost:5000/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ category_name: trimmed }),
        });
        if (!res.ok) throw new Error(`Update failed (HTTP ${res.status}).`);
        setEditingCategory(null);
      } else {
        const res = await fetch("http://localhost:5000/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ category_name: trimmed }),
        });
        if (!res.ok) throw new Error(`Create failed (HTTP ${res.status}).`);
      }

      await loadCategories();
    } catch (err) {
      setError(err?.message || "Failed to save category.");
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Delete failed (HTTP ${res.status}).`);

      setEditingCategory(null);
      await loadCategories();
    } catch (err) {
      setError(err?.message || "Failed to delete category.");
    }
  };

  return (
    <div>
      <h2>Category Management</h2>

      <CategoryForm onSubmit={handleSubmit} editingCategory={editingCategory} />

      {error ? <div style={{ color: "crimson", marginTop: 12 }}>{error}</div> : null}
      {loading ? <p>Loading...</p> : null}

      <CategoryTable categories={categories} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
};

export default CategoryManagement;
