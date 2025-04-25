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
  const [form, setForm] = useState({
    id: null,
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    stock: "",
    categoryId: "",
    subcategoryId: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products/list`, {
        params: { name: searchTerm, page: 1, pageSize },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const ordered = (res.data.items || res.data).sort((a, b) => a.name.localeCompare(b.name));
      setProducts(ordered);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setCategories(result.data);
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const result = await axios.get(`${API_URL}/subcategories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setSubcategories(result.data);
    } catch (err) {
      console.error("Erro ao buscar subcategorias:", err);
    }
  };

  const filteredProducts = categoryFilter
    ? products.filter((p) => p.categoryName?.toLowerCase() === categoryFilter.toLowerCase())
    : products;

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja excluir este produto?")) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchProducts();
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      stock: product.stock.toString(),
      categoryId: product.categoryId.toString(),
      subcategoryId: product.subcategoryId ? product.subcategoryId.toString() : ""
    });
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_URL}/products/${form.id}`, {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        categoryId: parseInt(form.categoryId),
        subcategoryId: form.subcategoryId ? parseInt(form.subcategoryId) : null
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      alert("✅ Produto atualizado com sucesso!");
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
      alert("❌ Erro ao atualizar produto.");
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setForm({ id: null, name: "", description: "", price: "", imageUrl: "", stock: "", categoryId: "", subcategoryId: "" });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const filteredSubcategories = subcategories.filter(
    (s) => s.categoryId === parseInt(form.categoryId)
  );

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", background: "#f0fdf4", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "1150px", background: "white", padding: "2.5rem", borderRadius: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", animation: "fadeIn 0.8s ease-in-out" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#065f46", textAlign: "center" }}>📦 Lista de Produtos ({filteredProducts.length})</h1>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/cadastro")} style={{ ...btnPrimary }}>← Voltar</button>
            <button onClick={() => navigate("/categorias")} style={{ ...btnOutline }}>Categorias</button>
            <button onClick={handleLogout} style={{ ...btnDanger }}>Sair</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
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
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "1rem", color: "#6b7280" }}>Nenhum produto encontrado.</td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={tdStyle}>R$ {p.price.toFixed(2)}</td>
                    <td style={tdStyle}>{p.stock}</td>
                    <td style={tdStyle}>{p.categoryName}</td>
                    <td style={tdStyle}>{p.subcategoryName || "—"}</td>
                    <td style={tdStyle}>
                      <button onClick={() => handleEdit(p)} style={{ ...btnOutline, marginRight: "0.5rem" }}>Editar</button>
                      <button onClick={() => handleDelete(p.id)} style={btnDangerSmall}>Excluir</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <div style={{ position: "fixed", top: 0, right: 0, width: "100%", maxWidth: "400px", height: "100vh", background: "#ffffff", boxShadow: "-2px 0 10px rgba(0,0,0,0.1)", padding: "2rem", overflowY: "auto", zIndex: 1000, animation: "fadeInRight 0.5s ease-in-out" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#065f46", marginBottom: "1.5rem" }}>✏️ Editar Produto</h2>

          {["name", "description", "price", "imageUrl", "stock"].map((field) => (
            <div key={field} style={{ marginBottom: "1rem" }}>
              <label htmlFor={field} style={labelStyle}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                id={field}
                name={field}
                value={form[field]}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          ))}

          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Categoria</label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Subcategoria</label>
            <select
              name="subcategoryId"
              value={form.subcategoryId}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Selecione a subcategoria</option>
              {filteredSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button onClick={handleUpdate} style={btnPrimary}>💾 Salvar</button>
            <button onClick={handleCancelEdit} style={{ ...btnOutline, color: "#dc2626" }}>Cancelar</button>
          </div>
          
        </div>
      )}<h1 style={{ fontSize: "1.0rem", color: "#065f46", fontWeight: "bold", marginBottom: "1rem" }}>
      Volpesites 🦊
    </h1>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: "0.875rem", color: "#374151", marginBottom: "0.25rem" };
const inputStyle = { width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #ccc" };
const thStyle = { padding: "0.75rem", textAlign: "left", fontWeight: "600", fontSize: "0.9rem" };
const tdStyle = { padding: "0.75rem", fontSize: "0.95rem", color: "#374151" };
const btnPrimary = { background: "#059669", color: "white", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold", transition: "background 0.3s", hover: { backgroundColor: "#047857" } };
const btnDanger = { background: "#dc2626", color: "white", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold" };
const btnDangerSmall = { background: "#dc2626", color: "white", padding: "0.25rem 0.75rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold" };
const btnOutline = { background: "transparent", color: "#065f46", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "2px solid #065f46", cursor: "pointer", fontWeight: "bold", transition: "all 0.3s" };