import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from 'react-loading';

const API_URL = "https://backend-eskimo.onrender.com/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warn("⚠️ Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const token = res.data.token || "";
      localStorage.setItem("token", token);
      
      // 1) Preferir dados retornados pelo backend (patch já aplicado no /auth/login)
      let role = String(res.data?.role || "operator").toLowerCase();
      let permissions = res.data?.permissions ?? "{}";
      
      // 2) Fallback: decodificar JWT de forma robusta (base64url)
      if (!res.data?.role || !res.data?.permissions) {
        try {
          const part = (token.split(".")[1] || "");
          const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
          const json = decodeURIComponent(
            atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
          );
          const payload = JSON.parse(json);
          role = String(payload.role || payload.Role || role || "operator").toLowerCase();
          permissions = payload.permissions ?? permissions ?? "{}";
        } catch { /* noop */ }
      }
      
      // 3) Forçar admin para o e-mail raiz
      if (String(email).toLowerCase() === "admin@eskimo.com") {
        role = "admin";
      }
      
      // 4) Persistência
      localStorage.setItem("role", role);
      localStorage.setItem("permissions", typeof permissions === "string" ? permissions : JSON.stringify(permissions));
      
      toast.success("✅ Login realizado com sucesso!");

      setTimeout(() => {
        // admin direto em cadastro. outros ao painel inicial
        if (role === "admin") {
          window.location.href = "/cadastro";
        } else {
          window.location.href = "/inicio";
        }
      }, 1200);
    } catch (err) {
      console.error("Erro ao logar:", err.response?.data || err.message);
      toast.error("❌ Email ou senha inválidos.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #e0f2f1, #f0fdf4)", display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem", animation: "fadeIn 0.8s ease-in-out" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "white", padding: "2.5rem", borderRadius: "1.5rem", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", color: "#065f46", fontWeight: "bold", marginBottom: "1rem" }}>🔒 Acesso Eskimó</h1>
        <p style={{ color: "#6b7280", fontSize: "1rem", marginBottom: "2rem" }}>Entre com seu e-mail e senha para continuar</p>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "1rem", height: "150px" }}>
            <Loading type="spin" color="#059669" height={50} width={50} />
            <p style={{ color: "#065f46", fontWeight: "bold" }}>Carregando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ textAlign: "left" }}>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ textAlign: "left" }}>
              <label htmlFor="password" style={labelStyle}>Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                style={inputStyle}
              />
            </div>

            <button type="submit" style={btnPrimary}>Entrar</button>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: "0.875rem",
  color: "#374151",
  marginBottom: "0.5rem",
  display: "block"
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: "0.75rem",
  border: "1px solid #cbd5e1",
  background: "#f9fdfb",
  fontSize: "1rem",
  boxSizing: "border-box"
};

const btnPrimary = {
  backgroundColor: "#059669",
  color: "white",
  fontWeight: "bold",
  fontSize: "1rem",
  padding: "0.75rem",
  borderRadius: "0.75rem",
  border: "none",
  cursor: "pointer",
  transition: "all 0.3s",
  boxSizing: "border-box",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};
