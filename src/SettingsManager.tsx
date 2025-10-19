import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://backend-eskimo.onrender.com/api";

export default function SettingsManager() {
  const [deliveryRate, setDeliveryRate] = useState<number | null>(null);
  const [minDelivery, setMinDelivery] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keepAliveStatus, setKeepAliveStatus] = useState<string>("Carregando...");
  const [keepAliveLastPing, setKeepAliveLastPing] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
    fetchKeepAliveStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      setDeliveryRate(res.data.deliveryRate);
      setMinDelivery(res.data.minDelivery);
    } catch (err) {
      console.log("Nenhuma configuração encontrada.");
      setDeliveryRate(null);
      setMinDelivery(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/settings`, {
        deliveryRate: deliveryRate ?? 0,
        minDelivery: minDelivery ?? 0,
      });
      alert("✅ Configurações salvas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("❌ Erro ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  };

  const fetchKeepAliveStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/keepalive/status`);
      if (!res.ok) throw new Error("Erro ao buscar status");
      const data = await res.json();
      setKeepAliveStatus(data.enabled ? "Ativo" : "Inativo");
      setKeepAliveLastPing(data.lastPing ?? null);
    } catch (err) {
      console.error("Erro ao buscar status do KeepAlive:", err);
      setKeepAliveStatus("Indisponível");
      setKeepAliveLastPing(null);
    }
  };

  const handleKeepAliveToggle = async (action: "enable" | "disable") => {
    try {
      await fetch(`${API_URL}/keepalive/${action}`, { method: "POST" });
      await fetchKeepAliveStatus();
      alert(
        action === "enable"
          ? "✅ KeepAlive ativado."
          : "✅ KeepAlive desativado.",
      );
    } catch (err) {
      console.error(`Erro ao ${action} KeepAlive:`, err);
      alert("❌ Não foi possível atualizar o KeepAlive.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div
          style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}
        >
          <button
            onClick={() => window.history.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            ← Voltar
          </button>
        </div>

        <h1 className="mb-6 text-center text-2xl font-bold text-green-700">
          ⚙️ Configuração de Entrega
        </h1>

        {loading ? (
          <p className="text-center text-gray-600">Carregando...</p>
        ) : (
          <>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Valor por quilômetro (R$):
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={deliveryRate ?? ""}
              onChange={(e) => setDeliveryRate(parseFloat(e.target.value))}
              className="mb-4 w-full rounded border px-4 py-2 text-gray-800 shadow"
              placeholder="Ex: 2.5"
            />

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Valor mínimo de entrega (R$):
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={minDelivery ?? ""}
              onChange={(e) => setMinDelivery(parseFloat(e.target.value))}
              className="mb-4 w-full rounded border px-4 py-2 text-gray-800 shadow"
              placeholder="Ex: 8.0"
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="mb-6 w-full rounded bg-green-600 px-4 py-2 font-semibold text-white shadow hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "💾 Salvar Configuração"}
            </button>

            <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-gray-700">
                🌐 KeepAlive do Banco
              </h2>
              <p className="mb-4 text-sm text-gray-600">
                Status:{" "}
                <span
                  className={
                    keepAliveStatus === "Ativo" ? "text-green-600" : "text-red-600"
                  }
                >
                  {keepAliveStatus}
                </span>
                {keepAliveLastPing && (
                  <>
                    {" "}
                    · Último ping:{" "}
                    {new Date(keepAliveLastPing).toLocaleString("pt-BR")}
                  </>
                )}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => handleKeepAliveToggle("enable")}
                  className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  Ativar Manter Acordado
                </button>
                <button
                  onClick={() => handleKeepAliveToggle("disable")}
                  className="w-full rounded bg-gray-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-600"
                >
                  Desativar Manter Acordado
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
