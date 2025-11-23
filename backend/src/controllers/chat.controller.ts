import { Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  createChatMessageService,
  getChatMessagesService,
} from "../services/chat.service";
import { z } from "zod";

const workspaceIdSchema = z.string().min(1, "Workspace ID is required");
const messageSchema = z.string().min(1, "Message cannot be empty").max(5000, "Message is too long");

export const getChatMessagesController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id?.toString();

    if (!userId) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const result = await getChatMessagesService(
      workspaceId,
      userId,
      pageNumber,
      pageSize
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Chat messages retrieved successfully",
      ...result,
    });
  }
);

export const createChatMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id?.toString();
    const message = messageSchema.parse(req.body.message);

    if (!userId) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const chatMessage = await createChatMessageService({
      workspaceId,
      senderId: userId,
      message,
    });

    // Emit socket event to broadcast message to all workspace members
    const io: SocketIOServer = (global as any).io;
    if (io) {
      io.to(`workspace:${workspaceId}`).emit("new_message", {
        chatMessage,
      });
    }

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Chat message created successfully",
      chatMessage,
    });
  }
);

