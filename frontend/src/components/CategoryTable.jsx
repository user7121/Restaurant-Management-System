import React from "react";

const CategoryTable = ({ categories, onEdit, onDelete }) => {
  return (
    <table border="1" cellPadding="10" width="100%">
      <thead>
        <tr>
          <th>ID</th>
          <th>Category Name</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {categories.map((cat) => (
          <tr key={cat.id}>
            <td>{cat.id}</td>
            <td>{cat.name}</td>
            <td>
              <button onClick={() => onEdit(cat)}>Edit</button>
              <button onClick={() => onDelete(cat.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CategoryTable;
