import { Server as SocketIOServer } from "socket.io";
import { ExtendedSocket } from "../@types/index.d";
import {
  createChatMessageService,
  CreateChatMessageData,
} from "../services/chat.service";
import MemberModel from "../models/member.model";
import { UnauthorizedException } from "../utils/appError";
import { ErrorCodeEnum } from "../enums/error-code.enum";

export const setupChatSocket = (io: SocketIOServer) => {
  io.on("connection", (socket: ExtendedSocket) => {
    // Join workspace room when user connects
    socket.on("join_workspace", async (workspaceId: string) => {
      if (!socket.userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      // Verify user is a member of the workspace
      const member = await MemberModel.findOne({
        userId: socket.userId,
        workspaceId,
      });

      if (!member) {
        socket.emit("error", {
          message: "You are not a member of this workspace",
          errorCode: ErrorCodeEnum.ACCESS_UNAUTHORIZED,
        });
        return;
      }

      socket.join(`workspace:${workspaceId}`);

      // Notify others in the workspace that user joined
      socket.to(`workspace:${workspaceId}`).emit("user_joined", {
        userId: socket.userId,
        userName: socket.user?.name,
      });
    });

    // Leave workspace room
    socket.on("leave_workspace", (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    // Handle new chat message
    socket.on("send_message", async (data: { workspaceId: string; message: string }) => {
      if (!socket.userId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      try {
        const messageData: CreateChatMessageData = {
          workspaceId: data.workspaceId,
          senderId: socket.userId,
          message: data.message,
        };

        // Create message in database
        const chatMessage = await createChatMessageService(messageData);

        // Broadcast message to all users in the workspace
        io.to(`workspace:${data.workspaceId}`).emit("new_message", {
          chatMessage,
        });
      } catch (error: any) {
        socket.emit("error", {
          message: error.message || "Failed to send message",
          errorCode: error.errorCode,
        });
      }
    });

    // Handle typing indicator
    socket.on("typing_start", (data: { workspaceId: string }) => {
      if (!socket.userId) return;
      socket.to(`workspace:${data.workspaceId}`).emit("user_typing", {
        userId: socket.userId,
        userName: socket.user?.name,
      });
    });

    socket.on("typing_stop", (data: { workspaceId: string }) => {
      if (!socket.userId) return;
      socket.to(`workspace:${data.workspaceId}`).emit("user_stopped_typing", {
        userId: socket.userId,
        userName: socket.user?.name,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      // User disconnected
    });
  });
};

