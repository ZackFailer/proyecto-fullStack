import { Schema, model, Types } from 'mongoose';

export type StoreStatus = 'active' | 'suspended' | 'archived';

export interface StoreSettings {
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface IStore {
  id?: string;
  _id?: Types.ObjectId;
  tenantId: Types.ObjectId;
  slug: string;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: StoreStatus;
  settings?: StoreSettings;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const storeSettingsSchema = new Schema<StoreSettings>(
  {
    notes: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const storeSchema = new Schema<IStore>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    legalName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'suspended', 'archived'],
      required: true,
      default: 'active',
      index: true,
    },
    settings: { type: storeSettingsSchema, default: () => ({}) },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

storeSchema.index({ tenantId: 1, slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
storeSchema.index({ tenantId: 1, status: 1, deletedAt: 1 });

export const Store = model<IStore>('Store', storeSchema);
