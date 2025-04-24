import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import CategoryList from "./CategoryList.jsx";
import App from "./App.jsx";
import ProductList from "./ProductList.jsx";
import Login from "./Login.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
import HomePublic from "./HomePublic"; // ✅ novo import

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/efapi" element={<HomePublic />} /> {/* ✅ Página pública */}
        
        <Route path="/categorias" element={
          <PrivateRoute><CategoryList /></PrivateRoute>
        } />
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={
          <PrivateRoute><App /></PrivateRoute>
        } />
        <Route path="/produtos" element={
          <PrivateRoute><ProductList /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
