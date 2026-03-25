import React, { useState } from "react";
import ProductForm from "./ProductForm";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  // Mock categories (later from backend)
  const [categories] = useState([
    { id: 1, name: "Drinks" },
    { id: 2, name: "Desserts" },
  ]);

  const handleSubmit = (product) => {
    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? { ...product, id: p.id } : p
        )
      );
      setEditingProduct(null);
    } else {
      setProducts([
        ...products,
        { ...product, id: Date.now() },
      ]);
    }
  };

  return (
    <div>
      <h2>Product Management</h2>

      <ProductForm
        onSubmit={handleSubmit}
        editingProduct={editingProduct}
        categories={categories}
      />
    </div>
  );
};

export default ProductManagement;
