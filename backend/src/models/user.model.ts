import { Schema, model, Types } from 'mongoose';

export type UserRole = 'super-admin' | 'admin' | 'operator' | 'viewer';
export type UserStatus = 'active' | 'invited' | 'suspended' | 'deleted';

export interface IUser {
  id?: string;
  _id?: Types.ObjectId;
  clientId?: Types.ObjectId | null;
  email: string;
  passwordHash?: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  locale?: string;
  invitedAt?: Date;
  lastLoginAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true, default: null },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: false },
    fullName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['super-admin', 'admin', 'operator', 'viewer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'suspended', 'deleted'],
      default: 'active',
      required: true,
      index: true,
    },
    phone: { type: String },
    locale: { type: String },
    invitedAt: { type: Date },
    lastLoginAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index(
  { clientId: 1, email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const out = ret as any;
    out.id = ret._id;
    delete out._id;
    delete out.passwordHash;
    return out;
  },
});

export const User = model<IUser>('User', userSchema);
