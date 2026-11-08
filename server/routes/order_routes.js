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

router.patch("/:orderId/cancel", requireAuth, async (req, res) => {
  const orderId = Number(req.params.orderId);

  // Validate order ID.
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      message: "Invalid order ID.",
    });
  }

  const client = await db.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    // Find the order and lock it to prevent simultaneous cancellations.
    const orderResult = await client.query(
      `SELECT order_id, status
       FROM orders
       WHERE order_id = $1
         AND user_id = $2
       FOR UPDATE`,
      [orderId, req.session.userId],
    );

    // The order must belong to the logged-in customer.
    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Order not found.",
      });
    }

    const order = orderResult.rows[0];

    // Only pending and processing orders can be cancelled.
    if (!["pending", "processing"].includes(order.status)) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        message: "This order can no longer be cancelled.",
      });
    }

    // Lock all product variants belonging to this order.
    await client.query(
      `SELECT pv.variant_id
       FROM order_items oi
       JOIN product_variants pv
         ON pv.variant_id = oi.variant_id
       WHERE oi.order_id = $1
       FOR UPDATE OF pv`,
      [orderId],
    );

    // Restore the stock deducted when the order was placed.
    await client.query(
      `UPDATE product_variants pv
       SET stock_quantity = pv.stock_quantity + oi.quantity
       FROM order_items oi
       WHERE oi.order_id = $1
         AND oi.variant_id = pv.variant_id`,
      [orderId],
    );

    // Update the order status.
    const updatedOrder = await client.query(
      `UPDATE orders
       SET status = 'cancelled'
       WHERE order_id = $1
       RETURNING order_id, status`,
      [orderId],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(200).json({
      message: "Order cancelled successfully.",
      order: updatedOrder.rows[0],
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Order cancellation rollback error:", rollbackError);
      }
    }

    console.error("Cancel order error:", error);

    return res.status(500).json({
      message: "Unable to cancel your order.",
    });
  } finally {
    client.release();
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         o.order_id,
         o.status,
         o.subtotal,
         o.shipping_fee,
         o.total,
         o.recipient_name,
         o.phone_number,
         o.street_address,
         o.city,
         o.province,
         o.postal_code,
         o.created_at,

         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT(
               'order_item_id', oi.order_item_id,
               'product_id', oi.product_id,
               'variant_id', oi.variant_id,
               'name', p.name,
               'brand', p.brand,
               'size', pv.size,
               'quantity', oi.quantity,
               'unit_price', oi.unit_price
             )
             ORDER BY oi.order_item_id
           ) FILTER (WHERE oi.order_item_id IS NOT NULL),
           '[]'
         ) AS items

       FROM orders o

       LEFT JOIN order_items oi
         ON oi.order_id = o.order_id

       LEFT JOIN products p
         ON p.product_id = oi.product_id

       LEFT JOIN product_variants pv
         ON pv.variant_id = oi.variant_id

       WHERE o.user_id = $1

       GROUP BY o.order_id

       ORDER BY o.created_at DESC`,
      [req.session.userId],
    );

    return res.status(200).json({
      orders: result.rows,
    });
  } catch (error) {
    console.error("Fetch order history error:", error);

    return res.status(500).json({
      message: "Unable to retrieve your order history.",
    });
  }
});

export default router;
