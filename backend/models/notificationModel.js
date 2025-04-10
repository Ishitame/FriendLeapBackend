
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  toUserId: { type: String, required: true },
  fromUserId: { type: String, required: true },
  fromUserName: String,
  type: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

export const Notification = mongoose.model("Notification", notificationSchema);