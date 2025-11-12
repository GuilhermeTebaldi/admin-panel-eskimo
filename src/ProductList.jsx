// ProductList.jsx — DnD + Preços rápidos + salvar layout robusto
import React, { useEffect, useMemo, useCallback, useState } from "react";
import api from "@/services/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "react-toastify";

const pageSize = 1000;

const createEmptyPromoForm = () => ({
  productId: "",
  previousPrice: "",
  currentPrice: "",
  highlightText: "",
});

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
  const [activeTab, setActiveTab] = useState("products");
  const [promotion, setPromotion] = useState(null);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionSupported, setPromotionSupported] = useState(true);
  const [promoForm, setPromoForm] = useState(createEmptyPromoForm);
  const selectedPromoProduct = useMemo(
    () => (products || []).find((p) => String(p?.id) === String(promoForm.productId)) || null,
    [products, promoForm.productId]
  );
  const [activePromos, setActivePromos] = useState([]);
  const [promoPickerOpen, setPromoPickerOpen] = useState(false);
  const [promoSearch, setPromoSearch] = useState("");
  const promoCandidates = useMemo(() => {
    const term = promoSearch.trim().toLowerCase();
    const base = products || [];
    if (!term) return base;
    return base.filter(p => (p?.name || "").toLowerCase().includes(term));
  }, [products, promoSearch]);

  // —— Edição rápida de preços ——
  const [showPricePanel, setShowPricePanel] = useState(false);
  const [priceEdits, setPriceEdits] = useState({});

  // —— Ordenação / layout ——
  const [layoutEdits, setLayoutEdits] = useState({});

  // helper: constrói o mapa de layout a partir da lista atual
  const buildLayoutMap = (list) =>
    (list ?? []).reduce((acc, p, idx) => {
      const id = p?.id;
      if (!id) return acc;
      acc[id] = { sortRank: idx, pinnedTop: idx === 0 };
      return acc;
    }, {});

  // Drag end handler
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(products);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setProducts(reordered);
    setLayoutEdits(buildLayoutMap(reordered));
  };

  const saveLayout = async () => {
    try {
      // Se o usuário não arrastou nada, ainda assim salva a ordem atual:
      const items =
        Object.keys(layoutEdits).length > 0
          ? layoutEdits
          : buildLayoutMap(products);

      // Se o seu api.baseURL NÃO incluir "/api", use "/api/storefront/layout"
      await api.put("/storefront/layout", { items });

      // Recarrega para refletir ordenação do servidor (PinnedTop/SortRank)
      await fetchProducts();
      setLayoutEdits({});
      alert("✅ Layout salvo com sucesso!");
    } catch (e) {
      console.error("layout error:", {
        status: e?.response?.status,
        data: e?.response?.data,
        url: e?.config?.url,
        payload: layoutEdits,
      });
      alert("❌ Erro ao salvar layout.");
    }
  };

  // —— Preços rápidos ——
  const openPricePanel = () => {
    const map = {};
    (filteredProducts ?? products ?? []).forEach((p) => {
      map[p?.id] = (p?.price ?? "").toString();
    });
    setPriceEdits(map);
    setShowPricePanel(true);
  };

  const savePrice = async (id) => {
    const raw = priceEdits[id];
    const price = parseFloat(String(raw).replace(",", ".")) || 0;
    const p = (products || []).find((x) => x?.id === id);
    if (!p) {
      toast.error("Produto não encontrado na lista atual.");
      return;
    }
    const previousPrice = p?.price ?? 0;

    try {
      // UI otimista
      setProducts((prev) =>
        (prev ?? []).map((it) => (it?.id === id ? { ...it, price } : it))
      );
      setPriceEdits((prev) => ({ ...prev, [id]: price.toString() }));
      toast.success("Preço atualizado!");

      const body = {
        name: p?.name ?? "",
        description: p?.description ?? "",
        price,
        imageUrl: p?.imageUrl ?? "",
        categoryId: p?.categoryId ?? null,
        subcategoryId: p?.subcategoryId ?? null,
        sortRank: p?.sortRank ?? 0,
        pinnedTop: p?.pinnedTop ?? false,
      };
      await api.put(`/products/${id}`, body);
      await fetchProducts();
      if (showPricePanel) openPricePanel();
    } catch (e) {
      setProducts((prev) =>
        (prev ?? []).map((it) => (it?.id === id ? { ...it, price: previousPrice } : it))
      );
      setPriceEdits((prev) => ({ ...prev, [id]: previousPrice.toString() }));
      console.error(e);
      toast.error("❌ Erro ao salvar preço.");
    }
  };

  const saveAllPrices = async () => {
    const list = (filteredProducts ?? products ?? []).slice();
    for (const p of list) {
      // salva sequencialmente para manter simples e robusto
      // (se quiser otimizar: Promise.all com cuidado)
       
      await savePrice(p?.id);
    }
    alert("✅ Preços atualizados.");
    await fetchProducts();
    openPricePanel(); // re-sincroniza
  };

  // --------- API calls ---------
  const fetchProducts = useCallback(async () => {
    const res = await api.get("/products/list", {
      params: { name: searchTerm, page: 1, pageSize, _t: Date.now() },
    });
    const data = res?.data ?? [];
    // o servidor já ordena por PinnedTop/SortRank/Name
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.items)
      ? data.items
      : [];
    setProducts(items);
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

  const fetchPromotion = useCallback(async () => {
    if (!promotionSupported) {
      setPromotionLoading(false);
      return;
    }
    try {
      setPromotionLoading(true);
      const res = await api.get("/promotions/active");
      const promo = res?.data ?? null;
      setPromotion(promo);
      if (promo?.productId) {
        setPromoForm({
          productId: String(promo.productId),
          previousPrice: (promo.previousPrice ?? "").toString(),
          currentPrice: (promo.currentPrice ?? "").toString(),
          highlightText: promo.highlightText ?? "",
        });
      } else {
        setPromoForm(createEmptyPromoForm());
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        console.warn("Servidor atual não possui o endpoint /promotions. Funcionalidade desativada.");
        setPromotionSupported(false);
        setPromotion(null);
        setPromoForm(createEmptyPromoForm());
      } else {
        console.error("Erro ao carregar promoção:", error);
      }
    } finally {
      setPromotionLoading(false);
    }
  }, [promotionSupported]);

  const fetchActivePromos = useCallback(async () => {
    try {
      const res = await api.get("/promotions/list");
      const arr = Array.isArray(res?.data) ? res.data : [];
      setActivePromos(arr);
    } catch (e) {
      console.warn("Falha ao carregar lista de promoções:", e?.response?.status);
      setActivePromos([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchSubcategories(),
          fetchPromotion(),
        ]);
        await fetchActivePromos();
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    })();
  }, [fetchProducts, fetchCategories, fetchSubcategories, fetchPromotion, fetchActivePromos]);

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

  useEffect(() => {
    if (activeTab !== "products" && showPricePanel) {
      setShowPricePanel(false);
    }
  }, [activeTab, showPricePanel]);

  // --------- Handlers (editar / salvar / deletar) ---------
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
        sortRank: editingProduct?.sortRank ?? 0,
        pinnedTop: editingProduct?.pinnedTop ?? false,
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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleStockChange = (loja, value) => {
    const v = parseInt(value);
    setForm((prev) => ({
      ...prev,
      stock: { ...prev.stock, [loja]: Number.isFinite(v) && v >= 0 ? v : 0 },
    }));
  };

  const handlePromoFormChange = (field, value) => {
    setPromoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePromoProductChange = (value) => {
    setPromoForm((prev) => {
      if (!value) {
        return { ...prev, productId: "", previousPrice: "", currentPrice: "" };
      }
      const product = (products ?? []).find((p) => String(p?.id) === value);
      if (!product) {
        return { ...prev, productId: value };
      }
      const previous = promotion?.productId === product.id && promotion?.previousPrice != null
        ? promotion.previousPrice
        : product.price;
      return {
        ...prev,
        productId: value,
        previousPrice: (previous ?? "").toString(),
        currentPrice: (product.price ?? "").toString(),
      };
    });
  };

  const handleGoBack = () => window.history.back();
  const handleSaveLayoutClick = () => saveLayout();
  const handleShowProductsTab = () => setActiveTab("products");
  const handleShowPromotionTab = () => setActiveTab("promotion");
  const handleTogglePricePanel = () => {
    if (activeTab !== "products") {
      setActiveTab("products");
    }
    if (showPricePanel) {
      setShowPricePanel(false);
      return;
    }
    openPricePanel();
  };

  const savePromotionSetup = async () => {
    if (!promotionSupported) {
      toast.error("Atualize o backend da API para habilitar promoções.");
      return;
    }
    if (!promoForm.productId) {
      toast.error("Selecione um produto para a promoção.");
      return;
    }
    const currentPrice = parseFloat(String(promoForm.currentPrice).replace(",", "."));
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      toast.error("Informe um preço promocional válido.");
      return;
    }
    const previousPrice = parseFloat(String(promoForm.previousPrice).replace(",", "."));
    try {
      await api.put("/promotions/active", {
        productId: parseInt(promoForm.productId, 10),
        currentPrice,
        previousPrice: Number.isFinite(previousPrice) ? previousPrice : null,
        highlightText: promoForm.highlightText?.trim() || null,
      });
      toast.success("Promoção publicada!");
      await fetchPromotion();
      await fetchActivePromos();
      await fetchProducts();
    } catch (error) {
      console.error("Erro ao salvar promoção:", error);
      toast.error("❌ Erro ao salvar promoção.");
    }
  };

  const clearPromotion = async () => {
    if (!promotionSupported) {
      toast.error("Backend atual não suporta a remoção de promoções.");
      return;
    }
    if (!promotion) return;
    if (!window.confirm("Remover a promoção atual?")) return;
    try {
      await api.delete("/promotions/active");
      toast.info("Promoção removida.");
      setPromoForm(createEmptyPromoForm());
      await fetchPromotion();
      await fetchActivePromos();
    } catch (error) {
      console.error("Erro ao remover promoção:", error);
      toast.error("❌ Não foi possível remover a promoção.");
    }
  };

  const deletePromoById = async (id) => {
    if (!id) return;
    if (!window.confirm("Remover esta promoção?")) return;
    try {
      await api.delete(`/promotions/${id}`);
      toast.info("Promoção removida.");
      await fetchActivePromos();
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível remover a promoção.");
    }
  };

  const money = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };
  // --- Controle de acesso baseado em permissões ---
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const permissions = (() => {
    try {
      return JSON.parse(localStorage.getItem("permissions") || "{}");
    } catch {
      return {};
    }
  })();

  const canAccess =
    role === "admin" ||
    permissions.can_manage_products === true ||
    permissions.can_delete_products === true;

  if (!canAccess) {
    return (
      <div className="p-8 text-lg font-semibold text-red-600">
        🚫 Acesso restrito.
      </div>
    );
  }
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-center">
        📦 Lista de Produtos ({filteredProducts.length})
      </h1>
      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Controle rápido
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            {
              id: "back",
              label: "← Voltar",
              helper: "Sai desta tela",
              className:
                "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
              onClick: handleGoBack,
            },
            {
              id: "layout",
              label: "💾 Salvar Layout",
              helper: "Depois de arrastar os itens",
              className:
                "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100",
              onClick: handleSaveLayoutClick,
            },
            {
              id: "products",
              label: "📋 Produtos",
              helper: "Ver e editar lista",
              className:
                activeTab === "products"
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
              onClick: handleShowProductsTab,
            },
            {
              id: "promotion",
              label: "🎯 Promoção",
              helper: "Configurar destaque",
              className:
                activeTab === "promotion"
                  ? "border-pink-600 bg-pink-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
              onClick: handleShowPromotionTab,
            },
            {
              id: "prices",
              label: "💲 Preços",
              helper: showPricePanel
                ? "Fechar painel rápido"
                : "Atualizar valores",
              className: showPricePanel
                ? "border-amber-500 bg-amber-500 text-white shadow"
                : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
              onClick: handleTogglePricePanel,
            },
          ].map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className={`flex flex-col gap-1 rounded-2xl border-2 p-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-200 ${action.className}`}
            >
              <span className="text-base">{action.label}</span>
              <span
                className={`text-xs ${
                  action.className.includes("text-white")
                    ? "text-white/80"
                    : "text-gray-500"
                }`}
              >
                {action.helper}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "products" && (
        <>
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
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong>Modo Preços aberto</strong>
              <button
                onClick={saveAllPrices}
                className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-amber-700"
              >
                💾 Salvar todos
              </button>
              <span>Você está editando {filteredProducts.length} produto(s).</span>
            </div>
          )}

          {/* Painel de preços rápidos */}
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

          {/* Tabela com drag-and-drop nas linhas */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <table className="min-w-full bg-white rounded shadow mt-6">
              <thead className="bg-green-100 text-green-900">
                <tr>
                  <th className="p-3 text-left">Imagem</th>
                  <th className="p-3 text-left">Produto</th>
                  <th className="p-3 text-left">Preço</th>
                  <th className="p-3 text-left">Categoria</th>
                  <th className="p-3 text-left">Subcategoria</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>

              <Droppable droppableId="products">
                {(provided) => (
                  <tbody ref={provided.innerRef} {...provided.droppableProps}>
                    {filteredProducts.map((p, index) => (
                      <Draggable key={p?.id} draggableId={String(p?.id)} index={index}>
                        {(prov) => (
                          <tr
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            style={prov.draggableProps.style}
                            className="border-t hover:bg-gray-50"
                          >
                            <td className="p-3">
                              <img
                                src={p?.imageUrl}
                                alt={p?.name}
                                className="h-12 w-12 rounded border object-contain bg-white"
                                onError={(e)=>{ e.currentTarget.src="https://via.placeholder.com/48?text=No+Img"; }}
                              />
                            </td>
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
                )}
              </Droppable>
            </table>
          </DragDropContext>
        </>
      )}

      {activeTab === "promotion" && (
        <>
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-red-600">🎯 Promoção Flutuante</h2>
              <p className="text-sm text-gray-600">
                Selecione um produto e defina os valores que aparecerão na aba de promoções da loja.
              </p>
            </div>
            {promotionSupported && promotion && (
              <button
                onClick={clearPromotion}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remover promoção
              </button>
            )}
          </div>

          {!promotionSupported ? (
            <div className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
              O backend em produção ainda não expõe <code>/api/promotions</code>. Atualize a API (deploy da branch recente + migração)
              para controlar promoções reais por aqui sem gerar erros 404.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {promotionLoading ? (
                <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                  Carregando promoção atual...
                </div>
              ) : promotion && promotion?.product ? (
                <div className="rounded-lg border border-green-100 bg-green-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <img
                    src={promotion.product.imageUrl}
                    alt={promotion.product.name}
                    className="h-20 w-20 rounded object-contain border bg-white"
                    onError={(e)=>{ e.currentTarget.src="https://via.placeholder.com/80?text=No+Img"; }}
                  />
                  <div className="flex-1">
                    <p className="text-sm uppercase text-green-700">Promoção publicada</p>
                    <p className="text-lg font-semibold text-gray-800">{promotion.product.name}</p>
                    <p className="text-sm text-gray-600">
                      Antes: <span className="line-through">R$ {money(promotion.previousPrice)}</span> • Agora:{" "}
                      <span className="font-semibold text-red-600">R$ {money(promotion.currentPrice)}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Atualizado em {promotion.updatedAt ? new Date(promotion.updatedAt).toLocaleString("pt-BR") : "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                  Nenhuma promoção ativa no momento.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Produto em promoção</label>
                <div className="mt-1 relative">
                  <button
                    type="button"
                    onClick={() => setPromoPickerOpen((v) => !v)}
                    className="w-full flex items-center justify-between rounded border border-gray-300 p-3 bg-white"
                  >
                    <span className="truncate">
                      {selectedPromoProduct
                        ? `${selectedPromoProduct.name} — R$ ${money(selectedPromoProduct.price)}`
                        : "Selecione o produto"}
                    </span>
                    <span className="ml-2 text-gray-500">▾</span>
                  </button>

                  {promoPickerOpen && (
                    <div className="absolute z-20 mt-1 w-full max-h-80 overflow-auto rounded border border-gray-200 bg-white shadow-lg">
                      <div className="p-2 border-b">
                        <input
                          autoFocus
                          value={promoSearch}
                          onChange={(e)=>setPromoSearch(e.target.value)}
                          placeholder="Buscar produto…"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <ul className="divide-y">
                        <li
                          key="none"
                          className="p-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-600"
                          onClick={() => { handlePromoProductChange(""); setPromoPickerOpen(false); }}
                        >
                          — Nenhum selecionado —
                        </li>
                        {promoCandidates.map((p)=>(
                          <li
                            key={p?.id}
                            className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                            onClick={() => { handlePromoProductChange(String(p?.id)); setPromoPickerOpen(false); }}
                          >
                            <img
                              src={p?.imageUrl}
                              alt={p?.name}
                              className="h-10 w-10 rounded object-contain border bg-white"
                              onError={(e)=>{ e.currentTarget.src="https://via.placeholder.com/40?text=No+Img"; }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-gray-800">{p?.name}</div>
                              <div className="truncate text-xs text-gray-500">
                                R$ {money(p?.price)}
                                {p?.categoryName ? ` • ${p.categoryName}` : ""}
                                {p?.subcategoryName ? ` • ${p.subcategoryName}` : ""}
                              </div>
                            </div>
                          </li>
                        ))}
                        {promoCandidates.length === 0 && (
                          <li className="p-2 text-xs text-gray-500">Sem resultados</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                  {selectedPromoProduct && (
                    <div className="mt-3 flex items-center gap-3 rounded border border-gray-200 bg-white p-3">
                      <img
                        src={selectedPromoProduct.imageUrl}
                        alt={selectedPromoProduct.name}
                        className="h-16 w-16 rounded object-contain border bg-white"
                        onError={(e)=>{ e.currentTarget.src="https://via.placeholder.com/64?text=No+Img"; }}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-800">
                          {selectedPromoProduct.name}
                        </div>
                        <div className="truncate text-xs text-gray-500">
                          {selectedPromoProduct.categoryName ?? "—"}
                          {selectedPromoProduct.subcategoryName ? ` • ${selectedPromoProduct.subcategoryName}` : ""}
                        </div>
                        <div className="text-xs text-gray-600">
                          Preço atual: <span className="font-medium">R$ {money(selectedPromoProduct.price)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Valor anterior</label>
                  <input
                    type="number"
                    step="0.01"
                    value={promoForm.previousPrice}
                    onChange={(e) => handlePromoFormChange("previousPrice", e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 p-3"
                    placeholder="Ex.: 12.90"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Valor promocional (novo)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={promoForm.currentPrice}
                    onChange={(e) => handlePromoFormChange("currentPrice", e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 p-3"
                    placeholder="Ex.: 9.99"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Mensagem rápida (opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={160}
                    value={promoForm.highlightText}
                    onChange={(e) => handlePromoFormChange("highlightText", e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 p-3"
                    placeholder="Ex.: Promoção especial de fim de semana!"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este texto aparece junto ao produto na aba de promoções (máx. 160 caracteres).
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Ao salvar, o preço oficial do produto também será atualizado para o valor promocional informado.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={savePromotionSetup}
                  className="rounded-md bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  💾 Salvar promoção
                </button>
                <button
                  onClick={() => handlePromoProductChange("")}
                  className="rounded-md border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Limpar campos
                </button>
              </div>
            </div>
          )}
        </div>
        {promotionSupported && (
          <div className="mt-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Promoções ativas</h3>
            {activePromos.length === 0 ? (
              <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                Nenhuma promoção ativa.
              </div>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {activePromos.map((pr) => (
                  <li key={pr?.id} className="flex items-center gap-3 rounded border border-gray-200 p-3 bg-white">
                    <img
                      src={pr?.product?.imageUrl}
                      alt={pr?.product?.name}
                      className="h-12 w-12 rounded object-contain border bg-white"
                      onError={(e)=>{ e.currentTarget.src="https://via.placeholder.com/48?text=No+Img"; }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-800">{pr?.product?.name ?? "—"}</div>
                      <div className="text-xs text-gray-600">
                        Antes: <span className="line-through">R$ {money(pr?.previousPrice)}</span> • Agora: <span className="font-semibold text-red-600">R$ {money(pr?.currentPrice)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePromoById(pr?.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        </>
      )}

      {/* Editor lateral (igual ao antigo) */}
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
    </div>
  );
}
