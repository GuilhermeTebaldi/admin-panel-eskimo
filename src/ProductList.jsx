// Melhorias no layout da listagem de produtos com filtro por categoria e contagem total
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";



const API_URL = "https://backend-eskimo.onrender.com/api";


const pageSize = 1000;

export default function ProductList() {
  const [products, setProducts] = useState([]);
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
    categoryId: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products/list`, {
        params: { name: searchTerm, page: 1, pageSize },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const ordered = (res.data.items || res.data).sort((a, b) => a.name.localeCompare(b.name));
      setProducts(ordered);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
    }
  };

  const filteredProducts = categoryFilter
    ? products.filter((p) => p.categoryName.toLowerCase() === categoryFilter.toLowerCase())
    : products;

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      alert("🗑 Produto excluído com sucesso!");
      fetchProducts();
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("❌ Erro ao excluir produto.");
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
      categoryId: product.categoryId.toString()
    });
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_URL}/products/${form.id}`, {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        categoryId: parseInt(form.categoryId)
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      alert("✅ Produto atualizado com sucesso!");
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("Erro ao atualizar:", err);
      alert("❌ Erro ao atualizar produto.");
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setForm({
      id: null,
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      stock: "",
      categoryId: ""
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    
    <div style={{ minHeight: "100vh", padding: "2rem", background: "#f0fdf4", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "1150px", background: "white", padding: "2.5rem", borderRadius: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">

          <h1 style={{ fontSize: "2.25rem", fontWeight: "bold", color: "#065f46" }}>📦 Lista de Produtos ({filteredProducts.length})</h1>
          <div style={{ display: "flex", gap: "0.75rem" }}>



<button onClick={() => navigate("/cadastro")} style={btnPrimary}>
  ← Voltar
</button>

<button onClick={handleLogout} style={btnDanger}>
  Sair
</button>

</div>

        </div>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          <input
            placeholder="🔍 Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={inputStyle}>
            <option value="">Todas as Categorias</option>
            <option value="Picolé">Picolé</option>
            <option value="Pote de Sorvete">Pote de Sorvete</option>
            <option value="Açaí">Açaí</option>
            <option value="Sundae">Sundae</option>
          </select>
        </div>

        <div className="overflow-x-auto w-full">

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#d1fae5", color: "#065f46" }}>
              <tr>
                <th style={thStyle}>Nome</th>
                <th style={thStyle}>Preço</th>
                <th style={thStyle}>Estoque</th>
                <th style={thStyle}>Categoria</th>
                <th style={thStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "1rem", color: "#6b7280" }}>Nenhum produto encontrado.</td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={tdStyle}>R$ {p.price.toFixed(2)}</td>
                    <td style={tdStyle}>{p.stock}</td>
                    <td style={tdStyle}>{p.categoryName}</td>
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
        <div style={{ position: "fixed", top: 0, right: 0, width: "100%", maxWidth: "400px", height: "100vh", background: "#ffffff", boxShadow: "-2px 0 10px rgba(0,0,0,0.1)", padding: "2rem", overflowY: "auto", zIndex: 1000 }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#065f46", marginBottom: "1.5rem" }}>✏️ Editar Produto</h2>
          {[{ name: "name", label: "Nome" }, { name: "description", label: "Descrição" }, { name: "price", label: "Preço" }, { name: "imageUrl", label: "Imagem (URL)" }, { name: "stock", label: "Estoque" }, { name: "categoryId", label: "Categoria" }].map(({ name, label }) => (
            <div key={name} style={{ marginBottom: "1rem" }}>
              <label htmlFor={name} style={labelStyle}>{label}</label>
              <input
                id={name}
                name={name}
                value={form[name]}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">

            <button onClick={handleUpdate} style={btnPrimary}>💾 Salvar Alterações</button>
            <button onClick={handleCancelEdit} style={{ ...btnOutline, color: "#dc2626" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ... estilos mantidos (labelStyle, inputStyle, thStyle, tdStyle, btnPrimary, btnDanger, btnDangerSmall, btnOutline)

const labelStyle = {
  display: "block",
  fontSize: "0.875rem",
  color: "#374151",
  marginBottom: "0.25rem"
};

const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "0.5rem",
  border: "1px solid #ccc"
};

const thStyle = {
  padding: "0.75rem",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "0.875rem",
  background: "#d1fae5"
};

const tdStyle = {
  padding: "0.75rem",
  fontSize: "0.95rem",
  color: "#374151"
};

const btnPrimary = {
  background: "#059669",
  color: "white",
  padding: "0.5rem 1rem",
  borderRadius: "0.5rem",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold"
};

const btnDanger = {
  background: "#dc2626",
  color: "white",
  padding: "0.5rem 1rem",
  borderRadius: "0.5rem",
  border: "none",
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

const btnOutline = {
  background: "transparent",
  color: "#065f46",
  padding: "0.25rem 0.75rem",
  borderRadius: "0.5rem",
  border: "1px solid #065f46",
  cursor: "pointer",
  fontWeight: "bold"
};
