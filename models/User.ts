import mongoose, { Schema, Document } from 'mongoose';

export interface IUserCartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  quantity: number;
}

export interface IUserCart {
  items: IUserCartItem[];
  updatedAt?: Date;
}

export interface IUser extends Document {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  passwordHash?: string;
  googleId?: string;
  provider: string;
  cart: IUserCart;
  orderHistory: string[];
  roomNumber?: string; // Assigned room number from QR scan
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<IUserCartItem>(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    price: {
      type: Number,
      required: true,
    },
    image_url: String,
    category_id: {
      type: String,
      required: true,
    },
    is_available: {
      type: Boolean,
      default: true,
    },
    created_at: String,
    updated_at: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
  }
);

const cartSchema = new Schema<IUserCart>(
  {
    items: {
      type: [cartItemSchema],
      default: [],
    },
    updatedAt: Date,
  },
  {
    _id: false,
  }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: function(this: IUser) { return this.provider === 'google'; },
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    address: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: function(this: IUser) { return this.provider === 'local'; },
      select: false,
    },
    googleId: {
      type: String,
      required: function(this: IUser) { return this.provider === 'google'; },
      sparse: true,
      unique: true,
    },
    provider: {
      type: String,
      default: 'local',
      required: true,
    },
    cart: {
      type: cartSchema,
      default: () => ({ items: [] }),
    },
    orderHistory: [
      {
        type: String,
        ref: 'Order',
      },
    ],
    roomNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;