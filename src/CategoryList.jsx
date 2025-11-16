import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = "https://backend-eskimo.onrender.com/api/categories";

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }), []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, { headers: authHeaders });
      setCategories(res.data || []);
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSaving(true);
      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          { name },
          { headers: authHeaders },
        );
      } else {
        await axios.post(API_URL, { name }, { headers: authHeaders });
      }
      setName("");
      setEditingId(null);
      await fetchCategories();
    } catch (err) {
      console.error("Erro ao salvar categoria:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja excluir esta categoria?")) return;
    try {
      setDeletingId(id);
      await axios.delete(`${API_URL}/${id}`, { headers: authHeaders });
      await fetchCategories();
    } catch (err) {
      console.error("Erro ao excluir categoria:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (category) => {
    setName(category.name);
    setEditingId(category.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-emerald-500">Catálogo</p>
              <h1 className="text-3xl font-black text-emerald-900">📂 Gerenciar Categorias</h1>
              <p className="text-sm text-emerald-900/70">
                Adicione, atualize ou remova categorias para organizar melhor os produtos da loja.
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-5 py-3 text-emerald-700 shadow-inner">
              <p className="text-xs uppercase tracking-wide text-emerald-500">Total</p>
              <p className="text-3xl font-bold">{categories.length}</p>
              <p className="text-[11px] text-emerald-600">categorias cadastradas</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1fr,1.4fr]">
          <div className="rounded-3xl border border-emerald-50 bg-white/90 p-6 shadow">
            <h2 className="text-lg font-semibold text-emerald-900">
              {editingId ? "Editar Categoria" : "Nova Categoria"}
            </h2>
            <p className="text-sm text-gray-500">
              Defina um nome e clique em salvar para publicar.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="space-y-2">
                <label htmlFor="category-name" className="text-sm font-semibold text-slate-700">
                  Nome da Categoria
                </label>
                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Sorvetes Premium"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-60"
                >
                  {saving ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setName("");
                    }}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-emerald-50 bg-white/95 p-4 shadow space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-emerald-900">Categorias cadastradas</h2>
              <span className="text-xs text-gray-500">Clique para editar ou excluir</span>
            </div>
            <div className="max-h-[420px] overflow-auto pr-1">
              {loading ? (
                <p className="text-sm text-gray-500">Carregando categorias…</p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma categoria cadastrada.</p>
              ) : (
                <div className="divide-y divide-emerald-50">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="font-medium text-emerald-900">{cat.name}</p>
                        <p className="text-xs text-gray-500">#{String(cat.id).padStart(4, "0")}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(cat)}
                          className="rounded-full border border-slate-200 px-4 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === cat.id}
                          onClick={() => handleDelete(cat.id)}
                          className="rounded-full bg-rose-500 px-4 py-1 text-sm font-semibold text-white shadow hover:bg-rose-600 disabled:opacity-60"
                        >
                          {deletingId === cat.id ? "Excluindo…" : "Excluir"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
