import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import ProductList from "./ProductList.jsx";
import Login from "./Login.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
import HomePublic from "./HomePublic";
import CategoryManager from "./pages/CategoryManager"; // ✅ corrigido

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/efapi" element={<HomePublic />} />
        <Route path="/cadastro" element={<PrivateRoute><App /></PrivateRoute>} />
        <Route path="/produtos" element={<PrivateRoute><ProductList /></PrivateRoute>} />
        <Route path="/categorias" element={<PrivateRoute><CategoryManager /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
