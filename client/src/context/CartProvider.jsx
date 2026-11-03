import { useState, useEffect } from "react";
import { CartContext } from "./CartContext.js";

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");

    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  function addToCart(product, variant) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.variant_id === variant.variant_id,
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.variant_id === variant.variant_id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          product_id: product.product_id,
          variant_id: variant.variant_id,
          name: product.name,
          brand: product.brand,
          price: Number(product.price),
          image_url: product.image_url,
          size: variant.size,
          stock_quantity: variant.stock_quantity,
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(variantId) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.variant_id !== variantId),
    );
  }

  function updateQuantity(variantId, change) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.variant_id !== variantId) {
            return item;
          }

          const newQuantity = item.quantity + change;

          if (newQuantity > item.stock_quantity) {
            return item;
          }

          return {
            ...item,
            quantity: newQuantity,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
}
