import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://backend-eskimo.onrender.com/api";

export default function SettingsManager() {
  const [deliveryRate, setDeliveryRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      setDeliveryRate(res.data.deliveryRate);
    } catch (err) {
      console.log("Nenhuma configuração encontrada.");
      setDeliveryRate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/settings`, {
        deliveryRate: deliveryRate ?? 0,
      });
      alert("✅ Valor por KM salvo com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("❌ Erro ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  };

  return (
    
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
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

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded bg-green-600 px-4 py-2 font-semibold text-white shadow hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "💾 Salvar Configuração"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
