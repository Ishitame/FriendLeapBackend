import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mediaUrl: { type: String, required: true },
  createdAt: { type: Date, default: null }, // Initially null for scheduled posts
  expiresAt: { type: Date }, // 24-hour expiry
  scheduledAt: { type: Date }, // Scheduled time
});

export const Story = mongoose.model("Story", storySchema);