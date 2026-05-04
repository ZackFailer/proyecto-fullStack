import { Schema, model, Types } from 'mongoose';

export type TenantStatus = 'active' | 'suspended' | 'archived';

export interface TenantBrandingSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface TenantSettings {
  currency?: string;
  branding?: TenantBrandingSettings;
}

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
  status: TenantStatus;
  settings?: TenantSettings;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const tenantBrandingSettingsSchema = new Schema<TenantBrandingSettings>(
  {
    logoUrl: { type: String, trim: true },
    primaryColor: { type: String, trim: true },
    secondaryColor: { type: String, trim: true },
  },
  { _id: false }
);

const tenantSettingsSchema = new Schema<TenantSettings>(
  {
    currency: { type: String, trim: true, uppercase: true, default: 'USD' },
    branding: { type: tenantBrandingSettingsSchema, default: undefined },
  },
  { _id: false }
);

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
    status: {
      type: String,
      enum: ['active', 'suspended', 'archived'],
      required: true,
      default: 'active',
      index: true,
    },
    settings: { type: tenantSettingsSchema, default: () => ({ currency: 'USD' }) },
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
