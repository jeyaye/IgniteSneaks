import express from "express";

import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const { shippingInfo, items } = req.body;

  // Validate cart items
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Your cart is empty.",
    });
  }

  // Validate each cart item
  const invalidItems = items.some(
    (item) =>
      !Number.isInteger(item.variant_id) ||
      item.variant_id <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0,
  );

  if (invalidItems) {
    return res.status(400).json({
      message: "Invalid cart items.",
    });
  }

  // Prevent duplicate variants in the request
  const variantIds = items.map((item) => item.variant_id);

  if (new Set(variantIds).size !== variantIds.length) {
    return res.status(400).json({
      message: "Duplicate cart items are not allowed.",
    });
  }

  // Validate shipping information
  const requiredFields = [
    "recipientName",
    "phoneNumber",
    "streetAddress",
    "city",
    "province",
    "postalCode",
  ];

  if (
    !shippingInfo ||
    typeof shippingInfo !== "object" ||
    requiredFields.some(
      (field) =>
        typeof shippingInfo[field] !== "string" || !shippingInfo[field].trim(),
    )
  ) {
    return res.status(400).json({
      message: "Please provide all required shipping information.",
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const variantIds = items.map((item) => item.variant_id);

    // Fetch current prices and stock from the database.
    const result = await client.query(
      `SELECT
       pv.variant_id,
       pv.product_id,
       pv.stock_quantity,
       p.price
     FROM product_variants pv
     JOIN products p ON p.product_id = pv.product_id
     WHERE pv.variant_id = ANY($1::int[])
       AND p.is_active = TRUE
     FOR UPDATE OF pv`,
      [variantIds],
    );

    // Make sure every requested variant exists and is active.
    if (result.rows.length !== items.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "One or more products are unavailable.",
      });
    }

    // Check stock availability.
    for (const item of items) {
      const variant = result.rows.find(
        (row) => row.variant_id === item.variant_id,
      );

      if (variant.stock_quantity < item.quantity) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          message: `Insufficient stock for variant ${item.variant_id}.`,
        });
      }
    }

    // Calculate subtotal using database prices.
    const subtotalCents = result.rows.reduce((total, variant) => {
      const item = items.find((item) => item.variant_id === variant.variant_id);

      const priceCents = Math.round(Number(variant.price) * 100);

      return total + priceCents * item.quantity;
    }, 0);

    const shippingFeeCents = 15000;
    const totalCents = subtotalCents + shippingFeeCents;

    // Insert the order.
    const orderResult = await client.query(
      `INSERT INTO orders (
     user_id,
     status,
     subtotal,
     shipping_fee,
     total,
     recipient_name,
     phone_number,
     street_address,
     city,
     province,
     postal_code
   )
   VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8, $9, $10)
   RETURNING order_id, status, subtotal, shipping_fee, total, created_at`,
      [
        req.session.userId,
        (subtotalCents / 100).toFixed(2),
        (shippingFeeCents / 100).toFixed(2),
        (totalCents / 100).toFixed(2),
        shippingInfo.recipientName.trim(),
        shippingInfo.phoneNumber.trim(),
        shippingInfo.streetAddress.trim(),
        shippingInfo.city.trim(),
        shippingInfo.province.trim(),
        shippingInfo.postalCode.trim(),
      ],
    );

    const order = orderResult.rows[0];

    // Insert each purchased item.
    for (const item of items) {
      const variant = result.rows.find(
        (row) => row.variant_id === item.variant_id,
      );

      await client.query(
        `INSERT INTO order_items (
       order_id,
       product_id,
       variant_id,
       quantity,
       unit_price
     )
     VALUES ($1, $2, $3, $4, $5)`,
        [
          order.order_id,
          variant.product_id,
          variant.variant_id,
          item.quantity,
          variant.price,
        ],
      );

      // Deduct purchased stock.
      await client.query(
        `UPDATE product_variants
     SET stock_quantity = stock_quantity - $1
     WHERE variant_id = $2`,
        [item.quantity, item.variant_id],
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Order placed successfully.",
      order,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Order validation error:", error);

    return res.status(500).json({
      message: "Unable to validate your order.",
    });
  } finally {
    client.release();
  }
});

export default router;
