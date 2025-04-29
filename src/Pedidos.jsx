import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://backend-eskimo.onrender.com/api";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

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

  const confirmarPedido = async () => {
    if (!pedidoSelecionado) return;

    try {
      await axios.patch(`${API_URL}/orders/${pedidoSelecionado.id}/confirm`);
      setPedidoSelecionado(null);
      fetchPedidos();
    } catch (err) {
      console.error("Erro ao confirmar pedido:", err);
    }
  };

  const excluirPedido = async (id) => {
    const confirmar = window.confirm("Tem certeza que deseja excluir este pedido?");
    if (!confirmar) return;

    try {
      await axios.delete(`${API_URL}/orders/${id}`);
      fetchPedidos();
    } catch (err) {
      console.error("Erro ao excluir pedido:", err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-white p-6 text-gray-800">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between border-b pb-4">
          <h1 className="text-3xl font-extrabold text-gray-900">📦 Pedidos Recebidos</h1>
          <button
            onClick={() => window.history.back()}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
          >
            ← Voltar
          </button>
        </header>

        {loading ? (
          <div className="text-center text-lg text-gray-500">Carregando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="text-center text-lg text-gray-500">Nenhum pedido encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md transition hover:scale-[1.01] hover:shadow-lg"
              >
                <div className="mb-3 flex flex-col gap-1 text-sm text-gray-600">
                  <div><strong>Cliente:</strong> {pedido.customerName}</div>
                  <div><strong>Unidade:</strong> {pedido.store}</div>
                  <div><strong>Entrega:</strong> {pedido.deliveryType}</div>
                </div>

                <div className="mb-2 text-sm text-gray-700">
                  {pedido.address && (
                    <div>
                      <strong>Endereço:</strong> {pedido.address}, {pedido.street}, nº {pedido.number} {pedido.complement && `, ${pedido.complement}`}
                    </div>
                  )}
                  <div><strong>Total:</strong> R$ {pedido.total.toFixed(2)}</div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span className={`font-bold ${
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

                <ul className="my-3 divide-y divide-gray-100 text-sm">
                  {pedido.items.map((item, index) => (
                    <li key={index} className="flex justify-between py-1">
                      <span>{item.name} (x{item.quantity})</span>
                      <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-3">
                  {pedido.status === "pendente" && (
                    <button
                      onClick={() => setPedidoSelecionado(pedido)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      ✅ Confirmar Pagamento
                    </button>
                  )}
                  <button
                    onClick={() => excluirPedido(pedido.id)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    🗑 Excluir Pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {pedidoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h2 className="mb-3 text-xl font-bold text-gray-800">Confirmar Pagamento</h2>
            <p className="text-sm text-gray-600">
              Deseja confirmar que o pagamento do pedido de <strong>{pedidoSelecionado.customerName}</strong> foi realizado?
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setPedidoSelecionado(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPedido}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
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
