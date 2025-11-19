import mongoose, { Schema, Document } from 'mongoose';

export interface IFood extends Document {
  name: string;
  category: 'pizza' | 'burgers' | 'pasta' | 'salads' | 'drinks' | 'desserts';
  description?: string;
  price: number;
  image?: string;
  available: boolean;
  preparationTime: number;
  spicy: boolean;
  vegetarian: boolean;
  rating: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

const foodSchema = new Schema<IFood>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a food name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['pizza', 'burgers', 'pasta', 'salads', 'drinks', 'desserts'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      default: null,
    },
    available: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      default: 30,
    },
    spicy: {
      type: Boolean,
      default: false,
    },
    vegetarian: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Food = mongoose.models.Food || mongoose.model<IFood>('Food', foodSchema);

export default Food;
