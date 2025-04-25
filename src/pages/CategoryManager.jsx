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
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem", color: "#065f46", textAlign: "center" }}>📂 Gerenciar Categorias</h1>

      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "2rem" }}>
        <button onClick={() => navigate("/produtos")} style={{ ...btnOutline, ...hoverOutline }}>← Voltar para Produtos</button>
      </div>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>Nova Categoria</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nome da nova categoria"
            style={{ ...inputStyle, flex: "1" }}
          />
          <button onClick={handleAddCategory} style={{ ...btnPrimary, ...hoverPrimary }}>➕ Adicionar Categoria</button>
        </div>
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>Categorias</h2>
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {categories.map((cat) => (
            <li key={cat.id} style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {editCategoryId === cat.id ? (
                <>
                  <input
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    style={inputStyle}
                  />
                  <button onClick={handleEditCategory} style={{ ...btnPrimary, ...hoverPrimary }}>Salvar</button>
                  <button onClick={() => setEditCategoryId(null)} style={{ ...btnOutline, ...hoverOutline }}>Cancelar</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1 }}>➡️ {cat.name}</span>
                  <button onClick={() => { setEditCategoryId(cat.id); setEditCategoryName(cat.name); }} style={{ ...btnOutline, ...hoverOutline }}>Editar</button>
                  <button onClick={() => handleDeleteCategory(cat.id)} style={{ ...btnDangerSmall, ...hoverDanger }}>Excluir</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>Nova Subcategoria</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
          <button onClick={handleAddSubcategory} style={{ ...btnPrimary, ...hoverPrimary }}>➕ Adicionar Subcategoria</button>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>Subcategorias</h2>
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {subcategories.map((sub) => (
            <li key={sub.id} style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
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
                  <button onClick={handleEditSubcategory} style={{ ...btnPrimary, ...hoverPrimary }}>Salvar</button>
                  <button onClick={() => setEditSubcategoryId(null)} style={{ ...btnOutline, ...hoverOutline }}>Cancelar</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1 }}>🧩 {sub.name} (Categoria: {categories.find(c => c.id === sub.categoryId)?.name || sub.categoryId})</span>
                  <button onClick={() => {
                    setEditSubcategoryId(sub.id);
                    setEditSubcategoryData({ name: sub.name, categoryId: sub.categoryId.toString() });
                  }} style={{ ...btnOutline, ...hoverOutline }}>Editar</button>
                  <button onClick={() => handleDeleteSubcategory(sub.id)} style={{ ...btnDangerSmall, ...hoverDanger }}>Excluir</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  maxWidth: "400px",
  padding: "0.75rem",
  borderRadius: "0.5rem",
  border: "1px solid #ccc",
  boxSizing: "border-box"
};

const btnPrimary = {
  background: "#059669",
  color: "white",
  padding: "0.5rem 1.25rem",
  borderRadius: "0.5rem",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "background 0.3s"
};

const hoverPrimary = {
  ':hover': {
    backgroundColor: "#047857"
  }
};

const btnOutline = {
  background: "transparent",
  color: "#065f46",
  padding: "0.5rem 1.25rem",
  borderRadius: "0.5rem",
  border: "2px solid #065f46",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "all 0.3s"
};

const hoverOutline = {
  ':hover': {
    backgroundColor: "#065f46",
    color: "white"
  }
};

const btnDangerSmall = {
  background: "#dc2626",
  color: "white",
  padding: "0.5rem 1.25rem",
  borderRadius: "0.5rem",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "background 0.3s"
};

const hoverDanger = {
  ':hover': {
    backgroundColor: "#b91c1c"
  }
};