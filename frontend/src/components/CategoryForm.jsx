import React, { useEffect, useState } from "react";

const CategoryForm = ({ onSubmit, editingCategory }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
    } else {
      setName("");
    }
  }, [editingCategory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(name);
    setName("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button type="submit">
        {editingCategory ? "Update" : "Add"}
      </button>
    </form>
  );
};

export default CategoryForm;
