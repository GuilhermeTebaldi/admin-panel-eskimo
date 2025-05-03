// admin-panel/src/pages/EstoquePorLoja.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://backend-eskimo.onrender.com/api";

export default function EstoquePorLoja() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [estoques, setEstoques] = useState({});
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState("");
  const [estoquePadrao, setEstoquePadrao] = useState("");
  const lojas = ["efapi", "palmital", "passo"];

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const res = await axios.get(`${API_URL}/products/list?page=1&pageSize=1000`);
        const produtosOrdenados = (res.data.items || res.data).sort((a, b) => a.name.localeCompare(b.name));
        setProdutos(produtosOrdenados);

        const categoriasUnicas = [...new Set(produtosOrdenados.map(p => p.categoryName).filter(Boolean))];
        setCategorias(categoriasUnicas);

        const subRes = await axios.get(`${API_URL}/subcategories`);
        setSubcategorias(subRes.data);

        const estoqueRes = await axios.get(`${API_URL}/stock`);
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
  }, []);

  const handleChange = (productId, loja, value) => {
    const key = `${productId}-${loja}`;
    setEstoques((prev) => ({ ...prev, [key]: value }));
  };

  const salvarEstoque = async (productId) => {
    try {
      const payload = {};
      lojas.forEach((loja) => {
        payload[loja] = parseInt(estoques[`${productId}-${loja}`]) || 0;
      });

      await axios.post(`${API_URL}/stock/${productId}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      // Atualiza estoque na tela
      const estoqueRes = await axios.get(`${API_URL}/stock`);
      const dados = {};
      for (const item of estoqueRes.data) {
        lojas.forEach((loja) => {
          const key = `${item.productId}-${loja}`;
          dados[key] = item[loja] ?? 0;
        });
      }
      setEstoques(dados);
      
    } catch (err) {
      console.error("Erro ao salvar estoque:", err);
    }
  };

  const salvarTodos = async () => {
    try {
      for (const produto of produtosFiltrados) {
        await salvarEstoque(produto.id);
      }
      alert("✅ Estoque salvo com sucesso!");

      
    } catch (err) {
      console.error("Erro ao salvar todos os estoques:", err);
      alert("❌ Erro ao salvar estoque.");

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

      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nome..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          style={inputFiltro}
        />
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={inputFiltro}>
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select value={filtroSubcategoria} onChange={(e) => setFiltroSubcategoria(e.target.value)} style={inputFiltro}>
          <option value="">Todas as subcategorias</option>
          {subcategorias.map((sub) => (
            <option key={sub.id} value={sub.name}>{sub.name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Estoque p/ aplicar"
          value={estoquePadrao}
          onChange={(e) => setEstoquePadrao(e.target.value)}
          style={inputFiltro}
        />
        {lojas.map((loja) => (
          <button key={loja} onClick={() => aplicarEstoquePadrao(loja)} style={btnApply}>
            Aplicar p/ {loja.charAt(0).toUpperCase() + loja.slice(1)}
          </button>
        ))}
        <button onClick={salvarTodos} style={btnPrimary}>💾 Salvar Todos</button>
      </div>

      <div style={{ overflowX: "auto", borderRadius: "0.5rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#d1fae5", color: "#065f46" }}>
            <tr>
              <th style={thStyle}>Produto</th>
              {lojas.map((loja) => (
                <th key={loja} style={thStyle}>{loja.charAt(0).toUpperCase() + loja.slice(1)}</th>
              ))}
              <th style={thStyle}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map((produto) => (
              <tr key={produto.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={tdStyle}>{produto.name}</td>
                {lojas.map((loja) => (
                  <td key={loja} style={tdStyle}>
                    <input
                      type="number"
                      min="0"
                      value={estoques[`${produto.id}-${loja}`] ?? ""}

                      onChange={(e) => handleChange(produto.id, loja, e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                ))}
                <td style={tdStyle}>
                  <button onClick={() => salvarEstoque(produto.id)} style={btnPrimary}>
                    💾 Salvar
                  </button>
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
const thStyle = { padding: "0.75rem", textAlign: "left", fontWeight: "600", fontSize: "0.9rem" };
const tdStyle = { padding: "0.75rem", fontSize: "0.95rem", color: "#374151" };
const inputStyle = { width: "80px", padding: "0.4rem", border: "1px solid #ccc", borderRadius: "0.5rem" };
const inputFiltro = { padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", minWidth: "200px" };
const btnPrimary = { background: "#059669", color: "white", padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold" };
const btnApply = { background: "#facc15", color: "#1e293b", padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold" };
