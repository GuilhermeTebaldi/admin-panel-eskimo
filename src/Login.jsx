import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8080/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("⚠️ Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      alert("✅ Login realizado com sucesso!");
      navigate("/cadastro");
    } catch (err) {
      console.error("Erro ao logar:", err);
      alert("❌ Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #e0f2f1, #f0fdf4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          padding: "2.5rem",
          borderRadius: "1.5rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", color: "#065f46", fontWeight: "800", marginBottom: "0.5rem" }}>
            🔒 Acesso Eskimó
          </h1>
          <p style={{ color: "#4b5563", fontSize: "0.95rem" }}>
            Entre com seu e-mail e senha para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label htmlFor="email" style={{ fontSize: "0.875rem", color: "#374151" }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email"
              required
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                border: "1px solid #cbd5e1",
                background: "#f9fdfb",
                fontSize: "1rem",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label htmlFor="password" style={{ fontSize: "0.875rem", color: "#374151" }}>
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                border: "1px solid #cbd5e1",
                background: "#f9fdfb",
                fontSize: "1rem",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#059669",
              color: "white",
              fontWeight: "bold",
              fontSize: "1rem",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: "none",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
