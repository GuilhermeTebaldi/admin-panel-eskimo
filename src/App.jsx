import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://backend-eskimo.onrender.com/api";

export default function AdminPanel() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    stock: "100",
    categoryId: ""
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [subcategoryId, setSubcategoryId] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setCategories(result.data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const result = await axios.get(`${API_URL}/subcategories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setSubcategories(result.data);
    } catch (error) {
      console.error("Erro ao carregar subcategorias:", error);
    }
  };

  useEffect(() => {
    const filtered = subcategories.filter(
      (s) => s.categoryId === parseInt(form.categoryId)
    );
    setFilteredSubcategories(filtered);
    setSubcategoryId("");
  }, [form.categoryId, subcategories]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      imageUrl: form.imageUrl,
      stock: parseInt(form.stock),
      categoryId: parseInt(form.categoryId),
      subcategoryId: subcategoryId ? parseInt(subcategoryId) : null
    };

    try {
      await axios.post(`${API_URL}/products`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      alert("✅ Produto cadastrado com sucesso!");
      setForm({ name: "", description: "", price: "", imageUrl: "", stock: "100", categoryId: "" });
      setSubcategoryId("");
    } catch (error) {
      console.error("Erro:", error.response?.data || error.message);
      alert("❌ Erro ao salvar produto.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem", animation: "fadeIn 0.8s ease-in-out" }}>
      <div style={{ width: "100%", maxWidth: "1000px", background: "white", borderRadius: "1.5rem", padding: "3rem", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button onClick={handleLogout} style={btnDanger}>🚪 Sair</button>
        </div>

        <h1 style={{ fontSize: "3rem", color: "#065f46", fontWeight: "800", marginBottom: "1.5rem" }}>Eskimó</h1>
        <h2 style={{ fontSize: "2rem", color: "#065f46", fontWeight: "bold", marginBottom: "1rem" }}>Cadastro de Produto</h2>

        <p style={{ fontSize: "1rem", color: "#4b5563", marginBottom: "2rem" }}>Preencha os campos abaixo para adicionar um novo produto.</p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          <Input label="Nome" name="name" value={form.name} onChange={handleChange} />
          <Input label="Descrição" name="description" value={form.description} onChange={handleChange} />
          <Input label="Preço" name="price" value={form.price} onChange={handleChange} />
          <Input label="Imagem (URL)" name="imageUrl" value={form.imageUrl} onChange={handleChange} />
          <Input label="Estoque" name="stock" value={form.stock} onChange={handleChange} />

          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <label style={labelStyle}>Categoria</label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <label style={labelStyle}>Subcategoria</label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecione uma subcategoria</option>
              {filteredSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button type="submit" style={btnPrimary}>Cadastrar Produto</button>
            <button type="button" onClick={() => navigate("/produtos")} style={btnOutline}>📦 Ver Produtos</button>
          </div>
        </form><h1 style={{ 
  fontSize: "1.0rem", 
  color: "#065f46", 
  fontWeight: "bold", 
  marginBottom: "1rem", 
  textAlign: "center" // ✅ adiciona centralização
}}>
  Volpesites 🦊
</h1>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
      <label htmlFor={name} style={labelStyle}>{label}</label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required
        style={inputStyle}
      />
    </div>
  );
}

const labelStyle = { marginBottom: "0.25rem", fontSize: "0.875rem", color: "#374151" };
const inputStyle = { width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", background: "#f9fdfb", color: "#111827", fontSize: "1rem", boxSizing: "border-box" };
const btnPrimary = { background: "#059669", color: "white", padding: "0.75rem", fontWeight: "bold", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "1rem", transition: "background 0.3s" };
const btnDanger = { background: "#dc2626", color: "white", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold" };
const btnOutline = { background: "#f9fafb", color: "#065f46", padding: "0.5rem", fontWeight: "bold", border: "1px solid #d1fae5", borderRadius: "0.5rem", cursor: "pointer", fontSize: "1rem", transition: "all 0.3s" };