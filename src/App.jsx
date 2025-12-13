/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";

function decodeJwt(token) {
  try {
    const part = (token.split(".")[1] || "");
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}

function getDisplayName() {
  const cached = localStorage.getItem("username");
  if (cached && cached.trim()) return cached.trim();

  const token = localStorage.getItem("token") || "";
  const payload = decodeJwt(token);

  const name =
    payload.name ||
    payload.unique_name ||
    payload.username ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    "";

  const email =
    payload.email ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
    "";

  const chosen = String(name || email || "").trim();
  if (chosen) localStorage.setItem("username", chosen);
  return chosen || "Usuário";
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-slate-600">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">Acesso restrito</h1>
          <p className="mt-2 text-sm">Esta área é exclusiva para administradores.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  const displayName = useMemo(() => getDisplayName(), []);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    categoryId: "",
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [subcategoryId, setSubcategoryId] = useState("");
  const [estoques, setEstoques] = useState({ efapi: 1, palmital: 1, passo: 1 });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const checkSync = async () => {
      const precisaAtualizar = localStorage.getItem("categoriasAtualizadas");
      if (precisaAtualizar === "true") {
        await fetchCategories();
        localStorage.removeItem("categoriasAtualizadas");
      }
    };
    fetchCategories();
    fetchSubcategories();
    checkSync();
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await api.get("/categories");
      setCategories(result.data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const result = await api.get("/subcategories");
      setSubcategories(result.data);
    } catch (error) {
      console.error("Erro ao carregar subcategorias:", error);
    }
  };

  useEffect(() => {
    const cid = Number.parseInt(form.categoryId);
    const filtered = subcategories.filter((s) => s.categoryId === cid);
    setFilteredSubcategories(filtered);
    setSubcategoryId("");
  }, [form.categoryId, subcategories]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEstoqueChange = (store, value) => {
    setEstoques((prev) => ({
      ...prev,
      [store]: Number.parseInt(value) || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const price = Number.parseFloat(String(form.price).replace(",", ".")) || 0;
    const categoryId = Number.parseInt(form.categoryId) || null;
    const subId = subcategoryId ? Number.parseInt(subcategoryId) : null;

    const data = {
      name: form.name,
      description: form.description,
      price,
      imageUrl: form.imageUrl,
      categoryId,
      subcategoryId: subId,
    };

    try {
      const res = await api.post("/products", data);
      const productId = res.data.id;
      await api.post(`/stock/${productId}`, estoques);

      alert("✅ Produto cadastrado com sucesso!");
      setForm({ name: "", description: "", price: "", imageUrl: "", categoryId: "" });
      setSubcategoryId("");
      setEstoques({ efapi: 0, palmital: 0, passo: 0 });
      setShowForm(false);
    } catch (error) {
      console.error("Erro:", error?.response?.data || error?.message);
      alert("❌ Erro ao salvar produto.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-3xl border border-emerald-100/70 bg-white/80 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Painel de produtos</p>
              <h1 className="text-3xl font-black text-emerald-900">Eskimó</h1>
              <p className="text-sm text-emerald-900/70">
                Cadastre novos itens, defina estoque por loja e navegue para as principais ferramentas de operação.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <div className="text-xs uppercase tracking-wide text-slate-400">Logado como</div>
              <div className="text-lg font-semibold text-emerald-700">{displayName}</div>
              <button
                onClick={handleLogout}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-rose-600"
              >
                🚪 Sair
              </button>
            </div>
          </div>
        </header>

        <div className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Atalhos rápidos</p>
              <h3 className="text-xl font-semibold text-slate-900">Fluxo diário</h3>
              <p className="text-sm text-slate-500">
                Use os botões abaixo para navegar pelas áreas mais usadas do painel.
              </p>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/produtos")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  📦 Produtos, Ranking & Preço
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/estoque")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  🏪 Estoque & Arquivados
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/pedidos")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  ✅ Ver pedidos
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/clientes")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  👥 Dashboard de clientes
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Configurações</p>
              <h3 className="text-xl font-semibold text-slate-900">Ajustes e ferramentas</h3>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/configuracoes")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  ⚙️ Entrega, ping & horários
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/categorias")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  🗂 Categorias
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/pagamentos#whatsapp")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  📲 Pagamentos & WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/impressoras")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  🖨️ Impressoras
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/users")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  👤 Usuários & permissões
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-center">
            <h3 className="text-lg font-semibold text-emerald-800">Cadastro de produto</h3>
            <p className="text-sm text-emerald-700">
              Abra o formulário quando quiser cadastrar ou editar um item.
            </p>
            <button
              onClick={() => setShowForm((prev) => !prev)}
              className="mt-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow hover:from-emerald-600 hover:to-emerald-700"
            >
              {showForm ? "Fechar cadastro" : "Cadastrar produto"}
            </button>
          </div>

          <div
            className={`overflow-hidden rounded-3xl border border-slate-100 bg-white/80 shadow-inner transition-all duration-500 ${
              showForm ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className={showForm ? "p-6" : "p-0"}>
              <h2 className="text-2xl font-bold text-emerald-900">Cadastro de produto</h2>
              <p className="text-sm text-slate-500">
                Preencha os campos abaixo para adicionar um novo item ao catálogo.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 grid gap-6 md:grid-cols-2">
                <Input label="Nome" name="name" value={form.name} onChange={handleChange} />
                <Input label="Descrição" name="description" value={form.description} onChange={handleChange} />
                <Input label="Preço" name="price" value={form.price} onChange={handleChange} />
                <Input label="Imagem (URL)" name="imageUrl" value={form.imageUrl} onChange={handleChange} />

                <Dropdown
                  label="Categoria"
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  options={categories}
                  required
                />

                <Dropdown
                  label="Subcategoria"
                  name="subcategoryId"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  options={filteredSubcategories}
                  required={false}
                />

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Estoque por loja
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {Object.keys(estoques).map((store) => (
                      <div key={store} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <label className="text-xs uppercase tracking-wide text-slate-500">
                          {store.charAt(0).toUpperCase() + store.slice(1)}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={estoques[store]}
                          onChange={(e) => handleEstoqueChange(store, e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 grid gap-2">
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:from-emerald-600 hover:to-emerald-700"
                  >
                    Cadastrar produto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const baseInputStyle = {
  display: "flex",
  flexDirection: "column",
  textAlign: "left",
};

function Input({ label, name, value, onChange }) {
  return (
    <div style={baseInputStyle}>
      <label htmlFor={name} style={labelStyle}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required
        style={inputStyle}
      />
    </div>
  );
}

function Dropdown({ label, name, value, onChange, options, required = true }) {
  return (
    <div style={baseInputStyle}>
      <label style={labelStyle}>{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        style={inputStyle}
        required={required}
      >
        <option value="">{required ? "Selecione..." : "Opcional"}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}

const labelStyle = {
  marginBottom: "0.25rem",
  fontSize: "0.85rem",
  color: "#475569",
};

const inputStyle = {
  width: "100%",
  padding: "0.8rem 1rem",
  borderRadius: "0.9rem",
  border: "1px solid #c7d2fe",
  background: "#f8fafc",
  color: "#0f172a",
  fontSize: "1rem",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.2s ease",
};
