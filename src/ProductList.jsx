// ProductList.jsx — corrigido (tela branca) + null-safety e pequenos ajustes
import React, { useEffect, useMemo, useCallback, useState } from "react";
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
    stock: { efapi: 0, palmital: 0, passo: 0 },
  });
  const lojas = ["efapi", "palmital", "passo"];
// —— Edição rápida de preços ——
const [showPricePanel, setShowPricePanel] = useState(false);
// id -> string (mantém o que o usuário digitou)
const [priceEdits, setPriceEdits] = useState({});

// Abre o painel já preenchendo os preços atuais
const openPricePanel = () => {
  const map = {};
  (filteredProducts ?? products ?? []).forEach((p) => {
    map[p?.id] = (p?.price ?? "").toString();
  });
  setPriceEdits(map);
  setShowPricePanel(true);
};
// Atualiza o preço de um único produto
const savePrice = async (id) => {
  try {
    const raw = priceEdits[id];
    const price = parseFloat(String(raw).replace(",", ".")) || 0;
    const p = (products || []).find((x) => x?.id === id);
    if (!p) return alert("Produto não encontrado na lista atual.");

    // UI otimista
    setProducts((prev) =>
      (prev ?? []).map((it) => (it?.id === id ? { ...it, price } : it))
    );
    setPriceEdits((prev) => ({ ...prev, [id]: price.toString() }));

    // PUT real
    const body = {
      name: p?.name ?? "",
      description: p?.description ?? "",
      price,
      imageUrl: p?.imageUrl ?? "",
      categoryId: p?.categoryId ?? null,
      subcategoryId: p?.subcategoryId ?? null,
    };
    await api.put(`/products/${id}`, body);

    await fetchProducts(); // confirma com servidor

    if (showPricePanel) {
      const map = {};
      (filteredProducts ?? products ?? []).forEach((pp) => {
        map[pp?.id] = (pp?.price ?? "").toString();
      });
      setPriceEdits(map);
    }
  } catch (e) {
    console.error(e);
    alert("❌ Erro ao salvar preço.");
  }
};


// Salva todos os itens visíveis no painel
const saveAllPrices = async () => {
  const list = (filteredProducts ?? products ?? []).slice();
  for (const p of list) {
    await savePrice(p?.id);
  }
  alert("✅ Preços atualizados.");
  await fetchProducts();
  openPricePanel(); // re-sincroniza os valores exibidos
};

  // --------- API calls ---------
  const fetchProducts = useCallback(async () => {
    const res = await api.get("/products/list", {
      params: { name: searchTerm, page: 1, pageSize, _t: Date.now() },
    });
    
    const data = res?.data ?? [];
    const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
    const ordered = items.slice().sort((a, b) => {
      const an = (a?.name ?? "").toString();
      const bn = (b?.name ?? "").toString();
      return an.localeCompare(bn);
    });
    setProducts(ordered);
  }, [searchTerm]);

  const fetchCategories = useCallback(async () => {
    const res = await api.get("/categories");
    const data = res?.data ?? [];
    setCategories(Array.isArray(data) ? data : []);
  }, []);

  const fetchSubcategories = useCallback(async () => {
    const res = await api.get("/subcategories");
    const data = res?.data ?? [];
    setSubcategories(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([fetchProducts(), fetchCategories(), fetchSubcategories()]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    })();
  }, [fetchProducts, fetchCategories, fetchSubcategories]);

  // --------- Derivados ---------
  const filteredProducts = useMemo(() => {
    if (!categoryFilter) return products;
    const cf = categoryFilter.toLowerCase();
    return products.filter((p) => (p?.categoryName ?? "").toLowerCase() === cf);
  }, [products, categoryFilter]);

  const filteredSubcategories = useMemo(() => {
    const cid = parseInt(form.categoryId);
    if (!Number.isFinite(cid)) return [];
    return subcategories.filter((s) => s?.categoryId === cid);
  }, [subcategories, form.categoryId]);
  // Mantém o painel de preços sincronizado ao mudar filtro/lista
useEffect(() => {
  if (!showPricePanel) return;
  const map = {};
  (filteredProducts ?? products ?? []).forEach((p) => {
    map[p?.id] = (p?.price ?? "").toString();
  });
  setPriceEdits(map);
}, [showPricePanel, filteredProducts, products]);


  // --------- Handlers ---------
  const handleEdit = async (product) => {
    try {
      const stockRes = await api.get("/stock");
      const stockArr = Array.isArray(stockRes?.data) ? stockRes.data : [];
      const stockData = stockArr.find((s) => s?.productId === product?.id);
      setEditingProduct(product);
      setForm({
        id: product?.id ?? null,
        name: product?.name ?? "",
        description: product?.description ?? "",
        price: (product?.price ?? "").toString(),
        imageUrl: product?.imageUrl ?? "",
        categoryId: (product?.categoryId ?? "").toString(),
        subcategoryId: product?.subcategoryId ? product.subcategoryId.toString() : "",
        stock: {
          efapi: stockData?.efapi ?? 0,
          palmital: stockData?.palmital ?? 0,
          passo: stockData?.passo ?? 0,
        },
      });
    } catch (err) {
      console.error("Erro ao carregar estoque:", err);
    }
  };

  const handleUpdate = async () => {
    try {
      const body = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        imageUrl: form.imageUrl,
        categoryId: parseInt(form.categoryId) || null,
        subcategoryId: form.subcategoryId ? parseInt(form.subcategoryId) : null,
      };
      await api.put(`/products/${form.id}`, body);
      await api.post(`/stock/${form.id}`, form.stock);
      alert("✅ Produto atualizado com sucesso!");
      setEditingProduct(null);
      setForm({
        id: null,
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        categoryId: "",
        subcategoryId: "",
        stock: { efapi: 0, palmital: 0, passo: 0 },
      });
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
    setForm({
      id: null,
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      categoryId: "",
      subcategoryId: "",
      stock: { efapi: 0, palmital: 0, passo: 0 },
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStockChange = (loja, value) => {
    const v = parseInt(value);
    setForm((prev) => ({
      ...prev,
      stock: { ...prev.stock, [loja]: Number.isFinite(v) && v >= 0 ? v : 0 },
    }));
  };

  // --------- Safe helpers ---------
  const money = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-center">
        📦 Lista de Produtos ({filteredProducts.length})
      </h1>
      <button
        onClick={() => window.history.back()}
        className="rounded-md border border-gray-300 bg-white px-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
      >
        ← Voltar
      </button>
      <div className="flex flex-wrap items-center gap-3 mt-4">
  <button
    onClick={() => (showPricePanel ? setShowPricePanel(false) : openPricePanel())}
    className={`rounded-md px-4 py-2 text-sm font-semibold shadow border
      ${showPricePanel ? "bg-yellow-200 border-yellow-300 text-gray-800" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"}`}
  >
    💲 Preços
  </button>

  {showPricePanel && (
    <>
      <button
        onClick={saveAllPrices}
        className="rounded-md px-4 py-2 text-sm font-semibold shadow bg-green-600 text-white hover:bg-green-700"
      >
        💾 Salvar todos
      </button>
      <span className="text-sm text-gray-600">
        Editando {filteredProducts.length} produto(s)
      </span>
    </>
  )}
</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 mt-4">
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
          {categories.map((cat) => (
            <option key={cat?.id} value={cat?.name}>
              {cat?.name}
            </option>
          ))}
        </select>
      </div>
      {showPricePanel && (
  <div className="mb-6 rounded border border-gray-200 bg-white p-3 shadow-sm">
    <h3 className="mb-3 text-base font-semibold text-green-700">Edição rápida de preços</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {filteredProducts.map((p) => (
        <div key={p?.id} className="flex items-center gap-3 rounded border border-gray-200 p-2">
          <img
            src={p?.imageUrl}
            alt={p?.name}
            className="h-12 w-12 rounded object-contain border"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-gray-800">{p?.name ?? "—"}</div>
            <div className="truncate text-xs text-gray-500">
              {p?.categoryName ?? "—"}{p?.subcategoryName ? ` • ${p.subcategoryName}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">R$</span>
            <input
  type="number"
  step="0.01"
  inputMode="decimal"
  value={priceEdits[p?.id] ?? (p?.price ?? "")}
  onChange={(e) => {
    const v = e.target.value;
    setPriceEdits((prev) => ({ ...prev, [p?.id]: v }));
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") savePrice(p?.id);
  }}
  className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm"
/>

            <button
              onClick={() => savePrice(p?.id)}
              className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
              title="Salvar este produto"
            >
              Salvar
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

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
          {filteredProducts.map((p) => (
            <tr key={p?.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{p?.name ?? "—"}</td>
              <td className="p-3">R$ {money(p?.price)}</td>
              <td className="p-3">{p?.categoryName ?? "—"}</td>
              <td className="p-3">{p?.subcategoryName ?? "—"}</td>
              <td className="p-3 flex gap-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="text-blue-600 hover:underline"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(p?.id)}
                  className="text-red-600 hover:underline"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
          {filteredProducts.length === 0 && (
            <tr>
              <td className="p-6 text-center text-gray-500" colSpan={5}>
                Nenhum produto encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editingProduct && (
        <div className="fixed top-0 right-0 w-full max-w-sm h-full bg-white p-6 shadow-xl overflow-y-auto z-50">
          <button
            onClick={handleCancelEdit}
            className="text-gray-600 text-xl float-right"
            aria-label="Fechar edição"
          >
            ✖
          </button>
          <h2 className="text-xl font-bold mb-4 text-green-700">✏️ Editar Produto</h2>

          {"name description price imageUrl".split(" ").map((field) => (
            <div className="mb-4" key={field}>
              <label className="block text-sm mb-1">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                name={field}
                value={form[field]}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}

          <div className="mb-4">
            <label className="block text-sm mb-1">Categoria</label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione...</option>
              {categories.map((cat) => (
                <option key={cat?.id} value={cat?.id}>
                  {cat?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1">Subcategoria</label>
            <select
              name="subcategoryId"
              value={form.subcategoryId}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione...</option>
              {filteredSubcategories.map((sub) => (
                <option key={sub?.id} value={sub?.id}>
                  {sub?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm mb-1">Estoque por Loja</label>
            {lojas.map((loja) => (
              <div key={loja} className="mb-2">
                <label className="text-sm capitalize">{loja}</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock[loja]}
                  onChange={(e) => handleStockChange(loja, e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpdate}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              💾 Salvar
            </button>
            <button
              onClick={handleCancelEdit}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancelar
            </button>
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
            color: "#059669",
            textDecoration: "none",
            fontWeight: 600,
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
