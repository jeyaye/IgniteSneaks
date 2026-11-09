import express from "express";

import db from "../db.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

// Retrieve all customer orders.
router.get("/orders", requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         o.order_id,
         o.user_id,
         u.username,
         u.email,

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

       JOIN users u
         ON u.user_id = o.user_id

       LEFT JOIN order_items oi
         ON oi.order_id = o.order_id

       LEFT JOIN products p
         ON p.product_id = oi.product_id

       LEFT JOIN product_variants pv
         ON pv.variant_id = oi.variant_id

       GROUP BY o.order_id, u.user_id

       ORDER BY o.created_at DESC`,
    );

    return res.status(200).json({
      orders: result.rows,
    });
  } catch (error) {
    console.error("Admin fetch orders error:", error);

    return res.status(500).json({
      message: "Unable to retrieve all orders.",
    });
  }
});

// Retrieve admin dashboard statistics.
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         (SELECT COUNT(*)::int
          FROM orders) AS total_orders,

         (SELECT COALESCE(SUM(total), 0)
          FROM orders
          WHERE status = 'delivered') AS total_revenue,

         (SELECT COUNT(*)::int
          FROM orders
          WHERE status = 'pending') AS pending_orders,

         (SELECT COUNT(*)::int
          FROM users
          WHERE role = 'customer') AS total_customers`,
    );

    return res.status(200).json({
      stats: result.rows[0],
    });
  } catch (error) {
    console.error("Admin fetch statistics error:", error);

    return res.status(500).json({
      message: "Unable to retrieve dashboard statistics.",
    });
  }
});

// Update an order's status.
router.patch("/orders/:orderId/status", requireAdmin, async (req, res) => {
  const orderId = Number(req.params.orderId);
  const { status } = req.body;

  // Validate order ID.
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      message: "Invalid order ID.",
    });
  }

  // Define allowed status transitions.
  const allowedTransitions = {
    pending: ["processing"],
    processing: ["shipped"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };

  if (
    typeof status !== "string" ||
    !["processing", "shipped", "delivered"].includes(status)
  ) {
    return res.status(400).json({
      message: "Invalid order status.",
    });
  }

  try {
    // Retrieve the current order status.
    const orderResult = await db.query(
      `SELECT order_id, status
       FROM orders
       WHERE order_id = $1`,
      [orderId],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    const currentStatus = orderResult.rows[0].status;

    // Verify that the requested transition is allowed.
    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return res.status(409).json({
        message: `Cannot change order status from ${currentStatus} to ${status}.`,
      });
    }

    // Update only if the status has not changed since it was retrieved.
    const updatedOrder = await db.query(
      `UPDATE orders
       SET status = $1
       WHERE order_id = $2
         AND status = $3
       RETURNING order_id, status`,
      [status, orderId, currentStatus],
    );

    if (updatedOrder.rows.length === 0) {
      return res.status(409).json({
        message: "Order status has changed. Please refresh and try again.",
      });
    }

    return res.status(200).json({
      message: "Order status updated successfully.",
      order: updatedOrder.rows[0],
    });
  } catch (error) {
    console.error("Admin update order status error:", error);

    return res.status(500).json({
      message: "Unable to update order status.",
    });
  }
});

export default router;
