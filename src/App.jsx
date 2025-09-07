// App.jsx atualizado para funcionar em sincronia com estoque automático baseado em quantidade
import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";

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
  const [estoques, setEstoques] = useState({ efapi: 1, palmital: 1, passo: 1 });
  
  useEffect(() => {
    const checkSync = async () => {
      const precisaAtualizar = localStorage.getItem("categoriasAtualizadas");
      if (precisaAtualizar === "true") {
        await fetchCategories();
        localStorage.removeItem("categoriasAtualizadas");
      }
    };
    fetchCategories();
    fetchSubcategories();
    checkSync();
  }, []);
  
  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await api.get("/categories");
      setCategories(result.data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const result = await api.get("/subcategories");
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

  const handleEstoqueChange = (store, value) => {
    setEstoques((prev) => ({
      ...prev,
      [store]: parseInt(value) || 0
    }));
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
      const res = await api.post("/products", data);
      const productId = res.data.id;
      await api.post(`/stock/${productId}`, estoques);

      alert("✅ Produto cadastrado com sucesso!");
      setForm({ name: "", description: "", price: "", imageUrl: "", categoryId: "" });
      setSubcategoryId("");
      setEstoques({ efapi: 0, palmital: 0, passo: 0 });
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

          <div className="w-full px-6 py-4">
      <label className="block mb-2 text-lg font-semibold text-gray-700">Estoque por loja:</label>
      <div className="grid grid-cols-3 gap-4">
        {Object.keys(estoques).map((store) => (
          <div key={store} className="flex flex-col">
            <label className="mb-1 text-gray-600">{store.charAt(0).toUpperCase() + store.slice(1)}</label>
            <input
              type="number"
              min="0"
              value={estoques[store]}
              onChange={(e) => handleEstoqueChange(store, e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        ))}
            </div>
          </div>

          <div style={buttonGroupStyle}>
            <button type="submit" style={btnPrimary}>Cadastrar Produto</button>
            <button type="button" onClick={() => navigate("/produtos")} style={btnOutline}>📦 Ver Produtos</button>
            <button type="button" onClick={() => navigate("/estoque")} style={btnOutline}>🏪 Estoque por Loja</button>
            <button type="button" onClick={() => navigate("/pedidos")} style={btnOutline}>✅ Ver Pedidos</button>
            <button type="button" onClick={() => navigate("/configuracoes")} style={btnOutline}>⚙️ Configurações de Entrega</button>
            <button type="button" onClick={() => navigate("/categorias")} style={btnOutline}>⚙️ Categorias </button>
            <button type="button" onClick={() => navigate("/pagamentos")} style={btnOutline}>💳 Pagamentos por Loja</button>

          </div>
        </form>

        <h2
  style={{
    fontSize: "1.2rem",
    color: "#065f46",
    fontWeight: "bold",
    marginTop: "2rem",
  }}
>
  EISTALT{" "}
  <a
    href="https://eistalt.vercel.app/"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: "#059669", // verde elegante
      textDecoration: "none",
      fontWeight: "600",
    }}
    onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
    onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
  >
    https://eistalt.vercel.app/
  </a>
</h2>

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
