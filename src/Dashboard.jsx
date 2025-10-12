import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

function parsePerms() {
  try { return JSON.parse(localStorage.getItem("permissions") || "{}"); }
  catch { return {}; }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "operator";
  const isAdmin = role === "admin";
  const perms = useMemo(parsePerms, []);

  const anyOrders =
    !!(perms?.stores?.efapi?.orders ||
       perms?.stores?.palmital?.orders ||
       perms?.stores?.passo?.orders);

  const anyEditStock =
    !!(perms?.stores?.efapi?.edit_stock ||
       perms?.stores?.palmital?.edit_stock ||
       perms?.stores?.passo?.edit_stock);

  const canManageProducts = !!perms?.can_manage_products;

  const go = (path) => () => navigate(path);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Início</h1>
        <button onClick={logout} className="rounded bg-red-600 px-3 py-1 text-white">Sair</button>
      </div>

      <p className="mb-6 text-sm text-gray-600">
        Perfil: <b>{isAdmin ? "admin" : "operator"}</b>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isAdmin && (
          <>
            <button onClick={go("/cadastro")} className="rounded border bg-white p-4 text-left hover:bg-gray-50">
              <div className="text-lg font-semibold">📦 Cadastro de Produto</div>
              <div className="text-xs text-gray-600">Criar produtos e definir estoque por loja</div>
            </button>
            <button onClick={go("/produtos")} className="rounded border bg-white p-4 text-left hover:bg-gray-50">
              <div className="text-lg font-semibold">🧾 Produtos + Ranking</div>
              <div className="text-xs text-gray-600">Editar, ordenar, preços rápidos</div>
            </button>
            <button onClick={go("/categorias")} className="rounded border bg-white p-4 text-left hover:bg-gray-50">
              <div className="text-lg font-semibold">📂 Categorias</div>
              <div className="text-xs text-gray-600">Gerenciar categorias e subcategorias</div>
            </button>
            <button onClick={go("/configuracoes")} className="rounded border bg-white p-4 text-left hover:bg-gray-50">
              <div className="text-lg font-semibold">🚚 Configurações de Entrega</div>
              <div className="text-xs text-gray-600">Entrega, taxas e opções</div>
            </button>
            <button onClick={go("/pagamentos")} className="rounded border bg-white p-4 text-left hover:bg-gray-50">
              <div className="text-lg font-semibold">💳 Pagamentos e WhatsApp</div>
              <div className="text-xs text-gray-600">CNPJ, Mercado Pago, WhatsApp por loja</div>
            </button>
            <button onClick={go("/users")} className="rounded border bg-white p-4 text-left hover:bg-gray-50">
              <div className="text-lg font-semibold">👥 Usuários e Permissões</div>
              <div className="text-xs text-gray-600">Gerenciar contas, papéis e acessos</div>
            </button>
          </>
        )}

        {(isAdmin || canManageProducts) && (
          <button onClick={go("/produtos")} className="rounded border bg-white p-4 text-left hover:bg-gray-50">
            <div className="text-lg font-semibold">🧾 Produtos + Ranking</div>
            <div className="text-xs text-gray-600">Editar e ordenar</div>
          </button>
        )}

        {(isAdmin || anyEditStock) && (
          <button onClick={go("/estoque")} className="rounded border bg-white p-4 text-left hover:bg-gray-50">
            <div className="text-lg font-semibold">🏪 Estoque por Loja</div>
            <div className="text-xs text-gray-600">Editar estoque conforme permissão</div>
          </button>
        )}

        {(isAdmin || anyOrders) && (
          <button onClick={go("/pedidos")} className="rounded border bg-white p-4 text-left hover:bg-gray-50">
            <div className="text-lg font-semibold">✅ Pedidos</div>
            <div className="text-xs text-gray-600">Acessar pedidos conforme permissão</div>
          </button>
        )}
      </div>

      {!isAdmin && !(canManageProducts || anyEditStock || anyOrders) && (
        <p className="mt-6 text-sm text-red-700">
          Sem permissões ativas. Solicite ao administrador.
        </p>
      )}
    </div>
  );
}
