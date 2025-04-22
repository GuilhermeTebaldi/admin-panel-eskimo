import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://backend-eskimo.onrender.com/api/categories";

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchCategories = async () => {
    const res = await axios.get(API_URL);
    setCategories(res.data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API_URL}/${editingId}`, { name });
    } else {
      await axios.post(API_URL, { name });
    }
    setName("");
    setEditingId(null);
    fetchCategories();
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
    fetchCategories();
  };

  const handleEdit = (cat) => {
    setName(cat.name);
    setEditingId(cat.id);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ fontSize: "2rem", fontWeight: "bold" }}>📂 Categorias</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nova categoria"
          required
          style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ marginLeft: "0.5rem", padding: "0.5rem 1rem" }}>
          {editingId ? "Atualizar" : "Cadastrar"}
        </button>
      </form>

      <ul>
        {categories.map((cat) => (
          <li key={cat.id} style={{ marginBottom: "0.5rem" }}>
            {cat.name}{" "}
            <button onClick={() => handleEdit(cat)}>✏️</button>{" "}
            <button onClick={() => handleDelete(cat.id)}>🗑</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
