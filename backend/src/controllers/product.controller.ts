import { Request, Response, NextFunction } from 'express'
import * as ProductService from '../services/product.service.js';

const productController = {
    getProducts: async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const products = await ProductService.getProducts();
            res.status(200).json({ success: true, message: 'Productos obtenidos', data: products });
        } catch (err)  {
            next(err);
        }
    },
    getProductById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            if (typeof id !== 'string') {
                return res.status(400).json({ success: false, message: 'El ID proporcionado no es válido' });
            }
            
            const product = await ProductService.getProductById(id);

            if (!product) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }
            res.status(200).json({ success: true, message: 'Producto obtenido', data: product });
        } catch (err) {
            next(err);
        }
    },
    createProduct: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const product = await ProductService.createProduct(req.body);
            res.status(201).json({ success: true, message: 'Producto creado', data: product });
        } catch (err) {
            if ((err as any).code === 11000) {
                return res.status(400).json({ success: false, message: 'El SKU ya existe' });
            }
            next(err);
        }
    },
    updateProduct: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const product = await ProductService.updateProduct(req.body.id, req.body.product);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }
            res.status(200).json({ success: true, message: 'Producto actualizado', data: product });
        } catch (err) {
            next(err);
        }
    }
};

export default productController;