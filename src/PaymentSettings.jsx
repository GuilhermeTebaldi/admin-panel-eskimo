import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// API base
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
// JWT header
const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

// Lojas padrão do sistema (mesmos nomes usados nos pedidos)
const LOJAS = ["Efapi", "Palmital", "Passo dos Fortes"];

export default function PaymentSettings() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  // seleção e form
  const [store, setStore] = useState(LOJAS[0]);
  const [cnpj, setCnpj] = useState("");
  const [provider, setProvider] = useState("mercadopago");
  const [isActive, setIsActive] = useState(true);

  // Mercado Pago
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [mpAccessToken, setMpAccessToken] = useState("");

  // PIX Banco (futuro)
  const [pixKey, setPixKey] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankClientId, setBankClientId] = useState("");
  const [bankClientSecret, setBankClientSecret] = useState("");
  const [bankCertPath, setBankCertPath] = useState("");
  const [bankCertPassword, setBankCertPassword] = useState("");

  const loadAll = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/paymentconfigs`, auth).catch(async (e) => {
        // se a rota não exigir auth, tenta sem header
        if (e?.response?.status === 401) throw e;
        const resp = await axios.get(`${API_URL}/paymentconfigs`);
        return resp;
      });
      setConfigs(data || []);
    } catch {
      toast.error("Não foi possível carregar as configurações de pagamento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const fillFormFromStore = (storeName) => {
    const cfg = configs.find((c) => c.store === storeName);
    setStore(storeName);
    setCnpj(cfg?.cnpj || "");
    setProvider(cfg?.provider || "mercadopago");
    setIsActive(cfg?.isActive ?? true);
    setMpPublicKey(cfg?.mpPublicKey || "");
    setMpAccessToken(cfg?.mpAccessToken || "");
    setPixKey(cfg?.pixKey || "");
    setBankName(cfg?.bankName || "");
    setBankClientId(cfg?.bankClientId || "");
    setBankClientSecret(cfg?.bankClientSecret || "");
    setBankCertPath(cfg?.bankCertPath || "");
    setBankCertPassword(cfg?.bankCertPassword || "");
  };

  // Preenche form quando trocar seleção
  useEffect(() => {
    if (configs.length) fillFormFromStore(store);
  }, [configs]); // ao carregar configs, sincroniza form da loja padrão
  useEffect(() => {
    fillFormFromStore(store);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]); // ao trocar loja no select

  const handleSave = async () => {
    try {
      const body = {
        cnpj,
        provider,
        isActive,
        mpPublicKey,
        mpAccessToken,
        pixKey,
        bankName,
        bankClientId,
        bankClientSecret,
        bankCertPath,
        bankCertPassword,
      };

      await axios
        .put(`${API_URL}/paymentconfigs/${encodeURIComponent(store)}`, body, auth)
        .catch(async (e) => {
          if (e?.response?.status === 401) throw e;
          return axios.put(`${API_URL}/paymentconfigs/${encodeURIComponent(store)}`, body);
        });

      toast.success(`Configuração da loja "${store}" salva!`);
      loadAll();
    } catch (e) {
      console.error(e);
      toast.error("Falha ao salvar configuração.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remover configuração da loja "${store}"?`)) return;
    try {
      await axios
        .delete(`${API_URL}/paymentconfigs/${encodeURIComponent(store)}`, auth)
        .catch(async (e) => {
          if (e?.response?.status === 401) throw e;
          return axios.delete(`${API_URL}/paymentconfigs/${encodeURIComponent(store)}`);
        });
      toast.info(`Configuração da loja "${store}" removida.`);
      loadAll();
    } catch (e) {
      console.error(e);
      toast.error("Falha ao remover configuração.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-gray-50 py-10 px-4 text-gray-800">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900">⚙️ Pagamentos por Loja (CNPJ)</h1>
          <button onClick={() => window.history.back()} className="rounded-md border border-gray-300 bg-white px-4 py-1 text-sm text-gray-600 hover:bg-gray-100">
            ← Voltar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Coluna esquerda: lista/overview */}
          <div className="rounded-xl border bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-bold text-gray-800">Lojas configuradas</h2>

            {loading ? (
              <p className="text-sm text-gray-500">Carregando…</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {LOJAS.map((nome) => {
                  const cfg = configs.find((c) => c.store === nome);
                  return (
                    <li key={nome} className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-semibold">{nome}</div>
                        <div className="text-xs text-gray-600">
                          {cfg ? (
                            <>
                              <span className="mr-2">CNPJ: {cfg.cnpj || "—"}</span>
                              <span className="mr-2">Prov.: {cfg.provider || "—"}</span>
                              <span>Status: {cfg.isActive ? "Ativo" : "Inativo"}</span>
                            </>
                          ) : (
                            <span className="text-amber-700">Sem configuração</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setStore(nome)}
                        className={`rounded px-3 py-1 text-sm font-semibold ${
                          store === nome ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {store === nome ? "Selecionado" : "Selecionar"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Coluna direita: formulário */}
          <div className="rounded-xl border bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-bold text-gray-800">Editar configuração</h2>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">Loja</label>
              <select
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                {LOJAS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">CNPJ</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Provedor</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="pix_banco">PIX (Banco)</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">Ativo</span>
                </label>
              </div>
            </div>

            {/* Mercado Pago */}
            <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="mb-2 text-sm font-semibold text-blue-800">Credenciais Mercado Pago</div>
              <label className="block text-xs text-gray-700">Public Key</label>
              <input
                type="text"
                value={mpPublicKey}
                onChange={(e) => setMpPublicKey(e.target.value)}
                placeholder="APP_USR-..."
                className="mb-2 mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <label className="block text-xs text-gray-700">Access Token</label>
              <input
                type="text"
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
                placeholder="APP_USR-..."
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            {/* PIX Banco (futuro) */}
            <details className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-gray-800">PIX (Banco) — avançado</summary>
              <div className="mt-2 grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-gray-700">Chave PIX</label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="CNPJ/EVP/email/telefone"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700">Banco</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Itaú / Sicredi / ... "
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-700">Client ID</label>
                    <input
                      type="text"
                      value={bankClientId}
                      onChange={(e) => setBankClientId(e.target.value)}
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700">Client Secret</label>
                    <input
                      type="password"
                      value={bankClientSecret}
                      onChange={(e) => setBankClientSecret(e.target.value)}
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-700">Cert Path</label>
                    <input
                      type="text"
                      value={bankCertPath}
                      onChange={(e) => setBankCertPath(e.target.value)}
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700">Cert Password</label>
                    <input
                      type="password"
                      value={bankCertPassword}
                      onChange={(e) => setBankCertPassword(e.target.value)}
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </details>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleSave}
                className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                💾 Salvar
              </button>
              <button
                onClick={handleDelete}
                className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                🗑 Remover Configuração
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Dica: use exatamente os nomes de loja que aparecem nos pedidos (“Efapi”, “Palmital”, “Passo dos Fortes”).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
