import { Request, Response } from 'express'
import * as ProductService from '../services/product.service.js';

const productController = {
    getProducts: async (req: Request, res: Response) => {
        try {
            const products = await ProductService.getProducts();
            res.status(200).json(products);
        } catch (err)  {
            res.status(500).json({ message: "Error al obtener los productos", err });
        }
    },
    getProductById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            if (typeof id !== 'string') {
                return res.status(400).json({ message: 'El ID proporcionado no es válido' });
            }
            
            const product = await ProductService.getProductById(id);

            if (!product) {
                return res.status(404).json({ message: 'Producto no encontrado' });
            }
            res.status(200).json({ product });
        } catch (err) {
            if ((err as any).kind === 'ObjectId') {
                return res.status(400).json({ message: 'Formato de ID inválido' });
            }
            res.status(500).json({ message: `Error al obtener el producto`, err });
        }
    },
    createProduct: async (req: Request, res: Response) => {
        try {
            const product = await ProductService.createProduct(req.body);
            res.status(201).json(product);
        } catch (err) {
            if ((err as any).code === 11000) {
                return res.status(400).json({ message: 'El SKU ya existe' });
            }
            res.status(500).json({message: 'Error al crear el producto', err})
        }
    },
    updateProduct: async (req: Request, res: Response) => {
        try {
            const product = await ProductService.updateProduct(req.body.id, req.body.product);
            if (!product) {
                res.status(404).json({ message: 'Producto no encontrado' });
            }
            res.status(200).json(product);
        } catch (err) {
            res.status(500).json({message: 'Error al acualizar el producto', err})
        }
    }
};

export default productController;