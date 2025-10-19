/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";

const PERMISSION_PRESETS = {
  admin: {
    name: "Administrador total",
    desc: "Acesso completo a todas as áreas e permissões.",
    json: {
      can_manage_products: true,
      can_delete_products: true,
      stores: {
        efapi: { orders: true, edit_stock: true },
        palmital: { orders: true, edit_stock: true },
        passo: { orders: true, edit_stock: true },
      },
    },
  },
  operador: {
    name: "Operador de loja",
    desc: "Gerencia pedidos e estoque apenas da sua loja.",
    json: {
      can_manage_products: false,
      can_delete_products: false,
      stores: {
        efapi: { orders: true, edit_stock: true },
        palmital: { orders: false, edit_stock: false },
        passo: { orders: false, edit_stock: false },
      },
    },
  },
  financeiro: {
    name: "Financeiro",
    desc: "Pode ver pedidos, pagamentos e relatórios, sem editar produtos.",
    json: {
      can_manage_products: false,
      can_delete_products: false,
      stores: {
        efapi: { orders: true, edit_stock: false },
        palmital: { orders: true, edit_stock: false },
        passo: { orders: true, edit_stock: false },
      },
    },
  },
};

function safeJsonParse(s, fallback = {}) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}
function json(v) {
  return JSON.stringify(v, null, 2);
}

export default function UserManager() {
  const navigate = useNavigate();

  // Gate baseado em role e permissões
  const role = (localStorage.getItem("role") || "operator").toLowerCase();
  const permissions = safeJsonParse(
    localStorage.getItem("permissions") || "{}"
  );
  const canAccess =
    role === "admin" ||
    permissions.can_manage_products === true ||
    permissions.can_delete_products === true;

  if (!canAccess) {
    return (
      <div className="p-8 text-lg font-semibold text-red-600">
        Acesso restrito.
      </div>
    );
  }

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [preset, setPreset] = useState("");
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    id: null,
    username: "",
    email: "",
    password: "",
    role: "operator",
    isEnabled: true,
    permissionsJson: "{}",
    newPassword: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user");
      const d = res?.data;
      const list =
        Array.isArray(d)
          ? d
          : Array.isArray(d?.items)
          ? d.items
          : Array.isArray(d?.users)
          ? d.users
          : [];
      setUsers(list);
    } catch (e) {
      console.error(
        "GET /user failed:",
        e?.response?.status,
        e?.response?.data
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const resetForm = () => {
    setForm({
      id: null,
      username: "",
      email: "",
      password: "",
      role: "operator",
      isEnabled: true,
      permissionsJson: "{}",
      newPassword: "",
    });
    setPreset("");
    setEditing(false);
  };

  const applyPreset = (key) => {
    const preset = PERMISSION_PRESETS[key];
    if (!preset) return;
    setForm((f) => ({
      ...f,
      permissionsJson: json(preset.json),
    }));
    setPreset(key);
  };

  const edit = (u) => {
    setEditing(true);
    setForm({
      id: u.id,
      username: u.username || "",
      email: u.email || "",
      password: "",
      role: (u.role || "operator").toLowerCase(),
      isEnabled: !!u.isEnabled,
      permissionsJson: u.permissions || u.permissionsJson || "{}",
      newPassword: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = async (id) => {
    const target = users.find((x) => x.id === id);
    if (target?.email?.toLowerCase() === "admin@eskimo.com") {
      alert("Não é permitido excluir o administrador raiz.");
      return;
    }
    if (!confirm("Confirmar exclusão do usuário?")) return;
    try {
      await api.delete(`/user/${id}`);
      await fetchUsers();
      setToast("Usuário excluído!");
    } catch (e) {
      console.error(
        "DELETE /user/{id} failed:",
        e?.response?.status,
        e?.response?.data
      );
      alert("Erro ao excluir usuário.");
    }
  };

  const toggleEnabled = async (u) => {
    if (u.email?.toLowerCase() === "admin@eskimo.com" && u.isEnabled) {
      alert("Não é permitido desativar o administrador raiz.");
      return;
    }
    try {
      await api.put(`/user/${u.id}`, { isEnabled: !u.isEnabled });
      await fetchUsers();
    } catch {
      alert("Erro ao atualizar status.");
    }
  };

  const countActiveAdmins = useMemo(
    () =>
      (users || []).filter(
        (u) =>
          (u?.role || "").toLowerCase() === "admin" && u?.isEnabled
      ).length,
    [users]
  );

  const save = async () => {
    if (editing) {
      const original = users.find((u) => u.id === form.id);
      const unicoAdminAtivo =
        countActiveAdmins === 1 &&
        (original?.role || "").toLowerCase() === "admin" &&
        original?.isEnabled;

      if (unicoAdminAtivo) {
        if (form.role !== "admin") {
          alert("Não é permitido remover o único administrador ativo.");
          return;
        }
        if (original.isEnabled && form.isEnabled === false) {
          alert("Não é permitido desativar o único administrador ativo.");
          return;
        }
      }
    }

    const payload = {
      username: form.username?.trim() || form.email?.trim(),
      email: form.email?.trim(),
      role: (form.role || "operator").toLowerCase(),
      isEnabled: !!form.isEnabled,
      permissionsJson: form.permissionsJson || "{}",
    };

    try {
      if (editing) {
        if (form.newPassword?.trim())
          payload.newPassword = form.newPassword.trim();
        await api.put(`/user/${form.id}`, payload);
      } else {
        if (!form.password?.trim()) {
          alert("Senha é obrigatória para criar usuário.");
          return;
        }
        await api.post("/user", { ...payload, password: form.password.trim() });
      }
      await fetchUsers();
      setToast(
        editing
          ? "Usuário atualizado com sucesso!"
          : "Usuário criado com sucesso!"
      );
      resetForm();
      // permanece na mesma página
    } catch (e) {
      console.error("SAVE user failed:", e?.response?.status, e?.response?.data);
      alert("Erro ao salvar usuário.");
    }
  };

  const describePermissions = (p) => {
    const perms = safeJsonParse(p.permissions || p.permissionsJson || "{}");
    const stores = perms.stores || {};
    const access = [];
    for (const loja in stores) {
      const s = stores[loja];
      if (s.orders || s.edit_stock)
        access.push(
          `${loja}: ${s.orders ? "Pedidos" : ""}${s.orders && s.edit_stock ? " e " : ""}${
            s.edit_stock ? "Estoque" : ""
          }`
        );
    }
    const produtos = perms.can_manage_products
      ? "Gerencia produtos"
      : "Sem acesso a produtos";
    return `${produtos}${
      access.length ? " • Lojas: " + access.join(", ") : ""
    }`;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-gray-50 py-10 px-4 text-gray-800">
      <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">
          👥 Usuários e Permissões
        </h1>
        <button
            onClick={() => navigate(-1)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Voltar
          </button>
        </div>

        {toast && (
          <div className="mb-4 rounded-md bg-green-600 px-4 py-2 text-sm text-white shadow">
            {toast}
          </div>
        )}

        {/* Formulário */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                placeholder="Nome do usuário"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="email@dominio.com"
                type="email"
              />
            </div>

            {!editing && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Senha
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="Senha inicial"
                  type="password"
                />
              </div>
            )}

            {editing && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Nova senha (opcional)
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  placeholder="Digite para trocar a senha"
                  type="password"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">Papel</label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
              >
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isenabled"
                type="checkbox"
                checked={form.isEnabled}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isEnabled: e.target.checked }))
                }
              />
              <label htmlFor="isenabled" className="text-sm text-gray-700">
                Ativo
              </label>
            </div>
          </div>

          {/* Presets */}
          <div className="mt-6">
            <label className="text-sm font-semibold text-gray-700">
              Modelos de permissão
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {Object.entries(PERMISSION_PRESETS).map(([k, v]) => (
                <div
                  key={k}
                  onClick={() => applyPreset(k)}
                  className={`cursor-pointer rounded-xl border p-4 text-center shadow-sm transition-transform hover:scale-[1.02] ${
                    preset === k
                      ? "bg-green-50 border-green-600"
                      : "bg-white border-gray-200 hover:border-green-400"
                  }`}
                >
                  <div className="text-lg font-semibold text-gray-800">
                    {v.name}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{v.desc}</div>
                  {preset === k && (
                    <div className="mt-2 text-xs font-semibold text-green-600">
                      ✅ Selecionado
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Permissões detalhadas */}
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-700">
              Permissões por loja
            </label>

            {["efapi", "palmital", "passo"].map((loja) => {
              const perms = safeJsonParse(form.permissionsJson || "{}");
              const lojaPerms = perms.stores?.[loja] || {
                orders: false,
                edit_stock: false,
              };
              const updatePerm = (field, value) => {
                const copy = safeJsonParse(form.permissionsJson || "{}");
                copy.stores = copy.stores || {};
                copy.stores[loja] = { ...lojaPerms, [field]: value };
                setForm((f) => ({ ...f, permissionsJson: json(copy) }));
              };
              return (
                <div
                  key={loja}
                  className="mt-2 rounded-md border bg-gray-50 p-3"
                >
                  <div className="mb-2 capitalize text-gray-800 font-semibold">
                    {loja}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!lojaPerms.orders}
                        onChange={(e) => updatePerm("orders", e.target.checked)}
                      />
                      Pedidos
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!lojaPerms.edit_stock}
                        onChange={(e) =>
                          updatePerm("edit_stock", e.target.checked)
                        }
                      />
                      Estoque
                    </label>
                  </div>
                </div>
              );
            })}

            {/* Permissões gerais */}
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    safeJsonParse(form.permissionsJson || "{}")
                      .can_manage_products || false
                  }
                  onChange={(e) => {
                    const copy = safeJsonParse(form.permissionsJson || "{}");
                    copy.can_manage_products = e.target.checked;
                    setForm((f) => ({ ...f, permissionsJson: json(copy) }));
                  }}
                />
                Pode gerenciar produtos
              </label>

              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    safeJsonParse(form.permissionsJson || "{}")
                      .can_delete_products || false
                  }
                  onChange={(e) => {
                    const copy = safeJsonParse(form.permissionsJson || "{}");
                    copy.can_delete_products = e.target.checked;
                    setForm((f) => ({ ...f, permissionsJson: json(copy) }));
                  }}
                />
                Pode excluir produtos
              </label>
            </div>
          </div>

          {/* Campo JSON original, só para debug avançado */}
          <div className="mt-6">
            <label className="text-xs font-medium text-gray-500">
              Permissões (JSON bruto)
            </label>
            <textarea
              className="mt-1 h-24 w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-xs font-mono"
              value={form.permissionsJson}
              onChange={(e) =>
                setForm((f) => ({ ...f, permissionsJson: e.target.value }))
              }
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={save}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              {editing ? "Salvar alterações" : "Criar usuário"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista de usuários
            </h2>
            <button
              onClick={fetchUsers}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
            >
              Recarregar
            </button>
          </div>

          {loading ? (
            <div className="text-gray-500">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="text-gray-500">Nenhum usuário encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Papel</th>
                    <th className="px-3 py-2">Ativo</th>
                    <th className="px-3 py-2">O que pode fazer</th>
                    <th className="px-3 py-2">Permissões (JSON)</th>
                    <th className="px-3 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const perms = safeJsonParse(
                      u.permissions || u.permissionsJson || "{}"
                    );
                    const isEditing = editing && form.id === u.id;
                    return (
                      <tr
                        key={u.id}
                        className={`border-t transition-colors ${
                          isEditing ? "bg-yellow-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-3 py-2 font-semibold">{u.id}</td>
                        <td className="px-3 py-2">{u.username}</td>
                        <td className="px-3 py-2">{u.email}</td>
                        <td className="px-3 py-2 capitalize">{u.role}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                              u.isEnabled
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {u.isEnabled ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700">
                          {describePermissions(u)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          <details>
                            <summary className="cursor-pointer select-none text-blue-600">
                              Ver JSON
                            </summary>
                            <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px]">
                              {json(perms)}
                            </pre>
                          </details>
                        </td>
                        <td className="flex gap-2 px-3 py-2">
                          <button
                            onClick={() => edit(u)}
                            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => toggleEnabled(u)}
                            className={`rounded-md px-3 py-1 text-xs font-semibold text-white ${
                              u.isEnabled
                                ? "bg-amber-600 hover:bg-amber-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {u.isEnabled ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            onClick={() => del(u.id)}
                            className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
