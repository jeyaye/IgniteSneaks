import { useEffect, useMemo, useState } from "react";
import api from "../api";

import ProductCard from "../components/ProductCard";
import "../styles/shop.css";


function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search and filter states
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [sortOrder, setSortOrder] = useState("default");
  const [inStockOnly, setInStockOnly] = useState(false);

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

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search by product name or brand
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.brand.toLowerCase().includes(searchTerm),
      );
    }

    // Filter by brand
    if (selectedBrand !== "all") {
      result = result.filter((product) => product.brand === selectedBrand);
    }

    // Filter products with available stock
    if (inStockOnly) {
      result = result.filter((product) =>
        product.variants.some((variant) => variant.stock_quantity > 0),
      );
    }

    // Sort by price
    if (sortOrder === "price-low") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOrder === "price-high") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return result;
  }, [products, search, selectedBrand, sortOrder, inStockOnly]);

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

        <div className="shop-controls">
          {/* Search */}
          <input
            type="search"
            placeholder="Search sneakers or brands..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {/* Brand filter */}
          <select
            value={selectedBrand}
            onChange={(event) => setSelectedBrand(event.target.value)}
          >
            <option value="all">All Brands</option>
            <option value="Nike">Nike</option>
            <option value="Jordan">Jordan</option>
            <option value="Adidas">Adidas</option>
            <option value="New Balance">New Balance</option>
            <option value="Vans">Vans</option>
          </select>

          {/* Price sorting */}
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="default">Default Order</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>

          {/* Stock filter */}
          <label>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
            />
            In Stock Only
          </label>
        </div>

        {filteredProducts.length === 0 ? (
          <p>No sneakers match your search or filters.</p>
        ) : (
          <>
            <p>
              Showing {filteredProducts.length} of {products.length} sneakers
            </p>

            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Shop;
