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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchCategories();
        await fetchSubcategories();
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchCategories = async () => {
    const response = await axios.get(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setCategories(response.data);
  };

  const fetchSubcategories = async () => {
    const response = await axios.get(`${API_URL}/subcategories`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setSubcategories(response.data);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    await axios.post(`${API_URL}/categories`, { name: newCategory }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setNewCategory("");
    fetchCategories();
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategory.name || !newSubcategory.categoryId) return;
    await axios.post(`${API_URL}/subcategories`, {
      name: newSubcategory.name,
      categoryId: parseInt(newSubcategory.categoryId),
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setNewSubcategory({ name: "", categoryId: "" });
    fetchSubcategories();
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Deseja excluir esta categoria?")) return;
    await axios.delete(`${API_URL}/categories/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    fetchCategories();
  };

  const handleDeleteSubcategory = async (id) => {
    if (!window.confirm("Deseja excluir esta subcategoria?")) return;
    await axios.delete(`${API_URL}/subcategories/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    fetchSubcategories();
  };

  const handleEditCategory = async () => {
    await axios.put(`${API_URL}/categories/${editCategoryId}`, { name: editCategoryName }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setEditCategoryId(null);
    setEditCategoryName("");
    fetchCategories();
  };

  const handleEditSubcategory = async () => {
    await axios.put(`${API_URL}/subcategories/${editSubcategoryId}`, {
      name: editSubcategoryData.name,
      categoryId: parseInt(editSubcategoryData.categoryId),
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setEditSubcategoryId(null);
    setEditSubcategoryData({ name: "", categoryId: "" });
    fetchSubcategories();
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "1.5rem", color: "#059669" }}>
        🔄 Carregando categorias...
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={titleStyle}>📂 Gerenciar Categorias</h1>

      <button onClick={() => navigate("/produtos")} style={btnOutline}>← Voltar para Produtos</button>

      <Section title="Nova Categoria">
        <div style={rowStyle}>
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nome da nova categoria"
            style={{ ...inputStyle, flex: "1" }}
          />
          <button onClick={handleAddCategory} style={btnPrimary}>➕ Adicionar Categoria</button>
        </div>
      </Section>

      <Section title="Categorias">
        <ul style={listStyle}>
          {categories.map((cat) => (
            <ListItem
              key={cat.id}
              isEditing={editCategoryId === cat.id}
              name={cat.name}
              onEdit={() => { setEditCategoryId(cat.id); setEditCategoryName(cat.name); }}
              onDelete={() => handleDeleteCategory(cat.id)}
              editValue={editCategoryName}
              setEditValue={setEditCategoryName}
              onSave={handleEditCategory}
              onCancel={() => setEditCategoryId(null)}
            />
          ))}
        </ul>
      </Section>

      <Section title="Nova Subcategoria">
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
          <button onClick={handleAddSubcategory} style={btnPrimary}>➕ Adicionar Subcategoria</button>
        </div>
      </Section>

      <Section title="Subcategorias">
        <ul style={listStyle}>
          {subcategories.map((sub) => (
            <ListItem
              key={sub.id}
              isEditing={editSubcategoryId === sub.id}
              name={`${sub.name} (Categoria: ${categories.find(c => c.id === sub.categoryId)?.name || sub.categoryId})`}
              onEdit={() => {
                setEditSubcategoryId(sub.id);
                setEditSubcategoryData({ name: sub.name, categoryId: sub.categoryId.toString() });
              }}
              onDelete={() => handleDeleteSubcategory(sub.id)}
              editValue={editSubcategoryData.name}
              setEditValue={(v) => setEditSubcategoryData({ ...editSubcategoryData, name: v })}
              onSave={handleEditSubcategory}
              onCancel={() => setEditSubcategoryId(null)}
            />
          ))}
        </ul>
      </Section>

      <h1 style={footerStyle}>Volpesites 🦊</h1>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: "3rem" }}>
      <h2 style={subtitleStyle}>{title}</h2>
      {children}
    </section>
  );
}

function ListItem({ isEditing, name, onEdit, onDelete, editValue, setEditValue, onSave, onCancel }) {
  return (
    <li style={itemStyle}>
      {isEditing ? (
        <>
          <input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={inputStyle} />
          <button onClick={onSave} style={btnPrimary}>Salvar</button>
          <button onClick={onCancel} style={{ ...btnOutline, color: "#dc2626" }}>Cancelar</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1 }}>{name}</span>
          <button onClick={onEdit} style={btnOutline}>Editar</button>
          <button onClick={onDelete} style={btnDangerSmall}>Excluir</button>
        </>
      )}
    </li>
  );
}

const titleStyle = { fontSize: "2.5rem", marginBottom: "2rem", color: "#065f46", textAlign: "center" };
const subtitleStyle = { fontSize: "1.75rem", marginBottom: "1rem", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" };
const footerStyle = { fontSize: "1rem", color: "#065f46", fontWeight: "bold", marginTop: "3rem", textAlign: "center" };
const rowStyle = { display: "flex", gap: "1rem", flexWrap: "wrap" };
const listStyle = { listStyle: "none", paddingLeft: 0 };
const itemStyle = { marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" };
const inputStyle = { width: "100%", maxWidth: "400px", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #ccc", boxSizing: "border-box" };
const btnPrimary = { background: "#059669", color: "white", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold", transition: "background 0.3s" };
const btnOutline = { background: "transparent", color: "#065f46", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "2px solid #065f46", cursor: "pointer", fontWeight: "bold", transition: "all 0.3s" };
const btnDangerSmall = { background: "#dc2626", color: "white", padding: "0.5rem 1.25rem", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "bold" };
