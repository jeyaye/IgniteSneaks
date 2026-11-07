import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

import "../styles/order-history.css";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await api.get("/orders");
        setOrders(response.data.orders);
      } catch (error) {
        console.error("Fetch orders error:", error);

        setErrorMessage(
          error.response?.data?.message || "Unable to retrieve your orders.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, []);

  function formatPrice(value) {
    return Number(value).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(value) {
    return new Date(value).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (isLoading) {
    return (
      <main className="order-history-page">
        <h1>My Orders</h1>
        <p>Loading your orders...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="order-history-page">
        <h1>My Orders</h1>
        <p role="alert">{errorMessage}</p>
        <Link to="/">Return to Shop</Link>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="order-history-page">
        <h1>My Orders</h1>
        <p>You haven't placed any orders yet.</p>
        <Link to="/">Start Shopping</Link>
      </main>
    );
  }

  return (
    <main className="order-history-page">
      <h1>My Orders</h1>

      {orders.map((order) => (
        <article key={order.order_id} className="order-card">
          <h2>Order #{order.order_id}</h2>

          <p>Status: {order.status}</p>
          <p>Placed: {formatDate(order.created_at)}</p>

          <h3>Items</h3>

          {order.items.map((item) => (
            <div key={item.order_item_id} className="order-item">
              <h4>{item.name}</h4>
              <p>Brand: {item.brand}</p>
              <p>Size: {Number(item.size).toFixed(1)}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Unit Price: ₱{formatPrice(item.unit_price)}</p>
              <p>
                Item Total: ₱
                {formatPrice(Number(item.unit_price) * item.quantity)}
              </p>
            </div>
          ))}

          <h3>Shipping Information</h3>

          <p>{order.recipient_name}</p>
          <p>{order.phone_number}</p>
          <p>{order.street_address}</p>
          <p>
            {order.city}, {order.province} {order.postal_code}
          </p>

          <h3>Order Summary</h3>

          <p>Subtotal: ₱{formatPrice(order.subtotal)}</p>
          <p>Shipping: ₱{formatPrice(order.shipping_fee)}</p>
          <p>Total: ₱{formatPrice(order.total)}</p>
        </article>
      ))}
    </main>
  );
}

export default OrderHistory;
