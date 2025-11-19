import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface IPayment {
  _id?: mongoose.Types.ObjectId;
  method: 'UPI' | 'Cash';
  status: 'Pending' | 'Success' | 'Failed' | 'UPI-completed';
  amount: number;
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrder extends Document {
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  items: IOrderItem[];
  subtotal: number;
  gst: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  couponId?: string;
  couponDiscountType?: 'percentage' | 'fixed';
  couponDiscountValue?: number;
  status: 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  payment?: IPayment;
  estimatedTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  foodId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image_url: {
    type: String,
  },
});

const paymentSchema = new Schema<IPayment>(
  {
    method: {
      type: String,
      enum: ['UPI', 'Cash'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Success', 'Failed', 'UPI-completed'],
      default: 'Pending',
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
    },
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'],
      required: true,
    },
    tableNumber: {
      type: String,
    },
    deliveryAddress: {
      type: String,
    },
    deliveryNotes: {
      type: String,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    gst: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    couponCode: {
      type: String,
    },
    couponId: {
      type: String,
    },
    couponDiscountType: {
      type: String,
      enum: ['percentage', 'fixed'],
    },
    couponDiscountValue: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'confirmed',
    },
    payment: {
      type: paymentSchema,
      required: false,
    },
    estimatedTime: {
      type: Number,
      default: 30,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

export default Order;