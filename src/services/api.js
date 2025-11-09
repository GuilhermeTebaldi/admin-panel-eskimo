import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ||
  "https://backend-eskimo.onrender.com/api";

const api = axios.create({
  baseURL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")?.trim();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  try {
    const store = localStorage.getItem("eskimo_store");
    if (store && store.trim() !== "") {
      config.headers = config.headers ?? {};
      config.headers["X-Store"] = store.trim().toLowerCase();
    }
  } catch {
    // ignore
  }
  return config;
});

export default api;

// ===== Helpers para Settings/Status =====
export const SettingsAPI = {
  async get() {
    const { data } = await api.get("/settings");
    return data;
  },
  async template() {
    const { data } = await api.get("/settings/template");
    return data;
  },
  async save(payload) {
    const { data } = await api.put("/settings", payload);
    return data;
  },
  async closeToday() {
    // Implementa "fechar hoje" adicionando uma exceção { date: hoje, closed: true }
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const today = `${yyyy}-${mm}-${dd}`;

    const current = await this.get();
    const exceptions = safeParseJson(current.exceptionsJson, []);
    if (!exceptions.find((e) => e.date === today && e.closed === true)) {
      exceptions.push({ date: today, closed: true });
    }
    const opening = safeParseJson(current.openingHoursJson, {});
    return this.save({
      deliveryRate:
        typeof current.deliveryRate === "number"
          ? current.deliveryRate
          : Number(current.deliveryRate ?? 0),
      minDelivery:
        typeof current.minDelivery === "number"
          ? current.minDelivery
          : Number(current.minDelivery ?? 0),
      timeZone: current.timeZone || "America/Sao_Paulo",
      openingHoursJson: JSON.stringify(opening),
      exceptionsJson: JSON.stringify(exceptions),
    });
  },
};

export const StatusAPI = {
  async isOpen(store) {
    const endpoint = store
      ? `/status/isOpen/${encodeURIComponent(store)}`
      : "/status/isOpen";
    const { data } = await api.get(endpoint);
    return data; // { isOpen, message, now, nextOpening? }
  },
};

export const StoreSettingsAPI = {
  async get(store) {
    const { data } = await api.get(`/store-settings/${encodeURIComponent(store)}`);
    return data;
  },
  async save(store, payload) {
    const { data } = await api.put(
      `/store-settings/${encodeURIComponent(store)}`,
      payload,
    );
    return data;
  },
};

function safeParseJson(str, fallback) {
  try {
    return typeof str === "string" ? JSON.parse(str || "") : str ?? fallback;
  } catch {
    return fallback;
  }
}
