import mongoose, { Document, Schema } from "mongoose";

export interface ChatMessageDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<ChatMessageDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by workspace and date
chatMessageSchema.index({ workspaceId: 1, createdAt: -1 });

const ChatMessageModel = mongoose.model<ChatMessageDocument>(
  "ChatMessage",
  chatMessageSchema
);

export default ChatMessageModel;

