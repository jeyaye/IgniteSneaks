import { useEffect, useMemo, useState } from "react";
import api from "../api";

import "../styles/admin.css";

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const nextStatus = {
    pending: "processing",
    processing: "shipped",
    shipped: "delivered",
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [ordersResponse, statsResponse] = await Promise.all([
          api.get("/admin/orders"),
          api.get("/admin/stats"),
        ]);

        setOrders(ordersResponse.data.orders);
        setStats(statsResponse.data.stats);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to retrieve dashboard information.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchTerm = search.trim().toLowerCase();

      const matchesSearch =
        !searchTerm ||
        String(order.order_id).includes(searchTerm) ||
        order.username.toLowerCase().includes(searchTerm) ||
        order.email.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  function handleStatusChange(orderId, status) {
    setSelectedStatuses((previous) => ({
      ...previous,
      [orderId]: status,
    }));
  }

  async function handleUpdateStatus(orderId, currentStatus) {
    const status = selectedStatuses[orderId] || nextStatus[currentStatus];

    if (!status) return;

    setUpdatingOrderId(orderId);
    setMessage("");
    setError("");

    try {
      const response = await api.patch(`/admin/orders/${orderId}/status`, {
        status,
      });

      setOrders((previous) =>
        previous.map((order) =>
          order.order_id === orderId
            ? { ...order, status: response.data.order.status }
            : order,
        ),
      );

      setSelectedStatuses((previous) => {
        const updated = { ...previous };
        delete updated[orderId];
        return updated;
      });

      setMessage(`Order #${orderId} updated to ${status}.`);

      // Refresh statistics after changing an order status.
      const statsResponse = await api.get("/admin/stats");
      setStats(statsResponse.data.stats);
    } catch (error) {
      setError(
        error.response?.data?.message || "Unable to update order status.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  if (loading) {
    return <p>Loading admin dashboard...</p>;
  }

  if (!stats) {
    return <p>{error || "Unable to load dashboard statistics."}</p>;
  }

  return (
    <main className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Manage customer orders and monitor store activity.</p>

      {/* Dashboard Statistics */}
      <section className="admin-stats">
        <article className="admin-stat-card">
          <h3>Total Orders</h3>
          <p>{stats.total_orders}</p>
        </article>

        <article className="admin-stat-card">
          <h3>Delivered Revenue</h3>
          <p>
            ₱
            {Number(stats.total_revenue).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </p>
        </article>

        <article className="admin-stat-card">
          <h3>Pending Orders</h3>
          <p>{stats.pending_orders}</p>
        </article>

        <article className="admin-stat-card">
          <h3>Registered Customers</h3>
          <p>{stats.total_customers}</p>
        </article>
      </section>

      {/* Notifications */}
      {message && <p>{message}</p>}
      {error && <p>{error}</p>}

      {/* Order Management */}
      <section className="admin-orders">
        <h2>Customer Orders ({orders.length})</h2>

        {/* Search and Filters */}
        <div className="admin-order-filters">
          <input
            type="text"
            placeholder="Search order ID, username, or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button type="button" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        <p>
          Showing {filteredOrders.length} of {orders.length} orders
        </p>

        {filteredOrders.length === 0 ? (
          <p>No matching orders found.</p>
        ) : (
          filteredOrders.map((order) => {
            const availableStatus = nextStatus[order.status];
            const selectedStatus =
              selectedStatuses[order.order_id] || availableStatus;

            return (
              <article key={order.order_id} className="admin-order-card">
                <div>
                  <h3>Order #{order.order_id}</h3>
                  <p>Customer: {order.username}</p>
                  <p>Email: {order.email}</p>
                  <p>Status: {order.status}</p>

                  <p>
                    Total: ₱
                    {Number(order.total).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>

                  <p>
                    Date: {new Date(order.created_at).toLocaleString("en-PH")}
                  </p>
                </div>

                <div>
                  <h4>Items</h4>

                  {order.items.map((item) => (
                    <p key={item.order_item_id}>
                      {item.brand} {item.name} — Size {item.size} ×{" "}
                      {item.quantity}
                    </p>
                  ))}
                </div>

                <div>
                  <h4>Shipping Information</h4>
                  <p>{order.recipient_name}</p>
                  <p>{order.phone_number}</p>
                  <p>
                    {order.street_address}, {order.city}, {order.province},{" "}
                    {order.postal_code}
                  </p>
                </div>

                <div className="admin-order-actions">
                  <h4>Manage Order</h4>

                  {availableStatus ? (
                    <>
                      <select
                        value={selectedStatus}
                        onChange={(event) =>
                          handleStatusChange(order.order_id, event.target.value)
                        }
                        disabled={updatingOrderId === order.order_id}
                      >
                        <option value={availableStatus}>
                          {availableStatus.charAt(0).toUpperCase() +
                            availableStatus.slice(1)}
                        </option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(order.order_id, order.status)
                        }
                        disabled={updatingOrderId === order.order_id}
                      >
                        {updatingOrderId === order.order_id
                          ? "Updating..."
                          : "Update Status"}
                      </button>
                    </>
                  ) : (
                    <p>No further status changes available.</p>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;
