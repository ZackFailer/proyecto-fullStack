import { Schema, model, Document, Types } from 'mongoose'

export type ItemProcessStatus = 'success' | 'error' | 'skipped'

export interface ItemProcessError {
  field: string
  message: string
  code: string
}

export interface IItemProcessLog extends Document {
  processId: string
  rowNumber: number
  status: ItemProcessStatus
  originalData: Record<string, unknown>
  errors: ItemProcessError[]
  processedAt: Date
  productId?: Types.ObjectId
  retryAttempt?: number
  createdAt: Date
  updatedAt: Date
}

const itemProcessErrorSchema = new Schema<ItemProcessError>(
  {
    field: { type: String, required: true },
    message: { type: String, required: true },
    code: { type: String, required: true },
  },
  { _id: false }
)

const itemProcessLogSchema = new Schema<IItemProcessLog>(
  {
    processId: { type: String, required: true, index: true },
    rowNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ['success', 'error', 'skipped'],
      required: true,
    },
    originalData: { type: Schema.Types.Mixed, required: true },
    errors: { type: [itemProcessErrorSchema], default: [] },
    processedAt: { type: Date, default: Date.now },
    productId: { type: Schema.Types.ObjectId, default: undefined },
    retryAttempt: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
)

itemProcessLogSchema.index({ processId: 1, rowNumber: 1 })
itemProcessLogSchema.index({ processId: 1, status: 1 })

export const ItemProcessLog = model<IItemProcessLog>('ItemProcessLog', itemProcessLogSchema)