/* eslint-disable react-hooks/rules-of-hooks */
// App.jsx — cadastro com estoque por loja e gate admin
import React, { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";

function decodeJwt(token) {
  try {
    const part = (token.split(".")[1] || "");
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}

function getDisplayName() {
  const cached = localStorage.getItem("username");
  if (cached && cached.trim()) return cached.trim();

  const token = localStorage.getItem("token") || "";
  const payload = decodeJwt(token);

  const name =
    payload.name ||
    payload.unique_name ||
    payload.username ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    "";

  const email =
    payload.email ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
    "";

  const chosen = String(name || email || "").trim();
  if (chosen) localStorage.setItem("username", chosen);
  return chosen || "Usuário";
}

export default function AdminPanel() {
  const navigate = useNavigate();

  // gate admin
  const role = localStorage.getItem("role");
  if (role !== "admin") return <div className="p-8">Acesso restrito ao administrador.</div>;

   
  const displayName = useMemo(() => getDisplayName(), []);

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
    const cid = Number.parseInt(form.categoryId);
    const filtered = subcategories.filter((s) => s.categoryId === cid);
    setFilteredSubcategories(filtered);
    setSubcategoryId("");
  }, [form.categoryId, subcategories]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEstoqueChange = (store, value) => {
    setEstoques((prev) => ({
      ...prev,
      [store]: Number.parseInt(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const price = Number.parseFloat(String(form.price).replace(",", ".")) || 0;
    const categoryId = Number.parseInt(form.categoryId) || null;
    const subId = subcategoryId ? Number.parseInt(subcategoryId) : null;

    const data = {
      name: form.name,
      description: form.description,
      price,
      imageUrl: form.imageUrl,
      categoryId,
      subcategoryId: subId
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
      console.error("Erro:", error?.response?.data || error?.message);
      alert("❌ Erro ao salvar produto.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "center" }}>
          <div className="text-left">
            <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>Logado como:</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#065f46" }}>{displayName}</div>
          </div>
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

          <Dropdown
            label="Categoria"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            options={categories}
            required
          />

          <Dropdown
            label="Subcategoria"
            name="subcategoryId"
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            options={filteredSubcategories}
            required={false}
          />

          <div className="w-full px-6 py-4" style={{ gridColumn: "span 2" }}>
            <label className="block mb-2 text-lg font-semibold text-gray-700">Estoque por loja:</label>
            <div className="grid grid-cols-3 gap-4">
              {Object.keys(estoques).map((store) => (
                <div key={store} className="flex flex-col">
                  <label className="mb-1 text-gray-600">
                    {store.charAt(0).toUpperCase() + store.slice(1)}
                  </label>
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
            <button type="button" onClick={() => navigate("/produtos")} style={btnOutline}>📦 Produtos + 📈Ranking</button>
            <button type="button" onClick={() => navigate("/estoque")} style={btnOutline}>🏪 Estoque por Loja</button>
            <button type="button" onClick={() => navigate("/pedidos")} style={btnOutline}>✅ Ver Pedidos</button>
            <button type="button" onClick={() => navigate("/configuracoes")} style={btnOutline}>⚙️ Configurações de Entrega e ping</button>
            <button type="button" onClick={() => navigate("/categorias")} style={btnOutline}>⚙️ Categorias</button>
            <button type="button" onClick={() => navigate("/pagamentos#whatsapp")} style={btnOutline}>📲 Pagamentos e 📞 WhatsApp da Loja</button>
            <button type="button" onClick={() => navigate("/users")} style={btnOutline}>👤 Cadastro de Pessoa</button>
          </div>
        </form>
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

function Dropdown({ label, name, value, onChange, options, required = true }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
      <label style={labelStyle}>{label}</label>
      <select name={name} value={value} onChange={onChange} style={inputStyle} required={required}>
        <option value="">{required ? "Selecione..." : "Opcional"}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
    </div>
  );
}

const containerStyle = {
  minHeight: "100vh",
  background: "#f0fdf4",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "2rem",
  animation: "fadeIn 0.8s ease-in-out"
};

const cardStyle = {
  width: "100%",
  maxWidth: "1000px",
  background: "white",
  borderRadius: "1.5rem",
  padding: "3rem",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  textAlign: "center"
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1.5rem",
  marginBottom: "2rem"
};

const titleStyle = {
  fontSize: "3rem",
  color: "#065f46",
  fontWeight: "800",
  marginBottom: "1.5rem"
};

const subtitleStyle = {
  fontSize: "2rem",
  color: "#065f46",
  fontWeight: "bold",
  marginBottom: "1rem"
};

const textStyle = {
  fontSize: "1rem",
  color: "#4b5563",
  marginBottom: "2rem"
};

const buttonGroupStyle = {
  gridColumn: "span 2",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem"
};

const labelStyle = {
  marginBottom: "0.25rem",
  fontSize: "0.875rem",
  color: "#374151"
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: "0.75rem",
  border: "1px solid #cbd5e1",
  background: "#f9fdfb",
  color: "#111827",
  fontSize: "1rem",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.3s ease"
};

const btnPrimary = {
  background: "#059669",
  color: "white",
  padding: "0.75rem 1.5rem",
  fontWeight: "bold",
  border: "none",
  borderRadius: "0.75rem",
  cursor: "pointer",
  fontSize: "1rem",
  transition: "background-color 0.3s ease"
};

const btnDanger = {
  background: "#dc2626",
  color: "white",
  padding: "0.5rem 1.25rem",
  borderRadius: "0.75rem",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "background-color 0.3s ease"
};

const btnOutline = {
  background: "transparent",
  color: "#065f46",
  padding: "0.75rem 1.5rem",
  fontWeight: "bold",
  border: "2px solid #065f46",
  borderRadius: "0.75rem",
  cursor: "pointer",
  fontSize: "1rem",
  transition: "all 0.3s ease"
};
