import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  qrCodeUrl: { type: String }, // URL to generated QR image
  qrCodeData: { type: String }, // Base64 encoded QR code image data
  status: { type: String, enum: ["available", "occupied"], default: "available" },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
});

const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);

export default Room;