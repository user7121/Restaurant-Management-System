import React, { useState } from "react";
import CategoryForm from "./CategoryForm";
import CategoryTable from "./CategoryTable";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([
    { id: 1, name: "Drinks" },
    { id: 2, name: "Desserts" },
  ]);

  const [editingCategory, setEditingCategory] = useState(null);

  // Add or Update
  const handleSubmit = (name) => {
    if (editingCategory) {
      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id ? { ...cat, name } : cat
        )
      );
      setEditingCategory(null);
    } else {
      setCategories([
        ...categories,
        { id: Date.now(), name },
      ]);
    }
  };

  // Edit
  const handleEdit = (category) => {
    setEditingCategory(category);
  };

  // Delete
  const handleDelete = (id) => {
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  return (
    <div>
      <h2>Category Management</h2>

      <CategoryForm
        onSubmit={handleSubmit}
        editingCategory={editingCategory}
      />

      <CategoryTable
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default CategoryManagement;
