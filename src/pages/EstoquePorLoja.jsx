import React, { useEffect, useState } from "react";
import api from "@/services/api";

export default function EstoquePorLoja() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [estoques, setEstoques] = useState({});
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState("");
  const [estoquePadrao, setEstoquePadrao] = useState("");
  const [loading, setLoading] = useState(false); // 🔥 novo estado de loading
  const lojas = ["efapi", "palmital", "passo"];

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const res = await api.get("/products/list?page=1&pageSize=1000");
        const produtosOrdenados = (res.data.items || res.data).sort((a, b) => a.name.localeCompare(b.name));
        setProdutos(produtosOrdenados);

        const categoriasUnicas = [...new Set(produtosOrdenados.map(p => p.categoryName).filter(Boolean))];
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

  const handleChange = (productId, loja, value) => {
    const key = `${productId}-${loja}`;
    setEstoques((prev) => ({ ...prev, [key]: value }));
  };

  const salvarEstoque = async (productId, silent = false) => {
    try {
      const payload = {};
      lojas.forEach((loja) => {
        payload[loja] = parseInt(estoques[`${productId}-${loja}`]) || 0;
      });

      await api.post(`/stock/${productId}`, payload);
      if (!silent) {
        alert("✅ Estoque salvo!");
      }
    } catch (err) {
      console.error("Erro ao salvar estoque:", err);
      if (!silent) {
        alert("❌ Erro ao salvar estoque.");
      }
    }
  };

  const salvarTodos = async () => {
    setLoading(true);
    try {
      await Promise.all(produtosFiltrados.map((produto) => salvarEstoque(produto.id, true)));
      alert("✅ Estoques salvos!");
    } catch (err) {
      console.error("Erro ao salvar todos os estoques:", err);
      alert("❌ Erro ao salvar estoques.");
    } finally {
      setLoading(false);
    }
  };
  

  const aplicarEstoquePadrao = (loja) => {
    const valor = parseInt(estoquePadrao);
    if (isNaN(valor)) return alert("Insira um valor válido");

    const novosEstoques = { ...estoques };
    produtosFiltrados.forEach((p) => {
      const key = `${p.id}-${loja}`;
      novosEstoques[key] = valor;
    });
    setEstoques(novosEstoques);
  };

  const produtosFiltrados = produtos.filter(p =>
    p.name.toLowerCase().includes(filtroNome.toLowerCase()) &&
    (filtroCategoria === "" || p.categoryName === filtroCategoria) &&
    (filtroSubcategoria === "" || p.subcategoryName === filtroSubcategoria)
  );

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>📦 Estoque por Loja</h1>
      <button
        onClick={() => window.history.back()}
        className="rounded-md border border-gray-300 bg-white px-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
      >
        ← Voltar
      </button>

      <div style={filterStyle}>
        <input type="text" placeholder="🔍 Buscar por nome..." value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} style={inputFiltro} />
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={inputFiltro}>
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={filtroSubcategoria} onChange={(e) => setFiltroSubcategoria(e.target.value)} style={inputFiltro}>
          <option value="">Todas as subcategorias</option>
          {subcategorias.map((sub) => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
        </select>
        <input type="number" placeholder="Estoque p/ aplicar" value={estoquePadrao} onChange={(e) => setEstoquePadrao(e.target.value)} style={inputFiltro} />
        {lojas.map((loja) => (
          <button key={loja} onClick={() => aplicarEstoquePadrao(loja)} style={btnApply}>
            Aplicar p/ {loja.charAt(0).toUpperCase() + loja.slice(1)}
          </button>
        ))}
        <button onClick={salvarTodos} style={btnPrimary}>💾 Salvar Todos</button>
      </div>

      {loading && (
  <div style={{
    position: "fixed",
    top: 0, left: 0,
    width: "100%", height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  }}>
    <div style={{
      background: "white",
      padding: "2rem 3rem",
      borderRadius: "0.75rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
    }}>
      <div style={{
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #059669",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        animation: "spin 1s linear infinite",
        marginBottom: "1rem"
      }}></div>
      <p style={{ fontWeight: "bold", color: "#065f46" }}>⏳ Salvando estoques, por favor aguarde...</p>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)}


      {/* 🔴 Produtos com estoque 0 */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ ...titleStyle, fontSize: "1.5rem", color: "#b91c1c" }}>❌ Produtos com estoque 0</h2>
        <div style={{ overflowX: "auto", borderRadius: "0.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#fee2e2", color: "#b91c1c" }}>
              <tr>
                <th style={thStyle}>Produto</th>
                {lojas.map((loja) => <th key={loja} style={thStyle}>{loja.charAt(0).toUpperCase() + loja.slice(1)}</th>)}
                <th style={thStyle}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.filter((produto) =>
                lojas.some((loja) => (estoques[`${produto.id}-${loja}`] ?? 0) === 0)
              ).map((produto) => (
                <tr key={produto.id} style={{ borderTop: "1px solid #fca5a5" }}>
                  <td style={tdStyle}>{produto.name}</td>
                  {lojas.map((loja) => (
                    <td key={loja} style={tdStyle}>
                      <input type="number" min="0" value={estoques[`${produto.id}-${loja}`] ?? ""} onChange={(e) => handleChange(produto.id, loja, e.target.value)} style={inputStyle} />
                    </td>
                  ))}
                  <td style={tdStyle}>
                    <button onClick={() => salvarEstoque(produto.id)} style={btnPrimary}>💾 Salvar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🟢 Lista normal de produtos */}
      <div style={{ overflowX: "auto", borderRadius: "0.5rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#d1fae5", color: "#065f46" }}>
            <tr>
              <th style={thStyle}>Produto</th>
              {lojas.map((loja) => <th key={loja} style={thStyle}>{loja.charAt(0).toUpperCase() + loja.slice(1)}</th>)}
              <th style={thStyle}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map((produto) => (
              <tr key={produto.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={tdStyle}>{produto.name}</td>
                {lojas.map((loja) => (
                  <td key={loja} style={tdStyle}>
                    <input type="number" min="0" value={estoques[`${produto.id}-${loja}`] ?? ""} onChange={(e) => handleChange(produto.id, loja, e.target.value)} style={inputStyle} />
                  </td>
                ))}
                <td style={tdStyle}>
                  <button onClick={() => salvarEstoque(produto.id)} style={btnPrimary}>💾 Salvar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const pageStyle = { padding: "2rem", background: "#f0fdf4", minHeight: "100vh" };
const titleStyle = { fontSize: "2rem", fontWeight: "bold", color: "#065f46", marginBottom: "1.5rem" };
const filterStyle = { marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" };
const thStyle = { padding: "0.75rem", textAlign: "left", fontWeight: "600", fontSize: "0.9rem" };
const tdStyle = { padding: "0.75rem", fontSize: "0.95rem", color: "#374151" };
const inputStyle = { width: "80px", padding: "0.4rem", border: "1px solid #ccc", borderRadius: "0.5rem" };
const inputFiltro = { padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", minWidth: "200px" };
const btnPrimary = { background: "#059669", color: "white", padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold" };
const btnApply = { background: "#facc15", color: "#1e293b", padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold" };
