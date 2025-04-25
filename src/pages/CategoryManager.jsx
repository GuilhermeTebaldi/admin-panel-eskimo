// admin-panel/src/pages/CategoryManager.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://backend-eskimo.onrender.com/api";

export default function CategoryManager() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState({ name: "", categoryId: "" });
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editSubcategoryId, setEditSubcategoryId] = useState(null);
  const [editSubcategoryData, setEditSubcategoryData] = useState({ name: "", categoryId: "" });

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/subcategories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setSubcategories(response.data);
    } catch (err) {
      console.error("Erro ao carregar subcategorias:", err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await axios.post(`${API_URL}/categories`, { name: newCategory }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setNewCategory("");
      fetchCategories();
    } catch (err) {
      console.error("Erro ao adicionar categoria:", err);
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategory.name || !newSubcategory.categoryId) return;
    try {
      await axios.post(`${API_URL}/subcategories`, {
        name: newSubcategory.name,
        categoryId: parseInt(newSubcategory.categoryId)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setNewSubcategory({ name: "", categoryId: "" });
      fetchSubcategories();
    } catch (err) {
      console.error("Erro ao adicionar subcategoria:", err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Deseja excluir esta categoria?")) return;
    try {
      await axios.delete(`${API_URL}/categories/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchCategories();
    } catch (err) {
      console.error("Erro ao excluir categoria:", err);
    }
  };

  const handleDeleteSubcategory = async (id) => {
    if (!window.confirm("Deseja excluir esta subcategoria?")) return;
    try {
      await axios.delete(`${API_URL}/subcategories/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchSubcategories();
    } catch (err) {
      console.error("Erro ao excluir subcategoria:", err);
    }
  };

  const handleEditCategory = async () => {
    try {
      await axios.put(`${API_URL}/categories/${editCategoryId}`, { name: editCategoryName }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchCategories();
      setEditCategoryId(null);
      setEditCategoryName("");
    } catch (err) {
      console.error("Erro ao editar categoria:", err);
    }
  };

  const handleEditSubcategory = async () => {
    try {
      await axios.put(`${API_URL}/subcategories/${editSubcategoryId}`, {
        name: editSubcategoryData.name,
        categoryId: parseInt(editSubcategoryData.categoryId)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchSubcategories();
      setEditSubcategoryId(null);
      setEditSubcategoryData({ name: "", categoryId: "" });
    } catch (err) {
      console.error("Erro ao editar subcategoria:", err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#065f46" }}>📂 Gerenciar Categorias</h1>

      <button onClick={() => navigate("/produtos")} style={{ marginBottom: "1.5rem", ...btnOutline }}>← Voltar para Produtos</button>

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Nova Categoria</h2>
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Nome da nova categoria"
          style={inputStyle}
        />
        <button onClick={handleAddCategory} style={btnPrimary}>➕ Adicionar Categoria</button>
      </div>

      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Categorias</h2>
      <ul style={{ marginBottom: "2rem" }}>
        {categories.map((cat) => (
          <li key={cat.id} style={{ marginBottom: "0.5rem" }}>
            {editCategoryId === cat.id ? (
              <>
                <input
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  style={inputStyle}
                />
                <button onClick={handleEditCategory} style={btnPrimary}>Salvar</button>
                <button onClick={() => setEditCategoryId(null)} style={btnOutline}>Cancelar</button>
              </>
            ) : (
              <>
                ➡️ {cat.name} &nbsp;
                <button onClick={() => { setEditCategoryId(cat.id); setEditCategoryName(cat.name); }} style={btnOutline}>Editar</button> &nbsp;
                <button onClick={() => handleDeleteCategory(cat.id)} style={btnDangerSmall}>Excluir</button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Nova Subcategoria</h2>
        <input
          value={newSubcategory.name}
          onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
          placeholder="Nome da subcategoria"
          style={inputStyle}
        />
        <select
          value={newSubcategory.categoryId}
          onChange={(e) => setNewSubcategory({ ...newSubcategory, categoryId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Selecione a categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button onClick={handleAddSubcategory} style={btnPrimary}>➕ Adicionar Subcategoria</button>
      </div>

      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Subcategorias</h2>
      <ul>
        {subcategories.map((sub) => (
          <li key={sub.id} style={{ marginBottom: "0.5rem" }}>
            {editSubcategoryId === sub.id ? (
              <>
                <input
                  value={editSubcategoryData.name}
                  onChange={(e) => setEditSubcategoryData({ ...editSubcategoryData, name: e.target.value })}
                  style={inputStyle}
                />
                <select
                  value={editSubcategoryData.categoryId}
                  onChange={(e) => setEditSubcategoryData({ ...editSubcategoryData, categoryId: e.target.value })}
                  style={inputStyle}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button onClick={handleEditSubcategory} style={btnPrimary}>Salvar</button>
                <button onClick={() => setEditSubcategoryId(null)} style={btnOutline}>Cancelar</button>
              </>
            ) : (
              <>
                🧩 {sub.name} (Categoria: {categories.find(c => c.id === sub.categoryId)?.name || sub.categoryId}) &nbsp;
                <button onClick={() => {
                  setEditSubcategoryId(sub.id);
                  setEditSubcategoryData({ name: sub.name, categoryId: sub.categoryId.toString() });
                }} style={btnOutline}>Editar</button> &nbsp;
                <button onClick={() => handleDeleteSubcategory(sub.id)} style={btnDangerSmall}>Excluir</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  maxWidth: "400px",
  padding: "0.5rem",
  marginBottom: "0.5rem",
  borderRadius: "0.5rem",
  border: "1px solid #ccc",
  boxSizing: "border-box"
};

const btnPrimary = {
  background: "#059669",
  color: "white",
  padding: "0.5rem 1rem",
  marginTop: "0.5rem",
  borderRadius: "0.5rem",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold"
};

const btnOutline = {
  background: "transparent",
  color: "#065f46",
  padding: "0.25rem 0.75rem",
  borderRadius: "0.5rem",
  border: "1px solid #065f46",
  cursor: "pointer",
  fontWeight: "bold"
};

const btnDangerSmall = {
  background: "#dc2626",
  color: "white",
  padding: "0.25rem 0.75rem",
  borderRadius: "0.5rem",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold"
};
