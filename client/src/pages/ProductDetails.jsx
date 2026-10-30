import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.product);
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setError("Unable to load this sneaker.");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return <p>Loading product...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!product) {
    return <p>Product not found.</p>;
  }

  return (
    <main>
      <section className="product-details">
        {product.image_url && (
          <img src={product.image_url} alt={product.name} />
        )}

        <div>
          <p>{product.brand}</p>
          <h1>{product.name}</h1>

          <p>
            ₱
            {Number(product.price).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>

          <p>{product.description}</p>

          <h3>Available Sizes (US Men's)</h3>

          <div className="size-options">
            {product.variants.map((variant) => (
              <button
                key={variant.variant_id}
                type="button"
                disabled={variant.stock_quantity === 0}
                className={
                  selectedVariant?.variant_id === variant.variant_id
                    ? "selected"
                    : ""
                }
                onClick={() => setSelectedVariant(variant)}
              >
                {Number(variant.size).toFixed(1)}
              </button>
            ))}
          </div>

          {selectedVariant && (
            <p>Selected Size: {Number(selectedVariant.size).toFixed(1)}</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default ProductDetails;
