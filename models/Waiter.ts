import mongoose, { Schema, Document } from 'mongoose';

export interface IWaiter extends Document {
  name: string;
  email: string;
  passwordHash: string;
  employeeId?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const waiterSchema = new Schema<IWaiter>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      select: false,
    },
    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
waiterSchema.index({ email: 1 });
waiterSchema.index({ employeeId: 1 });

const Waiter = mongoose.models.Waiter || mongoose.model<IWaiter>('Waiter', waiterSchema);

export default Waiter;