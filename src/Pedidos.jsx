import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://backend-eskimo.onrender.com/api"; // ou http://localhost:8080/api se local

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/orders`)
      .then((res) => setPedidos(res.data))
      .catch((err) => console.error("Erro ao buscar pedidos:", err))
      .finally(() => setLoading(false));
  }, []);
<div className="mb-4">
  <button
    onClick={() => window.history.back()}
    className="rounded bg-blue-500 px-4 py-2 text-white shadow hover:bg-blue-600 transition"
  >
    ← Voltar para o Painel
  </button>
</div>

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">📦 Pedidos Recebidos</h1>

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
