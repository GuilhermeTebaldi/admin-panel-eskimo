import React, { useEffect, useState } from "react";
import api from "@/services/api";

function safeJsonParse(s, fallback = {}) {
  try { return JSON.parse(s); } catch { return fallback; }
}

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ id: null, username: "", email: "", password: "", role: "operator", isEnabled: true, permissionsJson: "{}" });
  const [editing, setEditing] = useState(false);

  // gate admin-only
  

  const load = async () => {
    const { data } = await api.get("/user");
    setUsers(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const reset = () => setForm({ id: null, username: "", email: "", password: "", role: "operator", isEnabled: true, permissionsJson: "{}" });

  const save = async () => {
    // valida JSON
    const pj = form.permissionsJson?.trim() || "{}";
    safeJsonParse(pj); // lança fallback se inválido
    if (editing) {
      await api.put(`/user/${form.id}`, {
        username: form.username, email: form.email, role: form.role,
        isEnabled: form.isEnabled, permissionsJson: pj,
        newPassword: form.password ? form.password : undefined
      });
    } else {
      await api.post(`/user`, {
        username: form.username, email: form.email, password: form.password,
        role: form.role, isEnabled: form.isEnabled, permissionsJson: pj
      });
    }
    await load(); reset(); setEditing(false);
    alert("✅ Usuário salvo.");
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
    if (!confirm("Excluir este usuário?")) return;
    await api.delete(`/user/${id}`);
    await load();
  };

  const toggleEnabled = async (u) => {
    await api.put(`/user/${u.id}`, { isEnabled: !u.isEnabled });
    await load();
  };
  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";
  if (!isAdmin) return <div className="p-8">Acesso restrito ao administrador.</div>;
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-800">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="rounded-md border border-gray-300 bg-white px-4 py-1 text-sm text-gray-600 hover:bg-gray-100">← Voltar</button>
        <h1 className="text-2xl font-bold">👥 Usuários e Permissões</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">{editing ? "Editar Usuário" : "Novo Usuário"}</h2>
          <div className="grid grid-cols-1 gap-3">
            <input className="border rounded p-2" placeholder="Username" value={form.username} onChange={e=>setForm({...form, username:e.target.value})}/>
            <input className="border rounded p-2" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
            <input className="border rounded p-2" type="password" placeholder={editing ? "Nova senha (opcional)" : "Senha"} value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
            <div className="flex items-center gap-3">
              <select className="border rounded p-2" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
                <option value="operator">operator</option>
                <option value="admin">admin</option>
              </select>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isEnabled} onChange={e=>setForm({...form, isEnabled:e.target.checked})}/>
                Ativo
              </label>
            </div>
            <label className="text-sm font-medium">Permissões (JSON)</label>
            <textarea className="border rounded p-2 font-mono text-sm min-h-[140px]" value={form.permissionsJson} onChange={e=>setForm({...form, permissionsJson:e.target.value})}/>
            <div className="flex gap-2">
              <button onClick={save} className="bg-green-600 text-white rounded px-4 py-2">💾 Salvar</button>
              {editing && <button onClick={()=>{reset(); setEditing(false);}} className="bg-gray-200 rounded px-4 py-2">Cancelar</button>}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">Exemplo de permissões: {"{ \"can_manage_products\":true, \"can_delete_products\":false, \"stores\": { \"efapi\": { \"orders\":true, \"edit_stock\":true }, \"palmital\": { \"orders\":false, \"edit_stock\":false }, \"passo\": { \"orders\":true, \"edit_stock\":true } } }"}</p>
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
                {users.map(u=>(
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.id}</td>
                    <td className="p-2">{u.username}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2">
                      <button onClick={()=>toggleEnabled(u)} className={`rounded px-2 py-1 text-xs ${u.isEnabled?"bg-blue-600 text-white":"bg-gray-200"}`}>
                        {u.isEnabled ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                    <td className="p-2 flex gap-2">
                      <button onClick={()=>edit(u)} className="text-blue-600 hover:underline">✏️</button>
                      <button onClick={()=>removeUser(u.id)} className="text-red-600 hover:underline">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold">Ver permissões (JSON) dos usuários</summary>
            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
{JSON.stringify(users.map(u=>({id:u.id, username:u.username, role:u.role, isEnabled:u.isEnabled, permissions:safeJsonParse(u.permissions)})), null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
