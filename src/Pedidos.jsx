import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "https://backend-eskimo.onrender.com/api";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroStore, setFiltroStore] = useState("todos");
  const [numeroWhatsapp, setNumeroWhatsapp] = useState("");
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [vistos, setVistos] = useState(new Set());

  const lojasFixas = ["Efapi", "Palmital", "Passo dos Fortes"];
  const lastIds = useRef(new Set());

  const getDataPedido = (pedido) => {
    const rawDate = pedido.createdAt || pedido.created_at || pedido.CreatedAt || pedido.date;
    return rawDate ? new Date(rawDate) : null;
  };

  const fetchPedidos = () => {
    axios
      .get(`${API_URL}/orders`)
      .then((res) => {
        const novos = res.data.filter((p) => !lastIds.current.has(p.id));
        if (novos.length > 0 && lastIds.current.size > 0) {
          toast.info(`🆕 ${novos.length} novo(s) pedido(s)!`);
        }
        res.data.forEach((p) => lastIds.current.add(p.id));
        setPedidos(res.data);
      })
      .catch(() => toast.error("Erro ao buscar pedidos."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 10000);
    return () => clearInterval(interval);
  }, []);

  const marcarComoEntregue = async (id) => {
    try {
      await axios.patch(`${API_URL}/orders/${id}/deliver`);
      toast.success("Pedido marcado como entregue!");
      fetchPedidos();
    } catch {
      toast.error("Erro ao atualizar pedido.");
    }
  };

  const confirmarPedido = async () => {
    if (!pedidoSelecionado) return;
    try {
      await axios.patch(`${API_URL}/orders/${pedidoSelecionado.id}/confirm`);
      toast.success("Pagamento confirmado!");
      setPedidoSelecionado(null);
      fetchPedidos();
    } catch {
      toast.error("Erro ao confirmar pagamento.");
    }
  };

  const excluirPedido = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este pedido?")) return;
    try {
      await axios.delete(`${API_URL}/orders/${id}`);
      toast.info("Pedido excluído.");
      fetchPedidos();
    } catch {
      toast.error("Erro ao excluir pedido.");
    }
  };

  const gerarRelatoriosPDF = async () => {
    setGerandoRelatorio(true);
    toast.info("Gerando PDFs...");
    try {
      let numero = numeroWhatsapp.trim();
      if (!numero.startsWith("55")) numero = "55" + numero;
      const msg = encodeURIComponent(
        `Relatórios:\nEfapi: ${API_URL}/reports/efapi\nPalmital: ${API_URL}/reports/palmital\nPasso: ${API_URL}/reports/passodosfortes`
      );
      window.open(`https://wa.me/${numero}?text=${msg}`, "_blank");
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const statusOk = filtroStatus === "todos" || p.status === filtroStatus;
    const storeOk = filtroStore === "todos" || p.store === filtroStore;
    return statusOk && storeOk;
  });

  // ✅ Agrupar Hoje, Ontem e outras datas
  const hoje = new Date().toDateString();
  const ontem = new Date(Date.now() - 86400000).toDateString();

  const grupos = { Hoje: [], Ontem: [], Antigos: {} };

  pedidosFiltrados.forEach((pedido) => {
    const dataPedido = getDataPedido(pedido);
    if (!dataPedido) {
      if (!grupos.Antigos["Data desconhecida"]) grupos.Antigos["Data desconhecida"] = [];
      grupos.Antigos["Data desconhecida"].push(pedido);
      return;
    }

    const dateString = dataPedido.toDateString();

    if (dateString === hoje) {
      grupos.Hoje.push(pedido);
    } else if (dateString === ontem) {
      grupos.Ontem.push(pedido);
    } else {
      const dataLabel = dataPedido.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      if (!grupos.Antigos[dataLabel]) grupos.Antigos[dataLabel] = [];
      grupos.Antigos[dataLabel].push(pedido);
    }
  });

  const marcarComoVisto = (id) => {
    setVistos((prev) => new Set(prev).add(id));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-gray-50 py-10 px-4 text-gray-800">
      <style>
        {`
          @keyframes blink { 50% { background-color: #fef9c3; } }
          .novo-pedido { animation: blink 1s infinite; }
        `}
      </style>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900">📦 Pedidos Recebidos</h1>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
              value={filtroStore}
              onChange={(e) => setFiltroStore(e.target.value)}
            >
              <option value="todos">Todas as Unidades</option>
              {lojasFixas.map((store) => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="pago">Pagos</option>
              <option value="entregue">Entregues</option>
            </select>
          </div>
        </div>

        <div className="mb-8 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-blue-800">📤 Prestação de Contas</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="tel"
              placeholder="WhatsApp (ex: 554999999999)"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={numeroWhatsapp}
              onChange={(e) => setNumeroWhatsapp(e.target.value)}
            />
            <button
              onClick={gerarRelatoriosPDF}
              disabled={gerandoRelatorio}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              {gerandoRelatorio ? "Gerando..." : "📄 Gerar & Enviar PDFs"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-lg text-gray-500">Carregando pedidos...</div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center text-lg text-gray-500">Nenhum pedido encontrado.</div>
        ) : (
          <>
            {grupos.Hoje.length > 0 && (
              <>
                <h2 className="mt-6 mb-2 text-lg font-bold text-green-700">📅 Hoje</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {grupos.Hoje.map((pedido) => {
                    const dataPedido = getDataPedido(pedido);
                    const isNovo = !vistos.has(pedido.id);
                    return (
                      <div
                        key={pedido.id}
                        onClick={() => marcarComoVisto(pedido.id)}
                        className={`rounded-xl border p-6 shadow-md hover:shadow-lg transition cursor-pointer ${
                          isNovo ? "novo-pedido" : ""
                        }`}
                      >
                        <div className="mb-2 text-xs text-gray-500">
                          {dataPedido?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="mb-3 space-y-1 text-sm text-gray-700">
                          <div><strong>Pedido:</strong> #{pedido.id}</div>
                          <div><strong>Cliente:</strong> {pedido.customerName}</div>
                          <div><strong>Unidade:</strong> {pedido.store}</div>
                          <div><strong>Status:</strong> {pedido.status.toUpperCase()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {grupos.Ontem.length > 0 && (
              <>
                <h2 className="mt-6 mb-2 text-lg font-bold text-yellow-700">📅 Ontem</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {grupos.Ontem.map((pedido) => (
                    <div key={pedido.id} className="rounded-xl border p-6 shadow">
                      <div className="mb-2 text-xs text-gray-500">
                        {getDataPedido(pedido)?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-sm"><strong>Pedido:</strong> #{pedido.id}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {Object.entries(grupos.Antigos).map(([data, lista]) => (
              <div key={data}>
                <h2 className="mt-6 mb-2 text-lg font-bold text-gray-700">📅 {data}</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {lista.map((pedido) => (
                    <div key={pedido.id} className="rounded-xl border p-6 shadow">
                      <div className="mb-2 text-xs text-gray-500">
                        {getDataPedido(pedido)?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-sm"><strong>Pedido:</strong> #{pedido.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
