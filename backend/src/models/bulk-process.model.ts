import { Schema, model, Document, Types } from 'mongoose'

export type BulkProcessStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial'

export interface IBulkProcess extends Document {
  tenantId: Types.ObjectId
  initiatedBy: Types.ObjectId
  fileName: string
  fileSize: number
  fileContent?: string
  status: BulkProcessStatus
  totalItems: number
  processedItems: number
  successItems: number
  errorItems: number
  startedAt: Date
  completedAt?: Date
  errorSummary?: string
  createdAt: Date
  updatedAt: Date
}

const bulkProcessSchema = new Schema<IBulkProcess>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
    initiatedBy: { type: Schema.Types.ObjectId, required: true },
    fileName: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true },
    fileContent: { type: String, required: false, select: false },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'partial'],
      default: 'pending',
    },
    totalItems: { type: Number, default: 0 },
    processedItems: { type: Number, default: 0 },
    successItems: { type: Number, default: 0 },
    errorItems: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: undefined },
    errorSummary: { type: String, default: undefined },
  },
  {
    timestamps: true,
  }
)

bulkProcessSchema.index({ tenantId: 1, createdAt: -1 })
bulkProcessSchema.index({ tenantId: 1, status: 1 })
bulkProcessSchema.index({ tenantId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'processing' } })

export const BulkProcess = model<IBulkProcess>('BulkProcess', bulkProcessSchema)