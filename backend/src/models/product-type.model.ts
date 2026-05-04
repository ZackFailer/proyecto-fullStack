import { Schema, model, Document, Types } from 'mongoose'

export type ProductAttributeType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'

export interface IProductAttribute {
  key: string
  label: string
  type: ProductAttributeType
  required: boolean
  options?: string[]
  defaultValue?: string | number | boolean | null
  order: number
  version: number
  isDeprecated: boolean
  isActive: boolean
}

export interface IProductType extends Document {
  tenantId: Types.ObjectId
  id: string
  name: string
  conversionAttribute?: string
  version: number
  isActive: boolean
  status: 'draft' | 'published'
  lastPublishedAt?: Date
  attributes: IProductAttribute[]
  createdAt: Date
  updatedAt: Date
}

const productAttributeSchema = new Schema<IProductAttribute>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'select', 'multiselect', 'boolean'],
      required: true,
    },
    required: { type: Boolean, default: false },
    options: { type: [String], default: undefined },
    defaultValue: { type: Schema.Types.Mixed, default: undefined },
    order: { type: Number, required: true, min: 1 },
    version: { type: Number, required: true, default: 1 },
    isDeprecated: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
)

const productTypeSchema = new Schema<IProductType>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    conversionAttribute: { type: String, trim: true, default: undefined },
    version: { type: Number, required: true, default: 1, min: 1 },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    lastPublishedAt: { type: Date, default: undefined },
    attributes: {
      type: [productAttributeSchema],
      validate: {
        validator: function (attrs: IProductAttribute[]) {
          return attrs.length <= 10
        },
        message: 'Maximum 10 attributes allowed per product type',
      },
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

productTypeSchema.index({ tenantId: 1, id: 1 }, { unique: true, partialFilterExpression: { isActive: true } })
productTypeSchema.index({ tenantId: 1, status: 1 })

export const ProductType = model<IProductType>('ProductType', productTypeSchema)
