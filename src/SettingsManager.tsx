import React, { useEffect, useMemo, useState } from "react";
import { SettingsAPI, StatusAPI } from "./services/api";

type TimeRange = { start: string; end: string };
type WeekMap = Record<string, TimeRange[]>;
type ExceptionDay = { date: string; closed?: boolean; ranges?: TimeRange[] };

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const DAY_LABELS: Record<string, string> = {
  sunday: "Domingo",
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
};

export default function SettingsManager() {
  const [deliveryRate, setDeliveryRate] = useState<number | null>(null);
  const [minDelivery, setMinDelivery] = useState<number | null>(null);
  const [keepAliveStatus, setKeepAliveStatus] = useState("Carregando...");
  const [keepAliveLastPing, setKeepAliveLastPing] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeZone, setTimeZone] = useState("America/Sao_Paulo");
  const [week, setWeek] = useState<WeekMap>({
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
  });
  const [exceptions, setExceptions] = useState<ExceptionDay[]>([]);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [nextOpening, setNextOpening] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    let active = true;

    const loadInitial = async () => {
      try {
        setLoading(true);
        const [cfg, st] = await Promise.all([
          SettingsAPI.get().catch(async () => SettingsAPI.template()),
          StatusAPI.isOpen().catch(() => null),
        ]);

        if (!active) {
          return;
        }

        setDeliveryRate(
          typeof cfg?.deliveryRate === "number" ? cfg.deliveryRate : null,
        );
        setMinDelivery(
          typeof cfg?.minDelivery === "number" ? cfg.minDelivery : null,
        );
        setTimeZone(cfg?.timeZone || "America/Sao_Paulo");
        setWeek(parseWeek(cfg?.openingHoursJson));
        setExceptions(parseExceptions(cfg?.exceptionsJson));

        if (st) {
          setIsOpen(!!st.isOpen);
          setStatusMsg(st.message || "");
          setNextOpening(st.nextOpening || null);
        } else {
          setIsOpen(null);
          setStatusMsg("");
          setNextOpening(null);
        }
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || "Falha ao carregar configurações");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitial();
    fetchKeepAliveStatus();

    return () => {
      active = false;
    };
  }, []);

  const sortedExceptions = useMemo(
    () => [...exceptions].sort((a, b) => a.date.localeCompare(b.date)),
    [exceptions],
  );

  async function fetchKeepAliveStatus() {
    try {
      const res = await fetch(`${API_URL}/keepalive/status`);
      if (!res.ok) {
        throw new Error("Erro ao buscar status do KeepAlive");
      }
      const data = await res.json();
      setKeepAliveStatus(data.enabled ? "Ativo" : "Inativo");
      setKeepAliveLastPing(data.lastPing ?? null);
    } catch (err) {
      console.error("Erro ao buscar status do KeepAlive:", err);
      setKeepAliveStatus("Indisponível");
      setKeepAliveLastPing(null);
    }
  }

  async function handleKeepAliveToggle(action: "enable" | "disable") {
    try {
      const res = await fetch(`${API_URL}/keepalive/${action}`, { method: "POST" });
      if (!res.ok) throw new Error(`Erro ao ${action} KeepAlive`);
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
  }

  const safeNumber = (value: number | null) =>
    typeof value === "number" && !Number.isNaN(value) ? value : 0;

  async function refreshStatus() {
    try {
      const st = await StatusAPI.isOpen();
      setIsOpen(!!st.isOpen);
      setStatusMsg(st.message || "");
      setNextOpening(st.nextOpening || null);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setOk("");

      await SettingsAPI.save({
        deliveryRate: safeNumber(deliveryRate),
        minDelivery: safeNumber(minDelivery),
        timeZone,
        openingHoursJson: JSON.stringify(week),
        exceptionsJson: JSON.stringify(exceptions),
      });

      setOk("Configuração salva.");
      await refreshStatus();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseToday() {
    try {
      setSaving(true);
      setError("");
      setOk("");

      const today = isoToday();
      const updated = [...exceptions];
      const idx = updated.findIndex((e) => e.date === today);
      if (idx >= 0) {
        updated[idx] = { date: today, closed: true, ranges: [] };
      } else {
        updated.push({ date: today, closed: true });
      }

      setExceptions(updated);

      await SettingsAPI.save({
        deliveryRate: safeNumber(deliveryRate),
        minDelivery: safeNumber(minDelivery),
        timeZone,
        openingHoursJson: JSON.stringify(week),
        exceptionsJson: JSON.stringify(updated),
      });

      setOk("Exceção adicionada para hoje.");
      await refreshStatus();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Erro ao fechar hoje");
    } finally {
      setSaving(false);
    }
  }

  function addRange(dayKey: string) {
    setWeek((prev) => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), { start: "09:00", end: "18:00" }],
    }));
  }

  function updateRange(
    dayKey: string,
    idx: number,
    field: "start" | "end",
    value: string,
  ) {
    setWeek((prev) => {
      const arr = [...(prev[dayKey] || [])];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, [dayKey]: arr };
    });
  }

  function removeRange(dayKey: string, idx: number) {
    setWeek((prev) => {
      const arr = [...(prev[dayKey] || [])];
      arr.splice(idx, 1);
      return { ...prev, [dayKey]: arr };
    });
  }

  function addException() {
    setExceptions((prev) => [...prev, { date: isoToday(), closed: true }]);
  }

  function updateException(idx: number, patch: Partial<ExceptionDay>) {
    setExceptions((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], ...patch };
      if (patch.closed) {
        arr[idx].ranges = [];
      }
      return arr;
    });
  }

  function removeException(idx: number) {
    setExceptions((prev) => prev.filter((_, i) => i !== idx));
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Carregando…</div>;
  }

  return (
    <div className="min-h-screen bg-green-50 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => window.history.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            ← Voltar
          </button>
          <StatusPill isOpen={isOpen} msg={statusMsg} next={nextOpening} />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}
        {ok && (
          <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            {ok}
          </div>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-green-700">
            ⚙️ Configuração de Entrega
          </h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Valor por quilômetro (R$):
              <input
                type="number"
                min="0"
                step="0.1"
                value={deliveryRate ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setDeliveryRate(value === "" ? null : Number(value));
                }}
                className="mt-1 w-full rounded border px-4 py-2 text-gray-800 shadow"
                placeholder="Ex: 2.5"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Valor mínimo de entrega (R$):
              <input
                type="number"
                min="0"
                step="0.1"
                value={minDelivery ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setMinDelivery(value === "" ? null : Number(value));
                }}
                className="mt-1 w-full rounded border px-4 py-2 text-gray-800 shadow"
                placeholder="Ex: 8.0"
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded bg-green-600 px-4 py-2 font-semibold text-white shadow hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? "Salvando…" : "💾 Salvar Configuração"}
          </button>

          <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-gray-700">
              🌐 KeepAlive do Banco
            </h3>
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
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-medium text-gray-800">Timezone</h2>
          <div className="max-w-md">
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              placeholder="Ex.: America/Sao_Paulo"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use um ID IANA. Ex.: America/Sao_Paulo
            </p>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-gray-800">Semana</h2>
            <button
              onClick={handleCloseToday}
              disabled={saving}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Fechar hoje
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {DAY_KEYS.map((k) => (
              <div key={k} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium text-gray-700">{DAY_LABELS[k]}</div>
                  <button
                    type="button"
                    onClick={() => addRange(k)}
                    className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                  >
                    + faixa
                  </button>
                </div>
                {(week[k] || []).length === 0 && (
                  <div className="text-xs text-gray-500">
                    Sem faixas. Dia fechado.
                  </div>
                )}
                <div className="space-y-2">
                  {(week[k] || []).map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        className="rounded-md border px-2 py-1 text-sm"
                        value={r.start}
                        onChange={(e) => updateRange(k, idx, "start", e.target.value)}
                      />
                      <span className="text-xs text-gray-500">até</span>
                      <input
                        type="time"
                        className="rounded-md border px-2 py-1 text-sm"
                        value={r.end}
                        onChange={(e) => updateRange(k, idx, "end", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeRange(k, idx)}
                        className="ml-auto text-xs text-red-600 hover:underline"
                      >
                        remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-gray-800">Exceções</h2>
            <button
              type="button"
              onClick={addException}
              className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
            >
              + exceção
            </button>
          </div>
          {sortedExceptions.length === 0 && (
            <div className="text-xs text-gray-500">Nenhuma exceção cadastrada.</div>
          )}
          <div className="space-y-3">
            {sortedExceptions.map((ex, idx) => {
              const originalIndex = exceptions.indexOf(ex);
              const targetIdx = originalIndex === -1 ? idx : originalIndex;

              return (
                <div key={`${ex.date}-${idx}`} className="rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      className="rounded-md border px-2 py-1 text-sm"
                      value={ex.date}
                      onChange={(e) =>
                        updateException(targetIdx, { date: e.target.value })
                      }
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!ex.closed}
                        onChange={(e) =>
                          updateException(targetIdx, { closed: e.target.checked })
                        }
                      />
                      Fechado o dia todo
                    </label>
                    <button
                      type="button"
                      onClick={() => removeException(targetIdx)}
                      className="ml-auto text-xs text-red-600 hover:underline"
                    >
                      remover
                    </button>
                  </div>
                  {!ex.closed && (
                    <div className="mt-3 space-y-2">
                      {(ex.ranges ?? []).map((r, ridx) => (
                        <div key={ridx} className="flex items-center gap-2">
                          <input
                            type="time"
                            className="rounded-md border px-2 py-1 text-sm"
                            value={r.start}
                            onChange={(e) =>
                              updateExceptionRange(
                                targetIdx,
                                ridx,
                                "start",
                                e.target.value,
                                exceptions,
                                setExceptions,
                              )
                            }
                          />
                          <span className="text-xs text-gray-500">até</span>
                          <input
                            type="time"
                            className="rounded-md border px-2 py-1 text-sm"
                            value={r.end}
                            onChange={(e) =>
                              updateExceptionRange(
                                targetIdx,
                                ridx,
                                "end",
                                e.target.value,
                                exceptions,
                                setExceptions,
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeExceptionRange(
                                targetIdx,
                                ridx,
                                exceptions,
                                setExceptions,
                              )
                            }
                            className="ml-auto text-xs text-red-600 hover:underline"
                          >
                            remover faixa
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          addExceptionRange(targetIdx, exceptions, setExceptions)
                        }
                        className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                      >
                        + faixa
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar horários e entrega"}
          </button>
          <button
            onClick={refreshStatus}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            Atualizar status
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  isOpen,
  msg,
  next,
}: {
  isOpen: boolean | null;
  msg: string;
  next: string | null;
}) {
  const stateClass =
    isOpen === null
      ? "bg-gray-100 text-gray-700"
      : isOpen
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700";
  const dotClass =
    isOpen === null
      ? "bg-gray-400"
      : isOpen
        ? "bg-green-600"
        : "bg-red-600";
  const label =
    msg ||
    (isOpen === null ? "Status indisponível" : isOpen ? "Aberto" : "Fechado");

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${stateClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span>{label}</span>
      {isOpen === false && next && (
        <span className="text-gray-500">• abre {next}</span>
      )}
    </div>
  );
}

function parseWeek(jsonLike: any): WeekMap {
  try {
    const obj =
      typeof jsonLike === "string" ? JSON.parse(jsonLike || "{}") : jsonLike || {};
    const base: WeekMap = {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    };
    for (const k of Object.keys(base)) {
      const arr = Array.isArray(obj[k]) ? obj[k] : [];
      base[k] = arr.map((r: any) => ({
        start: r.start || "09:00",
        end: r.end || "18:00",
      }));
    }
    return base;
  } catch {
    return {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    };
  }
}

function parseExceptions(jsonLike: any): ExceptionDay[] {
  try {
    const arr = typeof jsonLike === "string" ? JSON.parse(jsonLike || "[]") : jsonLike || [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function isoToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function addExceptionRange(
  idx: number,
  exceptions: ExceptionDay[],
  setExceptions: React.Dispatch<React.SetStateAction<ExceptionDay[]>>,
) {
  setExceptions((prev) => {
    const arr = [...prev];
    const cur = arr[idx] || { date: isoToday(), ranges: [] };
    cur.closed = false;
    cur.ranges = [...(cur.ranges || []), { start: "09:00", end: "12:00" }];
    arr[idx] = cur;
    return arr;
  });
}

function updateExceptionRange(
  idx: number,
  ridx: number,
  field: "start" | "end",
  value: string,
  exceptions: ExceptionDay[],
  setExceptions: React.Dispatch<React.SetStateAction<ExceptionDay[]>>,
) {
  setExceptions((prev) => {
    const arr = [...prev];
    const cur = { ...(arr[idx] || { date: isoToday(), ranges: [] }) };
    const ranges = [...(cur.ranges || [])];
    if (!ranges[ridx]) ranges[ridx] = { start: "09:00", end: "12:00" };
    ranges[ridx] = { ...ranges[ridx], [field]: value };
    cur.closed = false;
    cur.ranges = ranges;
    arr[idx] = cur;
    return arr;
  });
}

function removeExceptionRange(
  idx: number,
  ridx: number,
  exceptions: ExceptionDay[],
  setExceptions: React.Dispatch<React.SetStateAction<ExceptionDay[]>>,
) {
  setExceptions((prev) => {
    const arr = [...prev];
    const cur = { ...(arr[idx] || { date: isoToday(), ranges: [] }) };
    const ranges = [...(cur.ranges || [])];
    ranges.splice(ridx, 1);
    cur.ranges = ranges;
    cur.closed = ranges.length === 0 ? true : false;
    arr[idx] = cur;
    return arr;
  });
}
