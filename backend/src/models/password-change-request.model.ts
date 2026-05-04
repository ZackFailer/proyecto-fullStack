import { Schema, model, Types } from 'mongoose';

export type PasswordChangeRequestStatus = 'pending' | 'completed' | 'rejected';

export interface IPasswordChangeRequest {
  id?: string;
  _id?: Types.ObjectId;
  requesterUserId: Types.ObjectId;
  targetUserId: Types.ObjectId;
  tenantId?: Types.ObjectId | null;
  reason?: string;
  status: PasswordChangeRequestStatus;
  resolvedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const passwordChangeRequestSchema = new Schema<IPasswordChangeRequest>(
  {
    requesterUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      required: true,
      default: 'pending',
      index: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Index for querying pending requests by tenant
passwordChangeRequestSchema.index(
  { tenantId: 1, status: 1, createdAt: -1 }
);

// Index for superadmin queries (all pending)
passwordChangeRequestSchema.index(
  { status: 1, createdAt: -1 }
);

export const PasswordChangeRequest = model<IPasswordChangeRequest>(
  'PasswordChangeRequest',
  passwordChangeRequestSchema
);