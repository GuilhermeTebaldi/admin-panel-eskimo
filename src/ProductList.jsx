// ProductList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://backend-eskimo.onrender.com/api";
const pageSize = 1000;

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ id: null, name: "", description: "", price: "", imageUrl: "", stock: "", categoryId: "", subcategoryId: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [visibleStores, setVisibleStores] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchProducts(), fetchCategories(), fetchSubcategories()]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [searchTerm]);

  const fetchProducts = async () => {
    const res = await axios.get(`${API_URL}/products/list`, {
      params: { name: searchTerm, page: 1, pageSize },
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const ordered = (res.data.items || res.data).sort((a, b) => a.name.localeCompare(b.name));
    setProducts(ordered);
  };

  const fetchCategories = async () => {
    const res = await axios.get(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setCategories(res.data);
  };

  const fetchSubcategories = async () => {
    const res = await axios.get(`${API_URL}/subcategories`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setSubcategories(res.data);
  };

  const filteredProducts = categoryFilter ? products.filter((p) => p.categoryName?.toLowerCase() === categoryFilter.toLowerCase()) : products;
  const filteredSubcategories = subcategories.filter((s) => s.categoryId === parseInt(form.categoryId));

  const handleDelete = async (id) => {
    if (window.confirm("Deseja excluir este produto?")) {
      try {
        await axios.delete(`${API_URL}/products/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        fetchProducts();
      } catch (err) {
        console.error("Erro ao excluir produto:", err);
      }
    }
  };

  const handleEdit = async (product) => {
    setEditingProduct(product);
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      stock: product.stock.toString(),
      categoryId: product.categoryId.toString(),
      subcategoryId: product.subcategoryId ? product.subcategoryId.toString() : "",
    });

    try {
      const res = await axios.get(`${API_URL}/products/${product.id}/visibility`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setVisibleStores(res.data);
    } catch (err) {
      console.error("Erro ao buscar visibilidade:", err);
      setVisibleStores([]);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_URL}/products/${form.id}`, {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        categoryId: parseInt(form.categoryId),
        subcategoryId: form.subcategoryId ? parseInt(form.subcategoryId) : null,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      await axios.post(`${API_URL}/products/${form.id}/visibility`, visibleStores, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      alert("✅ Produto atualizado com sucesso!");
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("Erro ao atualizar produto:", err.response?.data || err);
      alert("❌ Erro ao atualizar produto.");
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setForm({ id: null, name: "", description: "", price: "", imageUrl: "", stock: "", categoryId: "", subcategoryId: "" });
    setVisibleStores([]);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (typeof window !== "undefined") {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      @keyframes fadeInRow { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      button:hover { filter: brightness(90%); }
      button.btn-outline:hover { background: #065f46; color: white; }
      button.btn-danger:hover { background: #b91c1c; }
    `;
    document.head.appendChild(styleTag);
  }

  return (
    <div style={pageStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>📦 Lista de Produtos ({filteredProducts.length})</h1>
          <div style={buttonGroupStyle}>
            <button onClick={() => navigate("/cadastro")} style={btnPrimary}>← Voltar</button>
            <button onClick={() => navigate("/categorias")} style={btnOutline} className="btn-outline">Categorias</button>
            <button onClick={handleLogout} style={btnDanger} className="btn-danger">Sair</button>
          </div>
        </div>

        <div style={searchGroupStyle}>
          <input placeholder="🔍 Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={inputStyle} />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={inputStyle}>
            <option value="">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: "auto", borderRadius: "0.5rem" }}>
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead style={{ background: "#d1fae5", color: "#065f46" }}>
      <tr>
        <th style={thStyle}>Nome</th>
        <th style={thStyle}>Preço</th>
        <th style={thStyle}>Estoque</th>
        <th style={thStyle}>Categoria</th>
        <th style={thStyle}>Subcategoria</th>
        <th style={thStyle}>Ações</th>
      </tr>
    </thead>
    <tbody>
      {isLoading ? (
        <tr><td colSpan="6" style={loadingStyle}>🔄 Carregando produtos...</td></tr>
      ) : filteredProducts.length === 0 ? (
        <tr><td colSpan="6" style={emptyStyle}>Nenhum produto encontrado.</td></tr>
      ) : (
        filteredProducts.map((p) => (
          <tr key={p.id} style={{ animation: "fadeInRow 0.5s ease both", borderTop: "1px solid #e5e7eb" }}>
            <td style={tdStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  style={{
                    width: "50px",
                    height: "50px",
                    objectFit: "cover",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb"
                  }}
                />
                <span>{p.name}</span>
              </div>
            </td>
            <td style={tdStyle}>R$ {p.price.toFixed(2)}</td>
            <td style={tdStyle}>{p.stock}</td>
            <td style={tdStyle}>{p.categoryName}</td>
            <td style={tdStyle}>{p.subcategoryName || "—"}</td>
            <td style={tdStyle}>
              <button
                onClick={() => handleEdit(p)}
                style={{ ...btnOutline, marginRight: "0.5rem" }}
                className="btn-outline"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                style={btnDangerSmall}
                className="btn-danger"
              >
                Excluir
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
</div>
{editingProduct && (
        <div style={editorStyle}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#065f46", marginBottom: "1.5rem" }}>✏️ Editar Produto</h2>
          {["name", "description", "price", "imageUrl", "stock"].map((field) => (
            <div key={field} style={{ marginBottom: "1rem" }}>
              <label htmlFor={field} style={labelStyle}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input id={field} name={field} value={form[field]} onChange={handleChange} style={inputStyle} />
            </div>
          ))}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Categoria</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} style={inputStyle}>
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Subcategoria</label>
            <select name="subcategoryId" value={form.subcategoryId} onChange={handleChange} style={inputStyle}>
              <option value="">Selecione a subcategoria</option>
              {filteredSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ ...labelStyle, marginBottom: "0.5rem" }}>Exibir nas unidades:</label>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {["efapi", "palmital", "passo"].map((store) => (
                <label key={store} style={{ fontSize: "1rem", color: "#374151" }}>
                  <input
                    type="checkbox"
                    checked={visibleStores.includes(store)}
                    onChange={() => {
                      setVisibleStores((prev) =>
                        prev.includes(store)
                          ? prev.filter((s) => s !== store)
                          : [...prev, store]
                      );
                    }}
                    style={{ marginRight: "0.5rem" }}
                  />
                  {store.charAt(0).toUpperCase() + store.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button onClick={handleUpdate} style={btnPrimary}>💾 Salvar</button>
            <button onClick={handleCancelEdit} style={{ ...btnOutline, color: "#dc2626" }} className="btn-outline">Cancelar</button>
          </div>
        </div>
      )}

      <h1 style={{ fontSize: "1.0rem", color: "#065f46", fontWeight: "bold", marginBottom: "1rem" }}>Volpesites 🦊</h1>
    </div>
  );
}

// 🎨 Estilos finais
const pageStyle = { minHeight: "100vh", padding: "2rem", background: "#f0fdf4", display: "flex", flexDirection: "column", alignItems: "center" };
const panelStyle = { width: "100%", maxWidth: "1150px", background: "white", padding: "2.5rem", borderRadius: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" };
const headerStyle = { display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" };
const titleStyle = { fontSize: "2.5rem", fontWeight: "bold", color: "#065f46", textAlign: "center" };
const buttonGroupStyle = { display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" };
const searchGroupStyle = { display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap", justifyContent: "center" };
const loadingStyle = { textAlign: "center", padding: "2rem", fontSize: "1.2rem", color: "#059669" };
const emptyStyle = { textAlign: "center", padding: "1rem", color: "#6b7280" };
const editorStyle = { position: "fixed", top: 0, right: 0, width: "100%", maxWidth: "400px", height: "100vh", background: "#ffffff", boxShadow: "-2px 0 10px rgba(0,0,0,0.1)", padding: "2rem", overflowY: "auto", zIndex: 1000, animation: "fadeInRight 0.5s ease-in-out" };

const labelStyle = { display: "block", fontSize: "0.875rem", color: "#374151", marginBottom: "0.25rem" };
const inputStyle = { width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #ccc" };
const thStyle = { padding: "0.75rem", textAlign: "left", fontWeight: "600", fontSize: "0.9rem" };
const tdStyle = { padding: "0.75rem", fontSize: "0.95rem", color: "#374151" };
const btnPrimary = { background: "#059669", color: "white", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold", transition: "background 0.3s" };
const btnDanger = { background: "#dc2626", color: "white", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold" };
const btnDangerSmall = { background: "#dc2626", color: "white", padding: "0.25rem 0.75rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold" };
const btnOutline = { background: "transparent", color: "#065f46", padding: "0.5rem 1rem", border: "2px solid #065f46", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "bold", transition: "all 0.3s" };
