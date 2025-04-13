import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8080/api";

export default function AdminPanel() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    stock: "100",
    categoryId: "1" // padrão: 1 = Picolé, 2 = Pote, 3 = Açaí, 4 = Sundae
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      imageUrl: form.imageUrl,
      stock: parseInt(form.stock),
      categoryId: parseInt(form.categoryId)
    };

    try {
      await axios.post(`${API_URL}/products`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      alert("✅ Produto cadastrado com sucesso!");
      setForm({ name: "", description: "", price: "", imageUrl: "", stock: "", categoryId: "1" });
    } catch (error) {
      console.error("Erro:", error.response?.data || error.message);
      alert("❌ Erro ao salvar produto.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      background: "linear-gradient(to bottom right, #ecfdf5, #d1fae5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
      boxSizing: "border-box"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1000px",
        background: "white",
        borderRadius: "1.5rem",
        padding: "3rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        textAlign: "center",
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer"
            }}
          >
            🚪 Sair
          </button>
        </div>

        <h1 style={{ fontSize: "3rem", color: "#065f46", fontWeight: "800", marginBottom: "1.5rem", fontFamily: "Arial Black, sans-serif", letterSpacing: "1px" }}>
          Eskimó
        </h1>
        <h1 style={{ fontSize: "2.5rem", color: "#065f46", fontWeight: "bold", marginBottom: "1rem" }}>
          Cadastro de Produto
        </h1>

        <p style={{ fontSize: "1rem", color: "#4b5563", marginBottom: "2rem" }}>
          Preencha os campos abaixo para adicionar um novo produto ao sistema.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          <Input label="Nome" name="name" value={form.name} onChange={handleChange} />
          <Input label="Descrição" name="description" value={form.description} onChange={handleChange} />
          <Input label="Preço" name="price" value={form.price} onChange={handleChange} />
          <Input label="Imagem (URL)" name="imageUrl" value={form.imageUrl} onChange={handleChange} />
          <Input label="Estoque" name="stock" value={form.stock} onChange={handleChange} />
          <Input label="Categoria (1 = Picolé, 2 = Pote, 3 = Açaí, 4 = Sundae)" name="categoryId" value={form.categoryId} onChange={handleChange} />

          <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              type="submit"
              style={{
                backgroundColor: "#10b981",
                color: "white",
                padding: "0.75rem",
                fontWeight: "bold",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              Cadastrar Produto
            </button>
            <button
              type="button"
              onClick={() => navigate("/produtos")}
              style={{
                backgroundColor: "#f9fafb",
                color: "#065f46",
                padding: "0.5rem",
                fontWeight: "bold",
                border: "1px solid #d1fae5",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              📦 Ver Produtos Cadastrados
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
      <label htmlFor={name} style={{ marginBottom: "0.25rem", fontSize: "0.875rem", color: "#374151" }}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required
        style={{
          width: "100%",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          border: "1px solid #cbd5e1",
          background: "#f9fdfb",
          color: "#111827",
          fontSize: "1rem",
          boxSizing: "border-box"
        }}
      />
    </div>
  );
}
