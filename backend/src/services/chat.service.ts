import mongoose from "mongoose";
import ChatMessageModel from "../models/chat-message.model";
import MemberModel from "../models/member.model";
import { NotFoundException, UnauthorizedException } from "../utils/appError";
import { ErrorCodeEnum } from "../enums/error-code.enum";

export interface CreateChatMessageData {
  workspaceId: string;
  senderId: string;
  message: string;
}

export const createChatMessageService = async (
  data: CreateChatMessageData
) => {
  const { workspaceId, senderId, message } = data;

  // Verify user is a member of the workspace
  const member = await MemberModel.findOne({
    userId: senderId,
    workspaceId,
  });

  if (!member) {
    throw new UnauthorizedException(
      "You are not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  const chatMessage = new ChatMessageModel({
    workspaceId,
    senderId,
    message: message.trim(),
  });

  await chatMessage.save();

  // Populate sender information
  const populatedMessage = await ChatMessageModel.findById(chatMessage._id)
    .populate("senderId", "name email profilePicture")
    .lean();

  return populatedMessage;
};

export const getChatMessagesService = async (
  workspaceId: string,
  userId: string,
  pageNumber: number = 1,
  pageSize: number = 50
) => {
  // Verify user is a member of the workspace
  const member = await MemberModel.findOne({
    userId,
    workspaceId,
  });

  if (!member) {
    throw new UnauthorizedException(
      "You are not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  const skip = (pageNumber - 1) * pageSize;

  const messages = await ChatMessageModel.find({ workspaceId })
    .populate("senderId", "name email profilePicture")
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(skip)
    .lean();

  const totalMessages = await ChatMessageModel.countDocuments({ workspaceId });

  return {
    messages: messages.reverse(), // Reverse to show oldest first
    pagination: {
      pageNumber,
      pageSize,
      totalMessages,
      totalPages: Math.ceil(totalMessages / pageSize),
    },
  };
};

