import React, { useEffect, useState } from "react";
import api from "@/services/api";
import { toast } from "react-toastify";

export default function EstoquePorLoja() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [estoques, setEstoques] = useState({});
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState("");
  const [estoquePadrao, setEstoquePadrao] = useState("");
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState("ativos"); // 'ativos' | 'zero' | 'arquivados'

  const lojas = ["efapi", "palmital", "passo"];
  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";
  let perms = {};
  try {
    perms = JSON.parse(localStorage.getItem("permissions") || "{}");
  } catch {
    /* noop */
  }

  const canEditStore = (slug) => {
    if (isAdmin) return true;
    const s = perms?.stores?.[slug];
    return !!(s && s.edit_stock === true);
  };

  useEffect(() => {
    setProdutos((prev) => [...prev]);
  }, [estoques]);

  const prevEstoque = (productId, loja) => {
    const key = `${productId}-${loja}`;
    return estoques[key] ?? 0;
  };

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const res = await api.get(
          "/products/list?page=1&pageSize=1000&includeArchived=true",
        );
        const produtosOrdenados = (res.data.items || res.data).sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        setProdutos(produtosOrdenados);

        const categoriasUnicas = [
          ...new Set(produtosOrdenados.map((p) => p.categoryName).filter(Boolean)),
        ];
        setCategorias(categoriasUnicas);

        const subRes = await api.get("/subcategories");
        setSubcategorias(subRes.data);

        const estoqueRes = await api.get("/stock");
        const dados = {};
        for (const item of estoqueRes.data) {
          lojas.forEach((loja) => {
            const key = `${item.productId}-${loja}`;
            dados[key] = item[loja] ?? 0;
          });
        }
        setEstoques(dados);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      }
    };

    fetchDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (productId, loja, value) => {
    const key = `${productId}-${loja}`;
    const novoValor = parseInt(value, 10) || 0;

    setEstoques((prev) => ({ ...prev, [key]: novoValor }));

    try {
      const payload = {};
      lojas.forEach((l) => {
        payload[l] = parseInt(l === loja ? novoValor : prevEstoque(productId, l), 10) || 0;
      });
      await api.post(`/stock/${productId}`, payload);
      toast.success("Estoque atualizado!");
    } catch (e) {
      console.error("Erro ao salvar estoque:", e);
    }
  };

  const salvarEstoque = async (productId, silent = false) => {
    try {
      const payload = {};
      lojas.forEach((loja) => {
        payload[loja] = parseInt(estoques[`${productId}-${loja}`], 10) || 0;
      });

      await api.post(`/stock/${productId}`, payload);
      if (!silent) alert("✅ Estoque salvo!");
    } catch (err) {
      console.error("Erro ao salvar estoque:", err);
      if (!silent) alert("❌ Erro ao salvar estoque.");
    }
  };

  const arquivarProduto = async (id) => {
    try {
      await api.patch(`/products/${id}/archive`, { isArchived: true });
      setProdutos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isArchived: true } : p)),
      );
      alert("📦 Produto arquivado.");
    } catch (e) {
      console.error(e);
      alert("Erro ao arquivar.");
    }
  };

  const recolocarProduto = async (id) => {
    try {
      await api.patch(`/products/${id}/archive`, { isArchived: false });
      setProdutos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isArchived: false } : p)),
      );
      alert("✅ Produto recolocado no site.");
    } catch (e) {
      console.error(e);
      alert("Erro ao recolocar.");
    }
  };

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.name.toLowerCase().includes(filtroNome.toLowerCase()) &&
      (filtroCategoria === "" || p.categoryName === filtroCategoria) &&
      (filtroSubcategoria === "" || p.subcategoryName === filtroSubcategoria),
  );
  const produtosArquivados = produtosFiltrados.filter((p) => p.isArchived === true);
  const produtosAtivos = produtosFiltrados.filter((p) => !p.isArchived);
  const produtosAtivosFiltrados = produtosAtivos;

  const produtosZeroEstoque = produtosAtivosFiltrados.filter((produto) =>
    lojas.some((loja) => {
      const valor = estoques[`${produto.id}-${loja}`];
      return valor === 0 || valor === "0" || valor === "" || Number.isNaN(valor);
    }),
  );

  const getProdutosAlvo = () => {
    if (aba === "ativos") return produtosAtivosFiltrados;
    if (aba === "zero") return produtosZeroEstoque;
    return [];
  };

  const salvarTodos = async () => {
    setLoading(true);
    try {
      const alvo = getProdutosAlvo();
      await Promise.all(alvo.map((produto) => salvarEstoque(produto.id, true)));
      alert("✅ Estoques salvos!");
    } catch (err) {
      console.error("Erro ao salvar todos os estoques:", err);
      alert("❌ Erro ao salvar estoques.");
    } finally {
      setLoading(false);
    }
  };

  const aplicarEstoquePadrao = (loja) => {
    const valor = parseInt(estoquePadrao, 10);
    if (Number.isNaN(valor)) return alert("Insira um valor válido");

    const novosEstoques = { ...estoques };
    const alvo = getProdutosAlvo();
    alvo.forEach((p) => {
      const key = `${p.id}-${loja}`;
      novosEstoques[key] = valor;
    });
    setEstoques(novosEstoques);
  };

  return (
    <div className="min-h-screen bg-emerald-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6 text-gray-800">
        <header className="text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-400">
            Controle fácil
          </p>
          <h1 className="text-3xl font-bold text-emerald-800">📦 Estoque por Loja</h1>
          <p className="text-sm text-emerald-700">
            Escolha uma aba, ajuste os números e salve. Tudo simples como brincar.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            {
              id: "back",
              label: "← Voltar",
              helper: "Saia desta tela",
              classes:
                "border border-gray-200 bg-white text-gray-700 hover:border-gray-300",
              action: () => window.history.back(),
            },
            {
              id: "ativos",
              label: "🟢 Ativos",
              helper: "Produtos no site",
              classes:
                aba === "ativos"
                  ? "border border-emerald-600 bg-emerald-600 text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300",
              action: () => setAba("ativos"),
            },
            {
              id: "zero",
              label: "❌ Estoque 0",
              helper: "Precisa repor",
              classes:
                aba === "zero"
                  ? "border border-red-500 bg-red-500 text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300",
              action: () => setAba("zero"),
            },
            {
              id: "arquivados",
              label: "🗄️ Arquivados",
              helper: "Fora do site",
              classes:
                aba === "arquivados"
                  ? "border border-slate-700 bg-slate-700 text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300",
              action: () => setAba("arquivados"),
            },
            {
              id: "save",
              label: loading ? "⏳ Salvando..." : "💾 Salvar todos",
              helper: "Aplica na aba atual",
              classes:
                "border border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200",
              action: salvarTodos,
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`rounded-2xl p-4 text-left text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-200 ${item.classes}`}
              type="button"
            >
              <span className="block text-base">{item.label}</span>
              <span
                className={`text-xs ${
                  item.classes.includes("text-white") ? "text-white/80" : "text-gray-500"
                }`}
              >
                {item.helper}
              </span>
            </button>
          ))}
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm md:p-6">
          <h2 className="text-lg font-semibold text-emerald-800">
            🧮 Filtros e ações rápidas
          </h2>
          <p className="text-xs text-gray-500">
            Preencha, escolha para qual loja quer aplicar e pronto.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              placeholder="🔍 Buscar por nome..."
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
            />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={filtroSubcategoria}
              onChange={(e) => setFiltroSubcategoria(e.target.value)}
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
            >
              <option value="">Todas as subcategorias</option>
              {subcategorias.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={estoquePadrao}
              onChange={(e) => setEstoquePadrao(e.target.value)}
              placeholder="Valor para aplicar"
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
            />
            {lojas.map((loja) => (
              <button
                key={loja}
                onClick={() => aplicarEstoquePadrao(loja)}
                type="button"
                className="rounded-2xl border border-yellow-300 bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-900 shadow-sm transition hover:bg-yellow-200"
              >
                Aplicar p/ {loja.charAt(0).toUpperCase() + loja.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
              <p className="text-sm font-semibold text-emerald-700">
                ⏳ Salvando estoques, aguarde...
              </p>
            </div>
          </div>
        )}

        {aba === "zero" && (
          <SectionTable
            title="❌ Produtos com estoque 0"
            accent="text-red-700 bg-red-50"
            headerBg="bg-red-100 text-red-700"
            products={produtosZeroEstoque}
            emptyMessage="Nenhum produto com estoque 0."
            lojas={lojas}
            estoques={estoques}
            canEditStore={canEditStore}
            handleChange={handleChange}
            salvarEstoque={salvarEstoque}
            arquivarProduto={arquivarProduto}
            showArchive
          />
        )}

        {aba === "ativos" && (
          <SectionTable
            title="🟢 Produtos ativos"
            accent="text-emerald-700 bg-emerald-50"
            headerBg="bg-emerald-100 text-emerald-700"
            products={produtosAtivosFiltrados}
            emptyMessage="Nenhum produto ativo encontrado."
            lojas={lojas}
            estoques={estoques}
            canEditStore={canEditStore}
            handleChange={handleChange}
            salvarEstoque={salvarEstoque}
            arquivarProduto={arquivarProduto}
            showArchive
          />
        )}

        {aba === "arquivados" && (
          <ArchivedTable
            produtosArquivados={produtosArquivados}
            recolocarProduto={recolocarProduto}
          />
        )}
      </div>
    </div>
  );
}

function SectionTable({
  title,
  accent,
  headerBg,
  products,
  emptyMessage,
  lojas,
  estoques,
  canEditStore,
  handleChange,
  salvarEstoque,
  arquivarProduto,
  showArchive = false,
}) {
  return (
    <section className="space-y-4 rounded-3xl bg-white p-4 shadow-sm md:p-6">
      <div className={`rounded-2xl p-4 text-center text-sm font-semibold ${accent}`}>
        {title}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className={headerBg}>
            <tr>
              <th className="p-3 text-left font-semibold">Imagem</th>
              <th className="p-3 text-left font-semibold">Produto</th>
              {lojas.map((loja) => (
                <th key={loja} className="p-3 text-left font-semibold">
                  {loja.charAt(0).toUpperCase() + loja.slice(1)}
                </th>
              ))}
              <th className="p-3 text-left font-semibold">Ação</th>
            </tr>
          </thead>
          <tbody>
            {products.map((produto) => (
              <tr key={produto.id} className="divide-y divide-gray-100">
                <td className="p-3">
                  <img
                    src={produto.imageUrl}
                    alt={produto.name}
                    className="h-12 w-12 rounded border border-gray-200 bg-white object-contain"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/48?text=No+Img";
                    }}
                  />
                </td>
                <td className="p-3 font-medium text-gray-700">{produto.name}</td>
                {lojas.map((loja) => (
                  <td key={loja} className="p-3">
                    <input
                      type="number"
                      min="0"
                      value={estoques[`${produto.id}-${loja}`] ?? ""}
                      onChange={(e) => handleChange(produto.id, loja, e.target.value)}
                      className="w-24 rounded-xl border border-gray-200 px-2 py-1 text-right text-sm focus:border-emerald-400 focus:outline-none"
                      disabled={!canEditStore(loja)}
                    />
                  </td>
                ))}
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => salvarEstoque(produto.id)}
                    className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-40"
                    disabled={!lojas.some(canEditStore)}
                  >
                    💾 Salvar
                  </button>
                  {showArchive && (
                    <button
                      onClick={() => arquivarProduto(produto.id)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                    >
                      🗄️ Arquivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={lojas.length + 3}
                  className="p-4 text-center text-sm font-semibold text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );



}



function ArchivedTable({ produtosArquivados, recolocarProduto }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm md:p-6">
      <div className="rounded-2xl bg-slate-100 p-4 text-center text-sm font-semibold text-slate-700">
        🗄️ Produtos arquivados
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-slate-200 text-slate-700">
            <tr>
              <th className="p-3 text-left font-semibold">Produto</th>
              <th className="p-3 text-left font-semibold">Categoria</th>
              <th className="p-3 text-left font-semibold">Subcategoria</th>
              <th className="p-3 text-left font-semibold">Ação</th>
            </tr>
          </thead>
          <tbody>
            {produtosArquivados.map((p) => (
              <tr key={p.id} className="divide-y divide-gray-100">
                <td className="p-3 font-medium text-gray-700">{p.name}</td>
                <td className="p-3 text-gray-600">{p.categoryName || "-"}</td>
                <td className="p-3 text-gray-600">{p.subcategoryName || "-"}</td>
                <td className="p-3">
                  <button
                    onClick={() => recolocarProduto(p.id)}
                    className="rounded-full bg-amber-500 px-4 py-1 text-xs font-semibold text-white shadow hover:bg-amber-600"
                  >
                    ↩️ Recolocar no site
                  </button>
                </td>
              </tr>
            ))}
            {produtosArquivados.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-sm font-semibold text-gray-500"
                >
                  Nenhum produto arquivado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

}
