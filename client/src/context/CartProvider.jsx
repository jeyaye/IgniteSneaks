import { useEffect, useState } from "react";
import { CartContext } from "./CartContext.js";

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    console.log("CartProvider MOUNTED");

    return () => {
      console.log("CartProvider UNMOUNTED");
    };
  }, []);

  useEffect(() => {
    console.log("Cart state changed:", cartItems);
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

  return (
    <CartContext.Provider value={{ cartItems, addToCart }}>
      {children}
    </CartContext.Provider>
  );
}