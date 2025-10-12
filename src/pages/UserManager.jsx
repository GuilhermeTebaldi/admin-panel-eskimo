import React, { useEffect, useState } from "react";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";

function safeJsonParse(s, fallback = {}) {
  try { return JSON.parse(s); } catch { return fallback; }
}

function json(v) {
  return JSON.stringify(v, null, 2);
}

export default function UserManager() {
  const navigate = useNavigate();

  // gate admin-only
  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";
  if (!isAdmin) return <div className="p-8">Acesso restrito ao administrador.</div>;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [users, setUsers] = useState([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [form, setForm] = useState({
    id: null,
    username: "",
    email: "",
    password: "",
    role: "operator",
    isEnabled: true,
    permissionsJson: "{}",
  });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [editing, setEditing] = useState(false);

  const load = async () => {
    const { data } = await api.get("/user");
    setUsers(Array.isArray(data) ? data : []);
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { load(); }, []);

  const reset = () => setForm({
    id: null,
    username: "",
    email: "",
    password: "",
    role: "operator",
    isEnabled: true,
    permissionsJson: "{}",
  });

  const countActiveAdmins = (list) =>
    (list || []).filter((u) => u?.role === "admin" && u?.isEnabled).length;

  const save = async () => {
    // bloqueios de segurança do "único admin"
    const currentAdmins = countActiveAdmins(users);

    if (editing) {
      const original = users.find((u) => u.id === form.id);
      if (original?.role === "admin" && original?.isEnabled) {
        // não pode remover o único admin ativo
        if (currentAdmins === 1) {
          // trocando role para operator?
          if (form.role !== "admin") {
            alert("Não é permitido remover o único administrador.");
            return;
          }
          // desativando o único admin?
          if (form.isEnabled === false) {
            alert("Não é permitido desativar o único administrador.");
            return;
          }
        }
      }
    } else {
      // criação: se marcar admin, ok; se operator, ok. Sem bloqueio aqui.
    }

    // valida JSON de permissões
    const pj = form.permissionsJson?.trim() || "{}";
    safeJsonParse(pj);

    if (editing) {
      await api.put(`/user/${form.id}`, {
        username: form.username,
        email: form.email,
        role: form.role,
        isEnabled: form.isEnabled,
        permissionsJson: pj,
        newPassword: form.password ? form.password : undefined,
      });
    } else {
      await api.post(`/user`, {
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        isEnabled: form.isEnabled,
        permissionsJson: pj,
      });
    }
    await load(); reset(); setEditing(false);
    alert("✅ Usuário salvo.");
    navigate("/cadastro");
  };

  const edit = (u) => {
    setEditing(true);
    setForm({
      id: u.id,
      username: u.username || "",
      email: u.email || "",
      password: "",
      role: u.role || "operator",
      isEnabled: !!u.isEnabled,
      permissionsJson: u.permissions || "{}",
    });
  };

  const removeUser = async (id) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    // bloqueio: não pode apagar o único admin ativo
    if (target.role === "admin" && target.isEnabled && countActiveAdmins(users) === 1) {
      alert("Não é permitido excluir o único administrador ativo.");
      return;
    }
    if (!confirm("Excluir este usuário?")) return;
    await api.delete(`/user/${id}`);
    await load();
  };

  const toggleEnabled = async (u) => {
    // bloqueio: não pode desativar o único admin ativo
    if (u.role === "admin" && u.isEnabled && countActiveAdmins(users) === 1) {
      alert("Não é permitido desativar o único administrador.");
      return;
    }
    await api.put(`/user/${u.id}`, { isEnabled: !u.isEnabled });
    await load();
  };

  // presets de permissões (apenas para operator). Para admin o JSON é ignorado.
  const setPreset = (preset) => {
    if (preset === "ADMIN_TOTAL") {
      setForm((f) => ({
        ...f,
        role: "admin",
        isEnabled: true,
        permissionsJson: "{}", // ignorado para admin
      }));
      return;
    }

    const base = {
      can_manage_products: false,
      can_delete_products: false,
      stores: {
        efapi: { orders: false, edit_stock: false },
        palmital: { orders: false, edit_stock: false },
        passo: { orders: false, edit_stock: false },
      },
    };

    const apply = (mutate) => {
      const cfg = JSON.parse(JSON.stringify(base));
      mutate(cfg);
      setForm((f) => ({
        ...f,
        role: f.role === "admin" ? "operator" : f.role, // garante operator para usar JSON
        permissionsJson: json(cfg),
      }));
    };

    switch (preset) {
      case "SEM_ACESSO":
        apply(() => {});
        break;

      case "PEDIDOS_TODAS":
        apply((c) => {
          c.stores.efapi.orders = true;
          c.stores.palmital.orders = true;
          c.stores.passo.orders = true;
        });
        break;

      case "PEDIDOS_ESTOQUE_TODAS":
        apply((c) => {
          ["efapi", "palmital", "passo"].forEach((s) => {
            c.stores[s].orders = true;
            c.stores[s].edit_stock = true;
          });
        });
        break;

      case "EFAPI_PEDIDOS_ESTOQUE":
        apply((c) => { c.stores.efapi.orders = true; c.stores.efapi.edit_stock = true; });
        break;

      case "PALMITAL_PEDIDOS_ESTOQUE":
        apply((c) => { c.stores.palmital.orders = true; c.stores.palmital.edit_stock = true; });
        break;

      case "PASSO_PEDIDOS_ESTOQUE":
        apply((c) => { c.stores.passo.orders = true; c.stores.passo.edit_stock = true; });
        break;

      case "SO_PEDIDOS_TODAS":
        apply((c) => {
          ["efapi", "palmital", "passo"].forEach((s) => { c.stores[s].orders = true; });
        });
        break;

      case "GESTAO_PRODUTOS_SEM_DELETAR":
        apply((c) => {
          c.can_manage_products = true;
          ["efapi", "palmital", "passo"].forEach((s) => {
            c.stores[s].orders = true;
            c.stores[s].edit_stock = true;
          });
        });
        break;

      case "PODE_DELETAR_PRODUTOS":
        apply((c) => {
          c.can_manage_products = true;
          c.can_delete_products = true;
          ["efapi", "palmital", "passo"].forEach((s) => {
            c.stores[s].orders = true;
            c.stores[s].edit_stock = true;
          });
        });
        break;

      case "OPERADOR_SEM_ESTOQUE":
        apply((c) => {
          ["efapi", "palmital", "passo"].forEach((s) => {
            c.stores[s].orders = true;
            c.stores[s].edit_stock = false;
          });
        });
        break;

      default:
        apply(() => {});
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-800">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/cadastro")}
          className="rounded-md border border-gray-300 bg-white px-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold">👥 Usuários e Permissões</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">
            {editing ? "Editar Usuário" : "Novo Usuário"}
          </h2>

          <div className="grid grid-cols-1 gap-3">
            <input
              className="border rounded p-2"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="border rounded p-2"
              type="password"
              placeholder={editing ? "Nova senha (opcional)" : "Senha"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <div className="flex items-center gap-3">
              <select
                className="border rounded p-2"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="operator">operator</option>
                <option value="admin">admin</option>
              </select>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isEnabled}
                  onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                />
                Ativo
              </label>
            </div>

            {/* Presets */}
            <div className="rounded border p-3">
              <div className="text-sm font-semibold mb-2">Presets rápidos</div>
              <div className="flex flex-wrap gap-2">
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setPreset("ADMIN_TOTAL")}>
                  👑 Admin total
                </button>
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setPreset("SEM_ACESSO")}>
                  🔒 Sem acesso extra
                </button>
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setPreset("PEDIDOS_TODAS")}>
                  🧾 Pedidos (todas as lojas)
                </button>
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setPreset("SO_PEDIDOS_TODAS")}>
                  👀 Somente pedidos
                </button>
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setPreset("PEDIDOS_ESTOQUE_TODAS")}>
                  🧾+📦 Pedidos+Estoque (todas)
                </button>
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setPreset("EFAPI_PEDIDOS_ESTOQUE")}>
                  Efapi pedidos+estoque
                </button>
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setPreset("PALMITAL_PEDIDOS_ESTOQUE")}>
                  Palmital pedidos+estoque
                </button>
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setPreset("PASSO_PEDIDOS_ESTOQUE")}>
                  Passo pedidos+estoque
                </button>
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setPreset("OPERADOR_SEM_ESTOQUE")}>
                  Operador: sem estoque
                </button>
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setPreset("GESTAO_PRODUTOS_SEM_DELETAR")}>
                  🧰 Gestão produtos (sem deletar)
                </button>
                <button className="rounded border px-3 py-1 text-sm" onClick={() => setPreset("PODE_DELETAR_PRODUTOS")}>
                  ❗️Pode deletar produtos
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Observação: para <b>admin</b>, o JSON de permissões é ignorado. Admin já tem tudo por padrão.
              </p>
            </div>

            <label className="text-sm font-medium">Permissões (JSON)</label>
            <textarea
              className="border rounded p-2 font-mono text-sm min-h-[140px]"
              value={form.permissionsJson}
              onChange={(e) => setForm({ ...form, permissionsJson: e.target.value })}
            />

            <div className="flex gap-2">
              <button onClick={save} className="bg-green-600 text-white rounded px-4 py-2">
                💾 Salvar
              </button>
              {editing && (
                <button onClick={() => { reset(); setEditing(false); }} className="bg-gray-200 rounded px-4 py-2">
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Cadastrados</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-green-100 text-green-900">
                <tr>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Username</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Role</th>
                  <th className="p-2 text-left">Ativo</th>
                  <th className="p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.id}</td>
                    <td className="p-2">{u.username}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2">
                      <button
                        onClick={() => toggleEnabled(u)}
                        className={`rounded px-2 py-1 text-xs ${u.isEnabled ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                        title={u.role === "admin" && u.isEnabled && countActiveAdmins(users) === 1 ? "Não é permitido desativar o único admin" : ""}
                      >
                        {u.isEnabled ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => edit(u)} className="text-blue-600 hover:underline">✏️</button>
                      <button
                        onClick={() => removeUser(u.id)}
                        className="text-red-600 hover:underline"
                        title={u.role === "admin" && u.isEnabled && countActiveAdmins(users) === 1 ? "Não é permitido excluir o único admin" : ""}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold">
              Ver permissões (JSON) dos usuários
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
{JSON.stringify(users.map(u => ({
  id: u.id,
  username: u.username,
  role: u.role,
  isEnabled: u.isEnabled,
  permissions: safeJsonParse(u.permissions)
})), null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
