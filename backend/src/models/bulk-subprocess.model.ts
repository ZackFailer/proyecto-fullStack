import { Schema, model, Document } from 'mongoose'

export type SubProcessStep = 'upload' | 'parsing' | 'validation' | 'import' | 'finalization'
export type SubProcessStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface IBulkSubProcess extends Document {
  processId: string
  step: SubProcessStep
  status: SubProcessStatus
  startedAt: Date
  completedAt?: Date
  durationMs?: number
  details?: string
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

const bulkSubProcessSchema = new Schema<IBulkSubProcess>(
  {
    processId: { type: String, required: true, index: true },
    step: {
      type: String,
      enum: ['upload', 'parsing', 'validation', 'import', 'finalization'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: undefined },
    durationMs: { type: Number, default: undefined },
    details: { type: String, default: undefined },
    errorMessage: { type: String, default: undefined },
  },
  {
    timestamps: true,
  }
)

bulkSubProcessSchema.index({ processId: 1, step: 1 }, { unique: true })

export const BulkSubProcess = model<IBulkSubProcess>('BulkSubProcess', bulkSubProcessSchema)