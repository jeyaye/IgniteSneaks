import { useEffect, useState } from "react";
import api from "../api";

import ProductCard from "../components/ProductCard";

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await api.get("/products");
        setProducts(response.data.products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setError("Unable to load sneakers. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return <p>Loading sneakers...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="hero-tagline">FUEL YOUR NEXT MOVE.</p>

          <h1>STEP INTO YOUR NEXT ERA.</h1>

          <p>
            Discover sneakers that combine timeless style, everyday comfort, and
            performance.
          </p>

          <a href="#sneakers" className="hero-button">
            EXPLORE COLLECTION
          </a>
        </div>
      </section>

      <section id="sneakers" className="sneakers-section">
        <h2>Our Collection</h2>

        {products.length === 0 ? (
          <p>No sneakers are currently available.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Shop;
