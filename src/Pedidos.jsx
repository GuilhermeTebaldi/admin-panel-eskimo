import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://backend-eskimo.onrender.com/api";


export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const confirmarPedido = async (id) => {
    try {
      await axios.patch(`${API_URL}/orders/${id}/confirm`);
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
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">📦 Pedidos Recebidos</h1>

      <button
        onClick={() => window.history.back()}
        className="mb-4 rounded bg-gray-200 px-4 py-1 text-sm text-gray-700 hover:bg-gray-300"
      >
        ← Voltar
      </button>

      {loading ? (
        <p>Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <div className="space-y-6">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="rounded-xl border bg-white p-4 shadow hover:shadow-md transition"
            >
              <div className="mb-2 flex justify-between text-sm text-gray-600">
                <span><strong>Cliente:</strong> {pedido.customerName}</span>
                <span><strong>Unidade:</strong> {pedido.store}</span>
                <span><strong>Entrega:</strong> {pedido.deliveryType}</span>
              </div>

              <div className="mb-2 text-sm text-gray-700">
                {pedido.address && (
                  <>
                    <strong>Endereço:</strong> {pedido.address}, {pedido.street}, nº {pedido.number}
                    {pedido.complement && `, ${pedido.complement}`}
                    <br />
                  </>
                )}
                <strong>Total:</strong> R$ {pedido.total.toFixed(2)}
                <br />
                <strong>Status:</strong>{" "}
                <span
                  className={`font-bold ${
                    pedido.status === "pago"
                      ? "text-green-600"
                      : pedido.status === "entregue"
                      ? "text-blue-600"
                      : "text-yellow-600"
                  }`}
                >
                  {pedido.status.toUpperCase()}
                </span>
              </div>

              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {pedido.items.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>
                      {item.name} (x{item.quantity})
                    </span>
                    <span>
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex gap-2">
                {pedido.status === "pendente" && (
                  <button
                    onClick={() => confirmarPedido(pedido.id)}
                    className="rounded bg-green-600 px-4 py-1 text-sm text-white hover:bg-green-700"
                  >
                    ✅ Confirmar Pagamento
                  </button>
                )}
                <button
                  onClick={() => excluirPedido(pedido.id)}
                  className="rounded bg-red-600 px-4 py-1 text-sm text-white hover:bg-red-700"
                >
                  🗑 Excluir Pedido
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
