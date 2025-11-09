import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

const cardStyle = {
  background: "#fff",
  borderRadius: "1.25rem",
  padding: "1.5rem",
  boxShadow: "0 15px 40px rgba(15,23,42,0.08)",
  border: "1px solid rgba(15,23,42,0.06)",
};

export default function CustomersDashboard() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [password, setPassword] = useState("");
  const [busyReset, setBusyReset] = useState(false);

  useEffect(() => {
    void fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/store-customers");
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.response?.status === 401) {
        alert("Sessão expirada ou sem permissão. Faça login como admin.");
        navigate("/");
        return;
      }
      console.error(err);
      alert("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) => {
      return (
        (c.fullName ?? "").toLowerCase().includes(term) ||
        (c.email ?? "").toLowerCase().includes(term) ||
        (c.nickname ?? "").toLowerCase().includes(term) ||
        (c.phoneNumber ?? "").toLowerCase().includes(term)
      );
    });
  }, [customers, search]);

  const stats = useMemo(() => {
    const totalSpent = customers.reduce((sum, c) => sum + Number(c.totalSpent ?? 0), 0);
    const withOrders = customers.filter((c) => (c.ordersCount ?? 0) > 0).length;
    return {
      total: customers.length,
      withOrders,
      totalSpent,
      avgTicket: withOrders > 0 ? totalSpent / withOrders : 0,
    };
  }, [customers]);

  const selectCustomer = async (customer) => {
    setSelected(customer);
    setDetail(null);
    setPassword("");
    try {
      const { data } = await api.get(`/store-customers/${customer.id}`);
      setDetail(data);
    } catch (err) {
      if (err?.response?.status === 401) {
        alert("Sessão expirada ou sem permissão. Faça login como admin.");
        navigate("/");
        return;
      }
      console.error(err);
      alert("Não foi possível carregar os detalhes do cliente.");
    }
  };

  const handleResetPassword = async () => {
    if (!selected) return;
    if (!password || password.trim().length < 6) {
      alert("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setBusyReset(true);
    try {
      await api.put(`/store-customers/${selected.id}/password`, {
        newPassword: password.trim(),
      });
      alert("Senha atualizada com sucesso!");
      setPassword("");
    } catch (err) {
      if (err?.response?.status === 401) {
        alert("Sessão expirada ou sem permissão. Faça login como admin.");
        navigate("/");
        return;
      }
      console.error(err);
      alert("Erro ao redefinir a senha.");
    } finally {
      setBusyReset(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", color: "#0f172a", marginBottom: "0.5rem" }}>
              Usuários — Dashboard
            </h1>
            <p style={{ color: "#475569" }}>
              Consulte todos os clientes cadastrados na loja e acompanhe seu histórico.
            </p>
          </div>
          <button
            onClick={() => navigate("/cadastro")}
            style={{
              background: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.75rem 1.5rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 10px 20px rgba(14,165,233,0.3)",
            }}
          >
            ← Voltar para cadastro
          </button>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ ...cardStyle, background: "linear-gradient(120deg,#34d399,#10b981)" }}>
            <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "0.25rem" }}>Clientes cadastrados</p>
            <strong style={{ color: "#fff", fontSize: "1.75rem" }}>{stats.total}</strong>
          </div>
          <div style={{ ...cardStyle, background: "linear-gradient(120deg,#38bdf8,#0ea5e9)" }}>
            <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "0.25rem" }}>Clientes com pedidos</p>
            <strong style={{ color: "#fff", fontSize: "1.75rem" }}>{stats.withOrders}</strong>
          </div>
          <div style={{ ...cardStyle, background: "linear-gradient(120deg,#f97316,#fb923c)" }}>
            <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "0.25rem" }}>Receita acumulada</p>
            <strong style={{ color: "#fff", fontSize: "1.75rem" }}>
              {stats.totalSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </strong>
          </div>
          <div style={{ ...cardStyle, background: "linear-gradient(120deg,#c084fc,#a855f7)" }}>
            <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "0.25rem" }}>Ticket médio (clientes ativos)</p>
            <strong style={{ color: "#fff", fontSize: "1.75rem" }}>
              {stats.avgTicket.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </strong>
          </div>
        </div>

        <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              borderRadius: "0.75rem",
              border: "1px solid #cbd5f5",
              padding: "0.85rem 1rem",
              background: "#fff",
            }}
          />
          <button
            onClick={fetchCustomers}
            style={{
              borderRadius: "0.75rem",
              border: "none",
              background: "#16a34a",
              color: "#fff",
              padding: "0.85rem 1.25rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Atualizar
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "1.5rem" }}>
          <div style={{ ...cardStyle, maxHeight: "65vh", overflowY: "auto" }}>
            {loading ? (
              <p>Carregando clientes...</p>
            ) : filtered.length === 0 ? (
              <p>Nenhum cliente encontrado.</p>
            ) : (
              filtered.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "1px solid rgba(15,23,42,0.08)",
                    borderRadius: "1rem",
                    padding: "0.85rem",
                    marginBottom: "0.75rem",
                    background: selected?.id === customer.id ? "#ecfccb" : "#fff",
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>
                    {customer.fullName || "Sem nome"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                    {customer.email}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Pedidos: {customer.ordersCount ?? 0} ·{" "}
                    Último: {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString("pt-BR") : "—"}
                  </div>
                </button>
              ))
            )}
          </div>

          <div style={{ ...cardStyle, minHeight: "400px" }}>
            {!selected ? (
              <p style={{ color: "#475569" }}>Selecione um cliente para ver os detalhes.</p>
            ) : !detail ? (
              <p>Carregando dados do cliente...</p>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a" }}>
                      {detail.customer.fullName}
                    </h2>
                    <p style={{ margin: 0, color: "#475569" }}>{detail.customer.email}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569" }}>
                      Criado em {new Date(detail.customer.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569" }}>
                      Última atualização {new Date(detail.customer.updatedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div style={miniCard}>
                    <span>Pedidos</span>
                    <strong>{detail.stats?.totalOrders ?? 0}</strong>
                  </div>
                  <div style={miniCard}>
                    <span>Último pedido</span>
                    <strong>
                      {detail.stats?.lastOrderAt
                        ? new Date(detail.stats.lastOrderAt).toLocaleDateString("pt-BR")
                        : "—"}
                    </strong>
                  </div>
                  <div style={miniCard}>
                    <span>Total gasto</span>
                    <strong>
                      {(detail.stats?.totalSpent ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </strong>
                  </div>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <h3 style={{ marginBottom: "0.5rem", color: "#0f172a" }}>Dados de contato</h3>
                  <p style={{ margin: "0.15rem 0", color: "#475569" }}>
                    Apelido: {detail.customer.nickname || "—"}
                  </p>
                  <p style={{ margin: "0.15rem 0", color: "#475569" }}>
                    WhatsApp: {detail.customer.phoneNumber || "—"}
                  </p>
                  <p style={{ margin: "0.15rem 0", color: "#475569" }}>
                    Bairro: {detail.customer.neighborhood || "—"}
                  </p>
                  <p style={{ margin: "0.15rem 0", color: "#475569" }}>
                    Rua / Nº: {detail.customer.street || "—"}{" "}
                    {detail.customer.number ? `, ${detail.customer.number}` : ""}
                  </p>
                  <p style={{ margin: "0.15rem 0", color: "#475569" }}>
                    Complemento: {detail.customer.complement || "—"}
                  </p>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <h3 style={{ marginBottom: "0.5rem", color: "#0f172a" }}>Redefinir senha</h3>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="password"
                      placeholder="Nova senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        flex: 1,
                        borderRadius: "0.75rem",
                        border: "1px solid #cbd5f5",
                        padding: "0.5rem 0.75rem",
                      }}
                    />
                    <button
                      onClick={handleResetPassword}
                      disabled={busyReset}
                      style={{
                        border: "none",
                        borderRadius: "0.75rem",
                        background: busyReset ? "#94a3b8" : "#f97316",
                        color: "#fff",
                        padding: "0.5rem 1rem",
                        fontWeight: 600,
                        cursor: busyReset ? "wait" : "pointer",
                      }}
                    >
                      {busyReset ? "Salvando..." : "Atualizar"}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 style={{ marginBottom: "0.5rem", color: "#0f172a" }}>Pedidos recentes</h3>
                  {detail.orders && detail.orders.length > 0 ? (
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                      {detail.orders.map((order) => (
                        <div
                          key={order.id}
                          style={{
                            border: "1px solid rgba(15,23,42,0.08)",
                            borderRadius: "0.75rem",
                            padding: "0.75rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                            <span>#{order.id}</span>
                            <span>{toBRL(order.total)}</span>
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                            {order.store?.toUpperCase()} · {order.deliveryType === "entregar" ? "Entrega" : "Retirada"}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                            {new Date(order.createdAt).toLocaleString("pt-BR")}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#475569" }}>Esse cliente ainda não realizou pedidos.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function toBRL(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const miniCard = {
  borderRadius: "1rem",
  border: "1px solid rgba(15,23,42,0.08)",
  padding: "0.75rem",
  background: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};
