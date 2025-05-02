// admin-panel/src/App.jsx
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
    categoryId: ""
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [subcategoryId, setSubcategoryId] = useState("");
  const [visibleStores, setVisibleStores] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await axios.get(`${API_URL}/categories`, auth());
      setCategories(result.data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const result = await axios.get(`${API_URL}/subcategories`, auth());
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

  const handleStoreToggle = (store) => {
    setVisibleStores((prev) =>
      prev.includes(store)
        ? prev.filter((s) => s !== store)
        : [...prev, store]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      imageUrl: form.imageUrl,
      categoryId: parseInt(form.categoryId),
      subcategoryId: subcategoryId ? parseInt(subcategoryId) : null
    };

    try {
      const res = await axios.post(`${API_URL}/products`, data, auth());
      const productId = res.data.id;

      await axios.post(`${API_URL}/products/${productId}/visibility`, visibleStores, auth());

      alert("✅ Produto cadastrado com sucesso!");
      setForm({ name: "", description: "", price: "", imageUrl: "", categoryId: "" });
      setSubcategoryId("");
      setVisibleStores([]);
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
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button onClick={handleLogout} style={btnDanger}>🚪 Sair</button>
        </div>

        <h1 style={titleStyle}>Eskimó</h1>
        <h2 style={subtitleStyle}>Cadastro de Produto</h2>
        <p style={textStyle}>Preencha os campos abaixo para adicionar um novo produto.</p>

        <form onSubmit={handleSubmit} style={formGridStyle}>
          <Input label="Nome" name="name" value={form.name} onChange={handleChange} />
          <Input label="Descrição" name="description" value={form.description} onChange={handleChange} />
          <Input label="Preço" name="price" value={form.price} onChange={handleChange} />
          <Input label="Imagem (URL)" name="imageUrl" value={form.imageUrl} onChange={handleChange} />

          <Dropdown label="Categoria" name="categoryId" value={form.categoryId} onChange={handleChange} options={categories} />
          <Dropdown label="Subcategoria" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} options={filteredSubcategories} />

          <div style={{ gridColumn: "span 2", textAlign: "left" }}>
            <label style={{ ...labelStyle, marginBottom: "0.5rem" }}>Exibir nas unidades:</label>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {["efapi", "palmital", "passo"].map((store) => (
                <label key={store} style={{ fontSize: "1rem", color: "#374151" }}>
                  <input
                    type="checkbox"
                    checked={visibleStores.includes(store)}
                    onChange={() => handleStoreToggle(store)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  {store.charAt(0).toUpperCase() + store.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div style={buttonGroupStyle}>
            <button type="submit" style={btnPrimary}>Cadastrar Produto</button>
            <button type="button" onClick={() => navigate("/produtos")} style={btnOutline}>📦 Ver Produtos</button>
            <button type="button" onClick={() => navigate("/pedidos")} style={btnOutline}>✅ Ver Pedidos</button>
            <button type="button" onClick={() => navigate("/configuracoes")} style={btnOutline}>⚙️ Configurações de Entrega</button>
            <button type="button" onClick={() => navigate("/estoque")} style={btnOutline}>🏪 Estoque por Loja</button>
          </div>
        </form>

        <h1 style={{ fontSize: "1.0rem", color: "#065f46", fontWeight: "bold", textAlign: "center" }}>Volpesites 🦊</h1>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
      <label htmlFor={name} style={labelStyle}>{label}</label>
      <input id={name} name={name} value={value} onChange={onChange} required style={inputStyle} />
    </div>
  );
}

function Dropdown({ label, name, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
      <label style={labelStyle}>{label}</label>
      <select name={name} value={value} onChange={onChange} style={inputStyle} required>
        <option value="">Selecione...</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
    </div>
  );
}

const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

const containerStyle = {
  minHeight: "100vh", background: "#f0fdf4", display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem", animation: "fadeIn 0.8s ease-in-out"
};

const cardStyle = {
  width: "100%", maxWidth: "1000px", background: "white", borderRadius: "1.5rem", padding: "3rem", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", textAlign: "center"
};

const formGridStyle = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem"
};

const titleStyle = {
  fontSize: "3rem", color: "#065f46", fontWeight: "800", marginBottom: "1.5rem"
};

const subtitleStyle = {
  fontSize: "2rem", color: "#065f46", fontWeight: "bold", marginBottom: "1rem"
};

const textStyle = {
  fontSize: "1rem", color: "#4b5563", marginBottom: "2rem"
};

const buttonGroupStyle = {
  gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "0.75rem"
};

const labelStyle = {
  marginBottom: "0.25rem", fontSize: "0.875rem", color: "#374151"
};

const inputStyle = {
  width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #cbd5e1", background: "#f9fdfb", color: "#111827", fontSize: "1rem", boxSizing: "border-box", outline: "none", transition: "border-color 0.3s ease"
};

const btnPrimary = {
  background: "#059669", color: "white", padding: "0.75rem 1.5rem", fontWeight: "bold", border: "none", borderRadius: "0.75rem", cursor: "pointer", fontSize: "1rem", transition: "background-color 0.3s ease"
};

const btnDanger = {
  background: "#dc2626", color: "white", padding: "0.5rem 1.25rem", borderRadius: "0.75rem", border: "none", cursor: "pointer", fontWeight: "bold", transition: "background-color 0.3s ease"
};

const btnOutline = {
  background: "transparent", color: "#065f46", padding: "0.75rem 1.5rem", fontWeight: "bold", border: "2px solid #065f46", borderRadius: "0.75rem", cursor: "pointer", fontSize: "1rem", transition: "all 0.3s ease"
};
