import React, { useEffect, useState } from "react";

const ProductForm = ({ onSubmit, editingProduct, categories }) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    categoryId: "",
    description: "",
    stock: "",
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData(editingProduct);
    } else {
      setFormData({
        name: "",
        price: "",
        categoryId: "",
        description: "",
        stock: "",
      });
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
      <h3>{editingProduct ? "Edit Product" : "Add Product"}</h3>

      {/* Name */}
      <input
        type="text"
        name="name"
        placeholder="Product Name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      {/* Price */}
      <input
        type="number"
        name="price"
        placeholder="Price"
        value={formData.price}
        onChange={handleChange}
        required
      />

      {/* Category Dropdown */}
      <select
        name="categoryId"
        value={formData.categoryId}
        onChange={handleChange}
        required
      >
        <option value="">Select Category</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Description */}
      <input
        type="text"
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
      />

      {/* Stock */}
      <input
        type="number"
        name="stock"
        placeholder="Stock"
        value={formData.stock}
        onChange={handleChange}
      />

      <button type="submit">
        {editingProduct ? "Update" : "Add"}
      </button>
    </form>
  );
};

export default ProductForm;
