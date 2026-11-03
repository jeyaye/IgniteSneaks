import { useCart } from "../context/useCart";
import { Link } from "react-router-dom";

function Cart() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  if (cartItems.length === 0) {
    return (
      <main className="cart-page">
        <h1>Your Shopping Cart</h1>
        <p>Your cart is currently empty.</p>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>Your Shopping Cart</h1>

      <section className="cart-items">
        {cartItems.map((item) => (
          <article key={item.variant_id} className="cart-item">
            {item.image_url && (
              <img src={item.image_url} alt={item.name} width="150" />
            )}

            <div>
              <p>{item.brand}</p>
              <h2>{item.name}</h2>

              <p>Size: {Number(item.size).toFixed(1)}</p>
              <div className="quantity-controls">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.variant_id, -1)}
                >
                  −
                </button>

                <span>{item.quantity}</span>

                <button
                  type="button"
                  onClick={() => updateQuantity(item.variant_id, 1)}
                  disabled={item.quantity >= item.stock_quantity}
                >
                  +
                </button>
              </div>

              <p>
                ₱
                {(item.price * item.quantity).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>

              <button
                type="button"
                onClick={() => removeFromCart(item.variant_id)}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="cart-summary">
        <h2>Order Summary</h2>

        <p>
          Subtotal: ₱
          {subtotal.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>

        <Link to="/checkout" className="checkout-button">
          Proceed to Checkout
        </Link>
      </section>
    </main>
  );
}

export default Cart;
