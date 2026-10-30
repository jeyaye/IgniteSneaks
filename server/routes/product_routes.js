import express from "express";
import db from "../db.js";

const router = express.Router();

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        p.product_id,
        p.name,
        p.brand,
        p.description,
        p.price,
        p.image_url,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'variant_id', pv.variant_id,
              'size', pv.size,
              'size_system', pv.size_system,
              'stock_quantity', pv.stock_quantity
            )
            ORDER BY pv.size
          ) FILTER (WHERE pv.variant_id IS NOT NULL),
          '[]'::json
        ) AS variants
      FROM products p
      LEFT JOIN product_variants pv
        ON p.product_id = pv.product_id
      WHERE p.is_active = TRUE
      GROUP BY p.product_id
      ORDER BY p.product_id ASC`,
    );

    res.status(200).json({
      products: result.rows,
    });
  } catch (error) {
    console.error("Failed to retrieve products:", error);

    res.status(500).json({
      message: "Unable to retrieve products.",
    });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      message: "Invalid product ID.",
    });
  }

  try {
    const result = await db.query(
      `SELECT
        p.product_id,
        p.name,
        p.brand,
        p.description,
        p.price,
        p.image_url,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'variant_id', pv.variant_id,
              'size', pv.size,
              'size_system', pv.size_system,
              'stock_quantity', pv.stock_quantity
            )
            ORDER BY pv.size
          ) FILTER (WHERE pv.variant_id IS NOT NULL),
          '[]'::json
        ) AS variants
      FROM products p
      LEFT JOIN product_variants pv
        ON p.product_id = pv.product_id
      WHERE p.product_id = $1
        AND p.is_active = TRUE
      GROUP BY p.product_id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.status(200).json({
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to retrieve product:", error);

    res.status(500).json({
      message: "Unable to retrieve product.",
    });
  }
});

export default router;
