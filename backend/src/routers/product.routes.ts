import { Router } from "express";
import { Types } from 'mongoose';
import * as productController from "../controllers/product.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { Product } from "../models/product.model.js";
import * as inventoryTransferService from '../services/inventory-transfer.service.js';

const router = Router();

router.get("", productController.getProducts);
router.get("/:id", productController.getProductById);
router.get("/sku/:sku", productController.getProductBySku);
router.post("", productController.createProduct);
router.put("/:id", productController.updateProduct);

router.get('/:sku/timeline', requireRole('admin', 'operator'), async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId as string
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { sku } = req.params
    const limit = parseInt(req.query.limit as string) || 50
    const timeline = await inventoryTransferService.getProductTimeline(tenantId, sku, limit)

    res.status(200).json({
      success: true,
      message: 'Timeline del producto',
      data: timeline,
    })
  } catch (error) {
    next(error)
  }
})

router.get("/:sku/related", requireRole("admin", "operator"), async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId as string;

    if (!tenantId) {
      res.status(400).json({ success: false, message: "tenantId requerido" });
      return;
    }

    const { sku } = req.params;

    const product = await Product.findOne({
      tenantId: new Types.ObjectId(tenantId),
      sku,
    }).lean();

    if (!product) {
      res.status(404).json({ success: false, message: "Producto no encontrado" });
      return;
    }

    const relatedSKUs = (product.relatedProducts || []).map((r) => r.sku);

    if (relatedSKUs.length === 0) {
      res.status(200).json({
        success: true,
        message: "Productos relacionados",
        data: [],
      });
      return;
    }

    const relatedProducts = await Product.find({
      tenantId: new Types.ObjectId(tenantId),
      sku: { $in: relatedSKUs },
    }).lean();

    const productMap = new Map(relatedProducts.map((p) => [p.sku, p]));

    const result = (product.relatedProducts || [])
      .filter((r) => productMap.has(r.sku))
      .map((r) => {
        const p = productMap.get(r.sku)!;
        return {
          sku: p.sku,
          name: p.name,
          stock: p.stock,
          type: r.type,
        };
      });

    res.status(200).json({
      success: true,
      message: "Productos relacionados",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
