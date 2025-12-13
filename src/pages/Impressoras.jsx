import { useEffect, useState } from "react";

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || "";
const STORE_OPTIONS = [
  { value: "efapi", label: "Efapi" },
  { value: "palmital", label: "Palmital" },
  { value: "passo", label: "Passo" }
];

const LOCAL_PRINT_SERVER = "http://localhost:9101";

export default function Impressoras() {
  const role = localStorage.getItem("role");
  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-slate-600">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">Acesso restrito</h1>
          <p className="mt-2 text-sm">
            Esta área é exclusiva para administradores responsáveis pela operação.
          </p>
        </div>
      </div>
    );
  }

  return <ImpressorasAdmin />;
}

function ImpressorasAdmin() {
  const [status, setStatus] = useState({
    online: false,
    message: "Verificando status...",
    info: null
  });
  const [form, setForm] = useState({
    store: STORE_OPTIONS[0].value,
    printerName: "",
    copies: 1,
    apiBaseUrl: DEFAULT_API_URL,
    printerKey: ""
  });
  const [printers, setPrinters] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    setFeedback("");
    try {
      const res = await fetch(`${LOCAL_PRINT_SERVER}/status`);
      if (!res.ok) throw new Error("Status indisponível");
      const data = await res.json();
      setStatus({
        online: true,
        message: "Print Server ONLINE",
        info: data
      });
      setForm((prev) => ({
        ...prev,
        store: data.store || prev.store,
        printerName: data.printerName || prev.printerName,
        copies: data.copies || prev.copies,
        apiBaseUrl: data.apiBaseUrl || prev.apiBaseUrl
      }));
    } catch (error) {
      console.error("Erro ao verificar status do Print Server", error);
      setStatus({
        online: false,
        message: "Print Server OFFLINE",
        info: null
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleListPrinters = async () => {
    setFeedback("");
    if (!status.online) {
      setFeedback("Aguarde o Print Server ficar online.");
      return;
    }

    try {
      const res = await fetch(`${LOCAL_PRINT_SERVER}/printers`);
      if (!res.ok) throw new Error("Não foi possível listar as impressoras.");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPrinters(data);
        if (data.length > 0 && !data.includes(form.printerName)) {
          setForm((prev) => ({ ...prev, printerName: data[0] }));
        }
      } else {
        setPrinters([]);
      }
      setFeedback("Lista de impressoras atualizada.");
    } catch (error) {
      console.error("Erro ao listar impressoras", error);
      setPrinters([]);
      setFeedback("Não foi possível conectar ao servidor de impressão.");
    }
  };

  const handleSave = async () => {
    setFeedback("");
    try {
      const payload = {
        store: form.store,
        printerName: form.printerName,
        copies: Number(form.copies),
        apiBaseUrl: form.apiBaseUrl,
        printerKey: form.printerKey
      };
      const res = await fetch(`${LOCAL_PRINT_SERVER}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Não foi possível salvar a configuração.");
      }

      setFeedback("Configuração salva com sucesso.");
      await fetchStatus();
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const handleTest = async () => {
    setFeedback("");
    try {
      const res = await fetch(`${LOCAL_PRINT_SERVER}/test`, {
        method: "POST"
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Erro ao imprimir teste.");
      }

      setFeedback("Cupom de teste enviado para a impressora.");
      await fetchStatus();
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-lg text-center">
          <p className="text-sm uppercase tracking-wide text-slate-400">Print Server local</p>
          <h1 className="text-3xl font-bold text-emerald-900">Impressoras automáticas</h1>
          <p className="mt-2 text-sm text-slate-500">
            Configure a loja, impressora e chave para permitir que o servidor local imprima automaticamente.
          </p>
        </header>

        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
              <div className="mt-1 flex items-center gap-3 text-lg font-semibold">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    status.online ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {status.online ? "ONLINE" : "OFFLINE"}
                </span>
                <span className="text-sm text-slate-500">{status.message}</span>
              </div>
              <p className="text-xs text-slate-400">
                {status.info?.store ? `Loja: ${status.info.store}` : "Sem loja definida"}
              </p>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loadingStatus}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingStatus ? "Atualizando..." : "Verificar servidor"}
            </button>
          </div>
        </div>

        {status.online ? (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/70 p-6 shadow">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">Loja</label>
                <select
                  value={form.store}
                  onChange={(e) => updateForm("store", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                >
                  {STORE_OPTIONS.map((store) => (
                    <option key={store.value} value={store.value}>
                      {store.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500">Impressora</label>
                <div className="mt-2 flex gap-2">
                  <select
                    value={form.printerName}
                    onChange={(e) => updateForm("printerName", e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="">Selecione</option>
                    {printers.map((printer) => (
                      <option key={printer} value={printer}>
                        {printer}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleListPrinters}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Listar impressoras
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500">Vias</label>
                <select
                  value={form.copies}
                  onChange={(e) => updateForm("copies", Number(e.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                >
                  {[1, 2, 3].map((copy) => (
                    <option key={copy} value={copy}>
                      {copy} via{copy > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500">API base</label>
                <input
                  value={form.apiBaseUrl}
                  onChange={(e) => updateForm("apiBaseUrl", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Printer Key</label>
                <input
                  value={form.printerKey}
                  onChange={(e) => updateForm("printerKey", e.target.value)}
                  type="password"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
              >
                Salvar
              </button>
              <button
                onClick={handleTest}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
              >
                Imprimir teste
              </button>
            </div>

            {feedback && (
              <p className="mt-4 text-sm text-slate-600">
                {feedback}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600 shadow">
            <p>
              Instale o Eskimo Print Server neste computador para habilitar a impressão automática. O
              servidor roda em http://localhost:9101.
            </p>
            <p>
              A impressora térmica USB precisa estar instalada no Windows e ser selecionada no painel.
            </p>
            <div className="flex flex-wrap gap-2">
            <a
              href="/eskimo-print-server/EskimoPrintServer-win-x64.zip"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
              download="EskimoPrintServer-win-x64.zip"
            >
              Baixar instalador Windows
            </a>

            <a
              href="/eskimo-print-server/EskimoPrintServer-osx-arm64.zip"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
              download="EskimoPrintServer-osx-arm64.zip"
            >
              Baixar instalador macOS (Apple Silicon)
            </a>

            <a
              href="/eskimo-print-server/EskimoPrintServer-osx-x64.zip"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
              download="EskimoPrintServer-osx-x64.zip"
            >
              Baixar instalador macOS (Intel)
            </a>
              <button
                type="button"
                onClick={fetchStatus}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
              >
                Recarregar status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
