// ProductList.jsx atualizado com controle de estoque por loja e visibilidade automática
import React, { useEffect, useState } from "react";
import api from "@/services/api";

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
    categoryId: "",
    subcategoryId: "",
    stock: { efapi: 0, palmital: 0, passo: 0 }
  });
  const lojas = ["efapi", "palmital", "passo"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchProducts(), fetchCategories(), fetchSubcategories()]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    fetchData();
  }, [searchTerm]);

  const fetchProducts = async () => {
    const res = await api.get("/products/list", {
      params: { name: searchTerm, page: 1, pageSize },
    });
    const ordered = (res.data.items || res.data).sort((a, b) => a.name.localeCompare(b.name));
    setProducts(ordered);
  };

  const fetchCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data);
  };

  const fetchSubcategories = async () => {
    const res = await api.get("/subcategories");
    setSubcategories(res.data);
  };

  const filteredProducts = categoryFilter
    ? products.filter((p) => p.categoryName?.toLowerCase() === categoryFilter.toLowerCase())
    : products;

  const filteredSubcategories = subcategories.filter(
    (s) => s.categoryId === parseInt(form.categoryId)
  );

  const handleEdit = async (product) => {
    try {
      const stockRes = await api.get("/stock");
      const stockData = stockRes.data.find(s => s.productId === product.id);
      setEditingProduct(product);
      setForm({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        imageUrl: product.imageUrl,
        categoryId: product.categoryId.toString(),
        subcategoryId: product.subcategoryId ? product.subcategoryId.toString() : "",
        stock: {
          efapi: stockData?.efapi || 0,
          palmital: stockData?.palmital || 0,
          passo: stockData?.passo || 0
        }
      });
    } catch (err) {
      console.error("Erro ao carregar estoque:", err);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/products/${form.id}`, {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        imageUrl: form.imageUrl,
        categoryId: parseInt(form.categoryId),
        subcategoryId: form.subcategoryId ? parseInt(form.subcategoryId) : null
      });
      await api.post(`/stock/${form.id}`, form.stock);
      alert("✅ Produto atualizado com sucesso!");
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
      alert("❌ Erro ao atualizar produto.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja excluir este produto?")) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error("Erro ao excluir produto:", err);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setForm({ id: null, name: "", description: "", price: "", imageUrl: "", categoryId: "", subcategoryId: "", stock: { efapi: 0, palmital: 0, passo: 0 } });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStockChange = (loja, value) => {
    setForm(prev => ({ ...prev, stock: { ...prev.stock, [loja]: parseInt(value) || 0 } }));
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-800">
      
      <h1 className="text-3xl font-bold mb-6 text-center">📦 Lista de Produtos ({filteredProducts.length})</h1>
      <button
              onClick={() => window.history.back()}
              className="rounded-md border border-gray-300 bg-white px-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              ← Voltar
            </button>
            

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Buscar por nome"
          className="p-3 border rounded"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-3 border rounded"
        >
          <option value="">Todas as categorias</option>
          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
        </select>
        
      </div>

      <table className="min-w-full bg-white rounded shadow">
        <thead className="bg-green-100 text-green-900">
          <tr>
            <th className="p-3 text-left">Produto</th>
            <th className="p-3 text-left">Preço</th>
            <th className="p-3 text-left">Categoria</th>
            <th className="p-3 text-left">Subcategoria</th>
            <th className="p-3 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(p => (
            <tr key={p.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{p.name}</td>
              <td className="p-3">R$ {p.price.toFixed(2)}</td>
              <td className="p-3">{p.categoryName}</td>
              <td className="p-3">{p.subcategoryName || "—"}</td>
              <td className="p-3 flex gap-2">
                <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline">✏️</button>
                <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingProduct && (
        <div className="fixed top-0 right-0 w-full max-w-sm h-full bg-white p-6 shadow-xl overflow-y-auto z-50">
          <button onClick={handleCancelEdit} className="text-gray-600 text-xl float-right">✖</button>
          <h2 className="text-xl font-bold mb-4 text-green-700">✏️ Editar Produto</h2>
          {"name description price imageUrl".split(" ").map(field => (
            <div className="mb-4" key={field}>
              <label className="block text-sm mb-1">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input name={field} value={form[field]} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
          ))}
          <div className="mb-4">
            <label className="block text-sm mb-1">Categoria</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="">Selecione...</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1">Subcategoria</label>
            <select name="subcategoryId" value={form.subcategoryId} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="">Selecione...</option>
              {filteredSubcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm mb-1">Estoque por Loja</label>
            {lojas.map(loja => (
              <div key={loja} className="mb-2">
                <label className="text-sm">{loja.charAt(0).toUpperCase() + loja.slice(1)}</label>
                <input type="number" min="0" value={form.stock[loja]} onChange={e => handleStockChange(loja, e.target.value)} className="w-full p-2 border rounded" />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={handleUpdate} className="bg-green-600 text-white px-4 py-2 rounded">💾 Salvar</button>
            <button onClick={handleCancelEdit} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

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
  );
}
