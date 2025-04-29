import { useEffect, useState } from "react";
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

  const lojasFixas = ["Efapi", "Palmital", "Passo dos Fortes"];

  const fetchPedidos = () => {
    setLoading(true);
    axios
      .get(`${API_URL}/orders`)
      .then((res) => setPedidos(res.data))
      .catch((err) => console.error("Erro ao buscar pedidos:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPedidos();
  }, []);
  const marcarComoEntregue = async (id) => {

    try {
      await axios.patch(`${API_URL}/orders/${id}/deliver`);
      toast.success("Pedido marcado como entregue!");
      fetchPedidos();
    } catch (err) {
      console.error("Erro ao marcar como entregue:", err);
      toast.error("Erro ao atualizar pedido.");
    }
  };
  
  const confirmarPedido = async () => {
    if (!pedidoSelecionado) return;

    try {
      await axios.patch(`${API_URL}/orders/${pedidoSelecionado.id}/confirm`);
      toast.success("Pagamento confirmado com sucesso!");
      setPedidoSelecionado(null);
      fetchPedidos();
    } catch (err) {
      console.error("Erro ao confirmar pedido:", err);
      toast.error("Erro ao confirmar pagamento.");
    }
  };

  const excluirPedido = async (id) => {
    const confirmar = window.confirm("Tem certeza que deseja excluir este pedido?");
    if (!confirmar) return;

    try {
      await axios.delete(`${API_URL}/orders/${id}`);
      toast.info("Pedido excluído com sucesso.");
      fetchPedidos();
    } catch (err) {
      console.error("Erro ao excluir pedido:", err);
      toast.error("Erro ao excluir pedido.");
    }
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const statusOk = filtroStatus === "todos" || p.status === filtroStatus;
    const storeOk = filtroStore === "todos" || p.store === filtroStore;
    return statusOk && storeOk;
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-gray-50 py-10 px-4 text-gray-800">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900">📦 Pedidos Recebidos</h1>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm hover:border-gray-400"
              value={filtroStore}
              onChange={(e) => setFiltroStore(e.target.value)}
            >
              <option value="todos">Todas as Unidades</option>
              {lojasFixas.map((store) => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm hover:border-gray-400"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="pago">Pagos</option>
              <option value="entregue">Entregues</option>
            </select>
            <button
              onClick={() => window.history.back()}
              className="rounded-md border border-gray-300 bg-white px-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              ← Voltar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-lg text-gray-500">Carregando pedidos...</div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center text-lg text-gray-500">Nenhum pedido encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pedidosFiltrados.map((pedido) => (
              <div
                key={pedido.id}
                className="rounded-xl border border-gray-100 bg-white p-6 shadow-md hover:shadow-lg transition"
              >
                <div className="mb-3 space-y-1 text-sm text-gray-700">
                  <div><strong>Cliente:</strong> {pedido.customerName}</div>
                  <div><strong>Telefone:</strong> {pedido.phoneNumber || "Não informado"}</div>
                  <div><strong>Unidade:</strong> {pedido.store}</div>
                  <div><strong>Entrega:</strong> {pedido.deliveryType}</div>
                  {pedido.address && (
                    <div className="text-gray-600">
                      <strong>Endereço:</strong> {pedido.address}, {pedido.street}, nº {pedido.number} {pedido.complement && `, ${pedido.complement}`}
                    </div>
                  )}
                  <div>
                    <strong>Total:</strong> R$ {pedido.total.toFixed(2)}
                  </div>
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
                    <li key={index} className="flex justify-between py-1">
                      <span>{item.name} (x{item.quantity})</span>
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
            ))}
          </div>
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