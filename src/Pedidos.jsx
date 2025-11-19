import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

// Cabeçalho dinâmico — token sempre atualizado
const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
});

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroStore, setFiltroStore] = useState("todos");
  const [mostrarModalExcluirTodos, setMostrarModalExcluirTodos] = useState(false);
  const [mostrarPedidosAnteriores, setMostrarPedidosAnteriores] = useState(false);

  // Gate: admin ou operador com permissão de pedidos
  const role = localStorage.getItem("role") || "operator";
  let perms = {};
  try {
    perms = JSON.parse(localStorage.getItem("permissions") || "{}");
  } catch {
    perms = {};
  }

  const anyOrders =
    !!(perms?.stores?.efapi?.orders ||
      perms?.stores?.palmital?.orders ||
      perms?.stores?.passo?.orders);

  const isAdmin = role === "admin";
  const blockAccess = !isAdmin && !anyOrders;

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const lojasFixas = ["Efapi", "Palmital", "Passo dos Fortes"];
  const lojaLabels = {
    efapi: "Efapi",
    palmital: "Palmital",
    passo: "Passo dos Fortes",
  };
  const lastIds = useRef(new Set());

  const mapStore = (store) => {
    if (!store) return "";
    const lower = store.toLowerCase();
    if (lower.includes("passo")) return "passo";
    if (lower.includes("efapi")) return "efapi";
    if (lower.includes("palmital")) return "palmital";
    return lower;
  };

  const normalizePaymentMethod = (method) =>
    (method || "").toString().trim().toLowerCase();

  const isCashPayment = (method) => normalizePaymentMethod(method) === "cash";

  const statusMapRef = useRef(new Map());

  const syncMercadoPagoPendentes = async (listaPedidos) => {
    const pendentesOnline = listaPedidos
      .filter(
        (p) =>
          normalizePaymentMethod(p.paymentMethod) === "mercado_pago" &&
          (p.status || "").toString().toLowerCase() === "pendente"
      )
      .slice(0, 5);

    if (pendentesOnline.length === 0) return [];

    const resultados = await Promise.all(
      pendentesOnline.map(async (pedido) => {
        try {
          const { data } = await axios.get(`${API_URL}/payments/mp/status/${pedido.id}`);
          const normalized = (data?.status || "").toString().toLowerCase();
          if (data?.synced || normalized === "pago" || normalized === "approved") {
            return { id: pedido.id, status: data?.status || "pago" };
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    return resultados.filter(Boolean);
  };

  const formatPaymentMethod = (method) => {
    const normalized = normalizePaymentMethod(method);
    if (normalized === "cash") return "Dinheiro na entrega";
    if (normalized === "mercado_pago") return "Mercado Pago (online)";
    if (!normalized) return "Não informado";
    return method;
  };

  const statusBadgeClasses = (status) => {
    const normalized = (status || "").toString().toLowerCase();
    if (normalized === "pago") return "bg-emerald-100 text-emerald-700";
    if (normalized === "entregue") return "bg-blue-100 text-blue-700";
    if (normalized === "cancelado") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

  const getDataPedido = (pedido) => {
    const rawDate =
      pedido.createdAt || pedido.created_at || pedido.CreatedAt || pedido.date;
    return rawDate ? new Date(rawDate) : null;
  };

  const fetchPedidos = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`, auth());
      const data = res.data || [];
      const novos = data.filter((p) => !lastIds.current.has(p.id));
      if (novos.length > 0 && lastIds.current.size > 0) {
        toast.info(`🆕 ${novos.length} novo(s) pedido(s) recebido(s)!`);
      }
      data.forEach((p) => lastIds.current.add(p.id));
      setPedidos(data);

      const canceladosRecentes = [];
      const newStatusMap = new Map(statusMapRef.current);
      data.forEach((pedido) => {
        const normalized = (pedido.status || "").toString().toLowerCase();
        const prev = newStatusMap.get(pedido.id);
        if (prev && prev !== normalized && normalized === "cancelado") {
          canceladosRecentes.push(pedido);
        }
        newStatusMap.set(pedido.id, normalized);
      });
      const idsAtuais = new Set(data.map((p) => p.id));
      Array.from(newStatusMap.keys()).forEach((id) => {
        if (!idsAtuais.has(id)) newStatusMap.delete(id);
      });
      statusMapRef.current = newStatusMap;
      canceladosRecentes.forEach((pedido) =>
        toast.warn(`⚠️ Pedido #${pedido.id} foi cancelado pelo cliente.`),
      );

      const atualizados = await syncMercadoPagoPendentes(data);
      if (atualizados.length > 0) {
        const statusMap = new Map(atualizados.map((item) => [item.id, item.status]));
        setPedidos((prev) =>
          prev.map((pedido) =>
            statusMap.has(pedido.id)
              ? { ...pedido, status: statusMap.get(pedido.id) }
              : pedido
          )
        );
      }
    } catch {
      toast.error("Erro ao buscar pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (blockAccess) return;
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockAccess]);

  const marcarComoEntregue = async (id) => {
    try {
      await axios.patch(`${API_URL}/orders/${id}/deliver`, null, auth());
      toast.success("Pedido marcado como entregue!");
      fetchPedidos();
    } catch {
      toast.error("Erro ao atualizar pedido.");
    }
  };

  const confirmarPedido = async () => {
    if (!pedidoSelecionado) return;
    try {
      await axios.patch(
        `${API_URL}/orders/${pedidoSelecionado.id}/confirm`,
        null,
        auth()
      );
      toast.success("Pagamento confirmado!");
      setPedidoSelecionado(null);
      fetchPedidos();
    } catch {
      toast.error("Erro ao confirmar pagamento.");
    }
  };

  const cancelarPedido = async (id) => {
    if (!window.confirm("Cancelar este pedido? O estoque será devolvido para a loja.")) return;
    try {
      await axios.patch(`${API_URL}/orders/${id}/cancel`, null, auth());
      toast.success("Pedido cancelado e estoque devolvido!");
      fetchPedidos();
    } catch {
      toast.error("Erro ao cancelar pedido.");
    }
  };

  const excluirPedido = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este pedido?")) return;
    try {
      await axios.delete(`${API_URL}/orders/${id}`, auth());
      toast.info("Pedido excluído com sucesso.");
      fetchPedidos();
    } catch {
      toast.error("Erro ao excluir pedido.");
    }
  };

  const excluirTodosPedidos = async () => {
    const naoResolvidos = pedidos.filter((pedido) => {
      const normalized = (pedido.status || "").toString().toLowerCase();
      return normalized !== "pago" && normalized !== "entregue";
    });
    if (naoResolvidos.length === 0) {
      toast.info("Nenhum pedido pendente ou cancelado para limpar.");
      setMostrarModalExcluirTodos(false);
      return;
    }
    try {
      await Promise.all(
        naoResolvidos.map((pedido) =>
          axios.delete(`${API_URL}/orders/${pedido.id}`, auth()),
        ),
      );
      toast.success("Pedidos pendentes/cancelados foram removidos.");
      setMostrarModalExcluirTodos(false);
      fetchPedidos();
    } catch {
      toast.error("Erro ao excluir pedidos pendentes/cancelados.");
    }
  };

  const buildReportQuery = (range) => {
    const source = range || { from: fromDate, to: toDate };
    const params = new URLSearchParams();
    if (source.from) params.append("from", source.from);
    if (source.to) params.append("to", source.to);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const baixarPDFPorLoja = async (lojaSlug, range) => {
    const qs = buildReportQuery(range);
    const fileSuffix =
      fromDate && toDate
        ? `_${fromDate}-${toDate}`
        : fromDate
        ? `_${fromDate}-`
        : toDate
        ? `_-${toDate}`
        : "";
    const fileName = `relatorio-${lojaSlug}${fileSuffix}.pdf`;

    const { data: blob } = await axios.get(`${API_URL}/reports/${lojaSlug}${qs}`, {
      ...auth(),
      responseType: "blob",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date) => new Date(date).toISOString().split("T")[0];

  const baixarRelatorioMensal = async (lojaSlug) => {
    const range = {
      from: formatDate(startOfMonth),
      to: formatDate(endOfMonth),
    };
    try {
      await baixarPDFPorLoja(lojaSlug, range);
      toast.success(
        `Relatório mensal de ${lojaLabels[lojaSlug] || lojaSlug} (${monthLabel}) baixado com sucesso!`,
      );
    } catch {
      toast.error("Não foi possível baixar o relatório mensal.");
    }
  };

  const { pedidosFiltrados, totalFiltrado } = useMemo(() => {
    const filtrados = pedidos.filter((p) => {
      const statusOk = filtroStatus === "todos" || p.status === filtroStatus;
      const storeOk =
        filtroStore === "todos" || mapStore(p.store) === mapStore(filtroStore);
      return statusOk && storeOk;
    });
    return { pedidosFiltrados: filtrados, totalFiltrado: filtrados.length };
  }, [pedidos, filtroStatus, filtroStore]);

  const pedidosAgrupados = pedidosFiltrados.reduce((acc, pedido) => {
    const dataPedido = getDataPedido(pedido);
    const data = dataPedido ? formatDate(dataPedido) : "Data desconhecida";
    if (!acc[data]) acc[data] = [];
    acc[data].push(pedido);
    return acc;
  }, {});

  const datasOrdenadas = Object.keys(pedidosAgrupados).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const todayKey = formatDate(new Date());
  const todayGroups = datasOrdenadas
    .filter((data) => data === todayKey)
    .map((data) => ({ data, pedidos: pedidosAgrupados[data] }));
  const previousGroups = datasOrdenadas
    .filter((data) => data !== todayKey)
    .map((data) => ({ data, pedidos: pedidosAgrupados[data] }));
  const previousPedidosCount = previousGroups.reduce(
    (total, grupo) => total + grupo.pedidos.length,
    0
  );

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { startOfMonth, endOfMonth, monthLabel } = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);
    return {
      startOfMonth: start,
      endOfMonth: end,
      monthLabel: start.toLocaleString("pt-BR", { month: "long", year: "numeric" }),
    };
  }, [selectedMonth]);

  const pedidosMesPorLoja = useMemo(() => {
    const base = { efapi: 0, palmital: 0, passo: 0 };
    pedidos.forEach((pedido) => {
      const dataPedido = getDataPedido(pedido);
      if (!dataPedido) return;
      if (dataPedido < startOfMonth || dataPedido > endOfMonth) return;
      const loja = mapStore(pedido.store);
      if (base[loja] !== undefined) {
        base[loja] += 1;
      }
    });
    return base;
  }, [pedidos, startOfMonth, endOfMonth]);

  const resumoStatus = useMemo(() => {
    const base = {
      total: pedidos.length,
      pendente: 0,
      pago: 0,
      entregue: 0,
      cancelado: 0,
    };
    pedidos.forEach((pedido) => {
      const normalized = (pedido.status || "").toString().toLowerCase();
      if (base[normalized] !== undefined) {
        base[normalized] += 1;
      }
    });
    return base;
  }, [pedidos]);

  const formatGroupTitle = (dateString) => {
    if (dateString === "Data desconhecida") return dateString;
    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? dateString : parsed.toLocaleDateString();
  };

  const renderPedidoCard = (pedido) => {
    const dataPedido = getDataPedido(pedido);
    const isHoje = dataPedido && formatDate(dataPedido) === todayKey;
    const normalizedStatus = (pedido.status || "").toString().toLowerCase();
    const canMarkAsDelivered =
      normalizedStatus === "pago" || normalizedStatus === "approved";
    const horario = dataPedido
      ? new Date(dataPedido).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "America/Sao_Paulo",
        })
      : "Sem horário";

    return (
      <div
        key={pedido.id}
        className={`rounded-3xl border p-6 shadow-lg transition ${
          pedido.deliveryType === "entregar"
            ? "bg-gradient-to-br from-blue-50 to-white border-blue-100"
            : "bg-white border-emerald-50"
        } ${isHoje ? "ring-2 ring-emerald-300" : ""}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Pedido</p>
            <h3 className="text-2xl font-bold text-gray-900">#{pedido.id}</h3>
            <p className="text-sm text-gray-500">
              {horario} · {pedido.store}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
              normalizedStatus,
            )}`}
          >
            {pedido.status?.toUpperCase() || "PENDENTE"}
          </span>
        </div>

        {isCashPayment(pedido.paymentMethod) && (
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            💵 Pagamento em dinheiro
          </div>
        )}

        <div className="mt-4 space-y-1 text-sm text-gray-700">
          <div>
            <strong>Cliente:</strong> {pedido.customerName}
          </div>
          <div>
            <strong>Telefone:</strong> {pedido.phoneNumber || "Não informado"}
          </div>
          <div>
            <strong>Entrega:</strong> {pedido.deliveryType}
          </div>
          {pedido.address && (
            <div>
              <strong>Endereço:</strong> {pedido.address}, {pedido.street}, nº {pedido.number}
              {pedido.complement && `, ${pedido.complement}`}
            </div>
          )}
          <div>
            <strong>Entrega (frete):</strong>{" "}
            R$ {pedido.deliveryFee != null ? Number(pedido.deliveryFee).toFixed(2) : "0,00"}
          </div>
          <div>
            <strong>Total:</strong> R$ {Number(pedido.total || 0).toFixed(2)}
          </div>
          <div>
            <strong>Pagamento:</strong>{" "}
            <span
              className={`font-semibold ${isCashPayment(pedido.paymentMethod) ? "text-amber-700" : "text-gray-800"}`}
            >
              {formatPaymentMethod(pedido.paymentMethod)}
              {isCashPayment(pedido.paymentMethod) ? " · aguarda motoboy" : ""}
            </span>
          </div>
          {pedido.whatsappNotifiedAt && (
            <div>
              <strong>WhatsApp:</strong> enviado
            </div>
          )}
        </div>

        <div className="mt-5 rounded-2xl bg-gray-50/70 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Itens</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-800">
            {pedido.items.map((item, index) => (
              <li key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-10 w-10 rounded-md object-cover shadow ring-1 ring-emerald-50"
                  />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-semibold">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {canMarkAsDelivered && (
            <button
              onClick={() => marcarComoEntregue(pedido.id)}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
            >
              ✔ Marcar como entregue
            </button>
          )}
          {normalizedStatus !== "pago" && (
            <button
              onClick={() => setPedidoSelecionado(pedido)}
              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              💳 Confirmar Pagamento
            </button>
          )}
          <button
            onClick={() => cancelarPedido(pedido.id)}
            className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
          >
            ❌ Cancelar Pedido
          </button>
          <button
            onClick={() => excluirPedido(pedido.id)}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700"
          >
            🗑 Excluir Pedido
          </button>
        </div>
      </div>
    );
  };

  const renderGrupo = ({ data, pedidos }) => (
    <div key={data} className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-800">
        <span className="text-2xl">📅</span>
        <h2 className="text-xl font-semibold">{formatGroupTitle(data)}</h2>
        <span className="text-xs text-gray-500">
          {pedidos.length} pedido{pedidos.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pedidos.map((pedido) => renderPedidoCard(pedido))}
      </div>
    </div>
  );

  const resetFiltros = () => {
    setFiltroStatus("todos");
    setFiltroStore("todos");
    setFromDate("");
    setToDate("");
  };

  if (blockAccess) {
    return <div className="p-8">Acesso restrito ao administrador.</div>;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-white to-emerald-50 py-10 px-4 text-gray-800">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">
                Central de operações
              </p>
              <h1 className="text-3xl font-black text-emerald-900">📦 Pedidos Recebidos</h1>
              <p className="text-sm text-emerald-900/70">
                Acompanhe pedidos em tempo real, confirme pagamentos e gere relatórios por loja.
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow hover:bg-emerald-50"
            >
              ← Voltar
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total", value: resumoStatus.total },
              { label: "Pendentes", value: resumoStatus.pendente },
              { label: "Pagos", value: resumoStatus.pago },
              { label: "Entregues", value: resumoStatus.entregue },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-emerald-50 bg-emerald-50/70 px-4 py-3 text-emerald-800 shadow-inner"
              >
                <p className="text-xs uppercase tracking-wide text-emerald-500">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-[11px] text-emerald-600">
                  {stat.label === "Total" ? "Pedidos registrados" : "Pedidos neste status"}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-emerald-50 bg-white/80 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-emerald-900">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-500">
                  resumo do mês
                </p>
                <h3 className="text-lg font-semibold">
                  Pedidos de {monthLabel}
                </h3>
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-full border border-emerald-200 px-3 py-1 text-sm text-emerald-800 shadow focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.keys(pedidosMesPorLoja).map((loja) => (
                <div
                  key={loja}
                  className="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-emerald-900 shadow-inner"
                >
                  <div className="text-sm font-semibold">{lojaLabels[loja]}</div>
                  <div className="text-2xl font-bold">{pedidosMesPorLoja[loja]}</div>
                  <button
                    type="button"
                    onClick={() => baixarRelatorioMensal(loja)}
                    className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    Baixar mês
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-emerald-900">Filtros</h2>
              <p className="text-sm text-gray-500">
                Refine a visualização para analisar pedidos por unidade, status ou período personalizado.
              </p>
            </div>
            <button
              onClick={resetFiltros}
              className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Limpar filtros
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
              Unidade
              <select
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 shadow-sm focus:border-emerald-400 focus:outline-none"
                value={filtroStore}
                onChange={(e) => setFiltroStore(e.target.value)}
              >
                <option value="todos">Todas as Unidades</option>
                {lojasFixas.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
              Status
              <select
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 shadow-sm focus:border-emerald-400 focus:outline-none"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendentes</option>
                <option value="pago">Pagos</option>
                <option value="entregue">Entregues</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
              Data inicial
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 shadow-sm focus:border-emerald-400 focus:outline-none"
                title="Data inicial do relatório"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
              Data final
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 shadow-sm focus:border-emerald-400 focus:outline-none"
                title="Data final do relatório"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <button
              onClick={() => setMostrarModalExcluirTodos(true)}
              className="rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2 text-sm font-semibold text-white shadow hover:from-rose-600 hover:to-rose-700"
            >
              🗑 Limpar histórico
            </button>
            <span>
              Pedidos filtrados: <strong>{totalFiltrado}</strong>
            </span>
            {(fromDate || toDate) && (
              <span>
                Relatório atual: <strong>{fromDate || "início"}</strong> →{" "}
                <strong>{toDate || "hoje"}</strong>
              </span>
            )}
          </div>
        </section>


        {loading ? (
          <div className="rounded-3xl border border-emerald-50 bg-white/80 p-10 text-center text-lg text-gray-500 shadow">
            Carregando pedidos...
          </div>
        ) : datasOrdenadas.length === 0 ? (
          <div className="rounded-3xl border border-emerald-50 bg-white/80 p-10 text-center text-lg text-gray-500 shadow">
            Nenhum pedido encontrado.
          </div>
        ) : (
          <>
            {todayGroups.length > 0 ? (
              todayGroups.map((grupo) => renderGrupo(grupo))
            ) : (
              <div className="rounded-3xl border border-dashed border-emerald-200 bg-white/70 p-8 text-center text-sm font-semibold text-emerald-700 shadow-inner">
                Nenhum pedido recebido hoje.
              </div>
            )}

            {previousGroups.length > 0 && (
              <div className="mt-8 rounded-3xl border border-dashed border-emerald-100 bg-white/70 p-6 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Pedidos anteriores</p>
                    <p className="text-xs text-gray-500">
                      {previousPedidosCount} pedido{previousPedidosCount === 1 ? "" : "s"} aguardando consulta.
                    </p>
                  </div>
                  <button
                    onClick={() => setMostrarPedidosAnteriores((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    {mostrarPedidosAnteriores ? "Ocultar pedidos anteriores" : "Ver mais pedidos"}
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                      {previousPedidosCount}
                    </span>
                  </button>
                </div>
                <div
                  className={`mt-4 space-y-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    mostrarPedidosAnteriores ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {mostrarPedidosAnteriores && previousGroups.map((grupo) => renderGrupo(grupo))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Confirmar Pagamento */}
      {pedidoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800">Confirmar Pagamento</h2>
            <p className="mt-2 text-sm text-gray-600">
              Deseja confirmar que o pagamento do pedido de{" "}
              <strong>{pedidoSelecionado.customerName}</strong> foi realizado?
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Forma de pagamento:{" "}
              <strong>{formatPaymentMethod(pedidoSelecionado.paymentMethod)}</strong>
              {isCashPayment(pedidoSelecionado.paymentMethod) ? " · recebido em dinheiro" : ""}
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setPedidoSelecionado(null)}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPedido}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir Todos */}
      {mostrarModalExcluirTodos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800">⚠️ Limpar Histórico</h2>
            <p className="mt-2 text-sm text-gray-600">
              Tem certeza que deseja remover os pedidos <strong>pendentes ou cancelados</strong>? Essa ação não poderá ser desfeita e os pedidos pagos/entregues serão preservados para o dashboard.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setMostrarModalExcluirTodos(false)}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={excluirTodosPedidos}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Excluir Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
