function ProductCard({ product }) {
  return (
    <article className="product-card">
      {product.image_url && (
        <div className="product-image">
          <img src={product.image_url} alt={product.name} />
        </div>
      )}

      <div className="product-info">
        <p className="product-brand">{product.brand}</p>

        <h3>{product.name}</h3>

        <p className="product-price">
          ₱
          {Number(product.price).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>

        <div className="product-sizes">
          <h4>Available Sizes (US Men's)</h4>

          <ul>
            {product.variants.map((variant) => (
              <li key={variant.variant_id}>
                Size {Number(variant.size).toFixed(1)} —
                {variant.stock_quantity > 0
                  ? ` In Stock (${variant.stock_quantity})`
                  : " Out of Stock"}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
