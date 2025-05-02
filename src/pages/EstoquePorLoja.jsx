import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://backend-eskimo.onrender.com/api";

export default function EstoquePorLoja() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [estoques, setEstoques] = useState({});
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const lojas = ["efapi", "palmital", "passo"];

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const res = await axios.get(`${API_URL}/products/list?page=1&pageSize=1000`);
        const produtosOrdenados = (res.data.items || res.data).sort((a, b) => a.name.localeCompare(b.name));
        setProdutos(produtosOrdenados);

        const categoriasUnicas = [...new Set(produtosOrdenados.map(p => p.categoryName).filter(Boolean))];
        setCategorias(categoriasUnicas);

        const estoqueRes = await axios.get(`${API_URL}/stock`);
        const dados = {};
        for (const item of estoqueRes.data) {
          lojas.forEach((loja) => {
            const key = `${item.productId}-${loja}`;
            dados[key] = item[loja] || 0;

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
        payload[loja.toLowerCase()] = parseInt(estoques[`${productId}-${loja}`]) || 0;

      });

      await axios.post(`${API_URL}/stock/${productId}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      alert("✅ Estoques atualizados com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar estoque:", err);
      alert("❌ Erro ao atualizar estoques.");
    }
  };

  const produtosFiltrados = produtos.filter(p =>
    p.name.toLowerCase().includes(filtroNome.toLowerCase()) &&
    (filtroCategoria === "" || p.categoryName === filtroCategoria)
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
                      value={estoques[`${produto.id}-${loja}`] || 0}
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
