import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./index.css";

import SettingsManager from "./SettingsManager";
import Pedidos from "./Pedidos";
import App from "./App.jsx";
import ProductList from "./ProductList.jsx";
import Login from "./Login.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
import HomePublic from "./HomePublic";
import CategoryManager from "./pages/CategoryManager";
import EstoquePorLoja from "./pages/EstoquePorLoja";
import PaymentSettings from "./PaymentSettings.jsx";
import UserManager from "./pages/UserManager";
import Dashboard from "./Dashboard.jsx";

// 🦊 Splash screen para carregamento inicial
// eslint-disable-next-line react-refresh/only-export-components
function SplashScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom right, #e0f2f1, #f0fdf4)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      animation: "fadeIn 0.8s ease-in-out"
    }}>
      <h1 style={{ fontSize: "2.5rem", color: "#065f46", fontWeight: "bold" }}>
        ESKIMÓ CHAPECÓ
      </h1>
      <p style={{ fontSize: "1.2rem", color: "#065f46", marginTop: "1rem" }}>
        Carregando...
      </p>
    </div>
  );
}

// 🌐 App principal com rotas
// eslint-disable-next-line react-refresh/only-export-components
function MainApp() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/efapi" element={<HomePublic />} />

        {/* Painel inicial por papel/permissão */}
        <Route path="/inicio" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

        {/* Admin-only e telas com gate interno */}
        <Route path="/cadastro" element={<PrivateRoute><App /></PrivateRoute>} />
        <Route path="/produtos" element={<PrivateRoute><ProductList /></PrivateRoute>} />
        <Route path="/categorias" element={<PrivateRoute><CategoryManager /></PrivateRoute>} />
        <Route path="/configuracoes" element={<PrivateRoute><SettingsManager /></PrivateRoute>} />
        <Route path="/pedidos" element={<PrivateRoute><Pedidos /></PrivateRoute>} />
        <Route path="/estoque" element={<PrivateRoute><EstoquePorLoja /></PrivateRoute>} />
        <Route path="/pagamentos" element={<PaymentSettings />} />
        <Route path="/users" element={<UserManager />} />
      </Routes>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

// 🧠 Renderização do app
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  </StrictMode>
);
