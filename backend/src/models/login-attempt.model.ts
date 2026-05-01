import { Schema, model, Types } from 'mongoose';

export type LoginAttemptReason = 'missing_fields' | 'invalid_credentials' | 'inactive_user' | 'success';

export interface ILoginAttempt {
  id?: string;
  _id?: Types.ObjectId;
  email: string;
  userId?: Types.ObjectId | null;
  clientId?: Types.ObjectId | null;
  success: boolean;
  reason: LoginAttemptReason;
  ip?: string;
  userAgent?: string;
  createdAt?: Date;
}

const loginAttemptSchema = new Schema<ILoginAttempt>(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    clientId: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null },
    success: { type: Boolean, required: true, default: false, index: true },
    reason: {
      type: String,
      enum: ['missing_fields', 'invalid_credentials', 'inactive_user', 'success'],
      required: true,
    },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt needed
  }
);

// Index for querying by user and date
loginAttemptSchema.index(
  { userId: 1, createdAt: -1 }
);

// Index for querying by client and date
loginAttemptSchema.index(
  { clientId: 1, createdAt: -1 }
);

export const LoginAttempt = model<ILoginAttempt>('LoginAttempt', loginAttemptSchema);