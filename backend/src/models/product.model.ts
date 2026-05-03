import { Schema, model, Document, Types } from 'mongoose'

export type ProductRelationType = 'derived-from' | 'component-of' | 'variant-of' | 'related'

export interface IRelatedProduct {
  sku: string
  type: ProductRelationType
}

export interface IProduct extends Document {
  tenantId: Types.ObjectId
  productTypeId: string
  productTypeVersion: number
  sku: string
  ean?: string
  name: string
  description?: string
  price: number
  stock: number
  category: string
  status: 'active' | 'inactive'
  customAttributes: Record<string, unknown>
  relatedProducts?: IRelatedProduct[]
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<IProduct>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    productTypeId: { type: String, required: true },
    productTypeVersion: { type: Number, required: true, min: 1 },
    sku: { type: String, required: true, trim: true },
    ean: { type: String, trim: true, sparse: true },
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    description: { type: String },
    price: { type: Number, required: true, default: 0, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    category: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    customAttributes: { type: Schema.Types.Mixed, default: {} },
    relatedProducts: {
      type: [{
        sku: { type: String, required: true, trim: true },
        type: {
          type: String,
          enum: ['derived-from', 'component-of', 'variant-of', 'related'],
          default: 'related'
        }
      }],
      default: undefined
    },
  },
  {
    timestamps: true,
  }
)

productSchema.index({ tenantId: 1, sku: 1 }, { unique: true })
productSchema.index({ tenantId: 1, ean: 1 }, { sparse: true })
productSchema.index({ tenantId: 1, productTypeId: 1 })
productSchema.index({ tenantId: 1, category: 1 })
productSchema.index({ tenantId: 1, status: 1 })
productSchema.index({ tenantId: 1, 'relatedProducts.sku': 1 })

export const Product = model<IProduct>('Product', productSchema)