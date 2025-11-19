import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  expiryDate: Date;
  description?: string;
  isActive: boolean;
  usageLimit?: number;
  minimumOrderAmount?: number;
  usedCount: number;
  usageHistory: Array<{
    userId: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    usedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema: Schema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageLimit: {
    type: Number,
    min: 1,
  },
  minimumOrderAmount: {
    type: Number,
    min: 0,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  usageHistory: {
    type: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        orderId: {
          type: Schema.Types.ObjectId,
          ref: 'Order',
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },
}, {
  timestamps: true,
});

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
