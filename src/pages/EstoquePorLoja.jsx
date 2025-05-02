import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://backend-eskimo.onrender.com/api";

export default function EstoquePorLoja() {
  const [produtos, setProdutos] = useState([]);
  const [estoques, setEstoques] = useState({});
  const lojas = ["efapi", "palmital", "passo"];

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const res = await axios.get(`${API_URL}/products/list?page=1&pageSize=1000`);
        const produtosOrdenados = (res.data.items || res.data).sort((a, b) => a.name.localeCompare(b.name));
        setProdutos(produtosOrdenados);

        const estoqueRes = await axios.get(`${API_URL}/stock`);
        const dados = {};
        for (const item of estoqueRes.data) {
          lojas.forEach((loja) => {
            const key = `${item.productId}-${loja}`;
            dados[key] = item[loja.charAt(0).toUpperCase() + loja.slice(1)] || 0;
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

      alert("✅ Estoques atualizados com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar estoque:", err);
      alert("❌ Erro ao atualizar estoques.");
    }
  };

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>📦 Estoque por Loja</h1>
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
            {produtos.map((produto) => (
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
const btnPrimary = { background: "#059669", color: "white", padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "bold" };
