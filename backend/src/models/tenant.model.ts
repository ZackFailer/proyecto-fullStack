import { Schema, model, Types } from 'mongoose';

export type TenantStatus = 'active' | 'suspended' | 'archived';

export interface ITenant {
  id?: string;
  _id?: Types.ObjectId;
  slug: string;
  name: string;
  legalName?: string;
  documentType: string;
  documentNumber: string;
  email?: string;
  phone?: string;
  address?: string;
  timezone: string;
  currency: string;
  status: TenantStatus;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    slug: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    legalName: { type: String, trim: true },
    documentType: { type: String, required: true, trim: true },
    documentNumber: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    timezone: { type: String, trim: true, default: 'UTC' },
    currency: { type: String, trim: true, uppercase: true, default: 'USD' },
    status: {
      type: String,
      enum: ['active', 'suspended', 'archived'],
      required: true,
      default: 'active',
      index: true,
    },
    branding: {
      logoUrl: { type: String, trim: true },
      primaryColor: { type: String, trim: true },
      secondaryColor: { type: String, trim: true },
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

tenantSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
tenantSchema.index(
  { documentType: 1, documentNumber: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

export const Tenant = model<ITenant>('Tenant', tenantSchema);
