
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import api from "../api";

function Checkout() {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();

  const [shippingInfo, setShippingInfo] = useState({
    recipientName: user?.username || "",
    phoneNumber: "",
    streetAddress: "",
    city: "",
    province: "",
    postalCode: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [order, setOrder] = useState(null);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const shippingFee = 150;
  const total = subtotal + shippingFee;

  function handleChange(event) {
    const { name, value } = event.target;

    setShippingInfo((currentInfo) => ({
      ...currentInfo,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setSessionExpired(false);

    try {
      const response = await api.post("/orders", {
        shippingInfo,
        items: cartItems.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
      });

      setOrder(response.data.order);
      clearCart();
    } catch (error) {
      console.error("Order submission error:", error);

      if (error.response?.status === 401) {
        setSessionExpired(true);
        setErrorMessage(
          "Your session has expired. Please log in again before placing your order.",
        );
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "Something went wrong while placing your order. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Display confirmation after a successful order.
  if (order) {
    return (
      <main className="checkout-page">
        <section className="order-confirmation">
          <h1>Thank you for your order!</h1>
          <p>Your order has been successfully placed.</p>

          <h2>Order Confirmation</h2>

          <p>
            Order Number: <strong>#{order.order_id}</strong>
          </p>

          <p>
            Status: <strong>{order.status}</strong>
          </p>

          <p>
            Subtotal: ₱
            {Number(order.subtotal).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>

          <p>
            Shipping: ₱
            {Number(order.shipping_fee).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>

          <h3>
            Total: ₱
            {Number(order.total).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h3>

          <Link to="/">Continue Shopping</Link>
        </section>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page">
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link to="/">Continue Shopping</Link>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <h1>Checkout</h1>

      <section className="shipping-form">
        <h2>Shipping Information</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="recipientName">Full Name</label>
            <input
              type="text"
              id="recipientName"
              name="recipientName"
              value={shippingInfo.recipientName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={shippingInfo.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="streetAddress">Street Address</label>
            <input
              type="text"
              id="streetAddress"
              name="streetAddress"
              value={shippingInfo.streetAddress}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={shippingInfo.city}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="province">Province</label>
            <input
              type="text"
              id="province"
              name="province"
              value={shippingInfo.province}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="postalCode">Postal Code</label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={shippingInfo.postalCode}
              onChange={handleChange}
              required
            />
          </div>

          {errorMessage && (
            <div className="checkout-error" role="alert">
              <p>{errorMessage}</p>

              {sessionExpired && (
                <Link to="/login">Go to Login</Link>
              )}
            </div>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      </section>

      <section className="checkout-items">
        <h2>Your Order</h2>

        {cartItems.map((item) => (
          <article key={item.variant_id} className="checkout-item">
            {item.image_url && (
              <img src={item.image_url} alt={item.name} width="100" />
            )}

            <div>
              <h3>{item.name}</h3>
              <p>{item.brand}</p>
              <p>Size: {Number(item.size).toFixed(1)}</p>
              <p>Quantity: {item.quantity}</p>
              <p>
                ₱
                {(item.price * item.quantity).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="checkout-summary">
        <h2>Order Summary</h2>

        <p>
          Subtotal: ₱
          {subtotal.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>

        <p>
          Shipping: ₱
          {shippingFee.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>

        <h3>
          Total: ₱
          {total.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h3>
      </section>
    </main>
  );
}

export default Checkout;
