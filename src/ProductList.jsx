// ProductList.jsx — agora com ordenação drag-and-drop e salvar layout
import React, { useEffect, useMemo, useCallback, useState } from "react";
import api from "@/services/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const pageSize = 1000;

export default function ProductList() {
  const [products, setProducts] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [searchTerm, setSearchTerm] = useState("");
  // eslint-disable-next-line no-unused-vars
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
  // eslint-disable-next-line no-unused-vars
  const lojas = ["efapi", "palmital", "passo"];

  // —— Edição rápida de preços ——
  const [showPricePanel, setShowPricePanel] = useState(false);
  const [priceEdits, setPriceEdits] = useState({});
  // —— Ordenação e layout ——
  const [layoutEdits, setLayoutEdits] = useState({});

  // Drag end handler
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(products);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setProducts(reordered);
    setLayoutEdits(
      reordered.reduce((acc, p, idx) => {
        acc[p.id] = { sortRank: idx, pinnedTop: idx === 0 };
        return acc;
      }, {})
    );
  };

  const saveLayout = async () => {
    try {
      await api.put("/storefront/layout", { items: layoutEdits });
      alert("✅ Layout salvo com sucesso!");
    } catch (e) {
      console.error(e);
      alert("❌ Erro ao salvar layout.");
    }
  };

  // Abre o painel já preenchendo os preços atuais
  const openPricePanel = () => {
    const map = {};
    (filteredProducts ?? products ?? []).forEach((p) => {
      map[p?.id] = (p?.price ?? "").toString();
    });
    setPriceEdits(map);
    setShowPricePanel(true);
  };

  const savePrice = async (id) => {
    try {
      const raw = priceEdits[id];
      const price = parseFloat(String(raw).replace(",", ".")) || 0;
      const p = (products || []).find((x) => x?.id === id);
      if (!p) return alert("Produto não encontrado na lista atual.");

      setProducts((prev) =>
        (prev ?? []).map((it) => (it?.id === id ? { ...it, price } : it))
      );
      setPriceEdits((prev) => ({ ...prev, [id]: price.toString() }));

      const body = {
        name: p?.name ?? "",
        description: p?.description ?? "",
        price,
        imageUrl: p?.imageUrl ?? "",
        categoryId: p?.categoryId ?? null,
        subcategoryId: p?.subcategoryId ?? null,
      };
      await api.put(`/products/${id}`, body);
      await fetchProducts();
    } catch (e) {
      console.error(e);
      alert("❌ Erro ao salvar preço.");
    }
  };

  const saveAllPrices = async () => {
    const list = (filteredProducts ?? products ?? []).slice();
    for (const p of list) {
      await savePrice(p?.id);
    }
    alert("✅ Preços atualizados.");
    await fetchProducts();
    openPricePanel();
  };

  // --------- API calls ---------
  const fetchProducts = useCallback(async () => {
    const res = await api.get("/products/list", {
      params: { name: searchTerm, page: 1, pageSize, _t: Date.now() },
    });
    const data = res?.data ?? [];
    const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
    setProducts(items);
  }, [searchTerm]);

  const fetchCategories = useCallback(async () => {
    const res = await api.get("/categories");
    setCategories(Array.isArray(res?.data) ? res.data : []);
  }, []);

  const fetchSubcategories = useCallback(async () => {
    const res = await api.get("/subcategories");
    setSubcategories(Array.isArray(res?.data) ? res.data : []);
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

  // eslint-disable-next-line no-unused-vars
  const filteredSubcategories = useMemo(() => {
    const cid = parseInt(form.categoryId);
    if (!Number.isFinite(cid)) return [];
    return subcategories.filter((s) => s?.categoryId === cid);
  }, [subcategories, form.categoryId]);

  useEffect(() => {
    if (!showPricePanel) return;
    const map = {};
    (filteredProducts ?? products ?? []).forEach((p) => {
      map[p?.id] = (p?.price ?? "").toString();
    });
    setPriceEdits(map);
  }, [showPricePanel, filteredProducts, products]);

  // --------- Handlers principais (edit/update/delete) ---------
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

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  // eslint-disable-next-line no-unused-vars
  const handleStockChange = (loja, value) => {
    const v = parseInt(value);
    setForm((prev) => ({
      ...prev,
      stock: { ...prev.stock, [loja]: Number.isFinite(v) && v >= 0 ? v : 0 },
    }));
  };

  const money = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-center">
        📦 Lista de Produtos ({filteredProducts.length})
      </h1>

      <div className="flex gap-3 mb-4">
        <button
          onClick={() => window.history.back()}
          className="rounded-md border border-gray-300 bg-white px-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
        >
          ← Voltar
        </button>
        <button
          onClick={saveLayout}
          className="rounded-md bg-blue-600 text-white px-4 py-1 text-sm hover:bg-blue-700"
        >
          💾 Salvar Layout
        </button>
      </div>

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

      {/* Lista com drag-and-drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="products">
          {(provided) => (
            <table
              className="min-w-full bg-white rounded shadow mt-6"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
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
                {filteredProducts.map((p, index) => (
                  <Draggable key={p?.id} draggableId={String(p?.id)} index={index}>
                    {(prov) => (
                      <tr
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="p-3">{p?.name ?? "—"}</td>
                        <td className="p-3">R$ {money(p?.price)}</td>
                        <td className="p-3">{p?.categoryName ?? "—"}</td>
                        <td className="p-3">{p?.subcategoryName ?? "—"}</td>
                        <td className="p-3 flex gap-2">
                          <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline">✏️</button>
                          <button onClick={() => handleDelete(p?.id)} className="text-red-600 hover:underline">🗑️</button>
                        </td>
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            </table>
          )}
        </Droppable>
      </DragDropContext>

      {/* Editor lateral permanece igual (editar produto) */}
      {editingProduct && (
        <div className="fixed top-0 right-0 w-full max-w-sm h-full bg-white p-6 shadow-xl overflow-y-auto z-50">
          {/* ... mesma lógica de edição já existente ... */}
        </div>
      )}
    </div>
  );
}
