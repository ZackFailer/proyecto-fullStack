import { Product, IProduct } from '../models/product.model.js';

export const createProduct = async (productData: IProduct): Promise<IProduct> => {
    const product = new Product(productData);
    return await product.save();
}

export const getProducts = async (): Promise<IProduct[]> => {
    return await Product.find().sort({ createdAt: -1 });
}

export const getProductById = async (id: string): Promise<IProduct | null> => {
    return await Product.findById(id);
}

export const updateProduct = async (id: string, productData: Partial<IProduct>): Promise<IProduct | null> => {
    return await Product.findByIdAndUpdate(id, productData, { new: true });
}