import { Schema, model, Document } from 'mongoose'

export interface IProduct extends Document {
    name: string
    sku: string
    description?: string
    price: number
    stock: number
    category: string
    status: 'active' | 'inactive'
    createdAt: Date
    updatedAt: Date
}

const productSchema = new Schema<IProduct> ({
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    category: { type: String, required: true, },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
    timestamps: true
})

export const Product = model<IProduct>('Product', productSchema);