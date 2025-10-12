import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const role = (localStorage.getItem("role") || "operator").toLowerCase();

  const permissions = useMemo(() => {
    try {
      const raw = localStorage.getItem("permissions") || "{}";
      return typeof raw === "string" ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const canManageProducts = !!permissions?.can_manage_products;

  const stores = permissions?.stores || {};
  const efapi = stores?.efapi || {};
  const palmital = stores?.palmital || {};
  const passo = stores?.passo || {};

  const anyEditStock = !!(efapi.edit_stock || palmital.edit_stock || passo.edit_stock);
  const anyOrders = !!(efapi.orders || palmital.orders || passo.orders);

  const isAdmin = role === "admin";

  const goBack = () => navigate(-1);
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-gray-50 py-10 px-4 text-gray-800">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900">Painel Administrativo</h1>
          <div className="flex gap-2">
            <button
              onClick={goBack}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Voltar
            </button>
            <button
              onClick={logout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Admin-only */}
          {isAdmin && (
            <>
              <Link
                to="/cadastro"
                className="block rounded-xl border border-gray-200 bg-white p-6 shadow hover:shadow-md"
              >
                <div className="text-lg font-semibold text-gray-900">Cadastro de Produto</div>
                <p className="mt-1 text-sm text-gray-600">Criar e editar produtos. Estoque por loja no cadastro.</p>
              </Link>

              <Link
                to="/categorias"
                className="block rounded-xl border border-gray-200 bg-white p-6 shadow hover:shadow-md"
              >
                <div className="text-lg font-semibold text-gray-900">Categorias</div>
                <p className="mt-1 text-sm text-gray-600">Gerenciar categorias e subcategorias.</p>
              </Link>

              <Link
                to="/configuracoes"
                className="block rounded-xl border border-gray-200 bg-white p-6 shadow hover:shadow-md"
              >
                <div className="text-lg font-semibold text-gray-900">Configurações</div>
                <p className="mt-1 text-sm text-gray-600">Entrega, frete e preferências gerais.</p>
              </Link>

              <Link
                to="/pagamentos"
                className="block rounded-xl border border-gray-200 bg-white p-6 shadow hover:shadow-md"
              >
                <div className="text-lg font-semibold text-gray-900">Pagamentos e WhatsApp</div>
                <p className="mt-1 text-sm text-gray-600">Mercado Pago, PIX banco e WhatsApp Cloud por loja.</p>
              </Link>

              <Link
                to="/users"
                className="block rounded-xl border border-gray-200 bg-white p-6 shadow hover:shadow-md"
              >
                <div className="text-lg font-semibold text-gray-900">Usuários e Permissões</div>
                <p className="mt-1 text-sm text-gray-600">Criar usuários, papéis e permissões granulares.</p>
              </Link>
            </>
          )}

          {/* Admin ou operadores com permissão */}
          {(isAdmin || canManageProducts) && (
            <Link
              to="/produtos"
              className="block rounded-xl border border-gray-200 bg-white p-6 shadow hover:shadow-md"
            >
              <div className="text-lg font-semibold text-gray-900">Produtos</div>
              <p className="mt-1 text-sm text-gray-600">
                Lista, busca, filtros, preço rápido e layout da vitrine.
              </p>
            </Link>
          )}

          {(isAdmin || anyEditStock) && (
            <Link
              to="/estoque"
              className="block rounded-xl border border-gray-200 bg-white p-6 shadow hover:shadow-md"
            >
              <div className="text-lg font-semibold text-gray-900">Estoque por Loja</div>
              <p className="mt-1 text-sm text-gray-600">Editar estoques por loja, arquivar e reativar itens.</p>
            </Link>
          )}

          {(isAdmin || anyOrders) && (
            <Link
              to="/pedidos"
              className="block rounded-xl border border-gray-200 bg-white p-6 shadow hover:shadow-md"
            >
              <div className="text-lg font-semibold text-gray-900">Pedidos</div>
              <p className="mt-1 text-sm text-gray-600">Confirmar, entregar, cancelar e relatórios por loja.</p>
            </Link>
          )}
        </div>

        {/* Informativo de acesso quando não-admin */}
        {!isAdmin && (
          <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Acesso de operador. Botões exibidos conforme permissões do seu usuário.
          </div>
        )}
      </div>
    </div>
  );
}
