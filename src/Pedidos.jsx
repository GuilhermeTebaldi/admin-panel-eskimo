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
          toast.info(`🆕 ${novos.length} novo(s) pedido(s) recebido(s)!`);
        }
        res.data.forEach((p) => lastIds.current.add(p.id));
        setPedidos(res.data);
      })
      .catch(() => {
        toast.error("Erro ao buscar pedidos.");
      })
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
      toast.info("Pedido excluído com sucesso.");
      fetchPedidos();
    } catch {
      toast.error("Erro ao excluir pedido.");
    }
  };

  const gerarRelatoriosPDF = async () => {
    setGerandoRelatorio(true);
    toast.info("Gerando PDFs das lojas...");
    try {
      let numero = numeroWhatsapp.trim();
      if (!numero.startsWith("55")) numero = "55" + numero;
      const mensagem = encodeURIComponent(
        `Segue os relatórios:\nEfapi: ${API_URL}/reports/efapi\nPalmital: ${API_URL}/reports/palmital\nPasso: ${API_URL}/reports/passodosfortes`
      );
      window.open(`https://wa.me/${numero}?text=${mensagem}`, "_blank");
    } finally {
      setGerandoRelatorio(false);
    }
  };

  // ✅ Filtro aplicado aos pedidos
  const pedidosFiltrados = pedidos.filter((p) => {
    const statusOk = filtroStatus === "todos" || p.status === filtroStatus;
    const storeOk = filtroStore === "todos" || p.store?.toLowerCase() === filtroStore.toLowerCase();
    return statusOk && storeOk;
  });

  const pedidosAgrupados = pedidosFiltrados.reduce((acc, pedido) => {
    const dataPedido = getDataPedido(pedido);
    const data = dataPedido ? dataPedido.toLocaleDateString() : "Data desconhecida";
    if (!acc[data]) acc[data] = [];
    acc[data].push(pedido);
    return acc;
  }, {});

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-gray-50 py-10 px-4 text-gray-800">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900">📦 Pedidos Recebidos</h1>
          <div className="flex flex-wrap gap-2">
            {/* ✅ Filtro de unidades */}
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700"
              value={filtroStore}
              onChange={(e) => setFiltroStore(e.target.value)}
            >
              <option value="todos">Todas as Unidades</option>
              {lojasFixas.map((store) => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>

            {/* ✅ Filtro de status */}
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700"
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
        ) : Object.keys(pedidosAgrupados).length === 0 ? (
          <div className="text-center text-lg text-gray-500">Nenhum pedido encontrado.</div>
        ) : (
          Object.entries(pedidosAgrupados).map(([data, lista]) => (
            <div key={data}>
              <h2 className="mt-6 mb-2 text-lg font-bold text-gray-700">📅 {data}</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {lista.map((pedido) => {
                  const dataPedido = getDataPedido(pedido);
                  const isHoje = dataPedido && dataPedido.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={pedido.id}
                      className={`rounded-xl border p-6 shadow-md hover:shadow-lg transition ${
                        pedido.deliveryType === "entregar"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-100"
                      } ${isHoje ? "ring-2 ring-green-400" : ""}`}
                    >
                      <div className="mb-3 space-y-1 text-sm text-gray-700">
                        <div><strong>Número do Pedido:</strong> #{pedido.id}</div>
                        <div><strong>Cliente:</strong> {pedido.customerName}</div>
                        <div><strong>Telefone:</strong> {pedido.phoneNumber || "Não informado"}</div>
                        <div><strong>Unidade:</strong> {pedido.store}</div>
                        <div><strong>Entrega:</strong> {pedido.deliveryType}</div>
                        {pedido.address && (
                          <div><strong>Endereço:</strong> {pedido.address}, {pedido.street}, nº {pedido.number} {pedido.complement && `, ${pedido.complement}`}</div>
                        )}
                        <div><strong>Entrega (frete):</strong> R$ {pedido.deliveryFee?.toFixed(2) ?? "0,00"}</div>
                        <div><strong>Total:</strong> R$ {pedido.total.toFixed(2)}</div>
                        <div>
                          <strong>Status:</strong>{" "}
                          <span className={`font-semibold ${
                            pedido.status === "pago"
                              ? "text-green-600"
                              : pedido.status === "entregue"
                              ? "text-blue-600"
                              : "text-yellow-600"
                          }`}>
                            {pedido.status.toUpperCase() || "PENDENTE"}
                          </span>
                        </div>
                      </div>

                      <ul className="mt-3 divide-y divide-gray-100 text-sm">
                        {pedido.items.map((item, index) => (
                          <li key={index} className="flex items-center justify-between gap-4 py-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-10 w-10 rounded-md object-cover border border-gray-200"
                              />
                              <span>{item.name} (x{item.quantity})</span>
                            </div>
                            <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 flex gap-2 flex-wrap">
                        {pedido.status === "pendente" && (
                          <button
                            onClick={() => setPedidoSelecionado(pedido)}
                            className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            ✅ Confirmar Pagamento
                          </button>
                        )}
                        {pedido.status === "pago" && (
                          <button
                            onClick={() => marcarComoEntregue(pedido.id)}
                            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            📬 Marcar como Entregue
                          </button>
                        )}
                        <button
                          onClick={() => excluirPedido(pedido.id)}
                          className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          🗑 Excluir Pedido
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {pedidoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <h2 className="text-xl font-bold text-gray-800">Confirmar Pagamento</h2>
            <p className="mt-2 text-sm text-gray-600">
              Deseja confirmar que o pagamento do pedido de <strong>{pedidoSelecionado.customerName}</strong> foi realizado?
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setPedidoSelecionado(null)}
                className="rounded bg-gray-100 px-4 py-2 text-sm text-gray-800 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPedido}
                className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
