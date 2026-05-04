import { Schema, model, Document, Types } from 'mongoose'

export type TransferStatus = 'pending' | 'completed' | 'failed'

export interface IInventoryTransfer extends Document {
  tenantId: Types.ObjectId
  fromSKU: string
  toSKU: string
  quantityFrom: number
  quantityTo: number
  conversionApplied: boolean
  conversionFactor?: {
    fromAttribute: string
    toAttribute: string
    fromValue: number
    toValue: number
  }
  userId: Types.ObjectId
  reason?: string
  status: TransferStatus
  createdAt: Date
  completedAt?: Date
  error?: string
}

const inventoryTransferSchema = new Schema<IInventoryTransfer>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    fromSKU: { type: String, required: true, trim: true },
    toSKU: { type: String, required: true, trim: true },
    quantityFrom: { type: Number, required: true, min: 1 },
    quantityTo: { type: Number, required: true, min: 1 },
    conversionApplied: { type: Boolean, required: true, default: false },
    conversionFactor: {
      type: {
        fromAttribute: { type: String, required: true, trim: true },
        toAttribute: { type: String, required: true, trim: true },
        fromValue: { type: Number, required: true },
        toValue: { type: Number, required: true },
      },
      required: false,
      _id: false,
      default: undefined,
    },
    userId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    completedAt: { type: Date, default: undefined },
    error: { type: String },
  },
  {
    timestamps: true,
  }
)

inventoryTransferSchema.index({ tenantId: 1, createdAt: -1 })
inventoryTransferSchema.index({ fromSKU: 1 })
inventoryTransferSchema.index({ toSKU: 1 })
inventoryTransferSchema.index({ status: 1, createdAt: 1 })

export const InventoryTransfer = model<IInventoryTransfer>('InventoryTransfer', inventoryTransferSchema)
